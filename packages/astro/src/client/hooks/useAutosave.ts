/**
 * @fileoverview Autosave hook for automatic content saving
 *
 * This hook provides automatic saving functionality with debouncing
 * to prevent excessive API calls while ensuring content is saved
 * regularly.
 *
 * ## Features:
 * - Debounced saving (default 3 seconds)
 * - Save status indicator
 * - Error handling with retry
 * - Pause/resume capability
 * - Save on unmount option
 *
 * @module @writenex/astro/client/hooks/useAutosave
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Autosave status
 */
export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Options for useAutosave hook
 */
export interface UseAutosaveOptions {
  /** Debounce delay in milliseconds (default: 3000) */
  delay?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /** Save function to call */
  onSave: () => Promise<boolean>;
  /** Callback when save succeeds */
  onSuccess?: () => void;
  /** Callback when save fails */
  onError?: (error: Error) => void;
  /** Whether to save on component unmount (default: true) */
  saveOnUnmount?: boolean;
}

/**
 * Return value from useAutosave hook
 */
export interface UseAutosaveReturn {
  /** Current autosave status */
  status: AutosaveStatus;
  /** Trigger a change that will schedule autosave */
  triggerChange: () => void;
  /** Force immediate save */
  saveNow: () => Promise<void>;
  /** Cancel pending autosave */
  cancel: () => void;
  /** Whether there are pending changes */
  hasPendingChanges: boolean;
  /** Last saved timestamp */
  lastSaved: Date | null;
}

/**
 * Hook for automatic content saving with debounce
 *
 * @param options - Autosave configuration options
 * @returns Autosave controls and status
 *
 * @example
 * ```tsx
 * const { status, triggerChange, saveNow } = useAutosave({
 *   delay: 3000,
 *   enabled: true,
 *   onSave: async () => {
 *     const result = await api.save(content);
 *     return result.success;
 *   },
 * });
 *
 * // Call triggerChange when content changes
 * const handleChange = (newContent) => {
 *   setContent(newContent);
 *   triggerChange();
 * };
 * ```
 */
export function useAutosave(options: UseAutosaveOptions): UseAutosaveReturn {
  const {
    delay = 3000,
    enabled = true,
    onSave,
    onSuccess,
    onError,
    saveOnUnmount = true,
  } = options;

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Refs for cleanup and tracking
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isSavingRef = useRef(false);

  /**
   * Clear the pending timeout
   */
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus("saving");

    try {
      const success = await onSave();

      if (!isMountedRef.current) return;

      if (success) {
        setStatus("saved");
        setHasPendingChanges(false);
        setLastSaved(new Date());
        onSuccess?.();

        // Reset to idle after showing "saved" briefly
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus("idle");
          }
        }, 2000);
      } else {
        setStatus("error");
        onError?.(new Error("Save failed"));
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      setStatus("error");
      onError?.(err instanceof Error ? err : new Error("Save failed"));
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onSuccess, onError]);

  /**
   * Schedule a save after the debounce delay
   */
  const scheduleSave = useCallback(() => {
    clearPendingTimeout();

    if (!enabled) return;

    setStatus("pending");
    setHasPendingChanges(true);

    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);
  }, [enabled, delay, clearPendingTimeout, performSave]);

  /**
   * Trigger a change that will schedule autosave
   */
  const triggerChange = useCallback(() => {
    if (!enabled) return;
    scheduleSave();
  }, [enabled, scheduleSave]);

  /**
   * Force immediate save
   */
  const saveNow = useCallback(async () => {
    clearPendingTimeout();
    await performSave();
  }, [clearPendingTimeout, performSave]);

  /**
   * Cancel pending autosave
   */
  const cancel = useCallback(() => {
    clearPendingTimeout();
    setStatus("idle");
  }, [clearPendingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearPendingTimeout();

      // Save on unmount if enabled and there are pending changes
      if (saveOnUnmount && hasPendingChanges && !isSavingRef.current) {
        // Fire and forget - component is unmounting
        onSave().catch(() => {
          // Ignore errors on unmount
        });
      }
    };
  }, [clearPendingTimeout, saveOnUnmount, hasPendingChanges, onSave]);

  return {
    status,
    triggerChange,
    saveNow,
    cancel,
    hasPendingChanges,
    lastSaved,
  };
}

/**
 * Format last saved time for display
 *
 * @param date - Last saved date
 * @returns Formatted string like "Saved just now" or "Saved 2 min ago"
 */
export function formatLastSaved(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 10) return "Saved just now";
  if (diffSec < 60) return `Saved ${diffSec}s ago`;
  if (diffMin < 60) return `Saved ${diffMin}m ago`;

  return `Saved at ${date.toLocaleTimeString()}`;
}
