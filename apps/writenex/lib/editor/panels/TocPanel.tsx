/**
 * @fileoverview Table of Contents Panel Component
 *
 * This component displays an auto-generated table of contents for the current
 * document. It shows all headings (H1-H6) with visual hierarchy via indentation
 * and allows click-to-jump navigation.
 *
 * ## Features:
 * - Auto-generated from document headings
 * - Visual hierarchy with indentation based on heading level
 * - Click to jump to heading in editor
 * - Active heading highlight based on scroll position
 * - Collapsible sidebar with smooth animation
 * - Hidden in Focus Mode
 *
 * ## Styling:
 * - Panel width: 200px (fixed)
 * - Positioned on left side of editor
 * - Matches Version History panel styling conventions
 *
 * @module components/editor/TocPanel
 * @see {@link useTableOfContents} - Hook for extracting headings
 * @see {@link VersionHistoryPanel} - Similar panel on right side
 */

"use client";

import React, { useCallback } from "react";
import { List, X } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import {
  useTableOfContents,
  useActiveHeading,
  scrollToHeading,
  type TocHeading,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Indentation classes for each heading level.
 * H1 has least indentation, H6 has most.
 */
const INDENT_CLASSES: Record<number, string> = {
  1: "pl-2",
  2: "pl-4",
  3: "pl-6",
  4: "pl-8",
  5: "pl-10",
  6: "pl-12",
};

/**
 * Typography classes for each heading level.
 * H1-H2 are more prominent, H3-H6 are subtler.
 */
const TYPOGRAPHY_CLASSES: Record<number, string> = {
  1: "font-semibold text-zinc-900 dark:text-zinc-100",
  2: "font-medium text-zinc-800 dark:text-zinc-200",
  3: "font-normal text-zinc-600 dark:text-zinc-400",
  4: "font-normal text-zinc-600 dark:text-zinc-400",
  5: "font-normal text-zinc-500 dark:text-zinc-500",
  6: "font-normal text-zinc-500 dark:text-zinc-500",
};

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

/**
 * Props for the TocItem component
 */
interface TocItemProps {
  /** The heading data */
  heading: TocHeading;
  /** Whether this heading is currently active (visible in viewport) */
  isActive: boolean;
  /** Callback when the item is clicked */
  onClick: (text: string) => void;
}

/**
 * Individual ToC item representing a heading.
 *
 * @param props - Component props
 * @returns A clickable list item
 */
function TocItem({
  heading,
  isActive,
  onClick,
}: TocItemProps): React.ReactElement {
  const handleClick = useCallback(() => {
    onClick(heading.text);
  }, [heading.text, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(heading.text);
      }
    },
    [heading.text, onClick]
  );

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full cursor-pointer rounded-sm py-1.5 pr-2 text-left text-sm transition-colors",
          "hover:bg-black/5 dark:hover:bg-white/5",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          INDENT_CLASSES[heading.level] || "pl-2",
          TYPOGRAPHY_CLASSES[heading.level] || "font-normal text-zinc-600",
          isActive &&
            "border-l-2 border-blue-500 bg-blue-50 pl-2! dark:bg-blue-900/20"
        )}
        aria-current={isActive ? "true" : undefined}
        title={heading.text}
      >
        <span className="block truncate">{heading.text}</span>
      </button>
    </li>
  );
}

/**
 * Empty state when no headings are found in the document.
 *
 * @returns Empty state message
 */
function EmptyState(): React.ReactElement {
  return (
    <div className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
      <List className="mx-auto mb-2 h-8 w-8 opacity-50" />
      <p>No headings found</p>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        Add headings (# H1, ## H2, etc.) to see them here
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Table of Contents panel component.
 *
 * Displays an auto-generated list of document headings on the left side
 * of the editor. Allows quick navigation by clicking on headings.
 *
 * @component
 * @example
 * ```tsx
 * // Used in MarkdownEditor.tsx
 * <div className="flex-1 flex overflow-hidden">
 *   <TocPanel />
 *   <div className="flex-1">{/* Editor *\/}</div>
 *   <VersionHistoryPanel />
 * </div>
 * ```
 *
 * @returns The ToC panel or null if closed/in focus mode
 */
export function TocPanel(): React.ReactElement | null {
  const { isTocPanelOpen, setTocPanelOpen, isFocusMode } = useEditorStore();
  const { headings } = useTableOfContents();
  const activeHeadingId = useActiveHeading(headings);

  const handleClose = useCallback(() => {
    setTocPanelOpen(false);
  }, [setTocPanelOpen]);

  const handleHeadingClick = useCallback((text: string) => {
    scrollToHeading(text);
  }, []);

  // Hidden in Focus Mode
  if (isFocusMode) {
    return null;
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
        "overflow-hidden transition-all duration-300 ease-in-out",
        isTocPanelOpen ? "w-[200px]" : "w-0"
      )}
      role="navigation"
      aria-label="Table of contents"
      aria-hidden={!isTocPanelOpen}
    >
      <div className="flex h-full w-[200px] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <List className="h-4 w-4" />
            Contents
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "cursor-pointer rounded-md p-1 transition-colors",
              "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
              "hover:bg-black/10 dark:hover:bg-white/10",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
            aria-label="Close table of contents"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {headings.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-0.5" role="list">
              {headings.map((heading) => (
                <TocItem
                  key={heading.id}
                  heading={heading}
                  isActive={heading.id === activeHeadingId}
                  onClick={handleHeadingClick}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer with count */}
        {headings.length > 0 && (
          <div className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {headings.length} heading{headings.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </aside>
  );
}
