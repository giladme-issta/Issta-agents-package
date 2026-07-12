const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const REPO_ROOT = path.resolve(__dirname, "..");
const INSTALL_SCRIPT = path.join(REPO_ROOT, "bin", "install.js");

function makeFakeHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "copilot-install-test-"));
}

function runInstaller(fakeHome) {
  execFileSync(process.execPath, [INSTALL_SCRIPT], {
    env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome },
  });
}

test("fresh install copies all files and templates the destination path", () => {
  const fakeHome = makeFakeHome();
  try {
    runInstaller(fakeHome);

    const destRoot = path.join(fakeHome, ".copilot");
    const agentFile = path.join(destRoot, "agents", "Aluf.agent.md");
    const instructionsFile = path.join(destRoot, "copilot-instructions.md");

    assert.ok(
      fs.existsSync(agentFile),
      "agents/Aluf.agent.md should be copied",
    );
    assert.ok(
      fs.existsSync(instructionsFile),
      "copilot-instructions.md should be copied",
    );

    const instructions = fs.readFileSync(instructionsFile, "utf8");
    // The hardcoded source path must be replaced; the dest path must appear instead.
    const OLD_SOURCE_PATH = "c:\\Users\\giladme\\.copilot";
    assert.ok(
      !instructions.toLowerCase().includes(OLD_SOURCE_PATH.toLowerCase()),
      "hardcoded source path should not remain in copied content",
    );
    assert.ok(
      instructions.includes(destRoot),
      "copied content should reference this machine's real .copilot path",
    );
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test("re-run overwrites existing files with latest content", () => {
  const fakeHome = makeFakeHome();
  try {
    // First install
    runInstaller(fakeHome);
    const destRoot = path.join(fakeHome, ".copilot");
    const instructionsFile = path.join(destRoot, "copilot-instructions.md");

    // Corrupt the file to simulate stale content
    fs.writeFileSync(instructionsFile, "STALE-CONTENT");

    // Re-run — should overwrite
    runInstaller(fakeHome);

    const afterContent = fs.readFileSync(instructionsFile, "utf8");
    assert.notEqual(
      afterContent,
      "STALE-CONTENT",
      "existing file should be overwritten on re-run",
    );
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test("installs a .copilot-version stamp file", () => {
  const fakeHome = makeFakeHome();
  try {
    runInstaller(fakeHome);
    const versionFile = path.join(fakeHome, ".copilot", ".copilot-version");
    assert.ok(fs.existsSync(versionFile), ".copilot-version should be written");
    const content = fs.readFileSync(versionFile, "utf8");
    assert.match(
      content,
      /^v\d+\.\d+\.\d+/,
      "version stamp should start with vX.Y.Z",
    );
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});
