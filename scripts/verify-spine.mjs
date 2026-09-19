import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

function loadScript(rel) {
  const context = { globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read(rel), context, { filename: rel });
  return context;
}

const manifest = JSON.parse(read("manifest.json"));
const errors = [];

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}
if (!manifest.action?.default_popup) {
  errors.push("popup missing");
}
if (!manifest.permissions?.includes("storage")) {
  errors.push("storage permission missing");
}

const forbiddenHosts = /accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com/;
const matches = JSON.stringify(manifest.content_scripts || []);
if (forbiddenHosts.test(matches)) {
  errors.push("content_scripts must not match live identity providers");
}
for (const script of manifest.content_scripts || []) {
  const globs = script.include_globs || [];
  const onlyDemo = globs.every((glob) => /demo\/(allow|lure)\.html/.test(glob));
  if (!onlyDemo) {
    errors.push("content_scripts include_globs must stay on demo pages");
  }
}

const scopes = loadScript("shared/scopes.js").SemblanceScopes;
if (!scopes || scopes.all.length < 15) {
  errors.push("need at least 15 scope translations");
}

const rituals = loadScript("shared/rituals.js").SemblanceRituals;
const ritualCases = [
  ["http://localhost:4173/callback?code=abc", "localhost-url"],
  ["https://example.test/cb?redirect_uri=http%3A%2F%2Flocalhost%3A3000", "redirect-localhost"],
  ["https://app.test/oauth?code=SplendidCode", "auth-code"],
  ["Enter code ABCD-EFGH on the device page", "device-code"],
  ["open microsoft.com/devicelogin", "device-login-host"],
  [
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "jwt-shape"
  ],
  ["access_token=not-a-real-token", "access-token-word"]
];

for (const [sample, id] of ritualCases) {
  const hit = rituals.inspect(sample).some((item) => item.id === id);
  if (!hit) {
    errors.push("ritual miss for " + id);
  }
}

const banner = read("demo/allow.html");
if (!/FAKE — not Google\/Microsoft/.test(banner) && !/FAKE — not Google\/Microsoft/.test(banner.replace("—", "—"))) {
  if (!banner.includes("FAKE") || !banner.includes("not Google/Microsoft")) {
    errors.push("fake allow banner copy missing");
  }
}

const forbiddenVoice = /TLN|Tech Literacy Network|Devpost|hackathon|contest|competition/i;
for (const rel of [
  "README.md",
  "manifest.json",
  "popup/popup.html",
  "demo/lure.html",
  "demo/allow.html"
]) {
  if (forbiddenVoice.test(read(rel))) {
    errors.push("forbidden framing in " + rel);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Semblance spine ok");
console.log("scopes", scopes.all.length);
console.log("ritual rules", rituals.rules.length);
