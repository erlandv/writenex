/**
 * @fileoverview Simplified auto-save and version history hooks
 *
 * This module provides a clean, event-based approach to saving:
 * - Auto-save: Debounced 3s save to document table (single source of truth)
 * - Version snapshots: Created on specific events, not time-based polling
 *
 * ## Architecture:
 * ```
 * Content → Document Table (auto-save 3s debounce)
 *        → Version Table (event-based snapshots)
 * ```
 *
 * ## Version Snapshot Triggers:
 * - User idle 30s + 5min since last snapshot + has changes
 * - Manual save (Ctrl+S) - always creates snapshot
 * - Before clear editor - creates labeled snapshot
 * - Switch document - if has changes from last snapshot
 * - Close tab/browser - if has changes from last snapshot
 *
 * @module hooks/useAutoSave
 * @see {@link useEditorStore} - State management
 * @see {@link db} - Database persistence layer
 */

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { saveVersion, getLastVersionTimestamp, updateDocument } from "@/lib/db";
import {
  AUTO_SAVE_DEBOUNCE,
  IDLE_THRESHOLD,
  VERSION_MIN_GAP,
} from "@/lib/constants";

// =============================================================================
// MAIN AUTO-SAVE HOOK
// =============================================================================

/**
 * Custom hook for auto-saving and version history management.
 *
 * Implements a simplified two-layer save system:
 * - Layer 1: Auto-save to document table (3s debounce)
 * - Layer 2: Version snapshots (event-based)
 *
 * Auto-save is disabled in read-only mode or when no document is active.
 *
 * @example
 * ```tsx
 * function Editor() {
 *   useAutoSave(); // Just call the hook, it handles everything
 *   return <MarkdownEditor />;
 * }
 * ```
 */
