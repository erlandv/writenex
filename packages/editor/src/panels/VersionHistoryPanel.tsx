/**
 * @fileoverview Version History Panel Component
 *
 * This component provides a sidebar panel for viewing and managing document
 * version history. It allows users to restore, compare, export, and delete
 * previous versions of their document.
 *
 * ## Features:
 * - Animated slide-in/out sidebar panel
 * - List of saved versions with timestamps and previews
 * - Labeled snapshots (e.g., "Before Clear")
 * - Restore version to editor
 * - Compare version with current content (diff view)
 * - Download version as markdown file
 * - Delete individual versions or clear all history
 * - Per-document version history (linked to activeDocumentId)
 *
 * ## Version Lifecycle:
 * Versions are created by useAutoSave hook at regular intervals and are
 * capped at MAX_VERSIONS_PER_DOCUMENT (default 50) per document. Special
 * operations like clearing the editor create labeled snapshots for easy
 * identification.
 *
 * @module components/editor/VersionHistoryPanel
 * @see {@link useAutoSave} - Hook that creates version snapshots
 * @see {@link DeleteVersionDialog} - Confirmation dialog for deletion
 * @see {@link db} - IndexedDB functions for version CRUD
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  History,
  RotateCcw,
  GitCompare,
  Trash2,
  Download,
  Trash,
} from "lucide-react";
import { Button } from "@writenex/ui" // button";
import { SimpleTooltip } from "@writenex/ui" // simple-tooltip";
import { DeleteVersionDialog } from "../dialogs";
import { DestructiveActionDialog } from "@writenex/ui" // destructive-action-dialog";
import { useEditorStore } from "@writenex/store";
import {
  getVersions,
  deleteVersion,
  clearAllVersions,
  type VersionEntry,
} from "@writenex/db";
import { cn, formatShortDateTime } from "@writenex/utils";

/**
 * Props for the VersionHistoryPanel component
 *
 * @interface VersionHistoryPanelProps
 */
interface VersionHistoryPanelProps {
  /**
   * Callback when user restores a version.
   * Should update editor content and MDXEditor markdown.
   *
   * @param content - The version content to restore
   */
  onRestore: (content: string) => void;

  /**
   * Callback when user wants to compare a version with current content.
   * Should open the diff viewer with old and new content.
   *
   * @param oldContent - The historical version content
   * @param newContent - The current editor content
   */
  onCompare: (oldContent: string, newContent: string) => void;
}

/**
 * Version history sidebar panel component.
 *
 * Renders a collapsible sidebar panel on the right side of the editor
 * containing a list of saved versions. Each version displays:
 * - Timestamp of when it was saved
 * - Optional label (e.g., "Before Clear")
 * - Preview of the content (first ~100 chars)
 *
 * When a version is selected (clicked), action buttons appear:
 * - Restore: Replace current content with this version
 * - Compare: Open diff view comparing with current content
 * - Download: Export this version as a .md file
 * - Delete: Remove this version (with confirmation)
 *
 * @component
 * @example
 * ```tsx
 * function MarkdownEditor() {
 *   const handleRestore = (content: string) => {
 *     setContent(content);
 *     editorRef.current?.setMarkdown(content);
 *   };
 *
 *   const handleCompare = (old: string, current: string) => {
 *     setShowDiff(true);
 *     setDiffContent({ old, current });
 *   };
 *
 *   return (
 *     <>
 *       <Editor />
 *       <VersionHistoryPanel
 *         onRestore={handleRestore}
 *         onCompare={handleCompare}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @returns Sidebar panel element (always rendered, animated visibility)
 *
 * @see {@link DeleteVersionDialog} - Confirmation for version deletion
 * @see {@link Header} - Contains button to toggle this panel
 */
