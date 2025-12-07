/**
 * @fileoverview Type definitions barrel file
 *
 * Central export point for all TypeScript type definitions.
 * Import types from `@/types` instead of individual files.
 *
 * @module types
 *
 * @example
 * ```ts
 * import type { DocumentEntry, EditorState, ViewMode } from "@/types";
 * ```
 */

// =============================================================================
// TYPES INDEX - Re-export all types for convenient imports
// =============================================================================

/** Document and database types */
export * from "./document";

/** Editor state and UI types */
export * from "./editor";
