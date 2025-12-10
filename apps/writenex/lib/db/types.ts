/**
 * @fileoverview Document and database type definitions
 *
 * Type definitions for data structures stored in IndexedDB.
 *
 * @module lib/db/types
 * @see {@link db} - Database operations using these types
 */

/**
 * Document entry stored in IndexedDB.
 */
export interface DocumentEntry {
  /** Unique document identifier (UUID format: doc-{timestamp}-{random}) */
  id: string;
  /** Document title displayed in tabs and document list */
  title: string;
  /** Full Markdown content of the document */
  content: string;
  /** Timestamp when document was first created */
  createdAt: Date;
  /** Timestamp of last content or title update */
  updatedAt: Date;
}

/**
 * Version history entry stored in IndexedDB.
 */
export interface VersionEntry {
  /** Auto-incremented version ID (undefined before insertion) */
  id?: number;
  /** Foreign key linking to parent document */
  documentId: string;
  /** Full Markdown content at time of snapshot */
  content: string;
  /** When this version was created */
  timestamp: Date;
  /** First line of content for quick preview (max 100 chars) */
  preview: string;
  /** Optional label for special versions */
  label?: string;
}

/**
 * Image blob entry stored in IndexedDB.
 */
export interface ImageEntry {
  id?: number;
  blob: Blob;
  name: string;
  type: string;
  createdAt: Date;
}

/**
 * Settings entry for key-value storage in IndexedDB.
 */
export interface SettingsEntry {
  id: string;
  value: string;
}
