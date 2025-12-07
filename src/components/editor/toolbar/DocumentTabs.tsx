/**
 * @fileoverview Document Tabs Component
 *
 * This component provides a browser-like tab bar for managing multiple documents.
 * Users can open, close, switch between, and rename documents. The tabs support
 * horizontal scrolling for overflow and keyboard navigation.
 *
 * ## Features:
 * - Browser-style tab interface with add/close buttons
 * - Double-click to rename documents inline
 * - Horizontal scroll with navigation arrows for overflow
 * - Keyboard shortcuts: Alt+N (new), Alt+W (close), Alt+←/→ (switch), Alt+1-9 (direct)
 * - Auto-save current document before switching
 * - Tooltip hints for accessibility
 *
 * ## Architecture:
 * - Uses Zustand store for document state management
 * - Persists documents to IndexedDB via db.ts helpers
 * - Integrates with DeleteDocumentDialog for confirmation
 *
 * @module components/editor/DocumentTabs
 * @see {@link useEditorStore} - State management for documents
 * @see {@link DeleteDocumentDialog} - Confirmation dialog for closing documents
 * @see {@link useKeyboardShortcuts} - Global shortcuts for document management
 */

"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { Plus, X, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { createDocument, updateDocument, getDocument } from "@/lib/db";
import { useSaveBeforeSwitch } from "@/hooks/useAutoSave";
import { cn } from "@/lib/utils";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";

/**
 * Props for the DocumentTab component
 *
 * @interface DocumentTabProps
 */
interface DocumentTabProps {
  /** The document title to display */
  title: string;
  /** Whether this tab is the currently active document */
  isActive: boolean;
  /** Callback when the tab is clicked to switch to this document */
  onSelect: () => void;
  /** Callback when the close button is clicked */
  onClose: () => void;
  /** Callback when the document is renamed via double-click */
  onRename: (newTitle: string) => void;
}

/**
 * Individual document tab component with inline editing support.
 *
 * Supports:
 * - Click to switch documents
 * - Double-click to enter rename mode
 * - Close button (visible on hover or when active)
 * - Keyboard navigation (Enter to confirm, Escape to cancel rename)
 *
 * @component
 * @param props - Component props
 * @returns Tab element with interactive features
 */

function DocumentTab({
  title,
  isActive,
  onSelect,
  onClose,
  onRename,
}: DocumentTabProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(title);
    setIsEditing(true);
  }, [title]);

  const handleBlur = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, title, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBlur();
      } else if (e.key === "Escape") {
        setEditValue(title);
        setIsEditing(false);
      }
    },
    [handleBlur, title]
  );

  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose]
  );

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-t-lg px-3 py-2 transition-all",
        "max-w-60 min-w-[120px]",
        "border border-b-0",
        isActive
          ? "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          : "border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200/50 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-700/50"
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-w-0 flex-1 border-b border-blue-500 bg-transparent px-1 py-0 text-sm",
            "outline-none focus:ring-0"
          )}
          aria-label="Rename document"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm" title={title}>
          {title}
        </span>
      )}

      {/* Close button - visible on hover or when active */}
      <SimpleTooltip content="Close document" side="bottom">
        <button
          type="button"
          onClick={handleCloseClick}
          className={cn(
            "shrink-0 cursor-pointer rounded p-0.5 transition-colors",
            "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
            "hover:bg-zinc-300/50 dark:hover:bg-zinc-600/50",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          aria-label={`Close ${title}`}
        >
          <X className="h-3 w-3" />
        </button>
      </SimpleTooltip>
    </div>
  );
}

/**
 * Document tabs bar component.
 *
 * Displays a horizontal scrollable tab bar for all open documents.
 * Provides controls for creating new documents, switching between documents,
 * and closing documents with confirmation.
 *
 * ## Features:
 * - Scrollable container with left/right navigation buttons
 * - New document button positioned after the last tab
 * - Auto-saves current document before switching
 * - Integrates with DeleteDocumentDialog for close confirmation
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage in MarkdownEditor
 * function MarkdownEditor() {
 *   return (
 *     <div className="flex flex-col h-full">
 *       <DocumentTabs />
 *       <Editor />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns The tabs bar element
 *
 * @see {@link DocumentTab} - Individual tab component
 * @see {@link DeleteDocumentDialog} - Close confirmation dialog
 */
