/**
 * @fileoverview Delete Version Dialog Component
 *
 * This component provides a confirmation dialog before permanently deleting
 * a version from the version history. It ensures users don't accidentally
 * lose important historical snapshots.
 *
 * ## Features:
 * - Confirmation before destructive action
 * - Clear warning about permanent deletion
 * - Uses shared DestructiveActionDialog for consistent UX
 *
 * @module components/editor/DeleteVersionDialog
 * @see {@link VersionHistoryPanel} - Parent component that manages version list
 * @see {@link DestructiveActionDialog} - Shared dialog component used
 */

"use client";

import React from "react";
import { DestructiveActionDialog } from "@writenex/ui" // destructive-action-dialog";

/**
 * Props for the DeleteVersionDialog component
 *
 * @interface DeleteVersionDialogProps
 */
interface DeleteVersionDialogProps {
  /**
   * Whether the dialog is currently open
   */
  open: boolean;

  /**
   * Callback when the dialog open state changes
   * @param open - New open state
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Callback when user confirms the deletion
   */
  onConfirm: () => void;
}

/**
 * A confirmation dialog that prompts users before deleting a version
 * from the history.
 *
 * This component is controlled by its parent (VersionHistoryPanel) and
 * doesn't manage its own state. The actual deletion logic is handled
 * by the parent component.
 *
 * @component
 * @example
 * ```tsx
 * // Usage in VersionHistoryPanel
 * function VersionHistoryPanel() {
 *   const [versionToDelete, setVersionToDelete] = useState<number | null>(null);
 *
 *   const confirmDelete = async () => {
 *     if (versionToDelete !== null) {
 *       await deleteVersion(versionToDelete);
 *       setVersionToDelete(null);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <VersionList onDelete={(id) => setVersionToDelete(id)} />
 *       <DeleteVersionDialog
 *         open={versionToDelete !== null}
 *         onOpenChange={(open) => !open && setVersionToDelete(null)}
 *         onConfirm={confirmDelete}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @param props.open - Controls dialog visibility
 * @param props.onOpenChange - Called when dialog should open/close
 * @param props.onConfirm - Called when user confirms deletion
 * @returns The dialog element
 */

export function DeleteVersionDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteVersionDialogProps): React.ReactElement {
  return (
    <DestructiveActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this version?"
      description="This action cannot be undone. This version will be permanently removed from your history."
      confirmLabel="Delete Version"
      onConfirm={onConfirm}
    />
  );
}
