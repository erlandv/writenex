/**
 * @fileoverview Global keyboard shortcuts hook for the Writenex application
 *
 * This hook manages all global keyboard shortcuts that work across the
 * application, including editor actions, document management, and UI toggles.
 *
 * ## Shortcut Reference:
 * All keyboard shortcuts are defined in {@link KEYBOARD_SHORTCUTS} from
 * `@/lib/keyboardShortcuts` as the single source of truth. This hook
 * implements the actual event handling for those shortcuts.
 *
 * ## Categories (see keyboardShortcuts.ts for complete list):
 * - **Actions**: Save, search, version history, clear editor
 * - **Documents**: New, close, switch documents (Alt-based)
 * - **Navigation**: ToC, search panel, version history panel
 * - **Modes**: Read-only, focus mode, shortcuts modal, help
 *
 * ## Architecture:
 * Uses capture phase event listeners to intercept shortcuts before the
 * browser's default handling. Provides ARIA announcements for mode changes.
 *
 * @module hooks/useKeyboardShortcuts
 * @see {@link KEYBOARD_SHORTCUTS} - Centralized shortcut definitions
 * @see {@link useEditorStore} - Zustand store for editor state
 * @see {@link EditorShortcuts} - MDXEditor-specific formatting shortcuts
 */

import { useEffect, useCallback } from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { useEditorStore } from "@writenex/store";
import { updateDocument, getDocument, createDocument } from "@writenex/db";

/**
 * Options for the useKeyboardShortcuts hook.
 *
 * @interface UseKeyboardShortcutsOptions
 */
export interface UseKeyboardShortcutsOptions {
  /**
   * Reference to the MDXEditor instance.
   * Used to update editor content when switching documents.
   */
  editorRef: React.RefObject<MDXEditorMethods | null>;
}

/**
 * Custom hook for handling global keyboard shortcuts.
 *
 * Registers global keyboard event listeners for editor actions,
 * document management, and UI toggles. Uses capture phase to intercept
 * shortcuts before browser default handling.
 *
 * @hook
 * @example
 * ```tsx
 * function Editor() {
 *   const editorRef = useRef<MDXEditorMethods>(null);
 *
 *   // Register global keyboard shortcuts
 *   useKeyboardShortcuts({ editorRef });
 *
 *   return <MDXEditor ref={editorRef} />;
 * }
 * ```
 *
 * @param options - Hook configuration options
 * @param options.editorRef - Reference to MDXEditor for content updates
 */
