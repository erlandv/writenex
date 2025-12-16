/**
 * @fileoverview Version history type definitions for @writenex/astro
 *
 * This file contains all TypeScript type definitions related to version history,
 * including version entries, manifests, and operation results.
 *
 * @module @writenex/astro/types/version
 */

/**
 * Version entry metadata stored in manifest
 *
 * Represents a single version snapshot of a content item.
 */
export interface VersionEntry {
  /** Unique version ID (ISO timestamp with hyphens instead of colons) */
  id: string;
  /** When this version was created (ISO string for JSON serialization) */
  timestamp: string;
  /** First 100 characters of content for preview */
  preview: string;
  /** File size in bytes */
  size: number;
  /** Optional label for manual snapshots */
  label?: string;
}

/**
 * Version manifest for a content item
 *
 * Tracks all versions for a specific content item in a JSON file.
 */
export interface VersionManifest {
  /** Content item identifier (slug) */
  contentId: string;
  /** Collection name */
  collection: string;
  /** List of version entries */
  versions: VersionEntry[];
  /** When manifest was last updated (ISO string for JSON serialization) */
  updatedAt: string;
}

/**
 * Full version data including content
 *
 * Extends VersionEntry with the actual content of the version.
 */
export interface Version extends VersionEntry {
  /** Full markdown content */
  content: string;
  /** Parsed frontmatter */
  frontmatter: Record<string, unknown>;
  /** Markdown body */
  body: string;
}

/**
 * Version history configuration
 *
 * Controls how version history behaves for the project.
 * All fields are optional - defaults are applied via applyConfigDefaults().
 */
export interface VersionHistoryConfig {
  /** Enable/disable version history (default: true) */
  enabled?: boolean;
  /** Maximum versions to keep per content item, unlabeled only (default: 20) */
  maxVersions?: number;
  /** Storage path relative to project root (default: ".writenex/versions") */
  storagePath?: string;
}

/**
 * Result of version operations
 *
 * Returned by version CRUD operations to indicate success/failure.
 */
export interface VersionResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Version entry if operation created/retrieved one */
  version?: VersionEntry;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Options for saving a version
 */
export interface SaveVersionOptions {
  /** Optional label for the version */
  label?: string;
  /** Skip if content is identical to last version */
  skipIfIdentical?: boolean;
}

/**
 * Options for restoring a version
 */
export interface RestoreVersionOptions {
  /** Label for the safety snapshot created before restore */
  safetySnapshotLabel?: string;
  /** Skip creating safety snapshot (not recommended) */
  skipSafetySnapshot?: boolean;
}

/**
 * Result of a restore operation
 *
 * Extends VersionResult with additional restore-specific fields.
 */
export interface RestoreResult extends VersionResult {
  /** The restored content */
  content?: string;
  /** The safety snapshot version entry (if created) */
  safetySnapshot?: VersionEntry;
}
