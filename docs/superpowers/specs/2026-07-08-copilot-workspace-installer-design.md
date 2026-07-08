# Copilot Workspace Installer — Design

**Date:** 2026-07-08
**Status:** Approved

## Purpose

Distribute this repo's Copilot agent/skill/memory workspace (`agents/`, `skills/`,
`memory/`, `help-docs/`, `copilot-instructions.md`) to other Issta developers, so
each teammate ends up with an identical, working copy at their own
`C:\Users\<their-username>\.copilot`.

Audience: internal Issta teammates only. Content (Gimmonix adapter details, Issta
stack conventions, hotel-domain agents) is proprietary and stays out of any public
or third-party registry.

## Distribution mechanism

- This repo becomes the single source of truth. No npm registry (public or
  private) is involved.
- Teammates run `npx github:<org>/<repo>` (placeholder — real org/repo supplied
  once the user creates the GitHub repo).
- npx clones the repo and runs its declared `bin` script; there is nothing to
  publish or version on a registry.

## Repo additions

```
agents-arch/
  bin/
    install.js         # the installer, see below
  package.json          # declares "bin": { "issta-copilot-setup": "bin/install.js" }
  (existing: agents/, skills/, memory/, help-docs/, copilot-instructions.md)
```

`package.json` has zero runtime dependencies — only Node.js core modules
(`fs`, `path`, `os`) are used.

## Install script behavior

1. Compute `destRoot = path.join(os.homedir(), '.copilot')`.
2. Define the fixed list of top-level source entries to install:
   `agents/`, `skills/`, `memory/`, `help-docs/`, `copilot-instructions.md`.
3. Recursively walk each source entry file-by-file (not folder-by-folder).
4. For each source file:
   - Compute the corresponding destination path under `destRoot`.
   - If the destination file already exists → **skip it**, record as skipped.
   - If it does not exist → create parent directories as needed, then copy it,
     applying path templating (below), record as copied.
5. Print a summary at the end: counts and paths of files copied vs. skipped.

This means:
- First run on a fresh machine performs a full install.
- A later re-run (e.g. after the repo owner adds a new skill or agent file)
  picks up only the new files — anything the teammate already has, including a
  file the owner has since edited upstream, is left untouched.
- `memory/entries/*` created during actual usage are never overwritten, since
  the installer only ever adds files that don't yet exist.
- No `--force`/update flag, no auto-sync, no CI/publishing pipeline. Explicitly
  out of scope per the approved design — the repo owner will handle pushing
  updates and telling teammates to re-run the command.

## Path templating

13 files under `agents/`, `skills/`, `copilot-instructions.md`, and
`help-docs/architecture.html` hardcode the literal path
`c:\Users\giladme\.copilot\...` (the repo owner's own machine).

While copying any file whose content is being written (i.e. new files only,
per the skip-if-exists rule above), the installer performs a case-insensitive
literal string replace:

```
c:\Users\giladme\.copilot   →   <destRoot on this machine>
```

`destRoot` is computed via `os.homedir()`, so each teammate's copied files
correctly reference their own home directory instead of the original author's.

## Edge cases

- `.copilot` does not exist yet → created (including all parent dirs as needed).
- `.copilot` already exists (e.g. GitHub Copilot CLI's own session/config data
  lives there) → left alone except for the specific known files/folders being
  added; nothing unrelated is touched, moved, or deleted.
- Script never deletes or truncates anything — it only creates files that are
  currently missing.

## Testing plan

Run the install script against a scratch fake-home directory (not the real
`.copilot`), twice:
1. Clean directory → confirm full copy + correct path templating in the output
   files.
2. Directory with some files pre-existing → confirm those are skipped and
   reported as such, while missing files are still copied.

## Explicitly out of scope

- Public or private npm registry publishing.
- Update/force-overwrite flag.
- Cross-platform packaging beyond what `os.homedir()`/Node core already gives
  for free (Windows is the primary target; the mechanism happens to work on
  macOS/Linux too since all paths are computed, not hardcoded, in the script
  itself — only the *content being copied* hardcodes a Windows-style path).
- CI, automated tests, GitHub Actions.

## Next steps (outside this repo)

1. User creates a new GitHub repo under their own account.
2. User adds it as a remote and pushes.
3. User shares the `npx github:<their-username>/<repo>` command with teammates.