export function useKeyboardShortcuts({
  editorRef,
}: UseKeyboardShortcutsOptions): void {
  const {
    documents,
    activeDocumentId,
    content,
    isReadOnly,
    isFocusMode,
    setFocusMode,
    setActiveDocumentId,
    setContent,
    addDocument,
    setDocumentToDelete,
    setDeleteDocumentDialogOpen,
    toggleReadOnly,
    toggleTocPanel,
    setShortcutsOpen,
    setSearchOpen,
    setClearDialogOpen,
    setVersionHistoryOpen,
    openOnboarding,
  } = useEditorStore();

  /**
   * Creates a new document and switches to it.
   * Saves current document content before creating the new one.
   * Triggered by Alt+N shortcut.
   */
  const handleNewDocument = useCallback(async () => {
    // Save current document content before switching
    if (activeDocumentId && content) {
      await updateDocument(activeDocumentId, { content });
    }

    // Create new document in IndexedDB
    const newDoc = await createDocument("Untitled");

    // Add to store and switch to it
    addDocument({
      id: newDoc.id,
      title: newDoc.title,
      updatedAt: newDoc.updatedAt,
    });

    setActiveDocumentId(newDoc.id);
    setContent(""); // New document starts empty
    if (editorRef.current) {
      editorRef.current.setMarkdown("");
    }
  }, [
    activeDocumentId,
    content,
    addDocument,
    setActiveDocumentId,
    setContent,
    editorRef,
  ]);

  /**
   * Initiates closing the current document.
   * Opens the delete confirmation dialog. Cannot close the last document.
   * Triggered by Alt+W shortcut.
   */
  const handleCloseDocument = useCallback(() => {
    if (!activeDocumentId || documents.length <= 1) return;

    setDocumentToDelete(activeDocumentId);
    setDeleteDocumentDialogOpen(true);
  }, [
    activeDocumentId,
    documents.length,
    setDocumentToDelete,
    setDeleteDocumentDialogOpen,
  ]);

  /**
   * Switches to the next or previous document in the list.
   * Wraps around at the ends (first to last, last to first).
   * Triggered by Alt+→ (next) or Alt+← (prev) shortcuts.
   *
   * @param direction - "next" to go forward, "prev" to go backward
   */
  const handleSwitchDocument = useCallback(
    async (direction: "next" | "prev") => {
      if (documents.length <= 1 || !activeDocumentId) return;

      const currentIndex = documents.findIndex(
        (d) => d.id === activeDocumentId
      );
      let nextIndex: number;

      if (direction === "next") {
        nextIndex = currentIndex >= documents.length - 1 ? 0 : currentIndex + 1;
      } else {
        nextIndex = currentIndex <= 0 ? documents.length - 1 : currentIndex - 1;
      }

      const nextDoc = documents[nextIndex];
      if (!nextDoc) return;

      // Save current document content before switching
      if (activeDocumentId && content) {
        await updateDocument(activeDocumentId, { content });
      }

      // Load the next document
      const doc = await getDocument(nextDoc.id);
      if (doc) {
        setActiveDocumentId(nextDoc.id);
        setContent(doc.content);
        if (editorRef.current) {
          editorRef.current.setMarkdown(doc.content);
        }
      }
    },
    [
      documents,
      activeDocumentId,
      content,
      setActiveDocumentId,
      setContent,
      editorRef,
    ]
  );

  /**
   * Switches to a specific document by its ID.
   * Saves current document content before switching.
   * Triggered by Alt+1-9 shortcuts.
   *
   * @param docId - The ID of the document to switch to
   */
  const handleSwitchToDocument = useCallback(
    async (docId: string) => {
      if (docId === activeDocumentId) return;

      // Save current document content before switching
      if (activeDocumentId && content) {
        await updateDocument(activeDocumentId, { content });
      }

      // Load the target document
      const doc = await getDocument(docId);
      if (doc) {
        setActiveDocumentId(docId);
        setContent(doc.content);
        if (editorRef.current) {
          editorRef.current.setMarkdown(doc.content);
        }
      }
    },
    [activeDocumentId, content, setActiveDocumentId, setContent, editorRef]
  );

  /**
   * Main keyboard event listener.
   * Registers all keyboard shortcuts using capture phase to intercept
   * before browser default handling. Provides ARIA announcements for
   * accessibility when mode changes occur.
   */
  useEffect(() => {
    /**
     * Handles keydown events for all global shortcuts.
     * Detects Mac vs Windows for proper modifier key handling.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+Shift+R - Toggle read-only mode
      if (modKey && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        toggleReadOnly();

        // ARIA announcement
        const announcement = document.createElement("div");
        announcement.setAttribute("role", "status");
        announcement.setAttribute("aria-live", "polite");
        announcement.className = "sr-only";
        announcement.textContent = isReadOnly
          ? "Editing mode enabled"
          : "Read-only mode enabled. Editing is disabled";
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
      }

      // Ctrl+Shift+E - Toggle Focus Mode
      if (modKey && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        const newFocusMode = !isFocusMode;
        setFocusMode(newFocusMode);

        // Close panels when entering focus mode
        if (newFocusMode) {
          setVersionHistoryOpen(false);
          setSearchOpen(false);
        }

        // ARIA announcement
        const announcement = document.createElement("div");
        announcement.setAttribute("role", "status");
        announcement.setAttribute("aria-live", "polite");
        announcement.className = "sr-only";
        announcement.textContent = newFocusMode
          ? "Focus mode enabled. Press Escape to exit."
          : "Focus mode disabled";
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
      }

      // Escape - Exit Focus Mode (only when in focus mode and no modals open)
      if (e.key === "Escape" && isFocusMode) {
        // Check if any modal/panel is open that should handle Escape first
        const isAnyModalOpen =
          useEditorStore.getState().isShortcutsOpen ||
          useEditorStore.getState().isClearDialogOpen ||
          useEditorStore.getState().isDeleteDocumentDialogOpen ||
          useEditorStore.getState().isSearchOpen;

        if (!isAnyModalOpen) {
          e.preventDefault();
          setFocusMode(false);

          // ARIA announcement
          const announcement = document.createElement("div");
          announcement.setAttribute("role", "status");
          announcement.setAttribute("aria-live", "polite");
          announcement.className = "sr-only";
          announcement.textContent = "Focus mode disabled";
          document.body.appendChild(announcement);
          setTimeout(() => announcement.remove(), 1000);
        }
      }

      // Ctrl+/ - Toggle shortcuts modal
      if (modKey && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen(true);
      }

      // F1 - Open Help / Welcome Tour
      if (e.key === "F1") {
        e.preventDefault();
        openOnboarding();
      }

      // Ctrl+F - Open search & replace
      if (modKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Ctrl+H - Toggle Version History
      if (modKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setVersionHistoryOpen(!useEditorStore.getState().isVersionHistoryOpen);
      }

      // Ctrl+Shift+Delete - Clear Editor
      if (modKey && e.shiftKey && e.key === "Delete") {
        e.preventDefault();
        if (!isReadOnly) {
          setClearDialogOpen(true);
        }
      }

      // Ctrl+Shift+C - Inline Code (Prevent DevTools)
      if (modKey && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        // MDXEditor should handle the formatting
      }

      // Ctrl+S - Save (Prevent browser dialog)
      if (modKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Auto-save handles the actual saving
      }

      // Ctrl+K - Insert Link (Prevent browser search focus)
      if (modKey && e.key.toLowerCase() === "k") {
        // Prevent browser from focusing address bar
        // MDXEditor's link plugin should handle the actual action
        // if the editor is focused.
        if (document.activeElement?.closest(".mdxeditor")) {
          e.preventDefault();
        }
      }

      // === Document Management Shortcuts (Alt-based to avoid browser conflicts) ===

      // Alt+T - Toggle Table of Contents
      if (e.altKey && !modKey && !e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        toggleTocPanel();
        return;
      }

      // Alt+N - New Document
      if (e.altKey && !modKey && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewDocument();
        return;
      }

      // Alt+W - Close Current Document
      if (e.altKey && !modKey && !e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        handleCloseDocument();
        return;
      }

      // Alt+ArrowRight - Switch to Next Document
      if (e.altKey && !modKey && !e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleSwitchDocument("next");
        return;
      }

      // Alt+ArrowLeft - Switch to Previous Document
      if (e.altKey && !modKey && !e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwitchDocument("prev");
        return;
      }

      // Alt+1-9 - Switch to specific document by position
      if (e.altKey && !modKey && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9 && num <= documents.length) {
          e.preventDefault();
          const targetDoc = documents[num - 1];
          if (targetDoc && targetDoc.id !== activeDocumentId) {
            handleSwitchToDocument(targetDoc.id);
          }
          return;
        }
      }
    };

    // Use capture phase to intercept before browser handles it
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    isReadOnly,
    isFocusMode,
    toggleReadOnly,
    toggleTocPanel,
    setFocusMode,
    setShortcutsOpen,
    setSearchOpen,
    setVersionHistoryOpen,
    setClearDialogOpen,
    openOnboarding,
    handleNewDocument,
    handleCloseDocument,
    handleSwitchDocument,
    handleSwitchToDocument,
    documents,
    activeDocumentId,
  ]);
}
