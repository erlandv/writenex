/**
 * @fileoverview Centralized keyboard shortcuts configuration
 *
 * Single source of truth for all keyboard shortcuts in the Writenex application.
 * This module defines shortcut metadata used by:
 * - KeyboardShortcutsModal (display reference)
 * - useKeyboardShortcuts (global shortcuts handler)
 * - EditorShortcuts (Lexical editor shortcuts)
 *
 * ## Categories:
 * - **Formatting**: Text formatting (bold, italic, etc.)
 * - **Blocks**: Block-level elements (headings, lists, blockquote)
 * - **Actions**: Editor actions (save, undo, insert)
 * - **Documents**: Document management (new, close, switch)
 * - **Navigation**: Panel and search navigation
 * - **Modes**: Mode toggles (read-only, focus, shortcuts)
 *
 * ## Architecture:
 * Each shortcut has a unique ID used for programmatic access.
 * The display key (e.g., "Ctrl+B") is separate from the detection logic
 * which handles cross-platform differences (Cmd on Mac, Ctrl on Windows).
 *
 * @module lib/keyboardShortcuts
 * @see {@link KeyboardShortcutsModal} - Displays shortcuts
 * @see {@link useKeyboardShortcuts} - Handles global shortcuts
 * @see {@link EditorShortcuts} - Handles Lexical shortcuts
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Categories for grouping keyboard shortcuts.
 */
export type ShortcutCategory =
  | "Formatting"
  | "Blocks"
  | "Actions"
  | "Documents"
  | "Navigation"
  | "Modes";

/**
 * Unique identifier for each keyboard shortcut.
 * Used for programmatic access and consistency across the codebase.
 */
export type ShortcutId =
  // Formatting
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "inlineCode"
  // Blocks
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "orderedList"
  | "unorderedList"
  | "checklist"
  | "blockquote"
  // Actions
  | "undo"
  | "redo"
  | "save"
  | "insertLink"
  | "insertImage"
  | "clearEditor"
  // Documents
  | "newDocument"
  | "closeDocument"
  | "nextDocument"
  | "prevDocument"
  | "switchToDocument"
  // Navigation
  | "tableOfContents"
  | "search"
  | "versionHistory"
  | "closeModal"
  | "nextMatch"
  | "prevMatch"
  // Modes
  | "toggleReadOnly"
  | "toggleFocusMode"
  | "keyboardShortcuts"
  | "help";

/**
 * Keyboard shortcut definition.
 *
 * @interface KeyboardShortcut
 */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: ShortcutId;
  /** Display key combination (e.g., "Ctrl+B") - uses Ctrl for cross-platform display */
  key: string;
  /** Human-readable description of the action */
  description: string;
  /** Category for grouping in the shortcuts modal */
  category: ShortcutCategory;
  /** Whether this shortcut is disabled when in read-only mode */
  disabledInReadOnly: boolean;
}

// =============================================================================
// SHORTCUT DEFINITIONS - SINGLE SOURCE OF TRUTH
// =============================================================================

/**
 * Complete list of all keyboard shortcuts in the application.
 * This is the single source of truth - all other usages should reference this.
 */
