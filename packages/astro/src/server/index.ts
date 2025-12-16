/**
 * @fileoverview Server module exports for @writenex/astro
 *
 * This module provides the public API for server-side functionality,
 * including middleware, API routes, static assets, and caching.
 *
 * @module @writenex/astro/server
 */

// Middleware functions and types
export {
  createMiddleware,
  parseQueryParams,
  parseJsonBody,
  sendJson,
  sendError,
  sendWritenexError,
} from "./middleware";
export type { MiddlewareContext } from "./middleware";

// Routes
export { createApiRouter } from "./routes";

// Assets
export {
  serveEditorHtml,
  serveAsset,
  getClientDistPath,
  hasClientBundle,
} from "./assets";

// Cache
export { ServerCache, getCache, resetCache } from "./cache";
