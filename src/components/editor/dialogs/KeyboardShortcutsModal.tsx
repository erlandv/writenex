/**
 * @fileoverview Keyboard Shortcuts Modal Component
 *
 * This component displays a searchable reference modal for all keyboard
 * shortcuts available in the editor. It organizes shortcuts by category
 * and indicates which shortcuts are disabled in read-only mode.
 *
 * ## Features:
 * - Searchable shortcut list with real-time filtering
 * - Read-only mode indicator for disabled shortcuts
 * - Grouped by category with visual separation
 * - Keyboard-accessible (Ctrl+/ to toggle)
 *
 * ## Architecture:
 * Uses centralized shortcut definitions from `@/lib/keyboardShortcuts`
 * as the single source of truth for all keyboard shortcuts.
 *
 * @module components/editor/KeyboardShortcutsModal
 * @see {@link KEYBOARD_SHORTCUTS} - Centralized shortcut definitions
 * @see {@link useKeyboardShortcuts} - Hook that handles actual shortcuts
 * @see {@link EditorShortcuts} - Lexical-level shortcuts
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/store/editorStore";
import { cn } from "@/lib/utils";
import {
  SHORTCUT_CATEGORIES,
  searchShortcuts,
  type KeyboardShortcut,
  type ShortcutCategory,
} from "@/lib/keyboardShortcuts";

/**
 * Modal component displaying all available keyboard shortcuts.
 *
 * Features a search box for filtering shortcuts and groups them by category.
 * When in read-only mode, shows which shortcuts are disabled with visual
 * indication and a warning banner.
 *
 * The modal is controlled by Zustand store (isShortcutsOpen) and can be
 * opened via Ctrl+/ keyboard shortcut or the header toolbar button.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage in MarkdownEditor
 * function MarkdownEditor() {
 *   return (
 *     <>
 *       <Editor />
 *       <KeyboardShortcutsModal />
 *     </>
 *   );
 * }
 * ```
 *
 * @returns Modal dialog with searchable shortcuts list, or null if closed
 *
 * @see {@link Header} - Contains button to open this modal
 * @see {@link useKeyboardShortcuts} - Handles Ctrl+/ to open this modal
 */
export function KeyboardShortcutsModal(): React.ReactElement | null {
  const { isShortcutsOpen, setShortcutsOpen, isReadOnly } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Use centralized search function for filtering
  const filteredShortcuts = useMemo(
    () => searchShortcuts(searchQuery),
    [searchQuery]
  );

  // Group filtered shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    filteredShortcuts.forEach((shortcut) => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });
    return groups;
  }, [filteredShortcuts]);

  return (
    <Dialog open={isShortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent
        className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="py-2">
          <Input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus-visible:ring-blue-500"
            aria-label="Search keyboard shortcuts"
          />
        </div>

        {/* Read-only indicator */}
        {isReadOnly && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <span className="font-medium">Note:</span> Some shortcuts are
            disabled in read-only mode (shown with reduced opacity)
          </div>
        )}

        {/* Shortcuts List - Use centralized SHORTCUT_CATEGORIES for consistent ordering */}
        <div className="flex-1 overflow-y-auto py-2">
          {SHORTCUT_CATEGORIES.map((category: ShortcutCategory) => {
            const categoryShortcuts = groupedShortcuts[category];
            if (!categoryShortcuts || categoryShortcuts.length === 0)
              return null;

            return (
              <div key={category} className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {category}
                </h3>
                <ul className="space-y-1">
                  {categoryShortcuts.map((shortcut) => (
                    <li
                      key={shortcut.key}
                      className={cn(
                        "flex items-center justify-between rounded px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5",
                        isReadOnly &&
                          shortcut.disabledInReadOnly &&
                          "opacity-50"
                      )}
                    >
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.key.split("+").map((key, index) => (
                          <React.Fragment key={key}>
                            {index > 0 && (
                              <span className="text-zinc-400">+</span>
                            )}
                            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                        {isReadOnly && shortcut.disabledInReadOnly && (
                          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                            (disabled)
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 pt-2 text-center text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Press{" "}
          <kbd className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-700">
            Ctrl
          </kbd>{" "}
          +{" "}
          <kbd className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-700">
            /
          </kbd>{" "}
          to toggle this panel
        </div>
      </DialogContent>
    </Dialog>
  );
}