export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcut[] = [
  // ===== Formatting =====
  {
    id: "bold",
    key: "Ctrl+B",
    description: "Bold",
    category: "Formatting",
    disabledInReadOnly: true,
  },
  {
    id: "italic",
    key: "Ctrl+I",
    description: "Italic",
    category: "Formatting",
    disabledInReadOnly: true,
  },
  {
    id: "underline",
    key: "Ctrl+U",
    description: "Underline",
    category: "Formatting",
    disabledInReadOnly: true,
  },
  {
    id: "strikethrough",
    key: "Ctrl+Shift+S",
    description: "Strikethrough",
    category: "Formatting",
    disabledInReadOnly: true,
  },
  {
    id: "inlineCode",
    key: "Ctrl+Shift+C",
    description: "Inline Code",
    category: "Formatting",
    disabledInReadOnly: true,
  },

  // ===== Blocks =====
  {
    id: "heading1",
    key: "Ctrl+Alt+1",
    description: "Heading 1",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "heading2",
    key: "Ctrl+Alt+2",
    description: "Heading 2",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "heading3",
    key: "Ctrl+Alt+3",
    description: "Heading 3",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "heading4",
    key: "Ctrl+Alt+4",
    description: "Heading 4",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "heading5",
    key: "Ctrl+Alt+5",
    description: "Heading 5",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "heading6",
    key: "Ctrl+Alt+6",
    description: "Heading 6",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "orderedList",
    key: "Ctrl+Shift+7",
    description: "Ordered List",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "unorderedList",
    key: "Ctrl+Shift+8",
    description: "Unordered List",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "checklist",
    key: "Ctrl+Shift+9",
    description: "Checklist",
    category: "Blocks",
    disabledInReadOnly: true,
  },
  {
    id: "blockquote",
    key: "Ctrl+Shift+Q",
    description: "Blockquote",
    category: "Blocks",
    disabledInReadOnly: true,
  },

  // ===== Actions =====
  {
    id: "undo",
    key: "Ctrl+Z",
    description: "Undo",
    category: "Actions",
    disabledInReadOnly: true,
  },
  {
    id: "redo",
    key: "Ctrl+Shift+Z",
    description: "Redo",
    category: "Actions",
    disabledInReadOnly: true,
  },
  {
    id: "save",
    key: "Ctrl+S",
    description: "Save",
    category: "Actions",
    disabledInReadOnly: true,
  },
  {
    id: "insertLink",
    key: "Ctrl+K",
    description: "Insert Link",
    category: "Actions",
    disabledInReadOnly: true,
  },
  {
    id: "insertImage",
    key: "Ctrl+Alt+I",
    description: "Insert Image",
    category: "Actions",
    disabledInReadOnly: true,
  },
  {
    id: "clearEditor",
    key: "Ctrl+Shift+Delete",
    description: "Clear Editor",
    category: "Actions",
    disabledInReadOnly: true,
  },

  // ===== Documents =====
  {
    id: "newDocument",
    key: "Alt+N",
    description: "New Document",
    category: "Documents",
    disabledInReadOnly: false,
  },
  {
    id: "closeDocument",
    key: "Alt+W",
    description: "Close Document",
    category: "Documents",
    disabledInReadOnly: false,
  },
  {
    id: "nextDocument",
    key: "Alt+→",
    description: "Next Document",
    category: "Documents",
    disabledInReadOnly: false,
  },
  {
    id: "prevDocument",
    key: "Alt+←",
    description: "Previous Document",
    category: "Documents",
    disabledInReadOnly: false,
  },
  {
    id: "switchToDocument",
    key: "Alt+1-9",
    description: "Switch to Document 1-9",
    category: "Documents",
    disabledInReadOnly: false,
  },

  // ===== Navigation =====
  {
    id: "tableOfContents",
    key: "Alt+T",
    description: "Table of Contents",
    category: "Navigation",
    disabledInReadOnly: false,
  },
  {
    id: "search",
    key: "Ctrl+F",
    description: "Search & Replace",
    category: "Navigation",
    disabledInReadOnly: false,
  },
  {
    id: "versionHistory",
    key: "Ctrl+H",
    description: "Version History",
    category: "Navigation",
    disabledInReadOnly: false,
  },
  {
    id: "closeModal",
    key: "Escape",
    description: "Close Modals/Panels/Focus Mode",
    category: "Navigation",
    disabledInReadOnly: false,
  },
  {
    id: "nextMatch",
    key: "Enter",
    description: "Next Match (in search)",
    category: "Navigation",
    disabledInReadOnly: false,
  },
  {
    id: "prevMatch",
    key: "Shift+Enter",
    description: "Previous Match (in search)",
    category: "Navigation",
    disabledInReadOnly: false,
  },

  // ===== Modes =====
  {
    id: "toggleReadOnly",
    key: "Ctrl+Shift+R",
    description: "Toggle Read-Only Mode",
    category: "Modes",
    disabledInReadOnly: false,
  },
  {
    id: "toggleFocusMode",
    key: "Ctrl+Shift+E",
    description: "Toggle Focus Mode",
    category: "Modes",
    disabledInReadOnly: false,
  },
  {
    id: "keyboardShortcuts",
    key: "Ctrl+/",
    description: "Keyboard Shortcuts",
    category: "Modes",
    disabledInReadOnly: false,
  },
  {
    id: "help",
    key: "F1",
    description: "Help & Welcome Tour",
    category: "Modes",
    disabledInReadOnly: false,
  },
] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Category display order for the shortcuts modal.
 */
export const SHORTCUT_CATEGORIES: readonly ShortcutCategory[] = [
  "Formatting",
  "Blocks",
  "Actions",
  "Documents",
  "Navigation",
  "Modes",
] as const;

/**
 * Get a shortcut by its ID.
 *
 * @param id - The shortcut ID to find
 * @returns The shortcut definition or undefined if not found
 *
 * @example
 * ```ts
 * const boldShortcut = getShortcutById("bold");
 * // { id: "bold", key: "Ctrl+B", description: "Bold", ... }
 * ```
 */
export function getShortcutById(id: ShortcutId): KeyboardShortcut | undefined {
  return KEYBOARD_SHORTCUTS.find((s) => s.id === id);
}

/**
 * Get the display key for a shortcut by ID.
 *
 * @param id - The shortcut ID
 * @returns The display key string (e.g., "Ctrl+B") or undefined
 *
 * @example
 * ```ts
 * const key = getShortcutKey("bold");
 * // "Ctrl+B"
 * ```
 */
export function getShortcutKey(id: ShortcutId): string | undefined {
  return getShortcutById(id)?.key;
}

/**
 * Get shortcuts filtered by category.
 *
 * @param category - The category to filter by
 * @returns Array of shortcuts in that category
 */
export function getShortcutsByCategory(
  category: ShortcutCategory
): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS.filter((s) => s.category === category);
}

/**
 * Get shortcuts grouped by category.
 *
 * @returns Record mapping category to array of shortcuts
 */
export function getShortcutsGroupedByCategory(): Record<
  ShortcutCategory,
  KeyboardShortcut[]
> {
  const result = {} as Record<ShortcutCategory, KeyboardShortcut[]>;

  for (const category of SHORTCUT_CATEGORIES) {
    result[category] = getShortcutsByCategory(category);
  }

  return result;
}

/**
 * Search shortcuts by query string.
 * Matches against key, description, and category.
 *
 * @param query - Search query (case-insensitive)
 * @returns Filtered array of matching shortcuts
 */
export function searchShortcuts(query: string): KeyboardShortcut[] {
  if (!query) return [...KEYBOARD_SHORTCUTS];

  const lowerQuery = query.toLowerCase();
  return KEYBOARD_SHORTCUTS.filter(
    (s) =>
      s.key.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.category.toLowerCase().includes(lowerQuery)
  );
}
