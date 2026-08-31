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
  collectionExists,
  discoverCollections,
  getCollection,
  mergeCollections,
} from "./collections";
export type { PatternDetectionResult, ResolveTokensOptions } from "./patterns";
// Pattern detection
export {
  detectFilePattern,
  generatePathFromPattern,
  getPatternExtension,
  getSupportedTokens,
  isValidPattern,
  parsePatternTokens,
  resolvePatternTokens,
  validatePattern,
} from "./patterns";
export type { SchemaDetectionResult } from "./schema";
// Schema detection
export { describeSchema, detectSchema, mergeSchema } from "./schema";
