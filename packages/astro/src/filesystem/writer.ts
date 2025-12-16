/**
 * @fileoverview Filesystem writer for content operations
 *
 * This module provides functions for creating, updating, and deleting
 * content files in Astro content collections.
 *
 * ## Features:
 * - Create new content files with frontmatter
 * - Update existing content files
 * - Delete content files
 * - Generate unique slugs to avoid collisions
 * - Support for different file patterns (flat, folder-based, date-prefixed)
 * - Automatic version history creation before updates
 *
 * @module @writenex/astro/filesystem/writer
 */

import { writeFile, unlink, mkdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import slugify from "slugify";
import { readContentFile } from "./reader";
import { saveVersion } from "./versions";
import {
  generatePathFromPattern,
  resolvePatternTokens,
  isValidPattern,
} from "@/discovery/patterns";
import type { VersionHistoryConfig } from "@/types";
import { ContentConflictError } from "@/core/errors";

/**
 * Options for creating content
 */
export interface CreateContentOptions {
  /** Frontmatter data */
  frontmatter: Record<string, unknown>;
  /** Markdown body content */
  body: string;
  /** Custom slug (optional, generated from title if not provided) */
  slug?: string;
  /** File pattern for the collection (e.g., "{slug}/index.md", "{date}-{slug}.md") */
  filePattern?: string;
  /** Custom token values to override automatic resolution */
  customTokens?: Record<string, string>;
}

/**
 * Options for updating content
 */
export interface UpdateContentOptions {
  /** Updated frontmatter data */
  frontmatter?: Record<string, unknown>;
  /** Updated markdown body content */
  body?: string;
  /** Project root for version history (required for version creation) */
  projectRoot?: string;
  /** Collection name for version history */
  collection?: string;
  /** Version history configuration */
  versionHistoryConfig?: Required<VersionHistoryConfig>;
  /**
   * Expected modification time for conflict detection.
   * If provided and the file's mtime differs, the update will fail with a conflict error.
   */
  expectedMtime?: number;
}

/**
 * Result of a write operation
 */
export interface WriteResult {
  /** Whether the operation was successful */
  success: boolean;
  /** The content ID (slug) */
  id?: string;
  /** The file path */
  path?: string;
  /** Error message if failed */
  error?: string;
  /** New modification time after write (for conflict detection) */
  mtime?: number;
  /** Conflict error if update failed due to external modification */
  conflict?: ContentConflictError;
}

/**
 * Generate a URL-safe slug from a string
 *
 * @param text - Text to slugify
 * @returns URL-safe slug
 */
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Check if a content file already exists for a given slug and pattern
 *
 * @param slug - The slug to check
 * @param collectionPath - Path to the collection directory
 * @param filePattern - File pattern (e.g., "{slug}.md", "{slug}/index.md")
 * @returns True if content already exists
 */
function contentExists(
  slug: string,
  collectionPath: string,
  filePattern: string
): boolean {
  const relativePath = generatePathFromPattern(filePattern, { slug });
  const fullPath = join(collectionPath, relativePath);

  // For folder-based patterns, check if the folder exists
  if (filePattern.includes("/index.")) {
    const folderPath = join(collectionPath, slug);
    return existsSync(folderPath);
  }

  return existsSync(fullPath);
}

/**
 * Generate a unique slug that doesn't conflict with existing files
 *
 * @param baseSlug - The base slug to start with
 * @param collectionPath - Path to the collection directory
 * @param filePattern - File pattern (default: "{slug}.md")
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  collectionPath: string,
  filePattern: string = "{slug}.md"
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (contentExists(slug, collectionPath, filePattern)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Convert frontmatter object to YAML string
 *
 * @param frontmatter - Frontmatter data
 * @returns YAML string
 */
function frontmatterToYaml(frontmatter: Record<string, unknown>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string") {
      // Quote strings that contain special characters
      if (value.includes(":") || value.includes("#") || value.includes("\n")) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else if (value instanceof Date) {
      lines.push(`${key}: ${value.toISOString().split("T")[0]}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      }
    } else if (typeof value === "object") {
      // Simple object serialization
      lines.push(`${key}:`);
      for (const [subKey, subValue] of Object.entries(value)) {
        lines.push(`  ${subKey}: ${subValue}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Create a content file with frontmatter and body
 *
 * @param frontmatter - Frontmatter data
 * @param body - Markdown body content
 * @returns Complete file content
 */
function createFileContent(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  const yaml = frontmatterToYaml(frontmatter);
  return `---\n${yaml}\n---\n\n${body}`;
}

/**
 * Create a new content file in a collection
 *
 * Supports various file patterns with automatic token resolution:
 * - `{slug}.md` - Simple flat structure (default)
 * - `{slug}/index.md` - Folder-based content
 * - `{date}-{slug}.md` - Date-prefixed naming
 * - `{year}/{slug}.md` - Year folder structure
 * - `{year}/{month}/{slug}.md` - Year/month folder structure
 * - `{year}/{month}/{day}/{slug}.md` - Full date folder structure
 * - `{lang}/{slug}.md` - Language-prefixed (i18n)
 * - `{category}/{slug}.md` - Category folder structure
 * - `{author}/{slug}.md` - Author folder structure
 * - Any custom pattern with tokens from frontmatter
 *
 * Token resolution priority:
 * 1. Custom tokens (explicitly provided via customTokens)
 * 2. Known token resolvers (date, year, month, lang, category, etc.)
 * 3. Frontmatter values (for custom tokens)
 * 4. Default values
 *
 * @param collectionPath - Absolute path to the collection directory
 * @param options - Content creation options
 * @returns WriteResult with success status and file info
 *
 * @example
 * ```typescript
 * // Flat structure
 * const result = await createContent('/project/src/content/blog', {
 *   frontmatter: { title: 'My New Post', pubDate: new Date() },
 *   body: '# Hello World',
 * });
 *
 * // Folder-based structure
 * const result = await createContent('/project/src/content/blog', {
 *   frontmatter: { title: 'My New Post', pubDate: new Date() },
 *   body: '# Hello World',
 *   filePattern: '{slug}/index.md',
 * });
 *
 * // i18n structure with custom token
 * const result = await createContent('/project/src/content/blog', {
 *   frontmatter: { title: 'My New Post', lang: 'id' },
 *   body: '# Hello World',
 *   filePattern: '{lang}/{slug}.md',
 * });
 *
 * // Custom pattern with explicit token
 * const result = await createContent('/project/src/content/blog', {
 *   frontmatter: { title: 'My New Post' },
 *   body: '# Hello World',
 *   filePattern: '{category}/{slug}.md',
 *   customTokens: { category: 'tutorials' },
 * });
 * ```
 */
export async function createContent(
  collectionPath: string,
  options: CreateContentOptions
): Promise<WriteResult> {
  const {
    frontmatter,
    body,
    slug: customSlug,
    filePattern = "{slug}.md",
    customTokens = {},
  } = options;

  try {
    // Validate pattern
    const validation = isValidPattern(filePattern);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid file pattern: ${validation.error}`,
      };
    }

    // Generate slug from title or use custom slug
    const title = frontmatter.title as string | undefined;
    const baseSlug = customSlug ?? (title ? generateSlug(title) : "untitled");

    // Ensure unique slug using the file pattern
    const slug = await generateUniqueSlug(
      baseSlug,
      collectionPath,
      filePattern
    );

    // Resolve all tokens using the flexible token resolver
    const tokens = resolvePatternTokens(filePattern, {
      slug,
      frontmatter,
      customTokens,
    });

    // Generate the relative file path from the pattern
    const relativePath = generatePathFromPattern(filePattern, tokens);
    const filePath = join(collectionPath, relativePath);

    // Ensure parent directory exists (important for folder-based patterns)
    const parentDir = dirname(filePath);
    if (!existsSync(parentDir)) {
      await mkdir(parentDir, { recursive: true });
    }

    // Create file content
    const content = createFileContent(frontmatter, body);

    // Write file
    await writeFile(filePath, content, "utf-8");

    return {
      success: true,
      id: slug,
      path: filePath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to create content: ${message}`,
    };
  }
}

/**
 * Update an existing content file
 *
 * Creates a version snapshot of the current content before updating
 * when version history is configured. Skips both version creation and
 * file write if the new content is identical to the current file content.
 * Version creation errors are logged but do not fail the save operation.
 *
 * @param filePath - Absolute path to the content file
 * @param collectionPath - Path to the collection directory
 * @param options - Update options including version history config
 * @returns WriteResult with success status
 *
 * @example
 * ```typescript
 * const result = await updateContent(
 *   '/project/src/content/blog/my-post.md',
 *   '/project/src/content/blog',
 *   {
 *     frontmatter: { title: 'Updated Title' },
 *     body: '# Updated Content',
 *     projectRoot: '/project',
 *     collection: 'blog',
 *     versionHistoryConfig: { enabled: true, maxVersions: 20, storagePath: '.writenex/versions' },
 *   }
 * );
 * ```
 */
export async function updateContent(
  filePath: string,
  collectionPath: string,
  options: UpdateContentOptions
): Promise<WriteResult> {
  const { projectRoot, collection, versionHistoryConfig, expectedMtime } =
    options;

  try {
    // Read existing content
    const existing = await readContentFile(filePath, collectionPath);

    if (!existing.success || !existing.content) {
      return {
        success: false,
        error: existing.error ?? "Content not found",
      };
    }

    // Conflict detection: check if file was modified externally
    if (expectedMtime !== undefined && existing.content.mtime !== undefined) {
      // Allow small tolerance (1ms) for filesystem precision differences
      const mtimeDiff = Math.abs(existing.content.mtime - expectedMtime);
      if (mtimeDiff > 1) {
        // File was modified externally - return conflict error
        const conflictError = new ContentConflictError(
          collection ?? "unknown",
          existing.content.id,
          existing.content.raw,
          existing.content.mtime,
          expectedMtime
        );

        return {
          success: false,
          error: conflictError.message,
          conflict: conflictError,
        };
      }
    }

    // Merge frontmatter
    const frontmatter = options.frontmatter
      ? { ...existing.content.frontmatter, ...options.frontmatter }
      : existing.content.frontmatter;

    // Use new body or existing
    const body = options.body ?? existing.content.body;

    // Create updated content
    const newContent = createFileContent(frontmatter, body);

    // Read current file content for comparison
    const currentContent = existsSync(filePath)
      ? await readFile(filePath, "utf-8")
      : "";

    // Skip if content is identical (no changes to save)
    if (newContent === currentContent) {
      return {
        success: true,
        id: existing.content.id,
        path: filePath,
        mtime: existing.content.mtime,
      };
    }

    // Create version snapshot before updating (if version history is configured)
    // Only create version if content actually changed
    if (
      projectRoot &&
      collection &&
      versionHistoryConfig &&
      versionHistoryConfig.enabled &&
      currentContent
    ) {
      try {
        // Extract content ID from file path
        const fileName = basename(filePath);
        const contentId =
          fileName === "index.md" || fileName === "index.mdx"
            ? basename(dirname(filePath))
            : fileName.replace(/\.(md|mdx)$/, "");

        // Save version of the current content before overwriting
        // skipIfIdentical compares with last version in history
        const versionResult = await saveVersion(
          projectRoot,
          collection,
          contentId,
          currentContent,
          versionHistoryConfig,
          { skipIfIdentical: true }
        );

        if (!versionResult.success) {
          console.warn(
            `[writenex] Failed to create version snapshot: ${versionResult.error}`
          );
        }
      } catch (versionError) {
        // Log version creation error but continue with save
        console.warn(
          `[writenex] Version creation error (save will continue):`,
          versionError
        );
      }
    }

    // Write file with new content
    await writeFile(filePath, newContent, "utf-8");

    // Get new mtime after write
    const newStats = await stat(filePath);

    return {
      success: true,
      id: existing.content.id,
      path: filePath,
      mtime: newStats.mtimeMs,
    };
  } catch (error) {
    // Re-throw ContentConflictError as-is
    if (error instanceof ContentConflictError) {
      return {
        success: false,
        error: error.message,
        conflict: error,
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to update content: ${message}`,
    };
  }
}

/**
 * Delete a content file
 *
 * @param filePath - Absolute path to the content file
 * @returns WriteResult with success status
 *
 * @example
 * ```typescript
 * const result = await deleteContent('/project/src/content/blog/my-post.md');
 * ```
 */
export async function deleteContent(filePath: string): Promise<WriteResult> {
  try {
    if (!existsSync(filePath)) {
      return {
        success: false,
        error: "Content file not found",
      };
    }

    await unlink(filePath);

    return {
      success: true,
      path: filePath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to delete content: ${message}`,
    };
  }
}

// Re-export getContentFilePath from reader for backward compatibility
export { getContentFilePath } from "./reader";
