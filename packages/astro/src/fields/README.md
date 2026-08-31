# Fields API Documentation

A TypeScript-first builder pattern for defining content schema fields in Astro projects.

## Overview

The Fields API provides a fluent, type-safe way to define the schema for your content collections. Instead of plain JSON objects, you use builder functions like `fields.text()`, `fields.select()`, etc.

### Why Use the Fields API?

- **Type Safety** - Full TypeScript inference with autocomplete
- **IDE Support** - Documented config options with hover tooltips
- **Validation** - Built-in validation rules for each field type
- **Composable** - Nest fields within objects, arrays, and blocks

## Quick Start

```typescript
// writenex.config.ts
import { defineConfig, collection, fields } from "@imjp/writenex-astro/config";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: "Slug" } }),
        publishedAt: fields.date({ label: "Published Date" }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
      },
    }),
  ],
});
```

## Installation

The Fields API is included with `@imjp/writenex-astro`. Import it from:

```typescript
import { fields, collection, singleton, defineConfig } from "@imjp/writenex-astro/config";
// or
import { fields, collection, singleton, defineConfig } from "@imjp/writenex-astro/config";
```

## Field Types

### Text Fields

#### `fields.text()`

Single or multi-line text input.

```typescript
fields.text({ label: "Title" })
fields.text({ label: "Description", multiline: true })
fields.text({ 
  label: "Bio",
  multiline: true,
  placeholder: "Tell us about yourself...",
  validation: { 
    isRequired: true,
    minLength: 10,
    maxLength: 500 
  }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `description` | `string` | Help text |
| `multiline` | `boolean` | Multi-line textarea (default: false) |
| `placeholder` | `string` | Placeholder text |
| `defaultValue` | `string` | Default value |
| `validation.isRequired` | `boolean` | Field is required |
| `validation.minLength` | `number` | Minimum character count |
| `validation.maxLength` | `number` | Maximum character count |
| `validation.pattern` | `string` | Regex pattern |
| `validation.patternDescription` | `string` | Pattern error message |

---

#### `fields.slug()`

URL-friendly slug field with auto-generation support.

```typescript
fields.slug({ label: "URL Slug" })
fields.slug({ 
  name: { label: "Name Slug", placeholder: "my-page" },
  pathname: { label: "URL Path", placeholder: "/pages/" }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `name.label` | `string` | Name field label |
| `name.placeholder` | `string` | Name placeholder |
| `pathname.label` | `string` | Path field label |
| `pathname.placeholder` | `string` | Path placeholder |

---

#### `fields.url()`

URL input with validation.

```typescript
fields.url({ label: "Website" })
fields.url({ 
  label: "GitHub Profile",
  placeholder: "https://github.com/username",
  validation: { isRequired: true }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `placeholder` | `string` | Placeholder URL |
| `validation.isRequired` | `boolean` | Field is required |

---

### Number Fields

#### `fields.number()`

Numeric input for decimals.

```typescript
fields.number({ label: "Price" })
fields.number({ 
  label: "Rating",
  placeholder: 4.5,
  validation: { min: 0, max: 5 }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `placeholder` | `number` | Placeholder value |
| `defaultValue` | `number` | Default value |
| `validation.isRequired` | `boolean` | Field is required |
| `validation.min` | `number` | Minimum value |
| `validation.max` | `number` | Maximum value |

---

#### `fields.integer()`

Whole number input.

```typescript
fields.integer({ label: "Quantity" })
fields.integer({ 
  label: "Year",
  validation: { min: 1900, max: 2100 }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `placeholder` | `number` | Placeholder value |
| `defaultValue` | `number` | Default value |
| `validation.isRequired` | `boolean` | Field is required |
| `validation.min` | `number` | Minimum value |
| `validation.max` | `number` | Maximum value |

---

### Selection Fields

#### `fields.select()`

Dropdown selection from options.

```typescript
fields.select({ 
  label: "Status",
  options: ["draft", "published", "archived"],
  defaultValue: "draft"
})

fields.select({
  label: "Category",
  options: ["technology", "lifestyle", "travel"],
  validation: { isRequired: true }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `options` | `string[]` | Selectable options (required) |
| `defaultValue` | `string` | Default option |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.multiselect()`

Multi-select with checkboxes or multi-select UI.

```typescript
fields.multiselect({ 
  label: "Tags",
  options: ["javascript", "typescript", "react", "node"],
  defaultValue: ["javascript"]
})

fields.multiselect({
  label: "Topics",
  options: ["frontend", "backend", "devops", "mobile"],
  validation: { isRequired: true }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `options` | `string[]` | Selectable options (required) |
| `defaultValue` | `string[]` | Default selections |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.checkbox()`

Boolean toggle.

```typescript
fields.checkbox({ label: "Published" })
fields.checkbox({ 
  label: "Featured",
  defaultValue: false
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `defaultValue` | `boolean` | Default state (default: false) |

---

### Date & Time Fields

#### `fields.date()`

Date picker.

```typescript
fields.date({ label: "Published Date" })
fields.date({ 
  label: "Event Date",
  defaultValue: "2024-01-15"
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `defaultValue` | `string` | Default date (YYYY-MM-DD) |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.datetime()`

Date and time picker.

```typescript
fields.datetime({ label: "Publish At" })
fields.datetime({ 
  label: "Event Date & Time",
  defaultValue: "2024-01-15T09:00"
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `defaultValue` | `string` | Default datetime (ISO format) |
| `validation.isRequired` | `boolean` | Field is required |

---

### File & Media Fields

#### `fields.image()`

Image upload with preview.

```typescript
fields.image({ label: "Hero Image" })
fields.image({ 
  label: "Thumbnail",
  directory: "public/images/blog",
  publicPath: "/images/blog"
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `directory` | `string` | Storage directory |
| `publicPath` | `string` | Public URL path |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.file()`

File upload for documents.

```typescript
fields.file({ label: "Attachment" })
fields.file({ 
  label: "PDF Document",
  directory: "public/files",
  publicPath: "/files"
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `directory` | `string` | Storage directory |
| `publicPath` | `string` | Public URL path |
| `validation.isRequired` | `boolean` | Field is required |

---

### Structured Fields

#### `fields.object()`

Nested group of fields.

```typescript
fields.object({
  label: "Author",
  fields: {
    name: fields.text({ label: "Name" }),
    email: fields.url({ label: "Email" }),
    bio: fields.text({ label: "Bio", multiline: true }),
  }
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `fields` | `Record<string, FieldDefinition>` | Nested fields (required) |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.array()`

List of items with the same schema.

```typescript
fields.array({
  label: "Tags",
  itemField: fields.text({ label: "Tag" }),
  itemLabel: "Tag"
})

fields.array({
  label: "Links",
  itemField: fields.object({
    fields: {
      title: fields.text({ label: "Title" }),
      url: fields.url({ label: "URL" }),
    }
  }),
  itemLabel: "Link"
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `itemField` | `FieldDefinition` | Schema for each item (required) |
| `itemLabel` | `string` | Label for items in editor |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.blocks()`

List of items with different block types.

```typescript
fields.blocks({
  label: "Content Blocks",
  blockTypes: {
    paragraph: {
      label: "Paragraph",
      fields: {
        text: fields.text({ label: "Text", multiline: true })
      }
    },
    quote: {
      label: "Quote",
      fields: {
        text: fields.text({ label: "Quote" }),
        attribution: fields.text({ label: "Attribution" })
      }
    },
    image: {
      label: "Image",
      fields: {
        src: fields.image({ label: "Image" }),
        caption: fields.text({ label: "Caption" })
      }
    }
  },
  itemLabel: "Block"
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `blockTypes` | `Record<string, BlockDefinition>` | Block type definitions (required) |
| `itemLabel` | `string` | Label for blocks in editor |

---

### Reference Fields

#### `fields.relationship()`

Reference to another collection item.

```typescript
fields.relationship({
  label: "Author",
  collection: "authors"
})

fields.relationship({
  label: "Related Posts",
  collection: "blog"
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `collection` | `string` | Target collection name (required) |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.pathReference()`

Reference to a file path.

```typescript
fields.pathReference({ label: "Template" })
fields.pathReference({ 
  label: "Layout",
  contentTypes: [".astro", ".mdx"]
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `contentTypes` | `string[]` | Allowed file extensions |

---

### Content Fields

#### `fields.markdoc()`

Markdoc rich content.

```typescript
fields.markdoc({ label: "Content" })
fields.markdoc({ 
  label: "Article Body",
  validation: { isRequired: true }
})
```

---

#### `fields.mdx()`

MDX content with component support.

```typescript
fields.mdx({ label: "Content" })
fields.mdx({ 
  label: "Documentation",
  validation: { isRequired: true }
})
```

---

### Conditional Fields

#### `fields.conditional()`

Show a field based on another field's value.

```typescript
fields.conditional({
  label: "CTA Button",
  matchField: "hasCTA",
  matchValue: true,
  showField: fields.object({
    fields: {
      text: fields.text({ label: "Button Text" }),
      url: fields.url({ label: "Link URL" }),
    }
  })
})

// With checkbox condition
fields.conditional({
  label: "External Link",
  matchField: "linkType",
  matchValue: "external",
  showField: fields.url({ label: "URL" })
})
```

**Config:**
| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `matchField` | `string` | Field name to check (required) |
| `matchValue` | `unknown` | Value to match (required) |
| `showField` | `FieldDefinition` | Field to show when matched (required) |

---

### Child & Nested Fields

#### `fields.child()`

Child document content.

```typescript
fields.child({ label: "Page Content" })
```

---

### Cloud & Placeholder Fields

#### `fields.cloudImage()`

Cloud-hosted image (future support).

```typescript
fields.cloudImage({ label: "Profile Picture" })
fields.cloudImage({ 
  label: "Avatar",
  provider: "cloudinary"
})
```

---

#### `fields.empty()`

Placeholder field (renders nothing).

```typescript
fields.empty({ label: "Reserved" })
```

---

#### `fields.emptyContent()`

Placeholder for empty content area.

```typescript
fields.emptyContent()
```

---

#### `fields.emptyDocument()`

Placeholder for empty document section.

```typescript
fields.emptyDocument()
```

---

#### `fields.ignored()`

Field is skipped in forms (useful for computed fields).

```typescript
fields.ignored({ label: "Internal ID" })
fields.ignored()
```

---

## Validation

All fields support validation options:

```typescript
fields.text({
  label: "Title",
  validation: {
    isRequired: true,
    minLength: 3,
    maxLength: 100,
    pattern: "^[A-Za-z]",
    patternDescription: "Must start with a letter"
  }
})

fields.number({
  label: "Price",
  validation: {
    isRequired: true,
    min: 0,
    max: 10000
  }
})
```

| Validation Option | Type | Applies To |
|-------------------|------|------------|
| `isRequired` | `boolean` | All fields |
| `min` | `number` | `number`, `integer` |
| `max` | `number` | `number`, `integer` |
| `minLength` | `number` | `text`, `url` |
| `maxLength` | `number` | `text`, `url` |
| `pattern` | `string` | `text`, `slug` |
| `patternDescription` | `string` | `text`, `slug` |

---

## Collections vs Singletons

> **Note:** `fields.*()` functions return `FieldDefinition` objects (with a `fieldKind` property) that are automatically resolved by `defineConfig`. You can pass them either directly in a raw collection object or wrapped in `collection()` / `singleton()` — both patterns work. Using `collection()` is recommended because it also provides better TypeScript type-checking of your schema.

### `collection()`

For multi-item content (blog posts, docs, products):

```typescript
collection({
  name: "blog",
  path: "src/content/blog",
  schema: {
    title: fields.text({ label: "Title", validation: { isRequired: true } }),
    slug: fields.slug({ name: { label: "Slug" } }),
    body: fields.mdx({ label: "Content" }),
  }
})
```

### `singleton()`

For single-item content (site settings, about page):

```typescript
singleton({
  name: "settings",
  path: "src/content/settings.json",
  schema: {
    siteName: fields.text({ label: "Site Name" }),
    tagline: fields.text({ label: "Tagline" }),
    logo: fields.image({ label: "Logo" }),
  }
})
```

### Both patterns are valid

```typescript
// Pattern A — raw object (fields are auto-resolved by defineConfig)
export default defineConfig({
  collections: [
    {
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title" }), // ✅ auto-resolved
      },
    },
  ],
});

// Pattern B — collection() helper (recommended for better TypeScript inference)
export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title" }), // ✅ resolved by collection()
      },
    }),
  ],
});
```

---

## Real-World Examples

### Blog Post Schema

```typescript
collection({
  name: "blog",
  path: "src/content/blog",
  filePattern: "{slug}.md",
  previewUrl: "/blog/{slug}",
  schema: {
    title: fields.text({ 
      label: "Title",
      validation: { isRequired: true, maxLength: 100 }
    }),
    slug: fields.slug({ 
      name: { label: "Slug" },
      pathname: { label: "Path", placeholder: "/blog/" }
    }),
    description: fields.text({ 
      label: "Description",
      multiline: true,
      validation: { maxLength: 300 }
    }),
    publishedAt: fields.date({ label: "Published Date" }),
    updatedAt: fields.datetime({ label: "Last Updated" }),
    author: fields.relationship({ label: "Author", collection: "authors" }),
    heroImage: fields.image({ label: "Hero Image" }),
    tags: fields.multiselect({ 
      label: "Tags",
      options: ["javascript", "typescript", "react", "astro", "node"]
    }),
    draft: fields.checkbox({ label: "Draft", defaultValue: true }),
    body: fields.mdx({ label: "Content", validation: { isRequired: true } }),
  }
})
```

### Documentation Schema

```typescript
collection({
  name: "docs",
  path: "src/content/docs",
  filePattern: "{slug}/index.md",
  previewUrl: "/docs/{slug}",
  schema: {
    title: fields.text({ label: "Title", validation: { isRequired: true } }),
    description: fields.text({ label: "Description" }),
    order: fields.integer({ label: "Sort Order" }),
    category: fields.select({
      label: "Category",
      options: ["getting-started", "guides", "api-reference", "tutorials"]
    }),
    children: fields.child({ label: "Child Pages" }),
    body: fields.markdoc({ label: "Content" }),
  }
})
```

### Product Catalog Schema

```typescript
collection({
  name: "products",
  path: "src/content/products",
  filePattern: "{slug}.md",
  previewUrl: "/products/{slug}",
  schema: {
    name: fields.text({ label: "Product Name", validation: { isRequired: true } }),
    slug: fields.slug({ name: { label: "URL Slug" } }),
    price: fields.number({ label: "Price" }),
    compareAtPrice: fields.number({ label: "Compare At Price" }),
    sku: fields.text({ label: "SKU" }),
    description: fields.text({ label: "Description", multiline: true }),
    images: fields.array({
      label: "Product Images",
      itemField: fields.image({ label: "Image" }),
      itemLabel: "Image"
    }),
    category: fields.relationship({ label: "Category", collection: "categories" }),
    tags: fields.multiselect({ 
      label: "Tags",
      options: ["new", "sale", "featured", "bestseller"]
    }),
    inStock: fields.checkbox({ label: "In Stock", defaultValue: true }),
    featured: fields.checkbox({ label: "Featured Product" }),
    specs: fields.object({
      label: "Specifications",
      fields: {
        weight: fields.text({ label: "Weight" }),
        dimensions: fields.text({ label: "Dimensions" }),
        material: fields.text({ label: "Material" }),
      }
    }),
  }
})
```

### Author Profile Schema

```typescript
collection({
  name: "authors",
  path: "src/content/authors",
  filePattern: "{slug}.md",
  previewUrl: "/authors/{slug}",
  schema: {
    name: fields.text({ label: "Name", validation: { isRequired: true } }),
    slug: fields.slug({ name: { label: "Slug" } }),
    avatar: fields.image({ label: "Avatar" }),
    role: fields.select({
      label: "Role",
      options: ["author", "editor", "contributor", "admin"],
      defaultValue: "author"
    }),
    bio: fields.text({ label: "Bio", multiline: true }),
    social: fields.object({
      label: "Social Links",
      fields: {
        twitter: fields.url({ label: "Twitter" }),
        github: fields.url({ label: "GitHub" }),
        linkedin: fields.url({ label: "LinkedIn" }),
        website: fields.url({ label: "Website" }),
      }
    }),
    email: fields.url({ label: "Email" }),
    featured: fields.checkbox({ label: "Featured Author", defaultValue: false }),
  }
})
```

---

## Migration from Plain Schema

If you have an existing plain schema config, here's how to migrate:

### Before (Plain Schema)

```typescript
export default defineConfig({
  collections: [
    {
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: { type: "string", required: true },
        description: { type: "string" },
        pubDate: { type: "date", required: true },
        draft: { type: "boolean", default: false },
        tags: { type: "array", items: "string" },
        heroImage: { type: "image" },
      },
    },
  ],
});
```

### After (Fields API)

```typescript
import { defineConfig, collection, fields } from "@imjp/writenex-astro/config";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        description: fields.text({ label: "Description" }),
        pubDate: fields.date({ label: "Published Date", validation: { isRequired: true } }),
        draft: fields.checkbox({ label: "Draft", defaultValue: false }),
        tags: fields.array({ label: "Tags", itemField: fields.text({ label: "Tag" }) }),
        heroImage: fields.image({ label: "Hero Image" }),
      },
    }),
  ],
});
```

### Type Mapping

| Plain Schema | Fields API |
|--------------|------------|
| `type: "string"` | `fields.text()` |
| `type: "number"` | `fields.number()` |
| `type: "boolean"` | `fields.checkbox()` |
| `type: "date"` | `fields.date()` |
| `type: "array"` | `fields.array({ itemField: ... })` |
| `type: "object"` | `fields.object({ fields: ... })` |
| `type: "image"` | `fields.image()` |

---

## Troubleshooting

### `Invalid configuration: type: Invalid option`

If you see this on an older version of `@imjp/writenex-astro`:

```
[writenex] Invalid configuration:
  - collections.0.schema.title.type: Invalid option: expected one of "string"|"number"|...
```

Upgrade to the latest version — `defineConfig` now auto-resolves `fields.*()` objects in both raw collection objects and `collection()` wrappers.

### Config file not loading

1. Ensure `writenex.config.ts` is in your project root
2. Check the file has proper exports: `export default defineConfig({ ... })`
3. Restart the dev server after making changes

### Field types not rendering correctly

1. Verify the field type is spelled correctly (e.g., `fields.text`, not `fields.string`)
2. Check that required config properties are provided (e.g., `options` for `select`)
3. For `object` and `array`, ensure `fields` or `itemField` is properly nested

### Validation not working

1. Ensure `validation` object is inside the field config, not outside
2. Check that validation rules match the field type (e.g., `min`/`max` for numbers)
3. Remember `isRequired` only validates on form submission

### Collection not found for relationship

1. Verify the `collection` name matches exactly (case-sensitive)
2. Ensure the referenced collection is also defined in your config
3. Check that the referenced collection has at least one item

### Auto-generated slug not working

1. Ensure the `slug` field exists and is properly configured
2. Check if there's a `title` field - slug generation often depends on it
3. Verify the slug field config has proper name/pathname labels

---

## API Reference

### Exports

```typescript
// From @imjp/writenex-astro/config or @writenex/astro/config
import {
  fields,           // Field builder object
  collection,      // Multi-item content helper
  singleton,       // Single-item content helper
  defineConfig,    // Config definition function
} from "@imjp/writenex-astro/config";
```

### Field Builder Methods

| Method | Description |
|--------|-------------|
| `fields.text()` | Single/multi-line text |
| `fields.slug()` | URL-friendly slug |
| `fields.url()` | URL input |
| `fields.number()` | Decimal number |
| `fields.integer()` | Whole number |
| `fields.select()` | Dropdown selection |
| `fields.multiselect()` | Multi-select |
| `fields.checkbox()` | Boolean toggle |
| `fields.date()` | Date picker |
| `fields.datetime()` | Date & time picker |
| `fields.image()` | Image upload |
| `fields.file()` | File upload |
| `fields.object()` | Nested fields group |
| `fields.array()` | List of items |
| `fields.blocks()` | Multiple block types |
| `fields.relationship()` | Reference to other collection |
| `fields.pathReference()` | File path reference |
| `fields.markdoc()` | Markdoc content |
| `fields.mdx()` | MDX content |
| `fields.conditional()` | Conditional field display |
| `fields.child()` | Child document |
| `fields.cloudImage()` | Cloud image (future) |
| `fields.empty()` | Placeholder field |
| `fields.emptyContent()` | Empty content placeholder |
| `fields.emptyDocument()` | Empty document placeholder |
| `fields.ignored()` | Skip from forms |
