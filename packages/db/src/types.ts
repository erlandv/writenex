/**
 * @fileoverview Document and database type definitions
 *
 * Type definitions for data structures stored in IndexedDB.
 * These types define the schema for documents, version history,
 * images, and settings tables.
 *
 * @module db/types
 * @see {@link db} - Database operations using these types
 */

// =============================================================================
// DOCUMENT & DATABASE TYPES
// =============================================================================

/**
 * Document entry stored in IndexedDB.
 *
 * Represents a single document with its content and metadata.
 * The primary storage for all user documents.
 *
 * @interface DocumentEntry
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
 *
 * Represents a snapshot of document content at a point in time.
 * Used for version history and recovery features. Each document
 * can have up to 50 versions (older ones are auto-pruned).
 *
 * @interface VersionEntry
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
  /** Optional label for special versions (e.g., "Before Clear", "Manual Save") */
  label?: string;
}

/**
 * Image blob entry stored in IndexedDB.
 *
 * Stores image data as blobs for embedded images in documents.
 * Images are stored separately from document content for efficiency.
 *
 * @interface ImageEntry
 */
export interface ImageEntry {
  /** Auto-incremented image ID (undefined before insertion) */
  id?: number;
  /** Image binary data */
  blob: Blob;
  /** Original filename */
  name: string;
  /** MIME type (e.g., "image/png", "image/jpeg") */
  type: string;
  /** When image was uploaded */
  createdAt: Date;
}

/**
 * Settings entry for key-value storage in IndexedDB.
 *
 * Simple key-value store for application settings that need
 * to persist across sessions (e.g., last active document ID).
 *
 * @interface SettingsEntry
 */
export interface SettingsEntry {
  /** Setting key (used as primary key) */
  id: string;
  /** Setting value (stored as string, parse as needed) */
  value: string;
}
