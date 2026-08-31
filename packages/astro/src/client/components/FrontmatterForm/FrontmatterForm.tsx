/**
 * @fileoverview Frontmatter form panel component for editing content metadata
 *
 * This component provides a collapsible panel on the right side for editing
 * frontmatter fields. It supports schema-aware dynamic fields when a collection
 * schema is available, or falls back to basic fields.
 *
 * @module @writenex/astro/client/components/FrontmatterForm
 */

import { AlertCircle, Info, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CollectionSchema, SchemaField } from "../../../types";
import { useSharedApi } from "../../context/ApiContext";
import type { ContentSummary } from "../../hooks/useApi";
import "./FrontmatterForm.css";

/**
 * Props for the FrontmatterForm component
 */
interface FrontmatterFormProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Current frontmatter data */
  frontmatter: Record<string, unknown> | null;
  /** Collection schema for dynamic field generation */
  schema?: CollectionSchema;
  /** Callback when frontmatter changes */
  onChange: (frontmatter: Record<string, unknown>) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Callback for image upload */
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  /** Current collection name for image preview URLs */
  collection?: string;
  /** Current content ID for image preview URLs */
  contentId?: string;
}

/**
 * Frontmatter form panel for editing content metadata
 *
 * @component
 */
export function FrontmatterForm({
  isOpen,
  onClose,
  frontmatter,
  schema,
  onChange,
  disabled = false,
  onImageUpload,
  collection,
  contentId,
}: FrontmatterFormProps): React.ReactElement {
  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      if (!frontmatter) return;
      onChange({ ...frontmatter, [field]: value });
    },
    [frontmatter, onChange]
  );

  const panelClassName = [
    "wn-frontmatter-panel",
    isOpen ? "wn-frontmatter-panel--open" : "wn-frontmatter-panel--closed",
  ]
    .filter(Boolean)
    .join(" ");

  const hasSchema = schema && Object.keys(schema).length > 0;
  const fieldCount = hasSchema ? Object.keys(schema).length : 0;

  return (
    <aside
      className={panelClassName}
      role="complementary"
      aria-label="Frontmatter editor"
      aria-hidden={!isOpen}
    >
      <div className="wn-frontmatter-panel-inner">
        {/* Header */}
        <div className="wn-frontmatter-header">
          <h2 className="wn-frontmatter-title">
            <Info size={14} />
            Frontmatter
            {frontmatter && (
              <span className="wn-frontmatter-badge">
                {hasSchema ? `${fieldCount} fields` : "Basic"}
              </span>
            )}
          </h2>
          <button
            className="wn-frontmatter-close"
            onClick={onClose}
            title="Close panel"
            aria-label="Close frontmatter panel"
          >
            <X size={12} />
          </button>
        </div>

        {/* Content */}
        <div className="wn-frontmatter-content">
          {!frontmatter ? (
            <EmptyState />
          ) : hasSchema ? (
            <SchemaFields
              frontmatter={frontmatter}
              schema={schema}
              onChange={handleFieldChange}
              disabled={disabled}
              onImageUpload={onImageUpload}
              collection={collection}
              contentId={contentId}
            />
          ) : (
            <BasicFields
              frontmatter={frontmatter}
              onChange={handleFieldChange}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

/**
 * Empty state when no content is selected
 */
function EmptyState(): React.ReactElement {
  return (
    <div className="wn-frontmatter-empty">
      <div className="wn-frontmatter-empty-icon">
        <AlertCircle size={32} strokeWidth={1.5} />
      </div>
      <p className="wn-frontmatter-empty-text">No content selected</p>
      <p className="wn-frontmatter-empty-hint">
        Select a content item from the sidebar to edit its frontmatter
      </p>
    </div>
  );
}

/**
 * Priority order for common frontmatter fields.
 * Lower number = higher priority (appears first).
 */
const FIELD_PRIORITY: Record<string, number> = {
  title: 1,
  name: 2,
  description: 10,
  excerpt: 11,
  summary: 12,
  date: 20,
  pubDate: 21,
  publishDate: 22,
  updatedDate: 23,
  modifiedDate: 24,
  author: 30,
  authors: 31,
  category: 40,
  categories: 41,
  tags: 42,
  image: 50,
  hero: 51,
  heroImage: 52,
  heroAlt: 53,
  cover: 54,
  coverImage: 55,
  thumbnail: 56,
  draft: 90,
  featured: 91,
  published: 92,
};

/**
 * Get sort priority for a field name.
 * Fields not in priority list get a default value of 100.
 */
function getFieldPriority(fieldName: string): number {
  return FIELD_PRIORITY[fieldName] ?? 100;
}

/**
 * Schema-aware dynamic fields
 */
function SchemaFields({
  frontmatter,
  schema,
  onChange,
  disabled,
  onImageUpload,
  collection,
  contentId,
}: {
  frontmatter: Record<string, unknown>;
  schema: CollectionSchema;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  collection?: string;
  contentId?: string;
}): React.ReactElement {
  const sortedFields = Object.entries(schema).sort(
    ([aKey, aField], [bKey, bField]) => {
      const aPriority = getFieldPriority(aKey);
      const bPriority = getFieldPriority(bKey);

      // Sort by priority first
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then by required status
      if (aField.required && !bField.required) return -1;
      if (!aField.required && bField.required) return 1;

      // Finally alphabetically
      return aKey.localeCompare(bKey);
    }
  );

  return (
    <div className="wn-frontmatter-fields">
      {sortedFields.map(([fieldName, fieldDef]) => (
        <DynamicField
          key={fieldName}
          name={fieldName}
          field={fieldDef}
          value={frontmatter[fieldName]}
          onChange={(value) => onChange(fieldName, value)}
          disabled={disabled}
          onImageUpload={onImageUpload}
          collection={collection}
          contentId={contentId}
        />
      ))}
    </div>
  );
}

/**
 * Basic fallback fields when no schema is available
 */
function BasicFields({
  frontmatter,
  onChange,
  disabled,
}: {
  frontmatter: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}): React.ReactElement {
  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onChange("tags", tags);
  };

  const title = String(frontmatter.title ?? "");
  const description = String(frontmatter.description ?? "");
  const pubDate = formatDateForInput(frontmatter.pubDate);
  const updatedDate = formatDateForInput(frontmatter.updatedDate);
  const draft = Boolean(frontmatter.draft);
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.join(", ")
    : "";
  const heroImage = String(frontmatter.heroImage ?? "");

  return (
    <div className="wn-frontmatter-fields">
      {/* Title */}
      <div className="wn-frontmatter-field">
        <label className="wn-frontmatter-label" htmlFor="fm-title">
          Title<span className="wn-frontmatter-required">*</span>
        </label>
        <input
          id="fm-title"
          type="text"
          className="wn-frontmatter-input"
          value={title}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder="Enter title"
        />
      </div>

      {/* Description */}
      <div className="wn-frontmatter-field">
        <label className="wn-frontmatter-label" htmlFor="fm-description">
          Description
        </label>
        <textarea
          id="fm-description"
          className="wn-frontmatter-textarea"
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          disabled={disabled}
          placeholder="Brief description"
          rows={2}
        />
      </div>

      {/* Dates */}
      <div className="wn-frontmatter-field--row">
        <div className="wn-frontmatter-field">
          <label className="wn-frontmatter-label" htmlFor="fm-pubDate">
            Publish Date
          </label>
          <input
            id="fm-pubDate"
            type="date"
            className="wn-frontmatter-input"
            value={pubDate}
            onChange={(e) => onChange("pubDate", e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="wn-frontmatter-field">
          <label className="wn-frontmatter-label" htmlFor="fm-updatedDate">
            Updated Date
          </label>
          <input
            id="fm-updatedDate"
            type="date"
            className="wn-frontmatter-input"
            value={updatedDate}
            onChange={(e) =>
              onChange("updatedDate", e.target.value || undefined)
            }
            disabled={disabled}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="wn-frontmatter-field">
        <label className="wn-frontmatter-label" htmlFor="fm-tags">
          Tags
        </label>
        <input
          id="fm-tags"
          type="text"
          className="wn-frontmatter-input"
          value={tags}
          onChange={(e) => handleTagsChange(e.target.value)}
          disabled={disabled}
          placeholder="tag1, tag2, tag3"
        />
        <span className="wn-frontmatter-hint">Separate with commas</span>
      </div>

      {/* Hero Image */}
      <div className="wn-frontmatter-field">
        <label className="wn-frontmatter-label" htmlFor="fm-heroImage">
          Hero Image
        </label>
        <input
          id="fm-heroImage"
          type="text"
          className="wn-frontmatter-input"
          value={heroImage}
          onChange={(e) => onChange("heroImage", e.target.value || undefined)}
          disabled={disabled}
          placeholder="./images/hero.jpg"
        />
      </div>

      <div className="wn-frontmatter-divider" />

      {/* Draft */}
      <div className="wn-frontmatter-checkbox-field">
        <label className="wn-frontmatter-checkbox-label">
          <input
            type="checkbox"
            className="wn-frontmatter-checkbox"
            checked={draft}
            onChange={(e) => onChange("draft", e.target.checked)}
            disabled={disabled}
          />
          <span>Draft</span>
        </label>
        <span className="wn-frontmatter-checkbox-hint">Not published</span>
      </div>
    </div>
  );
}

/**
 * Dynamic field renderer based on schema type
 */
function DynamicField({
  name,
  field,
  value,
  onChange,
  disabled,
  onImageUpload,
  collection,
  contentId,
}: {
  name: string;
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  collection?: string;
  contentId?: string;
}): React.ReactElement {
  const fieldId = `fm-${name}`;
  const label = formatFieldLabel(name);

  switch (field.type) {
    case "boolean":
    case "checkbox":
      return (
        <BooleanField
          id={fieldId}
          label={label}
          value={normalizeBool(value ?? field.default)}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "number":
    case "integer":
      return (
        <NumberField
          id={fieldId}
          label={label}
          value={value as number | string | undefined}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
          step={field.type === "integer" ? 1 : "any"}
        />
      );

    case "date":
      return (
        <DateField
          id={fieldId}
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "datetime":
      return (
        <DatetimeField
          id={fieldId}
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "array":
      return (
        <ArrayField
          id={fieldId}
          label={label}
          value={value as unknown[] | undefined}
          itemType={field.items}
          itemField={field.itemField}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
          onImageUpload={onImageUpload}
          collection={collection}
          contentId={contentId}
        />
      );

    case "multiselect":
      return (
        <MultiselectField
          id={fieldId}
          label={label}
          value={value as string[] | undefined}
          options={field.options || []}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "select":
      return (
        <SelectField
          id={fieldId}
          label={label}
          value={String(value ?? "")}
          options={field.options || []}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "image":
      return (
        <ImageField
          id={fieldId}
          label={label}
          value={value as string | undefined}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
          onUpload={
            onImageUpload ? (file) => onImageUpload(file, name) : undefined
          }
          collection={collection}
          contentId={contentId}
        />
      );

    case "file":
      return (
        <FileField
          id={fieldId}
          label={label}
          value={value as string | undefined}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "slug":
      return (
        <SlugField
          id={fieldId}
          label={label}
          value={String(value ?? "")}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "url":
      return (
        <UrlField
          id={fieldId}
          label={label}
          value={String(value ?? "")}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "object":
      return (
        <ObjectField
          id={fieldId}
          label={label}
          value={value as Record<string, unknown> | undefined}
          fields={field.fields}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
          onImageUpload={onImageUpload}
          collection={collection}
          contentId={contentId}
        />
      );

    case "relationship":
      return (
        <RelationshipField
          id={fieldId}
          label={label}
          value={value as string | string[] | undefined}
          collection={field.collection}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    case "markdoc":
    case "mdx":
      return (
        <RichTextField
          id={fieldId}
          label={label}
          value={String(value ?? "")}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
        />
      );

    // cloud-image: treat as regular image field
    case "cloud-image":
      return (
        <ImageField
          id={fieldId}
          label={label}
          value={value as string | undefined}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
          onUpload={
            onImageUpload ? (file) => onImageUpload(file, name) : undefined
          }
          collection={collection}
          contentId={contentId}
        />
      );

    // path-reference: plain text input for a file path
    case "path-reference":
      return (
        <StringField
          id={fieldId}
          label={label}
          value={String(value ?? "")}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
          multiline={false}
        />
      );

    // conditional: evaluating the condition requires the parent frontmatter object
    // (to read matchField from a sibling field), which DynamicField doesn't receive.
    // Always render showField so the value remains editable.
    case "conditional": {
      if (!field.showField) return <></>;
      return (
        <DynamicField
          name={name}
          field={field.showField}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onImageUpload={onImageUpload}
          collection={collection}
          contentId={contentId}
        />
      );
    }

    // blocks: render each block as a collapsible object using its blockType schema
    case "blocks": {
      const blockItems = Array.isArray(value)
        ? (value as Record<string, unknown>[])
        : [];
      const blockTypes = field.blockTypes ?? {};
      return (
        <div className="wn-frontmatter-field">
          <label className="wn-frontmatter-label">
            {label}
            {field.required && (
              <span className="wn-frontmatter-required">*</span>
            )}
          </label>
          {blockItems.length === 0 && (
            <span className="wn-frontmatter-hint">No blocks</span>
          )}
          {blockItems.map((block, index) => {
            const blockType = String(block._type ?? block.type ?? "");
            const blockSchema = blockTypes[blockType];
            return (
              <ObjectField
                key={index}
                id={`${fieldId}-${index}`}
                label={blockType || `Block ${index + 1}`}
                value={block}
                fields={blockSchema?.fields}
                onChange={(updated) => {
                  const next = [...blockItems];
                  next[index] = updated as Record<string, unknown>;
                  onChange(next);
                }}
                disabled={disabled}
                onImageUpload={onImageUpload}
                collection={collection}
                contentId={contentId}
              />
            );
          })}
        </div>
      );
    }

    case "ignored":
    case "empty":
    case "empty-content":
    case "empty-document":
    case "child":
      return <></>;

    case "string":
    default:
      const isMultiline =
        field.multiline ||
        name === "description" ||
        name === "excerpt" ||
        name === "summary";

      return (
        <StringField
          id={fieldId}
          label={label}
          value={String(value ?? "")}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
          multiline={isMultiline}
        />
      );
  }
}

// Field Components

interface BaseFieldProps {
  id: string;
  label: string;
  disabled: boolean;
  required?: boolean;
}

function StringField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  multiline,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${label.toLowerCase()}`}
          rows={2}
          className="wn-frontmatter-textarea"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="wn-frontmatter-input"
        />
      )}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  step,
}: BaseFieldProps & {
  value: number | string | undefined;
  onChange: (value: number | undefined) => void;
  step?: string | number;
}): React.ReactElement {
  // Normalize string-typed numbers that may come from YAML round-trips
  const numericValue =
    value === undefined || value === ""
      ? undefined
      : typeof value === "string"
        ? isNaN(Number(value))
          ? undefined
          : Number(value)
        : value;

  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <input
        id={id}
        type="number"
        value={numericValue ?? ""}
        step={step ?? "any"}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? undefined : Number(val));
        }}
        disabled={disabled}
        placeholder="0"
        className="wn-frontmatter-input"
      />
    </div>
  );
}

function BooleanField({
  id,
  label,
  value,
  onChange,
  disabled,
}: BaseFieldProps & {
  value: boolean;
  onChange: (value: boolean) => void;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-checkbox-field">
      <label className="wn-frontmatter-checkbox-label">
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="wn-frontmatter-checkbox"
        />
        <span>{label}</span>
      </label>
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: unknown;
  onChange: (value: string | undefined) => void;
}): React.ReactElement {
  const dateValue = formatDateForInput(value);

  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <input
        id={id}
        type="date"
        value={dateValue}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className="wn-frontmatter-input"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: string;
  options: string[];
  onChange: (value: string | undefined) => void;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className="wn-frontmatter-select"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function ArrayField({
  id,
  label,
  value,
  itemType,
  itemField,
  onChange,
  disabled,
  required,
  onImageUpload,
  collection,
  contentId,
}: BaseFieldProps & {
  value: unknown[] | undefined;
  itemType?: string;
  itemField?: SchemaField;
  onChange: (value: unknown[]) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  collection?: string;
  contentId?: string;
}): React.ReactElement {
  const [inputValue, setInputValue] = useState("");
  const items = Array.isArray(value) ? value : [];

  // If itemField is a structured schema (object, relationship, etc.),
  // render each item as a full DynamicField rather than a tag input.
  const isStructured =
    itemField &&
    itemField.type !== "string" &&
    itemField.type !== "number" &&
    itemField.type !== "integer";

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    let newItem: unknown = inputValue.trim();
    if (
      itemType === "number" ||
      itemField?.type === "number" ||
      itemField?.type === "integer"
    ) {
      newItem = Number(newItem);
    }
    onChange([...items, newItem]);
    setInputValue("");
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAdd();
    }
  };

  // Structured items: render each as a DynamicField with a remove button
  if (isStructured && itemField) {
    return (
      <div className="wn-frontmatter-field">
        <label className="wn-frontmatter-label">
          {label}
          {required && <span className="wn-frontmatter-required">*</span>}
        </label>
        {items.map((item, index) => (
          <div key={index} className="wn-frontmatter-array-item">
            <DynamicField
              name={`${id}-${index}`}
              field={itemField}
              value={item}
              onChange={(updated) => {
                const next = [...items];
                next[index] = updated;
                onChange(next);
              }}
              disabled={disabled}
              onImageUpload={onImageUpload}
              collection={collection}
              contentId={contentId}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="wn-frontmatter-tag-remove"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([
              ...items,
              itemField.type === "object"
                ? {}
                : itemField.type === "boolean" || itemField.type === "checkbox"
                  ? false
                  : undefined,
            ])
          }
          disabled={disabled}
          className="wn-frontmatter-add-btn"
        >
          + Add item
        </button>
      </div>
    );
  }

  // Primitive items: tag-input style
  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      {items.length > 0 && (
        <div className="wn-frontmatter-tags">
          {items.map((item, index) => (
            <span key={index} className="wn-frontmatter-tag">
              {String(item)}
              <button
                type="button"
                onMouseDown={(e) => {
                  // Prevent the input's onBlur from firing before this click
                  e.preventDefault();
                  handleRemove(index);
                }}
                disabled={disabled}
                className="wn-frontmatter-tag-remove"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        type={
          itemType === "number" ||
          itemField?.type === "number" ||
          itemField?.type === "integer"
            ? "number"
            : "text"
        }
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleAdd}
        disabled={disabled}
        placeholder="Type and press Enter"
        className="wn-frontmatter-input"
      />
    </div>
  );
}

function ImageField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  onUpload,
  collection,
  contentId,
}: BaseFieldProps & {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onUpload?: (file: File) => Promise<string | null>;
  collection?: string;
  contentId?: string;
}): React.ReactElement {
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(true);
    setPreviewError(false);
    try {
      const path = await onUpload(file);
      if (path) {
        onChange(path);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleValueChange = (newValue: string) => {
    setPreviewError(false);
    onChange(newValue || undefined);
  };

  // Build preview URL from relative path
  // URL format: /_writenex/api/images/:collection/:contentId/:imagePath
  const getPreviewUrl = (): string | null => {
    if (!value || !collection || !contentId) return null;

    // Remove leading ./ from path if present
    const imagePath = value.replace(/^\.\//, "");
    return `/_writenex/api/images/${collection}/${contentId}/${imagePath}`;
  };

  const previewUrl = getPreviewUrl();
  const showPreview = previewUrl && !previewError;

  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>

      {/* Image Preview */}
      {showPreview && (
        <div className="wn-frontmatter-image-preview">
          <img
            src={previewUrl}
            alt={`Preview for ${label}`}
            onError={() => setPreviewError(true)}
          />
        </div>
      )}

      <div className="wn-frontmatter-image-field">
        <input
          id={id}
          type="text"
          value={value ?? ""}
          onChange={(e) => handleValueChange(e.target.value)}
          disabled={disabled}
          placeholder="./images/hero.jpg"
          className="wn-frontmatter-input"
        />
        {onUpload && (
          <label className="wn-frontmatter-upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled || uploading}
              style={{ display: "none" }}
            />
            {uploading ? "..." : "Upload"}
          </label>
        )}
      </div>
    </div>
  );
}

function DatetimeField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: unknown;
  onChange: (value: string | undefined) => void;
}): React.ReactElement {
  const datetimeValue = formatDatetimeForInput(value);

  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <input
        id={id}
        type="datetime-local"
        value={datetimeValue}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        className="wn-frontmatter-input"
      />
    </div>
  );
}

function MultiselectField({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: string[] | undefined;
  options: string[];
  onChange: (value: string[]) => void;
}): React.ReactElement {
  const selectedValues = value || [];

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div className="wn-frontmatter-field">
      <label className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <div className="wn-frontmatter-checkbox-group">
        {options.map((option) => (
          <label key={option} className="wn-frontmatter-checkbox-label">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => handleToggle(option)}
              disabled={disabled}
              className="wn-frontmatter-checkbox"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FileField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        placeholder="./files/document.pdf"
        className="wn-frontmatter-input"
      />
    </div>
  );
}

function SlugField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="enter-slug-here"
        className="wn-frontmatter-input"
      />
    </div>
  );
}

function UrlField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="https://example.com"
        className="wn-frontmatter-input"
      />
    </div>
  );
}

function ObjectField({
  id,
  label,
  value,
  fields,
  onChange,
  disabled,
  required,
  onImageUpload,
  collection,
  contentId,
}: BaseFieldProps & {
  value: Record<string, unknown> | undefined;
  fields?: Record<string, SchemaField>;
  onChange: (value: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  collection?: string;
  contentId?: string;
}): React.ReactElement {
  const objectValue = value || {};
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFieldChange = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...objectValue, [fieldName]: fieldValue });
  };

  if (!fields || Object.keys(fields).length === 0) {
    return (
      <div className="wn-frontmatter-field">
        <label className="wn-frontmatter-label">
          {label}
          {required && <span className="wn-frontmatter-required">*</span>}
        </label>
        <span className="wn-frontmatter-hint">No sub-fields defined</span>
      </div>
    );
  }

  return (
    <div className="wn-frontmatter-field-group">
      <button
        type="button"
        className="wn-frontmatter-group-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
      >
        <span className="wn-frontmatter-label">
          {label}
          {required && <span className="wn-frontmatter-required">*</span>}
        </span>
        <span>{isExpanded ? "[-]" : "[+]"}</span>
      </button>
      {isExpanded && (
        <div className="wn-frontmatter-group-content">
          {Object.entries(fields).map(([fieldName, fieldDef]) => (
            <DynamicField
              key={fieldName}
              name={fieldName}
              field={fieldDef}
              value={objectValue[fieldName]}
              onChange={(fieldValue) =>
                handleFieldChange(fieldName, fieldValue)
              }
              disabled={disabled}
              onImageUpload={onImageUpload}
              collection={collection}
              contentId={contentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipField({
  id,
  label,
  value,
  collection,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: string | string[] | undefined;
  collection?: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  const api = useSharedApi();
  const [items, setItems] = useState<ContentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!collection) return;
    setLoading(true);
    setFetchError(null);
    api
      .getContentList(collection, { includeDrafts: true })
      .then((data) => setItems(data))
      .catch((err: unknown) =>
        setFetchError(
          err instanceof Error ? err.message : "Failed to load items"
        )
      )
      .finally(() => setLoading(false));
  }, [api, collection]);

  // Normalise to a single string ID (relationship fields store one reference)
  const currentValue = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      {loading ? (
        <select id={id} className="wn-frontmatter-select" disabled>
          <option>Loading {collection}…</option>
        </select>
      ) : fetchError ? (
        <select id={id} className="wn-frontmatter-select" disabled>
          <option>Error: {fetchError}</option>
        </select>
      ) : (
        <select
          id={id}
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="wn-frontmatter-select"
        >
          <option value="">
            {collection ? `Select from ${collection}…` : "Select…"}
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title || item.id}
            </option>
          ))}
        </select>
      )}
      {collection && !fetchError && (
        <span className="wn-frontmatter-hint">Collection: {collection}</span>
      )}
    </div>
  );
}

function RichTextField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-field wn-frontmatter-field--full">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Enter ${label.toLowerCase()}`}
        rows={8}
        className="wn-frontmatter-textarea wn-frontmatter-textarea--rich"
      />
    </div>
  );
}

function formatDatetimeForInput(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 16);
    }
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 16) ?? "";
      }
    } catch {
      return "";
    }
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 16) ?? "";
  }

  return "";
}

// Utilities

/**
 * Safely coerce an unknown value to boolean.
 * Avoids Boolean("false") === true by checking string representations explicitly.
 */
function normalizeBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0 || value === null || value === undefined)
    return false;
  return Boolean(value);
}

function formatFieldLabel(name: string): string {
  return (
    name
      // Insert space before a capital letter that follows a lowercase letter
      // (avoids splitting consecutive caps like "URL" → "U R L")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim()
  );
}

function formatDateForInput(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0] ?? "";
      }
    } catch {
      return "";
    }
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0] ?? "";
  }

  return "";
}
