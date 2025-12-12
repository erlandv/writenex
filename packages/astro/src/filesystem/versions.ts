/**
 * @fileoverview Version history management for content files
 *
 * This module provides functions for creating, reading, and managing
 * version history (shadow copies) of content files. Versions are stored
 * as markdown files in a hidden directory structure with a JSON manifest
 * tracking metadata.
 *
 * ## Storage Structure:
 * ```
 * .writenex/versions/
 * ├── .gitignore              # Contains "*" to exclude from Git
 * └── {collection}/
 *     └── {contentId}/
 *         ├── manifest.json   # Version metadata
 *         └── {timestamp}.md  # Version files
 * ```
 *
 * @module @writenex/astro/filesystem/versions
 * @see {@link VersionEntry} - Version metadata type
 * @see {@link VersionManifest} - Manifest structure type
 */

import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  stat,
  unlink,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";
import type {
  VersionEntry,
  VersionManifest,
  VersionHistoryConfig,
  Version,
  VersionResult,
  SaveVersionOptions,
  RestoreVersionOptions,
  RestoreResult,
} from "../types";

// =============================================================================
// Constants
// =============================================================================

/** Maximum characters for content preview */
const PREVIEW_MAX_LENGTH = 100;

/** Default gitignore content for version storage */
const GITIGNORE_CONTENT = "*\n";

/** Frontmatter key for storing version label (prefixed to avoid conflicts) */
const LABEL_FRONTMATTER_KEY = "_writenex_label";

/** Lock timeout in milliseconds */
const LOCK_TIMEOUT_MS = 30000;

/** Lock retry interval in milliseconds */
const LOCK_RETRY_INTERVAL_MS = 50;

// =============================================================================
// Locking Mechanism
// =============================================================================

/**
 * In-memory lock manager for preventing concurrent manifest operations.
 *
 * Uses a Map to track locks per storage path, with each lock containing
 * a promise that resolves when the lock is released.
 */
interface LockEntry {
  /** Promise that resolves when lock is released */
  promise: Promise<void>;
  /** Function to release the lock */
  release: () => void;
  /** Timestamp when lock was acquired */
  acquiredAt: number;
}

/** Map of storage paths to their lock entries */
const locks = new Map<string, LockEntry>();

/**
 * Acquire a lock for a specific storage path.
 *
 * If the path is already locked, waits until the lock is released
 * or timeout is reached.
 *
 * @param storagePath - Path to lock
 * @param timeoutMs - Maximum time to wait for lock (default: 30s)
 * @returns Release function to call when done
 * @throws Error if lock cannot be acquired within timeout
 */
async function acquireLock(
  storagePath: string,
  timeoutMs: number = LOCK_TIMEOUT_MS
): Promise<() => void> {
  const startTime = Date.now();

  // Wait for existing lock to be released
  while (locks.has(storagePath)) {
    const existingLock = locks.get(storagePath)!;

    // Check for stale lock (acquired more than timeout ago)
    if (Date.now() - existingLock.acquiredAt > timeoutMs) {
      console.warn(
        `[writenex] Releasing stale lock for ${storagePath} (held for ${Date.now() - existingLock.acquiredAt}ms)`
      );
      existingLock.release();
      locks.delete(storagePath);
      break;
    }

    // Check if we've exceeded our timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        `[writenex] Timeout waiting for lock on ${storagePath} after ${timeoutMs}ms`
      );
    }

    // Wait for lock to be released or retry interval
    await Promise.race([
      existingLock.promise,
      new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_INTERVAL_MS)),
    ]);
  }

  // Create new lock
  let releaseFunc: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseFunc = resolve;
  });

  const lockEntry: LockEntry = {
    promise: lockPromise,
    release: releaseFunc!,
    acquiredAt: Date.now(),
  };

  locks.set(storagePath, lockEntry);

  // Return release function that also cleans up the map
  return () => {
    lockEntry.release();
    locks.delete(storagePath);
  };
}

