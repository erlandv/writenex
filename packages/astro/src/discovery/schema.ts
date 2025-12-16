/**
 * @fileoverview Schema auto-detection for content collections
 *
 * This module analyzes frontmatter from sample content files to automatically
 * infer the schema (field types, required status, enums, etc.).
 *
 * ## Detection Process:
 * 1. Read sample files from the collection (up to 20)
 * 2. Parse frontmatter from each file
 * 3. Analyze field patterns across all samples
 * 4. Infer field types and constraints
 * 5. Generate schema definition
 *
 * ## Detected Types:
 * - string: Plain text values
 * - number: Numeric values
 * - boolean: True/false values
 * - date: ISO date strings or Date objects
 * - array: Arrays (with item type detection)
 * - image: Paths ending with image extensions
 *
 * @module @writenex/astro/discovery/schema
 */

import type { CollectionSchema, FieldType, SchemaField } from "@/types";
import { readCollection } from "@/filesystem/reader";

/**
 * Maximum number of files to sample for schema detection
 */
const MAX_SAMPLE_FILES = 20;

/**
 * Minimum presence ratio to consider a field required
 * (field must appear in at least 90% of files)
 */
const REQUIRED_THRESHOLD = 0.9;

/**
 * Maximum unique values to consider a field as enum
 */
const ENUM_MAX_VALUES = 10;

/**
 * Minimum ratio of unique values to total to NOT be an enum
 * (if uniqueValues / total < 0.3, it's likely an enum)
 */
const ENUM_RATIO_THRESHOLD = 0.3;

/**
 * Image file extensions for detection
 */
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
];

/**
 * Field analysis data collected from samples
 */
interface FieldAnalysis {
  /** Number of files where this field appears */
  presentCount: number;
  /** Detected types for this field across samples */
  types: Set<string>;
  /** Sample values for enum detection */
  values: unknown[];
  /** Whether values look like image paths */
  hasImagePaths: boolean;
  /** Whether values look like dates */
  hasDateValues: boolean;
  /** For arrays, analysis of item types */
  arrayItemTypes: Set<string>;
}

/**
 * Result of schema detection
 */
export interface SchemaDetectionResult {
  /** The detected schema */
  schema: CollectionSchema;
  /** Number of files analyzed */
  samplesAnalyzed: number;
  /** Confidence score (0-1) based on sample consistency */
  confidence: number;
  /** Fields that had inconsistent types across samples */
  warnings: string[];
}

/**
 * Check if a string looks like an image path
 *
 * @param value - Value to check
 * @returns True if it looks like an image path
 */
function isImagePath(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const lowered = value.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lowered.endsWith(ext));
}

/**
 * Check if a value looks like a date
 *
 * @param value - Value to check
 * @returns True if it looks like a date
 */
function isDateValue(value: unknown): boolean {
  // Already a Date object
  if (value instanceof Date) return true;

  // ISO date string (YYYY-MM-DD or full ISO)
  if (typeof value === "string") {
    // Full ISO format
    if (/^\d{4}-\d{2}-\d{2}(T|\s)/.test(value)) return true;
    // Simple date format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  }

  return false;
}

/**
 * Detect the JavaScript type of a value
 *
 * @param value - Value to analyze
 * @returns Detected type string
 */
function detectValueType(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  if (typeof value === "object") return "object";
  return "unknown";
}

/**
 * Convert detected type to schema field type
 *
 * @param analysis - Field analysis data
 * @returns The appropriate FieldType
 */
function inferFieldType(analysis: FieldAnalysis): FieldType {
  // If it has image paths, it's an image field
  if (analysis.hasImagePaths) return "image";

  // If it has date values, it's a date field
  if (analysis.hasDateValues) return "date";

  // Check detected types (excluding null)
  const nonNullTypes = new Set([...analysis.types].filter((t) => t !== "null"));

  // Single type is easy
  if (nonNullTypes.size === 1) {
    const type = [...nonNullTypes][0];
    switch (type) {
      case "boolean":
        return "boolean";
      case "number":
        return "number";
      case "array":
        return "array";
      case "object":
        return "object";
      case "date":
        return "date";
      default:
        return "string";
    }
  }

  // Mixed types - default to string (most flexible)
  return "string";
}

/**
 * Detect if a field should be treated as an enum
 *
 * @param values - All values seen for this field
 * @param totalSamples - Total number of samples
 * @returns Array of enum values, or undefined if not an enum
 */
function detectEnum(
  values: unknown[],
  totalSamples: number
): string[] | undefined {
  // Filter to string values only
  const stringValues = values.filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );

  if (stringValues.length === 0) return undefined;

  // Get unique values
  const uniqueValues = [...new Set(stringValues)];

  // Check if it's a good candidate for enum
  if (uniqueValues.length > ENUM_MAX_VALUES) return undefined;

  // Check ratio of unique to total
  const ratio = uniqueValues.length / totalSamples;
  if (ratio > ENUM_RATIO_THRESHOLD) return undefined;

  // Must have at least 2 unique values and appear multiple times
  if (uniqueValues.length < 2) return undefined;
  if (stringValues.length < totalSamples * 0.5) return undefined;

  return uniqueValues.sort();
}

/**
 * Detect item type for array fields
 *
 * @param analysis - Field analysis data
 * @returns The detected item type, or undefined
 */
function detectArrayItemType(analysis: FieldAnalysis): string | undefined {
  if (analysis.arrayItemTypes.size === 0) return undefined;

  // Filter out null
  const types = [...analysis.arrayItemTypes].filter((t) => t !== "null");

  if (types.length === 0) return undefined;
  if (types.length === 1) return types[0];

  // Mixed types - default to string
  return "string";
}

