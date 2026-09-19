(function (root) {
  "use strict";

  var SCOPES = [
    {
      id: "openid",
      raw: "openid",
      family: "Google",
      heat: "low",
      sentence: "Confirms you are a real signed-in person. Usually fine by itself."
    },
    {
      id: "email",
      raw: "email / userinfo.email",
      family: "Google",
      heat: "low",
      sentence: "Reads the email address on this account — the one people use to find you."
    },
    {
      id: "profile",
      raw: "profile / userinfo.profile",
      family: "Google",
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
      id: "calendar",
      raw: "calendar",
      family: "Google",
      heat: "mid",
      sentence: "Can see and change your calendar, including where you will be."
    },
    {
      id: "contacts",
      raw: "contacts",
      family: "Google",
      heat: "high",
      sentence: "Can read and change the people in your address book."
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
      id: "mail.read",
      raw: "Mail.Read",
      family: "Microsoft",
      heat: "high",
      sentence: "Can read your Outlook mail, including codes people send you."
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
      id: "files.readwrite.all",
      raw: "Files.ReadWrite.All",
      family: "Microsoft",
      heat: "high",
      sentence: "Can change files you can reach in OneDrive or SharePoint."
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
      id: "directory.read.all",
      raw: "Directory.Read.All",
      family: "Microsoft",
      heat: "high",
      sentence: "Can list people and groups across the whole org — not just you."
    }
  ];

  function findByRaw(raw) {
    var needle = String(raw || "").toLowerCase();
    var i;
    var scope;
    var includes = null;
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

  root.SemblanceScopes = {
    all: SCOPES,
    findByRaw: findByRaw,
    filter: filter
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
