/**
 * @fileoverview Barrel export for db module
 * @module lib/db
 */

export type {
  DocumentEntry,
  VersionEntry,
  ImageEntry,
  SettingsEntry,
} from "./types";

export {
  db,
  generateDocumentId,
  createDocument,
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  getDocumentCount,
  getLastVersionTimestamp,
  saveVersion,
  getVersions,
  getVersion,
  deleteVersion,
  clearAllVersions,
  saveImage,
  getImage,
  saveSetting,
  getSetting,
} from "./db";
