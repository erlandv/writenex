# Writenex Monorepo Migration Plan

> **Status:** Phase 4 In Progress - Dev server tested, ready for staging deployment
> **Branch:** `monorepo-migration`
> **Backup:** `pre-monorepo-backup` branch, `v1.0.0-pre-monorepo` tag
> **Last Updated:** December 7, 2025

## Goal

Migrate single Next.js app to monorepo structure without production downtime.

## Actual Structure (Post-Migration)

```
writenex/
├── .github/
│   └── copilot-instructions.md
│
├── apps/
│   └── writenex/                  # Core editor app
│       ├── package.json
│       ├── next.config.mjs
│       ├── tsconfig.json
│       ├── postcss.config.mjs
│       ├── vercel.json
│       ├── public/
│       │   ├── manifest.json
│       │   ├── sw.js
│       │   └── fonts/
│       └── app/                   # Next.js App Router (source root)
│           ├── globals.css
│           ├── layout.tsx
│           ├── page.tsx
│           ├── not-found.tsx
│           ├── robots.ts
│           ├── sitemap.ts
│           ├── editor/
│           │   ├── layout.tsx
│           │   └── page.tsx
│           ├── privacy/
│           ├── terms/
│           ├── components/
│           │   ├── ThemeProvider.tsx
│           │   └── landing/
│           └── lib/
│               └── jsonld.ts
│
├── packages/
│   ├── utils/                     # @writenex/utils
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── cn.ts
│   │       ├── helpers.ts
│   │       ├── constants.ts
│   │       ├── storage.ts
│   │       └── keyboardShortcuts.ts
│   │
│   ├── ui/                        # @writenex/ui
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── icon-button.tsx
│   │       ├── input.tsx
│   │       ├── simple-tooltip.tsx
│   │       ├── tooltip.tsx
│   │       └── destructive-action-dialog.tsx
│   │
│   ├── db/                        # @writenex/db
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── db.ts
│   │       └── types.ts
│   │
│   ├── store/                     # @writenex/store
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── editorStore.ts
│   │       └── types.ts
│   │
│   ├── hooks/                     # @writenex/hooks
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── useAutoSave.ts
│   │       ├── useBackupReminder.ts
│   │       ├── useDocumentInit.ts
│   │       ├── useKeyboardShortcuts.ts
│   │       ├── useOnlineStatus.ts
│   │       ├── useServiceWorker.ts
│   │       ├── useStorageQuota.ts
│   │       └── useTableOfContents.ts
│   │
│   ├── editor/                    # @writenex/editor
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── MarkdownEditor.tsx
│   │       ├── EditorShortcuts.tsx
│   │       ├── exportHtml.ts
│   │       ├── onboarding.ts
│   │       ├── dialogs/
│   │       ├── panels/
│   │       ├── toolbar/
│   │       ├── indicators/
│   │       └── styles/
│   │           ├── index.css
│   │           ├── base/
│   │           ├── components/
│   │           └── vendor/
│   │
│   └── config/                    # Shared configs
│       ├── eslint/                # @writenex/eslint-config
│       ├── typescript/            # @writenex/tsconfig
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── react-library.json
│       └── tailwind/              # @writenex/tailwind-config
│
├── package.json                   # Root workspace
├── pnpm-workspace.yaml
├── turbo.json
├── .prettierrc
├── .gitignore
├── LICENSE
├── README.md
└── MONOREPO_PLAN.md
```

## Dependencies Mapping

### @writenex/utils
```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  }
}
```

