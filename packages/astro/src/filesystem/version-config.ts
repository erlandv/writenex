/**
 * @fileoverview Config-aware wrappers for version history operations
 *
 * This module provides wrapper functions that automatically apply configuration
 * defaults and check the enabled flag before performing version operations.
 * These wrappers simplify usage by accepting partial configuration and handling
 * all the configuration resolution internally.
 *
 * @module @writenex/astro/filesystem/version-config
 * @see {@link saveVersion} - Core save function
 * @see {@link getVersions} - Core list function
 */

import type {
  VersionHistoryConfig,
  VersionEntry,
  Version,
  VersionResult,
  SaveVersionOptions,
  RestoreVersionOptions,
  RestoreResult,
} from "@/types";
import { DEFAULT_VERSION_HISTORY_CONFIG } from "@/config/defaults";
import {
  saveVersion as coreSaveVersion,
  getVersions as coreGetVersions,
  getVersion as coreGetVersion,
  deleteVersion as coreDeleteVersion,
  clearVersions as coreClearVersions,
  pruneVersions as corePruneVersions,
  restoreVersion as coreRestoreVersion,
} from "./versions";

// =============================================================================
// Configuration Resolution
// =============================================================================

/**
 * Resolve version history configuration with defaults applied.
 *
 * Takes a partial configuration and merges it with defaults to produce
 * a complete configuration object.
 *
 * @param config - Partial version history configuration
 * @returns Complete configuration with all defaults applied
 *
 * @example
 * ```typescript
 * const resolved = resolveVersionConfig({ maxVersions: 50 });
 * // Returns: { enabled: true, maxVersions: 50, storagePath: '.writenex/versions' }
 * ```
 */
export function resolveVersionConfig(
  config?: VersionHistoryConfig
): Required<VersionHistoryConfig> {
  if (!config) {
    return { ...DEFAULT_VERSION_HISTORY_CONFIG };
  }

  return {
    enabled: config.enabled ?? DEFAULT_VERSION_HISTORY_CONFIG.enabled,
    maxVersions:
      config.maxVersions ?? DEFAULT_VERSION_HISTORY_CONFIG.maxVersions,
    storagePath:
      config.storagePath ?? DEFAULT_VERSION_HISTORY_CONFIG.storagePath,
  };
}

/**
 * Check if version history is enabled in the configuration.
 *
 * @param config - Version history configuration (partial or full)
 * @returns True if version history is enabled
 *
 * @example
 * ```typescript
 * if (isVersionHistoryEnabled({ enabled: false })) {
 *   // This won't execute
 * }
 * ```
 */
export function isVersionHistoryEnabled(
  config?: VersionHistoryConfig
): boolean {
  const resolved = resolveVersionConfig(config);
  return resolved.enabled;
}

// =============================================================================
// Config-Aware Version Operations
// =============================================================================

/**
 * Save a version with automatic configuration resolution.
 *
 * This wrapper automatically applies configuration defaults and checks
 * the enabled flag before delegating to the core saveVersion function.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param content - Full markdown content to save
 * @param config - Partial version history configuration
 * @param options - Save options
 * @returns Result of the save operation
 *
 * @example
 * ```typescript
 * // With partial config - defaults are applied automatically
 * const result = await saveVersionWithConfig(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '---\ntitle: My Post\n---\n\nContent...',
 *   { maxVersions: 50 }  // enabled and storagePath use defaults
 * );
 * ```
 */
export async function saveVersionWithConfig(
  projectRoot: string,
  collection: string,
  contentId: string,
  content: string,
  config?: VersionHistoryConfig,
  options?: SaveVersionOptions
): Promise<VersionResult> {
  const resolvedConfig = resolveVersionConfig(config);

  // Early return if disabled
  if (!resolvedConfig.enabled) {
    return { success: true };
  }

  return coreSaveVersion(
    projectRoot,
    collection,
    contentId,
    content,
    resolvedConfig,
    options
  );
}

/**
 * Get all versions with automatic configuration resolution.
 *
 * This wrapper automatically applies configuration defaults and checks
 * the enabled flag before delegating to the core getVersions function.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param config - Partial version history configuration
 * @returns Array of version entries (empty if disabled)
 *
 * @example
 * ```typescript
 * const versions = await getVersionsWithConfig(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   { storagePath: 'custom/versions' }
 * );
 * ```
 */
export async function getVersionsWithConfig(
  projectRoot: string,
  collection: string,
  contentId: string,
  config?: VersionHistoryConfig
): Promise<VersionEntry[]> {
  const resolvedConfig = resolveVersionConfig(config);

  // Early return if disabled
  if (!resolvedConfig.enabled) {
    return [];
  }

  return coreGetVersions(projectRoot, collection, contentId, resolvedConfig);
}

