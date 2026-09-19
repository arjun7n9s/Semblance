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

const knownScopeIds = new Set([
  "openid",
  "email",
  "profile",
  "offline_access",
  "gmail.readonly",
  "gmail.send",
  "gmail.modify",
  "drive",
  "drive.file",
  "calendar",
  "contacts",
  "cloud-platform",
  "user.read",
  "mail.read",
  "mail.send",
  "mailbox.readwrite",
  "files.readwrite.all",
  "calendars.readwrite",
  "contacts.read",
  "directory.read.all"
]);
const jokeVoice = /lolz|yeet|hackathon|devpost|skeleton-key-lol|totally-fine/i;
const scopes = loadScript("shared/scopes.js").SemblanceScopes;
if (!scopes || scopes.all.length < 15) {
  errors.push("need at least 15 scope translations");
}
const families = new Set(["Google", "Microsoft", "Either"]);
for (const scope of scopes.all) {
  if (!knownScopeIds.has(scope.id)) {
    errors.push("unknown/invented scope id " + scope.id);
  }
  if (!families.has(scope.family)) {
    errors.push("scope family must be Google, Microsoft, or Either: " + scope.id);
  }
  if (!scope.raw || !scope.sentence || scope.sentence.length < 28) {
    errors.push("scope needs a real raw name and a teen-readable sentence: " + scope.id);
  }
  if (jokeVoice.test(scope.sentence) || jokeVoice.test(scope.raw)) {
    errors.push("scope sentence/raw looks like joke filler: " + scope.id);
  }
}
const driveFile = scopes.findByRaw("drive.file");
if (!driveFile || /full Drive/i.test(driveFile.sentence)) {
  errors.push("drive.file must not be described as full Drive");
}
const driveFull = scopes.findByRaw("drive");
if (!driveFull || driveFull.id !== "drive") {
  errors.push("findByRaw('drive') must return full Drive, not drive.file");
}

const rituals = loadScript("shared/rituals.js").SemblanceRituals;
const ritualCases = [
  ["http://localhost:4173/callback?code=abc", "localhost-url"],
  ["open localhost:8080/callback now", "localhost-url"],
  ["http://127.0.0.1:53682/authorize?code=4%2F0Aean5NotARealCodeAtAll0001", "localhost-url"],
  ["http://127.0.0.1:53682/authorize?code=4%2F0Aean5NotARealCodeAtAll0001", "auth-code"],
  ["https://example.test/cb?redirect_uri=http%3A%2F%2Flocalhost%3A3000", "redirect-localhost"],
  ['{"redirect_uri":"http://127.0.0.1:4173/callback"}', "redirect-localhost"],
  ["https://app.test/oauth?code=SplendidCode", "auth-code"],
  ["paste this 4/0Aean5NotARealCodeAtAll0001 into the box", "google-auth-code"],
  ["Enter code ABCD-EFGH on the device page", "device-code"],
  ["open microsoft.com/devicelogin", "device-login-host"],
  ["g.co/device", "device-login-host"],
  [
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "jwt-shape"
  ],
  ["access_token=not-a-real-token", "access-token-word"],
  ['{"access_token":"ya29.a0AfH6SMCnotarealtokenvalue0001"}', "access-token-word"],
  ["ya29.a0AfH6SMCnotarealtokenvalue0001", "google-access-token"],
  ["1//0eNotARealRefreshTokenValue0001", "google-refresh-token"],
  ["urn:ietf:wg:oauth:2.0:oob", "oob-redirect"]
];

for (const [sample, id] of ritualCases) {
  const hit = rituals.inspect(sample).some((item) => item.id === id);
  if (!hit) {
    errors.push("ritual miss for " + id + " on " + JSON.stringify(sample));
  }
}

const ritualNegatives = [
  "",
  "   ",
  "hello from the class group",
  "https://example.com/help?topic=code",
  "see you at 4/20",
  "click Allow on the club form"
];
for (const sample of ritualNegatives) {
  const hits = rituals.inspect(sample);
  if (hits.length) {
    errors.push("ritual false hit on " + JSON.stringify(sample) + ": " + hits.map((h) => h.id).join(","));
  }
}

const banner = read("demo/allow.html");
if (!banner.includes("FAKE — not Google/Microsoft") && !banner.includes("FAKE - not Google/Microsoft")) {
  errors.push("fake allow banner copy missing");
}
if (!/class="fake-banner"/.test(banner) || !/role="alert"/.test(banner)) {
  errors.push("fake-banner element missing");
}
if (!/LabQueue/.test(banner) || !/prop/i.test(banner)) {
  errors.push("LabQueue must be labeled as theater/prop on Beat B");
}

