# Semblance

The **Allow** button is the login. A friend-shaped message gets you there. MFA never runs. The click is the whole breach.

Semblance is a Chrome extension that pauses that moment, translates the scopes into ordinary sentences, and keeps a revoke door one tap away after the theater ends.

## The problem

People do not fail the password box. They fail the consent box.

A classmate, a cousin, a club form — then a screen that asks for mail, Drive, contacts, and `offline_access`. The words look official. The friend said it was normal. There is no second factor on Allow. If you click it, the other side already has the account.

Semblance treats that click as the event worth interrupting.

## Install (load unpacked)

Chrome 116 or newer (side panel).

1. Download or clone this repo.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. **Load unpacked** and pick this folder (the one with `manifest.json`).
5. Pin **Semblance** to the toolbar.
6. Click the icon. **Open coach beside this tab.** The side panel is the product: paste a `scope=` URL, browse scopes, friend-verify, paste ritual, revoke. You do not need the demo pages.

No build step. Plain JavaScript. Manifest V3.

Theater is optional and labeled. **Open Beat A · friend lure** (still in the toolbar popup) opens `chrome-extension://…/demo/lure.html`. You do not need “Allow access to file URLs.” File copies of the demo pages are a fallback only.

- What is theater vs what stays installed: [AUTHENTICITY.md](AUTHENTICITY.md)
- Human Load-unpacked pass: [SMOKE.md](SMOKE.md)

Optional check after clone: `node scripts/verify-spine.mjs`.

## Three-beat walkthrough

### Beat A — friend lure

From the pinned popup, **Open Beat A · friend lure**.

A static Discord-style mock. Maya asks for thirty seconds on a campus-club “test.” The poison is the last line: mail and Drive are “normal.” LabQueue is labeled as a prop. Nothing here is a bot, a server, or a live chat.

Follow her **Open LabQueue** card.

### Beat B — FAKE Allow

The lure link opens `demo/allow.html` on the same `chrome-extension://` origin.

A red banner is part of the page, sticky, not a toast:

**FAKE — not Google/Microsoft**

LabQueue asks for mail, Drive, contacts, and a long-lived grant — each one in plain language. Semblance pauses once, then hard-stops a raw Allow. It does not nag. A shared word (saved in the side panel) or **I understand** opens the gate. Allow still goes nowhere: no token, no identity provider, no network.

### Beat C — side panel coach

Open the side panel from the toolbar popup if it is not already beside the tab.

That coach is the product you keep. It does not need the demo pages:

- Paste an Allow URL or `scope=` query → the same plain-language map as the click (unknown stays unknown)
- A denser local pack of Google and Microsoft consumer scopes → one plain sentence each
- Friend-verify via `chrome.storage.local` (a shared word, this browser only) or an explicit I-understand
- One-tap deep links to real Google and Microsoft connected-apps / revoke pages
- A paste box that only runs local regex rules for localhost-auth and “paste the code” rituals

## What stays useful

After the three beats, leave Semblance installed.

Use the side panel on a real day: paste the Allow URL, look up a scope, paste a localhost-auth ritual, verify a friend word, revoke an app you already allowed. Leave it open beside chat. The theater is optional. The translation layer is not. See [AUTHENTICITY.md](AUTHENTICITY.md) for the split, and [SMOKE.md](SMOKE.md) to walk it.

Interrupts are once-only per browser. The reason log in `storage.local` is metadata — time, level, reason. No page text. No tokens.

## What we refuse

- No content scripts on `accounts.google.com`, Microsoft login, or any live identity provider
- No reading or exchanging codes, cookies, or tokens
- No Discord bot, no Azure CLI helper, no parent ping, no cloud on the critical path
- No URL “phishing score” as the hero
- No AI required to run the demo

The content script, if it runs at all, may attach to the Semblance demo pages only (`demo/lure.html`, `demo/allow.html`). Real Allow screens stay untouched. Use the coach and the official revoke links instead.
