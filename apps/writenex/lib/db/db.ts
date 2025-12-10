/**
 * @fileoverview IndexedDB persistence layer using Dexie
 *
 * Provides all database operations for document storage, version history,
 * images, and settings.
 *
 * @module lib/db/db
 */

import Dexie, { type EntityTable, type Transaction } from "dexie";
import { DEFAULT_DOCUMENT_TITLE } from "@/lib/utils";
import type {
  DocumentEntry,
  VersionEntry,
  ImageEntry,
  SettingsEntry,
} from "./types";

export type { DocumentEntry, VersionEntry, ImageEntry, SettingsEntry };

/**
 * Dexie database class for the Writenex Markdown editor.
 */
class MarkdownEditorDB extends Dexie {
  documents!: EntityTable<DocumentEntry, "id">;
  versions!: EntityTable<VersionEntry, "id">;
  images!: EntityTable<ImageEntry, "id">;
  settings!: EntityTable<SettingsEntry, "id">;

  constructor() {
    super("MarkdownEditorDB");

    this.version(2).stores({
      versions: "++id, timestamp, label",
      workingSave: "id",
      images: "++id, name, createdAt",
      settings: "id",
    });

    this.version(3)
      .stores({
        documents: "id, title, createdAt, updatedAt",
        versions: "++id, documentId, timestamp, label",
        workingSaves: "id",
        images: "++id, name, createdAt",
        settings: "id",
        workingSave: null,
      })
      .upgrade(async (tx) => {
        await migrateToMultipleDocuments(tx);
      });
  }
}

async function migrateToMultipleDocuments(tx: Transaction): Promise<void> {
  const DEFAULT_DOC_ID = "default-migrated";

  try {
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

    const now = new Date();
    await tx.table("documents").add({
      id: DEFAULT_DOC_ID,
      title: existingContent ? "My Document" : DEFAULT_DOCUMENT_TITLE,
      content: existingContent,
      createdAt: now,
      updatedAt: now,
    });

    const oldVersions = await tx.table("versions").toArray();
    for (const version of oldVersions) {
      await tx
        .table("versions")
        .update(version.id, { documentId: DEFAULT_DOC_ID });
    }

    const oldWorkingSave = await tx.table("workingSave").get("current");
    if (oldWorkingSave) {
      await tx.table("workingSaves").add({
        id: DEFAULT_DOC_ID,
        content: oldWorkingSave.content,
        timestamp: oldWorkingSave.timestamp,
      });
    }

    await tx
      .table("settings")
      .put({ id: "lastActiveDocumentId", value: DEFAULT_DOC_ID });
    console.log("Migration to multiple documents completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

export const db = new MarkdownEditorDB();

// =============================================================================
// DOCUMENT FUNCTIONS
// =============================================================================

export function generateDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

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

export async function getDocument(
  id: string
): Promise<DocumentEntry | undefined> {
  return db.documents.get(id);
}

export async function getAllDocuments(): Promise<DocumentEntry[]> {
  return db.documents.orderBy("updatedAt").reverse().toArray();
}

export async function updateDocument(
  id: string,
  updates: Partial<Omit<DocumentEntry, "id" | "createdAt">>
): Promise<void> {
  await db.documents.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteDocument(id: string): Promise<void> {
  await db.documents.delete(id);
  await db.versions.where("documentId").equals(id).delete();
}

export async function getDocumentCount(): Promise<number> {
  return db.documents.count();
}

// =============================================================================
// VERSION HISTORY FUNCTIONS
// =============================================================================

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

export async function saveVersion(
  documentId: string,
  content: string,
  label?: string
): Promise<number> {
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

export async function getVersions(documentId: string): Promise<VersionEntry[]> {
  return db.versions
    .where("documentId")
    .equals(documentId)
    .reverse()
    .sortBy("timestamp");
}

export async function getVersion(
  id: number
): Promise<VersionEntry | undefined> {
  return db.versions.get(id);
}

export async function deleteVersion(id: number): Promise<void> {
  await db.versions.delete(id);
}

export async function clearAllVersions(documentId: string): Promise<void> {
  await db.versions.where("documentId").equals(documentId).delete();
}

// =============================================================================
// IMAGE & SETTINGS FUNCTIONS
// =============================================================================

export async function saveImage(
  blob: Blob,
  name: string,
  type: string
): Promise<number> {
  const id = await db.images.add({ blob, name, type, createdAt: new Date() });
  return id as number;
}

export async function getImage(id: number): Promise<ImageEntry | undefined> {
  return db.images.get(id);
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ id: key, value });
}

export async function getSetting(key: string): Promise<string | undefined> {
  const entry = await db.settings.get(key);
  return entry?.value;
}
