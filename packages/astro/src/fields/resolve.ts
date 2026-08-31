/**
 * @fileoverview FieldDefinition to SchemaField conversion
 *
 * This module converts FieldDefinition objects (from the builder API)
 * to the internal SchemaField format used by the form system.
 *
 * @module @writenex/astro/fields/resolve
 */

import type { SchemaField } from "@/types";
import type { FieldDefinition } from "./types";

const FIELD_KIND_TO_TYPE: Record<string, string> = {
  text: "string",
  slug: "slug",
  url: "url",
  number: "number",
  integer: "integer",
  select: "select",
  multiselect: "multiselect",
  checkbox: "checkbox",
  date: "date",
  datetime: "datetime",
  image: "image",
  file: "file",
  object: "object",
  array: "array",
  blocks: "blocks",
  relationship: "relationship",
  "path-reference": "path-reference",
  markdoc: "markdoc",
  mdx: "mdx",
  conditional: "conditional",
  child: "child",
  "cloud-image": "cloud-image",
  empty: "empty",
  "empty-content": "empty-content",
  "empty-document": "empty-document",
  ignored: "ignored",
};

function resolveObjectFields(
  fields: Record<string, FieldDefinition> | undefined
): Record<string, SchemaField> {
  const result: Record<string, SchemaField> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (!isFieldDefinition(value)) continue;
    result[key] = resolveFieldDefinition(value);
  }
  return result;
}

function resolveBlockTypes(
  blockTypes: Record<string, FieldDefinition> | undefined
): Record<string, SchemaField> {
  const result: Record<string, SchemaField> = {};
  for (const [key, value] of Object.entries(blockTypes ?? {})) {
    if (!isFieldDefinition(value)) continue;
    result[key] = resolveFieldDefinition(value);
  }
  return result;
}

function isFieldDefinition(value: unknown): value is FieldDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    "fieldKind" in value &&
    typeof (value as { fieldKind?: unknown }).fieldKind === "string"
  );
}

function fallbackField(): SchemaField {
  return { type: "string", required: false };
}

export function resolveFieldDefinition(field: FieldDefinition): SchemaField {
  if (!isFieldDefinition(field)) {
    return fallbackField();
  }

  const type = FIELD_KIND_TO_TYPE[field.fieldKind] ?? "string";

  const base: SchemaField = {
    type: type as SchemaField["type"],
    required: field.validation?.isRequired ?? false,
    label: field.label,
    description: field.description,
    default: field.defaultValue,
  };

  switch (field.fieldKind) {
    case "text":
      return {
        ...base,
        multiline: field.multiline,
      };

    case "slug":
    case "url":
      return base;

    case "number":
      return {
        ...base,
        default:
          field.defaultValue ?? (field as { placeholder?: number }).placeholder,
      };

    case "integer":
      return {
        ...base,
        default:
          field.defaultValue ?? (field as { placeholder?: number }).placeholder,
      };

    case "select":
      return {
        ...base,
        options: field.options,
        default: field.defaultValue,
      };

    case "multiselect":
      return {
        ...base,
        options: field.options,
        default: field.defaultValue,
      };

    case "checkbox":
      return {
        ...base,
        default: field.defaultValue,
      };

    case "date":
      return {
        ...base,
        format: "date",
        default: field.defaultValue,
      };

    case "datetime":
      return {
        ...base,
        format: "datetime-local",
        default: field.defaultValue,
      };

    case "image":
      return {
        ...base,
        directory: field.directory,
        publicPath: field.publicPath,
      };

    case "file":
      return {
        ...base,
        directory: field.directory,
        publicPath: field.publicPath,
      };

    case "object":
      return {
        ...base,
        fields: resolveObjectFields(field.fields),
      };

    case "array":
      return {
        ...base,
        itemField: isFieldDefinition(field.itemField)
          ? resolveFieldDefinition(field.itemField)
          : fallbackField(),
        itemLabel: field.itemLabel,
      };

    case "blocks":
      return {
        ...base,
        blockTypes: resolveBlockTypes(field.blockTypes),
        itemLabel: field.itemLabel,
      };

    case "relationship":
      return {
        ...base,
        collection: field.collection,
      };

    case "path-reference":
      return {
        ...base,
        allowExternal: (
          field as { contentTypes?: string[] }
        ).contentTypes?.includes("url"),
      };

    case "markdoc":
    case "mdx":
      return base;

    case "conditional":
      return {
        ...base,
        matchField: field.matchField,
        matchValue: field.matchValue,
        showField: isFieldDefinition(field.showField)
          ? resolveFieldDefinition(field.showField)
          : fallbackField(),
      };

    case "child":
    case "cloud-image":
      return base;

    case "empty":
    case "empty-content":
    case "empty-document":
    case "ignored":
    default:
      return base;
  }
}
