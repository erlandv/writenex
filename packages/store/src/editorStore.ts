/**
 * @fileoverview Zustand store for global editor state management
 *
 * Centralized state management for the Writenex editor using Zustand with
 * localStorage persistence. Manages all editor UI state, document metadata,
 * user preferences, and application settings.
 *
 * ## State Categories:
 * - Document management (documents list, active document, content)
 * - Editor modes (read-only, focus mode, view mode)
 * - Theme settings (light/dark/system, syntax theme)
 * - Save status and timestamps
 * - UI panel states (search, version history, settings, dialogs)
 * - Onboarding state
 * - Cursor position
 * - User settings (auto-save interval, line numbers, etc.)
 *
 * ## Persistence:
 * Uses Zustand persist middleware with localStorage. Only UI state and
 * settings are persisted - document content is managed by IndexedDB.
 *
 * @module store/editorStore
 * @see {@link EditorState} - Type definition for the store state
 * @see {@link db} - IndexedDB layer for document content
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ViewMode,
  SaveStatus,
  Theme,
  SyntaxTheme,
  DocumentMeta,
  EditorState,
} from "./types";

// Re-export types for backward compatibility
export type {
  ViewMode,
  SaveStatus,
  Theme,
  SyntaxTheme,
  DocumentMeta,
  EditorState,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

/**
 * Zustand store hook for editor state.
 *
 * Provides global state management for the editor with localStorage
 * persistence for settings and UI state. Document content is stored
 * in IndexedDB separately.
 *
 * @example
 * ```tsx
 * // Access state in a component
 * function Editor() {
 *   const { content, setContent, isReadOnly } = useEditorStore();
 *   // ...
 * }
 *
 * // Access state outside React
 * const state = useEditorStore.getState();
 * ```
 *
 * @returns Editor state and actions
 */
export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      // Document management
      documents: [],
      activeDocumentId: null,
      setDocuments: (documents) => set({ documents }),
      setActiveDocumentId: (activeDocumentId) => set({ activeDocumentId }),
      addDocument: (doc) =>
        set((state) => ({ documents: [...state.documents, doc] })),
      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
      updateDocumentMeta: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),

      // Active document content
      content: "",
      setContent: (content) => set({ content }),

      // Read-only mode
      isReadOnly: false,
      setReadOnly: (isReadOnly) =>
        set({
          isReadOnly,
          saveStatus: isReadOnly ? "readonly" : "saved",
        }),
      toggleReadOnly: () =>
        set((state) => ({
          isReadOnly: !state.isReadOnly,
          saveStatus: !state.isReadOnly ? "readonly" : "saved",
        })),

      // View mode
      viewMode: "edit",
      setViewMode: (viewMode) => set({ viewMode }),

      // Theme
      theme: "system",
      setTheme: (theme) => set({ theme }),

      // Syntax highlighting theme
      syntaxTheme: "github-light",
      setSyntaxTheme: (syntaxTheme) => set({ syntaxTheme }),

      // Save status
      saveStatus: "saved",
      lastSaved: null,
      lastVersionSnapshot: null,
      setSaveStatus: (saveStatus) => set({ saveStatus }),
      setLastSaved: (lastSaved) => set({ lastSaved }),
      setLastVersionSnapshot: (lastVersionSnapshot) =>
        set({ lastVersionSnapshot }),

      // UI state
      isSearchOpen: false,
      setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
      searchQuery: "",
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      searchActiveIndex: 0,
      setSearchActiveIndex: (searchActiveIndex) => set({ searchActiveIndex }),
      isVersionHistoryOpen: false,
      setVersionHistoryOpen: (isVersionHistoryOpen) =>
        set({ isVersionHistoryOpen }),
      isSettingsOpen: false,
      setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      isShortcutsOpen: false,
      setShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
      isClearDialogOpen: false,
      setClearDialogOpen: (isClearDialogOpen) => set({ isClearDialogOpen }),
      isDeleteDocumentDialogOpen: false,
      setDeleteDocumentDialogOpen: (isDeleteDocumentDialogOpen) =>
        set({ isDeleteDocumentDialogOpen }),
      documentToDelete: null,
      setDocumentToDelete: (documentToDelete) => set({ documentToDelete }),

      // Focus Mode (not persisted - fresh start each session)
      isFocusMode: false,
      setFocusMode: (isFocusMode) => set({ isFocusMode }),
      toggleFocusMode: () =>
        set((state) => ({ isFocusMode: !state.isFocusMode })),

      // Table of Contents panel
      isTocPanelOpen: false,
      setTocPanelOpen: (isTocPanelOpen) => set({ isTocPanelOpen }),
      toggleTocPanel: () =>
        set((state) => ({ isTocPanelOpen: !state.isTocPanelOpen })),

      // Onboarding / Welcome Tour
      hasSeenOnboarding: false,
      isOnboardingOpen: false,
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setOnboardingOpen: (isOnboardingOpen) => set({ isOnboardingOpen }),
      openOnboarding: () => set({ isOnboardingOpen: true }),
      completeOnboarding: () =>
        set({ hasSeenOnboarding: true, isOnboardingOpen: false }),

      // Version history refresh trigger (for real-time updates)
      versionHistoryRefreshKey: 0,
      triggerVersionHistoryRefresh: () =>
        set((state) => ({
          versionHistoryRefreshKey: state.versionHistoryRefreshKey + 1,
        })),

      // Cursor position
      cursorLine: 1,
      cursorColumn: 1,
      setCursorPosition: (cursorLine, cursorColumn) =>
        set({ cursorLine, cursorColumn }),

      // Settings
      autoSaveInterval: 3000,
      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
      showLineNumbers: true,
      setShowLineNumbers: (showLineNumbers) => set({ showLineNumbers }),
      confirmClearEditor: true,
      setConfirmClearEditor: (confirmClearEditor) =>
        set({ confirmClearEditor }),

      // Initialization
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      isInitialized: false,
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: "markdown-editor-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Document state
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
        // NOTE: content is NOT persisted here - it's managed by IndexedDB
        // Settings
        isReadOnly: state.isReadOnly,
        viewMode: state.viewMode,
        theme: state.theme,
        syntaxTheme: state.syntaxTheme,
        autoSaveInterval: state.autoSaveInterval,
        showLineNumbers: state.showLineNumbers,
        confirmClearEditor: state.confirmClearEditor,
        // UI state
        isTocPanelOpen: state.isTocPanelOpen,
        // Onboarding
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);

// =============================================================================
// SELECTORS (Helper functions)
// =============================================================================

/**
 * Selector to get the active document metadata.
 *
 * @param state - The editor store state
 * @returns The active document metadata or undefined if no document is active
 *
 * @example
 * ```tsx
 * const activeDoc = useEditorStore((state) => getActiveDocument(state));
 * ```
 */
export function getActiveDocument(
  state: EditorState
): DocumentMeta | undefined {
  return state.documents.find((d) => d.id === state.activeDocumentId);
}
