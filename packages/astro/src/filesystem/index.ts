/**
 * @fileoverview Filesystem module exports for @writenex/astro
 *
 * This module provides the public API for filesystem operations,
 * including reading, writing, watching content files, version history,
 * and image handling.
 *
 * @module @writenex/astro/filesystem
 */

export type {
  ContentStructure,
  ContentStructureResult,
  ImageUploadOptions,
  ImageUploadResult,
} from "./images";
// Image functions and types
export {
  calculateRelativePath,
  DEFAULT_IMAGE_CONFIG,
  detectContentStructure,
  discoverContentImages,
  getContentImageFolder,
  isValidImageFile,
  parseMultipartFormData,
  scanDirectoryForImages,
  uploadImage,
} from "./images";
export type { ReadContentOptions, ReadFileResult } from "./reader";
// Reader functions and types
export {
  checkCollection,
  extractSlug,
  generateExcerpt,
  getCollectionCount,
  getCollectionSummaries,
  getContentFilePath,
  getFileStats,
  isContentFile,
  readCollection,
  readContentFile,
  toContentSummary,
} from "./reader";
// Version config helpers
export {
  clearVersionsWithConfig,
  deleteVersionWithConfig,
  getVersionsWithConfig,
  getVersionWithConfig,
  isVersionHistoryEnabled,
  pruneVersionsWithConfig,
  resolveVersionConfig,
  restoreVersionWithConfig,
  saveVersionWithConfig,
} from "./version-config";
// Version history functions
export {
  clearVersions,
  createEmptyManifest,
  deleteVersion,
  ensureGitignore,
  ensureStorageDirectory,
  generatePreview,
  generateVersionId,
  getManifestPath,
  getOrRecoverManifest,
  getVersion,
  getVersionFilePath,
  getVersionStoragePath,
  getVersions,
  parseVersionId,
  pruneVersions,
  readManifest,
  recoverManifest,
  restoreVersion,
  saveVersion,
  writeManifest,
} from "./versions";
export type {
  FileChangeEvent,
  FileChangeType,
  WatcherOptions,
} from "./watcher";
// Watcher functions and types
export {
  ContentWatcher,
  createContentWatcher,
  FileModificationTracker,
} from "./watcher";
export type {
  CreateContentOptions,
  UpdateContentOptions,
  WriteResult,
} from "./writer";
// Writer functions and types
export {
  createContent,
  deleteContent,
  generateSlug,
  generateUniqueSlug,
  updateContent,
} from "./writer";
