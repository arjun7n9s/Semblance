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

function remindChrome() {
  const mem = memoryChrome(true);
  const alarmStore = {};
  const createdNotifications = [];
  const tabs = [];
  mem.chrome.runtime = {
    getURL(rel) {
      return "chrome-extension://test/" + rel;
    },
    lastError: undefined
  };
  mem.chrome.alarms = {
    create(name, info, cb) {
      if (info && Object.prototype.hasOwnProperty.call(info, "periodInMinutes")) {
        throw new Error("periodInMinutes is not allowed");
      }
      alarmStore[name] = Object.assign({ name: name }, info);
      if (typeof cb === "function") {
        cb();
      }
    },
    get(name, cb) {
      cb(alarmStore[name]);
    },
    clear(name, cb) {
      const had = Object.prototype.hasOwnProperty.call(alarmStore, name);
      delete alarmStore[name];
      if (typeof cb === "function") {
        cb(had);
      }
    },
    onAlarm: {
      listeners: [],
      addListener(fn) {
        this.listeners.push(fn);
      }
    }
  };
  mem.chrome.notifications = {
    create(id, opts, cb) {
      createdNotifications.push({ id: id, opts: opts });
      if (typeof cb === "function") {
        cb(id);
      }
    },
    clear() {},
    onClicked: {
      listeners: [],
      addListener(fn) {
        this.listeners.push(fn);
      }
    },
    onButtonClicked: {
      listeners: [],
      addListener(fn) {
        this.listeners.push(fn);
      }
    }
  };
  mem.chrome.action = {
    text: "",
    setBadgeText(info) {
      this.text = info.text || "";
    },
    setBadgeBackgroundColor() {},
    setBadgeTextColor() {},
    setTitle() {}
  };
  mem.chrome.tabs = {
    create(info) {
      tabs.push(info);
    }
  };
  mem.chrome.windows = {
    getLastFocused(_opts, cb) {
      cb({ id: 1 });
    }
  };
  mem.chrome.sidePanel = {
    open() {
      return Promise.resolve();
    }
  };
  mem.alarmStore = alarmStore;
  mem.createdNotifications = createdNotifications;
  mem.tabs = tabs;
  return mem;
}

const manifest = JSON.parse(read("manifest.json"));
const errors = [];

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}
if (!manifest.action?.default_popup) {
  errors.push("popup missing");
}
if (manifest.side_panel?.default_path !== "sidepanel/sidepanel.html") {
  errors.push("side_panel.default_path must be sidepanel/sidepanel.html");
}
const perms = Array.isArray(manifest.permissions) ? manifest.permissions.slice().sort() : [];
if (perms.join() !== "alarms,notifications,sidePanel,storage") {
  errors.push("permissions must be alarms, notifications, sidePanel, and storage");
}
const scaryPerms = /webNavigation|webRequest|declarativeNetRequest|identity|cookies|history|debugger|proxy|tabCapture|geolocation|scripting/;
if ((manifest.permissions || []).some((perm) => scaryPerms.test(perm))) {
  errors.push("no surveillance, IdP, or DNR permissions on the spine");
}
if (manifest.host_permissions?.length) {
  errors.push("no host_permissions on the spine");
}
if (manifest.web_accessible_resources) {
  errors.push("web_accessible_resources not needed for popup chrome-extension:// demo tabs");
}
if (manifest.declarative_net_request || (manifest.permissions || []).includes("declarativeNetRequest")) {
  errors.push("no DNR hero on the spine");
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
  if ((script.js || []).some((item) => /remind/.test(item))) {
    errors.push("content scripts must not load the revoke reminder");
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
  "gmail.compose",
  "gmail.metadata",
  "mail.google.com",
  "drive",
  "drive.file",
  "drive.readonly",
  "calendar",
  "calendar.readonly",
  "contacts",
  "contacts.readonly",
  "photoslibrary.readonly",
  "youtube.upload",
  "documents",
  "spreadsheets",
  "classroom.rosters.readonly",
  "classroom.coursework.me",
  "user.phonenumbers.read",
  "user.addresses.read",
  "chat.messages.readonly",
  "cloud-platform",
  "user.read",
  "user.readwrite",
  "mail.read",
  "mail.readbasic",
  "mail.send",
  "mailbox.readwrite",
  "imap.accessasuser.all",
  "smtp.send",
  "files.read",
  "files.readwrite",
  "files.read.all",
  "files.readwrite.all",
  "calendars.read",
  "calendars.readwrite",
  "contacts.read",
  "contacts.readwrite",
  "chat.read",
  "chat.readwrite",
  "directory.read.all"
]);
const jokeVoice = /lolz|yeet|hackathon|devpost|skeleton-key-lol|totally-fine/i;
const enterpriseDump =
  /RoleManagement|Application\.ReadWrite|Policy\.ReadWrite|Sites\.FullControl|Directory\.ReadWrite|AppRoleAssignment|IdentityRisky|PrivilegedAccess/i;
