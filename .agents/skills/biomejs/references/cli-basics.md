# Biome CLI Basics

Source summary: `src/content/docs/reference/cli.mdx`.

## Common commands

```bash
biome init
biome format [--write] [paths...]
biome lint [--write] [paths...]
biome check [--write] [paths...]
biome ci [paths...]
biome migrate eslint --write
biome migrate prettier --write
```

## Useful global options

- `--config-path <path>`: force config location/resolution root
- `--max-diagnostics <none|n>`: cap diagnostics
- `--error-on-warnings`: fail command if warnings exist
- `--reporter <type>` and `--reporter-file <path>`: structured output for CI systems
- `--diagnostic-level <info|warn|error>`: filter displayed diagnostics

## CI-oriented guidance

- Prefer `biome ci` in pipelines.
- Use reporter selection (`github`, `junit`, `gitlab`, `sarif`, etc.) based on CI integration target.
- Consider `--error-on-warnings` for stricter gating.
