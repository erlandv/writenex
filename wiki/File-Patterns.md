# File Patterns

File patterns control how new content files are named and organized when created from the editor.

## How patterns work

- If your collection config sets `filePattern`, new content follows it
- Otherwise, Writenex **auto-detects** the pattern by looking at existing files in the collection
- If there are no existing files, the default is `{slug}.md`

## Supported patterns

| Pattern | Example output | Use case |
| --- | --- | --- |
| `{slug}.md` | `my-post.md` | Simple (default) |
| `{slug}/index.md` | `my-post/index.md` | Folder-based |
| `{date}-{slug}.md` | `2026-01-15-my-post.md` | Date-prefixed |
| `{year}/{slug}.md` | `2026/my-post.md` | Year folders |
| `{year}/{month}/{slug}.md` | `2026/06/my-post.md` | Year/month folders |
| `{year}/{month}/{day}/{slug}.md` | `2026/06/15/my-post.md` | Full date folders |
| `{lang}/{slug}.md` | `en/my-post.md` | i18n / multi-language |
| `{lang}/{slug}/index.md` | `en/my-post/index.md` | i18n folder-based |
| `{category}/{slug}.md` | `tutorials/my-post.md` | Category folders |
| `{category}/{slug}/index.md` | `tutorials/my-post/index.md` | Category folder-based |

Configure per collection:

```typescript
collection({
  name: "blog",
  path: "src/content/blog",
  filePattern: "{year}/{slug}.md",
})
```

## Token resolution order

1. **Custom tokens** you pass explicitly (programmatic use)
2. **Known token resolvers** (see table below)
3. **Frontmatter values** — any other token is looked up in the item's frontmatter
4. Empty string as last resort

## Supported tokens

| Token | Source | Default value |
| --- | --- | --- |
| `{slug}` | Generated from title | **Required** |
| `{date}` | `pubDate` from frontmatter | Current date |
| `{year}` | Year from `pubDate` | Current year |
| `{month}` | Month from `pubDate` (zero-padded) | Current month |
| `{day}` | Day from `pubDate` (zero-padded) | Current day |
| `{lang}` | `lang` / `language` / `locale` from frontmatter | `en` |
| `{category}` | `category` / `categories[0]` from frontmatter | `uncategorized` |
| `{author}` | `author` from frontmatter (or `author.name`) | `anonymous` |
| `{type}` | `type` / `contentType` from frontmatter | `post` |
| `{status}` | `status` / `draft` from frontmatter | `published` |
| `{series}` | `series` from frontmatter | *(empty)* |

Token values are slugified for filesystem safety (e.g. `"Hello World"` → `hello-world`).

## Custom tokens

Any token not in the supported list resolves from frontmatter:

```typescript
collection({
  name: "docs",
  path: "src/content/docs",
  filePattern: "{project}/{slug}.md",
})
```

With frontmatter `project: "api-portal"`, creating content named `getting-started` produces:

```
src/content/docs/api-portal/getting-started.md
```

## Pattern validation

A pattern is valid when:

- It contains the `{slug}` token (required)
- All tokens are closed properly (`{slug}`, not `{slug`)
- Resolved values don't escape the collection directory (path traversal is blocked)

## Date-based examples

For a blog with `pubDate: 2026-08-31` and slug `remote-cms-guide`:

| Pattern | Result |
| --- | --- |
| `{slug}.md` | `remote-cms-guide.md` |
| `{date}-{slug}.md` | `2026-08-31-remote-cms-guide.md` |
| `{year}/{month}/{slug}.md` | `2026/08/remote-cms-guide.md` |
