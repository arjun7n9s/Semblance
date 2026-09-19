(function (root) {
  "use strict";

  var LOOPBACK = "(?:localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|\\[::1\\])";

  var RULES = [
    {
      id: "localhost-url",
      title: "Localhost login bounce",
      sentence:
        "A program on this computer is waiting for a login. Opening that link is the sign-in — not a preview.",
      re: new RegExp(
        "(?:https?:\\/\\/" +
          LOOPBACK +
          "(?::\\d+)?(?:\\/\\S*)?|(?:^|[^\\w.])" +
          LOOPBACK +
          ":\\d+)",
        "i"
      )
    },
    {
      id: "redirect-localhost",
      title: "OAuth redirect to this machine",
      sentence:
        "This link sends the leftover login to localhost. That is a real handoff, not a website souvenir.",
      re: new RegExp(
        "[\"']?redirect_uri[\"']?\\s*[=:]\\s*(?:[\"']|https?%3A%2F%2F|https?:\\/\\/)*" + LOOPBACK,
        "i"
      )
    },
    {
      id: "auth-code",
      title: "Authorization code in a URL",
      sentence:
        "This URL is carrying a one-time login code. Anyone who has the link can finish the login.",
      re: /(?:\?|&|#)(?:code|authorization_code)=[A-Za-z0-9._~\-+/=%]+/i
    },
    {
      id: "google-auth-code",
      title: "Google-style pasted code",
      sentence:
        "A long 4/… string is a one-time Google login code. Pasting it finishes sign-in for whoever asked.",
      re: /\b4\/[0-9A-Za-z_-]{20,}\b/
    },
    {
      id: "device-code",
      title: "Device-code ritual",
      sentence:
        "A short code like ABCD-EFGH is a device login. Typing it is the same as saying yes.",
      re: /\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/
    },
    {
      id: "device-login-host",
      title: "Device login door",
      sentence:
        "A device-login page is a real sign-in door. Do not type a code because a chat asked you to.",
      re: /(?:microsoft\.com\/devicelogin|aka\.ms\/devicelogin|google\.com\/device|g\.co\/device)/i
    },
    {
      id: "jwt-shape",
      title: "Token-shaped paste",
      sentence:
        "This looks like a session token, not a joke. Do not paste it into a chat or a random site.",
      re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
    },
    {
      id: "access-token-word",
      title: "Access-token language",
      sentence:
        "Words like access_token in a paste mean leftover login, not a coupon.",
      re: /["']?(?:access_token|refresh_token|id_token)["']?\s*[:=]/i
    },
    {
      id: "google-access-token",
      title: "Google access-token shape",
      sentence:
        "A ya29. string is a live Google access token. Sharing it hands over the session.",
      re: /\bya29\.[A-Za-z0-9._-]{20,}\b/
    },
    {
      id: "google-refresh-token",
      title: "Google refresh-token shape",
      sentence:
        "A 1// string is a Google refresh token. It keeps working after the tab closes, until revoke.",
      re: /\b1\/\/[0-9A-Za-z_-]{20,}\b/
    },
    {
      id: "oob-redirect",
      title: "Out-of-band login paste",
      sentence:
        "This is a desktop-app leftover login. The code that follows is the grant — not a confirmation number.",
      re: /urn:ietf:wg:oauth:2\.0:oob/i
    }
  ];

  function inspect(text) {
    var source = String(text || "");
    var hits = [];
    var i;
    var rule;
    if (!source.trim()) {
      return hits;
    }
    for (i = 0; i < RULES.length; i += 1) {
      rule = RULES[i];
      if (rule.re.test(source)) {
        hits.push({
          id: rule.id,
          title: rule.title,
          sentence: rule.sentence
        });
      }
      rule.re.lastIndex = 0;
    }
    return hits;
  }

  root.SemblanceRituals = {
    rules: RULES,
    inspect: inspect
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
