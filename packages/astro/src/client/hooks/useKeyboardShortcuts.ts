/**
 * @fileoverview Keyboard shortcuts hook for Writenex editor
 *
 * This hook provides centralized keyboard shortcut handling with
 * support for common editor operations.
 *
 * ## Shortcuts:
 * - Alt + N: New content
 * - Ctrl/Cmd + S: Save
 * - Ctrl/Cmd + P: Preview
 * - Ctrl/Cmd + /: Toggle shortcuts help
 * - Escape: Close modals/panels
 *
 * @module @writenex/astro/client/hooks/useKeyboardShortcuts
 */

import { useCallback, useEffect, useState } from "react";

/**
 * Shortcut definition
 */
export interface ShortcutDefinition {
  /** Unique key for the shortcut */
  key: string;
  /** Display label */
  label: string;
  /** Keyboard key to press */
  keys: string;
  /** Whether Ctrl/Cmd is required */
  ctrl?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt is required */
  alt?: boolean;
  /** Handler function */
  handler: () => void;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
}

/**
 * Options for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  /** Shortcuts to register */
  shortcuts: ShortcutDefinition[];
  /** Whether shortcuts are globally enabled */
  enabled?: boolean;
}

/**
 * Return value from useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsReturn {
  /** Whether shortcuts help modal is open */
  showHelp: boolean;
  /** Toggle shortcuts help modal */
  toggleHelp: () => void;
  /** Close shortcuts help modal */
  closeHelp: () => void;
  /** List of registered shortcuts for display */
  shortcuts: ShortcutDefinition[];
}

/**
 * Check if event target is an input element
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  // Check for contenteditable
  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Format shortcut keys for display
 */
export function formatShortcut(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];

  // Use Cmd on Mac, Ctrl on others
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  if (shortcut.ctrl) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }

  // Format the key
  let keyDisplay = shortcut.keys.toUpperCase();
  if (keyDisplay === "ESCAPE") keyDisplay = "Esc";
  if (keyDisplay === "ARROWUP") keyDisplay = "↑";
  if (keyDisplay === "ARROWDOWN") keyDisplay = "↓";
  if (keyDisplay === "ARROWLEFT") keyDisplay = "←";
  if (keyDisplay === "ARROWRIGHT") keyDisplay = "→";

  parts.push(keyDisplay);

  return parts.join(isMac ? "" : "+");
}

/**
 * Hook for managing keyboard shortcuts
 *
 * @param options - Shortcut configuration
 * @returns Shortcut controls and help modal state
 *
 * @example
 * ```tsx
 * const { showHelp, toggleHelp, shortcuts } = useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'save', label: 'Save', keys: 's', ctrl: true, handler: handleSave },
 *     { key: 'new', label: 'New', keys: 'n', alt: true, handler: handleNew },
 *   ],
 * });
 * ```
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions
): UseKeyboardShortcutsReturn {
  const { shortcuts, enabled = true } = options;
  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  const closeHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for help shortcut first (Ctrl + /)
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        toggleHelp();
        return;
      }

      // Close help on Escape
      if (e.key === "Escape" && showHelp) {
        e.preventDefault();
        closeHelp();
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatch = e.key.toLowerCase() === shortcut.keys.toLowerCase();
        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          // Allow some shortcuts even in input fields
          const allowInInput =
            shortcut.key === "save" || shortcut.key === "escape";

          if (!allowInInput && isInputElement(e.target)) {
            continue;
          }

          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, shortcuts, showHelp, toggleHelp, closeHelp]);

  return {
    showHelp,
    toggleHelp,
    closeHelp,
    shortcuts,
  };
}
