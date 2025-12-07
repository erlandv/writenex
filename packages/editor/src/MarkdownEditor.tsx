/**
 * @fileoverview Main Markdown Editor Component
 *
 * This is the central component of the Writenex application. It integrates
 * MDXEditor with custom plugins, manages document state, and coordinates
 * all editor features including search, version history, and recovery.
 *
 * ## Architecture:
 * - **MDXEditor**: Core WYSIWYG markdown editor with extensive plugin system
 * - **Zustand Store**: Global state for content, UI, and document management
 * - **IndexedDB**: Persistence for documents, versions, images, and settings
 * - **Custom Hooks**: useAutoSave, useDocumentInit, useKeyboardShortcuts
 *
 * ## Features:
 * - Multi-document support with tabs
 * - WYSIWYG editing with markdown shortcuts
 * - Three view modes: edit, split (diff), source
 * - Local image upload with IndexedDB storage
 * - Auto-save with version history
 * - Working copy recovery system
 * - Search and replace with regex support
 * - Code block syntax highlighting
 * - Read-only mode with visual indicator
 * - Focus mode for distraction-free writing
 *
 * ## Plugin System:
 * Uses MDXEditor's plugin architecture with custom additions:
 * - searchBridgePlugin: Syncs search state between store and editor
 * - shortcutsPlugin: Adds custom keyboard shortcuts via EditorShortcuts
 * - Custom ImageDialog and LinkDialog components
 *
 * @module components/editor/MarkdownEditor
 * @see {@link useEditorStore} - Global state management
 * @see {@link useAutoSave} - Auto-save and version creation
 * @see {@link useKeyboardShortcuts} - Global keyboard shortcuts
 * @see {@link useDocumentInit} - Document initialization
 */

"use client";

import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  markdownShortcutPlugin,
  frontmatterPlugin,
  diffSourcePlugin,
  type MDXEditorMethods,
  // Toolbar components for formatting
  BoldItalicUnderlineToggles,
  UndoRedo,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  InsertFrontmatter,
  ListsToggle,
  CodeToggle,
  StrikeThroughSupSubToggles,
  DiffSourceToggleWrapper,
  searchPlugin,
  editorSearchTerm$,
  editorSearchCursor$,
  usePublisher,
  addComposerChild$,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
// Import theme customizations AFTER MDXEditor styles to ensure our overrides take precedence
import "@/styles/vendor/mdxeditor/theme.css";
// Toolbar components
import { StatusBar, DocumentTabs } from "./toolbar";
// Dialog components
import {
  ClearEditorDialog,
  DeleteDocumentDialog,
  ImageDialog,
  KeyboardShortcutsModal,
  LinkDialog,
  WelcomeTourModal,
} from "./dialogs";
// Panel components
import {
  SearchReplacePanel,
  TocPanel,
  VersionHistoryPanel,
  type SearchOptions,
} from "./panels";
// Indicator components
import { BackupReminder, StorageWarning } from "./indicators";
import { useEditorStore } from "@writenex/store";
import { useAutoSave } from "@writenex/hooks";
import {
  useDocumentInit,
  useActiveDocumentPersistence,
} from "@writenex/hooks";
import { useKeyboardShortcuts } from "@writenex/hooks";
import { cn } from "@writenex/utils";
import { EDITOR_PLACEHOLDER } from "@writenex/utils";
import { saveImage, getImage } from "@writenex/db";
import { EditorShortcuts } from "./EditorShortcuts";

/**
 * Visual separator for the MDXEditor toolbar.
 *
 * @component
 * @returns Separator div element
 */
const CustomSeparator = () => (
  <div className="mx-1.5 h-6 w-px bg-zinc-200 dark:bg-white/10" />
);

/**
 * MDXEditor toolbar contents component.
 *
 * Contains all formatting tools organized into logical groups:
 * - Undo/Redo
 * - Block type selector (headings, paragraphs)
 * - Text formatting (bold, italic, underline, code, strikethrough)
 * - Lists (ordered, unordered, checklist)
 * - Insert elements (link, image, table, hr, code block, frontmatter)
 *
 * Note: Utility tools (search, history, theme) are in the Header component.
 *
 * @component
 * @returns Toolbar contents wrapped in DiffSourceToggleWrapper
 */
