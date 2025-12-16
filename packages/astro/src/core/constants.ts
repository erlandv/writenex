/**
 * @fileoverview Shared constants for @writenex/astro
 *
 * This module provides centralized constants used across the integration,
 * including version information, default paths, and configuration limits.
 *
 * @module @writenex/astro/core/constants
 */

/**
 * Current version of the @writenex/astro package
 */
export const WRITENEX_VERSION = "1.0.0";

/**
 * Default base path for the Writenex editor UI
 */
export const DEFAULT_BASE_PATH = "/_writenex";

/**
 * Default API path for Writenex API endpoints
 */
export const DEFAULT_API_PATH = "/_writenex/api";

/**
 * Supported image MIME types for upload
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

/**
 * Maximum allowed image file size in bytes (10MB)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