### @writenex/ui
```json
{
  "dependencies": {
    "@writenex/utils": "workspace:*",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.2.8",
    "class-variance-authority": "^0.7.1",
    "lucide-react": "^0.556.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### @writenex/db
```json
{
  "dependencies": {
    "@writenex/utils": "workspace:*",
    "dexie": "^4.2.1"
  }
}
```

### @writenex/store
```json
{
  "dependencies": {
    "@writenex/db": "workspace:*",
    "@writenex/utils": "workspace:*",
    "zustand": "^5.0.8"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

### @writenex/hooks
```json
{
  "dependencies": {
    "@writenex/db": "workspace:*",
    "@writenex/store": "workspace:*",
    "@writenex/utils": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

### @writenex/editor
```json
{
  "dependencies": {
    "@writenex/ui": "workspace:*",
    "@writenex/db": "workspace:*",
    "@writenex/store": "workspace:*",
    "@writenex/hooks": "workspace:*",
    "@writenex/utils": "workspace:*",
    "@mdxeditor/editor": "^3.50.0",
    "@lexical/list": "^0.35.0",
    "@lexical/react": "^0.35.0",
    "@lexical/rich-text": "^0.35.0",
    "@lexical/selection": "^0.35.0",
    "lexical": "^0.35.0",
    "react-diff-viewer-continued": "^3.4.0",
    "marked": "^17.0.1",
    "remark-parse": "^11.0.0",
    "remark-stringify": "^11.0.0",
    "unified": "^11.0.5",
    "shiki": "^3.17.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### apps/writenex
```json
{
  "dependencies": {
    "@writenex/ui": "workspace:*",
    "@writenex/editor": "workspace:*",
    "@writenex/db": "workspace:*",
    "@writenex/store": "workspace:*",
    "@writenex/hooks": "workspace:*",
    "@writenex/utils": "workspace:*",
    "@ducanh2912/next-pwa": "^10.2.9",
    "next": "^16.0.7",
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  }
}
```

## Migration Phases

### Phase 0: Preparation ✅
- [x] Create backup branch: `pre-monorepo-backup`
- [x] Create tag: `v1.0.0-pre-monorepo`
- [x] Audit dependencies
- [x] Verify pnpm installed (v10.15.1)
- [x] Document structure plan

### Phase 1: Setup Monorepo Foundation ✅
- [x] Create `pnpm-workspace.yaml`
- [x] Create `turbo.json`
- [x] Create root `package.json`
- [x] Create directory structure
- [x] Setup shared TypeScript configs (`@writenex/tsconfig`)
- [x] Setup shared ESLint config (`@writenex/eslint-config`)
- [x] Setup shared Tailwind config (`@writenex/tailwind-config`)
- [x] Update `.gitignore` for monorepo

### Phase 2: Extract Packages (Order matters!)
1. [x] `@writenex/utils` - No internal deps ✅
   - [x] Create package.json
   - [x] Create tsconfig.json
   - [x] Create src/cn.ts
   - [x] Create src/helpers.ts
   - [x] Copy src/constants.ts
   - [x] Copy src/storage.ts
   - [x] Copy src/keyboardShortcuts.ts
   - [x] Create src/index.ts (barrel export)
   - [x] Test TypeScript compilation
2. [x] `@writenex/ui` - Depends on utils ✅
   - [x] Create package.json
   - [x] Create tsconfig.json
   - [x] Create src/button.tsx
   - [x] Create src/tooltip.tsx
   - [x] Create src/simple-tooltip.tsx
   - [x] Create src/dialog.tsx
   - [x] Create src/dropdown-menu.tsx
   - [x] Create src/icon-button.tsx
   - [x] Create src/input.tsx
   - [x] Create src/destructive-action-dialog.tsx
   - [x] Create src/index.ts (barrel export)
   - [x] Test TypeScript compilation
3. [x] `@writenex/db` - Depends on utils ✅
4. [x] `@writenex/store` - Depends on utils ✅ (Note: does NOT depend on db)
5. [x] `@writenex/hooks` - Depends on store, db, utils ✅
6. [x] `@writenex/editor` - Depends on all above ✅
   - [x] Copy all editor components from src/components/editor/
   - [x] Copy styles from src/styles/
   - [x] Copy exportHtml.ts
   - [x] Move onboarding.ts to editor package (has React/Lucide deps)
   - [x] Update all imports to use workspace packages
   - [x] Fix TypeScript errors (NodeJS.Timeout → ReturnType<typeof setTimeout>)
   - [x] Fix styled-jsx → regular style tag
   - [x] Add proper package exports for styles

### Phase 3: Move App ✅
- [x] Create `apps/writenex/` directory structure
- [x] Move `app/` to `apps/writenex/app/`
- [x] Move `public/` to `apps/writenex/public/`
- [x] Move config files (next.config.mjs, vercel.json, postcss.config.mjs)
- [x] Create apps/writenex/package.json with workspace dependencies
- [x] Create apps/writenex/tsconfig.json
- [x] Move app-specific components (ThemeProvider, landing/)
- [x] Move app-specific libs (jsonld.ts)
- [x] Update all imports to use workspace packages
- [x] Update globals.css to import @writenex/editor/styles
- [x] Delete old src/ directory
- [x] Verify `pnpm build` passes

### Phase 4: Verify
- [x] Local build works (`pnpm build` passes)
- [x] Local dev works (`pnpm --filter writenex dev`) ✅
- [ ] Deploy to staging (Vercel preview)
- [ ] Full feature testing
- [ ] Production deployment

### Phase 5: Future - Writenex Astro
- [ ] Create `apps/writenex-astro`
- [ ] Create `packages/astro-integration`

## Rollback Plan

If anything goes wrong in production:

```bash
# Revert to pre-monorepo state
git checkout v1.0.0-pre-monorepo
git checkout -b hotfix
# Deploy hotfix branch to Vercel
```

## Implementation Notes

### Important Architectural Decisions

1. **Package Exports**: All packages use TypeScript source files directly (no build step).
   Package exports use `"./src/index.ts"` pattern for types and imports.

2. **Styles Location**: Editor styles live in `@writenex/editor/src/styles/` and are
   exported via `@writenex/editor/styles`. Apps import with:
   ```css
   @import "@writenex/editor/styles";
   ```

3. **onboarding.ts moved to editor**: Originally in utils, but has React and Lucide
   dependencies, so moved to `@writenex/editor/src/onboarding.ts`.

4. **styled-jsx replaced**: MarkdownEditor.tsx used Next.js styled-jsx which doesn't
   work in library packages. Replaced with regular `<style>` tag with `__jsx` suffix
   to avoid conflicts.

5. **NodeJS.Timeout type**: Browser-compatible packages use `ReturnType<typeof setTimeout>`
   instead of `NodeJS.Timeout` for timer refs.

6. **App structure**: apps/writenex uses `app/` as source root with `@/*` path alias
   mapping to `./app/*`. App-specific code (ThemeProvider, landing/, jsonld.ts) lives
   in the app, not in packages.

### Package Dependency Graph

```
@writenex/utils (no deps)
       ↓
@writenex/ui (utils)
       ↓
@writenex/db (utils)
       ↓
@writenex/store (utils) ← Note: does NOT depend on db
       ↓
@writenex/hooks (store, db, utils)
       ↓
@writenex/editor (all above)
       ↓
apps/writenex (all packages)
```

### Verified Working Commands

```bash
# Install all dependencies
pnpm install

# Type-check all packages
pnpm -r type-check

# Build the app
pnpm build

# Run specific package type-check
cd packages/editor && pnpm type-check
```

### Next Steps (Phase 4 Remaining)

1. ~~Test `pnpm dev` works correctly~~ ✅ Verified: `pnpm --filter writenex dev`
2. Create Vercel project configuration for apps/writenex
3. Deploy to preview/staging
4. Full manual testing of all features
5. Production deployment

### Dev Server Command

```bash
# Run dev server
pnpm --filter writenex dev
```

Note: The package is named `writenex` (not `@writenex/app`), filter accordingly.

## Notes

- Package manager: pnpm 10.15.1
- Build tool: Turborepo
- All packages use `workspace:*` protocol
- React/React DOM are peer dependencies for library packages
- TypeScript configs extend from `@writenex/tsconfig`
