# Writenex

**Writenex** is a modern WYSIWYG Markdown editor built with Next.js 15+, offering a powerful yet simple writing experience. All your documents are stored locally. No servers, no tracking, no data collection.

**Live:** [writenex.com](https://writenex.com)

<details>
<summary><strong>Table of Contents</strong></summary>

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Browser Support](#browser-support)
- [License](#license)

</details>

## Features

### Rich Text Editing

- **WYSIWYG Editor**: Real-time visual editing powered by MDXEditor
- **Markdown Support**: Full support for headings, bold, italic, underline, strikethrough, code, lists, blockquotes, tables, and more
- **Syntax Highlighting**: Code blocks with language-specific syntax highlighting
- **View Modes**: Switch between Edit, Split, and Source modes

### Multiple Documents

- **Tabbed Interface**: Work on multiple documents with browser-like tabs
- **Quick Switching**: Use `Alt+1-9` to jump to specific documents
- **Tab Navigation**: Navigate between tabs with `Alt+←` and `Alt+→`
- **Rename on Double-Click**: Easily rename documents by double-clicking the tab
- **Per-Document Version History**: Each document maintains its own version history

### Read-Only Mode

- Toggle read-only mode with visual indicators
- All editing features properly disabled
- Keyboard shortcut: `Ctrl+Shift+R` / `Cmd+Shift+R`
- Persisted state across page reloads

### Focus Mode

- Distraction-free writing with all UI hidden
- Hover-to-reveal header at top edge
- Floating exit button (bottom-right)
- Keyboard shortcuts: `Ctrl+Shift+E` to toggle, `Escape` to exit
- Smooth transitions for show/hide animations

### Table of Contents

- Auto-generated from document headings (H1-H6)
- Smart parsing that skips frontmatter and code blocks
- Visual hierarchy with indentation based on heading level
- Click to jump to heading with smooth scroll
- Active heading highlight based on scroll position
- Collapsible sidebar panel (left side)
- Toggle via toolbar button or `Alt+T` shortcut
- Panel state persisted across sessions
- Hidden in Focus Mode

### Version History

- Event-based snapshots saved to IndexedDB
- Up to 50 versions stored per document
- One-click restore to previous versions
- Version comparison with diff view
- Special "Before Clear" snapshots for recovery
- Real-time panel updates when new versions are created

### Search & Replace

- Real-time search with match highlighting
- Replace single or all occurrences
- Case-sensitive and whole word matching
- Regular expression support
- Replace disabled in read-only mode

### Statistics

- Real-time word, character, and line counts
- Reading time estimation
- Cursor position tracking
- Available in all modes including read-only

### Keyboard Shortcuts

| Category       | Shortcut            | Action                         |
| -------------- | ------------------- | ------------------------------ |
| **Formatting** | `Ctrl+B`            | Bold                           |
|                | `Ctrl+I`            | Italic                         |
|                | `Ctrl+U`            | Underline                      |
|                | `Ctrl+Shift+S`      | Strikethrough                  |
|                | `Ctrl+Shift+C`      | Inline Code                    |
| **Blocks**     | `Ctrl+Alt+1-6`      | Heading 1-6                    |
|                | `Ctrl+Shift+7`      | Ordered List                   |
|                | `Ctrl+Shift+8`      | Unordered List                 |
|                | `Ctrl+Shift+9`      | Checklist                      |
|                | `Ctrl+Shift+Q`      | Blockquote                     |
| **Actions**    | `Ctrl+Z`            | Undo                           |
|                | `Ctrl+Shift+Z`      | Redo                           |
|                | `Ctrl+S`            | Save                           |
|                | `Ctrl+K`            | Insert Link                    |
|                | `Ctrl+Alt+I`        | Insert Image                   |
|                | `Ctrl+Shift+Delete` | Clear Editor                   |
| **Documents**  | `Alt+N`             | New Document                   |
|                | `Alt+W`             | Close Document                 |
|                | `Alt+→`             | Next Document                  |
|                | `Alt+←`             | Previous Document              |
|                | `Alt+1-9`           | Switch to Document 1-9         |
| **Navigation** | `Alt+T`             | Table of Contents              |
|                | `Ctrl+F`            | Search & Replace               |
|                | `Enter`             | Next Match (in search)         |
|                | `Shift+Enter`       | Previous Match (in search)     |
|                | `Ctrl+H`            | Version History                |
|                | `Escape`            | Close Modals/Panels/Focus Mode |
| **Modes**      | `Ctrl+Shift+R`      | Toggle Read-Only               |
|                | `Ctrl+Shift+E`      | Toggle Focus Mode              |
|                | `Ctrl+/`            | Keyboard Shortcuts             |
|                | `F1`                | Help & Welcome Tour            |

### Export Options

- **Copy Markdown**: Copy raw markdown to clipboard
- **Copy HTML**: Copy rendered HTML fragment to clipboard (for pasting into CMS/email)
- **Download as `.md`**: Export document as Markdown file
- **Download as `.html`**: Export document as standalone HTML page with embedded styling
- Images stored in IndexedDB are automatically converted to base64 for portability

### Accessibility

- Full keyboard navigation
- ARIA labels and announcements
- Screen reader compatible
- Skip to content link
- Focus management for modals

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, PWA-enabled)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography)
- **Editor**: [MDXEditor](https://mdxeditor.dev/) powered by [Lexical](https://lexical.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Database**: [Dexie](https://dexie.org/) (IndexedDB wrapper)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) (shadcn/ui style)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Processing**: [Marked](https://marked.js.org/), [Remark](https://remark.js.org/), [Unified](https://unifiedjs.com/)
- **Syntax Highlighting**: [Shiki](https://shiki.style/)
- **Diff Viewer**: [react-diff-viewer-continued](https://github.com/aeber/react-diff-viewer-continued)
- **PWA**: [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)

## Getting Started

This app is part of the Writenex monorepo. See the [root README](../../README.md) for setup instructions.

```bash
# From monorepo root
pnpm dev

# Open in browser
# Landing page: http://localhost:3000
# Editor: http://localhost:3000/editor
```

## Architecture

### State Management with Zustand

Zustand was chosen for its simplicity and performance. The store manages:

- Document list and active document
- Editor content and settings
- UI state (modals, panels)
- Read-only mode
- Theme preferences
- Statistics

### IndexedDB with Dexie

Dexie provides a clean API for IndexedDB operations:

- **Documents table**: Store multiple documents with metadata and content
- **Versions table**: Per-document version history (up to 50 per document)
- **Settings**: User preferences persistence

### Event-Based Save System

- **Auto-save**: Debounced 3-second save to document table (single source of truth)
- **Version snapshots**: Created on specific events:
  - User idle for 30 seconds + 5 minutes since last snapshot
  - Manual save (Ctrl+S)
  - Before clearing editor (labeled "Before Clear")
  - Switching documents
- **Real-time updates**: Version history panel updates instantly when snapshots are created

### MDXEditor Integration

MDXEditor provides a robust WYSIWYG experience with:

- Plugin architecture for extensibility
- Native markdown shortcut support
- Split view and source mode
- Code block syntax highlighting

### Component Architecture

- **Separation of concerns**: UI components are separated from editor-specific logic
- **Composition**: Complex features built from smaller, reusable components
- **Accessibility-first**: ARIA attributes and keyboard navigation built-in

## Browser Support

Writenex works on all modern browsers that support IndexedDB:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
