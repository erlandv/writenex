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
import { Header } from "./components/Header";
import { FrontmatterForm } from "./components/FrontmatterForm";
import { Save, FileEdit, CheckCircle, Image, FolderOpen } from "lucide-react";
import type { CollectionSchema } from "../types";
import {
  useApi,
  useCollections,
  useContentList,
  useConfig,
  type ContentItem,
} from "./hooks/useApi";
import {
  useAutosave,
  formatLastSaved,
  type AutosaveStatus,
} from "./hooks/useAutosave";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ShortcutsHelpModal } from "./components/KeyboardShortcuts";

interface AppProps {
  basePath: string;
  apiBase: string;
}

function generatePreviewUrl(
  pattern: string,
  contentId: string,
  frontmatter: Record<string, unknown>
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
  return url;
}

function AutosaveIndicator({
  status,
  hasUnsavedChanges,
  lastSaved,
  enabled,
  onToggle,
}: {
  status: AutosaveStatus;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  enabled: boolean;
  onToggle: () => void;
}): React.ReactElement {
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

  return (
    <div className="wn-autosave-indicator">
      {text && (
        <span className={`wn-autosave-text ${statusClass}`}>{text}</span>
      )}
      <button
        className="wn-btn-icon"
        onClick={onToggle}
        title={enabled ? "Disable autosave" : "Enable autosave"}
        style={{
          width: "1.5rem",
          height: "1.5rem",
          color: enabled ? "var(--wn-emerald-500)" : "var(--wn-zinc-500)",
        }}
      >
        <Save size={14} style={{ opacity: enabled ? 1 : 0.5 }} />
      </button>
    </div>
  );
}

