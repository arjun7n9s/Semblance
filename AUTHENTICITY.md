# Theater vs the product you keep

Semblance is a local coach for the Allow click. The three-beat walkthrough is labeled theater. If a presenter treats LabQueue as a live app, they are presenting it wrong.

## Theater (optional, labeled)

- **Beat A** (`demo/lure.html`) — a scripted friend chat. It cannot send. Maya is a fixture. LabQueue is a prop.
- **Beat B** (`demo/allow.html`) — a consent card that never talks to Google or Microsoft. The red **FAKE — not Google/Microsoft** banner is part of the page and stays on top of the pause sheet. Allow goes nowhere: no token, no network, no identity provider.
- **file:// copies** of those pages — fallback only. The toolbar popup opens `chrome-extension://` tabs. A content script may attach to file copies of the demo pages; it never attaches to live login hosts. The page scripts and that fallback share a start guard so the coach does not double.
- **`demoBeat`** in `chrome.storage.local` — a bookmark for the walkthrough. The coach does not need it.
- **Toolbar popup** — thin launcher: open the side panel, or open Beat A / Beat B. Not a second theater stage, and not the keep-installed product.

## The product (works with every demo tab closed)

The **side panel** is the product surface. Open it from the toolbar popup (**Open coach beside this tab**) on an empty day. A stranger should not need the lure or the FAKE Allow pages to understand or use it:

- **Scope coach** — paste an authorize URL or a `scope=` query. Semblance maps those tokens through a local dictionary of common Google and Microsoft OAuth scopes, each in one plain sentence. Unknown tokens stay unknown. Not scraped. Not live. Not a URL score.
- **Friend-verify** — save a shared word and type it in the panel, or tap I understand. This browser only. No ping. This does not freeze a live login page. It is a pause you take before Allow. The labeled FAKE Allow uses the same word during optional theater.
- **Paste ritual** — local regex on what you paste (localhost redirects, auth codes, token-shaped strings). Nothing is stored. Nothing is sent.
- **Revoke** — official Google and Microsoft connected-apps pages. Semblance does not revoke for you.

Leave the panel open beside chat. That is why it is a side panel, not a popup that vanishes when you click the conversation.

## Honesty rules

- The Allow click is the breach. MFA never runs on it. Theater pauses a fake Allow. Real Allow screens stay untouched.
- If the gate is already open from the side panel, Beat B Allow does not pause again. You already owned the click. To show the once-only ladder, leave the gate closed.
- LabQueue is a prop. If the FAKE banner is not visible, stop — do not present.
- Reason log is metadata (time, level, reason). No page text. No tokens.
