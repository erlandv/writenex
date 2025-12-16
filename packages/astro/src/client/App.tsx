/**
 * @fileoverview Main App component for Writenex editor
 *
 * This is the root component for the Writenex editor UI.
 * It provides the main layout with sidebar navigation and editor.
 *
 * @module @writenex/astro/client/App
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import {
  LazyEditor as Editor,
  EditorEmpty,
  EditorLoading,
} from "./components/LazyEditor";
import { ConfigPanel } from "./components/ConfigPanel/ConfigPanel";
import { CreateContentModal } from "./components/CreateContentModal";
import { SelectCollectionModal } from "./components/SelectCollectionModal";
import { UnsavedChangesModal } from "./components/UnsavedChangesModal";
import { Header } from "./components/Header";
import { FrontmatterForm } from "./components/FrontmatterForm";
import { Save, FileEdit, CheckCircle, ExternalLink } from "lucide-react";
import type { CollectionSchema } from "../types";
import {
  useCollections,
  useContentList,
  useConfig,
  type ContentItem,
} from "./hooks/useApi";
import { useSharedApi } from "./context/ApiContext";
import {
  useAutosave,
  formatLastSaved,
  type AutosaveStatus,
} from "./hooks/useAutosave";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "./components/KeyboardShortcuts";
import { SearchReplacePanel } from "./components/SearchReplace";
import { useSearch } from "./hooks/useSearch";
import { VersionHistoryPanel } from "./components/VersionHistory";
import { SkipLink } from "./components/SkipLink";
import { LiveRegion } from "./components/LiveRegion";
import { useAnnounce } from "./hooks/useAnnounce";

function generatePreviewUrl(
  pattern: string,
  contentId: string,
  frontmatter: Record<string, unknown>,
  trailingSlash: "always" | "never" | "ignore" = "ignore"
): string {
  let url = pattern;
  url = url.replace("{slug}", contentId);
  const tokens = pattern.match(/\{([^}]+)\}/g) ?? [];
  for (const token of tokens) {
    const key = token.slice(1, -1);
    if (key !== "slug" && frontmatter[key] !== undefined) {
      url = url.replace(token, String(frontmatter[key]));
    }
  }

  // Apply trailingSlash setting
  if (trailingSlash === "always" && !url.endsWith("/")) {
    url = url + "/";
  } else if (trailingSlash === "never" && url.endsWith("/") && url !== "/") {
    url = url.slice(0, -1);
  }

  return url;
}

function AutosaveIndicator({
  status,
  hasUnsavedChanges,
  lastSaved,
  enabled,
  onToggle,
  announce,
}: {
  status: AutosaveStatus;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  enabled: boolean;
  onToggle: () => void;
  announce: (message: string, politeness?: "polite" | "assertive") => void;
}): React.ReactElement {
  const prevStatusRef = useRef<AutosaveStatus | null>(null);

  let text = "";
  let statusClass = "wn-autosave-text--idle";

  if (!enabled) {
    text = hasUnsavedChanges ? "Unsaved" : "Autosave off";
    statusClass = "wn-autosave-text--pending";
  } else {
    switch (status) {
      case "saving":
        text = "Saving...";
        statusClass = "wn-autosave-text--saving";
        break;
      case "saved":
        text = "Saved";
        statusClass = "wn-autosave-text--saved";
        break;
      case "error":
        text = "Save failed";
        statusClass = "wn-autosave-text--error";
        break;
      case "pending":
        text = "Unsaved";
        statusClass = "wn-autosave-text--pending";
        break;
      default:
        text = lastSaved ? formatLastSaved(lastSaved) : "";
        statusClass = "wn-autosave-text--idle";
    }
  }

  // Announce status changes to screen readers (Requirements 3.1, 3.2, 3.3, 3.4)
  useEffect(() => {
    // Only announce when status actually changes
    if (prevStatusRef.current === status) return;
    prevStatusRef.current = status;

    if (!enabled) return;

    switch (status) {
      case "saved":
        announce("Content saved", "polite");
        break;
      case "error":
        announce("Save failed", "assertive");
        break;
      case "pending":
        announce("Unsaved changes", "polite");
        break;
    }
  }, [status, enabled, announce]);

  return (
    <button
      className="wn-autosave-indicator"
      onClick={onToggle}
      title={enabled ? "Disable autosave" : "Enable autosave"}
    >
      <Save
        size={14}
        style={{
          color: enabled ? "var(--wn-emerald-500)" : "var(--wn-zinc-500)",
          opacity: enabled ? 1 : 0.5,
        }}
      />
      {text && (
        <span className={`wn-autosave-text ${statusClass}`}>{text}</span>
      )}
    </button>
  );
}

/** Main content area ID for skip link navigation */
const MAIN_CONTENT_ID = "wn-main-editor";

