# Monorepo and Upgrades

Sources:
- `src/content/docs/guides/big-projects.mdx`
- `src/content/docs/guides/upgrade-to-biome-v2.mdx`

## Monorepo strategy (Biome v2+)

- Keep a root `biome.json` as baseline.
- In package-level configs, use `"extends": "//"` to inherit from root.
- Package-level configs that do not inherit should keep `"root": false` and omit `extends`.

Example inherited package config:

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

## Shared config files

- `extends` accepts paths (array form), resolved from the extending config path.
- Paths/globs are interpreted relative to the extending configuration location.
- Extended files cannot chain another `extends`.

## v1 to v2 upgrade checklist

1. Upgrade Biome package version.
2. Run:

```bash
biome migrate --write
```

3. Review these common behavior changes:
- `include` / `ignore` replaced by `includes`.
- Globs are no longer auto-prefixed with `**/`.
- `*` no longer matches `/`.
- Paths/globs in config are relative to config file location.
- `organizeImports` moved to assist actions config shape.
- Recommended/style severities and formatting defaults changed in places.

4. Re-run checks:

```bash
biome check .
biome ci .
```
