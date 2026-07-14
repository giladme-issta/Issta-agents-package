#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const SOURCE_ROOT = path.resolve(__dirname, "..");
const PKG = JSON.parse(
  fs.readFileSync(path.join(SOURCE_ROOT, "package.json"), "utf8"),
);
const ENTRIES = [
  "agents",
  "skills",
  "memory",
  "help-docs",
  "copilot-instructions.md",
];
const OLD_PATH_REGEX = /c:\\Users\\giladme\\\.copilot/gi;

const COMMON_BLOCK_SRC = path.join(SOURCE_ROOT, "shared", "common-block.md");
const PLACEHOLDER = "<!-- {{COMMON_BLOCK}} -->";
const BLOCK_START_MARKER = "<!-- COMMON-BLOCK v2";
const BLOCK_END_MARKER = "<!-- END COMMON-BLOCK -->";

let _commonBlock = null;
function getCommonBlock() {
  if (_commonBlock === null) {
    _commonBlock = fs.existsSync(COMMON_BLOCK_SRC)
      ? fs.readFileSync(COMMON_BLOCK_SRC, "utf8").trimEnd()
      : "";
  }
  return _commonBlock;
}

function injectCommonBlock(content) {
  const block = getCommonBlock();
  if (!block) return content;

  // Case 1: raw placeholder → fresh inject
  if (content.includes(PLACEHOLDER)) {
    return content.replace(PLACEHOLDER, block);
  }

  // Case 2: already-injected block → replace region on re-install
  const startIdx = content.indexOf(BLOCK_START_MARKER);
  const endIdx = content.indexOf(BLOCK_END_MARKER);
  if (startIdx !== -1 && endIdx !== -1) {
    return (
      content.slice(0, startIdx) +
      block +
      content.slice(endIdx + BLOCK_END_MARKER.length)
    );
  }

  return content;
}

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
  const destRoot = path.join(os.homedir(), ".copilot");
  const created = [];
  const updated = [];

  console.log(
    `\nInstalling Issta Copilot workspace v${PKG.version} into: ${destRoot}\n`,
  );

  for (const entry of ENTRIES) {
    const srcAbs = path.join(SOURCE_ROOT, entry);
    for (const srcFile of listFiles(srcAbs)) {
      const relPath = path.relative(SOURCE_ROOT, srcFile);
      const destFile = path.join(destRoot, relPath);

      const isNew = !fs.existsSync(destFile);
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      let content = fs.readFileSync(srcFile, "utf8");
      if (srcFile.endsWith(".agent.md")) {
        content = injectCommonBlock(content);
      }
      fs.writeFileSync(destFile, content.replace(OLD_PATH_REGEX, destRoot));
      if (isNew) {
        created.push(relPath);
      } else {
        updated.push(relPath);
      }
    }
  }

  // Write version stamp
  const versionFile = path.join(destRoot, ".copilot-version");
  fs.writeFileSync(
    versionFile,
    `v${PKG.version} — installed ${new Date().toISOString().slice(0, 10)}\n`,
  );

  if (created.length > 0) {
    console.log(`${created.length} new file(s) created:`);
    for (const file of created) {
      console.log(`  + ${file}`);
    }
  }
  if (updated.length > 0) {
    console.log(`\n${updated.length} file(s) updated (overwritten):`);
    for (const file of updated) {
      console.log(`  ↑ ${file}`);
    }
  }
  if (created.length === 0 && updated.length === 0) {
    console.log("All files already up to date.");
  }
  console.log(`\nVersion stamp: v${PKG.version}`);
}

install();
