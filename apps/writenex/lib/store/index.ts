/**
 * @fileoverview Barrel export for store module
 * @module lib/store
 */

export type {
  ViewMode,
  SaveStatus,
  Theme,
  SyntaxTheme,
  DocumentMeta,
  EditorState,
} from "./types";

export { useEditorStore, getActiveDocument } from "./editor-store";
