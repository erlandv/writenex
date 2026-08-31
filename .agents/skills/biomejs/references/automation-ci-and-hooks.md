# Automation: CI and Git Hooks

Sources:
- `src/content/docs/recipes/continuous-integration.mdx`
- `src/content/docs/recipes/git-hooks.mdx`
- `src/content/docs/linter/plugins.mdx`

## CI command choice

Prefer `biome ci` in CI pipelines over `biome check`:
- no write/fix mode
- better CI integration/reporting
- supports CI-oriented behavior with VCS integration

## CI patterns

- GitHub Actions: use `biomejs/setup-biome` then `biome ci .`
- If config extends packages/plugins, install dependencies before running Biome.
- GitLab: use reporter output (for example `--reporter=gitlab`).

## Pre-commit / pre-push options

Supported manager patterns include:
- Lefthook
- Husky + lint-staged
- Husky + git-format-staged
- pre-commit framework
- custom shell hooks

For staged-file workflows, these flags are frequently useful:
- `--files-ignore-unknown=true`
- `--no-errors-on-unmatched`
- `--staged` (local git hooks)

## Linter plugins (GritQL)

Biome supports GritQL-based plugins via `.grit` files:

```json
{
  "plugins": ["./path-to-plugin.grit"]
}
```

Use plugin diagnostics for organization-specific code-pattern policies that built-in rules do not cover.