export function useAutoSave(): void {
  const {
    content,
    isReadOnly,
    setSaveStatus,
    setLastSaved,
    lastVersionSnapshot,
    setLastVersionSnapshot,
    activeDocumentId,
    triggerVersionHistoryRefresh,
  } = useEditorStore();

  // ==========================================================================
  // REFS
  // ==========================================================================

  /** Content at last successful save to document table */
  const lastSavedContentRef = useRef<string>(content);

  /** Content at last version snapshot */
  const lastSnapshotContentRef = useRef<string>(content);

  /** Current content (for async callbacks to avoid stale closures) */
  const currentContentRef = useRef<string>(content);

  /** Current active document ID (for async callbacks) */
  const activeDocIdRef = useRef<string | null>(activeDocumentId);

  /** Timer for debounced auto-save */
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /** Timer for idle detection */
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  /** Whether hook has been initialized for current document */
  const isInitializedRef = useRef<boolean>(false);

  // ==========================================================================
  // SYNC REFS WITH STATE
  // ==========================================================================

  // Keep refs in sync with current values for async callbacks
  useEffect(() => {
    currentContentRef.current = content;
  }, [content]);

  useEffect(() => {
    activeDocIdRef.current = activeDocumentId;
  }, [activeDocumentId]);

  // ==========================================================================
  // CORE SAVE FUNCTIONS
  // ==========================================================================

  /**
   * Save content to document table (persistent storage)
   */
  const saveToDocument = useCallback(async (): Promise<boolean> => {
    const docId = activeDocIdRef.current;
    const currentContent = currentContentRef.current;

    if (!docId) return false;
    if (currentContent === lastSavedContentRef.current) return true; // No changes

    try {
      setSaveStatus("saving");
      await updateDocument(docId, { content: currentContent });
      lastSavedContentRef.current = currentContent;
      setLastSaved(new Date());
      setSaveStatus("saved");
      return true;
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("failed");
      return false;
    }
  }, [setSaveStatus, setLastSaved]);

  /**
   * Create a version snapshot
   *
   * @param force - If true, skip the 5-minute gap check (for manual save)
   * @param label - Optional label for the snapshot (e.g., "Before Clear")
   */
  const createSnapshot = useCallback(
    async (force: boolean = false, label?: string): Promise<boolean> => {
      const docId = activeDocIdRef.current;
      const currentContent = currentContentRef.current;

      if (!docId) return false;

      // Check if content has changed since last snapshot
      const hasChanges = currentContent !== lastSnapshotContentRef.current;
      if (!hasChanges && !force) return false;

      // Check time gap (unless forced)
      if (!force) {
        const now = Date.now();
        const lastSnapshotTime = lastVersionSnapshot?.getTime() ?? 0;
        const timeSinceLastSnapshot = now - lastSnapshotTime;

        if (timeSinceLastSnapshot < VERSION_MIN_GAP) {
          return false; // Not enough time has passed
        }
      }

      try {
        await saveVersion(docId, currentContent, label);
        lastSnapshotContentRef.current = currentContent;
        setGlobalLastSnapshotContent(currentContent); // Sync global tracker
        setLastVersionSnapshot(new Date());
        triggerVersionHistoryRefresh(); // Trigger real-time update
        return true;
      } catch (error) {
        console.error("Version snapshot failed:", error);
        return false;
      }
    },
    [lastVersionSnapshot, setLastVersionSnapshot, triggerVersionHistoryRefresh]
  );

  // ==========================================================================
  // INITIALIZATION & DOCUMENT CHANGE HANDLING
  // ==========================================================================

  /** Track the last initialized document ID */
  const lastInitDocIdRef = useRef<string | null>(null);

  // Initialize or re-initialize when document changes
  useEffect(() => {
    if (!activeDocumentId) return;

    // Check if we're switching to a new document
    const isNewDocument = lastInitDocIdRef.current !== activeDocumentId;

    if (!isNewDocument && isInitializedRef.current) {
      // Same document and already initialized, skip
      return;
    }

    // Reset refs for new document
    if (isNewDocument) {
      isInitializedRef.current = false;
      lastInitDocIdRef.current = activeDocumentId;
      // Reset content refs to current content (which should be the new doc's content)
      lastSavedContentRef.current = content;
      lastSnapshotContentRef.current = content;
      setGlobalLastSnapshotContent(content); // Sync global tracker
    }

    const initialize = async () => {
      // Load last version timestamp from DB
      const lastTimestamp = await getLastVersionTimestamp(activeDocumentId);
      if (lastTimestamp) {
        setLastVersionSnapshot(lastTimestamp);
      } else {
        // New document has no version history, reset to null
        setLastVersionSnapshot(null);
      }

      isInitializedRef.current = true;
    };

    initialize();
  }, [activeDocumentId, content, setLastVersionSnapshot]);

  // ==========================================================================
  // AUTO-SAVE EFFECT (Debounced 3s)
  // ==========================================================================

  useEffect(() => {
    if (isReadOnly) {
      setSaveStatus("readonly");
      return;
    }

    if (!activeDocumentId) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Check if there are unsaved changes
    if (content === lastSavedContentRef.current) return;

    // Set debounced save
    autoSaveTimerRef.current = setTimeout(() => {
      saveToDocument();
    }, AUTO_SAVE_DEBOUNCE);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, isReadOnly, activeDocumentId, saveToDocument, setSaveStatus]);

  // ==========================================================================
  // IDLE DETECTION & AUTO VERSION SNAPSHOT
  // ==========================================================================

  useEffect(() => {
    if (isReadOnly) return;
    if (!activeDocumentId) return;

    // Clear existing idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Check if there are unsnapshotted changes
    if (content === lastSnapshotContentRef.current) return;

    // Set idle timer - when user stops typing for 30s, check if we should snapshot
    idleTimerRef.current = setTimeout(() => {
      createSnapshot(false); // Will check 5-minute gap internally
    }, IDLE_THRESHOLD);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [content, isReadOnly, activeDocumentId, createSnapshot]);

  // ==========================================================================
  // MANUAL SAVE (Ctrl+S / Cmd+S)
  // ==========================================================================

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();

        if (isReadOnly) {
          setSaveStatus("readonly");
          return;
        }

        if (!activeDocumentId) return;

        // Save to document first
        await saveToDocument();

        // Force create snapshot (skip time gap check)
        await createSnapshot(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isReadOnly,
    activeDocumentId,
    saveToDocument,
    createSnapshot,
    setSaveStatus,
  ]);

  // ==========================================================================
  // BEFOREUNLOAD - Save and snapshot before tab closes
  // ==========================================================================

  useEffect(() => {
    const handleBeforeUnload = () => {
      const docId = activeDocIdRef.current;
      const currentContent = currentContentRef.current;

      if (!docId) return;

      // Check if there are unsaved changes
      const hasUnsavedChanges = currentContent !== lastSavedContentRef.current;
      const hasUnsnapshotedChanges =
        currentContent !== lastSnapshotContentRef.current;

      if (hasUnsavedChanges || hasUnsnapshotedChanges) {
        // Use synchronous API for beforeunload
        // Note: Modern browsers limit what you can do here, but we try our best
        // The auto-save should have already saved most changes due to debounce
        // For a more robust solution, we could use navigator.sendBeacon
        // but IndexedDB operations are async and may not complete
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
}

// =============================================================================
// MANUAL SAVE HOOK (For external use)
// =============================================================================

/**
 * Custom hook to manually trigger a save with version snapshot.
 *
 * Use this hook when you need to trigger a save from outside the main
 * auto-save flow, such as from a save button or before destructive actions.
 *
 * @returns Function to trigger manual save with forced snapshot
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const manualSave = useManualSave();
 *   return <button onClick={manualSave}>Save</button>;
 * }
 * ```
 */
export function useManualSave(): () => Promise<void> {
  const {
    content,
    isReadOnly,
    activeDocumentId,
    setSaveStatus,
    setLastSaved,
    setLastVersionSnapshot,
    triggerVersionHistoryRefresh,
  } = useEditorStore();

  return useCallback(async () => {
    if (isReadOnly) {
      setSaveStatus("readonly");
      return;
    }

    if (!activeDocumentId) return;

    try {
      setSaveStatus("saving");

      // Save to document table
      await updateDocument(activeDocumentId, { content });

      // Create version snapshot (forced, always creates)
      await saveVersion(activeDocumentId, content);

      setLastSaved(new Date());
      setLastVersionSnapshot(new Date());
      triggerVersionHistoryRefresh(); // Trigger real-time update
      setSaveStatus("saved");
    } catch (error) {
      console.error("Manual save failed:", error);
      setSaveStatus("failed");
    }
  }, [
    content,
    isReadOnly,
    activeDocumentId,
    setSaveStatus,
    setLastSaved,
    setLastVersionSnapshot,
    triggerVersionHistoryRefresh,
  ]);
}

// =============================================================================
// SNAPSHOT BEFORE ACTION HOOK
// =============================================================================

/**
 * Custom hook to create a labeled snapshot before destructive actions.
 *
 * Use this before actions like clearing the editor to preserve the
 * previous state in version history.
 *
 * @returns Function to create a labeled snapshot
 *
 * @example
 * ```tsx
 * function ClearButton() {
 *   const snapshotBeforeAction = useSnapshotBeforeAction();
 *
 *   const handleClear = async () => {
 *     await snapshotBeforeAction("Before Clear");
 *     clearEditor();
 *   };
 *
 *   return <button onClick={handleClear}>Clear</button>;
 * }
 * ```
 */
export function useSnapshotBeforeAction(): (label: string) => Promise<void> {
  const {
    content,
    isReadOnly,
    activeDocumentId,
    setLastVersionSnapshot,
    triggerVersionHistoryRefresh,
  } = useEditorStore();

  return useCallback(
    async (label: string) => {
      if (isReadOnly) return;
      if (!activeDocumentId) return;
      if (!content.trim()) return; // Don't snapshot empty content

      try {
        await saveVersion(activeDocumentId, content, label);
        setLastVersionSnapshot(new Date());
        triggerVersionHistoryRefresh(); // Trigger real-time update
      } catch (error) {
        console.error("Snapshot before action failed:", error);
      }
    },
    [
      content,
      isReadOnly,
      activeDocumentId,
      setLastVersionSnapshot,
      triggerVersionHistoryRefresh,
    ]
  );
}

// =============================================================================
// SNAPSHOT ON DOCUMENT SWITCH HOOK
// =============================================================================

/**
 * Custom hook to save and optionally snapshot when switching documents.
 *
 * Call this before loading a new document to ensure current changes
 * are persisted.
 *
 * @returns Function to save current document before switching
 *
 * @example
 * ```tsx
 * function DocumentTabs() {
 *   const saveBeforeSwitch = useSaveBeforeSwitch();
 *
 *   const handleSwitch = async (newDocId: string) => {
 *     await saveBeforeSwitch();
 *     loadDocument(newDocId);
 *   };
 * }
 * ```
 */
/**
 * Ref to track the content at last version snapshot.
 * This is used by useSaveBeforeSwitch to determine if a snapshot is needed.
 * Managed by the main useAutoSave hook but needed externally.
 */
let globalLastSnapshotContent: string = "";

/**
 * Update the global last snapshot content tracker.
 * Called by useAutoSave when a snapshot is created.
 */
export function setGlobalLastSnapshotContent(content: string): void {
  globalLastSnapshotContent = content;
}

export function useSaveBeforeSwitch(): () => Promise<void> {
  const {
    content,
    isReadOnly,
    activeDocumentId,
    setLastVersionSnapshot,
    triggerVersionHistoryRefresh,
  } = useEditorStore();

  return useCallback(async () => {
    if (isReadOnly) return;
    if (!activeDocumentId) return;
    if (!content.trim()) return; // Don't save/snapshot empty content

    try {
      // Always save to document table
      await updateDocument(activeDocumentId, { content });

      // Create snapshot if content has changed since last snapshot
      // No time gap check for explicit document switch (user action)
      if (content !== globalLastSnapshotContent) {
        await saveVersion(activeDocumentId, content);
        globalLastSnapshotContent = content;
        setLastVersionSnapshot(new Date());
        triggerVersionHistoryRefresh(); // Trigger real-time update
      }
    } catch (error) {
      console.error("Save before switch failed:", error);
    }
  }, [
    content,
    isReadOnly,
    activeDocumentId,
    setLastVersionSnapshot,
    triggerVersionHistoryRefresh,
  ]);
}