export function App(): React.ReactElement {
  const api = useSharedApi();
  const { config, refresh: refreshConfig } = useConfig(api);

  // Accessibility: Live region for screen reader announcements
  const { announce, currentMessage, currentPoliteness } = useAnnounce();

  const {
    collections,
    loading: collectionsLoading,
    refresh: refreshCollections,
  } = useCollections(api);

  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    null
  );

  const {
    items: contentItems,
    loading: contentLoading,
    refresh: refreshContent,
  } = useContentList(api, selectedCollection);

  const [currentContent, setCurrentContent] = useState<ContentItem | null>(
    null
  );
  const [contentLoadingState, setContentLoadingState] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingContent, setIsCreatingContent] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFrontmatterOpen, setIsFrontmatterOpen] = useState(true);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Unsaved changes modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingContentId, setPendingContentId] = useState<string | null>(null);
  const [isSavingBeforeSwitch, setIsSavingBeforeSwitch] = useState(false);

  // Select collection modal state (for Alt+N without selected collection)
  const [showSelectCollectionModal, setShowSelectCollectionModal] =
    useState(false);

  const contentRef = useRef<ContentItem | null>(null);
  contentRef.current = currentContent;

  // Search functionality
  const getContent = useCallback(
    () => currentContent?.body ?? "",
    [currentContent?.body]
  );
  const {
    isSearchOpen,
    toggleSearch,
    closeSearch,
    searchQuery,
    searchActiveIndex,
    totalMatches,
    handleFind,
    handleNextMatch,
    handlePreviousMatch,
    handleReplace,
    handleReplaceAll,
  } = useSearch(getContent);

  const currentCollection = collections.find(
    (c) => c.name === selectedCollection
  );
  const currentSchema = currentCollection?.schema as
    | CollectionSchema
    | undefined;

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Sync autosave state with config when config is loaded
  useEffect(() => {
    if (config && autosaveEnabled === null) {
      setAutosaveEnabled(config.editor?.autosave !== false);
    }
  }, [config, autosaveEnabled]);

  useEffect(() => {
    if (selectedCollection && selectedContentId) {
      setContentLoadingState(true);
      announce("Loading content", "polite");
      api
        .getContent(selectedCollection, selectedContentId)
        .then((content) => {
          setCurrentContent(content);
          setHasUnsavedChanges(false);
          announce("Content loaded", "polite");
        })
        .catch((err) => {
          console.error("Failed to load content:", err);
          setCurrentContent(null);
          announce("Failed to load content", "assertive");
        })
        .finally(() => {
          setContentLoadingState(false);
        });
    } else {
      setCurrentContent(null);
    }
  }, [api, selectedCollection, selectedContentId, announce]);

  const handleSelectCollection = useCallback((name: string) => {
    setSelectedCollection(name);
    setSelectedContentId(null);
    setCurrentContent(null);
  }, []);

  const handleSelectContent = useCallback(
    (id: string) => {
      if (hasUnsavedChanges) {
        setPendingContentId(id);
        setShowUnsavedModal(true);
        return;
      }
      setSelectedContentId(id);
    },
    [hasUnsavedChanges]
  );

  const handleUnsavedModalClose = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingContentId(null);
  }, []);

  const handleUnsavedDiscard = useCallback(() => {
    setShowUnsavedModal(false);
    setHasUnsavedChanges(false);
    if (pendingContentId) {
      setSelectedContentId(pendingContentId);
      setPendingContentId(null);
    }
  }, [pendingContentId]);

  const [contentChanged, setContentChanged] = useState(false);

  const handleContentChange = useCallback(
    (markdown: string) => {
      if (currentContent && markdown !== currentContent.body) {
        setHasUnsavedChanges(true);
        setContentChanged(true);
        setCurrentContent((prev) =>
          prev ? { ...prev, body: markdown } : null
        );
      }
    },
    [currentContent]
  );

  const handleFrontmatterChange = useCallback(
    (frontmatter: Record<string, unknown>) => {
      setHasUnsavedChanges(true);
      setContentChanged(true);
      setCurrentContent((prev) => (prev ? { ...prev, frontmatter } : null));
    },
    []
  );

  const handleImageUpload = useCallback(
    async (file: File, _fieldName: string): Promise<string | null> => {
      if (!selectedCollection || !selectedContentId) return null;
      try {
        const result = await api.uploadImage(
          file,
          selectedCollection,
          selectedContentId
        );
        if (result.success && result.path) {
          return result.path;
        }
        alert(`Failed to upload image: ${result.error}`);
        return null;
      } catch (err) {
        alert(
          `Failed to upload image: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        return null;
      }
    },
    [api, selectedCollection, selectedContentId]
  );

  const performSave = useCallback(async (): Promise<boolean> => {
    const content = contentRef.current;
    if (!selectedCollection || !selectedContentId || !content) return false;

    setSaving(true);
    try {
      const result = await api.updateContent(
        selectedCollection,
        selectedContentId,
        {
          frontmatter: content.frontmatter,
          body: content.body,
        }
      );

      if (result.success) {
        setHasUnsavedChanges(false);
        return true;
      } else {
        console.error("Failed to save:", result.error);
        return false;
      }
    } catch (err) {
      console.error("Failed to save:", err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [api, selectedCollection, selectedContentId]);

  const {
    status: autosaveStatus,
    triggerChange: triggerAutosave,
    saveNow: saveNowAutosave,
    lastSaved,
  } = useAutosave({
    delay: config?.editor?.autosaveInterval ?? 3000,
    enabled: autosaveEnabled === true && hasUnsavedChanges,
    onSave: performSave,
    onError: (err) => {
      console.error("Autosave failed:", err);
    },
  });

  useEffect(() => {
    if (contentChanged && autosaveEnabled === true) {
      triggerAutosave();
      setContentChanged(false);
    }
  }, [contentChanged, autosaveEnabled, triggerAutosave]);

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    await saveNowAutosave();
  }, [hasUnsavedChanges, saveNowAutosave]);

  const handleUnsavedSaveAndContinue = useCallback(async () => {
    setIsSavingBeforeSwitch(true);
    try {
      await saveNowAutosave();
      setShowUnsavedModal(false);
      if (pendingContentId) {
        setSelectedContentId(pendingContentId);
        setPendingContentId(null);
      }
    } finally {
      setIsSavingBeforeSwitch(false);
    }
  }, [pendingContentId, saveNowAutosave]);

  const handleOpenCreateModal = useCallback(() => {
    if (!selectedCollection) return;
    setShowCreateModal(true);
  }, [selectedCollection]);

  // Handler for Alt+N shortcut - shows collection selector if no collection selected
  const handleNewContentShortcut = useCallback(() => {
    if (selectedCollection) {
      setShowCreateModal(true);
    } else {
      setShowSelectCollectionModal(true);
    }
  }, [selectedCollection]);

  // Handler when collection is selected from SelectCollectionModal
  const handleSelectCollectionForCreate = useCallback(
    (collectionName: string) => {
      setShowSelectCollectionModal(false);
      setSelectedCollection(collectionName);
      // Small delay to ensure state is updated before opening create modal
      setTimeout(() => setShowCreateModal(true), 50);
    },
    []
  );

  const handleCreateContent = useCallback(
    async (title: string) => {
      if (!selectedCollection) return;

      setIsCreatingContent(true);
      try {
        // Get the date field name from collection schema (pubDate, publishDate, or date)
        const dateFieldName = currentCollection?.schema
          ? Object.keys(currentCollection.schema).find((key) =>
              ["pubDate", "publishDate", "date"].includes(key)
            )
          : undefined;

        const frontmatter: Record<string, unknown> = {
          title,
          draft: true,
        };

        // Add date field if schema has one
        if (dateFieldName) {
          frontmatter[dateFieldName] = new Date().toISOString().split("T")[0];
        }

        const result = await api.createContent(selectedCollection, {
          frontmatter,
          body: "",
        });

        if (result.success && result.id) {
          setShowCreateModal(false);
          await refreshContent();
          setSelectedContentId(result.id);
        } else {
          alert(`Failed to create: ${result.error}`);
        }
      } catch (err) {
        alert(
          `Failed to create: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      } finally {
        setIsCreatingContent(false);
      }
    },
    [api, selectedCollection, currentCollection?.schema, refreshContent]
  );

  const handlePreview = useCallback(() => {
    if (!currentCollection?.previewUrl || !selectedContentId || !currentContent)
      return;

    const url = generatePreviewUrl(
      currentCollection.previewUrl,
      selectedContentId,
      currentContent.frontmatter,
      config?.trailingSlash
    );
    window.open(url, "_blank");
  }, [
    currentCollection,
    selectedContentId,
    currentContent,
    config?.trailingSlash,
  ]);

  const handleToggleDraft = useCallback(() => {
    if (!currentContent) return;

    const newDraftStatus = !currentContent.frontmatter.draft;
    setHasUnsavedChanges(true);
    setContentChanged(true);
    setCurrentContent((prev) =>
      prev
        ? {
            ...prev,
            frontmatter: { ...prev.frontmatter, draft: newDraftStatus },
          }
        : null
    );
  }, [currentContent]);

  const handleToggleVersionHistory = useCallback(() => {
    setIsVersionHistoryOpen((prev) => !prev);
  }, []);

  const handleVersionRestore = useCallback((content: string) => {
    // Parse the restored content to extract frontmatter and body
    // The content is raw markdown with frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      try {
        // Parse YAML frontmatter
        const yamlContent = frontmatterMatch[1] ?? "";
        const body = frontmatterMatch[2] ?? "";
        const frontmatter: Record<string, unknown> = {};

        // Simple YAML parsing for common fields
        yamlContent.split("\n").forEach((line) => {
          const colonIndex = line.indexOf(":");
          if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            let value: unknown = line.slice(colonIndex + 1).trim();

            // Handle quoted strings
            if (
              (value as string).startsWith('"') &&
              (value as string).endsWith('"')
            ) {
              value = (value as string).slice(1, -1);
            } else if (
              (value as string).startsWith("'") &&
              (value as string).endsWith("'")
            ) {
              value = (value as string).slice(1, -1);
            } else if (value === "true") {
              value = true;
            } else if (value === "false") {
              value = false;
            } else if (!isNaN(Number(value)) && value !== "") {
              value = Number(value);
            }

            frontmatter[key] = value;
          }
        });

        setCurrentContent((prev) =>
          prev ? { ...prev, frontmatter, body } : null
        );
        setHasUnsavedChanges(true);
        setContentChanged(true);
      } catch {
        // If parsing fails, just update the body
        setCurrentContent((prev) => (prev ? { ...prev, body: content } : null));
        setHasUnsavedChanges(true);
        setContentChanged(true);
      }
    } else {
      // No frontmatter, just update body
      setCurrentContent((prev) => (prev ? { ...prev, body: content } : null));
      setHasUnsavedChanges(true);
      setContentChanged(true);
    }
  }, []);

  const { showHelp, toggleHelp, closeHelp, shortcuts } = useKeyboardShortcuts({
    shortcuts: [
      {
        key: "save",
        label: "Save",
        keys: "s",
        ctrl: true,
        handler: handleSave,
        enabled: hasUnsavedChanges,
      },
      {
        key: "new",
        label: "New content",
        keys: "n",
        alt: true,
        handler: handleNewContentShortcut,
        enabled: true,
      },
      {
        key: "preview",
        label: "Open preview",
        keys: "p",
        ctrl: true,
        handler: handlePreview,
        enabled: !!currentContent && !!currentCollection?.previewUrl,
      },
      {
        key: "refresh",
        label: "Refresh content",
        keys: "r",
        ctrl: true,
        shift: true,
        handler: refreshContent,
        enabled: !!selectedCollection,
      },
      {
        key: "search",
        label: "Search & Replace",
        keys: "f",
        ctrl: true,
        handler: toggleSearch,
        enabled: !!currentContent,
      },
      {
        key: "escape",
        label: "Close modal",
        keys: "Escape",
        handler: () => {},
      },
    ],
  });

  // Search replace handlers that update content
  const onSearchReplace = useCallback(
    (replacement: string) => {
      if (!currentContent) return;
      handleReplace(replacement, currentContent.body, (newBody) => {
        setHasUnsavedChanges(true);
        setContentChanged(true);
        setCurrentContent((prev) => (prev ? { ...prev, body: newBody } : null));
      });
    },
    [currentContent, handleReplace]
  );

  const onSearchReplaceAll = useCallback(
    (replacement: string): number => {
      if (!currentContent) return 0;
      let count = 0;
      handleReplaceAll(replacement, currentContent.body, (newBody) => {
        setHasUnsavedChanges(true);
        setContentChanged(true);
        setCurrentContent((prev) => (prev ? { ...prev, body: newBody } : null));
        count = totalMatches;
      });
      return count;
    },
    [currentContent, handleReplaceAll, totalMatches]
  );

  return (
    <div className="wn-app">
      {/* Skip link for keyboard navigation - must be first focusable element */}
      <SkipLink targetId={MAIN_CONTENT_ID}>Skip to main content</SkipLink>

      {/* Global live region for screen reader announcements */}
      <LiveRegion message={currentMessage} politeness={currentPoliteness} />

      {showHelp && (
        <ShortcutsHelpModal shortcuts={shortcuts} onClose={closeHelp} />
      )}

      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateContent}
        collectionName={selectedCollection ?? ""}
        isCreating={isCreatingContent}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={handleUnsavedModalClose}
        onDiscard={handleUnsavedDiscard}
        onSave={handleUnsavedSaveAndContinue}
        isSaving={isSavingBeforeSwitch}
      />

      <SelectCollectionModal
        isOpen={showSelectCollectionModal}
        onClose={() => setShowSelectCollectionModal(false)}
        onSelect={handleSelectCollectionForCreate}
        collections={collections}
        isLoading={collectionsLoading}
      />

      <ConfigPanel
        config={config}
        collections={collections}
        isOpen={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
      />

      {/* Main Header with Logo and Toolbar */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isFrontmatterOpen={isFrontmatterOpen}
        onToggleFrontmatter={() => setIsFrontmatterOpen(!isFrontmatterOpen)}
        isSearchOpen={isSearchOpen}
        onToggleSearch={toggleSearch}
        isVersionHistoryOpen={isVersionHistoryOpen}
        onToggleVersionHistory={handleToggleVersionHistory}
        versionHistoryEnabled={!!currentContent}
        onKeyboardShortcuts={toggleHelp}
        onSettings={() => setShowConfigPanel(true)}
        onNewContent={handleNewContentShortcut}
      />

      {/* Secondary Header - Content Actions Bar */}
      {currentContent && (
        <div className="wn-content-bar">
          {/* Left: Content title */}
          <div className="wn-content-bar-left">
            <span
              className="wn-content-bar-title"
              title={String(
                currentContent.frontmatter.title ?? currentContent.id
              )}
            >
              {String(currentContent.frontmatter.title ?? currentContent.id)}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="wn-content-bar-right">
            <AutosaveIndicator
              status={autosaveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSaved={lastSaved}
              enabled={autosaveEnabled === true}
              onToggle={() => setAutosaveEnabled((prev) => prev !== true)}
              announce={announce}
            />
            <div className="wn-content-bar-separator" aria-hidden="true" />
            <button
              className={`wn-btn-secondary ${
                currentContent.frontmatter.draft
                  ? "wn-btn-draft"
                  : "wn-btn-published"
              }`}
              onClick={handleToggleDraft}
              title={
                currentContent.frontmatter.draft
                  ? "Publish this content"
                  : "Set as draft"
              }
            >
              {currentContent.frontmatter.draft ? (
                <>
                  <FileEdit size={14} /> Draft
                </>
              ) : (
                <>
                  <CheckCircle size={14} /> Published
                </>
              )}
            </button>
            {currentCollection?.previewUrl &&
              selectedContentId &&
              !currentContent.frontmatter.draft && (
                <a
                  href={generatePreviewUrl(
                    currentCollection.previewUrl,
                    selectedContentId,
                    currentContent.frontmatter,
                    config?.trailingSlash
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wn-btn-secondary wn-btn-preview"
                  title="Preview in new tab"
                >
                  <ExternalLink size={14} />
                  Preview
                </a>
              )}
            <div className="wn-content-bar-separator" aria-hidden="true" />
            <button
              className="wn-btn-primary"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="wn-main-layout">
        {/* Left: Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          collections={collections}
          collectionsLoading={collectionsLoading}
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
          contentItems={contentItems}
          contentLoading={contentLoading}
          selectedContent={selectedContentId}
          onSelectContent={handleSelectContent}
          onCreateContent={handleOpenCreateModal}
          onRefreshCollections={refreshCollections}
          onRefreshContent={refreshContent}
        />

        {/* Center: Editor */}
        <main
          id={MAIN_CONTENT_ID}
          className="wn-main-content"
          style={{ position: "relative" }}
          aria-label="Content editor"
          aria-busy={contentLoadingState}
        >
          {/* Search Panel - rendered outside editor wrapper for proper positioning */}
          {currentContent && (
            <SearchReplacePanel
              isOpen={isSearchOpen}
              onClose={closeSearch}
              onSearch={handleFind}
              onNextMatch={handleNextMatch}
              onPreviousMatch={handlePreviousMatch}
              onReplace={onSearchReplace}
              onReplaceAll={onSearchReplaceAll}
              currentMatch={searchActiveIndex}
              totalMatches={totalMatches}
            />
          )}
          {contentLoadingState ? (
            <EditorLoading />
          ) : currentContent ? (
            <div className="wn-editor-wrapper">
              <Editor
                initialContent={currentContent.body}
                onChange={handleContentChange}
                onImageUpload={(file) => handleImageUpload(file, "body")}
                basePath={api.basePath}
                collection={selectedCollection ?? undefined}
                contentId={selectedContentId ?? undefined}
                searchQuery={searchQuery}
                searchActiveIndex={searchActiveIndex}
              />
            </div>
          ) : (
            <EditorEmpty onNewContent={handleNewContentShortcut} />
          )}
        </main>

        {/* Right: Frontmatter Panel */}
        <FrontmatterForm
          isOpen={isFrontmatterOpen}
          onClose={() => setIsFrontmatterOpen(false)}
          frontmatter={currentContent?.frontmatter ?? null}
          schema={currentSchema}
          onChange={handleFrontmatterChange}
          onImageUpload={handleImageUpload}
          collection={selectedCollection ?? undefined}
          contentId={selectedContentId ?? undefined}
        />

        {/* Version History Panel */}
        <VersionHistoryPanel
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          collection={selectedCollection}
          contentId={selectedContentId}
          currentContent={currentContent?.body ?? ""}
          onRestore={handleVersionRestore}
        />
      </div>
    </div>
  );
}
