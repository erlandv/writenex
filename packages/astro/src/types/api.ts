/**
 * @fileoverview API response type definitions for @writenex/astro
 *
 * This file contains all TypeScript type definitions related to API responses,
 * including collections, content list, content item, mutation, and image upload responses.
 *
 * @module @writenex/astro/types/api
 */

import type {
  ContentItem,
  ContentSummary,
  DiscoveredCollection,
} from "./content";

/**
 * API response for collections endpoint
 */
export interface CollectionsResponse {
  /** List of discovered collections */
  collections: DiscoveredCollection[];
}

/**
 * API response for content list endpoint
 */
export interface ContentListResponse {
  /** List of content summaries */
  items: ContentSummary[];
  /** Total number of items */
  total: number;
}

/**
 * API response for single content endpoint
 */
export interface ContentResponse extends ContentItem {}

/**
 * API response for create/update operations
 */
export interface MutationResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Content item ID if operation succeeded */
  id?: string;
  /** Filesystem path if operation succeeded */
  path?: string;
  /** Error message if operation failed */
  error?: string;
}

/**
 * API response for image upload
 */
export interface ImageUploadResponse {
  /** Markdown-compatible path for the image */
  path: string;
  /** Public URL for the image */
  url: string;
}
