# Load-unpacked smoke

Human checklist after `chrome://extensions` → Developer mode → **Load unpacked** on this folder (the one with `manifest.json`). Chrome 116+.

## Keep-installed (no demo tabs)

1. Pin Semblance. Open the popup. **Open coach beside this tab.** Close the popup. Do **not** open Beat A or Beat B yet.
2. Side panel, demo tabs closed: a stranger can use it. Scope coach lists Google and Microsoft scopes in plain sentences. Search `Mail.Send`.
3. Paste `https://example.test/authorize?response_type=code&scope=openid%20email%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/not.a.real.scope` → **Decode scopes**. Expect plain-language rows for the known scopes, `not.a.real.scope` labeled unknown, and no link score.
4. Paste `https://example.test/oauth2/v2.0/authorize?scope=User.Read+Mail.Send+offline_access` → decode. Expect User.Read, Mail.Send, and the long leash.
5. Paste `https://example.com/help?topic=code` → decode. Expect no `scope=`. Semblance does not score that link.
6. Paste `http://127.0.0.1:4173/callback?code=4/0Aean5NotARealCodeAtAll0001` → **Check this paste**. Expect localhost and code hits. Nothing stored.
7. Paste `hello` → no ritual match. The box is unchanged.
8. Friend-verify: save a word, type the wrong word → gate stays closed. Type the right word → verified in this browser.
9. **I understand** still works as the other key, without opening theater.
10. Revoke buttons open Google connections and Microsoft app-access (sign-in on those pages is theirs).
11. Revoke check-in is **off** by default. Status says no reminder is scheduled and Semblance is not watching accounts. Do not schedule yet.
12. Pick **1 minute** → **Schedule this reminder**. Status shows a future time and says this is a timer you asked for, not live monitoring. **Turn off**. Status says the timer is cleared. Nothing should fire.
13. Schedule **1 minute** again. Wait until it fires (about a minute; unpacked Chrome may use that delay, packed Chrome will not fire faster than a minute). Expect a calm notification and/or a toolbar badge. Copy must say this is a reminder you asked for, **not live monitoring**. Semblance must not claim it scanned accounts.
14. Click the notification body (or the popup line if the badge is the cue) → the coach / revoke check-in. Notification buttons open the official Google or Microsoft connected-apps pages. **Turn off** clears the badge. Still no account scan.
15. Close the panel and reopen from the popup. Scope decode, browse, paste ritual, friend-verify, revoke, and the check-in (still off unless you scheduled another) are still there. Theater was never required.

## Theater, then back to the product

16. From the toolbar popup, **Open Beat A · friend lure**. Chat cannot send. LabQueue is labeled a prop. The side panel is not a second lure.
17. Open LabQueue / **Open Beat B · fake Allow**. Sticky banner **FAKE — not Google/Microsoft** stays on top, including over the pause sheet.
18. If the gate is already open from step 8, Allow goes to aftermath — you already owned the click. Still no network. LabQueue is still a prop.
19. To see pause → hard-stop → quiet: clear the shared word (empty Save word) so the gate closes, reload Beat B. The pause sheet may already be up. Esc or click the dim area — do not tap I understand. Allow → hard-stop. Esc. Allow again → quiet, no nag sheet. Gate still closed.
20. Close every demo tab. The side panel still works: decode a `scope=` URL, browse scopes, paste ritual, friend-verify, revoke, and the optional check-in. Theater was optional.
