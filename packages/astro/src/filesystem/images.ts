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

import { writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename, extname, relative } from "node:path";
import type {
  ImageConfig,
  DiscoveredImage,
  ImageDiscoveryOptions,
  ImageDiscoveryResult,
} from "@/types";
import { getContentFilePath } from "./reader";

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
 * The markdown path is calculated based on the content structure:
 * - Folder-based (slug/index.md): ./filename (image in same folder as index.md)
 * - Flat file (slug.md): ./slug/filename (image in sibling folder)
 *
 * @param projectRoot - Project root path
 * @param collection - Collection name
 * @param contentId - Content ID
 * @param filename - Image filename
 * @returns Absolute path to store the image and markdown-compatible path
 */
function getColocatedPath(
  projectRoot: string,
  collection: string,
  contentId: string,
  filename: string
): { storagePath: string; markdownPath: string } {
  const collectionPath = join(projectRoot, "src/content", collection);
  const imageDir = join(collectionPath, contentId);
  const storagePath = join(imageDir, filename);

  // Detect content structure to determine correct markdown path
  // Check if content is folder-based (slug/index.md or slug/index.mdx)
  const indexMdPath = join(collectionPath, contentId, "index.md");
  const indexMdxPath = join(collectionPath, contentId, "index.mdx");
  const isFolderBased = existsSync(indexMdPath) || existsSync(indexMdxPath);

  // For folder-based: image is in same folder as index.md, so path is ./filename
  // For flat file: image is in sibling folder, so path is ./contentId/filename
  const markdownPath = isFolderBased
    ? `./${filename}`
    : `./${contentId}/${filename}`;

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

// =============================================================================
// Image Discovery Functions
// =============================================================================

/**
 * Content structure type detected from file path
 */
export type ContentStructure = "flat" | "folder-based" | "date-prefixed";

/**
 * Result of content structure detection
 */
export interface ContentStructureResult {
  /** Detected structure type */
  structure: ContentStructure;
  /** Path to the image folder (null if doesn't exist) */
  imageFolderPath: string | null;
}

/**
 * Date prefix pattern for content files (e.g., 2024-01-15-my-post.md)
 */
const DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}-/;

/**
 * Detect content structure and get the image folder path
 *
 * Handles three content structures:
 * - Flat file: `my-post.md` -> looks for `my-post/` sibling folder
 * - Folder-based: `slug/index.md` -> uses `slug/` parent folder
 * - Date-prefixed: `2024-01-15-my-post.md` -> looks for `2024-01-15-my-post/` sibling folder
 *
 * @param collectionPath - Absolute path to the collection directory
 * @param contentId - Content ID (slug)
 * @param contentFilePath - Absolute path to the content file
 * @returns Path to the image folder, or null if no image folder exists
 *
 * @example
 * ```typescript
 * // Flat file structure
 * const folder = getContentImageFolder(
 *   '/project/src/content/blog',
 *   'my-post',
 *   '/project/src/content/blog/my-post.md'
 * );
 * // Returns: '/project/src/content/blog/my-post' (if exists)
 *
 * // Folder-based structure
 * const folder = getContentImageFolder(
 *   '/project/src/content/blog',
 *   'my-post',
 *   '/project/src/content/blog/my-post/index.md'
 * );
 * // Returns: '/project/src/content/blog/my-post'
 * ```
 */
export function getContentImageFolder(
  collectionPath: string,
  contentId: string,
  contentFilePath: string
): string | null {
  const filename = basename(contentFilePath);
  const contentDir = dirname(contentFilePath);

  // Check for folder-based structure (index.md or index.mdx)
  if (filename === "index.md" || filename === "index.mdx") {
    // For folder-based content, the image folder is the parent folder itself
    // The folder already exists since it contains the index file
    return contentDir;
  }

  // For flat file and date-prefixed structures, look for sibling folder
  // Both use the contentId as the folder name
  const siblingFolderPath = join(collectionPath, contentId);

  if (existsSync(siblingFolderPath)) {
    return siblingFolderPath;
  }

  return null;
}

