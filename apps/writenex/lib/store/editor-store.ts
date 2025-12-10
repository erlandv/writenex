/**
 * @fileoverview Zustand store for global editor state management
 *
 * Centralized state management for the Writenex editor using Zustand with
 * localStorage persistence.
 *
 * @module lib/store/editor-store
 * @see {@link EditorState} - Type definition for the store state
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

/**
 * Zustand store hook for editor state.
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
        set({ isReadOnly, saveStatus: isReadOnly ? "readonly" : "saved" }),
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

      // Focus Mode
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

      // Version history refresh trigger
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
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
        isReadOnly: state.isReadOnly,
        viewMode: state.viewMode,
        theme: state.theme,
        syntaxTheme: state.syntaxTheme,
        autoSaveInterval: state.autoSaveInterval,
        showLineNumbers: state.showLineNumbers,
        confirmClearEditor: state.confirmClearEditor,
        isTocPanelOpen: state.isTocPanelOpen,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);

/** Selector to get the active document metadata. */
export function getActiveDocument(
  state: EditorState
): DocumentMeta | undefined {
  return state.documents.find((d) => d.id === state.activeDocumentId);
}
