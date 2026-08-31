# Collections & Singletons

How Writenex maps your content folders into editable collections.

## Collections vs Singletons

| | Collection | Singleton |
| --- | --- | --- |
| Use for | Blog posts, docs, products… | Site settings, about page… |
| Content | Many items in a folder | One file |
| Sidebar | Listed with item count | Listed directly |
| Path | Directory (`src/content/blog`) | File (`src/content/settings.json`) |

## Auto-discovery (zero config)

By default, Writenex scans `src/content/` and treats every folder as a collection. For each collection it:

1. Detects the [file pattern](File-Patterns) from existing files (`{slug}.md`, `{slug}/index.md`, `{year}/{slug}.md`, …)
2. Infers the frontmatter schema from existing files (title → text, dates → date pickers, booleans → checkboxes…)
3. Suggests a preview URL (`/{collection}/{slug}`) unless `previewUrl` is configured

```
src/content/
├── blog/        → collection "blog" (discovered)
├── docs/        → collection "docs" (discovered)
├── authors/     → collection "authors" (discovered)
└── settings.json → (singletons need explicit config)
```

Ignore patterns can exclude folders via the `discovery` config:

```typescript
discovery: {
  enabled: true,
  ignore: ["**/drafts/**", "**/archive/**"],
}
```

## Explicit configuration

For full control — schemas, file patterns, preview URLs — define collections explicitly in `writenex.config.ts`:

```typescript
import { defineConfig, collection, fields } from "@imjp/writenex-astro";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      filePattern: "{slug}.md",
      previewUrl: "/blog/{slug}",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        description: fields.text({ label: "Description", multiline: true }),
        pubDate: fields.date({ label: "Published Date", validation: { isRequired: true } }),
        heroImage: fields.image({ label: "Hero Image" }),
        tags: fields.multiselect({
          label: "Tags",
          options: ["javascript", "typescript", "react", "astro"],
        }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        body: fields.mdx({ label: "Content", validation: { isRequired: true } }),
      },
    }),
  ],
});
```

## Collection options

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Collection identifier (shown in the sidebar; should match the folder name for discovery) |
| `path` | `string` | Path to the collection directory |
| `filePattern` | `string` | File naming pattern for new content — e.g. `{slug}.md`. Auto-detected if omitted |
| `previewUrl` | `string` | URL pattern for the Preview button — e.g. `/blog/{slug}`. Supports `{slug}` and any frontmatter key (`{pubDate}`, `{author}`…) |
| `schema` | `object` | Form schema using the [Fields API](Fields-API) |
| `images` | `object` | Per-collection [image strategy](Images) override |

### Preview URL tokens

- `{slug}` — the content ID
- Any `{frontmatterKey}` — replaced with the frontmatter value (e.g. `{year}`, `{author}`)

Astro's `trailingSlash` setting is respected when building preview URLs.

## Singletons

For single files — site settings, homepage content, etc.:

```typescript
import { defineConfig, singleton, fields } from "@imjp/writenex-astro";

export default defineConfig({
  singletons: [
    singleton({
      name: "settings",
      path: "src/content/settings.json",
      previewUrl: "/",
      schema: {
        siteTitle: fields.text({ label: "Site Title", validation: { isRequired: true } }),
        description: fields.text({ label: "Meta Description", multiline: true }),
      },
    }),
  ],
});
```

Singletons require explicit configuration — they are not auto-discovered.

## Merging behavior

Explicit collections and discovered collections are merged:

- Same `name` → the explicit config wins (its schema, pattern, preview URL)
- Discovered-only collections still appear with inferred settings

## Astro content collections

Writenex works with the files directly — it does not depend on Astro's `src/content/config.ts` collection definitions. If you use Astro's Content Collections API, keep your `defineCollection()` schemas in sync manually (or generate them from the same shape).
