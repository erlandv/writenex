# eslint-prettier-migration

Quick-start documentation for the `eslint-prettier-migration` skill.

## Purpose

Use this skill to migrate projects from ESLint and/or Prettier to BiomeJS with controlled sequencing, explicit migration flag choices, parity checks, and post-migration stabilization.

## Main Files

- `SKILL.md` - trigger and migration workflow instructions for the agent
- `agents/openai.yaml` - UI metadata for Codex skill list/chips
- `references/eslint-prettier-migration.md` - migration playbook with command flow, caveats, and validation checklist

## Expected Outputs from the Skill

- A migration path (ESLint-only, Prettier-only, or combined)
- Command sequence with explicit flags (`--include-inspired`, `--include-nursery` when needed)
- Review checklist for generated `biome.json` changes and ignore parity
- Validation/stabilization sequence (`check`, `check --write`, `ci`, optional suppress flow)

## Typical Requests

- Replace ESLint and Prettier with Biome in an existing codebase.
- Port legacy/flat ESLint config and Prettier config into `biome.json`.
- Preserve ignore behavior and verify VCS-related parity.
- Troubleshoot migration limitations (formats, Node.js requirements, parity gaps).
- Stabilize diagnostics after migration before tightening CI gates.
