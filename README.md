# Semblance

<p align="center">
  <img src="docs/readme/semblance-brand-banner.png" alt="Semblance — Pause at Allow." width="720">
</p>

A friend-shaped message is the trust fall. Then an OAuth **Allow** — and MFA never runs on that click. The Allow *is* the breach.

Semblance sits beside the tab, turns those scopes into ordinary sentences, and keeps a revoke door one tap away after you already granted something.

## Install

Chrome **116+** (side panel). Load unpacked. No build step.

1. Clone or download this repo.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. **Load unpacked** and pick this folder (the one with `manifest.json`).
5. Pin **Semblance**. Click the icon → **Open coach beside this tab**.

That panel is the product. You do not need the demo pages.

- Theater vs what stays installed: [AUTHENTICITY.md](AUTHENTICITY.md)
- Human load-unpacked pass: [SMOKE.md](SMOKE.md)

## Keep installed

Leave the coach open next to chat. Paste an Allow URL or a `scope=` query. Read the scopes in plain language. Verify a person in the room — a shared word in this browser, or **I understand**. Revoke through official Google and Microsoft pages. An optional check-in can nudge you later; it is off until you schedule it.

Nothing in this panel talks to a live login host. Real Allow screens stay untouched.

<table>
  <tr>
    <td align="center" valign="top" width="50%">
      <img src="docs/readme/panel-beside-example.png" alt="Semblance side panel beside the tab: Allow is the login, scope coach ready to decode." width="440">
      <br>
      <em>Beside the tab. You do not need the demo pages.</em>
    </td>
    <td align="center" valign="top" width="50%">
      <img src="docs/readme/mail-send-search.png" alt="Semblance scope search for Mail.Send, with friend-verify below." width="440">
      <br>
      <em><code>Mail.Send</code> in one sentence. Friend-verify is the next card.</em>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="50%">
      <img src="docs/readme/unknown-scope-decode.png" alt="Semblance decode with a known Drive scope and an unknown token left unknown." width="440">
      <br>
      <em>Paste a <code>scope=</code> URL. Unknown stays unknown.</em>
    </td>
    <td align="center" valign="top" width="50%">
      <img src="docs/readme/checkin-default-off.png" alt="Semblance revoke links and check-in, default off." width="440">
      <br>
      <em>Official revoke pages. Check-in is <strong>off</strong> until you ask.</em>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" colspan="2">
      <img src="docs/readme/checkin-scheduled-turned-off.png" alt="Semblance check-in after Turn off: timer cleared, not monitoring." width="440">
      <br>
      <em>Schedule a nudge, then <strong>Turn off</strong>. A timer you asked for — not monitoring.</em>
    </td>
  </tr>
</table>

## Optional theater

Labeled **FAKE** only. LabQueue is a prop. The walkthrough is a story about the same click, not a live identity provider.

<p align="center">
  <img src="docs/readme/semblance-flow.png" alt="Diagram: friend lure, Allow click, revoke door." width="640">
  <br>
  <em>Friend lure → Allow click → revoke door. Not a live Allow screen.</em>
</p>

From the toolbar popup, **Open Beat A · friend lure**. Maya’s chat cannot send. Follow **Open LabQueue** into Beat B.

Beat B carries a sticky banner: **FAKE — not Google/Microsoft**. Semblance pauses once, then hard-stops a raw Allow. A shared word (saved in the side panel) or **I understand** opens the gate. Allow still goes nowhere: no token, no network, no identity provider.

Close every demo tab. The side panel is still the product.

## What we refuse

- No content scripts on `accounts.google.com`, Microsoft login, or any live identity provider
- No reading or exchanging codes, cookies, or tokens
- No Discord bot, no parent ping, no cloud on the critical path
- No URL “phishing score”
- No account scanning — the optional check-in is a local timer you schedule, not monitoring
- Real Allow screens stay untouched. Use the coach and the official revoke links instead.

The content script, if it runs at all, may attach to the Semblance demo pages only (`demo/lure.html`, `demo/allow.html`).
