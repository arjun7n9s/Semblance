# Chrome Web Store listing draft

Copy for the Developer Dashboard. Not a live listing.

Claims stay on **detect / decode / coach / revoke door / literacy**. Semblance does not block phishing, monitor accounts, or freeze a live Allow screen. Semblance does not inject into a live identity provider.

Pack the zip with `node scripts/pack-store.mjs` → `dist/semblance-store.zip`. Runtime files only. See [PRIVACY.md](PRIVACY.md) for the privacy policy to host.

## Name

Semblance

## Short description

Limit: 132 characters. Count: 112.

```text
Pause at Allow. Detect, decode, and coach OAuth consent and device-login handoffs. MFA never runs on that click.
```

## Detailed description

Paste into the store listing. Lead is the consent-handoff family, not a friend-DM skit.

Allow is the login. MFA never runs on that click — not on OAuth Allow, not on Continue with Google or Microsoft, and not on a device-login code. The breach is the consent handoff: a trust invite, a job or club form, a pasted `code=`, a device door, or high-risk scopes on an app you have not read. One coach for that family.

Detect. When the address bar is an authorize URL with `scope=`, or a common device-login page, Semblance reads the URL only (`webNavigation` / tab URL). It sets a toolbar badge. It does not open the login page for you, inject into Google or Microsoft, click Allow, or freeze a live Allow screen.

Decode. Known Google and Microsoft consumer scopes become one plain-language sentence each. Unknown tokens stay unknown. This is literacy, not a phishing score and not a link reputation.

Coach. Open the side panel beside the tab — the map is already there. You do not have to paste. Paste remains the fallback for an authorize URL, a `code=` / localhost line, or a device code someone sent you. Friend-verify is a pause you take in this browser (a shared word, or I understand). It does not freeze a live login page.

Revoke door. Official Google and Microsoft connected-apps pages, one tap away. An optional check-in is a local timer you schedule; default off. Reminder only. Semblance does not monitor accounts or scan grants.

Semblance is local-first. No account. No Semblance servers. No telemetry. A labeled FAKE walkthrough lives behind “Demo only” in the toolbar popup. You do not need it to use the coach. Real Allow screens stay untouched.

Semblance does not block phishing, rewrite Allow, or inject into a live identity provider. Semblance does not inject into Google, Microsoft, or any other login host.

## Category

**Productivity**

Semblance is a local literacy coach for a click, not a developer debugger and not a “Just for Fun” toy. Chrome Web Store category lists do not include a Privacy & Security bucket; Productivity is the dashboard fit.

## Single purpose

Coach OAuth consent and auth-code handoffs — detect authorize and device-login URLs, decode scopes in plain language, and keep a revoke door — for the click where MFA never runs.

## Permissions justification

Every permission in `manifest.json`. Nothing else.

### `alarms`

Powers the **optional** revoke check-in. Default off. When you schedule a reminder in the side panel, Semblance sets a one-shot `chrome.alarms` timer and wakes the service worker when it fires. It does not use repeating `periodInMinutes` alarms, does not poll accounts, and does not run in the background as monitoring.

### `notifications`

Two local cues, both literacy:

1. When a tab’s address bar matches an authorize or device-login URL, a one-shot notice can say the tab is asking for Allow (or is a device-login door) and to open the coach. Badge still works if notifications are denied.
2. When a revoke check-in you scheduled fires, a notice reminds you to open official connected-apps pages.

Notifications do not report account state. Semblance cannot see whether you still have grants.

### `sidePanel`

The keep-installed product surface: scope coach, paste ritual, friend-verify, revoke door, optional check-in. Chrome 116+. The toolbar popup is a thin launcher; the panel is the coach.

### `storage`

`chrome.storage.local` and `chrome.storage.session` in this browser only. No sync, no server. Keys and what they hold are listed in [PRIVACY.md](PRIVACY.md) (friend-verify word, gate timestamps, reason-log metadata, optional reminder schedule, live Allow snapshots for open tabs). Semblance does not store `code=`, cookies, or access tokens.

### `tabs`

URL of tabs, not page content.

- Read `changeInfo.url` / the active tab URL so detect → decode can run without paste, and so the popup/panel can show the map for this tab.
- `tabs.query` on worker start to restore badges for already-open authorize/device tabs.
- `tabs.create` / `tabs.update` to open the labeled demo pages, official revoke pages you click, or the coach in a tab if side panel is unavailable.

Semblance does not read the tab’s DOM, cookies, or titles for scoring.

### `webNavigation`

Main-frame URL only (`onCommitted`, `onHistoryStateUpdated`, `frameId === 0`). Semblance looks at the address bar for OAuth authorize patterns (`/authorize` plus `scope=`, or common IdP authorize paths) and device-login patterns (`/devicelogin`, `google.com/device`, and similar). Matching URLs are decoded locally and stored in session as a snapshot for that tab. Iframes are ignored. URLs that already carry `code=` / token parameters are not stored as live Allows. This is not webRequest, not a content script on the login host, and not a freeze of Allow.

## Privacy practices (dashboard)

Use [PRIVACY.md](PRIVACY.md) as the public policy. For the CWS privacy form:

| Field | What to enter |
| --- | --- |
| Collects user data? | **Yes** — locally, in this browser. Not transmitted. |
| Personally identifiable info | Shared friend-verify word, local only |
| Health / financial / location | No |
| Authentication info | **No.** Address-bar `scope=` is decoded. `code=`, cookies, and tokens are refused. |
| Personal communications | No |
| Web history | **Yes, locally.** Tab URLs are read to detect authorize/device patterns. Matching snapshots stay in `chrome.storage.session`. Not transmitted. |
| User activity | Reason-log metadata (time, level, reason) and optional reminder schedule, local only |
| Website content | **No.** No page DOM. |
| Sold to third parties | No |
| Used for unrelated purposes | No |
| Used for creditworthiness | No |

## Privacy policy URL

CWS requires a **public HTTPS URL**. This repo’s [PRIVACY.md](PRIVACY.md) is the source of truth. Host it before submit — GitHub Pages or a raw GitHub URL is enough. Do not invent a fake Semblance privacy host.

## Package

```bash
node scripts/pack-store.mjs
```

Writes `dist/semblance-store.zip` with `manifest.json` at the zip root. Includes the labeled demo pages because the toolbar popup still opens them. Excludes `docs/`, `scripts/`, markdown, `.git`, soak folders, and transcripts.

Icons at 16 / 48 / 128 (and 32) ship in `icons/`. Store screenshots can be cropped from `docs/readme/`; those images are **not** inside the zip.

## What this listing must not say

Stay on detect, decode, coach, revoke door, and literacy.

- No phishing-block or link-score claims
- No watching of accounts or grant scans
- No live Allow freeze, click, or rewrite
- No injection into a live identity provider
