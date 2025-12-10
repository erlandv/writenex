/**
 * @fileoverview Focus Mode Overlay Component
 *
 * This component provides the overlay UI for Focus Mode, including a
 * floating exit button that appears on hover. It enables distraction-free
 * writing by providing minimal controls while maintaining escape routes.
 *
 * ## Features:
 * - Floating exit button (semi-transparent, full opacity on hover)
 * - Positioned in bottom-right corner
 * - Tooltip with keyboard shortcut hint
 * - ARIA announcements for accessibility
 * - Only renders when Focus Mode is active
 *
 * @module components/editor/FocusModeOverlay
 * @see {@link useKeyboardShortcuts} - Handles Escape key to exit
 * @see {@link Header} - Contains Focus Mode toggle button
 */

"use client";

import React from "react";
import { Minimize2 } from "lucide-react";
import { SimpleTooltip } from "@/lib/ui"; // simple-tooltip";
import { useEditorStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Floating exit button component for Focus Mode.
 *
 * Renders a semi-transparent button in the bottom-right corner that
 * becomes fully opaque on hover. Clicking exits Focus Mode.
 *
 * @component
 * @example
 * ```tsx
 * // Used in MarkdownEditor or page layout
 * function Editor() {
 *   return (
 *     <>
 *       <EditorContent />
 *       <FocusModeOverlay />
 *     </>
 *   );
 * }
 * ```
 *
 * @returns Overlay element or null if not in Focus Mode
 *
 * @see {@link Header} - Contains the toggle button to enter Focus Mode
 */
export function FocusModeOverlay(): React.ReactElement | null {
  const { isFocusMode, setFocusMode } = useEditorStore();

  if (!isFocusMode) return null;

  const handleExitFocusMode = () => {
    setFocusMode(false);

    // ARIA announcement
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = "Focus mode disabled";
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  return (
    <div
      className="fixed right-6 bottom-6 z-50"
      role="region"
      aria-label="Focus mode controls"
    >
      <SimpleTooltip content="Exit Focus Mode (Esc)" side="left">
        <button
          type="button"
          onClick={handleExitFocusMode}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-zinc-900/70 dark:bg-zinc-100/70",
            "text-white dark:text-zinc-900",
            "opacity-30 hover:opacity-100",
            "transition-all duration-300 ease-in-out",
            "hover:scale-110 hover:shadow-lg",
            "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none",
            "cursor-pointer"
          )}
          aria-label="Exit Focus Mode (Escape)"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      </SimpleTooltip>
    </div>
  );
}
