# Getting Started with BiomeJS

Source baseline: `src/content/docs/guides/getting-started.mdx`.

## Install

Install Biome as a dev dependency and pin the version.

```bash
npm i -D -E @biomejs/biome
```

Equivalent commands for other package managers are acceptable.

## Initialize config

```bash
biome init
```

This generates `biome.json` with defaults.

## Core commands

Use one command family consistently:

```bash
biome format --write
biome lint --write
biome check --write
```

- `format`: formatter only
- `lint`: linter only (safe fixes with `--write`)
- `check`: formatter + linter + organize imports

## Editor and CI

- Prefer first-party editor extensions where available.
- Use `biome ci` in CI for enforcement.
