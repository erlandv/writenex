/**
 * @fileoverview API route handlers for Writenex
 *
 * This module provides the API router that handles CRUD operations
 * for content collections.
 *
 * ## API Endpoints:
 * - GET /api/collections - List all collections
 * - GET /api/content/:collection - List content in collection
 * - GET /api/content/:collection/:id - Get single content item
 * - POST /api/content/:collection - Create new content
 * - PUT /api/content/:collection/:id - Update content
 * - DELETE /api/content/:collection/:id - Delete content
 * - GET /api/images/:collection/:contentId - Discover images for content
 * - GET /api/images/:collection/:contentId/* - Serve image file
 * - POST /api/images - Upload image
 * - GET /api/versions/:collection/:id - List versions
 * - GET /api/versions/:collection/:id/:versionId - Get version
 * - POST /api/versions/:collection/:id - Create manual version
 * - POST /api/versions/:collection/:id/:versionId/restore - Restore version
 * - GET /api/versions/:collection/:id/:versionId/diff - Get diff data
 * - DELETE /api/versions/:collection/:id/:versionId - Delete version
 * - DELETE /api/versions/:collection/:id - Clear all versions
 *
 * @module @writenex/astro/server/routes
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { MiddlewareContext } from "./middleware";
import {
  sendJson,
  sendError,
  sendWritenexError,
  parseQueryParams,
  parseJsonBody,
} from "./middleware";
import {
  ApiBadRequestError,
  ApiMethodNotAllowedError,
  CollectionNotFoundError,
  CollectionDiscoveryError,
  ContentNotFoundError,
  ImageInvalidTypeError,
  ImageNotFoundError,
  PathTraversalError,
  VersionNotFoundError,
  isWritenexError,
  wrapError,
  WritenexErrorCode,
} from "@/core/errors";
import { getCache } from "./cache";
import { discoverCollections, mergeCollections } from "@/discovery/collections";
import { getCollectionSummaries, readContentFile } from "@/filesystem/reader";
import {
  createContent,
  updateContent,
  deleteContent,
  getContentFilePath,
} from "@/filesystem/writer";
import {
  uploadImage,
  parseMultipartFormData,
  isValidImageFile,
  discoverContentImages,
} from "@/filesystem/images";
import {
  getVersions,
  getVersion,
  saveVersion,
  restoreVersion,
  deleteVersion,
  clearVersions,
} from "@/filesystem/versions";
import type { VersionHistoryConfig } from "@/types";

/**
 * API route handler function type
 */
type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: RouteParams,
  context: MiddlewareContext
) => Promise<void>;

/**
 * Route parameters extracted from URL
 */
interface RouteParams {
  collection?: string;
  id?: string;
  versionId?: string;
  query: Record<string, string>;
}

/**
 * Create the API router
 *
 * @param context - Middleware context
 * @returns Router function that handles API requests
 */
