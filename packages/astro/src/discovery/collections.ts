/**
 * @fileoverview Collection discovery for Astro content collections
 *
 * This module provides functions to auto-discover content collections
 * from an Astro project's src/content directory.
 *
 * ## Discovery Process:
 * 1. Scan src/content/ for subdirectories
 * 2. Each subdirectory is treated as a collection
 * 3. Count content files in each collection
 * 4. Detect file patterns from existing files
 * 5. Auto-detect frontmatter schema from sample files
 *
 * @module @writenex/astro/discovery/collections
 */

import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DiscoveredCollection, CollectionConfig } from "../types";
import { getCollectionCount } from "../filesystem/reader";
import { DEFAULT_FILE_PATTERN } from "../config/defaults";
import { detectFilePattern as detectPattern } from "./patterns";
import { detectSchema } from "./schema";

/**
 * Default content directory path relative to project root
 */
const DEFAULT_CONTENT_DIR = "src/content";

/**
 * Directories to ignore during discovery
 */
const IGNORED_DIRECTORIES = new Set(["node_modules", ".git", "_", "."]);

/**
 * Check if a directory should be ignored
 *
 * @param name - Directory name
 * @returns True if should be ignored
 */
function shouldIgnore(name: string): boolean {
  return (
    IGNORED_DIRECTORIES.has(name) ||
    name.startsWith("_") ||
    name.startsWith(".")
  );
}

/**
 * Discover all content collections in a project
 *
 * Scans the src/content directory for subdirectories and treats
 * each as a content collection.
 *
 * @param projectRoot - Absolute path to the project root
 * @param contentDir - Relative path to content directory (default: src/content)
 * @returns Array of discovered collections
 *
 * @example
 * ```typescript
 * const collections = await discoverCollections('/path/to/project');
 * // Returns: [
 * //   { name: 'blog', path: 'src/content/blog', count: 10, ... },
 * //   { name: 'docs', path: 'src/content/docs', count: 5, ... },
 * // ]
 * ```
 */
export async function discoverCollections(
  projectRoot: string,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<DiscoveredCollection[]> {
  const contentPath = join(projectRoot, contentDir);

  // Check if content directory exists
  if (!existsSync(contentPath)) {
    return [];
  }

  const collections: DiscoveredCollection[] = [];

  try {
    const entries = await readdir(contentPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip non-directories and ignored directories
      if (!entry.isDirectory() || shouldIgnore(entry.name)) {
        continue;
      }

      const collectionPath = join(contentPath, entry.name);
      const relativePath = join(contentDir, entry.name);

      // Count content files in this collection
      const count = await getCollectionCount(collectionPath);

      // Detect file pattern using pattern detection module
      const patternResult = await detectPattern(collectionPath);
      const filePattern = patternResult.pattern;

      // Auto-detect schema from sample files
      const schemaResult = await detectSchema(collectionPath);
      const schema =
        Object.keys(schemaResult.schema).length > 0
          ? schemaResult.schema
          : undefined;

      // Generate default preview URL pattern
      const previewUrl = `/${entry.name}/{slug}`;

      collections.push({
        name: entry.name,
        path: relativePath,
        filePattern,
        count,
        schema,
        previewUrl,
      });
    }
  } catch (error) {
    console.error(`[writenex] Failed to discover collections: ${error}`);
  }

  return collections;
}

/**
 * Merge discovered collections with configured collections
 *
 * Configured collections take precedence over discovered ones.
 * This allows users to override auto-discovered settings.
 *
 * @param discovered - Auto-discovered collections
 * @param configured - User-configured collections
 * @returns Merged collection list
 */
export function mergeCollections(
  discovered: DiscoveredCollection[],
  configured: CollectionConfig[]
): DiscoveredCollection[] {
  const configuredNames = new Set(configured.map((c) => c.name));
  const result: DiscoveredCollection[] = [];

  // Add configured collections first (they take precedence)
  for (const config of configured) {
    const discoveredMatch = discovered.find((d) => d.name === config.name);

    result.push({
      name: config.name,
      path: config.path,
      filePattern:
        config.filePattern ??
        discoveredMatch?.filePattern ??
        DEFAULT_FILE_PATTERN,
      count: discoveredMatch?.count ?? 0,
      schema: config.schema ?? discoveredMatch?.schema,
      previewUrl:
        config.previewUrl ??
        discoveredMatch?.previewUrl ??
        `/${config.name}/{slug}`,
    });
  }

  // Add discovered collections that weren't configured
  for (const disc of discovered) {
    if (!configuredNames.has(disc.name)) {
      result.push(disc);
    }
  }

  return result;
}

/**
 * Get a single collection by name
 *
 * @param projectRoot - Absolute path to the project root
 * @param collectionName - Name of the collection
 * @param contentDir - Relative path to content directory
 * @returns The collection if found, undefined otherwise
 */
export async function getCollection(
  projectRoot: string,
  collectionName: string,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<DiscoveredCollection | undefined> {
  const collections = await discoverCollections(projectRoot, contentDir);
  return collections.find((c) => c.name === collectionName);
}

/**
 * Check if a collection exists
 *
 * @param projectRoot - Absolute path to the project root
 * @param collectionName - Name of the collection
 * @param contentDir - Relative path to content directory
 * @returns True if the collection exists
 */
export async function collectionExists(
  projectRoot: string,
  collectionName: string,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<boolean> {
  const collectionPath = join(projectRoot, contentDir, collectionName);

  if (!existsSync(collectionPath)) {
    return false;
  }

  try {
    const stats = await stat(collectionPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
