# Version History

Writenex automatically creates shadow copies of your content before each save — a safety net for content editors.

## How it works

1. Before saving content, Writenex snapshots the **current** file
2. Snapshots are stored in `.writenex/versions/` (gitignored by default)
3. Old snapshots are pruned to keep the configured limit
4. **Labeled** versions (manual snapshots) are preserved during pruning
5. Restoring a version creates a safety snapshot of the current state first — nothing is ever lost

## Configuration

```typescript
// writenex.config.ts
export default defineConfig({
  versionHistory: {
    enabled: true,
    maxVersions: 20,
    storagePath: ".writenex/versions",
  },
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Enable/disable snapshots |
| `maxVersions` | `number` | `20` | Maximum unlabeled versions per content item |
| `storagePath` | `string` | `.writenex/versions` | Storage path relative to project root |

## Storage structure

```
.writenex/versions/
├── .gitignore              # Excludes version files from Git
└── blog/
    └── my-post/
        ├── manifest.json   # Version metadata
        ├── 2026-01-10T10-30-00-000Z.md
        └── 2026-01-11T11-45-00-000Z.md
```

## Using the UI

Open the **History** panel (clock icon in the header — enabled when content is selected):

- **Browse** — versions sorted newest first with size and preview
- **Diff** — compare a version against the current content
- **Restore** — write a version back to the live file (creates a safety snapshot labeled "Before restore" first)
- **Label** — create a named manual snapshot before risky edits
- **Delete** — remove individual versions or clear all

## REST API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/versions/:collection/:id` | List all versions |
| GET | `/api/versions/:collection/:id/:versionId` | Get a specific version |
| POST | `/api/versions/:collection/:id` | Create a manual version |
| POST | `/api/versions/:collection/:id/:vid/restore` | Restore a version |
| GET | `/api/versions/:collection/:id/:vid/diff` | Get diff data (version vs current) |
| DELETE | `/api/versions/:collection/:id/:versionId` | Delete one version |
| DELETE | `/api/versions/:collection/:id` | Clear all versions |

### List versions

```bash
curl http://localhost:4321/_writenex/api/versions/blog/my-post
```

```json
{
  "success": true,
  "versions": [
    {
      "id": "2026-01-11T12-00-00-000Z",
      "timestamp": "2026-01-11T12:00:00.000Z",
      "preview": "# My Post\n\nThis is the introduction...",
      "size": 2048
    }
  ],
  "total": 1
}
```

### Create a manual (labeled) version

```bash
curl -X POST http://localhost:4321/_writenex/api/versions/blog/my-post \
  -H "Content-Type: application/json" \
  -d '{"label": "Before major rewrite"}'
```

### Restore a version

```bash
curl -X POST http://localhost:4321/_writenex/api/versions/blog/my-post/2026-01-11T11-45-00-000Z/restore
```

```json
{
  "success": true,
  "version": { "id": "2026-01-11T11-45-00-000Z" },
  "safetySnapshot": {
    "id": "2026-01-11T12-05-00-000Z",
    "label": "Before restore"
  }
}
```

### Diff data

```bash
curl http://localhost:4321/_writenex/api/versions/blog/my-post/2026-01-11T11-45-00-000Z/diff
```

Returns both the version content and the current content (raw, frontmatter, body) for client-side comparison.

## Programmatic usage

```typescript
import {
  saveVersionWithConfig,
  getVersionsWithConfig,
  restoreVersionWithConfig,
} from "@imjp/writenex-astro";

await saveVersionWithConfig(
  "/project",
  "blog",
  "my-post",
  "---\ntitle: My Post\n---\n\nContent...",
  { maxVersions: 50 },
  { label: "Before major changes" }
);

const versions = await getVersionsWithConfig("/project", "blog", "my-post");

const result = await restoreVersionWithConfig(
  "/project",
  "blog",
  "my-post",
  "2026-01-10T10-30-00-000Z",
  "/project/src/content/blog/my-post.md"
);
```

## FAQ

**Is version history a backup?**
No — it's an undo buffer for editor saves. Keep real backups of `src/content/` (Git handles this well).

**Does it work with the Remote CMS?**
Yes — snapshots are taken on every save regardless of where the save comes from.

**How much disk space?**
Snapshots are plain markdown files, pruned per item to `maxVersions`. Labeled versions are never pruned automatically.
