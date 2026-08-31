# Troubleshooting

Common problems and how to fix them.

## Setup & installation

### Editor not loading

1. Make sure you're running `astro dev` (the editor is disabled in production builds by default)
2. Check the terminal for the `Writenex editor running at:` log line
3. Verify the integration is in `astro.config.mjs` and restart the dev server after config changes

### Collections not discovered

1. Content must live in `src/content/` subfolders
2. Files need a markdown extension (`.md`, `.mdx`)
3. Frontmatter must be valid YAML
4. Check the `discovery.ignore` config isn't excluding your folder

### Config file not loading

1. File must be named exactly `writenex.config.ts` (or `.mts`/`.js`/`.mjs`) and be in the project root
2. Must have a default export: `export default defineConfig({ ... })`
3. Restart the dev server after changes
4. Look for `[writenex]` warnings in the terminal — validation issues are reported there

### `Invalid configuration: type: Invalid option`

You're using a raw schema object with an invalid type name. Prefer the [Fields API](Fields-API) builders — `defineConfig` auto-resolves them. Older package versions don't support auto-resolution: upgrade.

## Editor behavior

### Field types not rendering correctly

1. Verify the builder name (e.g. `fields.text`, not `fields.string`)
2. Required options per type: `options` for `select`/`multiselect`, `fields` for `object`, `itemField` for `array`, `blockTypes` for `blocks`
3. Check nested fields are properly wrapped

### Validation not working

1. `validation` must be inside the field config: `fields.text({ label, validation: { isRequired: true } })`
2. Match rules to field types — `min`/`max` are numeric; `minLength`/`maxLength`/`pattern` are text
3. `isRequired` only blocks on **form submission** — autosave won't fight you on drafts

### Autosave not working

1. Check `editor.autosave` isn't disabled and the interval is sane
2. Autosave only fires when there are actual unsaved changes
3. Look at the content bar state (`Saving...` / `Save failed`) and browser console

### Collection not found for relationship

1. The `collection` name is case-sensitive and must match exactly
2. The target collection must exist (configured or discoverable)
3. It should have at least one item

### Images not uploading

1. Check write permissions on the target directory
2. Verify the [image strategy](Images) configuration
3. Allowed types only: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.svg`

## Remote CMS

### Editor disabled at build/dev (fail-closed)

Writenex deliberately disables itself instead of running unauthenticated. The log tells you which:

| Log message | Fix |
| --- | --- |
| "credentials are missing" | Set `WRITENEX_CMS_USER` / `WRITENEX_CMS_PASS` (or fill `remoteCms.username`/`password`) |
| "editor not injected. Enable remoteCms" | You set `allowProduction` without `remoteCms.enabled` |
| "requires server-side rendering" | Add `output: 'server'` + an SSR adapter (e.g. `@astrojs/node`) |

### 401 even after signing in

1. Check the `wn_session` cookie exists (devtools → Application → Cookies)
2. `WRITENEX_SECRET` must be identical to the one the server is running with — a mismatch invalidates tokens
3. Session may have expired (default 7 days) — sign in again

### 429 on login

8+ failed attempts from your IP → wait 15 minutes or restart the server process. Behind a reverse proxy, ensure `X-Forwarded-For` is set so per-IP limiting works (see [Security](Security#x-forwarded-for-trust)).

### 503 "Writenex remote CMS is not configured"

The server build never contains credentials (by design) — the runtime env vars are missing. Set `WRITENEX_CMS_USER`/`WRITENEX_CMS_PASS` and restart.

### Logged out after every restart/deploy

No `WRITENEX_SECRET` set → each process generates a random signing secret. Set it to keep sessions across restarts.

### Sessions not shared across multiple instances

Set the **same** `WRITENEX_SECRET` on all instances — tokens are stateless and verified by HMAC, so any instance with the same secret accepts them.

## Still stuck?

- Search or open an issue: [github.com/jaainil/writenex/issues](https://github.com/jaainil/writenex/issues)
- Include: Writenex version, Astro version, the relevant `[writenex]` terminal logs, and what you expected vs what happened
