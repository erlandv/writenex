# Security

How Writenex protects your content — and what you're responsible for.

## Production guard (default)

The integration is **disabled in production builds by default**:

- `astro build` without `allowProduction: true` → Writenex is not included, a warning is logged
- Dev server (`astro dev`) → editor available at `/_writenex`, no auth by default

This prevents accidental exposure. Everything below is **opt-in**.

## Remote CMS auth gate

When you enable [`remoteCms`](Remote-CMS), all `/_writenex/*` routes sit behind a login screen. Defense layers:

| Layer | Detail |
| --- | --- |
| **Session cookie** | `wn_session` — `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS; HMAC-SHA256–signed, stateless |
| **Timing-safe credentials** | Username and password compared via `crypto.timingSafeEqual` on SHA-256 digests — no timing side channel |
| **Rate limiting** | 8 failed logins per IP per 15 minutes → `429` + `Retry-After`; in-memory, per server process |
| **CSRF protection** | In production, Astro's origin check rejects cross-site form submissions on non-GET requests; `SameSite=Lax` adds a second layer |
| **Fail-closed** | Missing credentials / disabled config / static output / unconfigured runtime all **disable the editor** rather than run it open |
| **Gated assets** | Even the editor's JS/CSS bundle returns 401 without a session |
| **Path traversal guards** | File reads/writes are confined to content directories (`relative()` checks on every path) |

## Threat model notes

- The editor performs **arbitrary writes inside your content directories** — treat the password as you would an SSH password
- Version snapshots (`.writenex/versions/`) are gitignored and never served publicly
- The login page and editor assets send `noindex` / strict cache headers where appropriate

## `X-Forwarded-For` trust

Writenex trusts the `X-Forwarded-For` header to identify clients for login rate limiting. That's correct when a reverse proxy sets it — but if the Node server is exposed **directly** to the internet, a client can spoof the header to bypass rate limits.

**Recommendation:** always put a reverse proxy (nginx, Caddy, etc.) in front that sets/overwrites `X-Forwarded-For`, and bind the Node server to `127.0.0.1`.

## Hardening checklist

### Configuration

- [ ] `remoteCms.enabled: true` with credentials from **env vars only** (never in committed config — values in `astro.config.mjs` / `writenex.config.ts` get baked into build output)
- [ ] Long random password (`openssl rand -base64 24`)
- [ ] `WRITENEX_SECRET` set (32-byte hex) — also lets you rotate sessions globally
- [ ] Shorter `sessionTtl` if the device landscape is untrusted (e.g. 1 day)

### Infrastructure

- [ ] HTTPS everywhere (cookie `Secure` is automatic over HTTPS; login over HTTP leaks credentials)
- [ ] Node server bound to `127.0.0.1`, TLS terminated at the proxy
- [ ] Proxy sets/overwrites `X-Forwarded-For` and `X-Forwarded-Proto`
- [ ] Optional: proxy-level IP allowlist for `/_writenex*` as a second gate

### Server

- [ ] Run as a dedicated non-root user
- [ ] Only `src/content/` and `.writenex/` writable (systemd `ReadWritePaths`)
- [ ] Backups of `src/content/` (version history is an undo buffer, not a backup)
- [ ] Watch login attempts in logs; restart the process to flush the in-memory rate limiter if needed

### Secrets rotation

| Rotate | Effect |
| --- | --- |
| `WRITENEX_CMS_PASS` | Old password stops working immediately (restart) |
| `WRITENEX_SECRET` | All sessions invalidated instantly — forced global logout |

## Error codes you may see

| Status | Code | Meaning |
| --- | --- | --- |
| 401 | `API_UNAUTHORIZED` | No/invalid/expired session |
| 429 | — | Login rate limited (`Retry-After` header) |
| 403 | `FS_PERMISSION_DENIED` | Filesystem permission denied |
| 400 | `FS_PATH_TRAVERSAL` | Path escape attempt blocked |
| 503 | — | Remote CMS not configured at runtime |

See the [REST API](REST-API) for the general error format.