/**
 * Execute a function with an exclusive lock on the storage path.
 *
 * Ensures only one operation can modify the manifest at a time,
 * preventing race conditions during concurrent saves.
 *
 * @param storagePath - Path to lock
 * @param fn - Function to execute while holding the lock
 * @returns Result of the function
 */
async function withLock<T>(
  storagePath: string,
  fn: () => Promise<T>
): Promise<T> {
  const release = await acquireLock(storagePath);
  try {
    return await fn();
  } finally {
    release();
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a unique version ID based on current timestamp with random suffix.
 *
 * The ID is an ISO-8601 timestamp with colons replaced by hyphens,
 * plus a 4-character random suffix to ensure uniqueness even when
 * multiple versions are created within the same millisecond.
 *
 * Format: YYYY-MM-DDTHH-MM-SS.mmmZ-xxxx
 * Where xxxx is a random alphanumeric suffix.
 *
 * @returns Version ID string (e.g., "2024-12-11T10-30-00.000Z-a1b2")
 *
 * @example
 * ```typescript
 * const id = generateVersionId();
 * // Returns: "2024-12-11T10-30-00.000Z-a1b2"
 * ```
 */
export function generateVersionId(): string {
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${randomSuffix}`;
}

/**
 * Parse a version ID back to a Date object.
 *
 * Handles both old format (without suffix) and new format (with random suffix).
 *
 * @param versionId - Version ID string
 * @returns Date object or null if invalid
 */
export function parseVersionId(versionId: string): Date | null {
  // Remove random suffix if present (format: ...Z-xxxx)
  const withoutSuffix = versionId.replace(/-[a-z0-9]{4}$/, "");

  // Convert hyphens back to colons for ISO parsing
  // Format: 2024-12-11T10-30-00.000Z -> 2024-12-11T10:30:00.000Z
  // Note: The dot before milliseconds is preserved by generateVersionId()
  const isoString = withoutSuffix.replace(
    /T(\d{2})-(\d{2})-(\d{2})\.(\d{3})Z/,
    "T$1:$2:$3.$4Z"
  );

  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get the storage path for version files of a content item.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param config - Version history configuration
 * @returns Absolute path to version storage directory
 *
 * @example
 * ```typescript
 * const path = getVersionStoragePath(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   { storagePath: '.writenex/versions' }
 * );
 * // Returns: "/project/.writenex/versions/blog/my-post"
 * ```
 */
export function getVersionStoragePath(
  projectRoot: string,
  collection: string,
  contentId: string,
  config: Required<VersionHistoryConfig>
): string {
  return join(projectRoot, config.storagePath, collection, contentId);
}

/**
 * Get the path to a specific version file.
 *
 * @param storagePath - Version storage directory path
 * @param versionId - Version ID
 * @returns Absolute path to version file
 */
export function getVersionFilePath(
  storagePath: string,
  versionId: string
): string {
  return join(storagePath, `${versionId}.md`);
}

/**
 * Get the path to the manifest file for a content item.
 *
 * @param storagePath - Version storage directory path
 * @returns Absolute path to manifest file
 */
export function getManifestPath(storagePath: string): string {
  return join(storagePath, "manifest.json");
}

/**
 * Generate a preview string from content.
 *
 * Extracts the first 100 characters of the content body,
 * stripping frontmatter if present.
 *
 * @param content - Full markdown content
 * @returns Preview string (max 100 characters)
 *
 * @example
 * ```typescript
 * const preview = generatePreview("---\ntitle: Test\n---\n\n# Hello World\n\nThis is content.");
 * // Returns: "# Hello World\n\nThis is content."
 * ```
 */
export function generatePreview(content: string): string {
  // Parse frontmatter to get body only
  try {
    const { content: body } = matter(content);
    const trimmed = body.trim();

    if (trimmed.length <= PREVIEW_MAX_LENGTH) {
      return trimmed;
    }

    return trimmed.substring(0, PREVIEW_MAX_LENGTH);
  } catch {
    // If parsing fails, use raw content
    const trimmed = content.trim();
    return trimmed.length <= PREVIEW_MAX_LENGTH
      ? trimmed
      : trimmed.substring(0, PREVIEW_MAX_LENGTH);
  }
}

/**
 * Extract label from version file content.
 *
 * Reads the special _writenex_label frontmatter field that stores
 * the version label for recovery purposes.
 *
 * @param content - Full markdown content of version file
 * @returns Label string or undefined if not present
 */
export function extractLabelFromContent(content: string): string | undefined {
  try {
    const { data } = matter(content);
    const label = data[LABEL_FRONTMATTER_KEY];
    return typeof label === "string" ? label : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Inject label into content as frontmatter for persistence.
 *
 * Adds the _writenex_label field to frontmatter so the label
 * can be recovered if the manifest is lost or corrupted.
 *
 * @param content - Original markdown content
 * @param label - Label to inject
 * @returns Content with label injected in frontmatter
 */
export function injectLabelIntoContent(content: string, label: string): string {
  try {
    const { data, content: body } = matter(content);

    // Add label to frontmatter
    const newData = { ...data, [LABEL_FRONTMATTER_KEY]: label };

    // Reconstruct the file with updated frontmatter
    return matter.stringify(body, newData);
  } catch {
    // If parsing fails, prepend frontmatter with just the label
    return `---\n${LABEL_FRONTMATTER_KEY}: "${label}"\n---\n\n${content}`;
  }
}

/**
 * Remove the internal label field from content for user-facing operations.
 *
 * Strips the _writenex_label field from frontmatter when returning
 * content to users (e.g., during restore).
 *
 * @param content - Content that may contain internal label field
 * @returns Content with internal label field removed
 */
export function stripLabelFromContent(content: string): string {
  try {
    const { data, content: body } = matter(content);

    // Remove the internal label field
    if (LABEL_FRONTMATTER_KEY in data) {
      const { [LABEL_FRONTMATTER_KEY]: _, ...cleanData } = data;

      // If no other frontmatter, return just the body
      if (Object.keys(cleanData).length === 0) {
        return body.startsWith("\n") ? body.slice(1) : body;
      }

      return matter.stringify(body, cleanData);
    }

    return content;
  } catch {
    return content;
  }
}

/**
 * Ensure the .gitignore file exists in the version storage root.
 *
 * Creates a .gitignore file with "*" pattern to exclude all version
 * files from Git tracking.
 *
 * @param projectRoot - Absolute path to project root
 * @param config - Version history configuration
 *
 * @example
 * ```typescript
 * await ensureGitignore('/project', { storagePath: '.writenex/versions' });
 * // Creates: /project/.writenex/versions/.gitignore with content "*"
 * ```
 */
export async function ensureGitignore(
  projectRoot: string,
  config: Required<VersionHistoryConfig>
): Promise<void> {
  const storageRoot = join(projectRoot, config.storagePath);
  const gitignorePath = join(storageRoot, ".gitignore");

  // Ensure storage directory exists
  if (!existsSync(storageRoot)) {
    await mkdir(storageRoot, { recursive: true });
  }

  // Create .gitignore if it doesn't exist
  if (!existsSync(gitignorePath)) {
    await writeFile(gitignorePath, GITIGNORE_CONTENT, "utf-8");
  }
}

/**
 * Ensure the version storage directory exists for a content item.
 *
 * @param storagePath - Version storage directory path
 */
export async function ensureStorageDirectory(
  storagePath: string
): Promise<void> {
  if (!existsSync(storagePath)) {
    await mkdir(storagePath, { recursive: true });
  }
}

// =============================================================================
// Manifest Operations
// =============================================================================

/**
 * Read the version manifest for a content item.
 *
 * @param storagePath - Version storage directory path
 * @returns Version manifest or null if not found/corrupted
 *
 * @example
 * ```typescript
 * const manifest = await readManifest('/project/.writenex/versions/blog/my-post');
 * if (manifest) {
 *   console.log(`Found ${manifest.versions.length} versions`);
 * }
 * ```
 */
export async function readManifest(
  storagePath: string
): Promise<VersionManifest | null> {
  const manifestPath = getManifestPath(storagePath);

  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = await readFile(manifestPath, "utf-8");
    const data = JSON.parse(content) as VersionManifest;

    // Validate required fields
    if (!data.contentId || !data.collection || !Array.isArray(data.versions)) {
      console.warn(`[writenex] Corrupted manifest at ${manifestPath}`);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(
      `[writenex] Failed to read manifest at ${manifestPath}:`,
      error
    );
    return null;
  }
}

/**
 * Write the version manifest for a content item.
 *
 * @param storagePath - Version storage directory path
 * @param manifest - Version manifest to write
 *
 * @example
 * ```typescript
 * await writeManifest('/project/.writenex/versions/blog/my-post', {
 *   contentId: 'my-post',
 *   collection: 'blog',
 *   versions: [],
 *   updatedAt: new Date().toISOString(),
 * });
 * ```
 */
export async function writeManifest(
  storagePath: string,
  manifest: VersionManifest
): Promise<void> {
  await ensureStorageDirectory(storagePath);

  const manifestPath = getManifestPath(storagePath);
  const content = JSON.stringify(manifest, null, 2);

  await writeFile(manifestPath, content, "utf-8");
}

/**
 * Create an empty manifest for a content item.
 *
 * @param collection - Collection name
 * @param contentId - Content item ID
 * @returns New empty manifest
 */
export function createEmptyManifest(
  collection: string,
  contentId: string
): VersionManifest {
  return {
    contentId,
    collection,
    versions: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Recover manifest by scanning version files in the storage directory.
 *
 * This function rebuilds the manifest from existing version files
 * when the manifest is corrupted or missing.
 *
 * @param storagePath - Version storage directory path
 * @param collection - Collection name
 * @param contentId - Content item ID
 * @returns Recovered manifest
 *
 * @example
 * ```typescript
 * const manifest = await recoverManifest(
 *   '/project/.writenex/versions/blog/my-post',
 *   'blog',
 *   'my-post'
 * );
 * ```
 */
export async function recoverManifest(
  storagePath: string,
  collection: string,
  contentId: string
): Promise<VersionManifest> {
  const manifest = createEmptyManifest(collection, contentId);

  if (!existsSync(storagePath)) {
    return manifest;
  }

  try {
    const files = await readdir(storagePath);
    const versionFiles = files.filter(
      (f) => f.endsWith(".md") && f !== "manifest.json"
    );

    for (const file of versionFiles) {
      const versionId = basename(file, ".md");
      const filePath = join(storagePath, file);

      try {
        const content = await readFile(filePath, "utf-8");
        const stats = await stat(filePath);
        const timestamp = parseVersionId(versionId);

        if (timestamp) {
          // Extract label from content if present (for recovery)
          const label = extractLabelFromContent(content);

          const entry: VersionEntry = {
            id: versionId,
            timestamp: timestamp.toISOString(),
            preview: generatePreview(content),
            size: stats.size,
            ...(label ? { label } : {}),
          };

          manifest.versions.push(entry);
        }
      } catch {
        // Skip files that can't be read
        console.warn(`[writenex] Skipping unreadable version file: ${file}`);
      }
    }

    // Sort by timestamp descending (newest first)
    manifest.versions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    manifest.updatedAt = new Date().toISOString();

    // Write recovered manifest
    await writeManifest(storagePath, manifest);

    return manifest;
  } catch (error) {
    console.warn(`[writenex] Failed to recover manifest:`, error);
    return manifest;
  }
}

/**
 * Get or recover manifest for a content item.
 *
 * Attempts to read existing manifest, falls back to recovery if corrupted.
 *
 * @param storagePath - Version storage directory path
 * @param collection - Collection name
 * @param contentId - Content item ID
 * @returns Version manifest
 */
export async function getOrRecoverManifest(
  storagePath: string,
  collection: string,
  contentId: string
): Promise<VersionManifest> {
  const manifest = await readManifest(storagePath);

  if (manifest) {
    return manifest;
  }

  // Try to recover from version files
  return recoverManifest(storagePath, collection, contentId);
}

// =============================================================================
// Version CRUD Operations
// =============================================================================

/**
 * Save a version snapshot of content.
 *
 * Creates a new version file with the provided content and updates
 * the manifest. Automatically prunes old versions if the limit is exceeded.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param content - Full markdown content to save
 * @param config - Version history configuration
 * @param options - Save options
 * @returns Result of the save operation
 *
 * @example
 * ```typescript
 * const result = await saveVersion(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '---\ntitle: My Post\n---\n\nContent here...',
 *   { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' }
 * );
 *
 * if (result.success) {
 *   console.log(`Created version: ${result.version?.id}`);
 * }
 * ```
 */
export async function saveVersion(
  projectRoot: string,
  collection: string,
  contentId: string,
  content: string,
  config: Required<VersionHistoryConfig>,
  options: SaveVersionOptions = {}
): Promise<VersionResult> {
  const { label, skipIfIdentical = false } = options;

  // Check if version history is enabled
  if (!config.enabled) {
    return { success: true };
  }

  // Get storage path for this content item
  const storagePath = getVersionStoragePath(
    projectRoot,
    collection,
    contentId,
    config
  );

  // Use lock to prevent concurrent manifest modifications
  return withLock(storagePath, async () => {
    try {
      // Ensure gitignore exists in storage root
      await ensureGitignore(projectRoot, config);

      await ensureStorageDirectory(storagePath);

      // Get or create manifest
      const manifest = await getOrRecoverManifest(
        storagePath,
        collection,
        contentId
      );

      // Check if content is identical to last version (if skipIfIdentical is true)
      if (skipIfIdentical && manifest.versions.length > 0) {
        const lastVersion = manifest.versions[0];
        if (lastVersion) {
          const lastVersionPath = getVersionFilePath(
            storagePath,
            lastVersion.id
          );
          if (existsSync(lastVersionPath)) {
            try {
              const lastContent = await readFile(lastVersionPath, "utf-8");
              if (lastContent === content) {
                return { success: true, version: lastVersion };
              }
            } catch {
              // If we can't read the last version, proceed with saving
            }
          }
        }
      }

      // Generate version ID and create version file
      // Use the same timestamp for both id and timestamp to ensure consistency
      const now = new Date();
      const versionId = now.toISOString().replace(/:/g, "-");
      const versionPath = getVersionFilePath(storagePath, versionId);

      // If label is provided, inject it into content for recovery purposes
      const contentToSave = label
        ? injectLabelIntoContent(content, label)
        : content;

      // Write version file
      await writeFile(versionPath, contentToSave, "utf-8");

      // Get file stats for size
      const stats = await stat(versionPath);

      // Create version entry
      const entry: VersionEntry = {
        id: versionId,
        timestamp: now.toISOString(),
        preview: generatePreview(content),
        size: stats.size,
        ...(label ? { label } : {}),
      };

      // Add to manifest (newest first)
      manifest.versions.unshift(entry);
      manifest.updatedAt = new Date().toISOString();

      // Write updated manifest
      await writeManifest(storagePath, manifest);

      // Prune old versions (inside lock to prevent race)
      await pruneVersionsInternal(storagePath, config);

      return { success: true, version: entry };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[writenex] Failed to save version:`, error);
      return { success: false, error: `Failed to save version: ${message}` };
    }
  });
}

