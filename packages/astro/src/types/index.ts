/**
 * @fileoverview Type definitions barrel file for @writenex/astro
 *
 * This file re-exports all type definitions from domain-specific files
 * to provide a single import point for types.
 *
 * @module @writenex/astro/types
 */

// Configuration types
export type {
  FieldType,
  SchemaField,
  CollectionSchema,
  ImageStrategy,
  ImageConfig,
  CollectionConfig,
  DiscoveryConfig,
  EditorConfig,
  WritenexConfig,
  WritenexOptions,
  ResolvedConfig,
} from "./config";

// Content types
export type {
  ContentItem,
  ContentSummary,
  DiscoveredCollection,
} from "./content";

// API response types
export type {
  CollectionsResponse,
  ContentListResponse,
  ContentResponse,
  MutationResponse,
  ImageUploadResponse,
} from "./api";

// Version history types
export type {
  VersionEntry,
  VersionManifest,
  Version,
  VersionHistoryConfig,
  VersionResult,
  SaveVersionOptions,
  RestoreVersionOptions,
  RestoreResult,
} from "./version";

// Image types
export type {
  DiscoveredImage,
  ImageDiscoveryOptions,
  ImageDiscoveryResult,
} from "./image";
