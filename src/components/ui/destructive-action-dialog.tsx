/**
 * @fileoverview Destructive action confirmation dialog component
 *
 * A specialized dialog component for confirming destructive actions like
 * delete, clear, or remove operations. Features a prominent warning icon,
 * centered layout, and auto-focus on the cancel button for safer UX.
 *
 * ## Features:
 * - Prominent trash icon with red accent
 * - Auto-focus on cancel button (safer default)
 * - Loading state support
 * - Customizable title, description, and button labels
 * - Centered modal design
 *
 * ## Accessibility:
 * - Auto-focuses cancel button when opened
 * - Proper dialog semantics via Radix UI
 * - Keyboard navigable
 *
 * @module components/ui/destructive-action-dialog
 * @see {@link Dialog} - Base dialog component
 * @see {@link ClearEditorDialog} - Example usage for clearing editor
 * @see {@link DeleteDocumentDialog} - Example usage for deleting documents
 */

"use client";

import React, { useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Props for the DestructiveActionDialog component.
 *
 * @interface DestructiveActionDialogProps
 */
interface DestructiveActionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title displayed prominently */
  title: string;
  /** Description text explaining the action consequences */
  description: React.ReactNode;
  /** Label for the confirm/destructive button */
  confirmLabel: string;
  /** Label for the cancel button @default "Cancel" */
  cancelLabel?: string;
  /** Callback when user confirms the action */
  onConfirm: () => void;
  /** Whether the action is in progress @default false */
  isLoading?: boolean;
}

/**
 * Destructive action confirmation dialog.
 *
 * Displays a modal dialog for confirming destructive actions with a
 * prominent warning icon and clear action buttons. The cancel button
 * is auto-focused when the dialog opens for safer user experience.
 *
 * @component
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>Delete</Button>
 *       <DestructiveActionDialog
 *         open={open}
 *         onOpenChange={setOpen}
 *         title="Delete Item"
 *         description="This action cannot be undone."
 *         confirmLabel="Delete"
 *         onConfirm={() => handleDelete()}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @returns Modal dialog for destructive action confirmation
 */
export function DestructiveActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
}: DestructiveActionDialogProps): React.ReactElement {
  /** Reference to the cancel button for auto-focus */
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Focuses the cancel button when dialog opens.
   * This provides a safer default - users must actively choose to confirm.
   */
  useEffect(() => {
    if (open && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[400px]"
        aria-describedby="destructive-dialog-description"
      >
        <div className="flex flex-col items-center gap-4 p-6 pt-8 text-center">
          <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100 dark:bg-red-900/20 dark:ring-red-900/40">
            <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <DialogHeader className="space-y-2 p-0">
            <DialogTitle className="text-center text-xl font-semibold">
              {title}
            </DialogTitle>
            <DialogDescription
              id="destructive-dialog-description"
              className="mx-auto max-w-[280px] text-center leading-relaxed text-zinc-500 dark:text-zinc-400"
            >
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="gap-3 border-t border-zinc-100 bg-zinc-50/50 p-6 pt-0 sm:justify-center dark:border-zinc-800/50 dark:bg-zinc-900/50">
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-10 flex-1 cursor-pointer border-zinc-200 hover:bg-black/10 dark:border-zinc-700 dark:hover:bg-white/10"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className="h-10 flex-1 cursor-pointer bg-red-600 shadow-sm hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
