# Editor UI Guide

A tour of everything the Writenex editor interface can do.

## Layout

- **Header** — logo, toolbar (new content, panels, theme, sign out)
- **Sidebar** — collections with item counts, search, draft filter, content list
- **Editor** — WYSIWYG markdown/MDX editing with a content-actions bar underneath
- **Frontmatter panel** — form generated from your [schema](Fields-API)

## Editor toolbar

| Button | Action |
| --- | --- |
| **+** (Plus) | New content (`Alt + N`) |
| Folder | Toggle the explorer sidebar |
| Info | Toggle the frontmatter panel |
| Magnifier | Toggle search & replace (`Ctrl/Cmd + F`) |
| Clock | Version history (enabled when content is selected) |
| Sun/Moon | Theme: light / dark / system |
| Keyboard | Shortcuts help (`Ctrl/Cmd + /`) |
| Gear | Settings / config panel |
| Sign out | End the [Remote CMS](Remote-CMS) session (only shown when auth is enabled) |

## Content bar

Under the editor, contextual actions for the open content:

- **Title** — the current content's title (or ID)
- **Autosave indicator** — `Saved`, `Saving...`, `Unsaved`, `Autosave off`, or `Save failed`
- **Draft toggle** — flip `draft` in frontmatter with visual indicators
- **Preview** — open the live page (`Ctrl/Cmd + P`) using the collection's `previewUrl`
- **More actions** — delete content (with confirmation), version history

## Autosave

- On by default, every **3 seconds** while there are unsaved changes
- Toggle it off from the content bar (manual `Ctrl/Cmd + S` still works)
- Configure in `writenex.config.ts`:

```typescript
editor: {
  autosave: true,
  autosaveInterval: 3000, // milliseconds
}
```

- Screen-reader friendly: status changes are announced via a live region
- Conflict protection: if the file changed on disk since you opened it (mtime mismatch), saving returns a **409 conflict** and lets you resolve instead of silently overwriting

## Drafts

- Toggle the draft status directly from the content bar
- Draft items show an indicator in the sidebar
- The sidebar has a filter to show/hide drafts
- Drafts are included in content listings for editing (include-drafts API flag)

## Search & Replace

`Ctrl/Cmd + F` opens the panel:

- Search the current document
- Replace / replace all
- Match highlighting in the editor

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Alt + N` | New content |
| `Ctrl/Cmd + S` | Save |
| `Ctrl/Cmd + P` | Open preview |
| `Ctrl/Cmd + F` | Search & replace |
| `Ctrl/Cmd + /` | Show shortcuts help |
| `Ctrl/Cmd + Shift + R` | Refresh content |
| `Escape` | Close modal |

Press `Ctrl/Cmd + /` any time to see the in-app list.

## Accessibility

- Skip-to-content link
- Full keyboard navigation for panels and modals
- Live region announcements for save status and async actions
- Theme respects `prefers-color-scheme` when set to *System*

## Unsaved changes protection

Switching content with unsaved changes prompts you to **save first**, **discard**, or **cancel** — you can't lose edits by clicking around. The same guard applies to autosave failures.
