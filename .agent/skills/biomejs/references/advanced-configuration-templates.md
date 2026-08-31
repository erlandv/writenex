# Advanced Configuration Templates

Source baseline: `src/content/docs/reference/configuration.mdx`.

Use these as starting points and adapt paths/rules for each repository.

## 1) Strict CI with warnings-as-failures

`biome.json`:

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true
  },
  "assist": {
    "enabled": true
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  }
}
```

CI command:

```bash
biome ci --error-on-warnings .
```

## 2) Monorepo root + inheriting package config

Root `biome.json`:

```json
{
  "files": {
    "includes": ["**", "!**/*.generated.*", "!!**/dist", "!!**/build"]
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "lineWidth": 100
  }
}
```

Package-level `packages/foo/biome.json` inheriting root:

```json
{
  "extends": "//",
  "linter": {
    "rules": {
      "suspicious": {
        "noConsole": "off"
      }
    }
  }
}
```

## 3) Generated files: do not lint/format, still allow indexing

```json
{
  "files": {
    "includes": ["**", "!**/*.generated.js", "!**/*.generated.ts"]
  }
}
```

If generated directories also hurt performance, exclude from indexing too:

```json
{
  "files": {
    "includes": ["**", "!!**/generated", "!!**/dist"]
  }
}
```

## 4) Gradual migration from ESLint/Prettier

Phase-oriented baseline:

```json
{
  "files": {
    "includes": ["src/**", "apps/**", "packages/**"]
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true
  },
  "overrides": [
    {
      "includes": ["legacy/**"],
      "linter": {
        "enabled": false
      }
    }
  ]
}
```

Then shrink the disabled area release by release.

## 5) Per-language formatting without global surprises

```json
{
  "formatter": {
    "indentStyle": "space",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  },
  "html": {
    "formatter": {
      "enabled": true
    }
  }
}
```

## 6) Assist/import organization in migration-safe mode

```json
{
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

For lower-change rollouts, run checks without writing first.

## Gotchas to enforce in reviews

- `files.includes` is the outer boundary; tool-level `includes` cannot re-include files outside it.
- Folder exclusion syntax differs:
  - In `files.includes` you can use `!test`.
  - In tool-level includes use `!/test/**`.
- `linter.includes`, `formatter.includes`, `assist.includes` cannot match folders directly; use file globs.
- Paths and globs are resolved relative to the config file location.
- Enable `vcs.useIgnoreFile` when replacing ESLint/Prettier to preserve ignore expectations.
