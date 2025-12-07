/**
 * @fileoverview Editor page component for the Writenex application
 *
 * This page hosts the main Markdown editor application. It's a client-side
 * component that manages the editor UI state including focus mode with
 * hover-to-reveal header functionality.
 *
 * ## Features:
 * - Dynamic import of MDXEditor (avoids SSR issues)
 * - Focus mode with hover-to-reveal header
 * - PWA update prompt integration
 * - Responsive layout with full-height editor
 *
 * ## Architecture:
 * The page uses dynamic imports for the heavy MDXEditor component to
 * optimize initial page load. The focus mode header visibility is managed
 * locally while the focus mode state itself is stored in Zustand.
 *
 * @module app/editor/page
 * @see {@link MarkdownEditor} - Main editor component
 * @see {@link Header} - Application header with toolbar
 * @see {@link FocusModeOverlay} - Focus mode exit button
 * @see {@link useEditorStore} - Global editor state
 */

"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header, FocusModeOverlay, UpdatePrompt } from "@writenex/editor";
import { useEditorStore } from "@writenex/store";
import { cn } from "@writenex/utils";

/**
 * Dynamically imported MarkdownEditor component.
 *
 * Uses Next.js dynamic import to avoid SSR issues with MDXEditor
 * which relies on browser APIs. Shows a loading spinner during load.
 *
 * @see {@link MarkdownEditor} - The actual editor component
 */
const MarkdownEditor = dynamic(
  () =>
    import("@writenex/editor").then(
      (mod) => mod.MarkdownEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      </div>
    ),
  }
);

/**
 * Editor page component that hosts the full Markdown editor application.
 *
 * Manages the focus mode UI state including the hover-to-reveal header.
 * When focus mode is active, the header slides up and becomes hidden,
 * but can be revealed by hovering over the top edge of the screen.
 *
 * @component
 * @example
 * ```tsx
 * // This page is automatically rendered by Next.js App Router
 * // when visiting /editor
 * ```
 *
 * @returns The editor page with header, main editor area, focus mode overlay, and PWA update prompt
 */
export default function EditorPage(): React.ReactElement {
  const { isFocusMode } = useEditorStore();
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  /**
   * Handles mouse entering the trigger zone at the top edge.
   * Shows the header when in focus mode.
   */
  const handleTriggerEnter = useCallback(() => {
    if (isFocusMode) {
      setIsHeaderVisible(true);
    }
  }, [isFocusMode]);

  /**
   * Handles mouse leaving the header area.
   * Hides the header when in focus mode.
   */
  const handleHeaderLeave = useCallback(() => {
    if (isFocusMode) {
      setIsHeaderVisible(false);
    }
  }, [isFocusMode]);

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-900">
      {/* Header with hover-to-reveal in focus mode */}
      <div className="relative" onMouseLeave={handleHeaderLeave}>
        {/* Invisible trigger zone at top edge (only in focus mode) */}
        {isFocusMode && !isHeaderVisible && (
          <div
            className="absolute top-0 right-0 left-0 z-50 h-4 cursor-default"
            onMouseEnter={handleTriggerEnter}
          />
        )}

        {/* Header */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isFocusMode &&
              !isHeaderVisible &&
              "absolute top-0 right-0 left-0 z-40 -translate-y-full opacity-0",
            isFocusMode &&
              isHeaderVisible &&
              "relative z-40 translate-y-0 opacity-100 shadow-lg"
          )}
        >
          <Header />
        </div>
      </div>

      <main id="main-content" className="flex-1 overflow-hidden">
        <MarkdownEditor />
      </main>

      {/* Focus Mode Overlay (floating exit button) */}
      <FocusModeOverlay />

      {/* PWA Update Prompt */}
      <UpdatePrompt />
    </div>
  );
}
