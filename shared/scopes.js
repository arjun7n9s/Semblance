(function (root) {
  "use strict";

  var UNKNOWN_SENTENCE =
    "Unknown in Semblance's local list. We will not guess. Treat it as extra access you have not read.";

  var SCOPES = [
    {
      id: "openid",
      raw: "openid",
      family: "Either",
      heat: "low",
      sentence: "Confirms you are a real signed-in person. Usually fine by itself."
    },
    {
      id: "email",
      raw: "email / userinfo.email",
      family: "Either",
      heat: "low",
      sentence: "Reads the email address on this account — the one people use to find you."
    },
    {
      id: "profile",
      raw: "profile / userinfo.profile",
      family: "Either",
      heat: "low",
      sentence: "Sees your name and profile photo. Still a real identity share."
    },
    {
      id: "offline_access",
      raw: "offline_access",
      family: "Either",
      heat: "high",
      sentence: "Keeps access after you close the tab — until you revoke it. This is the long leash."
    },
    {
      id: "gmail.readonly",
      raw: "gmail.readonly",
      family: "Google",
      heat: "high",
      sentence: "Can read every email in this inbox, including password resets and school mail."
    },
    {
      id: "gmail.send",
      raw: "gmail.send",
      family: "Google",
      heat: "high",
      sentence: "Can send email that looks like it came from you."
    },
    {
      id: "gmail.modify",
      raw: "gmail.modify",
      family: "Google",
      heat: "high",
      sentence: "Can read, label, and delete mail. A quiet way to hide what it did."
    },
    {
      id: "gmail.compose",
      raw: "gmail.compose",
      family: "Google",
      heat: "high",
      sentence: "Can write drafts and send mail as you. The send is still yours."
    },
    {
      id: "gmail.metadata",
      raw: "gmail.metadata",
      family: "Google",
      heat: "high",
      sentence: "Can see who you email and when, without opening bodies. Still a map of your life."
    },
    {
      id: "mail.google.com",
      raw: "https://mail.google.com/",
      family: "Google",
      heat: "high",
      sentence: "Full Gmail: read, send, and delete. The same power as sitting in your inbox."
    },
    {
      id: "drive",
      raw: "drive",
      family: "Google",
      heat: "high",
      sentence: "Can open and change files in Drive — homework, IDs, shared folders."
    },
    {
      id: "drive.file",
      raw: "drive.file",
      family: "Google",
      heat: "mid",
      sentence: "Can only touch Drive files this app creates or that you pick. Not the rest of Drive."
    },
    {
      id: "drive.readonly",
      raw: "drive.readonly",
      family: "Google",
      heat: "high",
      sentence: "Can read every file in Drive even if it cannot change them. Homework, IDs, shared folders."
    },
    {
      id: "calendar",
      raw: "calendar",
      family: "Google",
      heat: "mid",
      sentence: "Can see and change your calendar, including where you will be."
    },
    {
      id: "calendar.readonly",
      raw: "calendar.readonly",
      family: "Google",
      heat: "mid",
      sentence: "Can see your calendar, including where you will be. It cannot change events."
    },
    {
      id: "contacts",
      raw: "contacts",
      family: "Google",
      heat: "high",
      sentence: "Can read and change the people in your address book."
    },
    {
      id: "contacts.readonly",
      raw: "contacts.readonly",
      family: "Google",
      heat: "high",
      sentence: "Can read the people in your address book. It cannot change them."
    },
    {
      id: "photoslibrary.readonly",
      raw: "photoslibrary.readonly",
      family: "Google",
      heat: "high",
      sentence: "Can see your Google Photos — private camera roll, screenshots, IDs you photographed."
    },
    {
      id: "youtube.upload",
      raw: "youtube.upload",
      family: "Google",
      heat: "high",
      sentence: "Can publish videos on your YouTube channel as you."
    },
    {
      id: "documents",
      raw: "documents",
      family: "Google",
      heat: "high",
      sentence: "Can open and change Google Docs on this account, including shared school papers."
    },
    {
      id: "spreadsheets",
      raw: "spreadsheets",
      family: "Google",
      heat: "high",
      sentence: "Can open and change Google Sheets — homework trackers, shared lists, anything in a grid."
    },
    {
      id: "classroom.rosters.readonly",
      raw: "classroom.rosters.readonly",
      family: "Google",
      heat: "high",
      sentence: "Can see who is in your classes. That is a student list, not a club-roster toy."
    },
    {
      id: "classroom.coursework.me",
      raw: "classroom.coursework.me",
      family: "Google",
      heat: "high",
      sentence: "Can read and turn in your Classroom assignments as you."
    },
    {
      id: "user.phonenumbers.read",
      raw: "user.phonenumbers.read",
      family: "Google",
      heat: "high",
      sentence: "Can read the phone number on this account — the one texts and resets use."
    },
    {
      id: "user.addresses.read",
      raw: "user.addresses.read",
      family: "Google",
      heat: "high",
      sentence: "Can read the home or school address saved on this account."
    },
    {
      id: "chat.messages.readonly",
      raw: "chat.messages.readonly",
      family: "Google",
      heat: "high",
      sentence: "Can read your Google Chat messages, including DMs."
    },
    {
      id: "cloud-platform",
      raw: "cloud-platform",
      family: "Google",
      heat: "high",
      sentence: "A skeleton key for Google Cloud on this account. Not a school-club permission."
    },
    {
      id: "user.read",
      raw: "User.Read",
      family: "Microsoft",
      heat: "low",
      sentence: "Sees your name and work or school profile."
    },
    {
      id: "user.readwrite",
      raw: "User.ReadWrite",
      family: "Microsoft",
      heat: "mid",
      sentence: "Can change your Microsoft profile, not only read it."
    },
    {
      id: "mail.read",
      raw: "Mail.Read",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read your Outlook mail, including codes people send you."
    },
    {
      id: "mail.readbasic",
      raw: "Mail.ReadBasic",
      family: "Microsoft",
      heat: "high",
      sentence: "Can see Outlook subject lines and senders. Password-reset subjects still leak."
    },
    {
      id: "mail.send",
      raw: "Mail.Send",
      family: "Microsoft",
      heat: "high",
      sentence: "Can send Outlook mail as you."
    },
    {
      id: "mailbox.readwrite",
      raw: "Mail.ReadWrite",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read and change your mail, including deleting the evidence."
    },
    {
      id: "imap.accessasuser.all",
      raw: "IMAP.AccessAsUser.All",
      family: "Microsoft",
      heat: "high",
      sentence: "Lets another app sit on your mailbox like a mail client — read and send as you."
    },
    {
      id: "smtp.send",
      raw: "SMTP.Send",
      family: "Microsoft",
      heat: "high",
      sentence: "Can send email as you through Outlook's send server."
    },
    {
      id: "files.read",
      raw: "Files.Read",
      family: "Microsoft",
      heat: "mid",
      sentence: "Can read files in your OneDrive, not every file other people shared with you."
    },
    {
      id: "files.readwrite",
      raw: "Files.ReadWrite",
      family: "Microsoft",
      heat: "high",
      sentence: "Can change files in your OneDrive."
    },
    {
      id: "files.read.all",
      raw: "Files.Read.All",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read files you can reach in OneDrive or SharePoint — including shared school folders."
    },
    {
      id: "files.readwrite.all",
      raw: "Files.ReadWrite.All",
      family: "Microsoft",
      heat: "high",
      sentence: "Can change files you can reach in OneDrive or SharePoint."
    },
    {
      id: "calendars.read",
      raw: "Calendars.Read",
      family: "Microsoft",
      heat: "mid",
      sentence: "Can see Outlook calendar events, including where you will be."
    },
    {
      id: "calendars.readwrite",
      raw: "Calendars.ReadWrite",
      family: "Microsoft",
      heat: "mid",
      sentence: "Can see and change Outlook calendar events, including where you will be."
    },
    {
      id: "contacts.read",
      raw: "Contacts.Read",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read the people in your Outlook address book."
    },
    {
      id: "contacts.readwrite",
      raw: "Contacts.ReadWrite",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read and change the people in your Outlook address book."
    },
    {
      id: "chat.read",
      raw: "Chat.Read",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read your Teams or Microsoft chat messages."
    },
    {
      id: "chat.readwrite",
      raw: "Chat.ReadWrite",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read and send Teams or Microsoft chat as you."
    },
    {
      id: "directory.read.all",
      raw: "Directory.Read.All",
      family: "Microsoft",
      heat: "high",
      sentence: "Can list people and groups across the whole org — not just you."
    }
  ];

  var byKey = {};

  function addKey(map, key, scope) {
    var norm = String(key || "")
      .trim()
      .toLowerCase()
      .replace(/\/+$/, "");
    if (!norm || map[norm]) {
      return;
    }
    map[norm] = scope;
  }

  function registerScope(scope) {
    addKey(byKey, scope.id, scope);
    String(scope.raw || "")
      .split(" / ")
      .forEach(function (part) {
        addKey(byKey, part, scope);
      });
    (scope.aliases || []).forEach(function (alias) {
      addKey(byKey, alias, scope);
    });
    if (scope.family === "Google") {
      if (scope.id === "email") {
        addKey(byKey, "userinfo.email", scope);
        addKey(byKey, "https://www.googleapis.com/auth/userinfo.email", scope);
      } else if (scope.id === "profile") {
        addKey(byKey, "userinfo.profile", scope);
        addKey(byKey, "https://www.googleapis.com/auth/userinfo.profile", scope);
      } else if (scope.id === "mail.google.com") {
        addKey(byKey, "https://mail.google.com", scope);
      } else if (scope.id !== "openid" && scope.id !== "offline_access") {
        addKey(byKey, "https://www.googleapis.com/auth/" + scope.id, scope);
      }
    }
    if (scope.family === "Either") {
      if (scope.id === "email") {
        addKey(byKey, "userinfo.email", scope);
        addKey(byKey, "https://www.googleapis.com/auth/userinfo.email", scope);
      }
      if (scope.id === "profile") {
        addKey(byKey, "userinfo.profile", scope);
        addKey(byKey, "https://www.googleapis.com/auth/userinfo.profile", scope);
      }
    }
    if (scope.family === "Microsoft") {
      addKey(byKey, "https://graph.microsoft.com/" + scope.raw, scope);
      addKey(byKey, "https://graph.microsoft.com/" + scope.id, scope);
    }
  }

  SCOPES.forEach(registerScope);

  function unique(list) {
    var out = [];
    var seen = {};
    list.forEach(function (item) {
      if (!item || seen[item]) {
        return;
      }
      seen[item] = true;
      out.push(item);
    });
    return out;
  }

  function candidateKeys(token) {
    var t = String(token || "").trim();
    if (!t) {
      return [];
    }
    try {
      t = decodeURIComponent(t);
    } catch (err) {
      t = String(token || "").trim();
    }
    t = t.replace(/\/+$/, "");
    var lower = t.toLowerCase();
    var keys = [lower];
    var match;
    match = lower.match(/^https:\/\/www\.googleapis\.com\/auth\/(.+)$/);
    if (match) {
      keys.push(match[1]);
    }
    if (lower === "https://mail.google.com") {
      keys.push("mail.google.com");
    }
    match = lower.match(/^https:\/\/graph\.microsoft\.com\/(.+)$/);
    if (match) {
      keys.push(match[1]);
    }
    match = lower.match(/^https:\/\/outlook\.office(?:365)?\.com\/(.+)$/);
    if (match) {
      keys.push(match[1]);
    }
    return unique(keys);
  }

  function matchExact(token) {
    var keys = candidateKeys(token);
    var i;
    for (i = 0; i < keys.length; i += 1) {
      if (byKey[keys[i]]) {
        return byKey[keys[i]];
      }
    }
    return null;
  }

  function findByRaw(raw) {
    var needle = String(raw || "").toLowerCase();
    var i;
    var scope;
    var includes = null;
    var exact = matchExact(raw);
    if (exact) {
      return exact;
    }
    if (!needle) {
      return null;
    }
    for (i = 0; i < SCOPES.length; i += 1) {
      scope = SCOPES[i];
      if (scope.id.toLowerCase() === needle || scope.raw.toLowerCase() === needle) {
        return scope;
      }
      if (!includes && scope.raw.toLowerCase().indexOf(needle) !== -1) {
        includes = scope;
      }
    }
    return includes;
  }

  function filter(query) {
    var q = String(query || "").trim().toLowerCase();
    if (!q) {
      return SCOPES.slice();
    }
    return SCOPES.filter(function (scope) {
      return (
        scope.raw.toLowerCase().indexOf(q) !== -1 ||
        scope.sentence.toLowerCase().indexOf(q) !== -1 ||
        scope.family.toLowerCase().indexOf(q) !== -1 ||
        scope.id.indexOf(q) !== -1
      );
    });
  }

  function explain(token) {
    var rawToken = String(token || "").trim();
    var found = matchExact(rawToken);
    if (found) {
      return {
        id: found.id,
        raw: found.raw,
        family: found.family,
        heat: found.heat,
        known: true,
        sentence: found.sentence,
        token: rawToken
      };
    }
    return {
      id: "unknown",
      raw: rawToken,
      family: "Unknown",
      heat: "unknown",
      known: false,
      sentence: UNKNOWN_SENTENCE,
      token: rawToken
    };
  }

  function decodeScopeField(value) {
    var text = String(value == null ? "" : value).replace(/\+/g, " ");
    try {
      text = decodeURIComponent(text);
    } catch (err) {
      text = String(value == null ? "" : value).replace(/\+/g, " ");
    }
    return text;
  }

  function isScopeToken(token) {
    var t = String(token || "").trim();
    if (!t || /\s/.test(t)) {
      return false;
    }
    if (/^(openid|email|profile|offline_access)$/i.test(t)) {
      return true;
    }
    if (/^https:\/\/www\.googleapis\.com\/auth\/[A-Za-z0-9._\-]+$/i.test(t)) {
      return true;
    }
    if (/^https:\/\/mail\.google\.com\/?$/i.test(t)) {
      return true;
    }
    if (/^https:\/\/graph\.microsoft\.com\/[A-Za-z0-9._\-]+$/i.test(t)) {
      return true;
    }
    if (/^https:\/\/outlook\.office(?:365)?\.com\/[A-Za-z0-9._\-]+$/i.test(t)) {
      return true;
    }
    return /^[A-Za-z][A-Za-z0-9]*(?:[._][A-Za-z][A-Za-z0-9]*)+$/.test(t);
  }

  function looksLikeScopeList(source) {
    var tokens = String(source || "")
      .replace(/\+/g, " ")
      .trim()
      .split(/\s+/);
    if (!tokens.length || tokens.length > 40) {
      return false;
    }
    return tokens.every(isScopeToken);
  }

  function extractScopeValue(text) {
    var source = String(text || "").replace(/&amp;/gi, "&").trim();
    var match;
    var value;
    if (!source) {
      return { ok: false, reason: "empty" };
    }
    match = source.match(/(?:^|[?&#])scope=([^&#]*)/i);
    if (match) {
      value = decodeScopeField(match[1]);
      if (!String(value || "").trim()) {
        return { ok: false, reason: "empty-scope" };
      }
      return {
        ok: true,
        value: value,
        via: /https?:\/\//i.test(source) ? "url" : "query"
      };
    }
    if (looksLikeScopeList(source)) {
      return { ok: true, value: source.replace(/\+/g, " "), via: "list" };
    }
    return { ok: false, reason: "no-scope" };
  }

  function splitTokens(value) {
    return String(value || "")
      .split(/\s+/)
      .map(function (token) {
        return token.trim();
      })
      .filter(Boolean);
  }

  function decode(text) {
    var extracted = extractScopeValue(text);
    var tokens = [];
    var seen = {};
    var items;
    var unknown = 0;
    if (!extracted.ok) {
      return extracted;
    }
    splitTokens(extracted.value).forEach(function (token) {
      var key = token.toLowerCase();
      if (seen[key]) {
        return;
      }
      seen[key] = true;
      tokens.push(token);
    });
    if (!tokens.length) {
      return { ok: false, reason: "empty-scope" };
    }
    items = tokens.map(explain);
    items.forEach(function (item) {
      if (!item.known) {
        unknown += 1;
      }
    });
    return {
      ok: true,
      via: extracted.via,
      tokens: tokens,
      items: items,
      known: items.length - unknown,
      unknown: unknown
    };
  }

  root.SemblanceScopes = {
    all: SCOPES,
    findByRaw: findByRaw,
    filter: filter,
    explain: explain,
    decode: decode,
    unknownSentence: UNKNOWN_SENTENCE
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
