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
 *
 * @module @writenex/astro/filesystem/writer
 */

import { writeFile, unlink, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import slugify from "slugify";
import { readContentFile } from "./reader";

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
}

/**
 * Options for updating content
 */
export interface UpdateContentOptions {
  /** Updated frontmatter data */
  frontmatter?: Record<string, unknown>;
  /** Updated markdown body content */
  body?: string;
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
 * Generate a unique slug that doesn't conflict with existing files
 *
 * @param baseSlug - The base slug to start with
 * @param collectionPath - Path to the collection directory
 * @param extension - File extension (default: .md)
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  collectionPath: string,
  extension: string = ".md"
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (existsSync(join(collectionPath, `${slug}${extension}`))) {
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
 * @param collectionPath - Absolute path to the collection directory
 * @param options - Content creation options
 * @returns WriteResult with success status and file info
 *
 * @example
 * ```typescript
 * const result = await createContent('/project/src/content/blog', {
 *   frontmatter: {
 *     title: 'My New Post',
 *     pubDate: new Date(),
 *     draft: true,
 *   },
 *   body: '# Hello World\n\nThis is my first post.',
 * });
 * ```
 */
export async function createContent(
  collectionPath: string,
  options: CreateContentOptions
): Promise<WriteResult> {
  const { frontmatter, body, slug: customSlug } = options;

  try {
    // Generate slug from title or use custom slug
    const title = frontmatter.title as string | undefined;
    const baseSlug = customSlug ?? (title ? generateSlug(title) : "untitled");

    // Ensure unique slug
    const slug = await generateUniqueSlug(baseSlug, collectionPath);
    const filePath = join(collectionPath, `${slug}.md`);

    // Ensure collection directory exists
    if (!existsSync(collectionPath)) {
      await mkdir(collectionPath, { recursive: true });
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
 * @param filePath - Absolute path to the content file
 * @param collectionPath - Path to the collection directory
 * @param options - Update options
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
 *   }
 * );
 * ```
 */
export async function updateContent(
  filePath: string,
  collectionPath: string,
  options: UpdateContentOptions
): Promise<WriteResult> {
  try {
    // Read existing content
    const existing = await readContentFile(filePath, collectionPath);

    if (!existing.success || !existing.content) {
      return {
        success: false,
        error: existing.error ?? "Content not found",
      };
    }

    // Merge frontmatter
    const frontmatter = options.frontmatter
      ? { ...existing.content.frontmatter, ...options.frontmatter }
      : existing.content.frontmatter;

    // Use new body or existing
    const body = options.body ?? existing.content.body;

    // Create updated content
    const content = createFileContent(frontmatter, body);

    // Write file
    await writeFile(filePath, content, "utf-8");

    return {
      success: true,
      id: existing.content.id,
      path: filePath,
    };
  } catch (error) {
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

/**
 * Get the file path for a content item by ID
 *
 * @param collectionPath - Path to the collection directory
 * @param contentId - Content ID (slug)
 * @returns File path if found, null otherwise
 */
export function getContentFilePath(
  collectionPath: string,
  contentId: string
): string | null {
  // Try common extensions
  const extensions = [".md", ".mdx"];

  for (const ext of extensions) {
    const filePath = join(collectionPath, `${contentId}${ext}`);
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  // Try folder-based content (slug/index.md)
  const indexPath = join(collectionPath, contentId, "index.md");
  if (existsSync(indexPath)) {
    return indexPath;
  }

  const indexMdxPath = join(collectionPath, contentId, "index.mdx");
  if (existsSync(indexMdxPath)) {
    return indexMdxPath;
  }

  return null;
}
