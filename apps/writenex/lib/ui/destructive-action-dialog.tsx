/**
 * @fileoverview Destructive action confirmation dialog component
 * @module lib/ui/destructive-action-dialog
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
} from "./dialog";
import { Button } from "./button";

interface DestructiveActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

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
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

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
            onClick={() => onConfirm()}
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
