/**
 * @fileoverview Delete Document Dialog Component
 *
 * This component provides a confirmation dialog before permanently deleting
 * a document. It handles switching to another document if the active one
 * is deleted and prevents deletion of the last remaining document.
 *
 * ## Features:
 * - Confirmation before permanent deletion
 * - Auto-switch to another document when active document is deleted
 * - Prevention of last document deletion with informative message
 * - Deletes associated version history along with the document
 * - ARIA announcements for accessibility
 *
 * ## Architecture:
 * - Controlled by DocumentTabs via Zustand store
 * - Persists changes to IndexedDB via db.ts helpers
 * - Uses DestructiveActionDialog for consistent UX
 *
 * @module components/editor/DeleteDocumentDialog
 * @see {@link DocumentTabs} - Parent component that triggers this dialog
 * @see {@link DestructiveActionDialog} - Shared dialog component used
 */

"use client";

import React, { useCallback } from "react";
import { useEditorStore } from "@writenex/store";
import { deleteDocument, getDocument } from "@writenex/db";
import { DestructiveActionDialog } from "@writenex/ui" // destructive-action-dialog";

/**
 * Props for DeleteDocumentDialog
 *
 * @interface DeleteDocumentDialogProps
 */
interface DeleteDocumentDialogProps {
  /**
   * Callback to update the MDXEditor content when switching to another document.
   * Called after the active document is deleted and we switch to a remaining one.
   *
   * @param content - The content of the document switched to
   *
   * @example
   * ```tsx
   * const handleSwitchDocument = (content: string) => {
   *   editorRef.current?.setMarkdown(content);
   * };
   * ```
   */
  onSwitchDocument: (content: string) => void;
}

/**
 * A confirmation dialog for permanently deleting a document.
 *
 * This component handles the complete deletion flow:
 * 1. Shows confirmation with document title
 * 2. Deletes from IndexedDB (document + version history)
 * 3. Removes from Zustand store
 * 4. Switches to another document if needed
 * 5. Announces the action for screen readers
 *
 * Special case: If only one document exists, shows an informative message
 * instead of the delete confirmation.
 *
 * @component
 * @example
 * ```tsx
 * // Usage in MarkdownEditor
 * function MarkdownEditor() {
 *   const handleSwitchDocument = (content: string) => {
 *     editorRef.current?.setMarkdown(content);
 *   };
 *
 *   return (
 *     <>
 *       <DocumentTabs />
 *       <Editor />
 *       <DeleteDocumentDialog onSwitchDocument={handleSwitchDocument} />
 *     </>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @param props.onSwitchDocument - Callback to update editor when switching documents
 * @returns The dialog element
 *
 * @see {@link DocumentTabs} - Component that triggers this dialog
 */
export function DeleteDocumentDialog({
  onSwitchDocument,
}: DeleteDocumentDialogProps): React.ReactElement {
  const {
    isDeleteDocumentDialogOpen,
    setDeleteDocumentDialogOpen,
    documentToDelete,
    setDocumentToDelete,
    documents,
    activeDocumentId,
    setActiveDocumentId,
    removeDocument,
    setContent,
  } = useEditorStore();

  // Find document info for display
  const docToDelete = documents.find((d) => d.id === documentToDelete);
  const isActiveDocument = documentToDelete === activeDocumentId;

  const handleDelete = useCallback(async () => {
    if (!documentToDelete) return;

    try {
      // Delete from IndexedDB
      await deleteDocument(documentToDelete);

      // Remove from store
      removeDocument(documentToDelete);

      // If we deleted the active document, switch to another one
      if (isActiveDocument) {
        const remainingDocs = documents.filter(
          (d) => d.id !== documentToDelete
        );

        if (remainingDocs.length > 0) {
          const nextDoc = remainingDocs[0];
          if (nextDoc) {
            const docData = await getDocument(nextDoc.id);

            if (docData) {
              setActiveDocumentId(nextDoc.id);
              setContent(docData.content);
              onSwitchDocument(docData.content);
            }
          }
        }
      }

      // Close dialog
      setDeleteDocumentDialogOpen(false);
      setDocumentToDelete(null);

      // ARIA announcement
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = `Document "${docToDelete?.title || "Untitled"}" has been deleted`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  }, [
    documentToDelete,
    isActiveDocument,
    documents,
    docToDelete,
    removeDocument,
    setActiveDocumentId,
    setContent,
    onSwitchDocument,
    setDeleteDocumentDialogOpen,
    setDocumentToDelete,
  ]);

  const handleCancel = useCallback(() => {
    setDeleteDocumentDialogOpen(false);
    setDocumentToDelete(null);
  }, [setDeleteDocumentDialogOpen, setDocumentToDelete]);

  // Don't allow deleting the last document
  if (documents.length <= 1) {
    return (
      <DestructiveActionDialog
        open={isDeleteDocumentDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title="Cannot Delete"
        description="You cannot delete the last document. Create a new document first if you want to start fresh."
        confirmLabel="OK"
        cancelLabel="Close"
        onConfirm={handleCancel}
      />
    );
  }

  return (
    <DestructiveActionDialog
      open={isDeleteDocumentDialogOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      title="Delete Document?"
      description={
        <>
          Are you sure you want to delete &quot;
          {docToDelete?.title || "Untitled"}&quot;?
          <br />
          <span className="mt-2 block text-xs text-zinc-400 dark:text-zinc-500">
            This action cannot be undone. All version history for this document
            will also be deleted.
          </span>
        </>
      }
      confirmLabel="Delete"
      onConfirm={handleDelete}
    />
  );
}
