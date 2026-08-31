# Performance and Tracing

Source: `src/content/docs/guides/investigate-slowness.mdx`.

## Quick triage

Before deep tracing:
- Exclude build outputs with `!!` in `files.includes` (for example `dist/`, `build/`).
- Check whether project-domain rules are causing overhead.
- If needed, temporarily reduce indexing scope to identify expensive dependencies.

## Generate tracing logs

```bash
biome lint --log-level=tracing --log-kind=json --log-file=tracing.json
```

## Inspect hotspots with jq

Module graph hotspots:

```bash
cat tracing.json | jq 'select(.span.name == "update_module_graph_internal") | { path: .span.path, time_busy: .["time.busy"], time_idle: .["time.idle"] }'
```

Diagnostics hotspots:

```bash
cat tracing.json | jq 'select(.span.name == "pull_diagnostics") | { path: .span.path, time_busy: .["time.busy"], time_idle: .["time.idle"] }'
```

Useful span names:
- `format_file`
- `open_file_internal` (includes parse/open timing and reason metadata)

Use hotspot output to tune `files.includes`, override rule severity/scope, or exclude problematic generated/vendor paths.
