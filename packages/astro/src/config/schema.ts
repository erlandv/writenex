/**
 * @fileoverview Configuration schema and validation for @writenex/astro
 *
 * This module provides Zod schemas for validating Writenex configuration
 * and a helper function for defining type-safe configurations.
 *
 * @module @writenex/astro/config/schema
 */

import { z } from "zod";
import type { WritenexConfig } from "@/types";

/**
 * Schema for field type definitions
 */
const fieldTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "date",
  "array",
  "image",
  "object",
]);

/**
 * Schema for individual schema field definition
 */
const schemaFieldSchema = z.object({
  type: fieldTypeSchema,
  required: z.boolean().optional(),
  default: z.unknown().optional(),
  items: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Schema for collection schema (record of field definitions)
 */
const collectionSchemaSchema = z.record(z.string(), schemaFieldSchema);

/**
 * Schema for image strategy
 */
const imageStrategySchema = z.enum(["colocated", "public", "custom"]);

/**
 * Schema for image configuration
 */
const imageConfigSchema = z.object({
  strategy: imageStrategySchema,
  publicPath: z.string().optional(),
  storagePath: z.string().optional(),
});

/**
 * Schema for collection configuration
 */
const collectionConfigSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  path: z.string().min(1, "Collection path is required"),
  filePattern: z.string().optional(),
  previewUrl: z.string().optional(),
  schema: collectionSchemaSchema.optional(),
  images: imageConfigSchema.optional(),
});

/**
 * Schema for discovery configuration
 */
const discoveryConfigSchema = z.object({
  enabled: z.boolean(),
  ignore: z.array(z.string()).optional(),
});

/**
 * Schema for editor configuration
 */
const editorConfigSchema = z.object({
  autosave: z.boolean().optional(),
  autosaveInterval: z.number().positive().optional(),
});

/**
 * Schema for version history configuration
 */
const versionHistoryConfigSchema = z.object({
  enabled: z.boolean().optional(),
  maxVersions: z.number().int().positive().optional(),
  storagePath: z.string().optional(),
});

/**
 * Main Writenex configuration schema
 */
export const writenexConfigSchema = z.object({
  collections: z.array(collectionConfigSchema).optional(),
  images: imageConfigSchema.optional(),
  editor: editorConfigSchema.optional(),
  discovery: discoveryConfigSchema.optional(),
  versionHistory: versionHistoryConfigSchema.optional(),
});

/**
 * Schema for integration options
 */
export const writenexOptionsSchema = z.object({
  allowProduction: z.boolean().optional(),
});

/**
 * Helper function for defining type-safe Writenex configuration.
 *
 * This function provides IDE autocompletion and type checking for
 * the configuration object. It's the recommended way to create
 * a writenex.config.ts file.
 *
 * @param config - The Writenex configuration object
 * @returns The same configuration object (identity function for type safety)
 *
 * @example
 * ```typescript
 * // writenex.config.ts
 * import { defineConfig } from '@writenex/astro';
 *
 * export default defineConfig({
 *   collections: [
 *     {
 *       name: 'blog',
 *       path: 'src/content/blog',
 *       filePattern: '{slug}.md',
 *     },
 *   ],
 * });
 * ```
 */
export function defineConfig(config: WritenexConfig): WritenexConfig {
  // Validate the configuration
  const result = writenexConfigSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    console.warn(`[writenex] Invalid configuration:\n${errors}`);
  }

  return config;
}

/**
 * Validate a Writenex configuration object
 *
 * @param config - The configuration to validate
 * @returns Validation result with success status and parsed data or errors
 */
export function validateConfig(
  config: unknown
): z.SafeParseReturnType<unknown, WritenexConfig> {
  return writenexConfigSchema.safeParse(config);
}
