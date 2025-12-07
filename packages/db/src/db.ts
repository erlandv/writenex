/**
 * @fileoverview IndexedDB persistence layer using Dexie
 *
 * Provides all database operations for document storage, version history,
 * images, and settings. Uses Dexie as a wrapper around IndexedDB for
 * a more developer-friendly API.
 *
 * ## Database Schema:
 * - `documents` - Document metadata and content (primary storage)
 * - `versions` - Version history snapshots per document (capped at 50)
 * - `images` - Image blob storage for embedded images
 * - `settings` - Key-value settings storage
 *
 * ## Exported Functions:
 * - Document CRUD: createDocument, getDocument, getAllDocuments, updateDocument, deleteDocument
 * - Version history: saveVersion, getVersions, getVersion, deleteVersion, clearAllVersions
 * - Images: saveImage, getImage
 * - Settings: saveSetting, getSetting
 *
 * ## Migration History:
 * - v2: Original single-document system
 * - v3: Multiple documents support with migration
 *
 * @module db
 * @see {@link DocumentEntry} - Document type definition
 * @see {@link VersionEntry} - Version type definition
 */

import Dexie, { type EntityTable, type Transaction } from "dexie";
import { DEFAULT_DOCUMENT_TITLE } from "@writenex/utils";
import type {
  DocumentEntry,
  VersionEntry,
  ImageEntry,
  SettingsEntry,
} from "./types";

// Re-export types for backward compatibility
export type { DocumentEntry, VersionEntry, ImageEntry, SettingsEntry };

/**
 * Dexie database class for the Writenex Markdown editor.
 *
 * Defines the database schema and handles version migrations.
 * Uses typed EntityTable for type-safe operations.
 *
 * ## Tables:
 * - `documents` - Document metadata and content (indexed by updatedAt)
 * - `versions` - Version history per document (indexed by documentId, timestamp)
 * - `images` - Image blob storage (indexed by name, createdAt)
 * - `settings` - App settings key-value store
 *
 * Note: `workingSaves` table still exists in schema for migration compatibility
 * but is no longer used. Document table is now the single source of truth.
 *
 * @class
 * @extends Dexie
 */
class MarkdownEditorDB extends Dexie {
  documents!: EntityTable<DocumentEntry, "id">;
  versions!: EntityTable<VersionEntry, "id">;
  images!: EntityTable<ImageEntry, "id">;
  settings!: EntityTable<SettingsEntry, "id">;

  constructor() {
    super("MarkdownEditorDB");

    // Version 2: Original dual-layer save system
    this.version(2).stores({
      versions: "++id, timestamp, label",
      workingSave: "id",
      images: "++id, name, createdAt",
      settings: "id",
    });

    // Version 3: Multiple documents support
    this.version(3)
      .stores({
        documents: "id, title, createdAt, updatedAt",
        versions: "++id, documentId, timestamp, label",
        workingSaves: "id", // id = documentId
        images: "++id, name, createdAt",
        settings: "id",
        // Remove old workingSave table (singular)
        workingSave: null,
      })
      .upgrade(async (tx) => {
        // Migration: Move existing data to default document
        await migrateToMultipleDocuments(tx);
      });
  }
}

/**
 * Migration function: Convert single-document data to multiple documents format.
 *
 * This runs when upgrading from v2 to v3. Handles the transition from the
 * original single-document architecture to multiple documents.
 *
 * ## Migration Steps:
 * 1. Creates a default document from localStorage content (if any)
 * 2. Migrates existing versions to belong to the default document
 * 3. Migrates working copy from old workingSave to new workingSaves table
 * 4. Saves default document ID to settings for session restoration
 *
 * @param tx - Dexie transaction for atomic operations
 * @returns Promise that resolves when migration is complete
 * @throws Error if migration fails (will cause upgrade to abort)
 */
