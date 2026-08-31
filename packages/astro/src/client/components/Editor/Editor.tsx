/**
 * @fileoverview MDXEditor wrapper component
 *
 * This component wraps MDXEditor with the necessary plugins and configuration
 * for the Writenex Astro integration. Includes diffSourcePlugin for viewing
 * source markdown and diff modes.
 *
 * @module @writenex/astro/client/components/Editor
 */

import {
  addComposerChild$,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
  editorSearchCursor$,
  editorSearchTerm$,
  frontmatterPlugin,
  headingsPlugin,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  type MDXEditorMethods,
  markdownShortcutPlugin,
  quotePlugin,
  searchPlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  usePublisher,
} from "@mdxeditor/editor";
import { FileText, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import "@mdxeditor/editor/style.css";
import "./Editor.css";
import { ImageDialog } from "./ImageDialog";
import { LinkDialog } from "./LinkDialog";

/**
 * Props for the Editor component
 */
interface EditorProps {
  /** Initial markdown content */
  initialContent: string;
  /** Callback when content changes */
  onChange: (markdown: string) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Handler for image uploads. Returns the image URL/path on success. */
  onImageUpload?: (file: File) => Promise<string | null>;
  /** Base path for API requests */
  basePath?: string;
  /** Current collection name (for image URL resolution) */
  collection?: string;
  /** Current content ID (for image URL resolution) */
  contentId?: string;
  /** Search query for highlighting */
  searchQuery?: string;
  /** Current search match index (1-based) */
  searchActiveIndex?: number;
}

/**
 * Module-level refs for sharing search state with SearchBridge inside MDXEditor.
 * This is necessary because SearchBridge is mounted via addComposerChild$ which
 * places it inside MDXEditor's internal tree, outside of React Context providers.
 */
const searchStateRef = {
  query: "",
  activeIndex: 0,
  listeners: new Set<() => void>(),
};

function setSearchState(query: string, activeIndex: number) {
  searchStateRef.query = query;
  searchStateRef.activeIndex = activeIndex;
  // Notify all listeners
  searchStateRef.listeners.forEach((listener) => listener());
}

function useSearchState() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    searchStateRef.listeners.add(listener);
    return () => {
      searchStateRef.listeners.delete(listener);
    };
  }, []);

  return {
    searchQuery: searchStateRef.query,
    searchActiveIndex: searchStateRef.activeIndex,
  };
}

/**
 * SearchBridge component that syncs search state with MDXEditor's searchPlugin.
 * Uses module-level state because it's mounted inside MDXEditor via addComposerChild$,
 * which is outside of React Context providers.
 */
function SearchBridge(): null {
  const { searchQuery, searchActiveIndex } = useSearchState();
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
}

/**
 * MDXEditor plugin that adds the SearchBridge component to the editor
 */
function createSearchBridgePlugin() {
  return {
    // biome-ignore lint/suspicious/noExplicitAny: third party type
    init: (realm: any) => {
      realm.pub(addComposerChild$, SearchBridge);
    },
  };
}

/**
 * Toolbar separator component
 */
const ToolbarSeparator = () => (
  <div
    style={{
      width: "1px",
      height: "24px",
      backgroundColor: "var(--wn-zinc-700)",
      margin: "0 4px",
    }}
  />
);

/**
 * Editor toolbar contents with DiffSourceToggleWrapper
 */
function EditorToolbarContents(): React.ReactElement {
  return (
    <DiffSourceToggleWrapper>
      {/* Undo/Redo */}
      <UndoRedo />
      <ToolbarSeparator />

      {/* Block Type */}
      <BlockTypeSelect />
      <ToolbarSeparator />

      {/* Text Formatting */}
      <BoldItalicUnderlineToggles />
      <CodeToggle />
      <ToolbarSeparator />

      {/* Lists */}
      <ListsToggle />
      <ToolbarSeparator />

      {/* Insert Link & Image */}
      <CreateLink />
      <InsertImage />
      <ToolbarSeparator />

      {/* Table & Thematic Break */}
      <InsertTable />
      <InsertThematicBreak />
      <ToolbarSeparator />

      {/* Code Block */}
      <InsertCodeBlock />
    </DiffSourceToggleWrapper>
  );
}

