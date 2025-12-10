/**
 * @fileoverview Barrel export for hooks module
 * @module lib/hooks
 */

// Auto-save hooks
export {
  useAutoSave,
  useManualSave,
  useSnapshotBeforeAction,
  useSaveBeforeSwitch,
  setGlobalLastSnapshotContent,
} from "./useAutoSave";

// Backup reminder hook
export { useBackupReminder } from "./useBackupReminder";
export type { BackupReminderState } from "./useBackupReminder";

// Document initialization hooks
export {
  useDocumentInit,
  useActiveDocumentPersistence,
} from "./useDocumentInit";

// Keyboard shortcuts hook
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";
export type { UseKeyboardShortcutsOptions } from "./useKeyboardShortcuts";

// Online status hook
export { useOnlineStatus, formatOfflineDuration } from "./useOnlineStatus";

// Service worker hook
export { useServiceWorker } from "./useServiceWorker";

// Storage quota hook
export { useStorageQuota, formatBytes } from "./useStorageQuota";
export type { StorageInfo } from "./useStorageQuota";

// Table of contents hook
export {
  useTableOfContents,
  useActiveHeading,
  scrollToHeading,
  extractHeadings,
} from "./useTableOfContents";
export type { TocHeading } from "./useTableOfContents";
