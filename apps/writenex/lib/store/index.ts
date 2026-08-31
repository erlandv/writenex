/**
 * @fileoverview Barrel export for store module
 * @module lib/store
 */

export { getActiveDocument, useEditorStore } from "./editor-store";
export type {
  DocumentMeta,
  EditorState,
  SaveStatus,
  SyntaxTheme,
  Theme,
  ViewMode,
} from "./types";
