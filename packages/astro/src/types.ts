/**
 * @fileoverview Type definitions for @writenex/astro
 *
 * This file contains all TypeScript type definitions used across the
 * Writenex Astro integration package.
 *
 * @module @writenex/astro/types
 */

import type { AstroIntegration } from "astro";

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Field type definitions for frontmatter schema
 */
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "image"
  | "object";

/**
 * Schema field definition for frontmatter
 */
export interface SchemaField {
  /** The type of the field */
  type: FieldType;
  /** Whether the field is required */
  required?: boolean;
  /** Default value for the field */
  default?: unknown;
  /** For array types, the type of items */
  items?: string;
  /** Description shown in the editor */
  description?: string;
}

/**
 * Collection schema definition
 */
export type CollectionSchema = Record<string, SchemaField>;

/**
 * Image handling strategy
 */
export type ImageStrategy = "colocated" | "public" | "custom";

/**
 * Image configuration for a collection
 */
export interface ImageConfig {
  /** Where to store uploaded images */
  strategy: ImageStrategy;
  /** URL path prefix for images */
  publicPath?: string;
  /** Filesystem path for storing images (for 'public' and 'custom' strategies) */
  storagePath?: string;
}

/**
 * Collection configuration
 */
export interface CollectionConfig {
  /** Unique name of the collection */
  name: string;
  /** Filesystem path to the collection (relative to project root) */
  path: string;
  /** File naming pattern using tokens like {slug}, {date}, {year}, etc. */
  filePattern?: string;
  /** URL pattern for preview links */
  previewUrl?: string;
  /** Frontmatter schema definition */
  schema?: CollectionSchema;
  /** Image handling configuration for this collection */
  images?: ImageConfig;
}

/**
 * Discovery configuration for auto-detecting collections
 */
export interface DiscoveryConfig {
  /** Whether auto-discovery is enabled */
  enabled: boolean;
  /** Glob patterns to ignore during discovery */
  ignore?: string[];
}

/**
 * Editor behavior configuration
 */
export interface EditorConfig {
  /** Whether autosave is enabled */
  autosave?: boolean;
  /** Autosave interval in milliseconds */
  autosaveInterval?: number;
}

/**
 * Main Writenex configuration
 */
export interface WritenexConfig {
  /** Collection definitions */
  collections?: CollectionConfig[];
  /** Global image configuration */
  images?: ImageConfig;
  /** Editor behavior configuration */
  editor?: EditorConfig;
  /** Auto-discovery configuration */
  discovery?: DiscoveryConfig;
}

/**
 * Options passed to the Writenex integration
 */
export interface WritenexOptions {
  /**
   * Allow the integration to run in production builds.
   * Use with caution - only enable for staging/preview environments.
   * @default false
   */
  allowProduction?: boolean;
  /**
   * Base path for the Writenex editor UI
   * @default '/_writenex'
   */
  basePath?: string;
}

// =============================================================================
// Content Types
// =============================================================================

/**
 * Parsed content item with frontmatter and body
 */
export interface ContentItem {
  /** Unique identifier (typically the slug) */
  id: string;
  /** Filesystem path to the content file */
  path: string;
  /** Parsed frontmatter data */
  frontmatter: Record<string, unknown>;
  /** Markdown body content */
  body: string;
  /** Raw file content (frontmatter + body) */
  raw: string;
}

/**
 * Content item summary for listing
 */
export interface ContentSummary {
  /** Unique identifier */
  id: string;
  /** Filesystem path */
  path: string;
  /** Title from frontmatter */
  title: string;
  /** Publication date */
  pubDate?: string;
  /** Draft status */
  draft?: boolean;
  /** Content excerpt */
  excerpt?: string;
}

/**
 * Discovered collection with metadata
 */
export interface DiscoveredCollection {
  /** Collection name */
  name: string;
  /** Filesystem path */
  path: string;
  /** Detected file pattern */
  filePattern: string;
  /** Number of content files */
  count: number;
  /** Detected/configured schema */
  schema?: CollectionSchema;
  /** URL pattern for preview links */
  previewUrl?: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * API response for collections endpoint
 */
export interface CollectionsResponse {
  collections: DiscoveredCollection[];
}

/**
 * API response for content list endpoint
 */
export interface ContentListResponse {
  items: ContentSummary[];
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
  success: boolean;
  id?: string;
  path?: string;
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

// =============================================================================
// Internal Types
// =============================================================================

/**
 * Resolved configuration with defaults applied
 */
export interface ResolvedConfig extends Required<WritenexConfig> {
  /** Resolved collection configurations */
  collections: Required<CollectionConfig>[];
}

/**
 * Integration factory function type
 */
export type WritenexIntegration = (
  options?: WritenexOptions
) => AstroIntegration;
