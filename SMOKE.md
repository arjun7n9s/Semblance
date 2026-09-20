# Load-unpacked smoke

Human checklist after `chrome://extensions` → Developer mode → **Load unpacked** on this folder (the one with `manifest.json`). Chrome 116+.

## Keep-installed (no demo tabs)

1. Pin Semblance. Open the popup. Confirm **Demo only (labeled FAKE)** is a closed disclosure. Do **not** open Beat A or Beat B yet. **Open coach beside this tab.** Close the popup.
2. Side panel, demo tabs closed: a stranger can use it. Scope coach lists Google and Microsoft scopes in plain sentences. Search `Mail.Send`.
3. In a new tab, open this test URL (Google may show an error/consent page for the dummy client_id — that is fine. Semblance only reads the address bar). Do **not** paste it:

   `https://accounts.google.com/o/oauth2/v2/auth?client_id=000000000000-demo.apps.googleusercontent.com&response_type=code&scope=openid%20email%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/not.a.real.scope&redirect_uri=http%3A%2F%2F127.0.0.1%3A4173%2Fcallback`

   Expect a toolbar badge `!`. Optional notification: open Semblance to read what this Allow grants. Semblance must not score the link, inject into the page, or capture tokens.
4. Click the Semblance icon. Popup and/or coach should already show those scopes (known sentences + `not.a.real.scope` unknown). Open the coach if the popup is still up. Nothing was pasted.
5. In another tab, open `https://www.google.com/device` (real Google device page or a soft error is fine). Expect a badge and a device-login nudge in the coach — typing a code is Allow. No page inject. No code capture. Paste ritual still exists below for a code someone sent you.
6. Close those tabs. Paste remains the fallback: paste `https://accounts.google.com/o/oauth2/v2/auth?client_id=000000000000-demo.apps.googleusercontent.com&response_type=code&scope=openid%20email%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/not.a.real.scope&redirect_uri=http%3A%2F%2F127.0.0.1%3A4173%2Fcallback` → **Decode scopes**. Expect the same plain-language rows, `not.a.real.scope` labeled unknown, and no link score.
7. Paste `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=00000000-0000-0000-0000-000000000000&response_type=code&scope=User.Read%20Mail.Send%20offline_access&redirect_uri=http%3A%2F%2F127.0.0.1%3A4173%2Fcallback` → decode. Expect User.Read, Mail.Send, and the long leash.
8. Paste `https://support.google.com/accounts?hl=en` → decode. Expect no `scope=`. Semblance does not score that link.
9. Paste `http://127.0.0.1:4173/callback?code=4/0Aean5NotARealCodeAtAll0001` → **Check this paste**. Expect localhost and code hits. Nothing stored.
10. Paste `hello` → no ritual match. The box is unchanged.
11. Friend-verify: save a word, type the wrong word → gate stays closed. Type the right word → verified in this browser.
12. **I understand** still works as the other key, without opening theater.
13. Revoke buttons open Google connections and Microsoft app-access (sign-in on those pages is theirs).
14. Revoke check-in is **off** by default. Status says no reminder is scheduled and Semblance is not watching accounts. Do not schedule yet.
15. Pick **1 minute** → **Schedule this reminder**. Status shows a future time and says this is a timer you asked for, not live monitoring. **Turn off**. Status says the timer is cleared. Nothing should fire.
16. Schedule **1 minute** again. Wait until it fires (about a minute; unpacked Chrome may use that delay, packed Chrome will not fire faster than a minute). Expect a calm notification and/or a toolbar badge. Copy must say this is a reminder you asked for, **not live monitoring**. Semblance must not claim it scanned accounts.
17. Click the notification body (or the popup line if the badge is the cue) → the coach / revoke check-in. Notification buttons open the official Google or Microsoft connected-apps pages. **Turn off** clears the badge. Still no account scan.
18. Close the panel and reopen from the popup. Live decode (when the tab is an Allow URL), paste decode, browse, paste ritual, friend-verify, revoke, and the check-in (still off unless you scheduled another) are still there. Theater was never required.

## Theater, then back to the product

19. From the toolbar popup, open **Demo only (labeled FAKE)**, then **Open Beat A · friend lure**. Chat cannot send. LabQueue is labeled a prop. The side panel is not a second lure.
20. Open LabQueue / **Open Beat B · fake Allow**. Sticky banner **FAKE — not Google/Microsoft** stays on top, including over the pause sheet.
21. If the gate is already open from step 11, Allow goes to aftermath — you already owned the click. Still no network. LabQueue is still a prop.
22. To see pause → hard-stop → quiet: clear the shared word (empty Save word) so the gate closes, reload Beat B. The pause sheet may already be up. Esc or click the dim area — do not tap I understand. Allow → hard-stop. Esc. Allow again → quiet, no nag sheet. Gate still closed.
23. Close every demo tab. The side panel still works: land on a `scope=` URL or decode a paste, browse scopes, paste ritual, friend-verify, revoke, and the optional check-in. Theater was optional.