export function DocumentTabs(): React.ReactElement {
  const {
    documents,
    activeDocumentId,
    setActiveDocumentId,
    addDocument,
    updateDocumentMeta,
    setContent,
    setDeleteDocumentDialogOpen,
    setDocumentToDelete,
  } = useEditorStore();

  const saveBeforeSwitch = useSaveBeforeSwitch();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll visibility
  const updateScrollVisibility = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollVisibility();
    window.addEventListener("resize", updateScrollVisibility);
    return () => window.removeEventListener("resize", updateScrollVisibility);
  }, [updateScrollVisibility, documents]);

  const handleScroll = useCallback(
    (direction: "left" | "right") => {
      const container = tabsContainerRef.current;
      if (!container) return;

      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });

      // Update visibility after scroll animation
      setTimeout(updateScrollVisibility, 300);
    },
    [updateScrollVisibility]
  );

  /**
   * Create a new document
   */
  const handleNewDocument = useCallback(async () => {
    // Save and snapshot current document before switching
    await saveBeforeSwitch();

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
  }, [saveBeforeSwitch, addDocument, setActiveDocumentId, setContent]);

  /**
   * Switch to a different document
   */
  const handleSelectDocument = useCallback(
    async (docId: string) => {
      if (docId === activeDocumentId) return;

      // Save and snapshot current document before switching
      await saveBeforeSwitch();

      // Load the selected document
      const doc = await getDocument(docId);
      if (doc) {
        setActiveDocumentId(docId);
        setContent(doc.content);
      }
    },
    [activeDocumentId, saveBeforeSwitch, setActiveDocumentId, setContent]
  );

  /**
   * Close a document tab
   */
  const handleCloseDocument = useCallback(
    (docId: string) => {
      // If there's only one document, show delete confirmation
      if (documents.length <= 1) {
        // Can't close the last document, show warning or create new first
        return;
      }

      // Set the document to delete and show confirmation dialog
      setDocumentToDelete(docId);
      setDeleteDocumentDialogOpen(true);
    },
    [documents.length, setDocumentToDelete, setDeleteDocumentDialogOpen]
  );

  /**
   * Rename a document
   */
  const handleRenameDocument = useCallback(
    async (docId: string, newTitle: string) => {
      await updateDocument(docId, { title: newTitle });
      updateDocumentMeta(docId, { title: newTitle });
    },
    [updateDocumentMeta]
  );

  return (
    <div className="flex items-center border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      {/* Scroll left button */}
      {showLeftScroll && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="shrink-0 p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={tabsContainerRef}
        role="tablist"
        aria-label="Open documents"
        onScroll={updateScrollVisibility}
        className="no-scrollbar flex flex-1 items-end gap-1 overflow-x-auto px-2 pt-2"
      >
        {documents.map((doc) => (
          <DocumentTab
            key={doc.id}
            title={doc.title}
            isActive={doc.id === activeDocumentId}
            onSelect={() => handleSelectDocument(doc.id)}
            onClose={() => handleCloseDocument(doc.id)}
            onRename={(newTitle) => handleRenameDocument(doc.id, newTitle)}
          />
        ))}

        {/* Add new document button - positioned after last tab like browser */}
        <SimpleTooltip content="New Document (Alt+N)" side="bottom">
          <button
            type="button"
            onClick={handleNewDocument}
            className={cn(
              "mb-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors",
              "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300",
              "hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
            aria-label="New document (Alt+N)"
          >
            <Plus className="h-4 w-4" />
          </button>
        </SimpleTooltip>
      </div>

      {/* Scroll right button */}
      {showRightScroll && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="shrink-0 p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
