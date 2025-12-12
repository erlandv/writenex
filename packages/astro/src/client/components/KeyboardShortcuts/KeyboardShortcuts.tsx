/**
 * @fileoverview Keyboard shortcuts help modal component
 *
 * Displays a modal with all available keyboard shortcuts including
 * application shortcuts and built-in editor formatting shortcuts.
 * Includes focus trap for accessibility compliance.
 *
 * @module @writenex/astro/client/components/KeyboardShortcuts
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import {
  formatShortcut,
  type ShortcutDefinition,
} from "../../hooks/useKeyboardShortcuts";
import "./KeyboardShortcuts.css";

/**
 * Built-in editor shortcuts from MDXEditor/Lexical.
 * These are always available when editing content.
 */
const EDITOR_SHORTCUTS: {
  category: string;
  shortcuts: { label: string; keys: string }[];
}[] = [
  {
    category: "Formatting",
    shortcuts: [
      { label: "Bold", keys: "Ctrl+B" },
      { label: "Italic", keys: "Ctrl+I" },
      { label: "Underline", keys: "Ctrl+U" },
    ],
  },
  {
    category: "Actions",
    shortcuts: [
      { label: "Undo", keys: "Ctrl+Z" },
      { label: "Redo", keys: "Ctrl+Shift+Z" },
    ],
  },
];

/**
 * Props for ShortcutsHelpModal component
 */
interface ShortcutsHelpModalProps {
  /** List of application shortcuts to display */
  shortcuts: ShortcutDefinition[];
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Keyboard shortcuts help modal component
 *
 * @component
 * @example
 * ```tsx
 * {showHelp && (
 *   <ShortcutsHelpModal shortcuts={shortcuts} onClose={closeHelp} />
 * )}
 * ```
 */
export function ShortcutsHelpModal({
  shortcuts,
  onClose,
}: ShortcutsHelpModalProps): React.ReactElement {
  const triggerRef = useRef<HTMLElement | null>(null);

  // Store the trigger element when modal mounts
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  }, []);

  // Focus trap for accessibility
  const { containerRef } = useFocusTrap({
    enabled: true,
    onEscape: onClose,
    returnFocusTo: triggerRef.current,
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="wn-shortcuts-overlay" onClick={handleOverlayClick}>
      <div
        ref={containerRef}
        className="wn-shortcuts-modal wn-shortcuts-modal--large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="wn-shortcuts-header">
          <h2 id="shortcuts-title" className="wn-shortcuts-title">
            Keyboard Shortcuts
          </h2>
          <button
            className="wn-shortcuts-close"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close shortcuts help"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="wn-shortcuts-list">
          {/* Application Shortcuts */}
          <div className="wn-shortcuts-section">
            <h3 className="wn-shortcuts-category">Application</h3>
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className={`wn-shortcuts-item ${shortcut.enabled === false ? "wn-shortcuts-item--disabled" : ""}`}
              >
                <span className="wn-shortcuts-label">{shortcut.label}</span>
                <kbd className="wn-shortcuts-key">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>

          {/* Editor Shortcuts */}
          {EDITOR_SHORTCUTS.map((group) => (
            <div key={group.category} className="wn-shortcuts-section">
              <h3 className="wn-shortcuts-category">{group.category}</h3>
              {group.shortcuts.map((shortcut) => (
                <div key={shortcut.label} className="wn-shortcuts-item">
                  <span className="wn-shortcuts-label">{shortcut.label}</span>
                  <kbd className="wn-shortcuts-key">{shortcut.keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="wn-shortcuts-footer">
          Press <kbd>Ctrl+/</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
}
