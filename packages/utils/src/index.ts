/**
 * @fileoverview Writenex Utilities Package
 *
 * Shared utility functions and constants used across all Writenex packages.
 * This package has no internal dependencies and serves as the foundation
 * for other packages.
 *
 * ## Exports:
 * - `cn` - Tailwind CSS class name utility
 * - Helper functions (URL validation, stats, date formatting)
 * - Constants (app config, timing, limits)
 * - Storage utilities (persistent storage)
 * - Keyboard shortcuts configuration
 *
 * @module @writenex/utils
 */

// Class name utility
export { cn } from "./cn";

// Helper functions
export {
  isValidUrl,
  calculateStats,
  formatTime,
  formatShortDateTime,
  formatShortDate,
  formatFullDateTime,
  type ContentStats,
} from "./helpers";

// Application constants
export {
  // App metadata
  APP_NAME,
  APP_DESCRIPTION,
  // Storage keys
  STORAGE_KEY,
  DB_NAME,
  // Auto-save timing
  AUTO_SAVE_DEBOUNCE,
  IDLE_THRESHOLD,
  VERSION_MIN_GAP,
  MAX_VERSIONS_PER_DOCUMENT,
  // Document defaults
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_DOCUMENT_CONTENT,
  EDITOR_PLACEHOLDER,
  // UI configuration
  TOOLTIP_DELAY,
  SCROLL_AMOUNT,
  WORDS_PER_MINUTE,
  // PWA constants
  LS_OFFLINE_START,
  LS_STORAGE_WARNING_DISMISSED,
  OFFLINE_MIN_DURATION,
  RECONNECT_SHOW_DURATION_THRESHOLD,
  RECONNECT_AUTO_DISMISS,
} from "./constants";

// Storage utilities
export {
  requestPersistentStorage,
  isStoragePersistent,
  getStoragePersistenceStatus,
  type StoragePersistenceStatus,
} from "./storage";

// Keyboard shortcuts
export {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  getShortcutById,
  getShortcutKey,
  getShortcutsByCategory,
  getShortcutsGroupedByCategory,
  searchShortcuts,
  type ShortcutCategory,
  type ShortcutId,
  type KeyboardShortcut,
} from "./keyboardShortcuts";
