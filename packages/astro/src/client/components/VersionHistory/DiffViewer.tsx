/**
 * @fileoverview Diff Viewer component
 *
 * Side-by-side or inline diff display for comparing version content.
 * Highlights additions and deletions with color coding.
 * Includes focus trap and ARIA attributes for accessibility compliance.
 *
 * @module @writenex/astro/client/components/VersionHistory/DiffViewer
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Columns, AlignLeft } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import "./DiffViewer.css";

/**
 * Props for the DiffViewer component
 */
interface DiffViewerProps {
  /** Old content (version) */
  oldContent: string;
  /** New content (current) */
  newContent: string;
  /** Label for old content */
  oldLabel: string;
  /** Label for new content */
  newLabel: string;
  /** Callback to close the viewer */
  onClose: () => void;
}

/**
 * Diff line type
 */
type DiffLineType = "unchanged" | "added" | "removed";

/**
 * Diff line data
 */
interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

/**
 * Simple line-by-line diff algorithm
 * Uses longest common subsequence approach
 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  let i = m;
  let j = n;
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({
        type: "unchanged",
        content: oldLines[i - 1],
        oldLineNum: i,
        newLineNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "added",
        content: newLines[j - 1],
        newLineNum: j,
      });
      j--;
    } else if (i > 0) {
      stack.push({
        type: "removed",
        content: oldLines[i - 1],
        oldLineNum: i,
      });
      i--;
    }
  }

  // Reverse to get correct order
  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  return result;
}

/**
 * Diff Viewer component
 *
 * @component
 * @example
 * ```tsx
 * <DiffViewer
 *   oldContent={versionContent}
 *   newContent={currentContent}
 *   oldLabel="Version: 2h ago"
 *   newLabel="Current"
 *   onClose={() => setShowDiff(false)}
 * />
 * ```
 */
export function DiffViewer({
  oldContent,
  newContent,
  oldLabel,
  newLabel,
  onClose,
}: DiffViewerProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");
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

  const diffLines = useMemo(
    () => computeDiff(oldContent, newContent),
    [oldContent, newContent]
  );

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    for (const line of diffLines) {
      if (line.type === "added") additions++;
      if (line.type === "removed") deletions++;
    }
    return { additions, deletions };
  }, [diffLines]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="wn-diff-overlay" onClick={handleOverlayClick}>
      <div
        ref={containerRef}
        className="wn-diff-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diff-viewer-title"
      >
        {/* Header */}
        <div className="wn-diff-header">
          <div className="wn-diff-header-left">
            <h2 id="diff-viewer-title" className="wn-diff-title">
              Compare Versions
            </h2>
            <div className="wn-diff-stats">
              <span className="wn-diff-stat wn-diff-stat--added">
                +{stats.additions}
              </span>
              <span className="wn-diff-stat wn-diff-stat--removed">
                -{stats.deletions}
              </span>
            </div>
          </div>
          <div className="wn-diff-header-right">
            <div
              className="wn-diff-view-toggle"
              role="group"
              aria-label="View mode"
            >
              <button
                className={`wn-diff-view-btn ${viewMode === "split" ? "wn-diff-view-btn--active" : ""}`}
                onClick={() => setViewMode("split")}
                title="Split view"
                aria-pressed={viewMode === "split"}
                aria-label="Split view"
              >
                <Columns size={14} />
              </button>
              <button
                className={`wn-diff-view-btn ${viewMode === "unified" ? "wn-diff-view-btn--active" : ""}`}
                onClick={() => setViewMode("unified")}
                title="Unified view"
                aria-pressed={viewMode === "unified"}
                aria-label="Unified view"
              >
                <AlignLeft size={14} />
              </button>
            </div>
            <button
              className="wn-diff-close"
              onClick={onClose}
              title="Close"
              aria-label="Close diff viewer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="wn-diff-content">
          {viewMode === "split" ? (
            <SplitView
              diffLines={diffLines}
              oldLabel={oldLabel}
              newLabel={newLabel}
            />
          ) : (
            <UnifiedView
              diffLines={diffLines}
              oldLabel={oldLabel}
              newLabel={newLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Split view component
 */
function SplitView({
  diffLines,
  oldLabel,
  newLabel,
}: {
  diffLines: DiffLine[];
  oldLabel: string;
  newLabel: string;
}): React.ReactElement {
  return (
    <div className="wn-diff-split">
      {/* Old content column */}
      <div className="wn-diff-column">
        <div className="wn-diff-column-header">{oldLabel}</div>
        <div className="wn-diff-column-content">
          {diffLines.map((line, idx) => {
            if (line.type === "added") {
              return (
                <div key={idx} className="wn-diff-line wn-diff-line--empty">
                  <span className="wn-diff-line-num"></span>
                  <span className="wn-diff-line-content"></span>
                </div>
              );
            }
            return (
              <div
                key={idx}
                className={`wn-diff-line ${line.type === "removed" ? "wn-diff-line--removed" : ""}`}
              >
                <span className="wn-diff-line-num">{line.oldLineNum}</span>
                <span className="wn-diff-line-content">
                  {line.type === "removed" && (
                    <span className="wn-diff-line-marker">-</span>
                  )}
                  {line.content}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* New content column */}
      <div className="wn-diff-column">
        <div className="wn-diff-column-header">{newLabel}</div>
        <div className="wn-diff-column-content">
          {diffLines.map((line, idx) => {
            if (line.type === "removed") {
              return (
                <div key={idx} className="wn-diff-line wn-diff-line--empty">
                  <span className="wn-diff-line-num"></span>
                  <span className="wn-diff-line-content"></span>
                </div>
              );
            }
            return (
              <div
                key={idx}
                className={`wn-diff-line ${line.type === "added" ? "wn-diff-line--added" : ""}`}
              >
                <span className="wn-diff-line-num">{line.newLineNum}</span>
                <span className="wn-diff-line-content">
                  {line.type === "added" && (
                    <span className="wn-diff-line-marker">+</span>
                  )}
                  {line.content}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Unified view component
 */
function UnifiedView({
  diffLines,
  oldLabel,
  newLabel,
}: {
  diffLines: DiffLine[];
  oldLabel: string;
  newLabel: string;
}): React.ReactElement {
  return (
    <div className="wn-diff-unified">
      <div className="wn-diff-unified-header">
        <span className="wn-diff-unified-label wn-diff-unified-label--old">
          {oldLabel}
        </span>
        <span className="wn-diff-unified-arrow">→</span>
        <span className="wn-diff-unified-label wn-diff-unified-label--new">
          {newLabel}
        </span>
      </div>
      <div className="wn-diff-unified-content">
        {diffLines.map((line, idx) => (
          <div
            key={idx}
            className={`wn-diff-line ${
              line.type === "added"
                ? "wn-diff-line--added"
                : line.type === "removed"
                  ? "wn-diff-line--removed"
                  : ""
            }`}
          >
            <span className="wn-diff-line-num wn-diff-line-num--old">
              {line.oldLineNum ?? ""}
            </span>
            <span className="wn-diff-line-num wn-diff-line-num--new">
              {line.newLineNum ?? ""}
            </span>
            <span className="wn-diff-line-content">
              {line.type !== "unchanged" && (
                <span className="wn-diff-line-marker">
                  {line.type === "added" ? "+" : "-"}
                </span>
              )}
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
