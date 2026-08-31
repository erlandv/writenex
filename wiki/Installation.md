# Installation

## Requirements

| Requirement | Version |
| --- | --- |
| Astro | 4.x, 5.x, 6.x, or 7.x |
| React | 18.x or 19.x |
| Node.js | 22.12.0+ |

## Option 1: `astro add` (recommended)

```bash
npx astro add @imjp/writenex-astro
```

This installs the package and automatically adds it to your `astro.config.mjs`.

## Option 2: Manual install

```bash
# npm
npm install @imjp/writenex-astro

# pnpm
pnpm add @imjp/writenex-astro

# yarn
yarn add @imjp/writenex-astro
```

Then add the integration:

```typescript
// astro.config.mjs
import { defineConfig } from "astro/config";
import writenex from "@imjp/writenex-astro";

export default defineConfig({
  integrations: [writenex()],
});
```

## What gets installed

- The integration (server-side) — runs inside your Astro dev server / SSR output
- The editor UI (client-side) — a pre-bundled React app served at `/_writenex/assets/*`

Nothing else changes in your project. Writenex does not modify your pages, routes, or build output unless you [enable the Remote CMS](Remote-CMS#production-deployment).

## Verify it works

```bash
astro dev
```

Open `http://localhost:4321/_writenex`. You should see the editor with your collections auto-discovered from `src/content/`.

> **No collections?** Create one: `mkdir -p src/content/blog` and add a `hello.md` file with some frontmatter. Writenex discovers folders inside `src/content/` automatically — see [Collections & Singletons](Collections-and-Singletons).

## Optional: config file

For full control over collections, schemas, and image handling, create `writenex.config.ts` in your project root:

```typescript
import { defineConfig, collection, fields } from "@imjp/writenex-astro";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
      },
    }),
  ],
});
```

Full details: [Configuration Reference](Configuration).

## Next steps

- [Quick Start](Quick-Start) — walkthrough of the editor
- [Remote CMS](Remote-CMS) — use the editor on your live site
- [Fields API](Fields-API) — customize your editing forms
