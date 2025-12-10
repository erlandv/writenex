/**
 * @fileoverview Image handling for content collections
 *
 * This module provides functions for uploading and managing images
 * in content collections with support for different storage strategies.
 *
 * ## Strategies:
 * - colocated: Images stored alongside content files
 * - public: Images stored in public directory
 * - custom: User-defined storage paths
 *
 * @module @writenex/astro/filesystem/images
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import type { ImageConfig } from "../types";

/**
 * Default image configuration
 */
export const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  strategy: "colocated",
  publicPath: "/images",
  storagePath: "public/images",
};

/**
 * Supported image extensions
 */
const SUPPORTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
]);

/**
 * Result of image upload operation
 */
export interface ImageUploadResult {
  success: boolean;
  /** Markdown-compatible path for the image */
  path?: string;
  /** Public URL for the image */
  url?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Options for image upload
 */
export interface ImageUploadOptions {
  /** Original filename */
  filename: string;
  /** Image binary data */
  data: Buffer;
  /** Collection name */
  collection: string;
  /** Content ID (slug) */
  contentId: string;
  /** Project root path */
  projectRoot: string;
  /** Image configuration */
  config?: ImageConfig;
}

/**
 * Validate image file
 *
 * @param filename - Original filename
 * @returns True if valid image file
 */
export function isValidImageFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

/**
 * Generate a unique filename for uploaded image
 *
 * @param originalName - Original filename
 * @param _contentId - Content ID for context (reserved for future use)
 * @returns Unique filename
 */
function generateUniqueFilename(
  originalName: string,
  _contentId: string
): string {
  const ext = extname(originalName).toLowerCase();
  const baseName = basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);

  const timestamp = Date.now().toString(36);
  return `${baseName}-${timestamp}${ext}`;
}

/**
 * Get storage path for colocated strategy
 *
 * Images are stored in a folder named after the content file.
 * Example: src/content/blog/my-post.md -> src/content/blog/my-post/image.jpg
 *
 * @param projectRoot - Project root path
 * @param collection - Collection name
 * @param contentId - Content ID
 * @param filename - Image filename
 * @returns Absolute path to store the image
 */
function getColocatedPath(
  projectRoot: string,
  collection: string,
  contentId: string,
  filename: string
): { storagePath: string; markdownPath: string } {
  const imageDir = join(projectRoot, "src/content", collection, contentId);
  const storagePath = join(imageDir, filename);
  const markdownPath = `./${contentId}/${filename}`;

  return { storagePath, markdownPath };
}

/**
 * Get storage path for public strategy
 *
 * Images are stored in public/images/{collection}/{filename}
 *
 * @param projectRoot - Project root path
 * @param collection - Collection name
 * @param filename - Image filename
 * @param config - Image configuration
 * @returns Absolute path to store the image
 */
function getPublicPath(
  projectRoot: string,
  collection: string,
  filename: string,
  config: ImageConfig
): { storagePath: string; markdownPath: string; url: string } {
  const storagePath = join(
    projectRoot,
    config.storagePath ?? "public/images",
    collection,
    filename
  );
  const publicPath = config.publicPath ?? "/images";
  const url = `${publicPath}/${collection}/${filename}`;

  return { storagePath, markdownPath: url, url };
}

/**
 * Upload an image file
 *
 * @param options - Upload options
 * @returns Upload result with paths
 *
 * @example
 * ```typescript
 * const result = await uploadImage({
 *   filename: "hero.jpg",
 *   data: imageBuffer,
 *   collection: "blog",
 *   contentId: "my-post",
 *   projectRoot: "/path/to/project",
 * });
 *
 * if (result.success) {
 *   console.log(result.path); // "./my-post/hero-abc123.jpg"
 * }
 * ```
 */
export async function uploadImage(
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  const {
    filename,
    data,
    collection,
    contentId,
    projectRoot,
    config = DEFAULT_IMAGE_CONFIG,
  } = options;

  // Validate file
  if (!isValidImageFile(filename)) {
    return {
      success: false,
      error: `Invalid image file type. Supported: ${[...SUPPORTED_EXTENSIONS].join(", ")}`,
    };
  }

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(filename, contentId);

  try {
    let storagePath: string;
    let markdownPath: string;
    let url: string | undefined;

    switch (config.strategy) {
      case "public": {
        const paths = getPublicPath(
          projectRoot,
          collection,
          uniqueFilename,
          config
        );
        storagePath = paths.storagePath;
        markdownPath = paths.markdownPath;
        url = paths.url;
        break;
      }

      case "colocated":
      default: {
        const paths = getColocatedPath(
          projectRoot,
          collection,
          contentId,
          uniqueFilename
        );
        storagePath = paths.storagePath;
        markdownPath = paths.markdownPath;
        break;
      }
    }

    // Ensure directory exists
    const dir = dirname(storagePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Write file
    await writeFile(storagePath, data);

    return {
      success: true,
      path: markdownPath,
      url: url ?? markdownPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to upload image: ${message}`,
    };
  }
}

/**
 * Parse multipart form data for image upload
 *
 * Simple parser for multipart/form-data with single file upload.
 * For production, consider using a proper multipart parser library.
 *
 * @param body - Raw request body
 * @param contentType - Content-Type header
 * @returns Parsed file data and fields
 */
export function parseMultipartFormData(
  body: Buffer,
  contentType: string
): {
  file?: { filename: string; data: Buffer; contentType: string };
  fields: Record<string, string>;
} {
  const result: {
    file?: { filename: string; data: Buffer; contentType: string };
    fields: Record<string, string>;
  } = { fields: {} };

  // Extract boundary from content-type
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) {
    return result;
  }

  const boundary = boundaryMatch[1] ?? boundaryMatch[2];
  if (!boundary) {
    return result;
  }

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = splitBuffer(body, boundaryBuffer);

  for (const part of parts) {
    // Skip empty parts and closing boundary
    if (part.length < 10) continue;

    // Find header/body separator (double CRLF)
    const separatorIndex = part.indexOf("\r\n\r\n");
    if (separatorIndex === -1) continue;

    const headerSection = part.slice(0, separatorIndex).toString("utf-8");
    const bodySection = part.slice(separatorIndex + 4);

    // Remove trailing CRLF from body
    const bodyEnd = bodySection.length - 2;
    const cleanBody = bodyEnd > 0 ? bodySection.slice(0, bodyEnd) : bodySection;

    // Parse headers
    const headers = parseHeaders(headerSection);
    const disposition = headers["content-disposition"];

    if (!disposition) continue;

    // Extract name and filename from Content-Disposition
    const nameMatch = disposition.match(/name="([^"]+)"/);
    const filenameMatch = disposition.match(/filename="([^"]+)"/);

    if (filenameMatch) {
      // This is a file field
      result.file = {
        filename: filenameMatch[1] ?? "unknown",
        data: cleanBody,
        contentType: headers["content-type"] ?? "application/octet-stream",
      };
    } else if (nameMatch) {
      // This is a regular field
      result.fields[nameMatch[1] ?? ""] = cleanBody.toString("utf-8");
    }
  }

  return result;
}

/**
 * Split buffer by delimiter
 */
function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let index: number;

  while ((index = buffer.indexOf(delimiter, start)) !== -1) {
    if (index > start) {
      parts.push(buffer.slice(start, index));
    }
    start = index + delimiter.length;
  }

  if (start < buffer.length) {
    parts.push(buffer.slice(start));
  }

  return parts;
}

/**
 * Parse header section into key-value pairs
 */
function parseHeaders(headerSection: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = headerSection.split("\r\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  return headers;
}
