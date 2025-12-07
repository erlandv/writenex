/**
 * @fileoverview Storage Warning Component
 *
 * This component displays a full-width warning banner when the browser's
 * storage quota is running low. Design matches the read-only mode banner
 * for visual consistency.
 *
 * ## Design Decisions:
 * - Full-width banner matching read-only mode style
 * - Positioned below document tabs (inline, not fixed)
 * - Only shows when storage usage exceeds 80%
 * - Dismissible but will reappear if storage increases by 5%
 * - Concise messaging to fit banner format
 *
 * @module components/editor/StorageWarning
 * @see {@link useStorageQuota} - Hook providing storage information
 */

"use client";

import React, { useState, useEffect } from "react";
import { useStorageQuota, formatBytes } from "@writenex/hooks";
import { requestPersistentStorage } from "@writenex/utils";
import { LS_STORAGE_WARNING_DISMISSED } from "@writenex/utils";

/**
 * Get initial dismissed threshold from localStorage.
 * Wrapped in try-catch for SSR safety.
 */
function getInitialDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LS_STORAGE_WARNING_DISMISSED);
    return stored ? parseFloat(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Storage warning banner component.
 *
 * Displays a warning when storage usage exceeds the threshold (default 80%).
 * The warning is dismissible but will reappear if storage usage increases
 * by another 5% after dismissal.
 *
 * @component
 * @example
 * ```tsx
 * function EditorLayout() {
 *   return (
 *     <div>
 *       <StorageWarning />
 *       <Editor />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Storage warning element or null if not needed
 */
export function StorageWarning(): React.ReactElement | null {
  const storage = useStorageQuota(80); // Warn at 80%
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(
    getInitialDismissedAt
  );

  // Request persistent storage when warning appears
  useEffect(() => {
    if (storage?.isLow) {
      requestPersistentStorage();
    }
  }, [storage?.isLow]);

  // Don't show if not loaded yet or not supported
  if (!storage || !storage.isSupported) {
    return null;
  }

  // Don't show if storage is not low
  if (!storage.isLow) {
    return null;
  }

  // Don't show if dismissed at similar percentage (within 5%)
  if (
    isDismissed ||
    (dismissedAt !== null && storage.percentage < dismissedAt + 5)
  ) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    setDismissedAt(storage.percentage);
    localStorage.setItem(
      LS_STORAGE_WARNING_DISMISSED,
      storage.percentage.toString()
    );
  };

  return (
    <div
      className="flex flex-col gap-1 border-y border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 dark:border-amber-800 dark:bg-amber-900/20"
      role="alert"
      aria-live="polite"
    >
      <span className="text-xs text-amber-700 sm:text-sm dark:text-amber-300">
        Storage {Math.min(storage.percentage, 100).toFixed(0)}% full (
        {formatBytes(storage.used)} of {formatBytes(storage.quota)}) - Export
        documents to free space
      </span>
      <button
        onClick={handleDismiss}
        className="shrink-0 cursor-pointer self-start rounded text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline focus:ring-2 focus:ring-amber-500 focus:outline-none sm:self-auto sm:text-sm dark:text-amber-400 dark:hover:text-amber-200"
      >
        Dismiss
      </button>
    </div>
  );
}
