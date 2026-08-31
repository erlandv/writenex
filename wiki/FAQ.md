# FAQ

## General

**Does Writenex modify my site's build output?**
No. In development it hooks into the dev server; in production it's disabled unless you [enable the Remote CMS](Remote-CMS), which only adds routes under `/_writenex`.

**Where is my content stored?**
Plain markdown/MDX files in `src/content/` — exactly where Astro expects them. Writenex never wraps content in a database or proprietary format.

**Can I still edit files manually?**
Yes — the editor reads from disk on refresh (`Ctrl/Cmd + Shift + R`). The dev server watches files and invalidates caches automatically.

**Does it work with Astro's Content Collections (`defineCollection`)?**
Yes. Writenex reads the files directly and infers schemas, so it doesn't depend on `src/content.config.ts`. Keep both schemas in sync manually if you use both.

**Which Astro versions are supported?**
Astro 4.x, 5.x, 6.x, and 7.x with React 18/19 and Node.js 22.12+.

## Editing

**What happens if two people edit the same file?**
Updates support mtime-based conflict detection: if the file changed on disk since you opened it, the save returns a 409 with both versions so you can resolve instead of overwriting.

**Can I undo a bad save?**
Yes — every save snapshots the previous version. Open the History panel (clock icon) to diff and restore. See [Version History](Version-History).

**Does autosave overwrite my manual edits outside the editor?**
Autosave only fires when the editor has unsaved changes. If the file changed on disk in the meantime, conflict detection kicks in (see above).

**How do new files get named?**
Following the collection's [file pattern](File-Patterns) — auto-detected from existing files or configured explicitly (`{slug}.md`, `{year}/{slug}.md`, …).

## Remote CMS

**Do I need a database?**
No. Content is files on disk; sessions are signed cookies. There is nothing to provision.

**Is it safe to expose on a public domain?**
When enabled, the editor sits behind an authenticated session (signed HttpOnly cookie, rate-limited login, fail-closed misconfiguration handling). Follow the [Security](Security#hardening-checklist) checklist — HTTPS, env-var credentials, reverse proxy.

**Can multiple people use it?**
Currently a single admin account. You can front it with your own auth proxy (e.g. oauth2-proxy) for team access.

**Can I use it on Vercel/Netlify/serverless?**
The CMS needs to read and write files at runtime — self-hosted Node (node adapter) is the supported target. Serverless platforms with read-only or ephemeral filesystems won't work.

**How do I turn it off?**
Remove `remoteCms` (or set `enabled: false`) and rebuild — the routes disappear from the output.

**What happens to my Git repo when the CMS edits content?**
Files under `src/content/` change exactly as if edited by hand — commit/push as part of your workflow. Version snapshots live in gitignored `.writenex/`.

## API

**Can I script content changes?**
Yes — see the [REST API](REST-API). Note the API writes files directly without form validation; the version history safety net still applies.

**Is the API rate limited?**
Only login (8 failed attempts / 15 min / IP). Authenticated API calls are not throttled.

---

More questions? [Open an issue](https://github.com/jaainil/writenex/issues) or check [Troubleshooting](Troubleshooting).
