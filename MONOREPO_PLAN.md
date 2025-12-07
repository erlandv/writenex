# Writenex Monorepo Migration Plan

> **Status:** Phase 0 Complete - Planning & Preparation
> **Branch:** `monorepo-migration`
> **Backup:** `pre-monorepo-backup` branch, `v1.0.0-pre-monorepo` tag

## Goal

Migrate single Next.js app to monorepo structure without production downtime.

## Target Structure

```
writenex/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-writenex.yml
│
├── apps/
│   ├── writenex/                  # Core editor (current app)
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   ├── tsconfig.json
│   │   ├── postcss.config.mjs
│   │   ├── vercel.json
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       │   ├── landing/       # App-specific
│   │       │   └── ThemeProvider.tsx
│   │       └── styles/
│   │
│   └── writenex-astro/            # Future: Astro CMS version
│       └── (to be created later)
│
├── packages/
│   ├── utils/                     # @writenex/utils
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── cn.ts
│   │       ├── constants.ts
│   │       ├── storage.ts
│   │       ├── onboarding.ts
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
│   │       └── types/
│   │           └── document.ts
│   │
│   ├── store/                     # @writenex/store
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── editorStore.ts
│   │       └── types/
│   │           └── editor.ts
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
│   │       ├── dialogs/
│   │       ├── panels/
│   │       ├── toolbar/
│   │       ├── indicators/
│   │       └── styles/
│   │
│   └── config/                    # @writenex/config
│       ├── eslint/
│       │   ├── package.json
│       │   └── index.js
│       ├── typescript/
│       │   ├── package.json
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── react-library.json
│       └── tailwind/
│           ├── package.json
│           └── index.ts
│
├── package.json                   # Root workspace
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json                  # Base tsconfig
├── .prettierrc
├── .gitignore
├── LICENSE
└── README.md
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

### Phase 1: Setup Monorepo Foundation
- [ ] Create `pnpm-workspace.yaml`
- [ ] Create `turbo.json`
- [ ] Create root `package.json`
- [ ] Create directory structure
- [ ] Setup shared TypeScript configs

### Phase 2: Extract Packages (Order matters!)
1. [ ] `@writenex/utils` - No internal deps
2. [ ] `@writenex/ui` - Depends on utils
3. [ ] `@writenex/db` - Depends on utils
4. [ ] `@writenex/store` - Depends on db, utils
5. [ ] `@writenex/hooks` - Depends on store, db, utils
6. [ ] `@writenex/editor` - Depends on all above

### Phase 3: Move App
- [ ] Move current app to `apps/writenex`
- [ ] Update all imports
- [ ] Update Vercel configuration

### Phase 4: Verify
- [ ] Local build works
- [ ] Local dev works
- [ ] Deploy to staging
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

## Notes

- Package manager: pnpm 10.15.1
- Build tool: Turborepo
- All packages use `workspace:*` protocol
- React/React DOM are peer dependencies for library packages
- TypeScript configs extend from `@writenex/config/typescript`
