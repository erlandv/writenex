/**
 * @fileoverview Version History Panel component
 *
 * Slide-in panel for viewing and managing content version history.
 * Displays version list with timestamps, previews, and action buttons.
 *
 * @module @writenex/astro/client/components/VersionHistory/VersionHistoryPanel
 */

import { useEffect, useState, useRef } from "react";
import {
  X,
  History,
  Clock,
  Tag,
  RefreshCw,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { VersionEntry } from "../../../types";
import {
  useVersionHistory,
  type DiffData,
} from "../../hooks/useVersionHistory";
import { useSharedVersionApi } from "../../context/ApiContext";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { VersionActions } from "./VersionActions";
import { DiffViewer } from "./DiffViewer";
import "./VersionHistoryPanel.css";

/**
 * Props for the VersionHistoryPanel component
 */
interface VersionHistoryPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Collection name */
  collection: string | null;
  /** Content ID (slug) */
  contentId: string | null;
  /** Current content body for comparison (reserved for future use) */
  currentContent: string;
  /** Callback when content is restored */
  onRestore: (content: string) => void;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Version History Panel component
 *
 * @component
 * @example
 * ```tsx
 * <VersionHistoryPanel
 *   isOpen={showVersionHistory}
 *   onClose={() => setShowVersionHistory(false)}
 *   apiBase={apiBase}
 *   collection="blog"
 *   contentId="my-post"
 *   currentContent={content.body}
 *   onRestore={handleRestore}
 * />
 * ```
 */
export function VersionHistoryPanel({
  isOpen,
  onClose,
  collection,
  contentId,
  currentContent: _currentContent,
  onRestore,
}: VersionHistoryPanelProps): React.ReactElement | null {
  const versionApi = useSharedVersionApi();
  const {
    versions,
    loading,
    error,
    refresh,
    restoreVersion,
    deleteVersion,
    clearVersions,
    getDiff,
  } = useVersionHistory(versionApi, collection, contentId);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Fetch versions when panel opens
  useEffect(() => {
    if (isOpen && collection && contentId) {
      refresh();
    }
  }, [isOpen, collection, contentId, refresh]);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVersionId(null);
      setDiffData(null);
      setShowDiff(false);
      setShowClearAllConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVersionClick = (versionId: string) => {
    setSelectedVersionId(selectedVersionId === versionId ? null : versionId);
  };

  const handleRestore = async (versionId: string) => {
    setActionLoading("restore");
    try {
      const content = await restoreVersion(versionId);
      if (content) {
        onRestore(content);
        setSelectedVersionId(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompare = async (versionId: string) => {
    setActionLoading("compare");
    try {
      const data = await getDiff(versionId);
      if (data) {
        setDiffData(data);
        setShowDiff(true);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (versionId: string) => {
    setActionLoading("delete");
    try {
      await deleteVersion(versionId);
      setSelectedVersionId(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearAll = async () => {
    setActionLoading("clearAll");
    try {
      await clearVersions();
      setSelectedVersionId(null);
      setShowClearAllConfirm(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = (version: VersionEntry) => {
    // Create a blob with the version content
    // We need to fetch the full version content first
    getDiff(version.id).then((data) => {
      if (data) {
        const blob = new Blob([data.version.content], {
          type: "text/markdown",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${contentId}-${version.id}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  return (
    <>
      <div className="wn-version-panel" aria-label="Version history">
        {/* Header */}
        <div className="wn-version-panel-header">
          <h2 className="wn-version-panel-title">
            <History size={16} />
            Version History
          </h2>
          <div className="wn-version-panel-actions">
            <button
              className="wn-version-panel-btn wn-version-panel-btn--danger"
              onClick={() => setShowClearAllConfirm(true)}
              disabled={loading || versions.length === 0}
              title="Clear all history"
              aria-label="Clear all version history"
            >
              <Trash2 size={14} />
            </button>
            <button
              className="wn-version-panel-btn"
              onClick={() => refresh()}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh version list"
            >
              <RefreshCw size={14} className={loading ? "wn-spin" : ""} />
            </button>
            <button
              className="wn-version-panel-btn"
              onClick={onClose}
              title="Close"
              aria-label="Close version history panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="wn-version-panel-content">
          {loading && versions.length === 0 ? (
            <div className="wn-version-panel-loading">
              <Loader2 size={24} className="wn-spin" />
              <span>Loading versions...</span>
            </div>
          ) : error ? (
            <div className="wn-version-panel-error">
              <span>{error}</span>
              <button onClick={() => refresh()}>Retry</button>
            </div>
          ) : versions.length === 0 ? (
            <div className="wn-version-panel-empty">
              <History size={32} />
              <p>No versions yet</p>
              <span>Versions are created automatically when you save</span>
            </div>
          ) : (
            <div className="wn-version-list">
              {versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isSelected={selectedVersionId === version.id}
                  onClick={() => handleVersionClick(version.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions for selected version */}
        {selectedVersion && (
          <VersionActions
            version={selectedVersion}
            onRestore={() => handleRestore(selectedVersion.id)}
            onCompare={() => handleCompare(selectedVersion.id)}
            onDownload={() => handleDownload(selectedVersion)}
            onDelete={() => handleDelete(selectedVersion.id)}
            loading={actionLoading}
          />
        )}
      </div>

      {/* Diff Viewer Modal */}
      {showDiff && diffData && (
        <DiffViewer
          oldContent={diffData.version.body}
          newContent={diffData.current.body}
          oldLabel={`Version: ${formatTimestamp(diffData.version.timestamp)}`}
          newLabel="Current"
          onClose={() => setShowDiff(false)}
        />
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <ClearAllConfirmModal
          versionCount={versions.length}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearAllConfirm(false)}
          loading={actionLoading === "clearAll"}
        />
      )}
    </>
  );
}

/**
 * Version item component
 */
function VersionItem({
  version,
  isSelected,
  onClick,
}: {
  version: VersionEntry;
  isSelected: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      className={`wn-version-item ${isSelected ? "wn-version-item--selected" : ""}`}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <div className="wn-version-item-header">
        <span className="wn-version-item-time">
          <Clock size={12} />
          {formatTimestamp(version.timestamp)}
        </span>
        <span className="wn-version-item-size">{formatSize(version.size)}</span>
      </div>
      {version.label && (
        <span className="wn-version-item-label">
          <Tag size={10} />
          {version.label}
        </span>
      )}
      <p className="wn-version-item-preview">{version.preview}</p>
    </button>
  );
}

/**
 * Props for ClearAllConfirmModal component
 */
interface ClearAllConfirmModalProps {
  /** Number of versions to be deleted */
  versionCount: number;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * Confirmation modal for clearing all version history
 */
function ClearAllConfirmModal({
  versionCount,
  onConfirm,
  onCancel,
  loading,
}: ClearAllConfirmModalProps): React.ReactElement {
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
        aria-labelledby="clear-all-modal-title"
        aria-describedby="clear-all-modal-message"
      >
        <div className="wn-confirm-header">
          <AlertTriangle size={20} className="wn-confirm-icon" />
          <h3 id="clear-all-modal-title" className="wn-confirm-title">
            Clear All History
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
        <p id="clear-all-modal-message" className="wn-confirm-message">
          Are you sure you want to delete all {versionCount} version
          {versionCount !== 1 ? "s" : ""} for this content? This action cannot
          be undone.
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
            className="wn-confirm-btn wn-confirm-btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="wn-spin" />
                Clearing...
              </>
            ) : (
              "Clear All"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
