# biomejs

Quick-start documentation for the `biomejs` skill.

## Purpose

Use this skill to adopt and operate BiomeJS in JavaScript/TypeScript projects, including setup, configuration, file scoping, VCS integration, CI flows, and troubleshooting.

## Main Files

- `SKILL.md` - trigger and workflow instructions for the agent
- `agents/openai.yaml` - UI metadata for Codex skill list/chips
- `references/getting-started.md` - setup, install, and baseline command flow
- `references/configuration-and-vcs.md` - config structure, includes/excludes, and VCS integration
- `references/advanced-configuration-templates.md` - advanced config patterns and templates
- `references/cli-basics.md` - practical CLI command and option usage
- `references/monorepo-and-upgrades.md` - monorepo patterns and upgrade notes
- `references/performance-tracing.md` - slowness investigation and tracing
- `references/automation-ci-and-hooks.md` - CI and pre-commit automation patterns

## Expected Outputs from the Skill

- A concrete Biome adoption/configuration plan
- A validated `biome.json`/`biome.jsonc` strategy with safe file scope
- Command sequences for local checks and CI (`check`, `check --write`, `ci`)
- Troubleshooting steps for diagnostics, config, and performance issues

## Typical Requests

- Set up Biome in a new or existing JS/TS repository.
- Configure include/exclude behavior and VCS ignore integration.
- Tune formatter/linter/check workflows for team usage.
- Apply monorepo/shared-config strategy and upgrade safely.
- Investigate slow runs and stabilize CI behavior.
