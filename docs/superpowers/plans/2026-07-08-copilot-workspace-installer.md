# Copilot Workspace Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this repo into an installable CLI so teammates can run `npx github:<org>/<repo>` and get an identical, correctly-pathed copy of `agents/`, `skills/`, `memory/`, `help-docs/`, and `copilot-instructions.md` under their own `~/.copilot`.

**Architecture:** A single dependency-free Node script (`bin/install.js`), declared as the package's `bin`, walks the repo's known top-level entries file-by-file, copies any file missing at the destination (never overwriting), and rewrites the one hardcoded path (`c:\Users\giladme\.copilot`) to each machine's real `~/.copilot` path while copying.

**Tech Stack:** Node.js core modules only (`fs`, `path`, `os`, `child_process`) — no runtime or dev dependencies. Tests use Node's built-in `node:test` runner.

## Global Constraints

- Zero runtime dependencies — Node core only.
- Distribution is via `npx github:<org>/<repo>` — no npm registry (public or private) involved.
- Never overwrite an existing destination file — skip-if-exists only; no `--force`/update flag.
- Path templating: literal case-insensitive replace of `c:\Users\giladme\.copilot` with `path.join(os.homedir(), '.copilot')`, applied only to files being newly copied.
- Entries installed: `agents/`, `skills/`, `memory/`, `help-docs/`, `copilot-instructions.md` (fixed list, nothing else).
- Node >= 18.0.0 (required for the built-in `node:test` runner used by the test suite).
- Out of scope: CI, registry publishing, a `--force` flag, cross-platform installer packaging (the mechanism happens to work on macOS/Linux for free via `os.homedir()`, but the copied *content* still hardcodes Windows-style paths).

---

### Task 1: Installer CLI (package.json + bin/install.js)

**Files:**
- Create: `package.json`
- Create: `bin/install.js`
- Create: `test/install.test.js`

**Interfaces:**
- Produces: a runnable CLI at `bin/install.js`, invoked as `node bin/install.js` (and, once packaged, as the `issta-copilot-setup` bin command). No other task in this plan depends on its internals — it's a single self-contained script.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "issta-copilot-setup",
  "version": "1.0.0",
  "private": true,
  "description": "Installs the shared Issta Copilot agents/skills/memory workspace into ~/.copilot",
  "bin": {
    "issta-copilot-setup": "bin/install.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: Write the failing test file**

Create `test/install.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const REPO_ROOT = path.resolve(__dirname, '..');
const INSTALL_SCRIPT = path.join(REPO_ROOT, 'bin', 'install.js');

function makeFakeHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-install-test-'));
}

function runInstaller(fakeHome) {
  execFileSync(process.execPath, [INSTALL_SCRIPT], {
    env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome },
  });
}

test('fresh install copies all files and templates the destination path', () => {
  const fakeHome = makeFakeHome();
  try {
    runInstaller(fakeHome);

    const destRoot = path.join(fakeHome, '.copilot');
    const agentFile = path.join(destRoot, 'agents', 'Aluf.agent.md');
    const instructionsFile = path.join(destRoot, 'copilot-instructions.md');

    assert.ok(fs.existsSync(agentFile), 'agents/Aluf.agent.md should be copied');
    assert.ok(fs.existsSync(instructionsFile), 'copilot-instructions.md should be copied');

    const instructions = fs.readFileSync(instructionsFile, 'utf8');
    assert.ok(!/giladme/i.test(instructions), 'old username should not remain in copied content');
    assert.ok(
      instructions.includes(destRoot),
      "copied content should reference this machine's real .copilot path"
    );
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test('existing destination files are skipped, missing ones are still copied', () => {
  const fakeHome = makeFakeHome();
  try {
    const destRoot = path.join(fakeHome, '.copilot');
    fs.mkdirSync(destRoot, { recursive: true });
    const instructionsFile = path.join(destRoot, 'copilot-instructions.md');
    fs.writeFileSync(instructionsFile, 'SENTINEL-DO-NOT-OVERWRITE');

    runInstaller(fakeHome);

    const afterContent = fs.readFileSync(instructionsFile, 'utf8');
    assert.equal(afterContent, 'SENTINEL-DO-NOT-OVERWRITE', 'existing file must not be overwritten');

    const agentFile = path.join(destRoot, 'agents', 'Aluf.agent.md');
    assert.ok(fs.existsSync(agentFile), 'files missing at destination should still be copied');
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `node --test`
Expected: FAIL — `bin/install.js` does not exist yet, so `execFileSync` throws `ENOENT` in both tests.

- [ ] **Step 4: Implement `bin/install.js`**

```javascript
#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SOURCE_ROOT = path.resolve(__dirname, '..');
const ENTRIES = ['agents', 'skills', 'memory', 'help-docs', 'copilot-instructions.md'];
const OLD_PATH_REGEX = /c:\\Users\\giladme\\\.copilot/gi;

function listFiles(absPath) {
  const stat = fs.statSync(absPath);
  if (stat.isFile()) {
    return [absPath];
  }
  const results = [];
  for (const name of fs.readdirSync(absPath)) {
    results.push(...listFiles(path.join(absPath, name)));
  }
  return results;
}

function install() {
  const destRoot = path.join(os.homedir(), '.copilot');
  const copied = [];
  const skipped = [];

  for (const entry of ENTRIES) {
    const srcAbs = path.join(SOURCE_ROOT, entry);
    for (const srcFile of listFiles(srcAbs)) {
      const relPath = path.relative(SOURCE_ROOT, srcFile);
      const destFile = path.join(destRoot, relPath);

      if (fs.existsSync(destFile)) {
        skipped.push(relPath);
        continue;
      }

      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      const content = fs.readFileSync(srcFile, 'utf8');
      fs.writeFileSync(destFile, content.replace(OLD_PATH_REGEX, destRoot));
      copied.push(relPath);
    }
  }

  console.log(`Installing Issta Copilot workspace into: ${destRoot}`);
  console.log(`${copied.length} file(s) copied.`);
  for (const file of copied) {
    console.log(`  + ${file}`);
  }
  if (skipped.length > 0) {
    console.log(`${skipped.length} file(s) skipped (already existed).`);
    for (const file of skipped) {
      console.log(`  = ${file}`);
    }
  }
}

install();
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `node --test`
Expected: PASS — both tests green (`# pass 2`, `# fail 0`).

- [ ] **Step 6: Commit**

```bash
git add package.json bin/install.js test/install.test.js
git commit -m "Add npx-installable CLI for the Copilot workspace"
```

---

## Manual Verification (not automated — do after Task 1 passes)

- [ ] Run `node bin/install.js` for real (with your actual `USERPROFILE`) is **not** needed since you already have `~/.copilot` populated by hand — the automated tests above cover the behavior safely via a fake home directory. Skip running it against your real home directory to avoid confusing your existing setup with itself.
- [ ] Once you've created and pushed the GitHub repo, one teammate should run `npx github:<org>/<repo>` on a machine with no `~/.copilot` yet, and confirm the resulting instructions/skill files correctly point at *their* username, not `giladme`.
