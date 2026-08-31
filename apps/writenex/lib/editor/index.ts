/**
 * @fileoverview Editor components barrel export
 * @module lib/editor
 */

// Dialog components
export {
  ClearEditorDialog,
  DeleteDocumentDialog,
  DeleteVersionDialog,
  ImageDialog,
  KeyboardShortcutsModal,
  LinkDialog,
  WelcomeTourModal,
} from "./dialogs";
// Core editor components (root level)
export { EditorShortcuts } from "./EditorShortcuts";

// Export utilities
export {
  copyHtmlToClipboard,
  downloadHtml,
  markdownToHtmlFragment,
  markdownToHtmlPage,
  sanitizeFilename,
  stripFrontmatter,
} from "./exportHtml";
// Indicator components
export {
  BackupReminder,
  FocusModeOverlay,
  OfflineIndicator,
  StorageWarning,
  UpdatePrompt,
} from "./indicators";
export { MarkdownEditor } from "./MarkdownEditor";
// Panel components
export {
  type SearchOptions,
  SearchReplacePanel,
  TocPanel,
  VersionHistoryPanel,
} from "./panels";
// Toolbar components
export { DocumentTabs, Header, StatusBar } from "./toolbar";
