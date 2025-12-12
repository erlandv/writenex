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
  WritenexConfig,
  ImageConfig,
  EditorConfig,
  DiscoveryConfig,
  CollectionConfig,
  VersionHistoryConfig,
} from "../types";

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
  };
}
