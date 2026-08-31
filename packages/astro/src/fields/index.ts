/**
 * @fileoverview Fields API barrel exports
 *
 * @module @writenex/astro/fields
 */

export type {
  CollectionSchemaConfig,
  SingletonSchemaConfig,
} from "./collection";
export { collection, singleton } from "./collection";
export type { Fields } from "./fields";
export { fields } from "./fields";
export { resolveFieldDefinition } from "./resolve";
export type {
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
  FieldKind,
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
  ValidationOptions,
} from "./types";