/**
 * MDXEditor wrapper with Writenex configuration
 *
 * Features:
 * - Full-width editor layout
 * - Dark mode styling
 * - diffSourcePlugin for source/diff view modes
 * - Comprehensive toolbar with formatting options
 *
 * @component
 * @example
 * ```tsx
 * <Editor
 *   initialContent={markdown}
 *   onChange={handleChange}
 *   placeholder="Start writing..."
 * />
 * ```
 */
export function Editor({
  initialContent,
  onChange,
  readOnly = false,
  placeholder = "Start writing...",
  onImageUpload,
  basePath = "/_writenex",
  collection,
  contentId,
  searchQuery = "",
  searchActiveIndex = 0,
}: EditorProps): React.ReactElement {
  const editorRef = useRef<MDXEditorMethods>(null);
  const [isReady, setIsReady] = useState(false);

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editorRef.current && isReady) {
      editorRef.current.setMarkdown(initialContent);
    }
  }, [initialContent, isReady]);

  // Mark editor as ready after initial mount
  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleChange = useCallback(
    (markdown: string) => {
      onChange(markdown);
    },
    [onChange]
  );

  // Update module-level search state when props change
  useEffect(() => {
    setSearchState(searchQuery, searchActiveIndex);
  }, [searchQuery, searchActiveIndex]);

  return (
    <div className="wn-editor">
      <div className="wn-editor-content">
        <div className="wn-editor-wrapper">
          <MDXEditor
            ref={editorRef}
            markdown={initialContent}
            onChange={handleChange}
            readOnly={readOnly}
            placeholder={placeholder}
            contentEditableClassName="prose prose-invert max-w-none focus:outline-none"
            onError={(error) => {
              console.error("[writenex] Editor error:", error);
            }}
            plugins={[
              // Basic formatting
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),

              // Frontmatter support
              frontmatterPlugin(),

              // Links and images
              linkPlugin(),
              linkDialogPlugin({
                LinkDialog: LinkDialog,
              }),
              imagePlugin({
                ImageDialog: ImageDialog,
                imageUploadHandler: async (file: File) => {
                  if (onImageUpload) {
                    const result = await onImageUpload(file);
                    if (result) {
                      return result;
                    }
                    // If upload failed, throw to prevent inserting broken image
                    throw new Error("Image upload failed");
                  }
                  // Fallback: return data URL if no upload handler provided
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                  });
                },
                imagePreviewHandler: (src: string) => {
                  // If it's already an absolute URL or data URL, return as-is
                  if (
                    src.startsWith("http://") ||
                    src.startsWith("https://") ||
                    src.startsWith("data:")
                  ) {
                    return Promise.resolve(src);
                  }

                  // Convert relative path to API URL for preview
                  if (collection && contentId && src.startsWith("./")) {
                    // Remove ./ prefix
                    const imagePath = src.slice(2);

                    // Check if imagePath already starts with contentId (flat file structure)
                    // e.g., "./post-example/image.webp" -> "post-example/image.webp"
                    // In this case, don't add contentId again to avoid double slug
                    if (imagePath.startsWith(`${contentId}/`)) {
                      const apiUrl = `${basePath}/api/images/${collection}/${imagePath}`;
                      return Promise.resolve(apiUrl);
                    }

                    // For folder-based structure, imagePath is just the filename
                    // e.g., "./image.webp" -> "image.webp"
                    const apiUrl = `${basePath}/api/images/${collection}/${contentId}/${imagePath}`;
                    return Promise.resolve(apiUrl);
                  }

                  // Fallback: return original src
                  return Promise.resolve(src);
                },
              }),

              // Tables
              tablePlugin(),

              // Code blocks
              codeBlockPlugin({ defaultCodeBlockLanguage: "typescript" }),
              codeMirrorPlugin({
                codeBlockLanguages: {
                  // Empty string fallback for unknown languages
                  "": "Custom",
                  // JavaScript family
                  js: "JavaScript",
                  javascript: "JavaScript",
                  ts: "TypeScript",
                  typescript: "TypeScript",
                  jsx: "JSX",
                  tsx: "TSX",
                  // Web languages
                  html: "HTML",
                  css: "CSS",
                  json: "JSON",
                  xml: "XML",
                  // Scripting & Shell
                  bash: "Bash",
                  shell: "Shell",
                  sh: "Shell",
                  zsh: "Zsh",
                  // Configuration
                  yaml: "YAML",
                  yml: "YAML",
                  dockerfile: "Dockerfile",
                  docker: "Dockerfile",
                  toml: "TOML",
                  ini: "INI",
                  env: "ENV",
                  // Systems programming
                  c: "C",
                  cpp: "C++",
                  csharp: "C#",
                  rust: "Rust",
                  go: "Go",
                  // JVM languages
                  java: "Java",
                  kotlin: "Kotlin",
                  scala: "Scala",
                  // Scripting languages
                  python: "Python",
                  py: "Python",
                  ruby: "Ruby",
                  rb: "Ruby",
                  php: "PHP",
                  perl: "Perl",
                  lua: "Lua",
                  r: "R",
                  // Mobile
                  swift: "Swift",
                  // Database
                  sql: "SQL",
                  graphql: "GraphQL",
                  // Markdown & Documentation
                  md: "Markdown",
                  markdown: "Markdown",
                  mdx: "MDX",
                  astro: "Astro",
                  // Diagrams
                  mermaid: "Mermaid",
                  // Plain text
                  txt: "Plain Text",
                  text: "Plain Text",
                  plaintext: "Plain Text",
                },
              }),

              // Diff source plugin for source/diff view modes
              diffSourcePlugin({
                viewMode: "rich-text",
              }),

              // Toolbar
              toolbarPlugin({
                toolbarContents: () => <EditorToolbarContents />,
              }),

              // Search plugin for highlighting matches (must be after toolbar)
              searchPlugin(),
              createSearchBridgePlugin(),
            ]}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading placeholder for editor
 */
