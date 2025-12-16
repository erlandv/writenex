/**
 * @fileoverview Configuration module exports for @writenex/astro
 *
 * This module provides the public API for configuration handling,
 * including schema validation, config loading, and default values.
 *
 * @module @writenex/astro/config
 */

// Schema and validation
export {
  defineConfig,
  validateConfig,
  writenexConfigSchema,
  writenexOptionsSchema,
} from "./schema";

// Config loader
export { loadConfig, findConfigFile, contentDirectoryExists } from "./loader";
export type { LoadConfigResult } from "./loader";

// Defaults and constants
export {
  applyConfigDefaults,
  applyCollectionDefaults,
  DEFAULT_IMAGE_CONFIG,
  DEFAULT_EDITOR_CONFIG,
  DEFAULT_DISCOVERY_CONFIG,
  DEFAULT_VERSION_HISTORY_CONFIG,
  DEFAULT_FILE_PATTERN,
  DEFAULT_CONTENT_PATH,
} from "./defaults";
