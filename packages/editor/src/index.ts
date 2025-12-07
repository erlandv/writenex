/**
 * @fileoverview Editor components barrel export
 *
 * Main entry point for all editor components.
 *
 * Components are organized into logical subdirectories:
 * - dialogs/: Modal dialogs and confirmation prompts
 * - panels/: Sidebar panels (ToC, version history, search)
 * - toolbar/: Header, tabs, and status bar
 * - indicators/: Status indicators and notifications
 *
 * @module editor
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
