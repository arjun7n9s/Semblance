#!/usr/bin/env node
/**
 * Build dist/semblance-store.zip — Chrome Web Store package, runtime files only.
 *
 *   node scripts/pack-store.mjs
 *
 * Includes: manifest, background, shared, popup, sidepanel, content, icons, demo.
 * Excludes: docs/, scripts/, markdown, .git, soak/, transcripts, dist staging.
 * Freeze: refuses host_permissions, IdP content-script matches, and inject APIs.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const stageDir = path.join(distDir, "store-stage");
const zipPath = path.join(distDir, "semblance-store.zip");

const RUNTIME_ROOTS = [
  "manifest.json",
  "background",
  "shared",
  "popup",
  "sidepanel",
  "content",
  "icons",
  "demo"
];

const SKIP_DIR_NAMES = new Set([
  ".git",
  ".github",
  ".cursor",
  "docs",
  "scripts",
  "dist",
  "node_modules",
  "soak",
  "transcripts",
  "cloud-agent-transcripts",
  "teja5511"
]);

const SKIP_FILE_NAMES = new Set([".DS_Store", "Thumbs.db", ".gitignore"]);
const SKIP_FILE_RE = /\.(md|map|log|soaks?)$/i;
const INJECT_RE = /chrome\.scripting|executeScript|insertCSS|registerContentScripts|declarativeNetRequest|chrome\.cookies|chrome\.webRequest/;
const IDP_HOST_RE = /accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com/;

function fail(message) {
  console.error("pack-store: " + message);
  process.exit(1);
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function shouldSkipName(name, isDir) {
  if (SKIP_DIR_NAMES.has(name) || name.startsWith("soak")) {
    return true;
  }
  if (isDir) {
    return false;
  }
  if (SKIP_FILE_NAMES.has(name) || SKIP_FILE_RE.test(name)) {
    return true;
  }
  return false;
}

function collect(rel, acc) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    fail("missing runtime path: " + rel);
  }
  const st = fs.statSync(full);
  if (st.isDirectory()) {
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      if (shouldSkipName(entry.name, entry.isDirectory())) {
        continue;
      }
      collect(path.posix.join(rel, entry.name), acc);
    }
    return;
  }
  acc.push(rel.split(path.sep).join("/"));
}

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyIntoStage(rel) {
  const from = path.join(root, rel);
  const to = path.join(stageDir, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function writeZip(stage, dest) {
  const py = `
import os, sys, zipfile
root, dest = sys.argv[1], sys.argv[2]
count = 0
with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d != ".git")
        for name in sorted(filenames):
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            zf.write(full, rel)
            count += 1
print(count)
`;
  const result = spawnSync("python3", ["-c", py, stage, dest], { encoding: "utf8" });
  if (result.status !== 0) {
    fail("zip failed:\n" + (result.stderr || result.stdout || "python3 zipfile error"));
  }
  return Number(String(result.stdout || "").trim()) || 0;
}

function listZip(dest) {
  const py = `
import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as zf:
    for name in zf.namelist():
        print(name)
`;
  const result = spawnSync("python3", ["-c", py, dest], { encoding: "utf8" });
  if (result.status !== 0) {
    fail("could not list zip");
  }
  return String(result.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

const manifest = readJson("manifest.json");
if (manifest.manifest_version !== 3) {
  fail("manifest_version must be 3");
}
if (Array.isArray(manifest.host_permissions) && manifest.host_permissions.length) {
  fail("store package must not ship host_permissions (no IdP inject)");
}
const perms = Array.isArray(manifest.permissions) ? manifest.permissions : [];
const bannedPerm = /scripting|webRequest|declarativeNetRequest|identity|cookies|debugger|proxy|tabCapture/;
if (perms.some((perm) => bannedPerm.test(perm))) {
  fail("store package must not ship inject/surveillance permissions: " + perms.join(", "));
}
for (const script of manifest.content_scripts || []) {
  const matches = script.matches || [];
  if (!matches.every((rule) => String(rule).startsWith("file:"))) {
    fail("content_scripts must stay on file:// demo fallback — no live IdP inject");
  }
  if (IDP_HOST_RE.test(JSON.stringify(script))) {
    fail("content_scripts must not mention live identity-provider hosts");
  }
  const globs = script.include_globs || [];
  if (!globs.length || !globs.every((glob) => /demo\/(allow|lure)\.html/.test(glob))) {
    fail("content_scripts include_globs must stay on demo pages");
  }
}

const files = [];
for (const rel of RUNTIME_ROOTS) {
  collect(rel, files);
}
files.sort();

const required = [
  "manifest.json",
  "background/service-worker.js",
  "shared/watch.js",
  "shared/scopes.js",
  "shared/storage.js",
  "shared/remind.js",
  "popup/popup.html",
  "sidepanel/sidepanel.html",
  "content/demo-coach.js",
  "demo/allow.html",
  "demo/lure.html",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png"
];
for (const rel of required) {
  if (!files.includes(rel)) {
    fail("runtime package missing " + rel);
  }
}

for (const rel of files) {
  if (rel.endsWith(".js") || rel.endsWith(".html") || rel.endsWith(".json")) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    if (INJECT_RE.test(text)) {
      fail("inject/surveillance API in " + rel);
    }
  }
}

rmrf(stageDir);
fs.mkdirSync(stageDir, { recursive: true });
for (const rel of files) {
  copyIntoStage(rel);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}
const packed = writeZip(stageDir, zipPath);
rmrf(stageDir);

const names = listZip(zipPath);
const forbiddenZip = names.filter(
  (name) =>
    name.startsWith("docs/") ||
    name.startsWith("scripts/") ||
    name.startsWith(".git") ||
    /(^|\/)soak/i.test(name) ||
    /transcript/i.test(name) ||
    /\.md$/i.test(name)
);
if (forbiddenZip.length) {
  fail("zip contains excluded paths:\n" + forbiddenZip.join("\n"));
}
if (!names.includes("manifest.json")) {
  fail("zip must have manifest.json at the root (load this folder, not a nested repo root)");
}

const st = fs.statSync(zipPath);
console.log("Wrote " + path.relative(root, zipPath).split(path.sep).join("/"));
console.log("files " + packed);
console.log("bytes " + st.size);
for (const name of names) {
  console.log("  " + name);
}
console.log("Semblance store package ok — no live IdP inject");
