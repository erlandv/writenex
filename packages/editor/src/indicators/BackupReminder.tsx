/**
 * @fileoverview Backup Reminder Component
 *
 * This component displays a full-width banner reminding users to backup
 * their documents. This is important for PWA users since all data is
 * stored locally in the browser.
 *
 * ## Design Decisions:
 * - Full-width banner matching read-only/storage warning style
 * - Shows after 7 days without export
 * - Dismissible with 3-day snooze
 * - Links to export functionality
 *
 * @module components/editor/BackupReminder
 * @see {@link useBackupReminder} - Hook providing backup state
 */

"use client";

import React from "react";
import { useBackupReminder } from "@writenex/hooks";

/**
 * Backup reminder banner component.
 *
 * Displays a reminder when user hasn't exported documents in 7+ days.
 * The reminder is dismissible (snoozes for 3 days) and provides
 * guidance on how to export.
 *
 * @component
 * @example
 * ```tsx
 * function EditorLayout() {
 *   return (
 *     <div>
 *       <BackupReminder />
 *       <Editor />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Backup reminder element or null if not needed
 */
export function BackupReminder(): React.ReactElement | null {
  const { shouldRemind, daysSinceExport, isLoading, dismiss } =
    useBackupReminder();

  // Don't show while loading or if no reminder needed
  if (isLoading || !shouldRemind) {
    return null;
  }

  // Build the message based on days since export
  const getMessage = (): string => {
    if (daysSinceExport === null) {
      return "You haven't backed up your documents yet - Use File > Export to save a copy";
    }
    return `No backup in ${daysSinceExport} days - Use File > Export to save a copy`;
  };

  return (
    <div
      className="flex flex-col gap-1 border-y border-blue-200 bg-blue-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 dark:border-blue-800 dark:bg-blue-900/20"
      role="alert"
      aria-live="polite"
    >
      <span className="text-xs text-blue-700 sm:text-sm dark:text-blue-300">
        {getMessage()}
      </span>
      <button
        onClick={dismiss}
        className="shrink-0 cursor-pointer self-start rounded text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline focus:ring-2 focus:ring-blue-500 focus:outline-none sm:self-auto sm:text-sm dark:text-blue-400 dark:hover:text-blue-200"
      >
        Remind me later
      </button>
    </div>
  );
}
