/**
 * @fileoverview Editor state type definitions
 *
 * Type definitions for editor UI state, preferences, and the main
 * Zustand store interface. These types define the shape of all
 * editor-related state managed in memory.
 *
 * @module store/types
 * @see {@link useEditorStore} - Zustand store implementing EditorState
 */

// =============================================================================
// EDITOR TYPES
// =============================================================================

/**
 * View mode options for the editor.
 * - `edit`: WYSIWYG editor only
 * - `split`: Editor and source side-by-side
 * - `source`: Raw Markdown source only
 */
export type ViewMode = "edit" | "split" | "source";

/**
 * Save status indicator options.
 * - `saved`: Content is saved and up to date
 * - `saving`: Save operation in progress
 * - `failed`: Save operation failed
 * - `readonly`: Document is in read-only mode
 */
export type SaveStatus = "saved" | "saving" | "failed" | "readonly";

/**
 * Application theme options.
 * - `light`: Light color scheme
 * - `dark`: Dark color scheme
 * - `system`: Follow system preference
 */
export type Theme = "light" | "dark" | "system";

/**
 * Code syntax highlighting theme options.
 * Used for code blocks in the editor.
 */
export type SyntaxTheme =
  | "github-light"
  | "github-dark"
  | "dracula"
  | "nord"
  | "one-dark";

/**
 * Document metadata stored in Zustand store.
 *
 * Lightweight representation of a document for the UI.
 * Full content is stored in IndexedDB, not in Zustand,
 * to keep the store fast and prevent memory issues.
 *
 * @interface DocumentMeta
 */
export interface DocumentMeta {
  /** Unique document identifier */
  id: string;
  /** Document title for display in tabs */
  title: string;
  /** Last update timestamp for sorting */
  updatedAt: Date;
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

/**
 * Complete editor store state interface.
 *
 * Defines all state properties and actions for the Zustand store.
 * Organized into logical groups:
 * - Document management
 * - Active document content
 * - Editor modes (read-only, focus, view)
 * - Theme settings
 * - Save status
 * - UI panel states
 * - Onboarding
 * - Cursor position
 * - User settings
 * - Initialization
 *
 * @interface EditorState
 */
export interface EditorState {
  // ===== Document Management =====
  /** List of all document metadata */
  documents: DocumentMeta[];
  /** Currently active document ID */
  activeDocumentId: string | null;
  /** Replace entire documents list */
  setDocuments: (documents: DocumentMeta[]) => void;
  /** Set the active document */
  setActiveDocumentId: (id: string | null) => void;
  /** Add a new document to the list */
  addDocument: (doc: DocumentMeta) => void;
  /** Remove a document from the list */
  removeDocument: (id: string) => void;
  /** Update metadata for a specific document */
  updateDocumentMeta: (id: string, updates: Partial<DocumentMeta>) => void;

  // ===== Active Document Content =====
  /** Current document content (loaded from IndexedDB) */
  content: string;
  /** Update content in store */
  setContent: (content: string) => void;

  // ===== Read-only Mode =====
  /** Whether editing is disabled */
  isReadOnly: boolean;
  /** Set read-only mode */
  setReadOnly: (readOnly: boolean) => void;
  /** Toggle read-only mode */
  toggleReadOnly: () => void;

  // ===== View Mode =====
  /** Current editor view mode */
  viewMode: ViewMode;
  /** Set view mode */
  setViewMode: (mode: ViewMode) => void;

  // ===== Theme =====
  /** Current application theme */
  theme: Theme;
  /** Set theme */
  setTheme: (theme: Theme) => void;
  /** Current syntax highlighting theme */
  syntaxTheme: SyntaxTheme;
  /** Set syntax theme */
  setSyntaxTheme: (theme: SyntaxTheme) => void;

  // ===== Save Status =====
  /** Current save status */
  saveStatus: SaveStatus;
  /** Timestamp of last auto-save */
  lastSaved: Date | null;
  /** Timestamp of last version snapshot */
  lastVersionSnapshot: Date | null;
  /** Set save status */
  setSaveStatus: (status: SaveStatus) => void;
  /** Set last saved timestamp */
  setLastSaved: (date: Date | null) => void;
  /** Set last version snapshot timestamp */
  setLastVersionSnapshot: (date: Date | null) => void;