function EditorToolbarContents(): React.ReactElement {
  return (
    <DiffSourceToggleWrapper>
      {/* 1. Undo/Redo */}
      <UndoRedo />
      <CustomSeparator />

      {/* 2. Block Type */}
      <BlockTypeSelect />
      <CustomSeparator />

      {/* 3. Text Formatting */}
      <BoldItalicUnderlineToggles />
      <CodeToggle />
      <StrikeThroughSupSubToggles />
      <CustomSeparator />

      {/* 4. Lists */}
      <ListsToggle />
      <CustomSeparator />

      {/* 5. Insert Link & Image */}
      <CreateLink />
      <InsertImage />
      <CustomSeparator />

      {/* 6. Table & Thematic Break */}
      <InsertTable />
      <InsertThematicBreak />
      <CustomSeparator />

      {/* 7. Code Block & Frontmatter */}
      <InsertCodeBlock />
      <InsertFrontmatter />
    </DiffSourceToggleWrapper>
  );
}

// Simple diff viewer component using react-diff-viewer-continued
const DiffViewer = dynamic(
  () => import("react-diff-viewer-continued").then((mod) => mod.default),
  { ssr: false }
);

/**
 * Bridge component to sync search state between Zustand store and MDXEditor.
 *
 * This component is added to the editor via addComposerChild$ and updates
 * the editor's internal search state when the store values change.
 *
 * @component
 * @returns null - This is a headless component
 */
const SearchBridge = () => {
  const { searchQuery, searchActiveIndex } = useEditorStore();
  const updateSearch = usePublisher(editorSearchTerm$);
  const updateCursor = usePublisher(editorSearchCursor$);

  useEffect(() => {
    updateSearch(searchQuery);
  }, [searchQuery, updateSearch]);

  useEffect(() => {
    if (searchActiveIndex > 0) {
      updateCursor(searchActiveIndex);
    }
  }, [searchActiveIndex, updateCursor]);

  return null;
};

/**
 * MDXEditor plugin that adds the SearchBridge component to the editor.
 *
 * @returns Plugin configuration object
 */
const searchBridgePlugin = () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init: (realm: any) => {
      realm.pub(addComposerChild$, SearchBridge);
    },
  };
};

/**
 * MDXEditor plugin that adds custom keyboard shortcuts via EditorShortcuts.
 *
 * @returns Plugin configuration object
 */
const shortcutsPlugin = () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init: (realm: any) => {
      realm.pub(addComposerChild$, EditorShortcuts);
    },
  };
};

/**
 * Main Markdown Editor component.
 *
 * This is the primary editing interface of the application. It renders:
 * - Document tabs for multi-document management
 * - Read-only mode banner (when active)
 * - Search and replace panel
 * - Diff view modal (for version comparison)
 * - MDXEditor with all plugins
 * - Version history sidebar panel
 * - Status bar
 * - Various modal dialogs (clear, shortcuts, recovery, delete document)
 *
 * ## State Management:
 * All state flows through Zustand store (useEditorStore). The component
 * uses several custom hooks for specific functionality:
 * - useDocumentInit: Load documents on startup
 * - useAutoSave: Auto-save to IndexedDB
 * - useKeyboardShortcuts: Global keyboard handlers
 *
 * ## Content Flow:
 * 1. User types → MDXEditor onChange → setContent()
 * 2. Content updates → useAutoSave triggers
 * 3. Auto-save creates working copy in IndexedDB
 * 4. Periodic version snapshots created
 *
 * @component
 * @example
 * ```tsx
 * // Used in page.tsx
 * function EditorPage() {
 *   return (
 *     <div className="flex flex-col h-screen">
 *       <Header />
 *       <MarkdownEditor />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns The complete editor interface
 *
 * @see {@link Header} - Application header with file/view controls
 * @see {@link DocumentTabs} - Multi-document tab bar
 * @see {@link StatusBar} - Bottom status bar
 */
