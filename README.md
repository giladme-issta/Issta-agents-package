# Issta Copilot Setup

Installs this repository's shared Copilot workspace into `~/.copilot`.

## Architecture (v2)

```
User → @Router → Lead specialist (implements)
                      ↓  multi-domain tasks
               Handoff note → Dependent specialist
```

```
@Coach  (run weekly, never during tasks)
  reads: memory/telemetry.log + memory/domains/*.md
  outputs: trend table + proposed diffs to agent/skill files
```

## What gets installed

- `agents/` — Router + 5 specialists + Code-Reviewer + Coach (common-block injected on install)
- `skills/` — issta-stack, angular-patterns, dotnet-clean-arch, gimmonix-adapter, gtm-ga4-tracking, owasp-security
- `memory/` — domain insight files + telemetry.log
- `help-docs/`
- `copilot-instructions.md`

## How coworkers should run it

```bash
# From npm (after publish)
npx issta-copilot-setup

# From GitHub directly
npx github:giladme-issta/Issta-agents-package
```

## Publish checklist

1. Sign in to the npm registry.
2. `npm publish` from the repository root.
3. Share `npx issta-copilot-setup` with coworkers.
