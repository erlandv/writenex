/**
 * @fileoverview Status Bar Component
 *
 * This component displays editor status information at the bottom of the
 * editor. It shows save status, document statistics, and cursor position.
 *
 * ## Displayed Information:
 * - **Left**: Save status (saving, saved, failed, readonly) with timestamp
 * - **Center**: Word count, character count, line count, reading time
 * - **Right**: Cursor position (line:column), app version
 *
 * ## Responsive Design:
 * Some information is hidden on smaller screens:
 * - Characters (hidden on mobile)
 * - Lines (hidden on mobile)
 * - Reading time (hidden on mobile)
 * - Cursor position (hidden on mobile)
 *
 * @module components/editor/StatusBar
 * @see {@link useAutoSave} - Hook that updates save status
 * @see {@link useEditorStore} - Store containing all displayed state
 */

"use client";

import React, { useMemo } from "react";
import { Lock, Save, AlertCircle, Loader2 } from "lucide-react";
import { useEditorStore } from "@writenex/store";
import { calculateStats, formatTime } from "@writenex/utils";
import { WORDS_PER_MINUTE } from "@writenex/utils";
import { OfflineIndicator } from "../indicators";

/**
 * Calculates estimated reading time based on word count.
 *
 * Uses WORDS_PER_MINUTE constant from lib/constants.ts which is set
 * slightly below the commonly cited 250 WPM to account for technical
 * content that may require more attention.
 *
 * @param wordCount - The number of words in the document
 * @returns Human-readable reading time string
 *
 * @example
 * ```ts
 * calculateReadingTime(0)    // "< 1 min read"
 * calculateReadingTime(225)  // "1 min read"
 * calculateReadingTime(450)  // "2 min read"
 * ```
 */
function calculateReadingTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  if (minutes < 1) return "< 1 min read";
  if (minutes === 1) return "1 min read";
  return `${minutes} min read`;
}

/**
 * Status bar component showing editor state and document statistics.
 *
 * Displays a horizontal bar at the bottom of the editor with three sections:
 * - Left: Save status indicator with icon and optional timestamp
 * - Center: Document statistics (words, characters, lines, reading time)
 * - Right: Cursor position and theme indicator
 *
 * The component uses memoization to avoid recalculating statistics on every
 * render - only when content changes.
 *
 * @component
 * @example
 * ```tsx
 * function MarkdownEditor() {
 *   return (
 *     <div className="flex flex-col h-full">
 *       <Editor />
 *       <StatusBar />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Status bar element
 *
 * @see {@link calculateStats} - Utility function for document statistics
 */
export function StatusBar(): React.ReactElement {
  const { saveStatus, lastSaved, content, cursorLine, cursorColumn } =
    useEditorStore();

  const { wordCount, charCount, lineCount } = useMemo(
    () => calculateStats(content),
    [content]
  );

  /** Format the last saved time using centralized utility */
  const formatLastSaved = (): string => {
    if (!lastSaved) return "";
    return formatTime(lastSaved);
  };

  return (
    <div
      className="flex h-9 items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      role="status"
      aria-label="Editor status"
    >
      {/* Left side - Save status */}
      <div className="flex items-center gap-4">
        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Save Status */}
        <div className="flex items-center gap-1.5">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Save className="h-3 w-3 text-green-500" />
              <span>Saved{lastSaved && ` at ${formatLastSaved()}`}</span>
            </>
          )}
          {saveStatus === "failed" && (
            <>
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-500">Failed to save</span>
            </>
          )}
          {saveStatus === "readonly" && (
            <>
              <Lock className="h-3 w-3 text-amber-500" />
              <span className="text-amber-500">Read-only mode</span>
            </>
          )}
        </div>
      </div>

      {/* Center - Statistics */}
      <div className="flex items-center gap-4">
        <span>{wordCount} words</span>
        <span className="hidden sm:inline">{charCount} chars</span>
        <span className="hidden sm:inline">{lineCount} lines</span>
        <span className="hidden text-zinc-400 sm:inline">
          {calculateReadingTime(wordCount)}
        </span>
      </div>

      {/* Right side - Cursor position, version */}
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline">
          Ln {cursorLine}, Col {cursorColumn}
        </span>
        <span className="hidden text-zinc-400 md:inline">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </span>
      </div>
    </div>
  );
}
