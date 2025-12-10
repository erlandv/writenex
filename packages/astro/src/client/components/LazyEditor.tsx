/**
 * @fileoverview Lazy-loaded Editor component
 *
 * This module provides a lazy-loaded version of the MDXEditor component
 * to improve initial bundle size and load time. The actual editor is
 * loaded on-demand when the component mounts.
 *
 * @module @writenex/astro/client/components/LazyEditor
 */

import { lazy, Suspense, memo } from "react";
import { EditorLoading } from "./Editor/Editor";

/**
 * Props for LazyEditor - same as Editor
 */
interface LazyEditorProps {
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
 * Lazy-loaded Editor component
 *
 * Uses React.lazy to defer loading the MDXEditor bundle until needed.
 */
const LazyEditorComponent = lazy(() =>
  import("./Editor/Editor").then((mod) => ({ default: mod.Editor }))
);

/**
 * Editor wrapper with Suspense fallback
 *
 * This component wraps the lazy-loaded Editor with a Suspense boundary
 * that shows a loading indicator while the editor bundle loads.
 *
 * @example
 * ```tsx
 * <LazyEditor
 *   initialContent={markdown}
 *   onChange={handleChange}
 *   placeholder="Start writing..."
 * />
 * ```
 */
export const LazyEditor = memo(function LazyEditor(
  props: LazyEditorProps
): React.ReactElement {
  return (
    <Suspense fallback={<EditorLoading />}>
      <LazyEditorComponent {...props} />
    </Suspense>
  );
});

// Re-export EditorEmpty and EditorLoading for convenience
export { EditorEmpty, EditorLoading } from "./Editor/Editor";
