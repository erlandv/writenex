/**
 * @fileoverview Main entry point for @writenex/astro
 *
 * This file exports the Astro integration and configuration utilities.
 *
 * @module @writenex/astro
 * @example
 * ```typescript
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config';
 * import writenex from '@writenex/astro';
 *
 * export default defineConfig({
 *   integrations: [writenex()],
 * });
 * ```
 */

// Main integration
export { default, default as writenex } from "./integration";

// Configuration utilities
export { defineConfig, validateConfig } from "./config/schema";
export {
  loadConfig,
  findConfigFile,
  contentDirectoryExists,
} from "./config/loader";
export {
  applyConfigDefaults,
  applyCollectionDefaults,
  DEFAULT_IMAGE_CONFIG,
  DEFAULT_EDITOR_CONFIG,
  DEFAULT_DISCOVERY_CONFIG,
  DEFAULT_FILE_PATTERN,
  DEFAULT_CONTENT_PATH,
} from "./config/defaults";

// Filesystem utilities
export {
  readContentFile,
  readCollection,
  getCollectionSummaries,
  getCollectionCount,
  checkCollection,
  isContentFile,
  extractSlug,
  generateExcerpt,
  toContentSummary,
  getFileStats,
} from "./filesystem/reader";
export {
  createContent,
  updateContent,
  deleteContent,
  generateSlug,
  generateUniqueSlug,
  getContentFilePath,
} from "./filesystem/writer";
export type { ReadContentOptions, ReadFileResult } from "./filesystem/reader";
export type {
  CreateContentOptions,
  UpdateContentOptions,
  WriteResult,
} from "./filesystem/writer";
export {
  ContentWatcher,
  FileModificationTracker,
  createContentWatcher,
} from "./filesystem/watcher";
export type {
  FileChangeType,
  FileChangeEvent,
  WatcherOptions,
} from "./filesystem/watcher";
export type { LoadConfigResult } from "./config/loader";

// Server utilities
export { createMiddleware } from "./server/middleware";
export type { MiddlewareContext } from "./server/middleware";
export { createApiRouter } from "./server/routes";
export { serveEditorHtml, serveAsset, hasClientBundle } from "./server/assets";

// Discovery utilities
export {
  discoverCollections,
  mergeCollections,
  getCollection,
  collectionExists,
} from "./discovery/collections";
export {
  detectFilePattern,
  generatePathFromPattern,
  parsePatternTokens,
  validatePattern,
  getPatternExtension,
} from "./discovery/patterns";
export type { PatternDetectionResult } from "./discovery/patterns";
export { detectSchema, mergeSchema, describeSchema } from "./discovery/schema";
export type { SchemaDetectionResult } from "./discovery/schema";

// Types
export type {
  WritenexConfig,
  WritenexOptions,
  CollectionConfig,
  CollectionSchema,
  SchemaField,
  ImageConfig,
  ImageStrategy,
  DiscoveryConfig,
  EditorConfig,
  ContentItem,
  ContentSummary,
  DiscoveredCollection,
} from "./types";
