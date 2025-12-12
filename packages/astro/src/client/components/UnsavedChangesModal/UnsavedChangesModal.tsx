/**
 * @fileoverview Unsaved changes confirmation modal
 *
 * Modal dialog that prompts users when they attempt to navigate away
 * from content with unsaved changes. Provides options to save or discard.
 * Cancel is available via X button, clicking outside, or pressing Escape.
 * Includes focus trap for accessibility compliance.
 *
 * @module @writenex/astro/client/components/UnsavedChangesModal
 */

import { useCallback, useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import "./UnsavedChangesModal.css";

/**
 * Props for UnsavedChangesModal component
 */
interface UnsavedChangesModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal (cancel action) */
  onClose: () => void;
  /** Callback when user chooses to discard changes and continue */
  onDiscard: () => void;
  /** Callback when user chooses to save and continue */
  onSave: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

/**
 * Modal dialog for unsaved changes confirmation
 *
 * Features:
 * - Two action buttons: Don't Save (discard), Save
 * - Cancel via X button, click outside, or Escape key
 * - Loading state during save
 * - Consistent styling with design system
 *
 * @component
 * @example
 * ```tsx
 * <UnsavedChangesModal
 *   isOpen={showUnsavedModal}
 *   onClose={() => setShowUnsavedModal(false)}
 *   onDiscard={handleDiscard}
 *   onSave={handleSave}
 * />
 * ```
 */
export function UnsavedChangesModal({
  isOpen,
  onClose,
  onDiscard,
  onSave,
  isSaving = false,
}: UnsavedChangesModalProps): React.ReactElement | null {
  const triggerRef = useRef<HTMLElement | null>(null);
  const discardButtonRef = useRef<HTMLButtonElement>(null);

  // Store the trigger element when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus trap for accessibility
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: isSaving ? undefined : onClose,
    returnFocusTo: triggerRef.current,
  });

  // Focus first button when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        discardButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isSaving) {
        onClose();
      }
    },
    [onClose, isSaving]
  );

  if (!isOpen) return null;

  return (
    <div
      className="wn-unsaved-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={containerRef}
        className="wn-unsaved-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-modal-title"
        aria-describedby="unsaved-modal-description"
      >
        {/* Header */}
        <div className="wn-unsaved-modal-header">
          <div className="wn-unsaved-modal-header-content">
            <AlertTriangle size={18} className="wn-unsaved-modal-icon" />
            <h2 id="unsaved-modal-title" className="wn-unsaved-modal-title">
              Unsaved Changes
            </h2>
          </div>
          <button
            className="wn-unsaved-modal-close"
            onClick={onClose}
            disabled={isSaving}
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="wn-unsaved-modal-body">
          <p id="unsaved-modal-description" className="wn-unsaved-modal-text">
            You have unsaved changes. Save them before continuing?
          </p>
        </div>

        {/* Footer */}
        <div className="wn-unsaved-modal-footer">
          <button
            ref={discardButtonRef}
            type="button"
            className="wn-unsaved-modal-btn wn-unsaved-modal-btn--secondary"
            onClick={onDiscard}
            disabled={isSaving}
          >
            Don't Save
          </button>
          <button
            type="button"
            className="wn-unsaved-modal-btn wn-unsaved-modal-btn--primary"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
