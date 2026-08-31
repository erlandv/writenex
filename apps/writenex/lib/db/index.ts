/**
 * @fileoverview Barrel export for db module
 * @module lib/db
 */

export {
  clearAllVersions,
  clearWorkingDraft,
  createDocument,
  db,
  deleteDocument,
  deleteVersion,
  generateDocumentId,
  getAllDocuments,
  getDocument,
  getDocumentCount,
  getImage,
  getLastVersionTimestamp,
  getSetting,
  getVersion,
  getVersions,
  getWorkingDraft,
  saveImage,
  saveSetting,
  saveVersion,
  saveWorkingDraft,
  updateDocument,
} from "./db";
export type {
  DocumentEntry,
  ImageEntry,
  SettingsEntry,
  VersionEntry,
  WorkingSaveEntry,
} from "./types";
