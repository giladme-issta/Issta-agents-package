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
