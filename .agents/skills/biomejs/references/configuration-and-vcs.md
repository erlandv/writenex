# Configuration and VCS Integration

Sources:
- `src/content/docs/guides/configure-biome.mdx`
- `src/content/docs/guides/integrate-in-vcs.mdx`

## Config file location and naming

Use one of:
- `biome.json`
- `biome.jsonc`
- `.biome.json`
- `.biome.jsonc`

Biome resolves from current directory upward to parent folders, then home config directories.

## Tool toggles and language overrides

You can disable tools globally:

```json
{
  "formatter": { "enabled": false },
  "linter": { "enabled": false },
  "assist": { "enabled": false }
}
```

Use language-specific override blocks (`javascript`, `json`, etc.) for targeted behavior.

## File targeting

- Use CLI paths to constrain current run scope.
- Use `files.includes` for global project-level scoping.
- Use `<tool>.includes` for tool-specific filtering.
- Use negated patterns:
  - `!` exclude from lint/format
  - `!!` exclude from project indexing-related operations

## Protected lock files

Biome protects some lock files and does not emit diagnostics for them, including:
- `package-lock.json`
- `yarn.lock`
- `npm-shrinkwrap.json`
- `composer.lock`

## VCS integration

Enable Git integration explicitly:

```json
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  }
}
```

Useful commands:

```bash
biome check --changed
biome check --changed --since=next
biome check --staged
```

Use this especially during migrations from ESLint/Prettier to preserve ignore expectations.