const allowCss = read("demo/allow.css");
if (!/\.fake-banner\s*\{[^}]*position:\s*sticky/s.test(allowCss) || !/\.fake-banner\s*\{[^}]*top:\s*0/s.test(allowCss)) {
  errors.push("FAKE banner must be position:sticky; top:0");
}
if (!/\.fake-banner\s*\{[^}]*z-index:\s*2147483\d{3}/s.test(allowCss)) {
  errors.push("FAKE banner z-index must sit above the coach sheet");
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

const allowJs = read("demo/allow.js");
if (!/SemblanceScopes\.findByRaw/.test(allowJs) || !/data-scope/.test(allowJs)) {
  errors.push("Beat B must hydrate scope lines from the shared dictionary");
}

const popupHtml = read("popup/popup.html");
const popupJs = read("popup/popup.js");
if (!/chrome\.runtime\.getURL/.test(popupJs) || !/demo\/lure\.html/.test(popupJs) || !/demo\/allow\.html/.test(popupJs)) {
  errors.push("popup must open demo pages via chrome.runtime.getURL");
}
if (!/chrome\.tabs\.create/.test(popupJs) && !/semblance:open/.test(popupJs)) {
  errors.push("popup must open chrome-extension demo tabs from the toolbar");
}
if (popupHtml.includes("demo-coach") || popupHtml.includes("demo/")) {
  errors.push("popup html must not load demo pages — keep-installed stands alone");
}
if (!popupHtml.includes('id="check-word"') || !/checkFriendWord/.test(popupJs)) {
  errors.push("popup must friend-verify without opening demo pages");
}
if (!popupHtml.includes('id="ritual-input"') || !popupHtml.includes("revoke-google")) {
  errors.push("popup keep-installed must include paste ritual and revoke");
}
const understandChunk = (popupJs.split('$("understand")')[1] || "").split('$("ritual-check")')[0];
if (/setDemoBeat/.test(understandChunk)) {
  errors.push("I understand must not mark demoBeat — keep-installed is not theater");
}
if (!popupJs.includes("https://myaccount.google.com/connections")) {
  errors.push("Google revoke link missing");
}
if (!popupJs.includes("https://account.microsoft.com/privacy/app-access")) {
  errors.push("Microsoft revoke link missing");
}
if (!popupJs.includes("https://myaccount.microsoft.com/consent")) {
  errors.push("Microsoft work revoke link missing");
}

const demoCoach = read("content/demo-coach.js");
if (!/function noteQuiet/.test(demoCoach) || /mountSheet\("hard-stop"\)/.test(demoCoach)) {
  errors.push("quiet ladder must not remount a nag sheet");
}
if (!demoCoach.includes("__semblanceCoachStarted") || !demoCoach.includes("data-semblance-coach")) {
  errors.push("demo coach must guard against file:// double start");
}
if (!demoCoach.includes("FAKE — not Google/Microsoft") || !demoCoach.includes("semblance-fake")) {
  errors.push("Beat B pause sheet must repeat the FAKE banner");
}
if (!demoCoach.includes("Escape") || !/event\.target === sheet/.test(demoCoach)) {
  errors.push("pause sheet must dismiss without opening the gate");
}

for (const rel of ["AUTHENTICITY.md", "SMOKE.md"]) {
  const text = read(rel);
  if (!/theater/i.test(text) || !/keep-installed|popup/i.test(text)) {
    errors.push(rel + " must explain theater vs keep-installed");
  }
}
if (!/FAKE — not Google\/Microsoft/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must confirm the FAKE banner");
}
if (!/Do \*\*not\*\* open Beat A/.test(read("SMOKE.md")) && !/Do \*\*not\*\* open Beat/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must start from the popup with demo tabs closed");
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

async function checkEmptyStorageAndWrongWord() {
  const mem = memoryChrome(true);
  const ctx = loadScripts(["shared/scopes.js", "shared/rituals.js", "shared/storage.js", "shared/ladder.js"], {
    chrome: mem.chrome
  });
  const empty = await ctx.SemblanceStore.get(["friendWord", "understoodAt", "demoBeat", "reasonLog"]);
  if (empty.friendWord || empty.understoodAt || empty.demoBeat) {
    errors.push("empty storage must not invent a gate or demoBeat");
  }
  if (ctx.SemblanceScopes.filter("Mail.Send").length < 1) {
    errors.push("scope coach must work with empty storage");
  }
  if (ctx.SemblanceRituals.inspect("hello").length !== 0) {
    errors.push("paste with no match must stay empty");
  }
  const decision = await ctx.SemblanceLadder.decide("demo-allow");
  if (decision.action !== "pause") {
    errors.push("empty storage ladder should pause, got " + decision.action);
  }
  await ctx.SemblanceStore.setFriendWord("maple");
  if (await ctx.SemblanceStore.checkFriendWord("")) {
    errors.push("empty attempt must not open the gate");
  }
  if (await ctx.SemblanceStore.checkFriendWord("oak")) {
    errors.push("wrong friend word must not open the gate");
  }
  if (await ctx.SemblanceStore.isGateOpen()) {
    errors.push("wrong word must leave gate closed");
  }
  if (!(await ctx.SemblanceStore.checkFriendWord("MAPLE"))) {
    errors.push("matching friend word should open the gate");
  }
}

try {
  await checkLadder();
  await checkFriendVerifyWithoutSession();
  await checkEmptyStorageAndWrongWord();
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
