/**
 * @fileoverview Configuration-related type definitions for @writenex/astro
 *
 * This file contains all TypeScript type definitions related to configuration,
 * including collection config, image config, editor config, and discovery config.
 *
 * @module @writenex/astro/types/config
 */

import type { VersionHistoryConfig } from "./version";

export type FieldKind =
  | "text"
  | "slug"
  | "url"
  | "number"
  | "integer"
  | "select"
  | "multiselect"
  | "checkbox"
  | "date"
  | "datetime"
  | "image"
  | "file"
  | "object"
  | "array"
  | "blocks"
  | "relationship"
  | "path-reference"
  | "markdoc"
  | "mdx"
  | "conditional"
  | "child"
  | "cloud-image"
  | "empty"
  | "empty-content"
  | "empty-document"
  | "ignored";

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "image"
  | "object"
  | "file"
  | "blocks"
  | "relationship"
  | "markdoc"
  | "mdx"
  | "child"
  | "slug"
  | "url"
  | "integer"
  | "select"
  | "multiselect"
  | "datetime"
  | "cloud-image"
  | "path-reference"
  | "conditional"
  | "empty"
  | "empty-content"
  | "empty-document"
  | "ignored"
  | "checkbox";

export interface ValidationOptions {
  isRequired?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternDescription?: string;
}

export interface SchemaField {
  type: FieldType;
  required?: boolean;
  default?: unknown;
  items?: string;
  description?: string;
  label?: string;
  options?: string[];
  directory?: string;
  publicPath?: string;
  validation?: ValidationOptions;
  fields?: Record<string, SchemaField>;
  itemField?: SchemaField;
  blockTypes?: Record<string, SchemaField>;
  collection?: string;
  multiline?: boolean;
  format?: string;
  itemLabel?: string;
  matchField?: string;
  matchValue?: unknown;
  showField?: SchemaField;
  accept?: string;
  allowExternal?: boolean;
  inline?: boolean;
}

export type CollectionSchema = Record<string, SchemaField>;

export type ImageStrategy = "colocated" | "public" | "custom";

export interface ImageConfig {
  strategy: ImageStrategy;
  publicPath?: string;
  storagePath?: string;
}

export interface CollectionConfig {
  name: string;
  path: string;
  filePattern?: string;
  previewUrl?: string;
  schema?: CollectionSchema;
  images?: ImageConfig;
}

export interface SingletonConfig {
  name: string;
  path: string;
  previewUrl?: string;
  schema?: CollectionSchema;
  images?: ImageConfig;
}

export interface DiscoveryConfig {
  enabled: boolean;
  ignore?: string[];
}

export interface EditorConfig {
  autosave?: boolean;
  autosaveInterval?: number;
}

/**
 * Remote CMS configuration
 *
 * When enabled, all `/_writenex/*` routes are protected behind a login
 * screen (username + password). Credentials can be provided directly or
 * via environment variables (`WRITENEX_CMS_USER` / `WRITENEX_CMS_PASS`).
 */
export interface RemoteCmsConfig {
  /** Enable the remote CMS auth gate */
  enabled: boolean;
  /** Admin username (falls back to WRITENEX_CMS_USER env var) */
  username?: string;
  /** Admin password (falls back to WRITENEX_CMS_PASS env var) */
  password?: string;
  /** Secret used to sign session tokens (falls back to WRITENEX_SECRET env var, otherwise auto-generated) */
  secret?: string;
  /** Session lifetime in seconds (default: 7 days) */
  sessionTtl?: number;
}

/**
 * Remote CMS configuration with all fields resolved (defaults applied)
 */
export interface ResolvedRemoteCmsConfig extends Required<RemoteCmsConfig> {}

export interface WritenexConfig {
  collections?: CollectionConfig[];
  singletons?: SingletonConfig[];
  images?: ImageConfig;
  editor?: EditorConfig;
  discovery?: DiscoveryConfig;
  versionHistory?: VersionHistoryConfig;
  remoteCms?: RemoteCmsConfig;
}

export interface WritenexOptions {
  allowProduction?: boolean;
  /** Remote CMS auth settings (overrides writenex.config.ts remoteCms section) */
  remoteCms?: RemoteCmsConfig;
}

export interface ResolvedConfig extends Required<WritenexConfig> {
  collections: Required<CollectionConfig>[];
  singletons: Required<SingletonConfig>[];
  remoteCms: ResolvedRemoteCmsConfig;
}
