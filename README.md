# Writenex Monorepo

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A collection of tools for modern markdown editing and content management.

## Products

| **Product** | **Description** |
| --- | --- |
| Writenex | WYSIWYG Markdown editor - PWA, offline-first, local storage |
| @writenex/astro | CMS integration for Astro content collections |

## Project Structure

```
writenex/
├── apps/
│   └── writenex/              # Main Next.js application
│       └── lib/               # Core modules (db, editor, hooks, store, ui, utils)
│
├── packages/
│   ├── astro/                 # @writenex/astro - Astro integration (standalone)
│   └── config/                # Shared configurations
│       ├── typescript/        # @writenex/tsconfig
│       └── eslint/            # @writenex/eslint-config
│
├── package.json               # Root workspace config
├── pnpm-workspace.yaml        # Workspace definition
└── turbo.json                 # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+

### Installation

```bash
git clone https://github.com/erlandv/writenex.git
cd writenex
pnpm install
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type check all packages
pnpm type-check

# Format code
pnpm format

# Clean all build artifacts
pnpm clean
```

### Working with Specific Packages

```bash
# Run command in specific package
pnpm --filter @writenex/astro build:client
pnpm --filter writenex dev

# Type check specific package
pnpm --filter @writenex/astro type-check
```

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Framework**: Next.js 15+ (App Router, Turbopack)
- **React**: 19.x
- **Language**: TypeScript 5 (Strict mode)
- **Styling**: Tailwind CSS 4
- **Editor**: MDXEditor / Lexical
- **State**: Zustand
- **Database**: Dexie (IndexedDB)
- **UI**: Radix UI primitives (shadcn/ui style)

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [MDXEditor](https://mdxeditor.dev/) - WYSIWYG markdown editor
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Turborepo](https://turbo.build/) - Monorepo tooling

## License

MIT - see [LICENSE](./LICENSE) for details.
