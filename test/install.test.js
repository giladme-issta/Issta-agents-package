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