/**
 * Detect the content structure type from a content file path
 *
 * @param contentFilePath - Absolute path to the content file
 * @returns The detected content structure type
 */
export function detectContentStructure(
  contentFilePath: string
): ContentStructure {
  const filename = basename(contentFilePath);

  // Check for folder-based structure
  if (filename === "index.md" || filename === "index.mdx") {
    return "folder-based";
  }

  // Check for date-prefixed structure
  const nameWithoutExt = filename.replace(/\.(md|mdx)$/, "");
  if (DATE_PREFIX_PATTERN.test(nameWithoutExt)) {
    return "date-prefixed";
  }

  // Default to flat file structure
  return "flat";
}

// getContentFilePath is imported from ./reader

// =============================================================================
// Recursive Image Scanner
// =============================================================================

/**
 * Options for recursive directory scanning
 */
interface ScanOptions {
  /** Maximum recursion depth */
  maxDepth: number;
  /** Current recursion depth */
  currentDepth: number;
  /** Base path for calculating relative paths */
  basePath: string;
}

/**
 * Check if a directory should be skipped during scanning
 *
 * Skips hidden folders (starting with .) and special folders (starting with _)
 *
 * @param dirName - Directory name to check
 * @returns True if the directory should be skipped
 */
function shouldSkipDirectory(dirName: string): boolean {
  return dirName.startsWith(".") || dirName.startsWith("_");
}

/**
 * Scan a directory recursively for image files
 *
 * Recursively scans the given directory for image files with supported extensions.
 * Skips hidden folders (starting with .) and special folders (starting with _).
 * Limits recursion to the specified maxDepth.
 *
 * @param dirPath - Absolute path to the directory to scan
 * @param basePath - Base path for calculating relative paths
 * @param options - Scan options including maxDepth and currentDepth
 * @returns Array of discovered images
 *
 * @example
 * ```typescript
 * const images = await scanDirectoryForImages(
 *   '/project/src/content/blog/my-post',
 *   '/project/src/content/blog/my-post',
 *   { maxDepth: 5, currentDepth: 0, basePath: '/project/src/content/blog/my-post' }
 * );
 * ```
 */
export async function scanDirectoryForImages(
  dirPath: string,
  basePath: string,
  options: ScanOptions
): Promise<DiscoveredImage[]> {
  const { maxDepth, currentDepth } = options;

  // Stop if we've exceeded max depth
  if (currentDepth >= maxDepth) {
    return [];
  }

  // Check if directory exists
  if (!existsSync(dirPath)) {
    return [];
  }

  const images: DiscoveredImage[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden and special folders
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }

        // Recursively scan subdirectory
        const subImages = await scanDirectoryForImages(entryPath, basePath, {
          maxDepth,
          currentDepth: currentDepth + 1,
          basePath,
        });
        images.push(...subImages);
      } else if (entry.isFile()) {
        // Check if it's a valid image file
        if (isValidImageFile(entry.name)) {
          const fileStat = await stat(entryPath);
          const extension = extname(entry.name).toLowerCase();

          // Calculate relative path from base path
          const relativePath = calculateRelativePathFromBase(
            basePath,
            entryPath
          );

          images.push({
            filename: entry.name,
            relativePath,
            absolutePath: entryPath,
            size: fileStat.size,
            extension,
          });
        }
      }
    }
  } catch {
    // Return empty array on error (e.g., permission denied)
    return [];
  }

  return images;
}

/**
 * Calculate relative path from base path to target path
 *
 * @param basePath - Base path (image folder root)
 * @param targetPath - Target path (image file)
 * @returns Relative path starting with ./
 */
function calculateRelativePathFromBase(
  basePath: string,
  targetPath: string
): string {
  const relPath = relative(basePath, targetPath);
  return `./${relPath}`;
}

