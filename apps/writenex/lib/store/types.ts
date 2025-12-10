/**
 * @fileoverview Editor state type definitions
 *
 * Type definitions for editor UI state, preferences, and the main
 * Zustand store interface.
 *
 * @module lib/store/types
 * @see {@link useEditorStore} - Zustand store implementing EditorState
 */

/**
 * View mode options for the editor.
 * - `edit`: WYSIWYG editor only
 * - `split`: Editor and source side-by-side
 * - `source`: Raw Markdown source only
 */
export type ViewMode = "edit" | "split" | "source";

/**
 * Save status indicator options.
 */
export type SaveStatus = "saved" | "saving" | "failed" | "readonly";

/**
 * Application theme options.
 */
export type Theme = "light" | "dark" | "system";

/**
 * Code syntax highlighting theme options.
 */
export type SyntaxTheme =
  | "github-light"
  | "github-dark"
  | "dracula"
  | "nord"
  | "one-dark";

/**
 * Document metadata stored in Zustand store.
 */
export interface DocumentMeta {
  id: string;
  title: string;
  updatedAt: Date;
}

/**
 * Complete editor store state interface.
 */
export interface EditorState {
  // Document Management
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  setDocuments: (documents: DocumentMeta[]) => void;
  setActiveDocumentId: (id: string | null) => void;
  addDocument: (doc: DocumentMeta) => void;
  removeDocument: (id: string) => void;
  updateDocumentMeta: (id: string, updates: Partial<DocumentMeta>) => void;

  // Active Document Content
  content: string;
  setContent: (content: string) => void;

  // Read-only Mode
  isReadOnly: boolean;
  setReadOnly: (readOnly: boolean) => void;
  toggleReadOnly: () => void;

  // View Mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  syntaxTheme: SyntaxTheme;
  setSyntaxTheme: (theme: SyntaxTheme) => void;

  // Save Status
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  lastVersionSnapshot: Date | null;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSaved: (date: Date | null) => void;
  setLastVersionSnapshot: (date: Date | null) => void;

  // UI Panel States
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchActiveIndex: number;
  setSearchActiveIndex: (index: number) => void;
  isVersionHistoryOpen: boolean;
  setVersionHistoryOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  isClearDialogOpen: boolean;
  setClearDialogOpen: (open: boolean) => void;
  isDeleteDocumentDialogOpen: boolean;
  setDeleteDocumentDialogOpen: (open: boolean) => void;
  documentToDelete: string | null;
  setDocumentToDelete: (id: string | null) => void;

  // Focus Mode
  isFocusMode: boolean;
  setFocusMode: (focusMode: boolean) => void;
  toggleFocusMode: () => void;

  // Table of Contents
  isTocPanelOpen: boolean;
  setTocPanelOpen: (open: boolean) => void;
  toggleTocPanel: () => void;

  // Onboarding
  hasSeenOnboarding: boolean;
  isOnboardingOpen: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  openOnboarding: () => void;
  completeOnboarding: () => void;

  // Version History
  versionHistoryRefreshKey: number;
  triggerVersionHistoryRefresh: () => void;

  // Cursor Position
  cursorLine: number;
  cursorColumn: number;
  setCursorPosition: (line: number, column: number) => void;

  // User Settings
  autoSaveInterval: number;
  setAutoSaveInterval: (interval: number) => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (show: boolean) => void;
  confirmClearEditor: boolean;
  setConfirmClearEditor: (confirm: boolean) => void;

  // Initialization
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  isInitialized: boolean;
  setInitialized: (initialized: boolean) => void;
}
