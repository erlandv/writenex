/**
 * @fileoverview Frontmatter form panel component for editing content metadata
 *
 * This component provides a collapsible panel on the right side for editing
 * frontmatter fields. It supports schema-aware dynamic fields when a collection
 * schema is available, or falls back to basic fields.
 *
 * @module @writenex/astro/client/components/FrontmatterForm
 */

import { useCallback, useState } from "react";
import { X, Info } from "lucide-react";
import type { CollectionSchema, SchemaField } from "../../../types";
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
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <p className="wn-frontmatter-empty-text">No content selected</p>
      <p className="wn-frontmatter-empty-hint">
        Select a content item from the sidebar to edit its frontmatter
      </p>
    </div>
  );
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
}: {
  frontmatter: Record<string, unknown>;
  schema: CollectionSchema;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
}): React.ReactElement {
  const sortedFields = Object.entries(schema).sort(
    ([aKey, aField], [bKey, bField]) => {
      if (aField.required && !bField.required) return -1;
      if (!aField.required && bField.required) return 1;
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
}: {
  name: string;
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
}): React.ReactElement {
  const fieldId = `fm-${name}`;
  const label = formatFieldLabel(name);
  const enumOptions = parseEnumFromDescription(field.description);

  switch (field.type) {
    case "boolean":
      return (
        <BooleanField
          id={fieldId}
          label={label}
          value={Boolean(value ?? field.default)}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "number":
      return (
        <NumberField
          id={fieldId}
          label={label}
          value={value as number | undefined}
          onChange={onChange}
          disabled={disabled}
          required={field.required}
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

    case "array":
      return (
        <ArrayField
          id={fieldId}
          label={label}
          value={value as unknown[] | undefined}
          itemType={field.items}
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
        />
      );

    case "string":
    default:
      if (enumOptions.length > 0) {
        return (
          <SelectField
            id={fieldId}
            label={label}
            value={String(value ?? "")}
            options={enumOptions}
            onChange={onChange}
            disabled={disabled}
            required={field.required}
          />
        );
      }

      const isMultiline =
        name === "description" || name === "excerpt" || name === "summary";

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
}: BaseFieldProps & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}): React.ReactElement {
  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <input
        id={id}
        type="number"
        value={value ?? ""}
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
  onChange: (value: string) => void;
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
        onChange={(e) => onChange(e.target.value)}
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
  onChange,
  disabled,
  required,
}: BaseFieldProps & {
  value: unknown[] | undefined;
  itemType?: string;
  onChange: (value: unknown[]) => void;
}): React.ReactElement {
  const [inputValue, setInputValue] = useState("");
  const items = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    let newItem: unknown = inputValue.trim();
    if (itemType === "number") {
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
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="wn-frontmatter-tag-remove"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        type={itemType === "number" ? "number" : "text"}
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
}: BaseFieldProps & {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onUpload?: (file: File) => Promise<string | null>;
}): React.ReactElement {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(true);
    try {
      const path = await onUpload(file);
      if (path) {
        onChange(path);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="wn-frontmatter-field">
      <label htmlFor={id} className="wn-frontmatter-label">
        {label}
        {required && <span className="wn-frontmatter-required">*</span>}
      </label>
      <div className="wn-frontmatter-image-field">
        <input
          id={id}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
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

// Utilities

function formatFieldLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
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

function parseEnumFromDescription(description?: string): string[] {
  if (!description) return [];
  const match = description.match(/^Options:\s*(.+)$/i);
  if (!match || !match[1]) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
