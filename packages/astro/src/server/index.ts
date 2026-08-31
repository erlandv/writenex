/**
 * @fileoverview Server module exports for @writenex/astro
 *
 * This module provides the public API for server-side functionality,
 * including middleware, API routes, static assets, and caching.
 *
 * @module @writenex/astro/server
 */

// Assets
export {
  getClientDistPath,
  hasClientBundle,
  serveAsset,
  serveEditorHtml,
  serveLoginHtml,
} from "./assets";
// Auth (remote CMS)
export {
  createSessionManager,
  SESSION_COOKIE_NAME,
  SessionManager,
} from "./auth";
// Cache
export { getCache, resetCache, ServerCache } from "./cache";
export type { MiddlewareContext } from "./middleware";
// Middleware functions and types
export {
  createMiddleware,
  parseJsonBody,
  parseQueryParams,
  sendError,
  sendJson,
  sendWritenexError,
} from "./middleware";
export type { RemoteRuntimeConfig } from "./remote";
// Remote CMS production runtime
export { handleRemoteRequest } from "./remote";
// Generated production route modules
export {
  API_ROUTE_FILE,
  EDITOR_ROUTE_FILE,
  generateApiRouteModule,
  generateEditorRouteModule,
} from "./route-modules";
// Routes
export { createApiRouter } from "./routes";
