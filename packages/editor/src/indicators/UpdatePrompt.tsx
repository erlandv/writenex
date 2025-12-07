/**
 * @fileoverview Update Prompt Component
 *
 * This component displays a non-intrusive toast notification when a new version
 * of the PWA is available. It gives users control over when to apply updates,
 * which is important for an editor app where users might be in the middle of work.
 *
 * ## Design Decisions:
 * - Fixed position at bottom-right, doesn't block editor content
 * - Non-intrusive: doesn't auto-dismiss, but can be dismissed manually
 * - Clear call-to-action with "Update now" button
 * - Shows brief explanation of what happens on update
 *
 * ## Update Flow:
 * 1. Service worker detects new version
 * 2. useServiceWorker hook sets updateAvailable: true
 * 3. This component renders the prompt
 * 4. User clicks "Update now" -> page reloads with new version
 * 5. User clicks dismiss -> prompt hides until next session
 *
 * @module components/editor/UpdatePrompt
 * @see {@link useServiceWorker} - Hook providing update state
 */

"use client";

import React, { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useServiceWorker } from "@writenex/hooks";

/**
 * Update prompt toast for PWA updates.
 *
 * Displays a fixed-position notification when a new version of the app
 * is available. Provides options to update immediately or dismiss.
 * Dismissing hides the prompt for the current session only.
 *
 * @component
 * @example
 * ```tsx
 * // Include in the main editor layout
 * function EditorPage() {
 *   return (
 *     <>
 *       <Editor />
 *       <UpdatePrompt />
 *     </>
 *   );
 * }
 * ```
 *
 * @returns Update prompt element or null if no update available
 */
export function UpdatePrompt(): React.ReactElement | null {
  const { updateAvailable, applyUpdate } = useServiceWorker();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if no update or user dismissed
  if (!updateAvailable || isDismissed) {
    return null;
  }

  return (
    <div
      className="animate-in slide-in-from-bottom-4 fade-in fixed right-4 bottom-4 z-50 max-w-sm duration-300"
      role="alertdialog"
      aria-labelledby="update-prompt-title"
      aria-describedby="update-prompt-description"
    >
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <RefreshCw
                className="h-4 w-4 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
            </div>
            <h2
              id="update-prompt-title"
              className="font-medium text-zinc-900 dark:text-zinc-100"
            >
              Update Available
            </h2>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Dismiss update notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p
          id="update-prompt-description"
          className="mb-4 text-sm text-zinc-600 dark:text-zinc-400"
        >
          A new version of Writenex is ready. Update now to get the latest
          features and improvements.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={applyUpdate}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-zinc-900"
          >
            Update now
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="rounded-md px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Later
          </button>
        </div>

        {/* Note */}
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          The page will reload to apply the update.
        </p>
      </div>
    </div>
  );
}