/**
 * Calculate relative path from content file to image file
 *
 * Calculates the path that can be used in markdown to reference an image
 * relative to the content file's location. The path always starts with ./
 * to ensure it's treated as a relative reference.
 *
 * @param contentFilePath - Absolute path to the content file (e.g., /project/src/content/blog/my-post.md)
 * @param imagePath - Absolute path to the image file (e.g., /project/src/content/blog/my-post/images/hero.jpg)
 * @returns Relative path starting with ./ (e.g., ./my-post/images/hero.jpg)
 *
 * @example
 * ```typescript
 * // Flat file structure
 * const relPath = calculateRelativePath(
 *   '/project/src/content/blog/my-post.md',
 *   '/project/src/content/blog/my-post/hero.jpg'
 * );
 * // Returns: './my-post/hero.jpg'
 *
 * // Folder-based structure
 * const relPath = calculateRelativePath(
 *   '/project/src/content/blog/my-post/index.md',
 *   '/project/src/content/blog/my-post/images/hero.jpg'
 * );
 * // Returns: './images/hero.jpg'
 *
 * // Nested subfolder
 * const relPath = calculateRelativePath(
 *   '/project/src/content/blog/my-post/index.md',
 *   '/project/src/content/blog/my-post/assets/photos/hero.jpg'
 * );
 * // Returns: './assets/photos/hero.jpg'
 * ```
 */
export function calculateRelativePath(
  contentFilePath: string,
  imagePath: string
): string {
  // Get the directory containing the content file
  const contentDir = dirname(contentFilePath);

  // Calculate relative path from content directory to image
  const relPath = relative(contentDir, imagePath);

  // Ensure path starts with ./ for relative references
  // The relative() function may return paths without ./ prefix
  if (relPath.startsWith("..")) {
    // Path goes up directories - keep as is but ensure ./ prefix
    return relPath;
  }

  // For paths in same or child directories, ensure ./ prefix
  return `./${relPath}`;
}

// =============================================================================
// Main Discovery Function
// =============================================================================

/**
 * Default maximum recursion depth for image discovery
 */
const DEFAULT_MAX_DEPTH = 5;

/**
 * Discover all images associated with a content item
 *
 * This is the main entry point for image discovery. It:
 * 1. Locates the content file using getContentFilePath
 * 2. Determines the image folder using getContentImageFolder
 * 3. Scans the folder recursively using scanDirectoryForImages
 * 4. Calculates relative paths for all discovered images
 *
 * @param collectionPath - Absolute path to the collection directory
 * @param contentId - Content ID (slug)
 * @param options - Optional discovery options
 * @returns ImageDiscoveryResult with discovered images or error
 *
 * @example
 * ```typescript
 * const result = await discoverContentImages(
 *   '/project/src/content/blog',
 *   'my-post',
 *   { maxDepth: 3 }
 * );
 *
 * if (result.success) {
 *   console.log(`Found ${result.images.length} images`);
 *   for (const img of result.images) {
 *     console.log(`- ${img.relativePath}`);
 *   }
 * }
 * ```
 */
export async function discoverContentImages(
  collectionPath: string,
  contentId: string,
  options?: ImageDiscoveryOptions
): Promise<ImageDiscoveryResult> {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;

  try {
    // Step 1: Get content file path
    const contentFilePath = getContentFilePath(collectionPath, contentId);

    if (!contentFilePath) {
      return {
        success: false,
        images: [],
        error: `Content '${contentId}' not found in collection`,
      };
    }

    // Step 2: Determine image folder
    const imageFolderPath = getContentImageFolder(
      collectionPath,
      contentId,
      contentFilePath
    );

    // If no image folder exists, return empty array (not an error per Requirement 1.4)
    if (!imageFolderPath) {
      return {
        success: true,
        images: [],
      };
    }

    // Step 3: Scan folder for images
    const scannedImages = await scanDirectoryForImages(
      imageFolderPath,
      imageFolderPath,
      {
        maxDepth,
        currentDepth: 0,
        basePath: imageFolderPath,
      }
    );

    // Step 4: Calculate relative paths from content file to each image
    const images: DiscoveredImage[] = scannedImages.map((img) => ({
      ...img,
      relativePath: calculateRelativePath(contentFilePath, img.absolutePath),
    }));

    return {
      success: true,
      images,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      images: [],
      error: `Failed to discover images: ${message}`,
    };
  }
}