/**
 * Get all versions for a content item.
 *
 * Returns versions sorted by timestamp in descending order (newest first).
 * Handles missing or corrupted manifests gracefully.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param config - Version history configuration
 * @returns Array of version entries
 *
 * @example
 * ```typescript
 * const versions = await getVersions(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' }
 * );
 *
 * console.log(`Found ${versions.length} versions`);
 * ```
 */
export async function getVersions(
  projectRoot: string,
  collection: string,
  contentId: string,
  config: Required<VersionHistoryConfig>
): Promise<VersionEntry[]> {
  // Check if version history is enabled
  if (!config.enabled) {
    return [];
  }

  try {
    const storagePath = getVersionStoragePath(
      projectRoot,
      collection,
      contentId,
      config
    );

    // Check if storage directory exists
    if (!existsSync(storagePath)) {
      return [];
    }

    // Get or recover manifest
    const manifest = await getOrRecoverManifest(
      storagePath,
      collection,
      contentId
    );

    // Return versions sorted by timestamp descending (newest first)
    return [...manifest.versions].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.warn(`[writenex] Failed to get versions:`, error);
    return [];
  }
}

/**
 * Get a specific version with full content.
 *
 * Reads the version file and parses it to return structured data
 * with frontmatter and body separated.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param versionId - Version ID to retrieve
 * @param config - Version history configuration
 * @returns Full version data or null if not found
 *
 * @example
 * ```typescript
 * const version = await getVersion(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '2024-12-11T10-30-00-000Z',
 *   { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' }
 * );
 *
 * if (version) {
 *   console.log(`Title: ${version.frontmatter.title}`);
 *   console.log(`Body: ${version.body}`);
 * }
 * ```
 */
