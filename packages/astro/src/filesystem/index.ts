/**
 * @fileoverview Filesystem module exports for @writenex/astro
 *
 * This module provides the public API for filesystem operations,
 * including reading, writing, watching content files, version history,
 * and image handling.
 *
 * @module @writenex/astro/filesystem
 */

// Reader functions and types
export {
  readContentFile,
  readCollection,
  getCollectionSummaries,
  getCollectionCount,
  checkCollection,
  getFileStats,
  isContentFile,
  extractSlug,
  generateExcerpt,
  toContentSummary,
  getContentFilePath,
} from "./reader";
export type { ReadContentOptions, ReadFileResult } from "./reader";

// Writer functions and types
export {
  createContent,
  updateContent,
  deleteContent,
  generateSlug,
  generateUniqueSlug,
} from "./writer";
export type {
  CreateContentOptions,
  UpdateContentOptions,
  WriteResult,
} from "./writer";

// Watcher functions and types
export {
  ContentWatcher,
  FileModificationTracker,
  createContentWatcher,
} from "./watcher";
export type {
  FileChangeType,
  FileChangeEvent,
  WatcherOptions,
} from "./watcher";

// Version history functions
export {
  saveVersion,
  getVersions,
  getVersion,
  deleteVersion,
  clearVersions,
  pruneVersions,
  restoreVersion,
  generateVersionId,
  parseVersionId,
  getVersionStoragePath,
  getVersionFilePath,
  getManifestPath,
  generatePreview,
  readManifest,
  writeManifest,
  createEmptyManifest,
  recoverManifest,
  getOrRecoverManifest,
  ensureGitignore,
  ensureStorageDirectory,
} from "./versions";

// Version config helpers
export {
  resolveVersionConfig,
  isVersionHistoryEnabled,
  saveVersionWithConfig,
  getVersionsWithConfig,
  getVersionWithConfig,
  deleteVersionWithConfig,
  clearVersionsWithConfig,
  pruneVersionsWithConfig,
  restoreVersionWithConfig,
} from "./version-config";

// Image functions and types
export {
  uploadImage,
  parseMultipartFormData,
  isValidImageFile,
  discoverContentImages,
  getContentImageFolder,
  detectContentStructure,
  calculateRelativePath,
  scanDirectoryForImages,
  DEFAULT_IMAGE_CONFIG,
} from "./images";
export type {
  ImageUploadResult,
  ImageUploadOptions,
  ContentStructure,
  ContentStructureResult,
} from "./images";
