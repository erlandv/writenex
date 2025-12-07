/**
 * @fileoverview Document initialization hook for the Writenex application
 *
 * This hook handles the initial loading and setup of documents when the
 * application starts. It manages the transition from IndexedDB persistence
 * to the in-memory Zustand store.
 *
 * ## Responsibilities:
 * - Loading all documents from IndexedDB on startup
 * - Creating a default document for new users
 * - Restoring the last active document from previous session
 * - Syncing Zustand store with persisted IndexedDB state
 * - Handling migration from localStorage-only state (pre-multi-doc)
 *
 * ## Initialization Flow:
 * 1. Check if documents exist in IndexedDB
 * 2. If none, create default document (handles new users & migration)
 * 3. Convert documents to DocumentMeta format for store
 * 4. Restore last active document or default to first
 * 5. Load active document content into editor
 * 6. Mark initialization complete
 *
 * @module hooks/useDocumentInit
 * @see {@link useEditorStore} - Zustand store for editor state
 * @see {@link getAllDocuments} - IndexedDB document retrieval
 * @see {@link createDocument} - IndexedDB document creation
 */

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import {
  DEFAULT_DOCUMENT_CONTENT,
  DEFAULT_DOCUMENT_TITLE,
} from "@/lib/constants";
import {
  getAllDocuments,
  getDocument,
  createDocument,
  getSetting,
  saveSetting,
} from "@/lib/db";

/**
 * Custom hook for initializing documents on application startup.
 *
 * Handles the complete document initialization flow including loading
 * from IndexedDB, creating default documents for new users, and
 * restoring the last active document from the previous session.
 *
 * This hook should be called once in the root editor component.
 * It uses a ref to prevent double initialization in React Strict Mode.
 *
 * @hook
 * @example
 * ```tsx
 * function EditorRoot() {
 *   const editorRef = useRef<MDXEditorMethods>(null);
 *
 *   // Initialize documents on mount
 *   useDocumentInit((content) => {
 *     editorRef.current?.setMarkdown(content);
 *   });
 *
 *   return <Editor ref={editorRef} />;
 * }
 * ```
 *
 * @param onContentLoaded - Callback invoked with document content when
 *   the active document is loaded. Used to sync editor with loaded content.
 */
export function useDocumentInit(
  onContentLoaded: (content: string) => void
): void {
  const {
    setDocuments,
    setActiveDocumentId,
    setContent,
    setInitialized,
    isInitialized,
    content: storeContent,
  } = useEditorStore();

  /**
   * Ref to track initialization status.
   * Prevents double initialization in React Strict Mode.
   */
  const initRef = useRef(false);

  /**
   * Main initialization function.
   * Loads documents from IndexedDB and sets up the editor state.
   * Only runs once per app lifecycle.
   */
  const initialize = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      // Get all documents from IndexedDB
      let docs = await getAllDocuments();

      // If no documents exist, create a default one
      if (docs.length === 0) {
        // For fresh installs, use empty content
        // For pre-migration users, check if there's existing content in localStorage
        const initialContent = storeContent || DEFAULT_DOCUMENT_CONTENT;
        const initialTitle = storeContent
          ? "My Document"
          : DEFAULT_DOCUMENT_TITLE;

        const newDoc = await createDocument(initialTitle, initialContent);
        docs = [newDoc];

        console.log("Created default document:", newDoc.id);
      }

      // Convert to DocumentMeta format for store
      const documentMetas = docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        updatedAt: doc.updatedAt,
      }));

      // Update store with all documents
      setDocuments(documentMetas);

      // Determine which document to open
      let activeDocId: string | null = null;

      // Try to restore last active document
      const lastActiveId = await getSetting("lastActiveDocumentId");
      if (lastActiveId && docs.some((d) => d.id === lastActiveId)) {
        activeDocId = lastActiveId;
      } else if (docs.length > 0) {
        // Default to first (most recently updated) document
        activeDocId = docs[0].id;
      }

      // Load the active document
      if (activeDocId) {
        const activeDoc = await getDocument(activeDocId);
        if (activeDoc) {
          setActiveDocumentId(activeDocId);
          setContent(activeDoc.content);
          onContentLoaded(activeDoc.content);

          // Save this as the last active document
          await saveSetting("lastActiveDocumentId", activeDocId);
        }
      }

      // Mark initialization as complete
      setInitialized(true);
      console.log("Document initialization complete:", {
        totalDocs: docs.length,
        activeDocId,
      });
    } catch (error) {
      console.error("Failed to initialize documents:", error);
      // Still mark as initialized to prevent infinite loops
      setInitialized(true);
    }
  }, [
    storeContent,
    setDocuments,
    setActiveDocumentId,
    setContent,
    setInitialized,
    onContentLoaded,
  ]);

  // Run initialization once on mount
  useEffect(() => {
    if (!isInitialized && !initRef.current) {
      initialize();
    }
  }, [isInitialized, initialize]);
}

/**
 * Hook to save the active document ID when it changes
 * This ensures we can restore the correct document on next app load
 */
export function useActiveDocumentPersistence(): void {
  const { activeDocumentId, isInitialized } = useEditorStore();

  useEffect(() => {
    if (isInitialized && activeDocumentId) {
      saveSetting("lastActiveDocumentId", activeDocumentId).catch((error) => {
        console.error("Failed to save active document ID:", error);
      });
    }
  }, [activeDocumentId, isInitialized]);
}
