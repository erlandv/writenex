# Fields API

The Fields API is a TypeScript-first builder pattern for defining the editing forms shown in the frontmatter panel.

```typescript
import { defineConfig, collection, fields } from "@imjp/writenex-astro/config";
```

`defineConfig` auto-resolves `fields.*()` objects whether you use the `collection()` helper or plain objects — both patterns are valid:

```typescript
// Pattern A — raw object
export default defineConfig({
  collections: [
    {
      name: "blog",
      path: "src/content/blog",
      schema: { title: fields.text({ label: "Title" }) },
    },
  ],
});

// Pattern B — collection() helper (better TypeScript inference)
export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: { title: fields.text({ label: "Title" }) },
    }),
  ],
});
```

## Field index

| Category | Builders |
| --- | --- |
| Text | [`text`](#fieldstext) · [`slug`](#fieldsslug) · [`url`](#fieldsurl) |
| Number | [`number`](#fieldsnumber) · [`integer`](#fieldsinteger) |
| Selection | [`select`](#fieldsselect) · [`multiselect`](#fieldsmultiselect) · [`checkbox`](#fieldscheckbox) |
| Date & time | [`date`](#fieldsdate) · [`datetime`](#fieldsdatetime) |
| File & media | [`image`](#fieldsimage) · [`file`](#fieldsfile) |
| Structured | [`object`](#fieldsobject) · [`array`](#fieldsarray) · [`blocks`](#fieldsblocks) |
| Reference | [`relationship`](#fieldsrelationship) · [`pathReference`](#fieldspathreference) |
| Content | [`markdoc`](#fieldsmarkdoc) · [`mdx`](#fieldsmdx) |
| Conditional | [`conditional`](#fieldsconditional) |
| Special | [`child`](#fieldschild) · [`cloudImage`](#fieldscloudimage) · [`empty`](#fieldsempty) · [`emptyContent`](#fieldsemptycontent) · [`emptyDocument`](#fieldsemptydocument) · [`ignored`](#fieldsignored) |

Common options on (almost) every field: `label`, `description` (help text), `defaultValue`, and [`validation`](Validation).

---

## Text Fields

### `fields.text()`

Single or multi-line text input.

```typescript
fields.text({ label: "Title" })
fields.text({ label: "Description", multiline: true })
fields.text({
  label: "Bio",
  multiline: true,
  placeholder: "Tell us about yourself...",
  validation: { isRequired: true, minLength: 10, maxLength: 500 },
})
```

| Option | Type | Description |
| --- | --- | --- |
| `label` | `string` | Display label |
| `description` | `string` | Help text |
| `multiline` | `boolean` | Multi-line textarea (default `false`) |
| `placeholder` | `string` | Placeholder text |
| `defaultValue` | `string` | Default value |
| `validation` | `object` | See [Validation](Validation) |

### `fields.slug()`

URL-friendly slug field with auto-generation support.

```typescript
fields.slug({ label: "URL Slug" })
fields.slug({
  name: { label: "Name Slug", placeholder: "my-page" },
  pathname: { label: "URL Path", placeholder: "/pages/" },
})
```

### `fields.url()`

URL input with validation.

```typescript
fields.url({ label: "Website" })
fields.url({
  label: "GitHub Profile",
  placeholder: "https://github.com/username",
  validation: { isRequired: true },
})
```

---

## Number Fields

### `fields.number()`

Numeric input for decimals.

```typescript
fields.number({ label: "Price" })
fields.number({ label: "Rating", placeholder: 4.5, validation: { min: 0, max: 5 } })
```

### `fields.integer()`

Whole number input.

```typescript
fields.integer({ label: "Quantity" })
fields.integer({ label: "Year", validation: { min: 1900, max: 2100 } })
```

Both support `placeholder`, `defaultValue`, and `validation.min` / `validation.max`.

---

## Selection Fields

### `fields.select()`

Dropdown selection.

```typescript
fields.select({
  label: "Status",
  options: ["draft", "published", "archived"],
  defaultValue: "draft",
})
```

`options` is required.

### `fields.multiselect()`

Multi-select with checkboxes.

```typescript
fields.multiselect({
  label: "Tags",
  options: ["javascript", "typescript", "react", "node"],
  defaultValue: ["javascript"],
})
```

### `fields.checkbox()`

Boolean toggle.

```typescript
fields.checkbox({ label: "Published" })
fields.checkbox({ label: "Featured", defaultValue: false })
```

---

## Date & Time Fields

### `fields.date()`

Date picker. Values are `YYYY-MM-DD`.

```typescript
fields.date({ label: "Published Date" })
fields.date({ label: "Event Date", defaultValue: "2024-01-15" })
```

### `fields.datetime()`

Date + time picker. Values are ISO format.

```typescript
fields.datetime({ label: "Publish At" })
fields.datetime({ label: "Event Date & Time", defaultValue: "2024-01-15T09:00" })
```

---

## File & Media Fields

### `fields.image()`

Image upload with preview. Storage follows the collection's [image strategy](Images) unless overridden.

```typescript
fields.image({ label: "Hero Image" })
fields.image({
  label: "Thumbnail",
  directory: "public/images/blog",
  publicPath: "/images/blog",
})
```

| Option | Type | Description |
| --- | --- | --- |
| `directory` | `string` | Override storage directory |
| `publicPath` | `string` | Override public URL path |

### `fields.file()`

File upload for documents.

```typescript
fields.file({
  label: "PDF Document",
  directory: "public/files",
  publicPath: "/files",
})
```

---

## Structured Fields

### `fields.object()`

Nested group of fields.

```typescript
fields.object({
  label: "Author",
  fields: {
    name: fields.text({ label: "Name" }),
    email: fields.url({ label: "Email" }),
    bio: fields.text({ label: "Bio", multiline: true }),
  },
})
```

### `fields.array()`

List of items sharing one schema.

```typescript
// Simple list
fields.array({
  label: "Tags",
  itemField: fields.text({ label: "Tag" }),
  itemLabel: "Tag",
})

// List of objects
fields.array({
  label: "Links",
  itemField: fields.object({
    fields: {
      title: fields.text({ label: "Title" }),
      url: fields.url({ label: "URL" }),
    },
  }),
  itemLabel: "Link",
})
```

| Option | Type | Description |
| --- | --- | --- |
| `itemField` | `FieldDefinition` | Schema for each item (**required**) |
| `itemLabel` | `string` | Label shown per item |

### `fields.blocks()`

List of items with **different** block types.

```typescript
fields.blocks({
  label: "Content Blocks",
  blockTypes: {
    paragraph: {
      label: "Paragraph",
      fields: { text: fields.text({ label: "Text", multiline: true }) },
    },
    quote: {
      label: "Quote",
      fields: {
        text: fields.text({ label: "Quote" }),
        attribution: fields.text({ label: "Attribution" }),
      },
    },
    image: {
      label: "Image",
      fields: {
        src: fields.image({ label: "Image" }),
        caption: fields.text({ label: "Caption" }),
      },
    },
  },
  itemLabel: "Block",
})
```

---

## Reference Fields

### `fields.relationship()`

Reference to another collection item.

```typescript
fields.relationship({ label: "Author", collection: "authors" })
```

`collection` is required and must match a configured/discovered collection name.

### `fields.pathReference()`

Reference to a file path in the project.

```typescript
fields.pathReference({ label: "Template" })
fields.pathReference({ label: "Layout", contentTypes: [".astro", ".mdx"] })
```

---

## Content Fields

### `fields.markdoc()`

Markdoc rich content.

```typescript
fields.markdoc({ label: "Content" })
```

### `fields.mdx()`

MDX content with component support.

```typescript
fields.mdx({ label: "Content", validation: { isRequired: true } })
```

---

## Conditional Fields

### `fields.conditional()`

Show a field only when another field has a specific value.

```typescript
fields.conditional({
  label: "CTA Button",
  matchField: "hasCTA",
  matchValue: true,
  showField: fields.object({
    fields: {
      text: fields.text({ label: "Button Text" }),
      url: fields.url({ label: "Link URL" }),
    },
  }),
})

fields.conditional({
  label: "External Link",
  matchField: "linkType",
  matchValue: "external",
  showField: fields.url({ label: "URL" }),
})
```

| Option | Type | Description |
| --- | --- | --- |
| `matchField` | `string` | Field name to watch (**required**) |
| `matchValue` | `unknown` | Value that triggers display (**required**) |
| `showField` | `FieldDefinition` | Field to show/hide (**required**) |

---

## Special Fields

### `fields.child()`

Child document content (nested pages).

```typescript
fields.child({ label: "Page Content" })
```

### `fields.cloudImage()`

Cloud-hosted image (future support).

```typescript
fields.cloudImage({ label: "Profile Picture" })
```

### `fields.empty()`, `fields.emptyContent()`, `fields.emptyDocument()`

Placeholders — render nothing in the form.

### `fields.ignored()`

Skipped in forms — useful for computed fields the editor shouldn't touch.

```typescript
fields.ignored({ label: "Internal ID" })
```

---

## Migrating from plain schema objects

| Plain schema | Fields API |
| --- | --- |
| `type: "string"` | `fields.text()` |
| `type: "number"` | `fields.number()` |
| `type: "boolean"` | `fields.checkbox()` |
| `type: "date"` | `fields.date()` |
| `type: "array"` | `fields.array({ itemField: ... })` |
| `type: "object"` | `fields.object({ fields: ... })` |
| `type: "image"` | `fields.image()` |

```typescript
// Before
title: { type: "string", required: true },

// After
title: fields.text({ label: "Title", validation: { isRequired: true } }),
```

## Complete examples

See ready-to-use schemas in the package README: [blog](https://github.com/jaainil/writenex/blob/main/packages/astro/README.md#blog-post-schema) · [docs](https://github.com/jaainil/writenex/blob/main/packages/astro/README.md#documentation-schema) · [products](https://github.com/jaainil/writenex/blob/main/packages/astro/README.md#product-catalog-schema) · [authors](https://github.com/jaainil/writenex/blob/main/packages/astro/README.md#author-profile-schema).
