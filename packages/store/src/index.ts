/**
 * @fileoverview Barrel export for @writenex/store package
 *
 * This module exports all state management utilities from the package.
 *
 * @module store
 */

// Types
export type {
  ViewMode,
  SaveStatus,
  Theme,
  SyntaxTheme,
  DocumentMeta,
  EditorState,
} from "./types";

// Store and selectors
export { useEditorStore, getActiveDocument } from "./editorStore";
