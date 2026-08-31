/**
 * @fileoverview Default configuration values for @writenex/astro
 *
 * This module provides default values for all configuration options.
 * These defaults are applied when loading configuration to ensure
 * all required values are present.
 *
 * @module @writenex/astro/config/defaults
 */

import type {
  CollectionConfig,
  DiscoveryConfig,
  EditorConfig,
  ImageConfig,
  RemoteCmsConfig,
  ResolvedRemoteCmsConfig,
  VersionHistoryConfig,
  WritenexConfig,
} from "@/types";

/**
 * Default image configuration
 */
export const DEFAULT_IMAGE_CONFIG: Required<ImageConfig> = {
  strategy: "colocated",
  publicPath: "/images",
  storagePath: "public/images",
};

/**
 * Default editor configuration
 */
export const DEFAULT_EDITOR_CONFIG: Required<EditorConfig> = {
  autosave: true,
  autosaveInterval: 3000,
};

/**
 * Default discovery configuration
 */
export const DEFAULT_DISCOVERY_CONFIG: Required<DiscoveryConfig> = {
  enabled: true,
  ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
};

/**
 * Default version history configuration
 */
export const DEFAULT_VERSION_HISTORY_CONFIG: Required<VersionHistoryConfig> = {
  enabled: true,
  maxVersions: 20,
  storagePath: ".writenex/versions",
};

/**
 * Default remote CMS configuration
 */
export const DEFAULT_REMOTE_CMS_CONFIG: Required<RemoteCmsConfig> = {
  enabled: false,
  username: "",
  password: "",
  secret: "",
  sessionTtl: 7 * 24 * 60 * 60,
};

/**
 * Environment variable names for remote CMS credentials
 */
export const REMOTE_CMS_ENV_VARS = {
  username: "WRITENEX_CMS_USER",
  password: "WRITENEX_CMS_PASS",
  secret: "WRITENEX_SECRET",
} as const;

/**
 * Apply defaults to the remote CMS configuration
 *
 * Explicit non-empty config values take precedence over environment
 * variables. Empty strings are treated as "not set" so they don't shadow
 * environment variables when merging pre-resolved configs. Credentials
 * not set in either place resolve to empty strings; the integration
 * treats those as "not configured" and fails closed.
 */
export function applyRemoteCmsDefaults(
  remoteCms: RemoteCmsConfig | undefined
): ResolvedRemoteCmsConfig {
  const base = remoteCms ?? DEFAULT_REMOTE_CMS_CONFIG;
  return {
    enabled: base.enabled ?? DEFAULT_REMOTE_CMS_CONFIG.enabled,
    username: base.username || process.env[REMOTE_CMS_ENV_VARS.username] || "",
    password: base.password || process.env[REMOTE_CMS_ENV_VARS.password] || "",
    secret: base.secret || process.env[REMOTE_CMS_ENV_VARS.secret] || "",
    sessionTtl: base.sessionTtl ?? DEFAULT_REMOTE_CMS_CONFIG.sessionTtl,
  };
}

/**
 * Default file pattern for content files
 */
export const DEFAULT_FILE_PATTERN = "{slug}.md";

/**
 * Default content directory path
 */
export const DEFAULT_CONTENT_PATH = "src/content";

/**
 * Apply defaults to a collection configuration
 *
 * @param collection - Partial collection configuration
 * @returns Collection configuration with defaults applied
 */
export function applyCollectionDefaults(
  collection: CollectionConfig
): Required<CollectionConfig> {
  return {
    name: collection.name,
    path: collection.path,
    filePattern: collection.filePattern ?? DEFAULT_FILE_PATTERN,
    previewUrl: collection.previewUrl ?? `/${collection.name}/{slug}`,
    schema: collection.schema ?? {},
    images: collection.images
      ? { ...DEFAULT_IMAGE_CONFIG, ...collection.images }
      : DEFAULT_IMAGE_CONFIG,
  };
}

/**
 * Apply defaults to the main Writenex configuration
 *
 * @param config - Partial Writenex configuration
 * @returns Configuration with all defaults applied
 */
export function applyConfigDefaults(
  config: WritenexConfig = {}
): Required<WritenexConfig> {
  return {
    collections: (config.collections ?? []).map(applyCollectionDefaults),
    singletons: (config.singletons ?? []).map(applyCollectionDefaults),
    images: config.images
      ? { ...DEFAULT_IMAGE_CONFIG, ...config.images }
      : DEFAULT_IMAGE_CONFIG,
    editor: config.editor
      ? { ...DEFAULT_EDITOR_CONFIG, ...config.editor }
      : DEFAULT_EDITOR_CONFIG,
    discovery: config.discovery
      ? { ...DEFAULT_DISCOVERY_CONFIG, ...config.discovery }
      : DEFAULT_DISCOVERY_CONFIG,
    versionHistory: config.versionHistory
      ? { ...DEFAULT_VERSION_HISTORY_CONFIG, ...config.versionHistory }
      : DEFAULT_VERSION_HISTORY_CONFIG,
    remoteCms: applyRemoteCmsDefaults(config.remoteCms),
  };
}
