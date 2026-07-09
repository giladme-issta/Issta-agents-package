#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const SOURCE_ROOT = path.resolve(__dirname, "..");
const ENTRIES = [
  "agents",
  "skills",
  "memory",
  "help-docs",
  "copilot-instructions.md",
];
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
  const destRoot = path.join(os.homedir(), ".copilot");
  const created = [];
  const updated = [];

  for (const entry of ENTRIES) {
    const srcAbs = path.join(SOURCE_ROOT, entry);
    for (const srcFile of listFiles(srcAbs)) {
      const relPath = path.relative(SOURCE_ROOT, srcFile);
      const destFile = path.join(destRoot, relPath);

      const isNew = !fs.existsSync(destFile);
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      const content = fs.readFileSync(srcFile, "utf8");
      fs.writeFileSync(destFile, content.replace(OLD_PATH_REGEX, destRoot));
      if (isNew) {
        created.push(relPath);
      } else {
        updated.push(relPath);
      }
    }
  }

  console.log(`\nInstalling Issta Copilot workspace into: ${destRoot}\n`);
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
    console.log("Nothing to install.");
  }
}

install();
