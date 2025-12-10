/**
 * @fileoverview Writenex Utilities
 *
 * Shared utility functions and constants used across the Writenex application.
 *
 * @module lib/utils
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
  APP_NAME,
  APP_DESCRIPTION,
  STORAGE_KEY,
  DB_NAME,
  AUTO_SAVE_DEBOUNCE,
  IDLE_THRESHOLD,
  VERSION_MIN_GAP,
  MAX_VERSIONS_PER_DOCUMENT,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_DOCUMENT_CONTENT,
  EDITOR_PLACEHOLDER,
  TOOLTIP_DELAY,
  SCROLL_AMOUNT,
  WORDS_PER_MINUTE,
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
} from "./keyboard-shortcuts";
