/**
 * @fileoverview Keyboard shortcuts help modal component
 *
 * Displays a modal with all available keyboard shortcuts.
 *
 * @module @writenex/astro/client/components/KeyboardShortcuts
 */

import {
  formatShortcut,
  type ShortcutDefinition,
} from "../../hooks/useKeyboardShortcuts";
import "./KeyboardShortcuts.css";

/**
 * Props for ShortcutsHelpModal component
 */
interface ShortcutsHelpModalProps {
  /** List of shortcuts to display */
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
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="wn-shortcuts-overlay" onClick={handleOverlayClick}>
      <div
        className="wn-shortcuts-modal"
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
            <CloseIcon />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="wn-shortcuts-list">
          {shortcuts
            .filter((s) => s.enabled !== false)
            .map((shortcut) => (
              <div key={shortcut.key} className="wn-shortcuts-item">
                <span className="wn-shortcuts-label">{shortcut.label}</span>
                <kbd className="wn-shortcuts-key">
                  {formatShortcut(shortcut)}
                </kbd>
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

/**
 * Close icon component
 */
function CloseIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