export function VersionHistoryPanel({
  onRestore,
  onCompare,
}: VersionHistoryPanelProps): React.ReactElement | null {
  const {
    isVersionHistoryOpen,
    setVersionHistoryOpen,
    isReadOnly,
    content,
    activeDocumentId,
    versionHistoryRefreshKey,
  } = useEditorStore();
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);
  const [isClearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load versions function
  const loadVersions = useCallback(async (): Promise<void> => {
    if (!activeDocumentId) return;

    setLoading(true);
    try {
      const versionList = await getVersions(activeDocumentId);
      setVersions(versionList);
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setLoading(false);
    }
  }, [activeDocumentId]);

  // Load versions when panel opens, document changes, or new version is created
  useEffect(() => {
    if (isVersionHistoryOpen && activeDocumentId) {
      loadVersions();
    }
  }, [
    isVersionHistoryOpen,
    activeDocumentId,
    loadVersions,
    versionHistoryRefreshKey,
  ]);

  const handleRestore = useCallback(
    (version: VersionEntry) => {
      if (isReadOnly) {
        // Show message that we need to exit read-only mode
        const confirmRestore = window.confirm(
          "The editor is in read-only mode. Would you like to exit read-only mode and restore this version?"
        );
        if (!confirmRestore) return;
      }
      onRestore(version.content);
      setVersionHistoryOpen(false);
    },
    [isReadOnly, onRestore, setVersionHistoryOpen]
  );

  const handleCompare = useCallback(
    (version: VersionEntry) => {
      onCompare(version.content, content);
    },
    [content, onCompare]
  );

  const handleDelete = useCallback((versionId: number) => {
    setVersionToDelete(versionId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (versionToDelete === null || !activeDocumentId) return;

    try {
      await deleteVersion(versionToDelete);
      // Reload versions after delete
      const versionList = await getVersions(activeDocumentId);
      setVersions(versionList);
      setVersionToDelete(null);
    } catch (error) {
      console.error("Failed to delete version:", error);
    }
  }, [versionToDelete, activeDocumentId]);

  const confirmClearAll = useCallback(async () => {
    if (!activeDocumentId) return;

    try {
      await clearAllVersions(activeDocumentId);
      // Reload versions after clearing
      const versionList = await getVersions(activeDocumentId);
      setVersions(versionList);
      setClearAllDialogOpen(false);
    } catch (error) {
      console.error("Failed to clear all versions:", error);
    }
  }, [activeDocumentId]);

  const handleExport = useCallback((version: VersionEntry) => {
    const blob = new Blob([version.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `version-${version.timestamp.toISOString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Remove early return to allow animation
  // if (!isVersionHistoryOpen) return null;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isVersionHistoryOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setVersionHistoryOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          // Base styles
          "flex flex-col overflow-hidden border-l border-zinc-200 bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900",
          // Mobile: fixed full-width overlay from right
          "fixed inset-y-0 right-0 z-50 sm:relative sm:z-auto",
          // Width: full on mobile, 320px on desktop
          isVersionHistoryOpen
            ? "w-full translate-x-0 opacity-100 sm:w-80"
            : "w-0 translate-x-full border-l-0 opacity-0"
        )}
        role="dialog"
        aria-label="Version history"
        aria-hidden={!isVersionHistoryOpen}
      >
        <div className="flex h-full w-full flex-col sm:w-80">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/50 px-4 py-3 backdrop-blur-md sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <History className="h-5 w-5 sm:h-4 sm:w-4" />
              <h2 className="text-base font-semibold tracking-tight sm:text-sm">
                Version History
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {versions.length > 0 && (
                <SimpleTooltip content="Clear all history">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-zinc-400 transition-colors hover:text-red-600 sm:h-8 sm:w-8 dark:hover:text-red-400"
                    onClick={() => setClearAllDialogOpen(true)}
                    aria-label="Clear all history"
                  >
                    <Trash className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </SimpleTooltip>
              )}
              <SimpleTooltip content="Close">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-400 transition-colors hover:text-zinc-700 sm:h-8 sm:w-8 dark:hover:text-zinc-200"
                  onClick={() => setVersionHistoryOpen(false)}
                  aria-label="Close version history"
                >
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </SimpleTooltip>
            </div>
          </div>

          {/* Version List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3 text-zinc-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-xs">Loading history...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-6 text-center text-zinc-400">
                <History className="mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  No versions yet
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Edits are automatically saved to your local history.
                </p>
              </div>
            ) : (
              <ul
                className="divide-y divide-zinc-100 dark:divide-zinc-800"
                role="list"
                aria-label="Saved versions"
              >
                {versions.map((version) => {
                  const isSelected = selectedVersion === version.id;
                  return (
                    <li
                      key={version.id}
                      className={cn(
                        "group relative transition-all duration-200 ease-in-out",
                        isSelected
                          ? "bg-zinc-50 dark:bg-zinc-800/60"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      {/* Active Indicator Line */}
                      {isSelected && (
                        <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-500 dark:bg-blue-400" />
                      )}

                      <div
                        className="cursor-pointer p-4"
                        onClick={() =>
                          setSelectedVersion(isSelected ? null : version.id!)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedVersion(isSelected ? null : version.id!);
                          }
                        }}
                        aria-expanded={isSelected}
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                            {formatShortDateTime(new Date(version.timestamp))}
                          </span>
                          {version.label && (
                            <span className="rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/40 dark:text-amber-400">
                              {version.label}
                            </span>
                          )}
                        </div>

                        <p
                          className={cn(
                            "line-clamp-2 text-sm leading-relaxed transition-colors duration-200",
                            isSelected
                              ? "font-medium text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-600 dark:text-zinc-400"
                          )}
                        >
                          {version.preview || (
                            <span className="italic opacity-50">
                              Empty content
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Actions Area - Animated Expansion */}
                      <div
                        className={cn(
                          "grid overflow-hidden bg-zinc-50/50 transition-all duration-300 ease-in-out dark:bg-zinc-900/20",
                          isSelected
                            ? "grid-rows-[1fr] border-t border-zinc-100 opacity-100 dark:border-zinc-800"
                            : "grid-rows-[0fr] opacity-0"
                        )}
                      >
                        <div className="min-h-0">
                          <div className="flex items-center justify-start gap-1 p-2 px-4">
                            <SimpleTooltip
                              content="Restore this version"
                              side="top"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:bg-black/10 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(version);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </SimpleTooltip>

                            <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                            <SimpleTooltip
                              content="Compare with current"
                              side="top"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompare(version);
                                }}
                              >
                                <GitCompare className="h-4 w-4" />
                              </Button>
                            </SimpleTooltip>

                            <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                            <SimpleTooltip
                              content="Download Markdown"
                              side="top"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExport(version);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </SimpleTooltip>

                            <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                            <SimpleTooltip content="Delete version" side="top">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (version.id) handleDelete(version.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </SimpleTooltip>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DeleteVersionDialog
          open={versionToDelete !== null}
          onOpenChange={(open) => !open && setVersionToDelete(null)}
          onConfirm={confirmDelete}
        />

        <DestructiveActionDialog
          open={isClearAllDialogOpen}
          onOpenChange={setClearAllDialogOpen}
          title="Clear All History"
          description="Are you sure you want to delete all version history? This action cannot be undone."
          confirmLabel="Clear All"
          onConfirm={confirmClearAll}
        />
      </div>
    </>
  );
}