async function migrateToMultipleDocuments(tx: Transaction): Promise<void> {
  const DEFAULT_DOC_ID = "default-migrated";

  try {
    // Get content from localStorage (Zustand persist)
    let existingContent = "";
    try {
      const stored = localStorage.getItem("markdown-editor-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        existingContent = parsed?.state?.content || "";
      }
    } catch {
      // Ignore localStorage errors
    }

    // Create default document
    const now = new Date();
    await tx.table("documents").add({
      id: DEFAULT_DOC_ID,
      title: existingContent ? "My Document" : DEFAULT_DOCUMENT_TITLE,
      content: existingContent,
      createdAt: now,
      updatedAt: now,
    });

    // Migrate existing versions to belong to default document
    const oldVersions = await tx.table("versions").toArray();
    for (const version of oldVersions) {
      await tx.table("versions").update(version.id, {
        documentId: DEFAULT_DOC_ID,
      });
    }

    // Migrate old workingSave to new workingSaves
    const oldWorkingSave = await tx.table("workingSave").get("current");
    if (oldWorkingSave) {
      await tx.table("workingSaves").add({
        id: DEFAULT_DOC_ID,
        content: oldWorkingSave.content,
        timestamp: oldWorkingSave.timestamp,
      });
    }

    // Save the default document ID to settings for later retrieval
    await tx.table("settings").put({
      id: "lastActiveDocumentId",
      value: DEFAULT_DOC_ID,
    });

    console.log("Migration to multiple documents completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

/**
 * Singleton database instance.
 * Use this for all database operations.
 */
export const db = new MarkdownEditorDB();

// =============================================================================
// DOCUMENT FUNCTIONS
// =============================================================================

/**
 * Generates a unique document ID.
 * Format: `doc-{timestamp}-{random}`
 *
 * @returns Unique document ID string
 *
 * @example
 * ```ts
 * const id = generateDocumentId();
 * // Returns: "doc-1701792000000-abc123d"
 * ```
 */
export function generateDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new document in the database.
 *
 * @param title - Document title (defaults to "Untitled")
 * @param content - Initial content (defaults to empty string)
 * @returns Promise resolving to the created document entry
 *
 * @example
 * ```ts
 * const doc = await createDocument("My Notes", "# Hello World");
 * console.log(doc.id); // "doc-1701792000000-abc123d"
 * ```
 */
export async function createDocument(
  title: string = "Untitled",
  content: string = ""
): Promise<DocumentEntry> {
  const now = new Date();
  const doc: DocumentEntry = {
    id: generateDocumentId(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };

  await db.documents.add(doc);
  return doc;
}

/**
 * Retrieves a document by ID.
 *
 * @param id - Document ID to retrieve
 * @returns Promise resolving to the document or undefined if not found
 */
export async function getDocument(
  id: string
): Promise<DocumentEntry | undefined> {
  return db.documents.get(id);
}

/**
 * Retrieves all documents ordered by last update time.
 *
 * @returns Promise resolving to array of documents (newest first)
 */
export async function getAllDocuments(): Promise<DocumentEntry[]> {
  return db.documents.orderBy("updatedAt").reverse().toArray();
}

/**
 * Updates a document with partial changes.
 * Automatically updates the `updatedAt` timestamp.
 *
 * @param id - Document ID to update
 * @param updates - Partial document updates (cannot change id or createdAt)
 * @returns Promise resolving when update is complete
 */
export async function updateDocument(
  id: string,
  updates: Partial<Omit<DocumentEntry, "id" | "createdAt">>
): Promise<void> {
  await db.documents.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * Deletes a document and all associated version history.
 *
 * @param id - Document ID to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteDocument(id: string): Promise<void> {
  // Delete document
  await db.documents.delete(id);

  // Delete all versions for this document
  await db.versions.where("documentId").equals(id).delete();
}

/**
 * Gets the total count of documents.
 *
 * @returns Promise resolving to document count
 */
export async function getDocumentCount(): Promise<number> {
  return db.documents.count();
}

// =============================================================================
// VERSION HISTORY FUNCTIONS
// =============================================================================

/**
 * Gets the timestamp of the most recent version snapshot for a document.
 *
 * @param documentId - Document ID to check
 * @returns Promise resolving to the timestamp or null if no versions exist
 */
export async function getLastVersionTimestamp(
  documentId: string
): Promise<Date | null> {
  const lastVersion = await db.versions
    .where("documentId")
    .equals(documentId)
    .reverse()
    .sortBy("timestamp")
    .then((versions) => versions[0]);

  return lastVersion?.timestamp ?? null;
}

/**
 * Saves a new version snapshot for a document.
 *
 * Creates a version entry with content, timestamp, and preview.
 * Automatically prunes old versions to keep only the most recent 50.
 *
 * @param documentId - Document ID this version belongs to
 * @param content - Markdown content to save
 * @param label - Optional label for the version (e.g., "Before Clear", "Manual Save")
 * @returns Promise resolving to the new version ID
 *
 * @example
 * ```ts
 * // Auto-save version
 * await saveVersion(docId, content);
 *
 * // Labeled version before destructive action
 * await saveVersion(docId, content, "Before Clear");
 * ```
 */
export async function saveVersion(
  documentId: string,
  content: string,
  label?: string
): Promise<number> {
  // Get first line as preview (max 100 chars)
  const firstLine = content.split("\n")[0] || "";
  const preview =
    firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;

  const id = await db.versions.add({
    documentId,
    content,
    timestamp: new Date(),
    preview: preview || "(Empty)",
    label,
  });

  // Keep only last 50 versions per document
  const docVersions = await db.versions
    .where("documentId")
    .equals(documentId)
    .sortBy("timestamp");

  if (docVersions.length > 50) {
    const toDelete = docVersions.slice(0, docVersions.length - 50);
    await db.versions.bulkDelete(
      toDelete.map((v) => v.id).filter((id): id is number => id !== undefined)
    );
  }

  return id as number;
}

/**
 * Retrieves all versions for a specific document.
 *
 * @param documentId - Document ID to get versions for
 * @returns Promise resolving to array of versions (newest first)
 */
export async function getVersions(documentId: string): Promise<VersionEntry[]> {
  return db.versions
    .where("documentId")
    .equals(documentId)
    .reverse()
    .sortBy("timestamp");
}

/**
 * Retrieves a specific version by ID.
 *
 * @param id - Version ID
 * @returns Promise resolving to the version entry or undefined
 */
export async function getVersion(
  id: number
): Promise<VersionEntry | undefined> {
  return db.versions.get(id);
}

/**
 * Deletes a specific version.
 *
 * @param id - Version ID to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteVersion(id: number): Promise<void> {
  await db.versions.delete(id);
}

/**
 * Deletes all versions for a specific document.
 *
 * @param documentId - Document ID to clear versions for
 * @returns Promise resolving when all versions are deleted
 */
export async function clearAllVersions(documentId: string): Promise<void> {
  await db.versions.where("documentId").equals(documentId).delete();
}

/**
 * Saves an image blob to the database.
 *
 * @param blob - Image blob data
 * @param name - Image filename
 * @param type - MIME type (e.g., "image/png")
 * @returns Promise resolving to the image ID
 */
export async function saveImage(
  blob: Blob,
  name: string,
  type: string
): Promise<number> {
  const id = await db.images.add({
    blob,
    name,
    type,
    createdAt: new Date(),
  });
  return id as number;
}

/**
 * Retrieves an image by ID.
 *
 * @param id - Image ID
 * @returns Promise resolving to the image entry or undefined
 */
export async function getImage(id: number): Promise<ImageEntry | undefined> {
  return db.images.get(id);
}

/**
 * Saves a setting to the database.
 * Uses upsert (put) to create or update.
 *
 * @param key - Setting key (used as ID)
 * @param value - Setting value (string)
 * @returns Promise resolving when saved
 */
export async function saveSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ id: key, value });
}

/**
 * Retrieves a setting from the database.
 *
 * @param key - Setting key
 * @returns Promise resolving to the setting value or undefined if not found
 */
export async function getSetting(key: string): Promise<string | undefined> {
  const entry = await db.settings.get(key);
  return entry?.value;
}
