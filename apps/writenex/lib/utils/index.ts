/**
 * @fileoverview Writenex Utilities
 *
 * Shared utility functions and constants used across the Writenex application.
 *
 * @module lib/utils
 */

// Class name utility
export { cn } from "./cn";
// Application constants
export {
  APP_DESCRIPTION,
  APP_NAME,
  AUTO_SAVE_DEBOUNCE,
  DB_NAME,
  DEFAULT_DOCUMENT_CONTENT,
  DEFAULT_DOCUMENT_TITLE,
  EDITOR_PLACEHOLDER,
  IDLE_THRESHOLD,
  LS_OFFLINE_START,
  LS_STORAGE_WARNING_DISMISSED,
  MAX_VERSIONS_PER_DOCUMENT,
  OFFLINE_MIN_DURATION,
  RECONNECT_AUTO_DISMISS,
  RECONNECT_SHOW_DURATION_THRESHOLD,
  SCROLL_AMOUNT,
  STORAGE_KEY,
  TOOLTIP_DELAY,
  VERSION_MIN_GAP,
  WORDS_PER_MINUTE,
} from "./constants";
// Helper functions
export {
  type ContentStats,
  calculateStats,
  formatFullDateTime,
  formatShortDate,
  formatShortDateTime,
  formatTime,
  isValidUrl,
} from "./helpers";
// Keyboard shortcuts
export {
  getShortcutById,
  getShortcutKey,
  getShortcutsByCategory,
  getShortcutsGroupedByCategory,
  KEYBOARD_SHORTCUTS,
  type KeyboardShortcut,
  SHORTCUT_CATEGORIES,
  type ShortcutCategory,
  type ShortcutId,
  searchShortcuts,
} from "./keyboard-shortcuts";
// Storage utilities
export {
  getStoragePersistenceStatus,
  isStoragePersistent,
  requestPersistentStorage,
  type StoragePersistenceStatus,
} from "./storage";
