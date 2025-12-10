/**
 * @fileoverview Filesystem reader for content collections
 *
 * This module provides functions for reading content files from the filesystem,
 * parsing frontmatter, and extracting content metadata.
 *
 * ## Features:
 * - Read individual content files with frontmatter parsing
 * - List all content files in a collection
 * - Generate content summaries for listing
 * - Support for .md and .mdx files
 *
 * @module @writenex/astro/filesystem/reader
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname, relative } from "node:path";
import matter from "gray-matter";
import type { ContentItem, ContentSummary } from "../types";

/**
 * Supported content file extensions
 */
const CONTENT_EXTENSIONS = [".md", ".mdx"];

/**
 * Maximum excerpt length in characters
 */
const EXCERPT_LENGTH = 150;

/**
 * Options for reading content
 */
export interface ReadContentOptions {
  /** Include draft content in listings */
  includeDrafts?: boolean;
  /** Sort field for listings */
  sortBy?: string;
  /** Sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Result of reading a content file
 */
export interface ReadFileResult {
  /** Whether the read was successful */
  success: boolean;
  /** The content item (if successful) */
  content?: ContentItem;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Check if a file is a content file based on extension
 *
 * @param filename - The filename to check
 * @returns True if the file is a content file
 */
export function isContentFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return CONTENT_EXTENSIONS.includes(ext);
}

/**
 * Extract slug from a content file path
 *
 * Handles various file patterns:
 * - `my-post.md` -> `my-post`
 * - `2024-01-15-my-post.md` -> `2024-01-15-my-post`
 * - `my-post/index.md` -> `my-post`
 *
 * @param filePath - Path to the content file
 * @param collectionPath - Path to the collection directory
 * @returns The extracted slug
 */
export function extractSlug(filePath: string, collectionPath: string): string {
  const relativePath = relative(collectionPath, filePath);
  const filename = basename(relativePath);
  const ext = extname(filename);

  // Handle index files (folder-based content)
  if (filename === "index.md" || filename === "index.mdx") {
    const parts = relativePath.split("/");
    if (parts.length >= 2) {
      const slug = parts[parts.length - 2];
      if (slug) return slug;
    }
  }

  // Remove extension to get slug
  return filename.slice(0, -ext.length);
}

/**
 * Generate an excerpt from markdown content
 *
 * @param body - The markdown body content
 * @param maxLength - Maximum excerpt length
 * @returns The generated excerpt
 */
export function generateExcerpt(
  body: string,
  maxLength: number = EXCERPT_LENGTH
): string {
  // Remove markdown formatting for cleaner excerpt
  const cleaned = body
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Truncate at word boundary
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Read and parse a single content file
 *
 * @param filePath - Absolute path to the content file
 * @param collectionPath - Path to the collection directory
 * @returns ReadFileResult with the parsed content or error
 *
 * @example
 * ```typescript
 * const result = await readContentFile(
 *   '/project/src/content/blog/my-post.md',
 *   '/project/src/content/blog'
 * );
 *
 * if (result.success) {
 *   console.log(result.content.frontmatter.title);
 * }
 * ```
 */
export async function readContentFile(
  filePath: string,
  collectionPath: string
): Promise<ReadFileResult> {
  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`,
      };
    }

    // Read file content
    const raw = await readFile(filePath, "utf-8");

    // Parse frontmatter
    const { data: frontmatter, content: body } = matter(raw);

    // Extract slug
    const id = extractSlug(filePath, collectionPath);

    return {
      success: true,
      content: {
        id,
        path: filePath,
        frontmatter,
        body: body.trim(),
        raw,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to read content file: ${message}`,
    };
  }
}

/**
 * List all content files in a directory recursively
 *
 * @param dirPath - Path to the directory to scan
 * @returns Array of absolute file paths
 */
async function listFilesRecursive(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  if (!existsSync(dirPath)) {
    return files;
  }

  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subFiles = await listFilesRecursive(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && isContentFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Read all content files in a collection
 *
 * @param collectionPath - Absolute path to the collection directory
 * @param options - Read options
 * @returns Array of content items
 *
 * @example
 * ```typescript
 * const items = await readCollection('/project/src/content/blog', {
 *   includeDrafts: false,
 *   sortBy: 'pubDate',
 *   sortOrder: 'desc',
 * });
 * ```
 */
export async function readCollection(
  collectionPath: string,
  options: ReadContentOptions = {}
): Promise<ContentItem[]> {
  const { includeDrafts = true, sortBy, sortOrder = "desc" } = options;

  // Get all content files
  const filePaths = await listFilesRecursive(collectionPath);

  // Read and parse all files
  const results = await Promise.all(
    filePaths.map((fp) => readContentFile(fp, collectionPath))
  );

  // Filter successful reads and optionally filter drafts
  let items = results
    .filter(
      (r): r is { success: true; content: ContentItem } =>
        r.success && !!r.content
    )
    .map((r) => r.content)
    .filter((item) => {
      if (!includeDrafts && item.frontmatter.draft === true) {
        return false;
      }
      return true;
    });

  // Sort if requested
  if (sortBy) {
    items = items.sort((a, b) => {
      const aVal = a.frontmatter[sortBy];
      const bVal = b.frontmatter[sortBy];

      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return sortOrder === "asc" ? -1 : 1;
      if (bVal === undefined) return sortOrder === "asc" ? 1 : -1;

      // Compare values (convert to string for comparison)
      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
      if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  return items;
}

/**
 * Convert a content item to a summary for listing
 *
 * @param item - The full content item
 * @returns Content summary with essential fields
 */
export function toContentSummary(item: ContentItem): ContentSummary {
  const { id, path, frontmatter, body } = item;

  return {
    id,
    path,
    title: String(frontmatter.title ?? id),
    pubDate: frontmatter.pubDate ? String(frontmatter.pubDate) : undefined,
    draft: frontmatter.draft === true,
    excerpt: generateExcerpt(body),
  };
}

/**
 * Get content summaries for a collection
 *
 * @param collectionPath - Absolute path to the collection directory
 * @param options - Read options
 * @returns Array of content summaries
 */
export async function getCollectionSummaries(
  collectionPath: string,
  options: ReadContentOptions = {}
): Promise<ContentSummary[]> {
  const items = await readCollection(collectionPath, options);
  return items.map(toContentSummary);
}

/**
 * Get the count of content files in a collection
 *
 * @param collectionPath - Absolute path to the collection directory
 * @returns Number of content files
 */
export async function getCollectionCount(
  collectionPath: string
): Promise<number> {
  const filePaths = await listFilesRecursive(collectionPath);
  return filePaths.length;
}

/**
 * Check if a collection directory exists and contains content
 *
 * @param collectionPath - Absolute path to the collection directory
 * @returns Object with exists and hasContent flags
 */
export async function checkCollection(collectionPath: string): Promise<{
  exists: boolean;
  hasContent: boolean;
  count: number;
}> {
  if (!existsSync(collectionPath)) {
    return { exists: false, hasContent: false, count: 0 };
  }

  const count = await getCollectionCount(collectionPath);

  return {
    exists: true,
    hasContent: count > 0,
    count,
  };
}

/**
 * Get file stats for a content file
 *
 * @param filePath - Path to the content file
 * @returns File stats or null if file doesn't exist
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  mtime: Date;
  ctime: Date;
} | null> {
  try {
    const stats = await stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.birthtime,
    };
  } catch {
    return null;
  }
}
