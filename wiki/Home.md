# Writenex for Astro

**Visual editing for Astro content collections.** Writenex adds a WYSIWYG editor to your Astro site at `/_writenex` — manage markdown/MDX content in the browser while everything stays as plain files in `src/content/`.

## Why Writenex?

- **No database, no vendor lock-in** — your content is plain markdown/MDX on disk, exactly where Astro expects it
- **Zero config** — collections and frontmatter schemas are auto-discovered from existing content
- **Full control when you want it** — the TypeScript-first Fields API defines forms with 25+ field types
- **Optional Remote CMS** — password-protect the editor and use it on your live domain
- **Production safe** — disabled in production builds unless you explicitly opt in

## Documentation

| Section | What's in it |
| --- | --- |
| [Installation](Installation) | Add the integration to an Astro project |
| [Quick Start](Quick-Start) | Your first editing session in 3 minutes |
| [Configuration Reference](Configuration) | Every config option explained |
| [Collections & Singletons](Collections-and-Singletons) | Defining and auto-discovering content |
| [Fields API](Fields-API) | All field types with examples |
| [Validation](Validation) | Rules for schema fields |
| [Editor UI Guide](Editor-UI) | Shortcuts, autosave, drafts, search |
| [Images](Images) | Upload strategies and discovery |
| [Version History](Version-History) | Automatic snapshots and restore |
| [File Patterns](File-Patterns) | Naming schemes like `{year}/{slug}.md` |
| [REST API](REST-API) | Every endpoint with curl examples |
| [Remote CMS](Remote-CMS) | Password-protected editor on your live site |
| [Security](Security) | Auth, production guard, hardening |
| [Troubleshooting](Troubleshooting) | Common problems and fixes |
| [FAQ](FAQ) | Frequently asked questions |

## Quick Example

```typescript
// astro.config.mjs
import { defineConfig } from "astro/config";
import writenex from "@imjp/writenex-astro";

export default defineConfig({
  integrations: [writenex()],
});
```

Run `astro dev`, open `http://localhost:4321/_writenex`, and start editing. See the [Quick Start](Quick-Start) for the full walkthrough.

---

*Part of the [Writenex](https://github.com/jaainil/writenex) monorepo · MIT License*