export async function getVersion(
  projectRoot: string,
  collection: string,
  contentId: string,
  versionId: string,
  config: Required<VersionHistoryConfig>
): Promise<Version | null> {
  // Check if version history is enabled
  if (!config.enabled) {
    return null;
  }

  try {
    const storagePath = getVersionStoragePath(
      projectRoot,
      collection,
      contentId,
      config
    );
    const versionPath = getVersionFilePath(storagePath, versionId);

    // Check if version file exists
    if (!existsSync(versionPath)) {
      return null;
    }

    // Read version file
    const rawContent = await readFile(versionPath, "utf-8");
    const stats = await stat(versionPath);

    // Extract label from content (stored for recovery)
    const labelFromContent = extractLabelFromContent(rawContent);

    // Strip internal label field before returning to user
    const content = stripLabelFromContent(rawContent);

    // Parse frontmatter from cleaned content
    const { data: frontmatter, content: body } = matter(content);

    // Get timestamp from version ID
    const timestamp = parseVersionId(versionId);
    if (!timestamp) {
      return null;
    }

    // Get label from manifest first, fall back to content-embedded label
    const manifest = await readManifest(storagePath);
    const manifestEntry = manifest?.versions.find((v) => v.id === versionId);
    const label = manifestEntry?.label ?? labelFromContent;

    return {
      id: versionId,
      timestamp: timestamp.toISOString(),
      preview: generatePreview(content),
      size: stats.size,
      content,
      frontmatter,
      body: body.trim(),
      ...(label ? { label } : {}),
    };
  } catch (error) {
    console.warn(`[writenex] Failed to get version ${versionId}:`, error);
    return null;
  }
}

