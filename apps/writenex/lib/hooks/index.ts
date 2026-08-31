/**
 * @fileoverview Barrel export for hooks module
 * @module lib/hooks
 */

// Auto-save hooks
export {
  setGlobalLastSnapshotContent,
  useAutoSave,
  useManualSave,
  useSaveBeforeSwitch,
  useSnapshotBeforeAction,
} from "./useAutoSave";
export type { BackupReminderState } from "./useBackupReminder";
// Backup reminder hook
export { useBackupReminder } from "./useBackupReminder";

// Document initialization hooks
export {
  useActiveDocumentPersistence,
  useDocumentInit,
} from "./useDocumentInit";
export type { UseKeyboardShortcutsOptions } from "./useKeyboardShortcuts";
// Keyboard shortcuts hook
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";

// Online status hook
export { formatOfflineDuration, useOnlineStatus } from "./useOnlineStatus";

// Service worker hook
export { useServiceWorker } from "./useServiceWorker";
export type { StorageInfo } from "./useStorageQuota";
// Storage quota hook
export { formatBytes, useStorageQuota } from "./useStorageQuota";
export type { TocHeading } from "./useTableOfContents";
// Table of contents hook
export {
  extractHeadings,
  scrollToHeading,
  useActiveHeading,
  useTableOfContents,
} from "./useTableOfContents";
