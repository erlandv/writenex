# Images

How Writenex stores, uploads, and serves images for your content.

## Storage strategies

Configure globally (or per collection with the `images` option):

```typescript
// writenex.config.ts
export default defineConfig({
  images: {
    strategy: "colocated", // default
    publicPath: "/images",
    storagePath: "public/images",
  },
});
```

### Colocated (default)

Images live next to the content in a folder named after it:

```
src/content/blog/
├── my-post.md
└── my-post/
    ├── hero.jpg
    └── diagram.png
```

Reference in markdown: `![Alt](./my-post/hero.jpg)`

- **Pros** — self-contained content folders (easy to move/delete a post with its images)
- **Cons** — images inside `src/content/` need Astro-side handling to be served

### Public

Images go into the `public/` directory:

```
public/
└── images/
    └── blog/
        └── my-post-hero.jpg
```

Reference in markdown: `![Alt](/images/blog/my-post-hero.jpg)`

```typescript
images: {
  strategy: "public",
  publicPath: "/images",       // URL prefix
  storagePath: "public/images" // disk location
}
```

- **Pros** — served directly by Astro with zero config
- **Cons** — images separated from their content

### Custom

Use `directory` / `publicPath` overrides on `fields.image()` for per-field locations:

```typescript
fields.image({
  label: "Thumbnail",
  directory: "public/images/blog",
  publicPath: "/images/blog",
})
```

## Uploading

- **Drag and drop** an image into the editor, or
- Use the **image button** in the editor toolbar and pick a file

Uploads go through `POST /_writenex/api/images` (multipart/form-data) and are stored according to the active strategy. Uploaded filenames are deduplicated automatically (e.g. `tiny.png` → `tiny-a1b2c3.png` if `tiny.png` already exists).

Allowed types: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.svg`.

## Image discovery

For content items, Writenex can list the images that already belong to them:

```
GET /_writenex/api/images/:collection/:contentId
```

```json
{
  "success": true,
  "images": [
    {
      "filename": "hero.jpg",
      "relativePath": "./my-post/hero.jpg",
      "absolutePath": "/project/src/content/blog/my-post/hero.jpg",
      "size": 204800,
      "extension": ".jpg"
    }
  ]
}
```

The editor uses this to show existing images when inserting one.

## Serving images in the editor

The editor loads images through authenticated endpoints so previews work even for colocated images:

```
GET /_writenex/api/images/:collection/:contentId/:path
```

(e.g. `/_writenex/api/images/blog/my-post/hero.jpg`)

This respects your auth gate — see [Security](Security).

## Permissions

Uploads write to disk — the process running Writenex needs write access to the storage location. If uploads fail with 500s, check:

1. Directory exists / is writable by the server user
2. The `strategy` + `storagePath` combination is valid
3. The image type is in the allowed list