/**
 * Get a specific version with automatic configuration resolution.
 *
 * This wrapper automatically applies configuration defaults and checks
 * the enabled flag before delegating to the core getVersion function.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param versionId - Version ID to retrieve
 * @param config - Partial version history configuration
 * @returns Full version data or null if not found/disabled
 *
 * @example
 * ```typescript
 * const version = await getVersionWithConfig(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '2024-12-11T10-30-00-000Z'
 * );
 * ```
 */
export async function getVersionWithConfig(
  projectRoot: string,
  collection: string,
  contentId: string,
  versionId: string,
  config?: VersionHistoryConfig
): Promise<Version | null> {
  const resolvedConfig = resolveVersionConfig(config);

  // Early return if disabled
  if (!resolvedConfig.enabled) {
    return null;
  }

  return coreGetVersion(
    projectRoot,
    collection,
    contentId,
    versionId,
    resolvedConfig
  );
}

/**
 * Delete a version with automatic configuration resolution.
 *
 * This wrapper automatically applies configuration defaults before
 * delegating to the core deleteVersion function.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param versionId - Version ID to delete
 * @param config - Partial version history configuration
 * @returns Result of the delete operation
 *
 * @example
 * ```typescript
 * const result = await deleteVersionWithConfig(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '2024-12-11T10-30-00-000Z'
 * );
 * ```
 */
export async function deleteVersionWithConfig(
  projectRoot: string,
  collection: string,
  contentId: string,
  versionId: string,
  config?: VersionHistoryConfig
): Promise<VersionResult> {
  const resolvedConfig = resolveVersionConfig(config);

  return coreDeleteVersion(
    projectRoot,
    collection,
    contentId,
    versionId,
    resolvedConfig
  );
}

/**
 * Clear all versions with automatic configuration resolution.
 *
 * This wrapper automatically applies configuration defaults before
 * delegating to the core clearVersions function.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param config - Partial version history configuration
 * @returns Result of the clear operation
 *
 * @example
 * ```typescript
 * const result = await clearVersionsWithConfig(
 *   '/project',
 *   'blog',
 *   'my-post'
 * );
 * ```
 */
export async function clearVersionsWithConfig(
  projectRoot: string,
  collection: string,
  contentId: string,
  config?: VersionHistoryConfig
): Promise<VersionResult> {
  const resolvedConfig = resolveVersionConfig(config);

  return coreClearVersions(projectRoot, collection, contentId, resolvedConfig);
}

/**
 * Prune old versions with automatic configuration resolution.
 *
 * This wrapper automatically applies configuration defaults before
 * delegating to the core pruneVersions function. Uses the configured
 * maxVersions value for determining how many versions to keep.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param config - Partial version history configuration
 * @returns Result of the prune operation
 *
 * @example
 * ```typescript
 * // Uses custom maxVersions
 * const result = await pruneVersionsWithConfig(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   { maxVersions: 10 }
 * );
 * ```
 */
export async function pruneVersionsWithConfig(
  projectRoot: string,
  collection: string,
  contentId: string,
  config?: VersionHistoryConfig
): Promise<VersionResult> {
  const resolvedConfig = resolveVersionConfig(config);

  return corePruneVersions(projectRoot, collection, contentId, resolvedConfig);
}

/**
 * Restore a version with automatic configuration resolution.
 *
 * This wrapper automatically applies configuration defaults and checks
 * the enabled flag before delegating to the core restoreVersion function.
 *
 * @param projectRoot - Absolute path to project root
 * @param collection - Collection name
 * @param contentId - Content item ID (slug)
 * @param versionId - Version ID to restore
 * @param contentFilePath - Absolute path to the current content file
 * @param config - Partial version history configuration
 * @param options - Restore options
 * @returns Result of the restore operation
 *
 * @example
 * ```typescript
 * const result = await restoreVersionWithConfig(
 *   '/project',
 *   'blog',
 *   'my-post',
 *   '2024-12-11T10-30-00-000Z',
 *   '/project/src/content/blog/my-post.md'
 * );
 * ```
 */
export async function restoreVersionWithConfig(
  projectRoot: string,
  collection: string,
  contentId: string,
  versionId: string,
  contentFilePath: string,
  config?: VersionHistoryConfig,
  options?: RestoreVersionOptions
): Promise<RestoreResult> {
  const resolvedConfig = resolveVersionConfig(config);

  // Early return if disabled
  if (!resolvedConfig.enabled) {
    return {
      success: false,
      error: "Version history is disabled",
    };
  }

  return coreRestoreVersion(
    projectRoot,
    collection,
    contentId,
    versionId,
    contentFilePath,
    resolvedConfig,
    options
  );
}
