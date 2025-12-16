/**
 * @fileoverview Content and collection type definitions for @writenex/astro
 *
 * This file contains all TypeScript type definitions related to content items,
 * content summaries, and discovered collections.
 *
 * @module @writenex/astro/types/content
 */

import type { CollectionSchema } from "./config";

/**
 * Parsed content item with frontmatter and body
 */
export interface ContentItem {
  /** Unique identifier (typically the slug) */
  id: string;
  /** Filesystem path to the content file */
  path: string;
  /** Parsed frontmatter data */
  frontmatter: Record<string, unknown>;
  /** Markdown body content */
  body: string;
  /** Raw file content (frontmatter + body) */
  raw: string;
  /** File modification time in milliseconds (for conflict detection) */
  mtime?: number;
}

/**
 * Content item summary for listing
 */
export interface ContentSummary {
  /** Unique identifier */
  id: string;
  /** Filesystem path */
  path: string;
  /** Title from frontmatter */
  title: string;
  /** Publication date */
  pubDate?: string;
  /** Draft status */
  draft?: boolean;
  /** Content excerpt */
  excerpt?: string;
}

/**
 * Discovered collection with metadata
 */
export interface DiscoveredCollection {
  /** Collection name */
  name: string;
  /** Filesystem path */
  path: string;
  /** Detected file pattern */
  filePattern: string;
  /** Number of content files */
  count: number;
  /** Detected/configured schema */
  schema?: CollectionSchema;
  /** URL pattern for preview links */
  previewUrl?: string;
}
