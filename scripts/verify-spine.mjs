import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else if (/\.(html|js|mjs|css|md|json)$/i.test(entry.name)) {
      acc.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  return acc;
}

function loadScripts(rels, extra = {}) {
  const context = { ...extra };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  for (const rel of rels) {
    vm.runInContext(read(rel), context, { filename: rel });
  }
  return context;
}

function loadScript(rel, extra = {}) {
  return loadScripts([rel], extra);
}

function memoryChrome(withSession = true) {
  function area(bucket) {
    return {
      get(keys, cb) {
        const out = {};
        const list = Array.isArray(keys) ? keys : [keys];
        for (const key of list) {
          if (key && Object.prototype.hasOwnProperty.call(bucket, key)) {
            out[key] = bucket[key];
          }
        }
        cb(out);
      },
      set(partial, cb) {
        Object.assign(bucket, partial);
        if (cb) {
          cb();
        }
      }
    };
  }
  const localBucket = {};
  const sessionBucket = {};
  const chrome = {
    storage: {
      local: area(localBucket)
    }
  };
  if (withSession) {
    chrome.storage.session = area(sessionBucket);
  }
  return { chrome, localBucket, sessionBucket };
}

const manifest = JSON.parse(read("manifest.json"));
const errors = [];

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}
if (!manifest.action?.default_popup) {
  errors.push("popup missing");
}
if (!Array.isArray(manifest.permissions) || manifest.permissions.join() !== "storage") {
  errors.push("permissions must be storage only");
}
if (manifest.host_permissions?.length) {
  errors.push("no host_permissions on the spine");
}
if (manifest.web_accessible_resources) {
  errors.push("web_accessible_resources not needed for popup chrome-extension:// demo tabs");
}

const forbiddenHosts = /accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com/;
const matches = JSON.stringify(manifest.content_scripts || []);
if (forbiddenHosts.test(matches)) {
  errors.push("content_scripts must not match live identity providers");
}
for (const script of manifest.content_scripts || []) {
  const globs = script.include_globs || [];
  const onlyDemo = globs.length > 0 && globs.every((glob) => /demo\/(allow|lure)\.html/.test(glob));
  if (!onlyDemo) {
    errors.push("content_scripts include_globs must stay on demo pages");
  }
  const onlyFile = (script.matches || []).every((rule) => rule.startsWith("file:"));
  if (!onlyFile) {
    errors.push("content_scripts matches must stay on file:// demo fallback");
  }
  const css = script.css || [];
  if (!css.some((item) => item.includes("demo-coach.css"))) {
    errors.push("content_scripts must inject demo-coach.css for file:// fallback");
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
if (!banner.includes("FAKE — not Google/Microsoft") && !banner.includes("FAKE - not Google/Microsoft")) {
  errors.push("fake allow banner copy missing");
}
if (!/class="fake-banner"/.test(banner)) {
  errors.push("fake-banner element missing");
}
if (!/LabQueue/.test(banner) || !/prop/i.test(banner)) {
  errors.push("LabQueue must be labeled as theater/prop on Beat B");
}

const allowCss = read("demo/allow.css");
if (!/\.fake-banner\s*\{[^}]*position:\s*sticky/s.test(allowCss) || !/\.fake-banner\s*\{[^}]*top:\s*0/s.test(allowCss)) {
  errors.push("FAKE banner must be position:sticky; top:0");
}

const lure = read("demo/lure.html");
if (!/LabQueue/.test(lure) || !/prop/i.test(lure)) {
  errors.push("LabQueue must be labeled as a prop on Beat A");
}

for (const rel of ["demo/lure.html", "demo/allow.html"]) {
  const html = read(rel);
  if (!html.includes("content/demo-coach.css")) {
    errors.push(rel + " must link demo-coach.css for chrome-extension://");
  }
  if (!html.includes("content/demo-coach.js")) {
    errors.push(rel + " must include demo-coach.js for chrome-extension://");
  }
}

const popupJs = read("popup/popup.js");
if (!/chrome\.runtime\.getURL/.test(popupJs) || !/demo\/lure\.html/.test(popupJs) || !/demo\/allow\.html/.test(popupJs)) {
  errors.push("popup must open demo pages via chrome.runtime.getURL");
}
if (!/chrome\.tabs\.create/.test(popupJs) && !/semblance:open/.test(popupJs)) {
  errors.push("popup must open chrome-extension demo tabs from the toolbar");
}

const demoCoach = read("content/demo-coach.js");
if (!/function noteQuiet/.test(demoCoach) || /mountSheet\("hard-stop"\)/.test(demoCoach)) {
  errors.push("quiet ladder must not remount a nag sheet");
}

const forbiddenVoice = /TLN|Tech Literacy Network|Devpost|hackathon|contest|competition/i;
const liveIdpHref = /https?:\/\/(accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com)/i;
const revokeAllow = new Set(["popup/popup.js", "README.md"]);

for (const rel of walkFiles(root)) {
  if (rel === "scripts/verify-spine.mjs") {
    continue;
  }
  const text = read(rel);
  if (forbiddenVoice.test(text)) {
    errors.push("forbidden framing in " + rel);
  }
  if (liveIdpHref.test(text) && !revokeAllow.has(rel)) {
    errors.push("live IdP URL in " + rel);
  }
}

const withSession = memoryChrome(true);
const storeCtx = loadScripts(["shared/storage.js", "shared/ladder.js"], {
  chrome: withSession.chrome
});
const ladder = storeCtx.SemblanceLadder;
const store = storeCtx.SemblanceStore;

async function checkLadder() {
  const first = await ladder.decide("demo-allow");
  if (first.action !== "pause") {
    errors.push("ladder first interrupt should pause, got " + first.action);
  }
  await ladder.commit("demo-allow", "pause");
  const second = await ladder.decide("demo-allow");
  if (second.action !== "hard-stop") {
    errors.push("ladder second interrupt should hard-stop, got " + second.action);
  }
  await ladder.commit("demo-allow", "hard-stop");
  const third = await ladder.decide("demo-allow");
  if (third.action !== "quiet") {
    errors.push("ladder third interrupt should quiet, got " + third.action);
  }
  if (third.action === "pass") {
    errors.push("quiet must not pass a closed gate");
  }
  await store.setUnderstood();
  const opened = await ladder.decide("demo-allow");
  if (opened.action !== "pass") {
    errors.push("open gate should pass, got " + opened.action);
  }
}

async function checkFriendVerifyWithoutSession() {
  const noSession = memoryChrome(false);
  const ctx = loadScript("shared/storage.js", { chrome: noSession.chrome });
  await ctx.SemblanceStore.setFriendWord("maple");
  const miss = await ctx.SemblanceStore.checkFriendWord("wrong");
  const hit = await ctx.SemblanceStore.checkFriendWord("Maple");
  const open = await ctx.SemblanceStore.isGateOpen();
  if (miss || !hit || !open) {
    errors.push("friend-verify must persist via chrome.storage.local when session is missing");
  }
}

try {
  await checkLadder();
  await checkFriendVerifyWithoutSession();
} catch (err) {
  errors.push("spine runtime check failed: " + err.message);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Semblance spine ok");
console.log("scopes", scopes.all.length);
console.log("ritual rules", rituals.rules.length);
