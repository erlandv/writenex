/**
 * @fileoverview Configuration-related type definitions for @writenex/astro
 *
 * This file contains all TypeScript type definitions related to configuration,
 * including collection config, image config, editor config, and discovery config.
 *
 * @module @writenex/astro/types/config
 */

import type { VersionHistoryConfig } from "./version";

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
  /** Version history configuration */
  versionHistory?: VersionHistoryConfig;
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
}

/**
 * Resolved configuration with defaults applied
 */
export interface ResolvedConfig extends Required<WritenexConfig> {
  /** Resolved collection configurations */
  collections: Required<CollectionConfig>[];
}
