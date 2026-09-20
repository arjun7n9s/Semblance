# Theater vs the product you keep

Semblance is a local coach for the consent handoff. MFA never runs on Allow, on Continue with Google / Microsoft, or on a device-login code. The three-beat walkthrough is labeled theater — one story in that family, not the product. If a presenter treats LabQueue as a live app, they are presenting it wrong.

## Theater (optional, labeled)

- **Beat A** (`demo/lure.html`) — a scripted friend chat. It cannot send. LabQueue is a prop. A trust-invite skit, not the whole case family.
- **Beat B** (`demo/allow.html`) — a consent card that never talks to Google or Microsoft. The red **FAKE — not Google/Microsoft** banner is part of the page and stays on top of the pause sheet. Allow goes nowhere: no token, no network, no identity provider.
- **file:// copies** of those pages — fallback only. The toolbar popup opens `chrome-extension://` tabs. A content script may attach to file copies of the demo pages; it never attaches to live login hosts. The page scripts and that fallback share a start guard so the coach does not double.
- **`demoBeat`** in `chrome.storage.local` — a bookmark for the walkthrough. The coach does not need it.
- **Toolbar popup** — thin launcher: live-tab cue if this tab is an Allow or device-login URL, then open the side panel. Beat A / Beat B sit behind **Demo only (labeled FAKE)**. Not a second theater stage, and not the keep-installed product.

## The product (works with every demo tab closed)

The **side panel** is the product surface. Open it from the toolbar popup (**Open coach beside this tab**) on an empty day. A stranger should not need the lure or the FAKE Allow pages to understand or use it. One spine for the consent-breach family — not five products:

- **Live Allow trigger** — when a tab’s address bar is an OAuth authorize URL with `scope=` (Google, Microsoft, or a generic `/authorize`), Semblance sees it via `chrome.webNavigation` and/or `chrome.tabs.onUpdated` (URL only — no page DOM), stores the plain-language map for that tab in `chrome.storage.session`, and sets a toolbar badge. Open the coach: the scopes are already decoded. No paste required. Chrome may require a click to open the side panel — the popup **Open coach** button is that gesture. Navigation listeners do not fake it.
- **Device-login nudge** — common device doors (`/devicelogin`, `google.com/device`, `g.co/device`, `aka.ms/devicelogin`) get the same badge. Typing a code is Allow. Semblance does not read the page or capture the code.
- **Scope coach** — paste remains the fallback for an authorize URL or a `scope=` query. Local dictionary of common Google and Microsoft OAuth scopes, each in one plain sentence, adapted from public Google and Microsoft scope docs. Consumer Allow literacy — Gmail, Drive, Photos, Classroom, Outlook, OneDrive, To Do — not an enterprise permissions museum. Unknown tokens stay unknown. Not scraped. Not live. Not a URL score. High-risk scopes on an unknown app are literacy before grant — still this map, not a separate product.
- **Friend-verify** — save a shared word and type it in the panel, or tap I understand. This browser only. No ping. This does not freeze a live login page. It is a pause you take before Allow. The labeled FAKE Allow uses the same word during optional theater.
- **Paste ritual** — local regex on what you paste (localhost redirects, auth codes, token-shaped strings, device codes). The path for `code=` / localhost handoff. Nothing is stored. Nothing is sent.
- **Revoke** — official Google and Microsoft connected-apps pages. Semblance does not revoke for you.
- **Revoke check-in** — optional. Default off. A `chrome.alarms` timer you set in this panel. When it fires, a notification or toolbar badge reminds you to open those official pages. Reminder only. Not live monitoring. Not an account scan. Not a parent ping. Chrome may wake the service worker for the alarm; the worker is not kept alive.

Leave the panel open beside the tab that is asking. That is why it is a side panel, not a popup that vanishes when you click the conversation.

## Honesty rules

- The Allow click is the breach. MFA never runs on it. Theater pauses a fake Allow. Real Allow screens stay untouched.
- Address-bar `scope=` is not token capture. `code=`, cookies, and access tokens are refused.
- Live-detect demos and screenshots use real authorize URL shapes (`accounts.google.com/o/oauth2/v2/auth?…`, `login.microsoftonline.com/…/authorize?…`, `google.com/device`). Dummy `client_id` is fine; do not use `example.com` in the omnibox. Theater Allow stays on `chrome-extension://…/demo/allow.html` with the FAKE banner — never a live IdP inject.
- If the gate is already open from the side panel, Beat B Allow does not pause again. You already owned the click. To show the once-only ladder, leave the gate closed.
- LabQueue is a prop. If the FAKE banner is not visible, stop — do not present.
- Reason log is metadata (time, level, reason). No page text. No tokens.
- A revoke check-in, if you schedule one, is a reminder you asked for. It does not watch accounts or scan grants.
