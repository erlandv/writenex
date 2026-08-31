/**
 * @fileoverview Field type definitions for the Fields API
 *
 * This module defines the FieldDefinition interface and per-field-type
 * config interfaces for the builder pattern API.
 *
 * @module @writenex/astro/fields/types
 */

export type FieldKind =
  | "text"
  | "slug"
  | "url"
  | "number"
  | "integer"
  | "select"
  | "multiselect"
  | "checkbox"
  | "date"
  | "datetime"
  | "image"
  | "file"
  | "object"
  | "array"
  | "blocks"
  | "relationship"
  | "path-reference"
  | "markdoc"
  | "mdx"
  | "conditional"
  | "child"
  | "cloud-image"
  | "empty"
  | "empty-content"
  | "empty-document"
  | "ignored";

export interface ValidationOptions {
  isRequired?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternDescription?: string;
}

export interface BaseFieldConfig {
  label?: string;
  description?: string;
  validation?: ValidationOptions;
  defaultValue?: unknown;
}

export interface TextFieldConfig extends BaseFieldConfig {
  multiline?: boolean;
  placeholder?: string;
}

export interface SlugFieldConfig extends BaseFieldConfig {
  name?: {
    label?: string;
    placeholder?: string;
  };
  pathname?: {
    label?: string;
    placeholder?: string;
  };
}

export interface UrlFieldConfig extends BaseFieldConfig {
  placeholder?: string;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  placeholder?: number;
}

export interface IntegerFieldConfig extends BaseFieldConfig {
  placeholder?: number;
}

export interface SelectFieldConfig extends BaseFieldConfig {
  options: string[];
  defaultValue?: string;
}

export interface MultiselectFieldConfig extends BaseFieldConfig {
  options: string[];
  defaultValue?: string[];
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  defaultValue?: boolean;
}

export interface DateFieldConfig extends BaseFieldConfig {
  defaultValue?: string;
}

export interface DatetimeFieldConfig extends BaseFieldConfig {
  defaultValue?: string;
}

export interface ImageFieldConfig extends BaseFieldConfig {
  directory?: string;
  publicPath?: string;
}

export interface FileFieldConfig extends BaseFieldConfig {
  directory?: string;
  publicPath?: string;
}

export interface ObjectFieldConfig extends BaseFieldConfig {
  fields: Record<string, FieldDefinition>;
}

export interface ArrayFieldConfig extends BaseFieldConfig {
  itemField: FieldDefinition;
  itemLabel?: string;
}

export interface BlocksFieldConfig extends BaseFieldConfig {
  blockTypes: Record<string, FieldDefinition>;
  itemLabel?: string;
}

export interface RelationshipFieldConfig extends BaseFieldConfig {
  collection: string;
}

export interface PathReferenceFieldConfig extends BaseFieldConfig {
  contentTypes?: string[];
}

export interface MarkdocFieldConfig extends BaseFieldConfig {}

export interface MdxFieldConfig extends BaseFieldConfig {}

export interface ConditionalFieldConfig extends BaseFieldConfig {
  matchField: string;
  matchValue: unknown;
  showField: FieldDefinition;
}

export interface ChildFieldConfig extends BaseFieldConfig {}

export interface CloudImageFieldConfig extends BaseFieldConfig {
  provider?: string;
}

export type FieldDefinition =
  | ({ fieldKind: "text" } & TextFieldConfig)
  | ({ fieldKind: "slug" } & SlugFieldConfig)
  | ({ fieldKind: "url" } & UrlFieldConfig)
  | ({ fieldKind: "number" } & NumberFieldConfig)
  | ({ fieldKind: "integer" } & IntegerFieldConfig)
  | ({ fieldKind: "select" } & SelectFieldConfig)
  | ({ fieldKind: "multiselect" } & MultiselectFieldConfig)
  | ({ fieldKind: "checkbox" } & CheckboxFieldConfig)
  | ({ fieldKind: "date" } & DateFieldConfig)
  | ({ fieldKind: "datetime" } & DatetimeFieldConfig)
  | ({ fieldKind: "image" } & ImageFieldConfig)
  | ({ fieldKind: "file" } & FileFieldConfig)
  | ({ fieldKind: "object" } & ObjectFieldConfig)
  | ({ fieldKind: "array" } & ArrayFieldConfig)
  | ({ fieldKind: "blocks" } & BlocksFieldConfig)
  | ({ fieldKind: "relationship" } & RelationshipFieldConfig)
  | ({ fieldKind: "path-reference" } & PathReferenceFieldConfig)
  | ({ fieldKind: "markdoc" } & MarkdocFieldConfig)
  | ({ fieldKind: "mdx" } & MdxFieldConfig)
  | ({ fieldKind: "conditional" } & ConditionalFieldConfig)
  | ({ fieldKind: "child" } & ChildFieldConfig)
  | ({ fieldKind: "cloud-image" } & CloudImageFieldConfig)
  | ({ fieldKind: "empty" } & BaseFieldConfig)
  | ({ fieldKind: "empty-content" } & BaseFieldConfig)
  | ({ fieldKind: "empty-document" } & BaseFieldConfig)
  | ({ fieldKind: "ignored" } & BaseFieldConfig);
