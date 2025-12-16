/**
 * @fileoverview Main entry point for @writenex/astro
 *
 * This file exports the minimal public API for the Astro integration.
 * For advanced usage, import from sub-modules:
 * - @writenex/astro/config
 * - @writenex/astro/discovery
 * - @writenex/astro/filesystem
 * - @writenex/astro/server
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

// =============================================================================
// Main Integration
// =============================================================================

export { default, default as writenex } from "./integration";

// =============================================================================
// Configuration Utilities (most commonly used)
// =============================================================================

export { defineConfig, validateConfig, loadConfig } from "@/config";

// =============================================================================
// Core Types (essential for consumers)
// =============================================================================

export type {
  WritenexConfig,
  WritenexOptions,
  CollectionConfig,
  CollectionSchema,
  SchemaField,
  FieldType,
  ImageConfig,
  ImageStrategy,
  DiscoveryConfig,
  EditorConfig,
  ContentItem,
  ContentSummary,
  DiscoveredCollection,
  VersionHistoryConfig,
} from "@/types";

// =============================================================================
// Error Handling (commonly needed)
// =============================================================================

export { WritenexError, WritenexErrorCode, isWritenexError } from "@/core";
