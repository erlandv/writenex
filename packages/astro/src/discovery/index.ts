/**
 * @fileoverview Discovery module exports for @writenex/astro
 *
 * This module provides the public API for collection discovery,
 * file pattern detection, and schema auto-detection.
 *
 * @module @writenex/astro/discovery
 */

// Collection discovery
export {
  discoverCollections,
  mergeCollections,
  getCollection,
  collectionExists,
} from "./collections";

// Pattern detection
export {
  detectFilePattern,
  generatePathFromPattern,
  parsePatternTokens,
  validatePattern,
  getPatternExtension,
  resolvePatternTokens,
  isValidPattern,
  getSupportedTokens,
} from "./patterns";
export type { PatternDetectionResult, ResolveTokensOptions } from "./patterns";

// Schema detection
export { detectSchema, mergeSchema, describeSchema } from "./schema";
export type { SchemaDetectionResult } from "./schema";
