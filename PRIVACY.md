# Semblance privacy policy

Last updated: 20 September 2026

This policy is the source of truth for Chrome Web Store privacy fields. Host it at a **public HTTPS URL** before you submit the listing. Preferred: [https://arjun7n9s.github.io/Semblance/privacy/](https://arjun7n9s.github.io/Semblance/privacy/) (GitHub Pages from `main` `/docs`, serving `docs/privacy/index.html`). Interim: [https://raw.githubusercontent.com/arjun7n9s/Semblance/main/PRIVACY.md](https://raw.githubusercontent.com/arjun7n9s/Semblance/main/PRIVACY.md). There is no separate Semblance privacy website.

Semblance is a local Chrome extension that **detects** OAuth authorize and device-login URLs, **decodes** `scope=` tokens into plain language, **coaches** the consent click, and keeps a **revoke door**. It does not block phishing, monitor accounts, freeze a live Allow screen, or inject into an identity provider.

## Local-first. No account. No Semblance servers.

Semblance does not create an account. It does not require sign-in. It does not send telemetry, analytics, crash reports, or browsing data to Semblance — there are no Semblance servers on the path.

Nothing in the extension calls home. Decode, detect, friend-verify, paste checks, and the optional revoke reminder all run in this browser.

When you click an official revoke button, Chrome opens Google’s or Microsoft’s connected-apps page in a tab. That visit is yours with them, not a Semblance upload.

## What `tabs` and `webNavigation` see

Semblance requests `tabs` and `webNavigation` so it can read a tab’s **URL** (the address bar), not the page.

It looks for:

- OAuth **authorize** patterns — paths such as `/authorize` with `scope=`, or common Google/Microsoft authorize paths
- **Device-login** patterns — `/devicelogin`, `google.com/device`, `g.co/device`, `aka.ms/devicelogin`, and similar device doors

Rules:

- Main frame only. Iframes are ignored (`frameId === 0`).
- URL only. Semblance does not read the DOM, cookies, form fields, or page text.
- URLs that already carry secrets (`code=`, `access_token=`, `id_token=`, `refresh_token=`) are **not** stored as live Allows.
- A matching URL is decoded locally (known scopes → one sentence; unknown stays unknown). A short snapshot is kept in `chrome.storage.session` for that tab, a toolbar badge may show, and an optional notification may fire.
- The snapshot is dropped when the tab closes or you leave that host.
- `tabs.query` on startup only restores badges for tabs that still match.

This is detect → decode → badge. It is not an account scan, not web history uploaded anywhere, and not a content script on `accounts.google.com`, Microsoft login, or any live identity provider.

## What this browser stores

### `chrome.storage.session` (cleared when Chrome stops)

| Key | Contents |
| --- | --- |
| `liveAllows` | Per-tab snapshots: tab id, host, authorize vs device-login, decoded scope tokens and sentences (or a device-login nudge), timestamps, whether a notice already fired. No page HTML. No `code=`. No cookies. |
| `friendOk` | Whether friend-verify succeeded in this browser session. |

### `chrome.storage.local` (this profile, until you remove the extension)

| Key | Contents |
| --- | --- |
| `friendWord` | The shared word you saved for friend-verify. Local only. Never transmitted. |
| `friendOkAt`, `understoodAt` | Timestamps for “verified” / “I understand”. |
| `reasonLog` | Metadata only: time, level, reason. Cap of 40. No page text. No tokens. |
| `interruptKeys` | Which labeled-demo pause steps already ran, so the FAKE Allow does not nag forever. |
| `demoBeat` | Bookmark for the optional labeled walkthrough (`idle` / lure / allow). The coach does not need it. |
| `revokeRemind` | Optional check-in you scheduled: on/off, delay choice, fire time, canceled/fired flags. Not an account snapshot. |

Paste ritual input is checked with local regex and **is not stored**.

Semblance does not use `chrome.storage.sync`.

## Notifications and alarms

`notifications` and `alarms` stay on-device.

- A detect notice may say this tab is asking for Allow, or is a device-login door, and to open the coach. It does not include page content or tokens.
- A revoke check-in notice fires only if you scheduled that reminder. Copy says it is not live monitoring. Semblance still cannot see your connected apps.

Alarms are one-shot timers you set. Default off. They do not poll Google or Microsoft.

## What Semblance does not do

- No content scripts on live identity providers (Google, Microsoft, or anyone else’s login host). The only content script, if it runs at all, attaches to Semblance’s own labeled demo pages (`demo/lure.html`, `demo/allow.html`), including `file://` copies.
- No reading or exchanging authorization codes, cookies, or access tokens.
- No injecting, clicking, blocking, or rewriting Allow.
- No account scanning and no grant inventory.
- No Discord bot, parent ping, or cloud on the critical path.
- No URL phishing score or link reputation.
- No sale of data. No third parties. No advertising SDK.

## Children

Semblance is a literacy coach, not a child-directed service. It does not knowingly collect data from children. Friend-verify words stay in this browser.

## Changes

Updates to this policy will be committed to this file. The “Last updated” date above is the version marker. Keep the hosted copy in sync with the repo before each store submit.

## Contact

Questions about this policy: [arjun7n9s@gmail.com](mailto:arjun7n9s@gmail.com) · source [github.com/arjun7n9s/Semblance](https://github.com/arjun7n9s/Semblance)