export function App({ apiBase }: AppProps): React.ReactElement {
  const api = useApi(apiBase);
  const { config, refresh: refreshConfig } = useConfig(apiBase);
  const imageStrategy = config?.images?.strategy ?? "colocated";

  const {
    collections,
    loading: collectionsLoading,
    refresh: refreshCollections,
  } = useCollections(apiBase);

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
  } = useContentList(apiBase, selectedCollection);

  const [currentContent, setCurrentContent] = useState<ContentItem | null>(
    null
  );
  const [contentLoadingState, setContentLoadingState] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFrontmatterOpen, setIsFrontmatterOpen] = useState(true);

  const contentRef = useRef<ContentItem | null>(null);
  contentRef.current = currentContent;

  const currentCollection = collections.find(
    (c) => c.name === selectedCollection
  );
  const currentSchema = currentCollection?.schema as
    | CollectionSchema
    | undefined;

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  useEffect(() => {
    if (selectedCollection && selectedContentId) {
      setContentLoadingState(true);
      api
        .getContent(selectedCollection, selectedContentId)
        .then((content) => {
          setCurrentContent(content);
          setHasUnsavedChanges(false);
        })
        .catch((err) => {
          console.error("Failed to load content:", err);
          setCurrentContent(null);
        })
        .finally(() => {
          setContentLoadingState(false);
        });
    } else {
      setCurrentContent(null);
    }
  }, [api, selectedCollection, selectedContentId]);

  const handleSelectCollection = useCallback((name: string) => {
    setSelectedCollection(name);
    setSelectedContentId(null);
    setCurrentContent(null);
  }, []);

  const handleSelectContent = useCallback(
    (id: string) => {
      if (hasUnsavedChanges) {
        const confirm = window.confirm(
          "You have unsaved changes. Discard and continue?"
        );
        if (!confirm) return;
      }
      setSelectedContentId(id);
    },
    [hasUnsavedChanges]
  );

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
    delay: 3000,
    enabled: autosaveEnabled && hasUnsavedChanges,
    onSave: performSave,
    onError: (err) => {
      console.error("Autosave failed:", err);
    },
  });

  useEffect(() => {
    if (contentChanged && autosaveEnabled) {
      triggerAutosave();
      setContentChanged(false);
    }
  }, [contentChanged, autosaveEnabled, triggerAutosave]);

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    await saveNowAutosave();
  }, [hasUnsavedChanges, saveNowAutosave]);

  const handleCreateContent = useCallback(async () => {
    if (!selectedCollection) return;

    const title = window.prompt("Enter title for new content:");
    if (!title) return;

    try {
      const result = await api.createContent(selectedCollection, {
        frontmatter: {
          title,
          pubDate: new Date().toISOString().split("T")[0],
          draft: true,
        },
        body: `# ${title}\n\nStart writing here...`,
      });

      if (result.success && result.id) {
        await refreshContent();
        setSelectedContentId(result.id);
      } else {
        alert(`Failed to create: ${result.error}`);
      }
    } catch (err) {
      alert(
        `Failed to create: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }, [api, selectedCollection, refreshContent]);

  const handlePreview = useCallback(() => {
    if (!currentCollection?.previewUrl || !selectedContentId || !currentContent)
      return;

    const url = generatePreviewUrl(
      currentCollection.previewUrl,
      selectedContentId,
      currentContent.frontmatter
    );
    window.open(url, "_blank");
  }, [currentCollection, selectedContentId, currentContent]);

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
        ctrl: true,
        handler: handleCreateContent,
        enabled: !!selectedCollection,
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
        key: "escape",
        label: "Close modal",
        keys: "Escape",
        handler: () => {},
      },
    ],
  });

  return (
    <div className="wn-app">
      {showHelp && (
        <ShortcutsHelpModal shortcuts={shortcuts} onClose={closeHelp} />
      )}

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
        onKeyboardShortcuts={toggleHelp}
        onSettings={() => setShowConfigPanel(true)}
      />

      {/* Secondary Header - Content Actions Bar */}
      {currentContent && (
        <div className="wn-content-bar">
          {/* Left: Content info and image strategy */}
          <div className="wn-content-bar-left">
            <span className="wn-content-bar-title">
              {String(currentContent.frontmatter.title ?? currentContent.id)}
            </span>
            <span
              className={`wn-content-bar-strategy wn-content-bar-strategy--${
                imageStrategy === "colocated"
                  ? "colocated"
                  : imageStrategy === "public"
                    ? "public"
                    : "custom"
              }`}
              title={`Image storage: ${imageStrategy}`}
            >
              {imageStrategy === "public" ? (
                <FolderOpen size={12} />
              ) : (
                <Image size={12} />
              )}
              {imageStrategy}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="wn-content-bar-right">
            <AutosaveIndicator
              status={autosaveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSaved={lastSaved}
              enabled={autosaveEnabled}
              onToggle={() => setAutosaveEnabled(!autosaveEnabled)}
            />
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
              style={{ fontSize: "0.75rem" }}
            >
              {currentContent.frontmatter.draft ? (
                <>
                  <FileEdit size={12} /> Draft
                </>
              ) : (
                <>
                  <CheckCircle size={12} /> Published
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
                    currentContent.frontmatter
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wn-btn-secondary"
                  style={{ fontSize: "0.75rem" }}
                >
                  Preview
                </a>
              )}
            <button
              className="wn-btn-primary"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              style={{ fontSize: "0.75rem" }}
            >
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
          onCreateContent={handleCreateContent}
          onRefreshCollections={refreshCollections}
          onRefreshContent={refreshContent}
        />

        {/* Center: Editor */}
        <main className="wn-main-content">
          {contentLoadingState ? (
            <EditorLoading />
          ) : currentContent ? (
            <div className="wn-editor-wrapper">
              <Editor
                initialContent={currentContent.body}
                onChange={handleContentChange}
                onImageUpload={(file) => handleImageUpload(file, "body")}
              />
            </div>
          ) : (
            <EditorEmpty />
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
        />
      </div>
    </div>
  );
}
