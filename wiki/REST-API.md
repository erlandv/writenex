# REST API

Writenex exposes a REST API under `/_writenex/api/*` for programmatic access to your content. The editor UI uses the same API — everything here is also usable from scripts, CI, or integrations.

## Authentication

- **Without the Remote CMS** (dev default): endpoints are open on your dev server
- **With the [Remote CMS](Remote-CMS)**: every endpoint except `/api/auth/*` requires a session cookie — get one via `POST /api/auth/login`, then send `Cookie: wn_session=...` with each request. Unauthenticated calls return `401` with `{"error":"Authentication required","code":"API_UNAUTHORIZED"}`.

## Endpoint map

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Sign in (Remote CMS) |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/session` | Session status |
| GET | `/api/collections` | List collections |
| GET | `/api/config` | Current config + trailingSlash |
| GET | `/api/config/path` | Config file location |
| GET | `/api/content/:collection` | List content |
| GET | `/api/content/:collection/:id` | Get one item |
| POST | `/api/content/:collection` | Create content |
| PUT | `/api/content/:collection/:id` | Update content |
| DELETE | `/api/content/:collection/:id` | Delete content |
| GET | `/api/images/:collection/:id` | Discover images for an item |
| GET | `/api/images/:collection/:id/*` | Serve an image file |
| POST | `/api/images` | Upload an image |
| GET | `/api/versions/:collection/:id` | List versions |
| GET | `/api/versions/:collection/:id/:vid` | Get a version |
| GET | `/api/versions/:collection/:id/:vid/diff` | Version vs current |
| POST | `/api/versions/:collection/:id` | Create manual version |
| POST | `/api/versions/:collection/:id/:vid/restore` | Restore a version |
| DELETE | `/api/versions/:collection/:id/:vid` | Delete a version |
| DELETE | `/api/versions/:collection/:id` | Clear all versions |
| GET | `/api/health` | Health check |

Errors follow a structured format: `{ error, code, ... }` with meaningful HTTP status codes (`400`, `401`, `404`, `405`, `409`, `429`, `500`).

## Collections

```bash
curl http://localhost:4321/_writenex/api/collections
```

```json
{
  "collections": [
    {
      "name": "blog",
      "path": "src/content/blog",
      "filePattern": "{slug}.md",
      "count": 12,
      "schema": { "...": "..." },
      "previewUrl": "/blog/{slug}"
    }
  ]
}
```

## Content

### List content

```bash
curl "http://localhost:4321/_writenex/api/content/blog?draft=true&sort=pubDate&order=desc"
```

Query params: `draft` (`true` to include drafts), `sort` (default `pubDate`), `order` (`asc`/`desc`).

```json
{
  "items": [
    {
      "id": "my-post",
      "path": "src/content/blog/my-post.md",
      "title": "My Post",
      "pubDate": "2026-01-15",
      "draft": false,
      "excerpt": "First words of the post..."
    }
  ],
  "total": 1
}
```

### Get one item

```bash
curl http://localhost:4321/_writenex/api/content/blog/my-post
```

```json
{
  "id": "my-post",
  "path": "src/content/blog/my-post.md",
  "frontmatter": { "title": "My Post", "pubDate": "2026-01-15", "draft": false },
  "body": "# My Post\n\nContent here...",
  "raw": "---\ntitle: My Post\n---\n\n# My Post\n\nContent here..."
}
```

### Create content

```bash
curl -X POST http://localhost:4321/_writenex/api/content/blog \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "new-post",
    "frontmatter": { "title": "New Post", "pubDate": "2026-08-31", "draft": true },
    "body": "Hello world"
  }'
```

Response: `{ "success": true, "id": "new-post", "path": "src/content/blog/new-post.md" }`. The file is named using the collection's [file pattern](File-Patterns).

### Update content

```bash
curl -X PUT http://localhost:4321/_writenex/api/content/blog/my-post \
  -H "Content-Type: application/json" \
  -d '{ "frontmatter": { "title": "Updated" }, "body": "New body" }'
```

**Conflict detection:** send `expectedMtime` (from a previous read) to get a `409` with both versions if the file changed on disk since you read it. `forceOverwrite: true` skips the check. A version snapshot is created before every update when [version history](Version-History) is enabled.

### Delete content

```bash
curl -X DELETE http://localhost:4321/_writenex/api/content/blog/my-post
```

## Images

### Upload

```bash
curl -X POST http://localhost:4321/_writenex/api/images \
  -F "file=@hero.jpg" \
  -F "collection=blog" \
  -F "contentId=my-post"
```

Response: `{ "success": true, "path": "./my-post/hero.jpg", "url": "/_writenex/api/images/blog/my-post/hero.jpg" }`

Allowed types: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.svg`.

### Discover images for content

```bash
curl http://localhost:4321/_writenex/api/images/blog/my-post
```

### Serve an image

```bash
curl http://localhost:4321/_writenex/api/images/blog/my-post/hero.jpg -o hero.jpg
```

Path traversal is blocked — image paths are confined to the content folder.

## Config

```bash
curl http://localhost:4321/_writenex/api/config
# { "images": {...}, "editor": {...}, "trailingSlash": "ignore" }

curl http://localhost:4321/_writenex/api/config/path
# { "configPath": "/project/writenex.config.ts", "projectRoot": "/project", "hasConfigFile": true }
```

## Version history

See [Version History](Version-History#rest-api) for the full versioning API.

## Rate limits

Only the login endpoint is rate-limited (8 failed attempts / 15 min / IP → `429` + `Retry-After`). See [Security](Security).