export function EditorLoading(): React.ReactElement {
  return (
    <div className="wn-editor-loading" aria-busy="true" aria-live="polite">
      <div className="wn-editor-loading-spinner" />
      <span className="wn-editor-loading-text">Loading editor...</span>
    </div>
  );
}

/**
 * Props for EditorEmpty component
 */
interface EditorEmptyProps {
  /** Callback when new content button is clicked */
  onNewContent?: () => void;
}

/**
 * Empty state when no content is selected
 */
export function EditorEmpty({
  onNewContent,
}: EditorEmptyProps): React.ReactElement {
  return (
    <div className="wn-editor-empty">
      <div className="wn-editor-empty-icon">
        <FileText size={48} strokeWidth={1.5} />
      </div>
      <h2 className="wn-editor-empty-title">Select content to edit</h2>
      <p className="wn-editor-empty-text">
        Choose a collection and content item from the sidebar, or create new
        content.
      </p>
      <button className="wn-editor-empty-btn" onClick={onNewContent}>
        <Plus size={16} />
        New Content
      </button>
      <div className="wn-editor-empty-shortcuts">
        <span className="wn-editor-empty-shortcut">
          <kbd>Alt</kbd> + <kbd>N</kbd> New content
        </span>
        <span className="wn-editor-empty-shortcut">
          <kbd>Ctrl</kbd> + <kbd>/</kbd> Keyboard shortcuts
        </span>
      </div>
    </div>
  );
}