/**
 * Delete a specific version.
 *
 * Removes the version file from the filesystem and updates the manifest.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param versionId - Version ID to delete
 * @param config - Version history configuration
 * @returns Result of the delete operation
 *
 * @example
 * ```typescript
 * const result = await deleteVersion(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '2024-12-11T10-30-00-000Z',
 *   { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' }
 * );
 *
 * if (result.success) {
 *   console.log('Version deleted');
 * }
 * ```
 */
export async function deleteVersion(
  projectRoot: string,
  collection: string,
  contentId: string,
  versionId: string,
  config: Required<VersionHistoryConfig>
): Promise<VersionResult> {
  const storagePath = getVersionStoragePath(
    projectRoot,
    collection,
    contentId,
    config
  );

  // Use lock to prevent concurrent manifest modifications
  return withLock(storagePath, async () => {
    try {
      const versionPath = getVersionFilePath(storagePath, versionId);

      // Check if version file exists
      if (!existsSync(versionPath)) {
        return { success: false, error: `Version not found: ${versionId}` };
      }

      // Get manifest
      const manifest = await getOrRecoverManifest(
        storagePath,
        collection,
        contentId
      );

      // Find version entry
      const entryIndex = manifest.versions.findIndex((v) => v.id === versionId);
      const entry = entryIndex >= 0 ? manifest.versions[entryIndex] : undefined;

      // Delete version file
      await unlink(versionPath);

      // Update manifest
      if (entryIndex >= 0) {
        manifest.versions.splice(entryIndex, 1);
        manifest.updatedAt = new Date().toISOString();
        await writeManifest(storagePath, manifest);
      }

      return { success: true, version: entry };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[writenex] Failed to delete version:`, error);
      return { success: false, error: `Failed to delete version: ${message}` };
    }
  });
}

/**
 * Clear all versions for a content item.
 *
 * Deletes all version files and resets the manifest to empty state.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param config - Version history configuration
 * @returns Result of the clear operation
 *
 * @example
 * ```typescript
 * const result = await clearVersions(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' }
 * );
 *
 * if (result.success) {
 *   console.log('All versions cleared');
 * }
 * ```
 */
export async function clearVersions(
  projectRoot: string,
  collection: string,
  contentId: string,
  config: Required<VersionHistoryConfig>
): Promise<VersionResult> {
  const storagePath = getVersionStoragePath(
    projectRoot,
    collection,
    contentId,
    config
  );

  // Check if storage directory exists (no lock needed for this check)
  if (!existsSync(storagePath)) {
    return { success: true };
  }

  // Use lock to prevent concurrent manifest modifications
  return withLock(storagePath, async () => {
    try {
      // Get all version files
      const files = await readdir(storagePath);
      const versionFiles = files.filter(
        (f) => f.endsWith(".md") && f !== "manifest.json"
      );

      // Delete all version files
      for (const file of versionFiles) {
        const filePath = join(storagePath, file);
        try {
          await unlink(filePath);
        } catch {
          // Ignore errors for individual files
        }
      }

      // Reset manifest
      const manifest = createEmptyManifest(collection, contentId);
      await writeManifest(storagePath, manifest);

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[writenex] Failed to clear versions:`, error);
      return { success: false, error: `Failed to clear versions: ${message}` };
    }
  });
}

