/**
 * @fileoverview Version Actions component
 *
 * Action buttons for version operations: restore, compare, download, delete.
 * Includes confirmation dialogs for destructive actions.
 * Includes focus trap for accessibility compliance.
 *
 * @module @writenex/astro/client/components/VersionHistory/VersionActions
 */

import { useState, useEffect, useRef } from "react";
import {
  RotateCcw,
  GitCompare,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import type { VersionEntry } from "../../../types";
import "./VersionActions.css";

/**
 * Props for the VersionActions component
 */
interface VersionActionsProps {
  /** The selected version */
  version: VersionEntry;
  /** Callback to restore the version */
  onRestore: () => void;
  /** Callback to compare the version */
  onCompare: () => void;
  /** Callback to download the version */
  onDownload: () => void;
  /** Callback to delete the version */
  onDelete: () => void;
  /** Current loading action */
  loading: string | null;
}

/**
 * Props for ConfirmModal component
 */
interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Confirmation modal component with focus trap
 */
function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps): React.ReactElement {
  const triggerRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Store the trigger element when modal mounts
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  }, []);

  // Focus trap for accessibility
  const { containerRef } = useFocusTrap({
    enabled: true,
    onEscape: loading ? undefined : onCancel,
    returnFocusTo: triggerRef.current,
  });

  // Focus cancel button when modal opens
  useEffect(() => {
    setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) onCancel();
  };

  return (
    <div className="wn-confirm-overlay" onClick={handleOverlayClick}>
      <div
        ref={containerRef}
        className="wn-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <div className="wn-confirm-header">
          <AlertTriangle size={20} className="wn-confirm-icon" />
          <h3 id="confirm-modal-title" className="wn-confirm-title">
            {title}
          </h3>
          <button
            className="wn-confirm-close"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p id="confirm-modal-message" className="wn-confirm-message">
          {message}
        </p>
        <div className="wn-confirm-actions">
          <button
            ref={cancelButtonRef}
            className="wn-confirm-btn wn-confirm-btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`wn-confirm-btn wn-confirm-btn--${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="wn-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Version Actions component
 *
 * @component
 * @example
 * ```tsx
 * <VersionActions
 *   version={selectedVersion}
 *   onRestore={handleRestore}
 *   onCompare={handleCompare}
 *   onDownload={handleDownload}
 *   onDelete={handleDelete}
 *   loading={actionLoading}
 * />
 * ```
 */
export function VersionActions({
  version,
  onRestore,
  onCompare,
  onDownload,
  onDelete,
  loading,
}: VersionActionsProps): React.ReactElement {
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRestoreClick = () => {
    setShowRestoreConfirm(true);
  };

  const handleRestoreConfirm = () => {
    onRestore();
    setShowRestoreConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  const isLoading = loading !== null;

  return (
    <>
      <div className="wn-version-actions">
        <button
          className="wn-version-action wn-version-action--primary"
          onClick={handleRestoreClick}
          disabled={isLoading}
          title="Restore this version"
        >
          {loading === "restore" ? (
            <Loader2 size={14} className="wn-spin" />
          ) : (
            <RotateCcw size={14} />
          )}
          Restore
        </button>
        <button
          className="wn-version-action"
          onClick={onCompare}
          disabled={isLoading}
          title="Compare with current"
        >
          {loading === "compare" ? (
            <Loader2 size={14} className="wn-spin" />
          ) : (
            <GitCompare size={14} />
          )}
          Compare
        </button>
        <button
          className="wn-version-action"
          onClick={onDownload}
          disabled={isLoading}
          title="Download as markdown"
        >
          <Download size={14} />
          Download
        </button>
        <button
          className="wn-version-action wn-version-action--danger"
          onClick={handleDeleteClick}
          disabled={isLoading}
          title="Delete this version"
        >
          {loading === "delete" ? (
            <Loader2 size={14} className="wn-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          Delete
        </button>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <ConfirmModal
          title="Restore Version"
          message="This will replace your current content with this version. A safety snapshot will be created before restoring. Are you sure you want to continue?"
          confirmLabel="Restore"
          confirmVariant="primary"
          onConfirm={handleRestoreConfirm}
          onCancel={() => setShowRestoreConfirm(false)}
          loading={loading === "restore"}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Version"
          message={`Are you sure you want to delete this version${version.label ? ` "${version.label}"` : ""}? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={loading === "delete"}
        />
      )}
    </>
  );
}
