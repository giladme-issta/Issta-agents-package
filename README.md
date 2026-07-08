# Issta Copilot Setup

Installs this repository's shared Copilot workspace into `~/.copilot`.

## What gets installed

- `agents/`
- `skills/`
- `memory/`
- `help-docs/`
- `copilot-instructions.md`

The installer only adds missing files. Existing files in `~/.copilot` are left untouched.

## How coworkers should run it

Do not use `npx install issta-copilot-setup`.

Use one of these instead:

### From GitHub

```bash
npx github:giladme-issta/Issta-agents-package
```

### From npm package

After this package is published, coworkers can run:

```bash
npx issta-copilot-setup
```

## Publish checklist

1. Sign in to the npm registry you want to use.
2. Publish this package from the repository root.
3. Share `npx issta-copilot-setup` with coworkers.