/**
 * Prune old versions to maintain the maximum limit.
 *
 * Deletes the oldest unlabeled versions when the count exceeds maxVersions.
 * Labeled versions are preserved regardless of count.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param config - Version history configuration
 * @returns Result of the prune operation
 *
 * @example
 * ```typescript
 * const result = await pruneVersions(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' }
 * );
 * ```
 */
/**
 * Internal prune function that assumes lock is already held.
 *
 * @param storagePath - Version storage directory path
 * @param config - Version history configuration
 * @returns Result of the prune operation
 */
async function pruneVersionsInternal(
  storagePath: string,
  config: Required<VersionHistoryConfig>
): Promise<VersionResult> {
  try {
    // Check if storage directory exists
    if (!existsSync(storagePath)) {
      return { success: true };
    }

    // Get manifest (read fresh to ensure we have latest data)
    const manifest = await readManifest(storagePath);
    if (!manifest) {
      return { success: true };
    }

    // Separate labeled and unlabeled versions
    const labeledVersions = manifest.versions.filter((v) => v.label);
    const unlabeledVersions = manifest.versions.filter((v) => !v.label);

    // Check if pruning is needed
    if (unlabeledVersions.length <= config.maxVersions) {
      return { success: true };
    }

    // Sort unlabeled versions by timestamp (oldest first for deletion)
    const sortedUnlabeled = [...unlabeledVersions].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate how many to delete
    const toDelete = sortedUnlabeled.slice(
      0,
      unlabeledVersions.length - config.maxVersions
    );

    // Delete old version files
    for (const version of toDelete) {
      const versionPath = getVersionFilePath(storagePath, version.id);
      try {
        if (existsSync(versionPath)) {
          await unlink(versionPath);
        }
      } catch {
        // Ignore errors for individual files
      }
    }

    // Update manifest - keep labeled + remaining unlabeled
    const remainingUnlabeled = sortedUnlabeled.slice(
      unlabeledVersions.length - config.maxVersions
    );
    manifest.versions = [...labeledVersions, ...remainingUnlabeled].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    manifest.updatedAt = new Date().toISOString();

    await writeManifest(storagePath, manifest);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[writenex] Failed to prune versions:`, error);
    return { success: false, error: `Failed to prune versions: ${message}` };
  }
}

export async function pruneVersions(
  projectRoot: string,
  collection: string,
  contentId: string,
  config: Required<VersionHistoryConfig>
): Promise<VersionResult> {
  const storagePath = getVersionStoragePath(
    projectRoot,
    collection,
    contentId,
    config
  );

  // Check if storage directory exists (no lock needed for this check)
  if (!existsSync(storagePath)) {
    return { success: true };
  }

  // Use lock to prevent concurrent manifest modifications
  return withLock(storagePath, () =>
    pruneVersionsInternal(storagePath, config)
  );
}

// =============================================================================
// Restore Operations
// =============================================================================

/**
 * Restore a version to current content.
 *
 * This function:
 * 1. Creates a safety snapshot of the current content before restoring
 * 2. Reads the version content to restore
 * 3. Overwrites the current content file with the version content
 *
 * Note: Cache invalidation should be handled by the caller (API route)
 * since the cache is managed at the server level.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param versionId - Version ID to restore
 * @param contentFilePath - Absolute path to the current content file
 * @param config - Version history configuration
 * @param options - Restore options
 * @returns Result of the restore operation
 *
 * @example
 * ```typescript
 * const result = await restoreVersion(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '2024-12-11T10-30-00-000Z',
 *   '/project/src/content/blog/my-post.md',
 *   { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' }
 * );
 *
 * if (result.success) {
 *   console.log('Restored content:', result.content);
 *   if (result.safetySnapshot) {
 *     console.log('Safety snapshot created:', result.safetySnapshot.id);
 *   }
 * }
 * ```
 */
export async function restoreVersion(
  projectRoot: string,
  collection: string,
  contentId: string,
  versionId: string,
  contentFilePath: string,
  config: Required<VersionHistoryConfig>,
  options: RestoreVersionOptions = {}
): Promise<RestoreResult> {
  const { safetySnapshotLabel = "Before restore", skipSafetySnapshot = false } =
    options;

  try {
    // Step 1: Get the version to restore
    const versionToRestore = await getVersion(
      projectRoot,
      collection,
      contentId,
      versionId,
      config
    );

    if (!versionToRestore) {
      return {
        success: false,
        error: `Version not found: ${versionId}`,
      };
    }

    // Step 2: Read current content and create safety snapshot
    let safetySnapshot: VersionEntry | undefined;

    if (!skipSafetySnapshot && existsSync(contentFilePath)) {
      try {
        const currentContent = await readFile(contentFilePath, "utf-8");

        // Create safety snapshot with label
        const snapshotResult = await saveVersion(
          projectRoot,
          collection,
          contentId,
          currentContent,
          config,
          { label: safetySnapshotLabel }
        );

        if (snapshotResult.success && snapshotResult.version) {
          safetySnapshot = snapshotResult.version;
        }
      } catch (error) {
        // Log warning but continue with restore
        console.warn(
          `[writenex] Failed to create safety snapshot before restore:`,
          error
        );
      }
    }

    // Step 3: Overwrite current content file with version content
    await writeFile(contentFilePath, versionToRestore.content, "utf-8");

    return {
      success: true,
      version: {
        id: versionToRestore.id,
        timestamp: versionToRestore.timestamp,
        preview: versionToRestore.preview,
        size: versionToRestore.size,
        ...(versionToRestore.label ? { label: versionToRestore.label } : {}),
      },
      content: versionToRestore.content,
      safetySnapshot,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[writenex] Failed to restore version:`, error);
    return {
      success: false,
      error: `Failed to restore version: ${message}`,
    };
  }
}
