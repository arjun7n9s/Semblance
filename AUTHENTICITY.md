# Theater vs the product you keep

Semblance is a local coach for the Allow click. The three-beat walkthrough is labeled theater. If a presenter treats LabQueue as a live app, they are presenting it wrong.

## Theater (optional, labeled)

- **Beat A** (`demo/lure.html`) — a scripted friend chat. It cannot send. Maya is a fixture. LabQueue is a prop.
- **Beat B** (`demo/allow.html`) — a consent card that never talks to Google or Microsoft. The red **FAKE — not Google/Microsoft** banner is part of the page and stays on top of the pause sheet. Allow goes nowhere: no token, no network, no identity provider.
- **file:// copies** of those pages — fallback only. The toolbar opens `chrome-extension://` tabs. A content script may attach to file copies of the demo pages; it never attaches to live login hosts. The page scripts and that fallback share a start guard so the coach does not double.
- **`demoBeat`** in `chrome.storage.local` — a bookmark for the walkthrough. The coach does not need it.

## The product (works with every demo tab closed)

Open the toolbar popup on an empty day:

- **Scope coach** — a local dictionary of common Google and Microsoft OAuth scopes, each in one plain sentence. Not scraped. Not live.
- **Friend-verify** — save a shared word and type it in the popup, or tap I understand. This browser only. No ping.
- **Paste ritual** — local regex on what you paste (localhost redirects, auth codes, token-shaped strings). Nothing is stored. Nothing is sent.
- **Revoke** — official Google and Microsoft connected-apps pages. Semblance does not revoke for you.

## Honesty rules

- The Allow click is the breach. MFA never runs on it. Theater pauses a fake Allow. Real Allow screens stay untouched.
- If the gate is already open from the popup, Beat B Allow does not pause again. You already owned the click. To show the once-only ladder, leave the gate closed.
- LabQueue is a prop. If the FAKE banner is not visible, stop — do not present.
- Reason log is metadata (time, level, reason). No page text. No tokens.
