/**
 * @fileoverview MDXEditor wrapper component
 *
 * This component wraps MDXEditor with the necessary plugins and configuration
 * for the Writenex Astro integration. Includes diffSourcePlugin for viewing
 * source markdown and diff modes.
 *
 * @module @writenex/astro/client/components/Editor
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  ListsToggle,
  UndoRedo,
  CodeToggle,
  InsertThematicBreak,
  InsertCodeBlock,
  DiffSourceToggleWrapper,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import "./Editor.css";

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
              linkDialogPlugin(),
              imagePlugin({
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
              }),

              // Tables
              tablePlugin(),

              // Code blocks
              codeBlockPlugin({ defaultCodeBlockLanguage: "typescript" }),
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
                  md: "Markdown",
                  markdown: "Markdown",
                  bash: "Bash",
                  shell: "Shell",
                  python: "Python",
                  rust: "Rust",
                  go: "Go",
                  yaml: "YAML",
                  sql: "SQL",
                  astro: "Astro",
                  mdx: "MDX",
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
    <div className="wn-editor-loading">
      <div className="wn-editor-loading-spinner" />
      <span className="wn-editor-loading-text">Loading editor...</span>
    </div>
  );
}

/**
 * Empty state when no content is selected
 */
export function EditorEmpty(): React.ReactElement {
  return (
    <div className="wn-editor-empty">
      <div className="wn-editor-empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <h2 className="wn-editor-empty-title">Select content to edit</h2>
      <p className="wn-editor-empty-text">
        Choose a collection and content item from the sidebar, or create new
        content.
      </p>
    </div>
  );
}
