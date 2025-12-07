/**
 * @fileoverview Editor components barrel export
 *
 * Main entry point for all editor components. Provides backward-compatible
 * imports for consumers that import from "@/components/editor".
 *
 * Components are organized into logical subdirectories:
 * - dialogs/: Modal dialogs and confirmation prompts
 * - panels/: Sidebar panels (ToC, version history, search)
 * - toolbar/: Header, tabs, and status bar
 * - indicators/: Status indicators and notifications
 *
 * @module components/editor
 */

// Core editor components (root level)
export { EditorShortcuts } from "./EditorShortcuts";
export { MarkdownEditor } from "./MarkdownEditor";

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
