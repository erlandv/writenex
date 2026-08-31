/**
 * @fileoverview Collection and Singleton schema helpers
 *
 * These helpers provide a typed way to define collection and singleton
 * schemas using the fields builder API. They convert FieldDefinition
 * objects to internal SchemaField format.
 *
 * @module @writenex/astro/fields/collection
 */

import type { CollectionConfig, ImageConfig } from "@/types";
import { resolveFieldDefinition } from "./resolve";
import type { FieldDefinition } from "./types";

export interface CollectionSchemaConfig {
  name: string;
  path: string;
  filePattern?: string;
  previewUrl?: string;
  schema: Record<string, FieldDefinition>;
  images?: ImageConfig;
}

export interface SingletonSchemaConfig {
  name: string;
  path: string;
  previewUrl?: string;
  schema: Record<string, FieldDefinition>;
  images?: ImageConfig;
}

export function collection(config: CollectionSchemaConfig): CollectionConfig {
  const schema: Record<string, import("@/types").SchemaField> = {};
  for (const [key, fieldDef] of Object.entries(config.schema ?? {})) {
    schema[key] = resolveFieldDefinition(fieldDef);
  }

  return {
    name: config.name,
    path: config.path,
    filePattern: config.filePattern,
    previewUrl: config.previewUrl,
    schema,
    images: config.images,
  };
}

export function singleton(config: SingletonSchemaConfig): {
  name: string;
  path: string;
  previewUrl?: string;
  schema: Record<string, import("@/types").SchemaField>;
  images?: ImageConfig;
} {
  const schema: Record<string, import("@/types").SchemaField> = {};
  for (const [key, fieldDef] of Object.entries(config.schema ?? {})) {
    schema[key] = resolveFieldDefinition(fieldDef);
  }

  return {
    name: config.name,
    path: config.path,
    previewUrl: config.previewUrl,
    schema,
    images: config.images,
  };
}
