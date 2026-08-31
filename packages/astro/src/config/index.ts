/**
 * @fileoverview Configuration module exports for @writenex/astro
 *
 * This module provides the public API for configuration handling,
 * including schema validation, config loading, and default values.
 *
 * @module @writenex/astro/config
 */

export type { FieldDefinition, FieldKind, ValidationOptions } from "@/fields";
// Fields API
export { collection, fields, singleton } from "@/fields";
// Defaults and constants
export {
  applyCollectionDefaults,
  applyConfigDefaults,
  DEFAULT_CONTENT_PATH,
  DEFAULT_DISCOVERY_CONFIG,
  DEFAULT_EDITOR_CONFIG,
  DEFAULT_FILE_PATTERN,
  DEFAULT_IMAGE_CONFIG,
  DEFAULT_VERSION_HISTORY_CONFIG,
} from "./defaults";
export type { LoadConfigResult } from "./loader";
// Config loader
export { contentDirectoryExists, findConfigFile, loadConfig } from "./loader";
// Schema and validation
export type { WritenexConfigInput } from "./schema";
export {
  defineConfig,
  validateConfig,
  writenexConfigSchema,
  writenexOptionsSchema,
} from "./schema";
