# Configuration Reference

Writenex is configured two ways:

1. **`writenex.config.ts`** (project root) — collections, schemas, images, editor, discovery, version history, remote CMS
2. **Integration options** (`astro.config.mjs`) — `allowProduction` and a `remoteCms` override

Both are optional. With no config at all, Writenex auto-discovers collections and infers schemas.

## How config is loaded

1. Writenex looks for `writenex.config.ts` / `.mts` / `.js` / `.mjs` in the project root
2. The file's default export is validated (Zod) — invalid values produce warnings, not crashes
3. Defaults are applied to every section you omit
4. Integration-level `remoteCms` options override the config file's `remoteCms` section

Config changes require a dev server restart.

## Full example

```typescript
// writenex.config.ts
import { defineConfig, collection, singleton, fields } from "@imjp/writenex-astro";

export default defineConfig({
  // Content collections (multi-item)
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      filePattern: "{slug}.md",
      previewUrl: "/blog/{slug}",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        pubDate: fields.date({ label: "Published Date" }),
        body: fields.mdx({ label: "Content" }),
      },
    }),
  ],

  // Single pages (settings, about, etc.)
  singletons: [
    singleton({
      name: "settings",
      path: "src/content/settings.json",
      schema: {
        siteTitle: fields.text({ label: "Site Title" }),
      },
    }),
  ],

  // Image storage strategy
  images: {
    strategy: "colocated",
    publicPath: "/images",
    storagePath: "public/images",
  },

  // Editor behavior
  editor: {
    autosave: true,
    autosaveInterval: 3000,
  },

  // Auto-discovery of collections
  discovery: {
    enabled: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
  },

  // Automatic version snapshots
  versionHistory: {
    enabled: true,
    maxVersions: 20,
    storagePath: ".writenex/versions",
  },

  // Optional password protection
  remoteCms: {
    enabled: false,
  },
});
```

## Section reference

### `collections`

Array of [collection configs](Collections-and-Singletons). See that page for the full table.

### `singletons`

Same shape as collections, but for single files (site settings, about page). Path points at the file itself, not a folder.

### `images`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `strategy` | `"colocated" \| "public" \| "custom"` | `"colocated"` | Where uploads are stored |
| `publicPath` | `string` | `"/images"` | URL prefix for `public` strategy |
| `storagePath` | `string` | `"public/images"` | Disk path for `public` strategy |

Details: [Images](Images).

### `editor`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `autosave` | `boolean` | `true` | Save automatically while editing |
| `autosaveInterval` | `number` | `3000` | Milliseconds between autosaves |

### `discovery`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Auto-discover collections from `src/content/` |
| `ignore` | `string[]` | `["**/node_modules/**", "**/.git/**", "**/dist/**"]` | Glob patterns to skip |

Configured `collections` are **merged** with discovered ones — explicit config wins for the same collection name.

### `versionHistory`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Snapshot before every save |
| `maxVersions` | `number` | `20` | Max unlabeled snapshots per item |
| `storagePath` | `string` | `".writenex/versions"` | Where snapshots live (gitignored) |

Details: [Version History](Version-History).

### `remoteCms`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `false` | Password-protect the editor |
| `username` | `string` | env fallback | Admin username |
| `password` | `string` | env fallback | Admin password |
| `secret` | `string` | env fallback | Session signing secret |
| `sessionTtl` | `number` | `604800` | Session lifetime (seconds) |

Details: [Remote CMS](Remote-CMS).

## Integration options (`astro.config.mjs`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowProduction` | `boolean` | `false` | Allow the integration to run in production builds |
| `remoteCms` | `object` | — | Overrides the `remoteCms` section of `writenex.config.ts` |

```typescript
writenex({
  allowProduction: false,
});
```

## Programmatic config API

Everything is exported for programmatic use:

```typescript
import {
  defineConfig,   // define + validate a config
  loadConfig,     // load config from a project root
  validateConfig, // validate a config object
  collection,     // collection() helper
  singleton,      // singleton() helper
  fields,         // field builders
} from "@imjp/writenex-astro";
```

## Common mistakes

- **Config file not loading** — make sure it's named exactly `writenex.config.ts` and is in the project root, with a default export
- **Warnings like `Invalid option: expected one of...`** — you're using a raw schema object where the type name isn't a valid [field type](Fields-API); prefer `fields.*()` builders which are auto-resolved
- **`secret` too short** — if you set `remoteCms.secret` explicitly it must be at least 8 characters (better: don't set it, use the `WRITENEX_SECRET` env var)