  // ===== UI Panel States =====
  /** Whether search panel is open */
  isSearchOpen: boolean;
  /** Set search panel open state */
  setSearchOpen: (open: boolean) => void;
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Active result index in search */
  searchActiveIndex: number;
  /** Set active search result index */
  setSearchActiveIndex: (index: number) => void;
  /** Whether version history panel is open */
  isVersionHistoryOpen: boolean;
  /** Set version history panel open state */
  setVersionHistoryOpen: (open: boolean) => void;
  /** Whether settings panel is open */
  isSettingsOpen: boolean;
  /** Set settings panel open state */
  setSettingsOpen: (open: boolean) => void;
  /** Whether shortcuts modal is open */
  isShortcutsOpen: boolean;
  /** Set shortcuts modal open state */
  setShortcutsOpen: (open: boolean) => void;
  /** Whether clear editor dialog is open */
  isClearDialogOpen: boolean;
  /** Set clear dialog open state */
  setClearDialogOpen: (open: boolean) => void;
  /** Whether delete document dialog is open */
  isDeleteDocumentDialogOpen: boolean;
  /** Set delete document dialog open state */
  setDeleteDocumentDialogOpen: (open: boolean) => void;
  /** Document ID pending deletion */
  documentToDelete: string | null;
  /** Set document to delete */
  setDocumentToDelete: (id: string | null) => void;

  // ===== Focus Mode =====
  /** Whether focus mode is active (not persisted) */
  isFocusMode: boolean;
  /** Set focus mode */
  setFocusMode: (focusMode: boolean) => void;
  /** Toggle focus mode */
  toggleFocusMode: () => void;

  // ===== Table of Contents =====
  /** Whether ToC panel is open */
  isTocPanelOpen: boolean;
  /** Set ToC panel open state */
  setTocPanelOpen: (open: boolean) => void;
  /** Toggle ToC panel */
  toggleTocPanel: () => void;

  // ===== Onboarding =====
  /** Whether user has completed onboarding */
  hasSeenOnboarding: boolean;
  /** Whether onboarding modal is open */
  isOnboardingOpen: boolean;
  /** Set onboarding completion state */
  setHasSeenOnboarding: (seen: boolean) => void;
  /** Set onboarding modal open state */
  setOnboardingOpen: (open: boolean) => void;
  /** Open the onboarding modal */
  openOnboarding: () => void;
  /** Mark onboarding as complete and close modal */
  completeOnboarding: () => void;

  // ===== Version History =====
  /** Key to trigger version history refresh */
  versionHistoryRefreshKey: number;
  /** Increment refresh key to trigger update */
  triggerVersionHistoryRefresh: () => void;

  // ===== Cursor Position =====
  /** Current cursor line number */
  cursorLine: number;
  /** Current cursor column number */
  cursorColumn: number;
  /** Update cursor position */
  setCursorPosition: (line: number, column: number) => void;

  // ===== User Settings =====
  /** Auto-save debounce interval in milliseconds */
  autoSaveInterval: number;
  /** Set auto-save interval */
  setAutoSaveInterval: (interval: number) => void;
  /** Whether to show line numbers in source mode */
  showLineNumbers: boolean;
  /** Set line numbers visibility */
  setShowLineNumbers: (show: boolean) => void;
  /** Whether to show confirmation before clearing */
  confirmClearEditor: boolean;
  /** Set clear confirmation setting */
  setConfirmClearEditor: (confirm: boolean) => void;

  // ===== Initialization =====
  /** Whether Zustand has finished hydrating from localStorage */
  hasHydrated: boolean;
  /** Set hydration state (called by persist middleware) */
  setHasHydrated: (hydrated: boolean) => void;
  /** Whether app has finished initializing */
  isInitialized: boolean;
  /** Set initialization state */
  setInitialized: (initialized: boolean) => void;
}
