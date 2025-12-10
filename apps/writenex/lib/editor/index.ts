/**
 * @fileoverview Editor components barrel export
 * @module lib/editor
 */

// Core editor components (root level)
export { EditorShortcuts } from "./EditorShortcuts";
export { MarkdownEditor } from "./MarkdownEditor";

// Export utilities
export {
  stripFrontmatter,
  markdownToHtmlFragment,
  markdownToHtmlPage,
  copyHtmlToClipboard,
  downloadHtml,
  sanitizeFilename,
} from "./exportHtml";

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

// Panel components
export {
  SearchReplacePanel,
  TocPanel,
  VersionHistoryPanel,
  type SearchOptions,
} from "./panels";

// Toolbar components
export { DocumentTabs, Header, StatusBar } from "./toolbar";

// Indicator components
export {
  BackupReminder,
  FocusModeOverlay,
  OfflineIndicator,
  StorageWarning,
  UpdatePrompt,
} from "./indicators";
