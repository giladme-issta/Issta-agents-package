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
    const agentFile = path.join(destRoot, "agents", "Router.agent.md");
    const instructionsFile = path.join(destRoot, "copilot-instructions.md");

    assert.ok(
      fs.existsSync(agentFile),
      "agents/Router.agent.md should be copied",
    );
    assert.ok(
      fs.existsSync(instructionsFile),
      "copilot-instructions.md should be copied",
    );

    const instructions = fs.readFileSync(instructionsFile, "utf8");
    // The hardcoded source path must not remain in any copied content
    const OLD_SOURCE_PATH = "c:\\Users\\giladme\\.copilot";
    assert.ok(
      !instructions.toLowerCase().includes(OLD_SOURCE_PATH.toLowerCase()),
      "hardcoded source path should not remain in copied content",
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

test("installed agent file has common-block injected, not raw placeholder", () => {
  const fakeHome = makeFakeHome();
  try {
    runInstaller(fakeHome);
    const destRoot = path.join(fakeHome, ".copilot");
    const agentFile = path.join(
      destRoot,
      "agents",
      "Hotel-Expert-2017.agent.md",
    );
    const content = fs.readFileSync(agentFile, "utf8");
    assert.ok(
      content.includes("COMMON-BLOCK v2"),
      "installed agent should contain the injected COMMON-BLOCK v2 marker",
    );
    assert.ok(
      !content.includes("{{COMMON_BLOCK}}"),
      "installed agent should not contain the raw placeholder",
    );
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test("re-install refreshes an already-injected common-block", () => {
  const fakeHome = makeFakeHome();
  try {
    runInstaller(fakeHome);
    const destRoot = path.join(fakeHome, ".copilot");
    const agentFile = path.join(
      destRoot,
      "agents",
      "Hotel-Expert-2017.agent.md",
    );

    // Tamper with the injected block to simulate a stale version
    let content = fs.readFileSync(agentFile, "utf8");
    content = content.replace("COMMON-BLOCK v2", "COMMON-BLOCK v2 STALE");
    fs.writeFileSync(agentFile, content);

    // Re-install should refresh the block
    runInstaller(fakeHome);

    const afterContent = fs.readFileSync(agentFile, "utf8");
    assert.ok(
      !afterContent.includes("STALE"),
      "re-install should replace the tampered common-block",
    );
    assert.ok(
      afterContent.includes("COMMON-BLOCK v2"),
      "re-install should restore the correct common-block marker",
    );
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});
