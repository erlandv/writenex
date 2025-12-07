/**
 * @fileoverview Barrel export for @writenex/db package
 *
 * This module exports all database operations and types from the package.
 *
 * @module db
 */

// Types
export type {
  DocumentEntry,
  VersionEntry,
  ImageEntry,
  SettingsEntry,
} from "./types";

// Database instance and operations
export {
  db,
  // Document functions
  generateDocumentId,
  createDocument,
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  getDocumentCount,
  // Version history functions
  getLastVersionTimestamp,
  saveVersion,
  getVersions,
  getVersion,
  deleteVersion,
  clearAllVersions,
  // Image functions
  saveImage,
  getImage,
  // Settings functions
  saveSetting,
  getSetting,
} from "./db";