/**
 * Analyze frontmatter from content items to detect schema
 *
 * @param collectionPath - Absolute path to the collection directory
 * @returns Schema detection result
 *
 * @example
 * ```typescript
 * const result = await detectSchema('/project/src/content/blog');
 * console.log(result.schema);
 * // {
 * //   title: { type: 'string', required: true },
 * //   pubDate: { type: 'date', required: true },
 * //   draft: { type: 'boolean', required: false, default: false },
 * //   tags: { type: 'array', required: false, items: 'string' },
 * // }
 * ```
 */
export async function detectSchema(
  collectionPath: string
): Promise<SchemaDetectionResult> {
  const warnings: string[] = [];

  // Read sample content files
  const items = await readCollection(collectionPath, {
    includeDrafts: true,
  });

  // Limit to max samples
  const samples = items.slice(0, MAX_SAMPLE_FILES);

  if (samples.length === 0) {
    return {
      schema: {},
      samplesAnalyzed: 0,
      confidence: 0,
      warnings: ["No content files found in collection"],
    };
  }

  // Analyze each field across all samples
  const fieldAnalyses = new Map<string, FieldAnalysis>();

  for (const item of samples) {
    for (const [fieldName, value] of Object.entries(item.frontmatter)) {
      // Get or create field analysis
      let analysis = fieldAnalyses.get(fieldName);
      if (!analysis) {
        analysis = {
          presentCount: 0,
          types: new Set(),
          values: [],
          hasImagePaths: false,
          hasDateValues: false,
          arrayItemTypes: new Set(),
        };
        fieldAnalyses.set(fieldName, analysis);
      }

      // Update analysis
      analysis.presentCount++;
      analysis.types.add(detectValueType(value));
      analysis.values.push(value);

      // Check for special types
      if (isImagePath(value)) {
        analysis.hasImagePaths = true;
      }
      if (isDateValue(value)) {
        analysis.hasDateValues = true;
      }

      // Analyze array items
      if (Array.isArray(value)) {
        for (const item of value) {
          analysis.arrayItemTypes.add(detectValueType(item));
        }
      }
    }
  }

  // Generate schema from analysis
  const schema: CollectionSchema = {};
  const totalSamples = samples.length;

  for (const [fieldName, analysis] of fieldAnalyses) {
    const fieldType = inferFieldType(analysis);
    const isRequired =
      analysis.presentCount / totalSamples >= REQUIRED_THRESHOLD;

    const field: SchemaField = {
      type: fieldType,
      required: isRequired,
    };

    // Add array item type if applicable
    if (fieldType === "array") {
      const itemType = detectArrayItemType(analysis);
      if (itemType) {
        field.items = itemType;
      }
    }

    // Detect enum for string fields
    if (fieldType === "string") {
      const enumValues = detectEnum(analysis.values, totalSamples);
      if (enumValues) {
        // Store enum values in the field
        // Note: We use 'default' to store enum options since SchemaField
        // doesn't have an 'enum' property - this can be enhanced later
        field.description = `Options: ${enumValues.join(", ")}`;
      }
    }

    // Detect default value for boolean fields
    if (fieldType === "boolean") {
      const boolValues = analysis.values.filter(
        (v): v is boolean => typeof v === "boolean"
      );
      if (boolValues.length > 0) {
        // Use most common value as default
        const trueCount = boolValues.filter((v) => v === true).length;
        const falseCount = boolValues.filter((v) => v === false).length;
        field.default = trueCount > falseCount ? true : false;
      }
    }

    // Check for type inconsistencies
    const nonNullTypes = [...analysis.types].filter((t) => t !== "null");
    if (nonNullTypes.length > 1) {
      warnings.push(
        `Field "${fieldName}" has inconsistent types: ${nonNullTypes.join(", ")}`
      );
    }

    schema[fieldName] = field;
  }

  // Calculate confidence based on consistency
  const inconsistentFields = warnings.filter((w) =>
    w.includes("inconsistent")
  ).length;
  const confidence = Math.max(
    0,
    1 - inconsistentFields / Math.max(1, fieldAnalyses.size)
  );

  return {
    schema,
    samplesAnalyzed: totalSamples,
    confidence,
    warnings,
  };
}

/**
 * Merge detected schema with user-provided schema
 *
 * User schema takes precedence over detected schema.
 *
 * @param detected - Auto-detected schema
 * @param userSchema - User-provided schema overrides
 * @returns Merged schema
 */
export function mergeSchema(
  detected: CollectionSchema,
  userSchema?: CollectionSchema
): CollectionSchema {
  if (!userSchema) return detected;

  const merged: CollectionSchema = { ...detected };

  for (const [fieldName, userField] of Object.entries(userSchema)) {
    merged[fieldName] = {
      ...detected[fieldName],
      ...userField,
    };
  }

  return merged;
}

/**
 * Convert schema to a human-readable description
 *
 * @param schema - The schema to describe
 * @returns Human-readable description
 */
export function describeSchema(schema: CollectionSchema): string {
  const lines: string[] = [];

  for (const [fieldName, field] of Object.entries(schema)) {
    let desc = `- ${fieldName}: ${field.type}`;

    if (field.required) {
      desc += " (required)";
    }

    if (field.items) {
      desc += ` of ${field.items}`;
    }

    if (field.default !== undefined) {
      desc += ` [default: ${JSON.stringify(field.default)}]`;
    }

    if (field.description) {
      desc += ` - ${field.description}`;
    }

    lines.push(desc);
  }

  return lines.join("\n");
}
