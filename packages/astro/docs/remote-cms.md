# Remote CMS Guide

Deploy Writenex as a password-protected CMS on your live Astro site. Sign in at `https://yourdomain.com/_writenex` and manage your content collections from any browser — list, edit, create, delete content, upload images, browse version history.

- **No database.** Your content stays as markdown files in `src/content/`.
- **No lock-in.** Everything the CMS writes is plain files your Astro site already renders.
- **Fully optional.** Without `remoteCms`, Writenex behaves exactly as before.

---

## Table of Contents

1. [What You Get](#what-you-get)
2. [Requirements](#requirements)
3. [How It Works](#how-it-works)
4. [Quick Start: Auth in Development](#quick-start-auth-in-development)
5. [Production Deployment](#production-deployment)
6. [Configuration Reference](#configuration-reference)
7. [Environment Variables](#environment-variables)
8. [Auth API Reference](#auth-api-reference)
9. [Session Lifecycle](#session-lifecycle)
10. [Deployment Recipes](#deployment-recipes)
11. [Fail-closed Behavior](#fail-closed-behavior)
12. [Security Checklist](#security-checklist)
13. [Troubleshooting](#troubleshooting)
14. [FAQ](#faq)

---

## What You Get

| Capability                  | Where                                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| Login screen (`/_writenex`) | Username + password form; self-contained page, no external assets     |
| Full content management     | The same WYSIWYG editor used locally: list, edit, create, delete      |
| Image management            | Upload images per content item, browse discovered images              |
| Version history             | Automatic snapshot before every save, restore/diff in the UI          |
| Draft workflow              | Toggle drafts, filter in the sidebar                                  |
| Session security            | Signed HttpOnly cookie, rate-limited login, CSRF-safe in production   |

---

## Requirements

- **Development mode (`astro dev`):** nothing extra — the auth gate runs through the built-in dev middleware.
- **Production (your domain):**
  - Astro `output: 'server'` (server-side rendering)
  - An SSR adapter — [`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/) for self-hosted servers (recommended; other SSR adapters work only if they can read files from disk at runtime)
  - `allowProduction: true` in the Writenex integration options
  - Node.js 22.12.0+

> Static-only sites (no SSR) cannot host the Remote CMS — there is no server process to accept writes. Writenex detects this at build time and tells you exactly what to add.

---

## How It Works

```
Browser
  │  1. GET /_writenex
  ▼
Writenex auth gate ── no valid session ──▶ login page (401 + HTML form)
  │  2. POST /_writenex/api/auth/login { username, password }
  │     ✓ timing-safe check → HMAC-signed session cookie (HttpOnly)
  ▼
Editor UI ──▶ REST API (collections, content CRUD, images, versions)
              every request re-validated against the session cookie
```

Key properties:

- **Stateless sessions.** The cookie contains `base64url(payload).base64url(hmac)` where the payload holds the username, issued-at, and expiry. Verification is pure HMAC — no session table, no database.
- **The whole API is reused.** Production routes bridge Astro's web-standard `Request`/`Response` onto the exact same API router the dev server uses — one implementation, tested in both modes.
- **Fail-closed.** Every path that would expose the writable editor without auth (missing credentials, disabled config, static output, unconfigured runtime) disables the editor instead.

---

## Quick Start: Auth in Development

Protect the editor even on your dev machine (useful on shared networks):

```typescript
// astro.config.mjs
import { defineConfig } from "astro/config";
import writenex from "@imjp/writenex-astro";

export default defineConfig({
  integrations: [
    writenex({
      remoteCms: {
        enabled: true,
        username: process.env.WRITENEX_CMS_USER,
        password: process.env.WRITENEX_CMS_PASS,
      },
    }),
  ],
});
```

```bash
WRITENEX_CMS_USER=admin WRITENEX_CMS_PASS=devpass astro dev
```

Open `http://localhost:4321/_writenex` → you'll see the login screen. After signing in you get the full editor, and a **Sign out** button appears in the header.

Nothing else changes: without `remoteCms`, `astro dev` remains open as always.

---

## Production Deployment

Step by step, for a self-hosted Node server (the recommended setup).

### 1. Install the adapter

```bash
npx astro add node
# or manually:
npm install @astrojs/node
```

### 2. Configure Astro

```typescript
// astro.config.mjs
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import writenex from "@imjp/writenex-astro";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    writenex({
      allowProduction: true,
      remoteCms: {
        enabled: true,
        // Do NOT put real credentials here — use env vars (see step 3).
        // Values written here get baked into the build output.
      },
    }),
  ],
});
```

At build time the integration:

1. Generates two server route modules (`.astro/integrations/_writenex_astro/`) and injects them:
   - `/_writenex` — editor UI page
   - `/_writenex/[...writenex]` — API + editor assets + UI sub-routes
2. **Strips credentials from the generated files.** The routes read `WRITENEX_*` env vars at runtime, so secrets never appear in `dist/` and can be rotated without a rebuild.

### 3. Set runtime environment variables

```bash
export WRITENEX_CMS_USER="admin"
export WRITENEX_CMS_PASS="$(openssl rand -base64 24)"   # long random password
export WRITENEX_SECRET="$(openssl rand -hex 32)"        # session signing secret
```

Generate and store these in your secret manager (`.env` file excluded from Git, systemd `EnvironmentFile`, Docker secrets, etc.).

### 4. Build and run

```bash
astro build
node dist/server/entry.mjs
```

The node adapter listens on `HOST`/`PORT` (defaults `0.0.0.0:8080`). Behind a reverse proxy, bind to localhost:

```bash
HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
```

### 5. Verify

```bash
# 1. Editor is locked
curl -i https://yourdomain.com/_writenex          # → 401 + login HTML

# 2. API is locked
curl -i https://yourdomain.com/_writenex/api/collections   # → 401 JSON

# 3. Sign in works
curl -i -X POST https://yourdomain.com/_writenex/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}'      # → 200 + Set-Cookie
```

Then open `https://yourdomain.com/_writenex` in a browser and sign in.

---

## Configuration Reference

`remoteCms` can be set in `writenex.config.ts` **or** directly in the integration options (options win):

| Option       | Type      | Default       | Description                                                    |
| ------------ | --------- | ------------- | -------------------------------------------------------------- |
| `enabled`    | `boolean` | `false`       | Master switch for the auth gate + login UI                     |
| `username`   | `string`  | env fallback  | Admin username (falls back to `WRITENEX_CMS_USER`)             |
| `password`   | `string`  | env fallback  | Admin password (falls back to `WRITENEX_CMS_PASS`)             |
| `secret`     | `string`  | env fallback  | Session signing secret (falls back to `WRITENEX_SECRET`)       |
| `sessionTtl` | `number`  | `604800`      | Session lifetime in seconds (7 days)                           |

```typescript
// writenex.config.ts (alternative to astro.config.mjs options)
import { defineConfig } from "@imjp/writenex-astro";

export default defineConfig({
  // ...collections, images, editor, etc.
  remoteCms: {
    enabled: true,
    sessionTtl: 86400, // 1 day
  },
});
```

Integration-level override (wins over `writenex.config.ts`):

```typescript
writenex({
  remoteCms: { enabled: true, sessionTtl: 3600 },
});
```

---

## Environment Variables

| Variable             | Read at     | Purpose                                        |
| -------------------- | ----------- | ---------------------------------------------- |
| `WRITENEX_CMS_USER`  | runtime     | Login username                                 |
| `WRITENEX_CMS_PASS`  | runtime     | Login password                                 |
| `WRITENEX_SECRET`    | runtime     | HMAC key signing session tokens                |

Precedence at **runtime**: environment variable → value embedded at build time → disabled (fail-closed).

Why runtime env wins: you can rotate credentials or the signing secret by restarting the server — no rebuild. Rotating `WRITENEX_SECRET` invalidates all existing sessions immediately (users just sign in again).

---

## Auth API Reference

Base path: `/_writenex/api`. All other endpoints require a valid session when the Remote CMS is enabled; these three are public.

### POST `/auth/login`

```json
{ "username": "admin", "password": "secret" }
```

| Status | Body                                        | Meaning                     |
| ------ | ------------------------------------------- | --------------------------- |
| `200`  | `{ "success": true, "username": "admin" }`  | Signed-in; `Set-Cookie` set |
| `400`  | `{ "error": "username and password are required" }` | Malformed body     |
| `401`  | `{ "error": "Invalid username or password" }` | Bad credentials (attempt recorded) |
| `429`  | `{ "error": "Too many login attempts..." }` | Rate limited; `Retry-After` header |

### POST `/auth/logout`

Clears the session cookie. Returns `{ "success": true }`.

### GET `/auth/session`

```json
{ "authenticated": true, "username": "admin" }
```

Returns `{ "authenticated": false }` when signed out. The editor UI uses this to show/hide the Sign out button.

### Gated endpoints

Every other endpoint (`/collections`, `/content/*`, `/images/*`, `/versions/*`, `/config`) returns:

```json
{ "error": "Authentication required", "code": "API_UNAUTHORIZED" }
```

with status `401` when the session cookie is missing, expired, or invalid. The editor UI auto-redirects to the login screen when it receives a 401.

---

## Session Lifecycle

| Property        | Value                                                  |
| --------------- | ------------------------------------------------------ |
| Cookie name     | `wn_session`                                           |
| Flags           | `HttpOnly`, `SameSite=Lax`, `Path=/` (+ `Secure` on HTTPS requests automatically) |
| Token format    | `base64url(JSON payload).base64url(HMAC-SHA256)`       |
| Payload         | `{ sub: username, iat: issued-at (s), exp: expiry (s) }` |
| Default TTL     | 7 days (`remoteCms.sessionTtl`)                        |
| Storage         | Stateless — nothing stored server-side                 |
| Revocation      | Sign out clears the cookie; rotating `WRITENEX_SECRET` invalidates all tokens |

**Rate limiting:** 8 consecutive failed attempts per client IP per 15 minutes → `429` with `Retry-After` until the window expires. Successful sign-in resets the counter. Limits are in-memory (per server process).

**CSRF:** in production, Astro's built-in origin verification rejects cross-site form submissions on non-GET requests, which combined with the `SameSite=Lax` cookie blocks CSRF against the API.

---

## Deployment Recipes

### systemd

```ini
# /etc/systemd/system/writenex-site.service
[Unit]
Description=My Astro site with Writenex Remote CMS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/my-site
EnvironmentFile=/etc/my-site/writenex.env
ExecStart=/usr/bin/node dist/server/entry.mjs
Restart=on-failure
# Hardening: the CMS needs write access to src/content and .writenex only
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=/srv/my-site/src/content /srv/my-site/.writenex

[Install]
WantedBy=multi-user.target
```

```bash
# /etc/my-site/writenex.env  (chmod 600, owned by root)
WRITENEX_CMS_USER=admin
WRITENEX_CMS_PASS=...
WRITENEX_SECRET=...
```

### Docker

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
```

```yaml
# docker-compose.yml
services:
  site:
    build: .
    ports: ["127.0.0.1:4321:4321"]
    environment:
      WRITENEX_CMS_USER: admin
      WRITENEX_CMS_PASS: ${WRITENEX_CMS_PASS}
      WRITENEX_SECRET: ${WRITENEX_SECRET}
    volumes:
      - ./src/content:/app/src/content   # persist edits outside the image
```

> Mounting `src/content` as a volume keeps CMS edits when the container is rebuilt. The build must be run from a source checkout that matches the mounted content.

### Nginx reverse proxy (HTTPS)

```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:4321;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

`X-Forwarded-For` and `X-Forwarded-Proto` matter: the first drives per-IP login rate limiting, the second adds the `Secure` cookie flag automatically.

### Caddy

```
yourdomain.com {
  reverse_proxy 127.0.0.1:4321
}
```

Caddy sets `X-Forwarded-For`/`X-Forwarded-Proto` automatically and provisions TLS.

---

## Fail-closed Behavior

Writenex never runs the writable editor unauthenticated. Every misconfiguration disables the editor with a clear log message:

| Situation                                          | Build/dev result                                  | Runtime result                  |
| -------------------------------------------------- | ------------------------------------------------- | ------------------------------- |
| `remoteCms.enabled` + missing username/password    | Editor disabled, error logged                     | —                               |
| `allowProduction: true` without `remoteCms`        | Routes not injected, hint logged                  | —                               |
| `output: 'static'` with Remote CMS enabled         | Editor disabled, SSR hint logged                  | —                               |
| Server started without `WRITENEX_CMS_USER/PASS`    | —                                                 | `503` "not configured" on all `/_writenex` routes |
| Credentials valid but no `WRITENEX_SECRET`         | Editor works; random per-process secret (sessions reset on restart) | Same          |

---

## Security Checklist

Before exposing the Remote CMS on a public domain:

- [ ] **HTTPS everywhere** — cookie gets `Secure` automatically when the request is HTTPS; never serve the CMS over plain HTTP on a public domain
- [ ] **Credentials only via env vars** — never commit passwords; avoid putting them in `astro.config.mjs`/`writenex.config.ts` (they get baked into build output)
- [ ] **Long random password** — `openssl rand -base64 24` or a password manager
- [ ] **Set `WRITENEX_SECRET`** — otherwise sessions don't survive restarts; rotate it to force a global logout
- [ ] **Reverse proxy sets `X-Forwarded-For`** — otherwise all clients share one rate-limit bucket, or a direct-exposure attacker can spoof the header to bypass rate limiting (see note below)
- [ ] **Limit write access on disk** — run the server as a non-root user; the CMS only needs to write `src/content/` and `.writenex/`
- [ ] **Back up `src/content/`** — the CMS edits real files; version history helps but is not a backup strategy
- [ ] **Keep the port private** — bind the Node server to `127.0.0.1` and terminate TLS at the proxy

> **`X-Forwarded-For` trust note:** Writenex trusts this header to identify clients for rate limiting. That is correct behind a proxy that sets it, but when the Node server is exposed directly to the internet a client can spoof the header to evade rate limits. Put a reverse proxy in front that overwrites the header.

---

## Troubleshooting

| Symptom                                          | Cause & fix                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Build logs "credentials are missing"             | Set `WRITENEX_CMS_USER`/`WRITENEX_CMS_PASS` (or fill them in `writenex.config.ts`) |
| Build logs "editor not injected"                 | You set `allowProduction` but not `remoteCms.enabled`                        |
| Build logs "requires server-side rendering"      | Add `output: 'server'` + an SSR adapter (`@astrojs/node`)                    |
| `503` "Writenex remote CMS is not configured"    | Server started without the env vars — set them and restart                   |
| `401` right after signing in                     | `WRITENEX_SECRET` differs from the one used to sign the cookie; check for multiple server instances with different secrets |
| `429` on login                                   | 8+ failed attempts from your IP; wait 15 min or restart the process          |
| Logged out after every deploy/restart            | No `WRITENEX_SECRET` set — each process generates a random one; set it       |
| Editor loads but API calls 401 mid-session       | Session expired (`sessionTtl`); sign in again — the UI redirects automatically |
| Sessions not shared across replicas              | Set the same `WRITENEX_SECRET` on all instances (tokens are stateless and portable) |
| Login page loads but CSS looks broken            | The login page is fully self-contained (inline styles); if it renders unstyled, something is stripping response bodies — check proxy config |

---

## FAQ

**Do I need a database?**
No. Content is markdown on disk; sessions are signed cookies. There is nothing to provision.

**Can multiple people use it?**
Phase 1/2 supports a single admin account. Share credentials carefully, or front it with your own auth proxy (e.g. oauth2-proxy) — the session gate composes fine with an additional proxy-level auth layer.

**What happens to my Git repo when the CMS edits content?**
Files under `src/content/` change exactly as if you had edited them by hand. Commit and push from the server as part of your workflow. Version snapshots under `.writenex/` are gitignored by default.

**Can I use it with Vercel/Netlify/serverless?**
The CMS needs to read and write files at runtime. Self-hosted Node (node adapter) is the supported target. Serverless platforms with read-only or ephemeral filesystems are not suitable.

**Does enabling it change my site's build output for visitors?**
No. Two SSR routes are added under `/_writenex`; your pages render exactly as before.

**How do I disable it again?**
Remove `remoteCms` (or set `enabled: false`) and rebuild. Routes disappear from the output.
