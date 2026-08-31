/**
 * @fileoverview Fields builder API for @writenex/astro
 *
 * This module provides a TypeScript-first builder pattern for defining
 * content schema fields. Each field type is a method on the `fields` object.
 *
 * @module @writenex/astro/fields/fields
 */

import type {
  ArrayFieldConfig,
  BaseFieldConfig,
  BlocksFieldConfig,
  CheckboxFieldConfig,
  ChildFieldConfig,
  CloudImageFieldConfig,
  ConditionalFieldConfig,
  DateFieldConfig,
  DatetimeFieldConfig,
  FieldDefinition,
  FileFieldConfig,
  ImageFieldConfig,
  IntegerFieldConfig,
  MarkdocFieldConfig,
  MdxFieldConfig,
  MultiselectFieldConfig,
  NumberFieldConfig,
  ObjectFieldConfig,
  PathReferenceFieldConfig,
  RelationshipFieldConfig,
  SelectFieldConfig,
  SlugFieldConfig,
  TextFieldConfig,
  UrlFieldConfig,
} from "./types";

function createField<K extends FieldDefinition["fieldKind"]>(
  fieldKind: K,
  config: Omit<Extract<FieldDefinition, { fieldKind: K }>, "fieldKind">
): Extract<FieldDefinition, { fieldKind: K }> {
  const safeConfig = config ?? {};
  return { fieldKind, ...safeConfig } as Extract<
    FieldDefinition,
    { fieldKind: K }
  >;
}

export const fields = {
  text(config: TextFieldConfig = {}): FieldDefinition {
    return createField("text", config);
  },

  slug(config: SlugFieldConfig = {}): FieldDefinition {
    return createField("slug", config);
  },

  url(config: UrlFieldConfig = {}): FieldDefinition {
    return createField("url", config);
  },

  number(config: NumberFieldConfig = {}): FieldDefinition {
    return createField("number", config);
  },

  integer(config: IntegerFieldConfig = {}): FieldDefinition {
    return createField("integer", config);
  },

  select(config: SelectFieldConfig): FieldDefinition {
    return createField("select", config);
  },

  multiselect(config: MultiselectFieldConfig): FieldDefinition {
    return createField("multiselect", config);
  },

  checkbox(config: CheckboxFieldConfig = {}): FieldDefinition {
    return createField("checkbox", config);
  },

  date(config: DateFieldConfig = {}): FieldDefinition {
    return createField("date", config);
  },

  datetime(config: DatetimeFieldConfig = {}): FieldDefinition {
    return createField("datetime", config);
  },

  image(config: ImageFieldConfig = {}): FieldDefinition {
    return createField("image", config);
  },

  file(config: FileFieldConfig = {}): FieldDefinition {
    return createField("file", config);
  },

  object(config: ObjectFieldConfig): FieldDefinition {
    return createField("object", config);
  },

  array(config: ArrayFieldConfig): FieldDefinition {
    return createField("array", config);
  },

  blocks(config: BlocksFieldConfig): FieldDefinition {
    return createField("blocks", config);
  },

  relationship(config: RelationshipFieldConfig): FieldDefinition {
    return createField("relationship", config);
  },

  pathReference(config: PathReferenceFieldConfig = {}): FieldDefinition {
    return createField("path-reference", config);
  },

  markdoc(config: MarkdocFieldConfig = {}): FieldDefinition {
    return createField("markdoc", config);
  },

  mdx(config: MdxFieldConfig = {}): FieldDefinition {
    return createField("mdx", config);
  },

  conditional(config: ConditionalFieldConfig): FieldDefinition {
    return createField("conditional", config);
  },

  child(config: ChildFieldConfig = {}): FieldDefinition {
    return createField("child", config);
  },

  cloudImage(config: CloudImageFieldConfig = {}): FieldDefinition {
    return createField("cloud-image", config);
  },

  empty(config: BaseFieldConfig = {}): FieldDefinition {
    return createField("empty", config);
  },

  emptyContent(config: BaseFieldConfig = {}): FieldDefinition {
    return createField("empty-content", config);
  },

  emptyDocument(config: BaseFieldConfig = {}): FieldDefinition {
    return createField("empty-document", config);
  },

  ignored(config: BaseFieldConfig = {}): FieldDefinition {
    return createField("ignored", config);
  },
};

export type Fields = typeof fields;
