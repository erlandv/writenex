# Remote CMS

Password-protect the Writenex editor and use it on your **live Astro site** — sign in at `https://yourdomain.com/_writenex` and manage content from any browser.

- **No database** — content stays as markdown files; sessions are signed cookies
- **Fully optional** — without `remoteCms`, nothing changes
- **Fail-closed** — it refuses to run unauthenticated under any misconfiguration

> This page covers concepts and setup. See also: [Security](Security) for the defense-in-depth details and the package's [deployment guide](https://github.com/jaainil/writenex/blob/main/packages/astro/docs/remote-cms.md) for systemd/Docker/reverse-proxy recipes.

---

## Quick Start: Auth in Development

Protect the editor even locally:

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

Open `http://localhost:4321/_writenex` → login screen → sign in → a **Sign out** button appears in the header.

---

## Production Deployment

Production serving requires SSR (a writable editor can't exist on a static host).

### 1. Install an SSR adapter

```bash
npx astro add node
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
        // Keep real credentials OUT of this file — env vars only.
      },
    }),
  ],
});
```

At build time the integration generates two SSR routes and injects them:

| Route | Serves |
| --- | --- |
| `/_writenex` | Editor UI page |
| `/_writenex/[...writenex]` | API + editor assets + UI sub-routes |

**Credentials are stripped from the generated files** — the routes read environment variables at runtime, so secrets never land in your build output and can be rotated without rebuilding.

### 3. Set runtime environment variables

```bash
export WRITENEX_CMS_USER="admin"
export WRITENEX_CMS_PASS="$(openssl rand -base64 24)"
export WRITENEX_SECRET="$(openssl rand -hex 32)"
```

### 4. Build and run

```bash
astro build
HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
```

The node adapter defaults to `0.0.0.0:8080`. Behind a reverse proxy, bind to localhost and terminate TLS there.

### 5. Verify

```bash
curl -i https://yourdomain.com/_writenex                 # → 401 + login HTML
curl -i https://yourdomain.com/_writenex/api/collections # → 401 JSON
```

Then sign in via the browser.

---

## Configuration Reference

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `false` | Master switch for the auth gate |
| `username` | `string` | env fallback | Admin username (`WRITENEX_CMS_USER`) |
| `password` | `string` | env fallback | Admin password (`WRITENEX_CMS_PASS`) |
| `secret` | `string` | env fallback | Session signing secret (`WRITENEX_SECRET`) |
| `sessionTtl` | `number` | `604800` | Session lifetime in seconds (7 days) |

Set it in `writenex.config.ts` **or** as integration options — options win. Runtime env vars win over both.

---

## Environment Variables

| Variable | Read at | Purpose |
| --- | --- | --- |
| `WRITENEX_CMS_USER` | runtime | Login username |
| `WRITENEX_CMS_PASS` | runtime | Login password |
| `WRITENEX_SECRET` | runtime | HMAC key signing session tokens |

- **Runtime env overrides baked values** — rotate credentials by restarting, no rebuild needed
- **Rotating `WRITENEX_SECRET`** invalidates all existing sessions immediately
- Without `WRITENEX_SECRET`, a random per-process secret is generated (sessions reset on every restart — fine for dev)

---

## Sessions

| Property | Value |
| --- | --- |
| Cookie | `wn_session` — `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS |
| Token | `base64url(payload).base64url(HMAC-SHA256(payload, secret))` |
| Payload | `{ sub: username, iat, exp }` |
| Storage | Stateless — no server-side session store |
| Rate limit | 8 failed logins per IP per 15 min → `429` + `Retry-After` |

## Auth API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Sign in → session cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/session` | `{ authenticated, username }` |

```bash
curl -X POST https://yourdomain.com/_writenex/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}'

# Authenticated call
curl -b "wn_session=..." https://yourdomain.com/_writenex/api/collections
```

All other endpoints return `401 API_UNAUTHORIZED` without a valid session; the editor auto-redirects to login when that happens mid-session.

---

## Fail-closed Behavior

| Situation | Result |
| --- | --- |
| `remoteCms.enabled` but credentials missing | Editor disabled (dev or build) + error logged |
| `allowProduction` without `remoteCms` | Routes not injected + hint logged |
| `output: 'static'` with remote CMS enabled | Editor disabled + SSR hint logged |
| Server started without runtime env vars | `503` "not configured" on all `/_writenex` routes |

---

## What gets served in production

- The login page is **self-contained HTML** (inline CSS/JS, no external assets, `noindex`)
- The editor UI (React bundle) is served from the package's bundled assets, **only** to authenticated sessions
- Your site's pages are untouched — only `/_writenex*` paths are handled by the CMS

---

## Checklist before going live

1. HTTPS enabled (cookie `Secure` flag is automatic)
2. Credentials in env vars only — never in committed files
3. Long random password + `WRITENEX_SECRET` set
4. Reverse proxy sets `X-Forwarded-For` (per-IP rate limiting) — see the [X-Forwarded-For trust note](Security#x-forwarded-for-trust)
5. Node server bound to `127.0.0.1`, TLS at the proxy
6. Server runs as a non-root user; only `src/content/` and `.writenex/` writable
7. Backups of `src/content/` in place

Deployment recipes (systemd, Docker, Nginx, Caddy) are in the [full guide](https://github.com/jaainil/writenex/blob/main/packages/astro/docs/remote-cms.md).