export function createApiRouter(
  context: MiddlewareContext
): (req: IncomingMessage, res: ServerResponse, path: string) => Promise<void> {
  return async (req, res, path) => {
    const method = req.method?.toUpperCase() ?? "GET";
    const query = parseQueryParams(req.url ?? "");

    // Strip query string from path before parsing segments
    const pathWithoutQuery = path.split("?")[0] ?? path;

    // Parse route segments
    const segments = pathWithoutQuery.split("/").filter(Boolean);
    const params: RouteParams = { query };

    // Route: /collections
    if (segments[0] === "collections") {
      if (method === "GET") {
        return handleGetCollections(req, res, params, context);
      }
      return sendWritenexError(
        res,
        new ApiMethodNotAllowedError(method, ["GET"])
      );
    }

    // Route: /config or /config/path
    if (segments[0] === "config") {
      if (method === "GET") {
        if (segments[1] === "path") {
          return handleGetConfigPath(req, res, params, context);
        }
        return handleGetConfig(req, res, params, context);
      }
      return sendWritenexError(
        res,
        new ApiMethodNotAllowedError(method, ["GET"])
      );
    }

    // Route: /content/:collection/:id?
    if (segments[0] === "content") {
      params.collection = segments[1];
      params.id = segments[2];

      switch (method) {
        case "GET":
          if (params.id) {
            return handleGetContent(req, res, params, context);
          }
          return handleListContent(req, res, params, context);
        case "POST":
          return handleCreateContent(req, res, params, context);
        case "PUT":
          return handleUpdateContent(req, res, params, context);
        case "DELETE":
          return handleDeleteContent(req, res, params, context);
        default:
          return sendWritenexError(
            res,
            new ApiMethodNotAllowedError(method, [
              "GET",
              "POST",
              "PUT",
              "DELETE",
            ])
          );
      }
    }

    // Route: /images/:collection/:contentId - Image discovery
    // Route: /images/:collection/:contentId/* - Serve image file
    if (segments[0] === "images") {
      params.collection = segments[1];
      params.id = segments[2];

      // Check if this is a file request (has more segments after contentId)
      if (
        method === "GET" &&
        params.collection &&
        params.id &&
        segments.length > 3
      ) {
        // Serve image file: /images/:collection/:contentId/path/to/image.jpg
        const imagePath = segments.slice(3).join("/");
        return handleServeImage(req, res, params, imagePath, context);
      }

      if (method === "GET" && params.collection && params.id) {
        return handleImageDiscovery(req, res, params, context);
      }
      if (method === "POST") {
        return handleImageUpload(req, res, params, context);
      }
      return sendWritenexError(
        res,
        new ApiMethodNotAllowedError(method, ["GET", "POST"])
      );
    }

    // Route: /versions/:collection/:id/:versionId?
    if (segments[0] === "versions") {
      params.collection = segments[1];
      params.id = segments[2];
      params.versionId = segments[3];

      // Check for special action routes (restore, diff)
      const action = segments[4];

      switch (method) {
        case "GET":
          if (params.versionId) {
            // Check if this is a diff request
            if (action === "diff") {
              return handleGetVersionDiff(req, res, params, context);
            }
            return handleGetVersion(req, res, params, context);
          }
          return handleListVersions(req, res, params, context);
        case "POST":
          if (params.versionId && action === "restore") {
            return handleRestoreVersion(req, res, params, context);
          }
          if (!params.versionId) {
            return handleCreateVersion(req, res, params, context);
          }
          return sendWritenexError(
            res,
            new ApiMethodNotAllowedError(method, ["GET", "POST", "DELETE"])
          );
        case "DELETE":
          if (params.versionId) {
            return handleDeleteVersion(req, res, params, context);
          }
          return handleClearVersions(req, res, params, context);
        default:
          return sendWritenexError(
            res,
            new ApiMethodNotAllowedError(method, ["GET", "POST", "DELETE"])
          );
      }
    }

    // Route: /health (for testing)
    if (segments[0] === "health") {
      return sendJson(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }

    // Unknown route
    return sendError(res, "Not found", 404);
  };
}

/**
 * GET /api/config - Get current configuration
 *
 * Returns the current Writenex configuration including image settings
 * and Astro's trailingSlash setting for preview URLs.
 */
const handleGetConfig: RouteHandler = async (_req, res, _params, context) => {
  const { config, trailingSlash } = context;

  sendJson(res, {
    images: config.images,
    editor: config.editor,
    trailingSlash,
  });
};

/**
 * GET /api/config/path - Get config file path
 *
 * Returns the absolute path to the configuration file for opening in editor.
 * Also returns the project root for reference.
 */
const handleGetConfigPath: RouteHandler = async (
  _req,
  res,
  _params,
  context
) => {
  const { projectRoot } = context;

  // Import findConfigFile from config loader
  const { findConfigFile } = await import("@/config/loader");
  const configPath = findConfigFile(projectRoot);

  sendJson(res, {
    configPath,
    projectRoot,
    hasConfigFile: configPath !== null,
  });
};

/**
 * GET /api/collections - List all collections
 *
 * Returns discovered and configured collections with metadata.
 * Results are cached for performance.
 */
const handleGetCollections: RouteHandler = async (
  _req,
  res,
  _params,
  context
) => {
  const { config, projectRoot } = context;
  const cache = getCache();

  try {
    // Try to get from cache first
    let collections = cache.getCollections();

    if (!collections) {
      // Cache miss - discover and merge collections
      const discovered = await discoverCollections(projectRoot);
      collections = mergeCollections(discovered, config.collections);

      // Store in cache
      cache.setCollections(collections);
    }

    sendJson(res, { collections });
  } catch (error) {
    const wrappedError = isWritenexError(error)
      ? error
      : new CollectionDiscoveryError(
          join(projectRoot, "src/content"),
          error instanceof Error ? error : undefined
        );
    sendWritenexError(res, wrappedError);
  }
};

/**
 * GET /api/content/:collection - List content in collection
 *
 * Query params:
 * - draft: Include drafts (default: false)
 * - sort: Sort field (default: pubDate)
 * - order: Sort order (asc/desc, default: desc)
 *
 * Results are cached for performance.
 */
const handleListContent: RouteHandler = async (_req, res, params, context) => {
  const { collection, query } = params;
  const { projectRoot } = context;

  if (!collection) {
    return sendWritenexError(
      res,
      new ApiBadRequestError("Collection name required")
    );
  }

  const cache = getCache();

  try {
    const collectionPath = join(projectRoot, "src/content", collection);

    // Check if collection exists
    if (!existsSync(collectionPath)) {
      return sendWritenexError(res, new CollectionNotFoundError(collection));
    }

    // Parse query parameters
    const includeDrafts = query.draft === "true";
    const sortBy = query.sort ?? "pubDate";
    const sortOrder = (query.order as "asc" | "desc") ?? "desc";

    // Try to get from cache first (only for default queries)
    // We cache the "all content" query (includeDrafts=true, default sort)
    const isDefaultQuery =
      includeDrafts && sortBy === "pubDate" && sortOrder === "desc";

    let items = isDefaultQuery ? cache.getContent(collection) : null;

    if (!items) {
      items = await getCollectionSummaries(collectionPath, {
        includeDrafts,
        sortBy,
        sortOrder,
      });

      // Cache only the "all content" query
      if (isDefaultQuery) {
        cache.setContent(collection, items);
      }
    }

    sendJson(res, {
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("[writenex] List content error:", error);
    const wrappedError = isWritenexError(error)
      ? error
      : wrapError(error, WritenexErrorCode.API_INTERNAL_ERROR);
    sendWritenexError(res, wrappedError);
  }
};

/**
 * GET /api/content/:collection/:id - Get single content item
 */
const handleGetContent: RouteHandler = async (_req, res, params, context) => {
  const { collection, id } = params;
  const { projectRoot } = context;

  if (!collection || !id) {
    return sendWritenexError(
      res,
      new ApiBadRequestError("Collection and content ID required")
    );
  }

  try {
    const collectionPath = join(projectRoot, "src/content", collection);
    const filePath = getContentFilePath(collectionPath, id);

    if (!filePath) {
      return sendWritenexError(res, new ContentNotFoundError(collection, id));
    }

    const result = await readContentFile(filePath, collectionPath);

    if (!result.success || !result.content) {
      return sendError(res, result.error ?? "Failed to read content", 500);
    }

    sendJson(res, result.content);
  } catch (error) {
    const wrappedError = isWritenexError(error)
      ? error
      : wrapError(error, WritenexErrorCode.API_INTERNAL_ERROR);
    sendWritenexError(res, wrappedError);
  }
};

/**
 * POST /api/content/:collection - Create new content
 *
 * Automatically detects the file pattern from existing content in the collection
 * and creates new content following the same pattern.
 */
const handleCreateContent: RouteHandler = async (req, res, params, context) => {
  const { collection } = params;
  const { projectRoot, config } = context;

  if (!collection) {
    return sendError(res, "Collection name required", 400);
  }

  try {
    const body = await parseJsonBody(req);

    if (!body || typeof body !== "object") {
      return sendError(res, "Invalid request body", 400);
    }

    const {
      frontmatter,
      body: contentBody,
      slug,
    } = body as {
      frontmatter?: Record<string, unknown>;
      body?: string;
      slug?: string;
    };

    if (!frontmatter) {
      return sendError(res, "Frontmatter is required", 400);
    }

    const collectionPath = join(projectRoot, "src/content", collection);
    const cache = getCache();

    // Get the file pattern for this collection
    let filePattern: string | undefined;

    // First, check if there's a configured pattern for this collection
    const configuredCollection = config.collections.find(
      (c) => c.name === collection
    );
    if (configuredCollection?.filePattern) {
      filePattern = configuredCollection.filePattern;
    } else {
      // Otherwise, get the detected pattern from discovered collections
      let collections = cache.getCollections();
      if (!collections) {
        const discovered = await discoverCollections(projectRoot);
        collections = mergeCollections(discovered, config.collections);
        cache.setCollections(collections);
      }

      const discoveredCollection = collections.find(
        (c) => c.name === collection
      );
      if (discoveredCollection?.filePattern) {
        filePattern = discoveredCollection.filePattern;
      }
    }

    const result = await createContent(collectionPath, {
      frontmatter,
      body: contentBody ?? "",
      slug,
      filePattern,
    });

    if (!result.success) {
      return sendError(res, result.error ?? "Failed to create content", 500);
    }

    // Invalidate cache for this collection (new content added)
    cache.handleFileChange("add", collection);

    sendJson(res, {
      success: true,
      id: result.id,
      path: result.path,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to create content: ${message}`, 500);
  }
};

/**
 * PUT /api/content/:collection/:id - Update content
 *
 * Creates a version snapshot of the current content before updating
 * when version history is enabled in configuration.
 *
 * Supports conflict detection via expectedMtime parameter:
 * - If expectedMtime is provided and differs from current file mtime,
 *   returns 409 Conflict with both versions for client-side resolution.
 *
 * Request body:
 * {
 *   frontmatter?: Record<string, unknown>;
 *   body?: string;
 *   expectedMtime?: number;  // For conflict detection
 *   forceOverwrite?: boolean; // Skip conflict check (use with caution)
 * }
 *
 * Response on conflict (409):
 * {
 *   error: string;
 *   code: "CONTENT_CONFLICT";
 *   serverContent: string;
 *   serverMtime: number;
 *   clientMtime: number;
 * }
 */
const handleUpdateContent: RouteHandler = async (req, res, params, context) => {
  const { collection, id } = params;
  const { projectRoot, config } = context;

  if (!collection || !id) {
    return sendWritenexError(
      res,
      new ApiBadRequestError("Collection and content ID required")
    );
  }

  try {
    const body = await parseJsonBody(req);

    if (!body || typeof body !== "object") {
      return sendWritenexError(
        res,
        new ApiBadRequestError("Invalid request body")
      );
    }

    const {
      frontmatter,
      body: contentBody,
      expectedMtime,
      forceOverwrite,
    } = body as {
      frontmatter?: Record<string, unknown>;
      body?: string;
      expectedMtime?: number;
      forceOverwrite?: boolean;
    };

    const collectionPath = join(projectRoot, "src/content", collection);
    const filePath = getContentFilePath(collectionPath, id);

    if (!filePath) {
      return sendWritenexError(res, new ContentNotFoundError(collection, id));
    }

    // Pass version history config to updateContent for automatic version creation
    // Note: config.versionHistory is guaranteed to have all required fields
    // because applyConfigDefaults() applies DEFAULT_VERSION_HISTORY_CONFIG
    const result = await updateContent(filePath, collectionPath, {
      frontmatter,
      body: contentBody,
      projectRoot,
      collection,
      versionHistoryConfig: config.versionHistory as Required<
        typeof config.versionHistory
      >,
      // Only check mtime if not forcing overwrite
      expectedMtime: forceOverwrite ? undefined : expectedMtime,
    });

    // Handle conflict error specially
    if (!result.success && result.conflict) {
      return sendWritenexError(res, result.conflict);
    }

    if (!result.success) {
      return sendError(res, result.error ?? "Failed to update content", 500);
    }

    // Invalidate cache for this collection (content modified)
    const cache = getCache();
    cache.handleFileChange("change", collection);

    sendJson(res, {
      success: true,
      id: result.id,
      path: result.path,
      mtime: result.mtime,
    });
  } catch (error) {
    const wrappedError = isWritenexError(error)
      ? error
      : wrapError(error, WritenexErrorCode.API_INTERNAL_ERROR);
    sendWritenexError(res, wrappedError);
  }
};

/**
 * DELETE /api/content/:collection/:id - Delete content
 */
const handleDeleteContent: RouteHandler = async (
  _req,
  res,
  params,
  context
) => {
  const { collection, id } = params;
  const { projectRoot } = context;

  if (!collection || !id) {
    return sendError(res, "Collection and content ID required", 400);
  }

  try {
    const collectionPath = join(projectRoot, "src/content", collection);
    const filePath = getContentFilePath(collectionPath, id);

    if (!filePath) {
      return sendError(
        res,
        `Content '${id}' not found in '${collection}'`,
        404
      );
    }

    const result = await deleteContent(filePath);

    if (!result.success) {
      return sendError(res, result.error ?? "Failed to delete content", 500);
    }

    // Invalidate cache for this collection (content removed)
    const cache = getCache();
    cache.handleFileChange("unlink", collection);

    sendJson(res, {
      success: true,
      path: result.path,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to delete content: ${message}`, 500);
  }
};

/**
 * POST /api/images - Upload image
 *
 * Expects multipart/form-data with:
 * - file: The image file
 * - collection: Collection name
 * - contentId: Content ID (slug)
 */
const handleImageUpload: RouteHandler = async (req, res, _params, context) => {
  const { projectRoot, config } = context;

  try {
    // Read raw body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Get content type
    const contentType = req.headers["content-type"] ?? "";

    if (!contentType.includes("multipart/form-data")) {
      return sendWritenexError(
        res,
        new ApiBadRequestError("Content-Type must be multipart/form-data")
      );
    }

    // Parse multipart data
    const { file, fields } = parseMultipartFormData(body, contentType);

    if (!file) {
      return sendWritenexError(res, new ApiBadRequestError("No file uploaded"));
    }

    if (!fields.collection || !fields.contentId) {
      return sendWritenexError(
        res,
        new ApiBadRequestError("collection and contentId are required")
      );
    }

    if (!isValidImageFile(file.filename)) {
      return sendWritenexError(
        res,
        new ImageInvalidTypeError(file.filename, [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".avif",
          ".svg",
        ])
      );
    }

    // Upload image
    const result = await uploadImage({
      filename: file.filename,
      data: file.data,
      collection: fields.collection,
      contentId: fields.contentId,
      projectRoot,
      config: config.images,
    });

    if (!result.success) {
      return sendError(res, result.error ?? "Failed to upload image", 500);
    }

    sendJson(res, {
      success: true,
      path: result.path,
      url: result.url,
    });
  } catch (error) {
    const wrappedError = isWritenexError(error)
      ? error
      : wrapError(error, WritenexErrorCode.IMAGE_UPLOAD_ERROR);
    sendWritenexError(res, wrappedError);
  }
};

/**
 * GET /api/images/:collection/:contentId - Discover images for content
 *
 * Returns list of discovered images for a content item.
 * Results are cached for performance.
 *
 * Response:
 * {
 *   success: boolean;
 *   images: DiscoveredImage[];
 *   contentPath: string;
 * }
 */
const handleImageDiscovery: RouteHandler = async (
  _req,
  res,
  params,
  context
) => {
  const { collection, id: contentId } = params;
  const { projectRoot } = context;

  if (!collection || !contentId) {
    return sendError(res, "Collection and content ID required", 400);
  }

  const cache = getCache();

  try {
    const collectionPath = join(projectRoot, "src/content", collection);

    // Check if collection exists by discovering collections
    let collections = cache.getCollections();
    if (!collections) {
      // Cache miss - discover collections
      collections = await discoverCollections(projectRoot);
      cache.setCollections(collections);
    }

    if (!collections.some((c) => c.name === collection)) {
      return sendError(res, `Collection '${collection}' not found`, 404);
    }

    // Check if content exists
    const contentFilePath = getContentFilePath(collectionPath, contentId);
    if (!contentFilePath) {
      return sendError(
        res,
        `Content '${contentId}' not found in '${collection}'`,
        404
      );
    }

    // Try to get from cache first
    let images = cache.getImages(collection, contentId);

    if (!images) {
      // Cache miss - discover images
      const result = await discoverContentImages(collectionPath, contentId);

      if (!result.success) {
        return sendError(res, result.error ?? "Failed to discover images", 500);
      }

      images = result.images;

      // Store in cache
      cache.setImages(collection, contentId, images);
    }

    sendJson(res, {
      success: true,
      images,
      contentPath: contentFilePath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to discover images: ${message}`, 500);
  }
};

/**
 * MIME types for image files
 */
const IMAGE_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

/**
 * GET /api/images/:collection/:contentId/* - Serve image file
 *
 * Serves an image file from the content folder.
 * This allows the editor to display images with relative paths.
 */
const handleServeImage = async (
  _req: IncomingMessage,
  res: ServerResponse,
  params: RouteParams,
  imagePath: string,
  context: MiddlewareContext
): Promise<void> => {
  const { collection, id: contentId } = params;
  const { projectRoot } = context;

  if (!collection || !contentId) {
    return sendWritenexError(
      res,
      new ApiBadRequestError("Collection and content ID required")
    );
  }

  try {
    const collectionPath = join(projectRoot, "src/content", collection);

    // Check if content exists
    const contentFilePath = getContentFilePath(collectionPath, contentId);
    if (!contentFilePath) {
      return sendWritenexError(
        res,
        new ContentNotFoundError(collection, contentId)
      );
    }

    // Build the full image path
    // For folder-based content (index.md), images are in the same folder
    // For flat files (slug.md), images are in a sibling folder with the same name
    let fullImagePath: string;

    if (
      contentFilePath.endsWith("/index.md") ||
      contentFilePath.endsWith("/index.mdx")
    ) {
      // Folder-based: content is at slug/index.md, images are at slug/imagePath
      const contentFolder = contentFilePath.replace(/\/index\.mdx?$/, "");
      fullImagePath = join(contentFolder, imagePath);
    } else {
      // Flat file: content is at slug.md, images are at slug/imagePath
      fullImagePath = join(collectionPath, contentId, imagePath);
    }

    // Security check: ensure the path is within the content folder
    const normalizedPath = join(fullImagePath);
    if (!normalizedPath.startsWith(collectionPath)) {
      return sendWritenexError(
        res,
        new PathTraversalError(imagePath, collectionPath)
      );
    }

    // Check if file exists
    if (!existsSync(fullImagePath)) {
      return sendWritenexError(res, new ImageNotFoundError(imagePath));
    }

    // Get file stats
    const stats = statSync(fullImagePath);
    if (!stats.isFile()) {
      return sendWritenexError(
        res,
        new ApiBadRequestError("Requested path is not a file")
      );
    }

    // Determine MIME type
    const ext = extname(fullImagePath).toLowerCase();
    const mimeType = IMAGE_MIME_TYPES[ext] ?? "application/octet-stream";

    // Set headers
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Stream the file
    const stream = createReadStream(fullImagePath);
    stream.pipe(res);
  } catch (error) {
    const wrappedError = isWritenexError(error)
      ? error
      : wrapError(error, WritenexErrorCode.API_INTERNAL_ERROR);
    sendWritenexError(res, wrappedError);
  }
};

// =============================================================================
// Version History Route Handlers
// =============================================================================

/**
 * Get the resolved version history config with all required fields
 *
 * @param config - The version history config from context
 * @returns Resolved config with all required fields
 */
function getResolvedVersionConfig(
  config: VersionHistoryConfig | undefined
): Required<VersionHistoryConfig> {
  return {
    enabled: config?.enabled ?? true,
    maxVersions: config?.maxVersions ?? 20,
    storagePath: config?.storagePath ?? ".writenex/versions",
  };
}

/**
 * GET /api/versions/:collection/:id - List all versions
 *
 * Returns versions sorted by timestamp in descending order (newest first).
 *
 * Response:
 * {
 *   success: boolean;
 *   versions: VersionEntry[];
 *   total: number;
 * }
 */
const handleListVersions: RouteHandler = async (_req, res, params, context) => {
  const { collection, id } = params;
  const { projectRoot, config } = context;

  if (!collection || !id) {
    return sendError(res, "Collection and content ID required", 400);
  }

  try {
    const versionConfig = getResolvedVersionConfig(config.versionHistory);

    const versions = await getVersions(
      projectRoot,
      collection,
      id,
      versionConfig
    );

    sendJson(res, {
      success: true,
      versions,
      total: versions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to list versions: ${message}`, 500);
  }
};

/**
 * GET /api/versions/:collection/:id/:versionId - Get specific version
 *
 * Returns the full content of a specific version.
 *
 * Response:
 * {
 *   success: boolean;
 *   version: Version;
 * }
 */
const handleGetVersion: RouteHandler = async (_req, res, params, context) => {
  const { collection, id, versionId } = params;
  const { projectRoot, config } = context;

  if (!collection || !id || !versionId) {
    return sendWritenexError(
      res,
      new ApiBadRequestError("Collection, content ID, and version ID required")
    );
  }

  try {
    const versionConfig = getResolvedVersionConfig(config.versionHistory);

    const version = await getVersion(
      projectRoot,
      collection,
      id,
      versionId,
      versionConfig
    );

    if (!version) {
      return sendWritenexError(
        res,
        new VersionNotFoundError(collection, id, versionId)
      );
    }

    sendJson(res, {
      success: true,
      version,
    });
  } catch (error) {
    const wrappedError = isWritenexError(error)
      ? error
      : wrapError(error, WritenexErrorCode.API_INTERNAL_ERROR);
    sendWritenexError(res, wrappedError);
  }
};

/**
 * POST /api/versions/:collection/:id - Create manual version
 *
 * Creates a manual version snapshot with optional label.
 *
 * Request body:
 * {
 *   label?: string;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   version?: VersionEntry;
 * }
 */
const handleCreateVersion: RouteHandler = async (req, res, params, context) => {
  const { collection, id } = params;
  const { projectRoot, config } = context;

  if (!collection || !id) {
    return sendError(res, "Collection and content ID required", 400);
  }

  try {
    const versionConfig = getResolvedVersionConfig(config.versionHistory);

    // Check if version history is enabled
    if (!versionConfig.enabled) {
      return sendError(res, "Version history is disabled", 400);
    }

    // Parse request body for optional label
    const body = await parseJsonBody(req);
    const label =
      body && typeof body === "object" && "label" in body
        ? String(body.label)
        : undefined;

    // Get current content
    const collectionPath = join(projectRoot, "src/content", collection);
    const filePath = getContentFilePath(collectionPath, id);

    if (!filePath) {
      return sendError(
        res,
        `Content '${id}' not found in '${collection}'`,
        404
      );
    }

    // Read current content
    const readResult = await readContentFile(filePath, collectionPath);

    if (!readResult.success || !readResult.content) {
      return sendError(res, readResult.error ?? "Failed to read content", 500);
    }

    // Create version
    const result = await saveVersion(
      projectRoot,
      collection,
      id,
      readResult.content.raw,
      versionConfig,
      { label }
    );

    if (!result.success) {
      return sendError(res, result.error ?? "Failed to create version", 500);
    }

    sendJson(res, {
      success: true,
      version: result.version,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to create version: ${message}`, 500);
  }
};

/**
 * POST /api/versions/:collection/:id/:versionId/restore - Restore version
 *
 * Restores a version to the current content file.
 * Creates a safety snapshot before restoring.
 *
 * Response:
 * {
 *   success: boolean;
 *   version?: VersionEntry;
 *   content?: string;
 *   safetySnapshot?: VersionEntry;
 * }
 */
const handleRestoreVersion: RouteHandler = async (
  _req,
  res,
  params,
  context
) => {
  const { collection, id, versionId } = params;
  const { projectRoot, config } = context;

  if (!collection || !id || !versionId) {
    return sendError(
      res,
      "Collection, content ID, and version ID required",
      400
    );
  }

  try {
    const versionConfig = getResolvedVersionConfig(config.versionHistory);

    // Get content file path
    const collectionPath = join(projectRoot, "src/content", collection);
    const filePath = getContentFilePath(collectionPath, id);

    if (!filePath) {
      return sendError(
        res,
        `Content '${id}' not found in '${collection}'`,
        404
      );
    }

    // Restore version
    const result = await restoreVersion(
      projectRoot,
      collection,
      id,
      versionId,
      filePath,
      versionConfig
    );

    if (!result.success) {
      // Check if it's a not found error
      if (result.error?.includes("not found")) {
        return sendError(res, result.error, 404);
      }
      return sendError(res, result.error ?? "Failed to restore version", 500);
    }

    // Invalidate cache for this collection (content modified)
    const cache = getCache();
    cache.handleFileChange("change", collection);

    sendJson(res, {
      success: true,
      version: result.version,
      content: result.content,
      safetySnapshot: result.safetySnapshot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to restore version: ${message}`, 500);
  }
};

/**
 * GET /api/versions/:collection/:id/:versionId/diff - Get diff data
 *
 * Returns both the version content and current content for comparison.
 *
 * Response:
 * {
 *   success: boolean;
 *   version: Version;
 *   current: {
 *     content: string;
 *     frontmatter: Record<string, unknown>;
 *     body: string;
 *   };
 * }
 */
const handleGetVersionDiff: RouteHandler = async (
  _req,
  res,
  params,
  context
) => {
  const { collection, id, versionId } = params;
  const { projectRoot, config } = context;

  if (!collection || !id || !versionId) {
    return sendError(
      res,
      "Collection, content ID, and version ID required",
      400
    );
  }

  try {
    const versionConfig = getResolvedVersionConfig(config.versionHistory);

    // Get version content
    const version = await getVersion(
      projectRoot,
      collection,
      id,
      versionId,
      versionConfig
    );

    if (!version) {
      return sendError(res, `Version '${versionId}' not found`, 404);
    }

    // Get current content
    const collectionPath = join(projectRoot, "src/content", collection);
    const filePath = getContentFilePath(collectionPath, id);

    if (!filePath) {
      return sendError(
        res,
        `Content '${id}' not found in '${collection}'`,
        404
      );
    }

    const readResult = await readContentFile(filePath, collectionPath);

    if (!readResult.success || !readResult.content) {
      return sendError(
        res,
        readResult.error ?? "Failed to read current content",
        500
      );
    }

    sendJson(res, {
      success: true,
      version,
      current: {
        content: readResult.content.raw,
        frontmatter: readResult.content.frontmatter,
        body: readResult.content.body,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to get diff data: ${message}`, 500);
  }
};

/**
 * DELETE /api/versions/:collection/:id/:versionId - Delete specific version
 *
 * Deletes a specific version file and removes it from the manifest.
 *
 * Response:
 * {
 *   success: boolean;
 *   version?: VersionEntry;
 * }
 */
const handleDeleteVersion: RouteHandler = async (
  _req,
  res,
  params,
  context
) => {
  const { collection, id, versionId } = params;
  const { projectRoot, config } = context;

  if (!collection || !id || !versionId) {
    return sendError(
      res,
      "Collection, content ID, and version ID required",
      400
    );
  }

  try {
    const versionConfig = getResolvedVersionConfig(config.versionHistory);

    const result = await deleteVersion(
      projectRoot,
      collection,
      id,
      versionId,
      versionConfig
    );

    if (!result.success) {
      // Check if it's a not found error
      if (result.error?.includes("not found")) {
        return sendError(res, result.error, 404);
      }
      return sendError(res, result.error ?? "Failed to delete version", 500);
    }

    sendJson(res, {
      success: true,
      version: result.version,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to delete version: ${message}`, 500);
  }
};

/**
 * DELETE /api/versions/:collection/:id - Clear all versions
 *
 * Deletes all version files for a content item and resets the manifest.
 *
 * Response:
 * {
 *   success: boolean;
 * }
 */
const handleClearVersions: RouteHandler = async (
  _req,
  res,
  params,
  context
) => {
  const { collection, id } = params;
  const { projectRoot, config } = context;

  if (!collection || !id) {
    return sendError(res, "Collection and content ID required", 400);
  }

  try {
    const versionConfig = getResolvedVersionConfig(config.versionHistory);

    const result = await clearVersions(
      projectRoot,
      collection,
      id,
      versionConfig
    );

    if (!result.success) {
      return sendError(res, result.error ?? "Failed to clear versions", 500);
    }

    sendJson(res, {
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to clear versions: ${message}`, 500);
  }
};
