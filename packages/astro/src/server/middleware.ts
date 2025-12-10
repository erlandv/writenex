/**
 * @fileoverview Vite middleware for Writenex routes
 *
 * This module provides the main middleware handler that intercepts requests
 * to Writenex routes (/_writenex/*) and delegates to appropriate handlers.
 *
 * ## Route Structure:
 * - `/_writenex` - Editor UI (HTML page with React app)
 * - `/_writenex/api/*` - API endpoints for CRUD operations
 * - `/_writenex/assets/*` - Static assets (JS, CSS)
 *
 * @module @writenex/astro/server/middleware
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import type { WritenexConfig } from "../types";
import { createApiRouter } from "./routes";
import { serveEditorHtml, serveAsset } from "./assets";

/**
 * Middleware context passed to handlers
 */
export interface MiddlewareContext {
  /** Base path for Writenex routes */
  basePath: string;
  /** Project root directory */
  projectRoot: string;
  /** Resolved Writenex configuration */
  config: Required<WritenexConfig>;
}

/**
 * Create the Writenex middleware handler
 *
 * @param context - Middleware context with configuration
 * @returns Connect middleware function
 *
 * @example
 * ```typescript
 * const middleware = createMiddleware({
 *   basePath: '/_writenex',
 *   projectRoot: '/path/to/project',
 *   config: resolvedConfig,
 * });
 *
 * server.middlewares.use(middleware);
 * ```
 */
export function createMiddleware(
  context: MiddlewareContext
): Connect.NextHandleFunction {
  const { basePath } = context;
  const apiRouter = createApiRouter(context);

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction
  ) => {
    const url = req.url ?? "";

    // Only handle requests to our base path
    if (!url.startsWith(basePath)) {
      return next();
    }

    // Extract the path after base path
    const path = url.slice(basePath.length) || "/";

    try {
      // Handle API routes
      if (path.startsWith("/api/")) {
        return await apiRouter(req, res, path.slice(4)); // Remove '/api' prefix
      }

      // Handle static assets
      if (path.startsWith("/assets/")) {
        return await serveAsset(req, res, path.slice(8), context); // Remove '/assets' prefix
      }

      // Handle editor UI (root and any sub-routes for client-side routing)
      return await serveEditorHtml(req, res, context);
    } catch (error) {
      // Handle errors gracefully
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[writenex] Middleware error: ${message}`);

      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  };
}

/**
 * Parse URL query parameters
 *
 * @param url - The URL string to parse
 * @returns Object with query parameters
 */
export function parseQueryParams(url: string): Record<string, string> {
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return {};

  const queryString = url.slice(queryIndex + 1);
  const params: Record<string, string> = {};

  for (const pair of queryString.split("&")) {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
    }
  }

  return params;
}

/**
 * Parse request body as JSON
 *
 * @param req - The incoming request
 * @returns Parsed JSON body or null
 */
export async function parseJsonBody(
  req: IncomingMessage
): Promise<unknown | null> {
  return new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      if (!body) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });

    req.on("error", () => {
      resolve(null);
    });
  });
}

/**
 * Send JSON response
 *
 * @param res - The server response
 * @param data - Data to send as JSON
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendJson(
  res: ServerResponse,
  data: unknown,
  statusCode: number = 200
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

/**
 * Send error response
 *
 * @param res - The server response
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 */
export function sendError(
  res: ServerResponse,
  message: string,
  statusCode: number = 400
): void {
  sendJson(res, { error: message }, statusCode);
}