const scopes = loadScript("shared/scopes.js").SemblanceScopes;
if (!scopes || scopes.all.length < 35) {
  errors.push("need a denser pack: at least 35 scope translations");
}
if (typeof scopes.decode !== "function" || typeof scopes.explain !== "function") {
  errors.push("scopes.js must export decode and explain");
}
const families = new Set(["Google", "Microsoft", "Either"]);
const seenScopeIds = new Set();
for (const scope of scopes.all) {
  if (!knownScopeIds.has(scope.id)) {
    errors.push("unknown/invented scope id " + scope.id);
  }
  if (seenScopeIds.has(scope.id)) {
    errors.push("duplicate scope id " + scope.id);
  }
  seenScopeIds.add(scope.id);
  if (!families.has(scope.family)) {
    errors.push("scope family must be Google, Microsoft, or Either: " + scope.id);
  }
  if (!scope.raw || !scope.sentence || scope.sentence.length < 28) {
    errors.push("scope needs a real raw name and a teen-readable sentence: " + scope.id);
  }
  if (jokeVoice.test(scope.sentence) || jokeVoice.test(scope.raw)) {
    errors.push("scope sentence/raw looks like joke filler: " + scope.id);
  }
  if (enterpriseDump.test(scope.id) || enterpriseDump.test(scope.raw)) {
    errors.push("enterprise SOC dump in scope pack: " + scope.id);
  }
}
for (const id of ["gmail.compose", "mail.google.com", "photoslibrary.readonly", "classroom.rosters.readonly", "imap.accessasuser.all", "mail.readbasic"]) {
  if (!seenScopeIds.has(id)) {
    errors.push("denser pack missing consumer scope " + id);
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

function expectDecode(sample, check, label) {
  const result = scopes.decode(sample);
  const problem = check(result);
  if (problem) {
    errors.push("decode fail (" + label + "): " + problem);
  }
}

expectDecode(
  "https://example.test/authorize?client_id=demo&response_type=code&scope=openid%20email%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/not.a.real.scope&access_type=offline",
  (result) => {
    if (!result.ok) {
      return "expected ok, got " + result.reason;
    }
    if (result.via !== "url") {
      return "expected via=url, got " + result.via;
    }
    const ids = result.items.map((item) => item.id);
    if (ids.join() !== "openid,email,gmail.readonly,drive.file,unknown") {
      return "unexpected ids " + ids.join();
    }
    if (result.items[2].known !== true || !/every email/i.test(result.items[2].sentence)) {
      return "gmail.readonly URL must use the real sentence, not a guess";
    }
    if (result.items[3].id !== "drive.file") {
      return "drive.file URL must not collapse to full Drive";
    }
    if (result.items[4].known !== false || result.items[4].family !== "Unknown") {
      return "unknown scope must stay unknown";
    }
    if (result.items[4].sentence !== scopes.unknownSentence) {
      return "unknown sentence must be the honest stub";
    }
    if (result.unknown !== 1 || result.known !== 4) {
      return "known/unknown counts wrong: " + result.known + "/" + result.unknown;
    }
    return null;
  },
  "google-style authorize URL"
);

expectDecode(
  "https://example.test/oauth2/v2.0/authorize?scope=User.Read+Mail.Send+offline_access",
  (result) => {
    if (!result.ok) {
      return "expected ok";
    }
    const ids = result.items.map((item) => item.id);
    if (ids.join() !== "user.read,mail.send,offline_access") {
      return "plus-delimited Microsoft scopes: " + ids.join();
    }
    if (result.unknown !== 0) {
      return "no unknowns expected";
    }
    return null;
  },
  "plus-delimited Microsoft scope="
);

expectDecode(
  "Maya sent this:\nhttps://example.test/authorize?redirect_uri=https%3A%2F%2Fapp.example%2Fcb&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive%20https%3A%2F%2Fgraph.microsoft.com%2FMail.Read&amp;state=1\nthx",
  (result) => {
    if (!result.ok) {
      return "expected ok from chat wrap, got " + result.reason;
    }
    const ids = result.items.map((item) => item.id);
    if (ids.join() !== "drive,mail.read") {
      return "chat wrap ids " + ids.join();
    }
    if (result.items[0].id !== "drive") {
      return "full Drive URL must stay Drive, not drive.file";
    }
    return null;
  },
  "chat wrap + encoded scopes + amp;"
);

expectDecode("scope=openid+email+profile", (result) => {
  if (!result.ok || result.via !== "query") {
    return "raw query should decode, via=" + result.via;
  }
  if (result.items.map((item) => item.id).join() !== "openid,email,profile") {
    return "raw query ids";
  }
  return null;
}, "raw scope= query");

expectDecode(
  "openid email https://www.googleapis.com/auth/gmail.send Mail.Send",
  (result) => {
    if (!result.ok || result.via !== "list") {
      return "bare list should decode, via=" + result.via;
    }
    if (result.items.map((item) => item.id).join() !== "openid,email,gmail.send,mail.send") {
      return "bare list ids";
    }
    return null;
  },
  "bare scope list"
);

expectDecode("https://example.com/help?topic=code", (result) => {
  if (result.ok || result.reason !== "no-scope") {
    return "URL without scope= must not invent scopes";
  }
  return null;
}, "no-scope URL");

expectDecode("hello from the class group", (result) => {
  if (result.ok) {
    return "sentence must not look like a scope list";
  }
  return null;
}, "chat sentence");

expectDecode("", (result) => {
  if (result.ok || result.reason !== "empty") {
    return "empty paste";
  }
  return null;
}, "empty");

expectDecode("https://example.test/authorize?scope=&client_id=x", (result) => {
  if (result.ok || result.reason !== "empty-scope") {
    return "empty scope=";
  }
  return null;
}, "empty scope=");

expectDecode(
  "https://example.test/cb#scope=email%20profile&token_type=Bearer",
  (result) => {
    if (!result.ok) {
      return "hash scope should decode";
    }
    if (result.items.map((item) => item.id).join() !== "email,profile") {
      return "hash ids";
    }
    return null;
  },
  "fragment scope="
);

const unknownExplain = scopes.explain("https://www.googleapis.com/auth/gmail.readonly.extra");
if (unknownExplain.known || unknownExplain.id !== "unknown") {
  errors.push("explain must not substring-match gmail.readonly onto a longer token");
}
if (/every email/i.test(unknownExplain.sentence)) {
  errors.push("unknown explain must not reuse a known sentence");
}
const driveUrl = scopes.explain("https://www.googleapis.com/auth/drive");
if (!driveUrl.known || driveUrl.id !== "drive") {
  errors.push("explain(drive URL) must be full Drive");
}
const userinfo = scopes.explain("https://www.googleapis.com/auth/userinfo.email");
if (!userinfo.known || userinfo.id !== "email") {
  errors.push("explain(userinfo.email URL) must map to email");
}
const graphMail = scopes.explain("https://graph.microsoft.com/Mail.Send");
if (!graphMail.known || graphMail.id !== "mail.send") {
  errors.push("explain(graph Mail.Send) must map to mail.send");
}
const imapOutlook = scopes.explain("https://outlook.office.com/IMAP.AccessAsUser.All");
if (!imapOutlook.known || imapOutlook.id !== "imap.accessasuser.all") {
  errors.push("explain(outlook IMAP) must map to imap.accessasuser.all");
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
const panelHtml = read("sidepanel/sidepanel.html");
const panelJs = read("sidepanel/sidepanel.js");

if (!/chrome\.runtime\.getURL/.test(popupJs) || !/demo\/lure\.html/.test(popupJs) || !/demo\/allow\.html/.test(popupJs)) {
  errors.push("popup must open demo pages via chrome.runtime.getURL");
}
if (!/chrome\.tabs\.create/.test(popupJs) && !/semblance:open/.test(popupJs)) {
  errors.push("popup must open chrome-extension demo tabs from the toolbar");
}
if (popupHtml.includes("demo-coach") || popupHtml.includes("demo/")) {
  errors.push("popup html must not load demo pages — launcher is not theater");
}
if (!popupHtml.includes('id="open-panel"') || !/sidePanel\.open/.test(popupJs)) {
  errors.push("popup must open the side panel as the keep-installed coach");
}
if (!/windows\.getCurrent/.test(popupJs)) {
  errors.push("popup must cache windowId before the click so sidePanel.open stays a user gesture");
}
if (popupHtml.includes('id="ritual-input"') || popupHtml.includes('id="scope-list"') || popupHtml.includes("revoke-google")) {
  errors.push("popup must stay a thin launcher — keep-installed tools live in the side panel");
}
if (popupHtml.includes('id="scope-decode"') || popupHtml.includes('id="scope-decode-input"')) {
  errors.push("popup must stay a thin launcher — scope decoder lives in the side panel");
}
if (!popupHtml.includes('id="open-lure"') || !popupHtml.includes('id="open-allow"')) {
  errors.push("popup must still launch Beat A and Beat B");
}

if (panelHtml.includes("demo-coach") || panelHtml.includes("demo/") || panelHtml.includes("open-lure") || panelHtml.includes("open-allow")) {
  errors.push("side panel must not be a second theater stage");
}
if (!/You do not need the demo pages/.test(panelHtml) || !/Use this now/.test(panelHtml)) {
  errors.push("side panel must make sense with demo tabs closed (stranger-bar copy)");
}
if (!panelHtml.includes('id="check-word"') || !/checkFriendWord/.test(panelJs)) {
  errors.push("side panel must friend-verify without opening demo pages");
}
if (!panelHtml.includes('id="ritual-input"') || !panelHtml.includes("revoke-google") || !panelHtml.includes('id="scope-list"')) {
  errors.push("side panel keep-installed must include scope coach, paste ritual, and revoke");
}
if (!panelHtml.includes('id="scope-decode-input"') || !panelHtml.includes('id="scope-decode"') || !panelHtml.includes('id="scope-decoded"')) {
  errors.push("side panel must paste/decode authorize URLs and scope= queries");
}
if (!/does not score the link/.test(panelHtml)) {
  errors.push("side panel must say the decoder does not score the link");
}
if (/phish|reputation|safe to open|malicious link|url score/i.test(panelHtml + panelJs)) {
  errors.push("side panel decoder must not be a URL-score / phishing-score hero");
}
if (!/SemblanceScopes\.decode/.test(panelJs) || !/scope-decode-input/.test(panelJs)) {
  errors.push("side panel must run SemblanceScopes.decode on the paste field");
}
const decodeChunk = (panelJs.split('$("scope-decode")')[1] || "").split('$("save-word")')[0];
if (!decodeChunk || /SemblanceStore|chrome\.storage|setDemoBeat|fetch\(|XMLHttpRequest/.test(decodeChunk)) {
  errors.push("scope decode must stay local and unstored — no storage, no theater, no network");
}
const hiddenBeat = panelHtml.match(/id="beat-c"[^>]*hidden[\s\S]*?<\/section>/);
if (hiddenBeat && /scope-list|scope-decode|ritual-input|check-word|revoke-google|remind-when/.test(hiddenBeat[0])) {
  errors.push("keep-installed tools must not start hidden behind theater");
}
if (/demo\/(?:lure|allow)\.html/.test(panelJs) || /setDemoBeat/.test(panelJs)) {
  errors.push("side panel must not drive theater beats");
}
const understandChunk = (panelJs.split('$("understand")')[1] || "").split('$("ritual-check")')[0];
if (/setDemoBeat/.test(understandChunk)) {
  errors.push("I understand must not mark demoBeat — keep-installed is not theater");
}
if (!/SemblanceRemind\.REVOKE/.test(panelJs)) {
  errors.push("side panel revoke buttons must use the shared official connected-apps URLs");
}

const remindJs = read("shared/remind.js");
const sw = read("background/service-worker.js");
if (!/shared\/remind\.js/.test(sw) || !/SemblanceRemind\.attachWorker/.test(sw)) {
  errors.push("service worker must import remind.js and attachWorker synchronously so alarms can wake it");
}
if (/alarms\.create/.test(sw) || /SemblanceRemind\.schedule/.test(sw)) {
  errors.push("service worker must not schedule alarms — opt-in lives in the side panel");
}
if (/setInterval/.test(sw) || /periodInMinutes/.test(sw + remindJs)) {
  errors.push("service worker / reminder must not keep-alive or repeat as monitoring");
}
if (/storage\.sync/.test(remindJs) || /storage\.session/.test(remindJs)) {
  errors.push("revoke reminder must persist in chrome.storage.local only");
}
if (/fetch\(|XMLHttpRequest|WebSocket/.test(remindJs)) {
  errors.push("revoke reminder must not network");
}
if (!remindJs.includes("https://myaccount.google.com/connections")) {
  errors.push("Google revoke link missing");
}
if (!remindJs.includes("https://account.microsoft.com/privacy/app-access")) {
  errors.push("Microsoft revoke link missing");
}
if (!remindJs.includes("https://myaccount.microsoft.com/consent")) {
  errors.push("Microsoft work revoke link missing");
}
if (!panelHtml.includes('id="revoke-checkin"') || !panelHtml.includes('id="remind-when"') || !panelHtml.includes('id="remind-on"') || !panelHtml.includes('id="remind-off"')) {
  errors.push("side panel must include opt-in revoke check-in UI");
}
if (!/Default off/.test(panelHtml) || !/Reminder only/.test(panelHtml) || !/does not watch your accounts/.test(panelHtml)) {
  errors.push("side panel check-in must default off and deny monitoring");
}
if (!panelHtml.includes("../shared/remind.js")) {
  errors.push("side panel must load remind.js");
}
if (popupHtml.includes('id="remind-when"') || popupHtml.includes('id="remind-on"') || popupHtml.includes('id="remind-off"')) {
  errors.push("popup must stay a thin launcher — check-in lives in the side panel");
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
  if (!/theater/i.test(text) || !/keep-installed/i.test(text) || !/side panel/i.test(text)) {
    errors.push(rel + " must explain theater vs keep-installed side panel");
  }
}
if (!/FAKE — not Google\/Microsoft/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must confirm the FAKE banner");
}
if (!/Do \*\*not\*\* open Beat A/.test(read("SMOKE.md")) && !/Do \*\*not\*\* open Beat/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must start from the side panel with demo tabs closed");
}
if (!/Open coach beside this tab/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must open the side panel from the popup launcher");
}
if (!/side panel/i.test(read("AUTHENTICITY.md")) || !/product surface/i.test(read("AUTHENTICITY.md"))) {
  errors.push("AUTHENTICITY.md must name the side panel as the product surface");
}
if (!/Not a URL score/i.test(read("AUTHENTICITY.md")) || !/Unknown tokens stay unknown/i.test(read("AUTHENTICITY.md"))) {
  errors.push("AUTHENTICITY.md must describe the decoder as local literacy, not a URL score");
}
if (!/Decode scopes/.test(read("SMOKE.md")) || !/not\.a\.real\.scope/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must decode a scope= URL with an unknown token, demo tabs closed");
}
if (!/does not score that link/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must include a no-scope URL that is not scored");
}
if (!/chrome\.alarms/.test(read("AUTHENTICITY.md")) || !/Reminder only/.test(read("AUTHENTICITY.md")) || !/not live monitoring/i.test(read("AUTHENTICITY.md"))) {
  errors.push("AUTHENTICITY.md must document revoke alarms as reminder only, not monitoring");
}
if (!/not watching accounts/.test(read("SMOKE.md")) && !/not watching your accounts/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must show the check-in default-off, not watching accounts");
}
if (!/1 minute/.test(read("SMOKE.md")) || !/Turn off/.test(read("SMOKE.md")) || !/not live monitoring/.test(read("SMOKE.md"))) {
  errors.push("SMOKE.md must schedule, cancel, and fire a reminder without claiming monitoring");
}

const forbiddenVoice = /TLN|Tech Literacy Network|Devpost|hackathon|contest|competition/i;
const liveIdpHref = /https?:\/\/(accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com)/i;
const revokeAllow = new Set(["sidepanel/sidepanel.js", "README.md", "shared/remind.js"]);
const monitoringClaim = /Semblance monitors|Semblance is watching your|parent dashboard|background surveillance|we scan your accounts/i;

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
  if (monitoringClaim.test(text)) {
    errors.push("monitoring claim in " + rel);
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
  const empty = await ctx.SemblanceStore.get(["friendWord", "understoodAt", "demoBeat", "reasonLog", "revokeRemind"]);
  if (empty.friendWord || empty.understoodAt || empty.demoBeat) {
    errors.push("empty storage must not invent a gate or demoBeat");
  }
  if (empty.revokeRemind) {
    errors.push("empty storage must not invent a revoke reminder");
  }
  if (ctx.SemblanceScopes.filter("Mail.Send").length < 1) {
    errors.push("scope coach must work with empty storage");
  }
  const decoded = ctx.SemblanceScopes.decode(
    "https://example.test/authorize?scope=Mail.Send+https://www.googleapis.com/auth/gmail.readonly"
  );
  if (!decoded.ok || decoded.unknown !== 0 || decoded.items.length !== 2) {
    errors.push("scope decode must work with empty storage");
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

async function checkRevokeRemind() {
  const remindMod = loadScript("shared/remind.js").SemblanceRemind;
  const idle = remindMod.normalize(undefined);
  if (idle.on || idle.cue || idle.fireAt || idle.choice) {
    errors.push("revoke remind must default off");
  }
  const min = remindMod.findOption("1min");
  const hour = remindMod.findOption("1hour");
  const day = remindMod.findOption("1day");
  const week = remindMod.findOption("7days");
  if (!min || min.delayMs !== 60 * 1000) {
    errors.push("1min option must be sixty seconds for load-unpacked smoke");
  }
  if (!hour || hour.delayMs !== 60 * 60 * 1000) {
    errors.push("1hour option");
  }
  if (!day || day.delayMs !== 24 * 60 * 60 * 1000) {
    errors.push("1day option");
  }
  if (!week || week.delayMs !== 7 * 24 * 60 * 60 * 1000) {
    errors.push("7days option must be seven days");
  }
  if (remindMod.OPTIONS.some((option) => option.delayMs < 60 * 1000)) {
    errors.push("no sub-minute reminder — that looks like a keep-alive");
  }
  if (remindMod.buildRecord("nope")) {
    errors.push("unknown choice must not schedule");
  }
  const rec = remindMod.buildRecord("7days", 1000000);
  if (!rec || !rec.on || rec.fireAt !== 1000000 + week.delayMs || rec.cue) {
    errors.push("7days record must be a future one-shot");
  }
  const copyBlob =
    JSON.stringify(remindMod.COPY) +
    remindMod.statusText(remindMod.emptyState()) +
    remindMod.statusText(rec) +
    remindMod.statusText({ firedAt: 2, on: false });
  if (
    !/not live monitoring/i.test(copyBlob) ||
    !/not watching your accounts/i.test(copyBlob) ||
    !/you asked for/i.test(copyBlob) ||
    !/Reminder only/i.test(copyBlob)
  ) {
    errors.push("remind copy must say reminder they asked for, not monitoring");
  }
  if (/Semblance monitors|parent dashboard|background surveillance/i.test(copyBlob)) {
    errors.push("remind copy claims monitoring");
  }

  const mem = remindChrome();
  const ctx = loadScripts(["shared/storage.js", "shared/remind.js"], { chrome: mem.chrome });
  const remind = ctx.SemblanceRemind;
  const unread = await remind.read();
  if (unread.on || unread.cue || unread.fireAt) {
    errors.push("empty storage must not invent a revoke reminder");
  }
  if (!remind.attachWorker() || mem.chrome.alarms.onAlarm.listeners.length !== 1) {
    errors.push("attachWorker must register onAlarm synchronously");
  }
  if (mem.chrome.notifications.onClicked.listeners.length !== 1) {
    errors.push("attachWorker must register notification click for the coach path");
  }
  const scheduled = await remind.schedule("1min", 5000000);
  if (!scheduled || !scheduled.on || !mem.alarmStore[remind.ALARM_NAME]) {
    errors.push("schedule must persist and create a one-shot alarm");
  }
  const alarmInfo = mem.alarmStore[remind.ALARM_NAME];
  if (!alarmInfo.when || Object.prototype.hasOwnProperty.call(alarmInfo, "periodInMinutes")) {
    errors.push("alarm must use when= and must not repeat");
  }
  if (alarmInfo.when !== 5000000 + min.delayMs) {
    errors.push("alarm when must match the 1min delay");
  }
  if (!mem.localBucket.revokeRemind || mem.localBucket.revokeRemind.on !== true) {
    errors.push("preference must persist in chrome.storage.local");
  }
  if (mem.sessionBucket.revokeRemind) {
    errors.push("revoke reminder must not use storage.session");
  }
  const canceled = await remind.cancel(5100000);
  if (canceled.on || mem.alarmStore[remind.ALARM_NAME]) {
    errors.push("cancel must clear the alarm and preference");
  }
  if (mem.chrome.action.text) {
    errors.push("cancel must clear the badge");
  }

  await remind.schedule("7days", 9000000);
  mem.createdNotifications.length = 0;
  const ignored = await remind.onAlarm({ name: "other" });
  if (ignored || mem.createdNotifications.length) {
    errors.push("onAlarm must ignore other alarm names");
  }
  const fired = await remind.onAlarm({ name: remind.ALARM_NAME });
  if (!fired || fired.on || !fired.cue || !fired.firedAt) {
    errors.push("onAlarm must complete a one-shot reminder");
  }
  if (!mem.createdNotifications.length) {
    errors.push("onAlarm must show a notification");
  } else {
    const note = mem.createdNotifications[0];
    const blob = note.opts.title + " " + note.opts.message + " " + (note.opts.contextMessage || "");
    if (!/you asked for/i.test(blob) || !/not live monitoring/i.test(blob) || !/not watching your accounts/i.test(blob)) {
      errors.push("notification copy must be a reminder they asked for, not monitoring");
    }
    if (!note.opts.buttons || note.opts.buttons.length !== 2) {
      errors.push("notification should offer official revoke deep-links");
    }
  }
  if (mem.chrome.action.text !== "!") {
    errors.push("onAlarm must set a calm badge");
  }
  mem.createdNotifications.length = 0;
  const offFire = await remind.onAlarm({ name: remind.ALARM_NAME });
  if (offFire !== null || mem.createdNotifications.length) {
    errors.push("onAlarm must not re-fire after the reminder completed");
  }

  const which = await remind.onNotificationButton(remind.NOTIFICATION_ID, 0);
  if (which !== "google" || !mem.tabs.some((tab) => /myaccount\.google\.com\/connections/.test(tab.url))) {
    errors.push("notification button must open Google connected apps");
  }
  await remind.onNotificationButton(remind.NOTIFICATION_ID, 1);
  if (!mem.tabs.some((tab) => /account\.microsoft\.com\/privacy\/app-access/.test(tab.url))) {
    errors.push("notification button must open Microsoft app access");
  }
}

try {
  await checkLadder();
  await checkFriendVerifyWithoutSession();
  await checkEmptyStorageAndWrongWord();
  await checkRevokeRemind();
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
