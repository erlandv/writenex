# Quick Start

A 3-minute walkthrough from zero to editing content.

## 1. Start the dev server

```bash
astro dev
```

Writenex hooks into the dev server and logs the editor URL:

```
Writenex editor running at: http://localhost:4321/_writenex
```

## 2. Open the editor

Visit `http://localhost:4321/_writenex`.

## 3. Understand the layout

```
┌─────────────────────────────────────────────────────────┐
│ Header: logo · new content · panels · theme · sign out  │
├───────────┬─────────────────────────────┬───────────────┤
│ Sidebar   │  Editor (WYSIWYG / source)  │ Frontmatter   │
│ ─ collections  │                        │ form panel    │
│ ─ content list                 │        │               │
├───────────┴─────────────────────────────┴───────────────┤
│ Content bar: title · autosave status · draft · preview  │
└─────────────────────────────────────────────────────────┘
```

- **Sidebar** — lists every collection (auto-discovered from `src/content/`) with item counts; click a collection to browse its content
- **Editor** — rich WYSIWYG editing for markdown/MDX with live formatting
- **Frontmatter panel** — auto-generated form built from your schema (or inferred from existing files)
- **Content bar** — shows save state, draft toggle, and preview link

## 4. Edit something

1. Click a collection → click a content item
2. Edit the body in the editor and the metadata in the frontmatter form
3. Hit `Ctrl/Cmd + S` — the markdown file on disk is updated instantly

Autosave is on by default (every 3s while there are unsaved changes). The content bar shows `Saved`, `Saving...`, or `Unsaved`.

## 5. Create new content

- Click the **+** button in the header, or press `Alt + N`
- Pick a collection, fill the form, choose a slug
- The file is created following your collection's [File Pattern](File-Patterns) (auto-detected from existing files)

## 6. Images

Drag-and-drop images into the editor, or use the image button. Uploads are stored using your [image strategy](Images) — colocated next to the content file by default.

## 7. Version history

Every save automatically snapshots the previous version. Open the **History** panel (clock icon in the header) to preview, diff, and restore older versions. See [Version History](Version-History).

## 8. Preview your page

The **Preview** button (or `Ctrl/Cmd + P`) opens the live page for the content you're editing, using the collection's `previewUrl` pattern.

## Keyboard shortcuts cheat sheet

| Shortcut | Action |
| --- | --- |
| `Alt + N` | New content |
| `Ctrl/Cmd + S` | Save |
| `Ctrl/Cmd + P` | Open preview |
| `Ctrl/Cmd + F` | Search & replace |
| `Ctrl/Cmd + /` | Show all shortcuts |
| `Ctrl/Cmd + Shift + R` | Refresh content |
| `Escape` | Close modal |

Full list: [Editor UI Guide](Editor-UI#keyboard-shortcuts).

## What's next

- [Define schemas with the Fields API](Fields-API)
- [Protect the editor with a password](Remote-CMS#quick-start-auth-in-development)
- [Browse the REST API](REST-API)
