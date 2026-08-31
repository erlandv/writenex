# Migrate from ESLint and Prettier

Canonical EN sources:
- `/home/xs/aiko/website/src/content/docs/guides/migrate-eslint-prettier.mdx`
- `/home/xs/aiko/website/src/content/docs/reference/cli.mdx`
- `/home/xs/aiko/website/src/content/docs/linter/index.mdx`
- `/home/xs/aiko/website/src/content/docs/linter/rules-sources.mdx`

## Fast path

```bash
biome migrate eslint --write
biome migrate prettier --write
```

Run ESLint migration first, then Prettier migration.

## ESLint migration workflow

1. Ensure `biome.json` exists (`biome init` if needed).
2. Run ESLint migration:

```bash
biome migrate eslint --write
```

3. If needed, include inspired-rule mappings:

```bash
biome migrate eslint --write --include-inspired
```

4. If requested, include nursery rules:

```bash
biome migrate eslint --write --include-nursery
```

5. Review generated `biome.json`:
- Rule renames and category mapping
- Overrides conversion
- Global variables migration
- Ignore behavior alignment
- Baseline changes (the command may overwrite existing configuration details, including previous recommended defaults)

## ESLint migration capabilities and limits

- Supports legacy and flat ESLint config formats.
- Supports `extends` resolution for legacy configs.
- Migrates `.eslintignore`.
- Needs Node.js to resolve plugins and shared configs.
- Flat config loading targets JavaScript extensions (`.js`, `.cjs`, `.mjs`).
- Does not support YAML ESLint config.
- Behavior parity with ESLint is not guaranteed.
- Some shared/plugin configs may include cyclic references and can fail to load.

## Prettier migration notes

- Biome is close to Prettier but has different defaults.
- `biome migrate prettier --write` ports supported options into `biome.json`.
- The command attempts to find `.prettierrc`/`prettier.json` and `.prettierignore`.
- JavaScript-based Prettier configs require Node.js.
- JSON5/TOML/YAML Prettier configs are not supported by migration command.

## Rule mapping and option parity checks

- Use the rules source mapping page to find Biome equivalents of ESLint and plugin rules.
- Expect imperfect parity: some Biome rules intentionally omit options from original ESLint/plugin rules.
- Validate critical team policies manually after migration.

## Post-migration checks

Run these before and after enabling write mode in CI:

```bash
biome check .
biome check --write .
biome ci .
```

If migration introduces too many diagnostics at once, stabilize with temporary suppressions:

```bash
biome lint --write --unsafe --suppress="suppressed due to migration"
```

Then remove suppressions incrementally.

## Ignore parity checklist

- If ignore behavior changed compared with ESLint/Prettier, enable VCS integration.
- Verify:
  - `vcs.enabled`
  - `vcs.clientKind`
  - `vcs.useIgnoreFile`
