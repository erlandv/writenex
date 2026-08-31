/**
 * @fileoverview Type definitions barrel file for @writenex/astro
 *
 * This file re-exports all type definitions from domain-specific files
 * to provide a single import point for types.
 *
 * @module @writenex/astro/types
 */

// API response types
export type {
  CollectionsResponse,
  ContentListResponse,
  ContentResponse,
  ImageUploadResponse,
  MutationResponse,
} from "./api";
// Configuration types
export type {
  CollectionConfig,
  CollectionSchema,
  DiscoveryConfig,
  EditorConfig,
  FieldKind,
  FieldType,
  ImageConfig,
  ImageStrategy,
  RemoteCmsConfig,
  ResolvedConfig,
  ResolvedRemoteCmsConfig,
  SchemaField,
  SingletonConfig,
  ValidationOptions,
  WritenexConfig,
  WritenexOptions,
} from "./config";
// Content types
export type {
  ContentItem,
  ContentSummary,
  DiscoveredCollection,
} from "./content";
// Image types
export type {
  DiscoveredImage,
  ImageDiscoveryOptions,
  ImageDiscoveryResult,
} from "./image";
// Version history types
export type {
  RestoreResult,
  RestoreVersionOptions,
  SaveVersionOptions,
  Version,
  VersionEntry,
  VersionHistoryConfig,
  VersionManifest,
  VersionResult,
} from "./version";