export function MarkdownEditor(): React.ReactElement {
  const editorRef = useRef<MDXEditorMethods>(null);
  const {
    content,
    setContent,
    isReadOnly,
    setReadOnly,
    viewMode,
    theme,
    searchQuery,
    setSearchQuery,
    searchActiveIndex,
    setSearchActiveIndex,
    activeDocumentId,
    isInitialized,
    isFocusMode,
    hasSeenOnboarding,
    openOnboarding,
    hasHydrated,
  } = useEditorStore();

  // State for search
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  // const [currentMatchIndex, setCurrentMatchIndex] = useState(0); // Replaced by searchActiveIndex in store

  // State for diff view
  const [showDiff, setShowDiff] = useState(false);
  const [diffOldContent, setDiffOldContent] = useState("");
  const [diffNewContent, setDiffNewContent] = useState("");

  // Callback to update editor when document is loaded
  const handleDocumentLoaded = useCallback((loadedContent: string) => {
    if (editorRef.current) {
      editorRef.current.setMarkdown(loadedContent);
    }
  }, []);

  // Initialize documents on app startup
  useDocumentInit(handleDocumentLoaded);

  // Persist active document ID changes
  useActiveDocumentPersistence();

  // Auto-save hook
  useAutoSave();

  // Keyboard shortcuts hook
  useKeyboardShortcuts({ editorRef });

  // Auto-open onboarding for first-time users
  // Must wait for both: hydration (localStorage loaded) AND initialization (IndexedDB ready)
  useEffect(() => {
    if (hasHydrated && isInitialized && !hasSeenOnboarding) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        openOnboarding();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated, isInitialized, hasSeenOnboarding, openOnboarding]);

  // Sync MDXEditor when activeDocumentId changes (document switch)
  // This is needed because MDXEditor doesn't auto-sync with external content changes
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      activeDocumentId &&
      activeDocumentId !== prevDocIdRef.current &&
      editorRef.current
    ) {
      // Document changed, sync editor with new content
      editorRef.current.setMarkdown(content);
      prevDocIdRef.current = activeDocumentId;
    }
  }, [activeDocumentId, content]);

  // Handle content change
  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!isReadOnly) {
        setContent(newContent);
      }
    },
    [isReadOnly, setContent]
  );

  // Handle clear editor
  const handleClear = useCallback(() => {
    setContent("");
    if (editorRef.current) {
      editorRef.current.setMarkdown("");
    }
  }, [setContent]);

  // Handle version restore
  const handleRestore = useCallback(
    (restoredContent: string) => {
      if (isReadOnly) {
        setReadOnly(false);
      }
      setContent(restoredContent);
      if (editorRef.current) {
        editorRef.current.setMarkdown(restoredContent);
      }
    },
    [isReadOnly, setReadOnly, setContent]
  );

  // Handle version compare
  const handleCompare = useCallback(
    (oldContent: string, newContent: string) => {
      setDiffOldContent(oldContent);
      setDiffNewContent(newContent);
      setShowDiff(true);
    },
    []
  );

  // Search functionality
  const handleFind = useCallback(
    (query: string, options: SearchOptions): number => {
      setSearchQuery(query);
      if (!query) {
        setSearchMatches([]);
        setSearchActiveIndex(0);
        return 0;
      }

      let pattern: RegExp;
      try {
        let regexPattern = options.regex
          ? query
          : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (options.wholeWord) {
          regexPattern = `\\b${regexPattern}\\b`;
        }
        pattern = new RegExp(regexPattern, options.caseSensitive ? "g" : "gi");
      } catch {
        // Invalid regex
        setSearchMatches([]);
        return 0;
      }

      const matches: number[] = [];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        matches.push(match.index);
      }

      setSearchMatches(matches);
      setSearchActiveIndex(matches.length > 0 ? 1 : 0);
      return matches.length;
    },
    [content, setSearchActiveIndex, setSearchQuery]
  );

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setSearchActiveIndex(
      searchActiveIndex >= searchMatches.length ? 1 : searchActiveIndex + 1
    );
  }, [searchMatches.length, searchActiveIndex, setSearchActiveIndex]);

  const handlePreviousMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setSearchActiveIndex(
      searchActiveIndex <= 1 ? searchMatches.length : searchActiveIndex - 1
    );
  }, [searchMatches.length, searchActiveIndex, setSearchActiveIndex]);

  const handleReplace = useCallback(
    (replacement: string) => {
      if (isReadOnly || searchMatches.length === 0) return;

      const matchIndex = searchMatches[searchActiveIndex - 1];
      if (matchIndex === undefined) return;

      const beforeMatch = content.substring(0, matchIndex);
      const afterMatch = content.substring(matchIndex + searchQuery.length);
      const newContent = beforeMatch + replacement + afterMatch;

      setContent(newContent);
      if (editorRef.current) {
        editorRef.current.setMarkdown(newContent);
      }
    },
    [
      isReadOnly,
      searchMatches,
      searchActiveIndex,
      searchQuery,
      content,
      setContent,
    ]
  );

  const handleReplaceAll = useCallback(
    (replacement: string): number => {
      if (isReadOnly) return 0;

      let newContent = content;
      let count = 0;
      searchMatches.reverse().forEach((index) => {
        newContent =
          newContent.substring(0, index) +
          replacement +
          newContent.substring(index + searchQuery.length);
        count++;
      });

      setContent(newContent);
      if (editorRef.current) {
        editorRef.current.setMarkdown(newContent);
      }

      setSearchMatches([]);
      setSearchActiveIndex(0);
      return count;
    },
    [
      isReadOnly,
      content,
      searchMatches,
      searchQuery,
      setContent,
      setSearchActiveIndex,
    ]
  );

  // Image handlers
  const handleImageUpload = useCallback(async (image: File) => {
    const id = await saveImage(image, image.name, image.type);
    return `idb://${id}`;
  }, []);

  const handleImagePreview = useCallback(async (imageSource: string) => {
    if (imageSource.startsWith("idb://")) {
      const id = parseInt(imageSource.replace("idb://", ""), 10);
      if (!isNaN(id)) {
        const image = await getImage(id);
        if (image) {
          return URL.createObjectURL(image.blob);
        }
      }
    }
    return imageSource;
  }, []);

  // MDXEditor plugins
  const plugins = useMemo(
    () => [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      linkPlugin(),
      linkDialogPlugin({
        LinkDialog: LinkDialog,
      }),
      imagePlugin({
        imageUploadHandler: handleImageUpload,
        imagePreviewHandler: handleImagePreview,
        ImageDialog: ImageDialog,
      }),
      tablePlugin(),
      codeBlockPlugin({ defaultCodeBlockLanguage: "javascript" }),
      codeMirrorPlugin({
        codeBlockLanguages: {
          js: "JavaScript",
          javascript: "JavaScript",
          ts: "TypeScript",
          typescript: "TypeScript",
          jsx: "JSX",
          tsx: "TSX",
          css: "CSS",
          html: "HTML",
          json: "JSON",
          python: "Python",
          rust: "Rust",
          go: "Go",
          bash: "Bash",
          shell: "Shell",
          sql: "SQL",
          yaml: "YAML",
          markdown: "Markdown",
          text: "Plain Text",
        },
      }),
      markdownShortcutPlugin(),
      frontmatterPlugin(),
      diffSourcePlugin({
        viewMode:
          viewMode === "source"
            ? "source"
            : viewMode === "split"
              ? "diff"
              : "rich-text",
      }),
      toolbarPlugin({
        toolbarContents: () => <EditorToolbarContents />,
      }),
      searchPlugin(),
      searchBridgePlugin(),
      shortcutsPlugin(),
    ],
    [viewMode, handleImageUpload, handleImagePreview]
  );

  return (
    <div
      className={cn(
        "relative flex h-full flex-col",
        isFocusMode && "focus-mode"
      )}
    >
      {/* MDXEditor Search Highlights - using style tag */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::highlight(MdxSearch) {
          background-color: #fef08a;
        }

        ::highlight(MdxFocusSearch) {
          background-color: #f97316;
          color: #ffffff;
        }

        .dark ::highlight(MdxSearch) {
          background-color: rgba(253, 224, 71, 0.25);
        }
        .dark ::highlight(MdxFocusSearch) {
          background-color: #fde047; /* yellow-300 */
          color: #000000;
        }

        /* Link styling in editor */
        .mdxeditor a {
          color: #335dff; /* Brand Blue */
          text-decoration: underline;
          cursor: pointer;
        }

        /* Ensure dark mode link color overrides prose defaults */
        .dark .mdxeditor a,
        .dark .mdxeditor a * {
          color: #5c7cff !important; /* Lighter Brand Blue */
        }

        /* Dark mode toolbar background - ensure solid color */
        .dark .mdxeditor [role="toolbar"] {
          background-color: #27272a !important;
        }

        /* Make toolbar scrollable on mobile */
        @media (max-width: 768px) {
          .mdxeditor [role="toolbar"] {
            overflow-x: auto;
            max-width: 100%;
            flex-wrap: nowrap;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
            padding-bottom: 4px; /* Prevent scrollbar overlapping content if visible */
          }
          .mdxeditor [role="toolbar"]::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }
        }

        /* Focus Mode: Hide MDXEditor toolbar */
        .focus-mode .mdxeditor [role="toolbar"] {
          display: none !important;
        }
      ` }} />

      {/* Document Tabs - hidden in Focus Mode */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isFocusMode ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
        )}
      >
        {isInitialized && <DocumentTabs />}
      </div>

      {/* Read-only banner - hidden in Focus Mode */}
      {isReadOnly && !isFocusMode && (
        <div
          className="flex flex-col gap-1 border-y border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 dark:border-amber-800 dark:bg-amber-900/20"
          role="alert"
          aria-live="polite"
        >
          <span className="text-xs text-amber-700 sm:text-sm dark:text-amber-300">
            You are viewing this document in read-only mode
          </span>
          <button
            onClick={() => setReadOnly(false)}
            className="shrink-0 cursor-pointer self-start rounded text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline focus:ring-2 focus:ring-amber-500 focus:outline-none sm:self-auto sm:text-sm dark:text-amber-400 dark:hover:text-amber-200"
          >
            Enable Editing
          </button>
        </div>
      )}

      {/* Storage Warning Banner - hidden in Focus Mode */}
      {!isFocusMode && <StorageWarning />}

      {/* Backup Reminder Banner - hidden in Focus Mode */}
      {!isFocusMode && <BackupReminder />}

      {/* Main Content Area (ToC + Editor + Version History) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Table of Contents Panel (Left) */}
        <TocPanel />

        {/* Editor Column */}
        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out",
            isReadOnly && "cursor-not-allowed"
          )}
        >
          {/* Search Panel */}
          <SearchReplacePanel
            onFind={handleFind}
            onNextMatch={handleNextMatch}
            onPreviousMatch={handlePreviousMatch}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            currentMatch={searchActiveIndex}
            totalMatches={searchMatches.length}
          />

          {/* Diff View Modal */}
          {showDiff && (
            <div className="absolute inset-0 z-30 overflow-auto bg-white dark:bg-zinc-900">
              <div className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Compare Versions
                </h3>
                <button
                  onClick={() => setShowDiff(false)}
                  className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                >
                  Close
                </button>
              </div>
              <DiffViewer
                oldValue={diffOldContent}
                newValue={diffNewContent}
                splitView
                useDarkTheme={theme === "dark"}
              />
            </div>
          )}

          {/* MDXEditor Container */}
          <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900">
            <div
              className={cn(
                "h-full p-2 sm:p-4",
                isReadOnly && "pointer-events-none select-text"
              )}
            >
              <MDXEditor
                ref={editorRef}
                className="mdxeditor"
                markdown={content}
                onChange={handleContentChange}
                readOnly={isReadOnly}
                plugins={plugins}
                placeholder={
                  <span className="editor-placeholder text-zinc-400 italic">
                    {EDITOR_PLACEHOLDER}
                  </span>
                }
                contentEditableClassName={cn(
                  "min-h-[500px] focus:outline-none text-zinc-800 dark:text-zinc-200 prose max-w-none",
                  isReadOnly && "cursor-default"
                )}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <VersionHistoryPanel
          onRestore={handleRestore}
          onCompare={handleCompare}
        />
      </div>

      {/* Status Bar - hidden in Focus Mode */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isFocusMode ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        )}
      >
        <StatusBar />
      </div>

      {/* Modals */}
      <ClearEditorDialog onClear={handleClear} />
      <KeyboardShortcutsModal />
      <DeleteDocumentDialog onSwitchDocument={handleDocumentLoaded} />
      <WelcomeTourModal />
    </div>
  );
}
