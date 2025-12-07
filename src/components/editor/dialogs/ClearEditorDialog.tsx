/**
 * @fileoverview Clear Editor Dialog Component
 *
 * This component provides a confirmation dialog before clearing all editor content.
 * It creates a backup snapshot in version history before clearing to allow recovery.
 *
 * ## Features:
 * - Confirmation before destructive action
 * - Auto-saves "Before Clear" snapshot to version history
 * - ARIA announcements for accessibility
 * - Uses shared DestructiveActionDialog for consistent UX
 *
 * @module components/editor/ClearEditorDialog
 * @see {@link VersionHistoryPanel} - Where backup versions can be restored
 * @see {@link DestructiveActionDialog} - Shared dialog component used
 */

"use client";

import React, { useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { saveVersion } from "@/lib/db";
import { DestructiveActionDialog } from "@/components/ui/destructive-action-dialog";

/**
 * Props for the ClearEditorDialog component
 *
 * @interface ClearEditorDialogProps
 */
interface ClearEditorDialogProps {
  /**
   * Callback function called after the editor content is cleared.
   * This should reset the editor state and MDXEditor markdown.
   *
   * @example
   * ```tsx
   * const handleClear = () => {
   *   setContent("");
   *   editorRef.current?.setMarkdown("");
   * };
   * ```
   */
  onClear: () => void;
}

/**
 * A confirmation dialog that prompts users before clearing all editor content.
 *
 * Before clearing, this component automatically saves the current content
 * to version history with a "Before Clear" label, allowing users to recover
 * their work if needed.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage in MarkdownEditor
 * function MarkdownEditor() {
 *   const handleClear = () => {
 *     setContent("");
 *     editorRef.current?.setMarkdown("");
 *   };
 *
 *   return (
 *     <>
 *       <Editor />
 *       <ClearEditorDialog onClear={handleClear} />
 *     </>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @param props.onClear - Callback when user confirms clearing the editor
 * @returns The dialog element
 *
 * @see {@link VersionHistoryPanel} - Version history where backup is saved
 */
export function ClearEditorDialog({
  onClear,
}: ClearEditorDialogProps): React.ReactElement {
  const {
    isClearDialogOpen,
    setClearDialogOpen,
    content,
    activeDocumentId,
    triggerVersionHistoryRefresh,
  } = useEditorStore();

  const handleClear = useCallback(async () => {
    // Create a "Before Clear" snapshot
    if (content.length > 0 && activeDocumentId) {
      await saveVersion(activeDocumentId, content, "Before Clear");
      triggerVersionHistoryRefresh(); // Trigger real-time update
    }

    onClear();
    setClearDialogOpen(false);

    // ARIA announcement
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = "Editor content has been cleared";
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }, [
    content,
    activeDocumentId,
    onClear,
    setClearDialogOpen,
    triggerVersionHistoryRefresh,
  ]);

  return (
    <DestructiveActionDialog
      open={isClearDialogOpen}
      onOpenChange={setClearDialogOpen}
      title="Clear all content?"
      description={
        <>
          This will remove all text from the editor.
          <br />
          <span className="mt-2 block text-xs text-zinc-400 dark:text-zinc-500">
            (A backup will be saved to Version History)
          </span>
        </>
      }
      confirmLabel="Clear Editor"
      onConfirm={handleClear}
    />
  );
}
