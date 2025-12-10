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
 * - POST /api/images - Upload image
 *
 * @module @writenex/astro/server/routes
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import type { MiddlewareContext } from "./middleware";
import {
  sendJson,
  sendError,
  parseQueryParams,
  parseJsonBody,
} from "./middleware";
import { getCache } from "./cache";
import {
  discoverCollections,
  mergeCollections,
} from "../discovery/collections";
import { getCollectionSummaries, readContentFile } from "../filesystem/reader";
import {
  createContent,
  updateContent,
  deleteContent,
  getContentFilePath,
} from "../filesystem/writer";
import {
  uploadImage,
  parseMultipartFormData,
  isValidImageFile,
} from "../filesystem/images";

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
      return sendError(res, "Method not allowed", 405);
    }

    // Route: /config
    if (segments[0] === "config") {
      if (method === "GET") {
        return handleGetConfig(req, res, params, context);
      }
      return sendError(res, "Method not allowed", 405);
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
          return sendError(res, "Method not allowed", 405);
      }
    }

    // Route: /images
    if (segments[0] === "images") {
      if (method === "POST") {
        return handleImageUpload(req, res, params, context);
      }
      return sendError(res, "Method not allowed", 405);
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
 * Returns the current Writenex configuration including image settings.
 */
const handleGetConfig: RouteHandler = async (_req, res, _params, context) => {
  const { config } = context;

  sendJson(res, {
    images: config.images,
    editor: config.editor,
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
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to discover collections: ${message}`, 500);
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
    return sendError(res, "Collection name required", 400);
  }

  const cache = getCache();

  try {
    const collectionPath = join(projectRoot, "src/content", collection);

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
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[writenex] List content error:", error);
    sendError(res, `Failed to list content: ${message}`, 500);
  }
};

/**
 * GET /api/content/:collection/:id - Get single content item
 */
const handleGetContent: RouteHandler = async (_req, res, params, context) => {
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

    const result = await readContentFile(filePath, collectionPath);

    if (!result.success || !result.content) {
      return sendError(res, result.error ?? "Failed to read content", 500);
    }

    sendJson(res, result.content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to get content: ${message}`, 500);
  }
};

/**
 * POST /api/content/:collection - Create new content
 */
const handleCreateContent: RouteHandler = async (req, res, params, context) => {
  const { collection } = params;
  const { projectRoot } = context;

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

    const result = await createContent(collectionPath, {
      frontmatter,
      body: contentBody ?? "",
      slug,
    });

    if (!result.success) {
      return sendError(res, result.error ?? "Failed to create content", 500);
    }

    // Invalidate cache for this collection (new content added)
    const cache = getCache();
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
 */
const handleUpdateContent: RouteHandler = async (req, res, params, context) => {
  const { collection, id } = params;
  const { projectRoot } = context;

  if (!collection || !id) {
    return sendError(res, "Collection and content ID required", 400);
  }

  try {
    const body = await parseJsonBody(req);

    if (!body || typeof body !== "object") {
      return sendError(res, "Invalid request body", 400);
    }

    const { frontmatter, body: contentBody } = body as {
      frontmatter?: Record<string, unknown>;
      body?: string;
    };

    const collectionPath = join(projectRoot, "src/content", collection);
    const filePath = getContentFilePath(collectionPath, id);

    if (!filePath) {
      return sendError(
        res,
        `Content '${id}' not found in '${collection}'`,
        404
      );
    }

    const result = await updateContent(filePath, collectionPath, {
      frontmatter,
      body: contentBody,
    });

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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to update content: ${message}`, 500);
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
      return sendError(res, "Content-Type must be multipart/form-data", 400);
    }

    // Parse multipart data
    const { file, fields } = parseMultipartFormData(body, contentType);

    if (!file) {
      return sendError(res, "No file uploaded", 400);
    }

    if (!fields.collection || !fields.contentId) {
      return sendError(res, "collection and contentId are required", 400);
    }

    if (!isValidImageFile(file.filename)) {
      return sendError(res, "Invalid image file type", 400);
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
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, `Failed to upload image: ${message}`, 500);
  }
};
