(function (root) {
  "use strict";

  var STORAGE_KEY = "liveAllows";
  var NOTIFICATION_PREFIX = "semblance-live-allow:";
  var ACTION_TITLE = "Semblance";
  var TAB_CAP = 40;
  var SECRET_PARAM = /(?:^|[?&#])(?:access_token|id_token|refresh_token|code)=/i;

  var DEVICE_NUDGE = {
    id: "device-login-host",
    title: "Device login door",
    sentence:
      "A device-login page is a real sign-in door. Typing a code is the same as Allow — MFA never runs on that code. Do not type one because a chat or a job form asked you to."
  };

  var COPY = {
    badgeText: "!",
    badgeTitle: "This tab is asking for Allow — open Semblance to read the scopes",
    badgeTitleDevice: "This tab is a device-login door — open Semblance before you type a code",
    notificationTitle: "This tab is asking for Allow",
    notificationTitleDevice: "This tab is a device-login door",
    notificationMessage:
      "Open Semblance to read what this Allow grants. Semblance does not click Allow, and it does not score the link.",
    notificationMessageDevice:
      "Open Semblance before you type a device code. Typing it is the same as Allow. Semblance does not read the page or score the link.",
    notificationContext: "From the address bar. Not a login-page injection.",
    popupLead:
      "This tab is asking for Allow. Open the coach to read what it grants — you do not need to paste.",
    popupLeadDevice:
      "This tab is a device-login door. Open the coach before you type a code — you do not need to paste.",
    panelLead:
      "This tab is asking for Allow. Semblance read scope= from the address bar. It did not open the login page, click Allow, or store tokens.",
    panelLeadDevice:
      "This tab is a device-login door. Semblance saw the address bar only. It did not read the page, capture a code, or score the link.",
    panelEmpty: "No Allow or device-login URL in this tab yet. Paste one below if you have it.",
    notAScore: "This is not a link score."
  };

  function api() {
    return typeof chrome !== "undefined" ? chrome : null;
  }

  function parseUrl(href) {
    try {
      return new URL(String(href || ""));
    } catch (_err) {
      return null;
    }
  }

  function isHttpUrl(parsed) {
    return Boolean(parsed && (parsed.protocol === "http:" || parsed.protocol === "https:"));
  }

  function isIgnorableUrl(href) {
    var text = String(href || "");
    return /^(chrome|chrome-extension|edge|about|devtools|file|blob|data|view-source):/i.test(text);
  }

  function bareHost(host) {
    return String(host || "")
      .toLowerCase()
      .replace(/^www\./, "");
  }

  function isGoogleIdp(host) {
    var h = bareHost(host);
    return h === "accounts.google.com" || /\.accounts\.google\.com$/.test(h);
  }

  function isMicrosoftIdp(host) {
    var h = bareHost(host);
    return (
      h === "login.live.com" ||
      h === "login.windows.net" ||
      /(^|\.)login\.microsoftonline\.com$/.test(h) ||
      /(^|\.)login\.microsoftonline\.us$/.test(h)
    );
  }

  function isIdpHost(host) {
    return isGoogleIdp(host) || isMicrosoftIdp(host);
  }

  function isAuthorizePath(path) {
    var p = String(path || "");
    return (
      /\/authorize\/?$/i.test(p) ||
      /\/oauth2\/(?:v2\.0\/)?authorize\/?$/i.test(p) ||
      /\/o\/oauth2\/(?:v2\/)?auth\/?$/i.test(p) ||
      /oauth20_authorize/i.test(p) ||
      /\/signin\/oauth/i.test(p)
    );
  }

  function isAuthorizeLocation(host, path, href) {
    if (isAuthorizePath(path)) {
      return true;
    }
    if (isIdpHost(host) && /oauth/i.test(path || "")) {
      return true;
    }
    if (isIdpHost(host) && /(?:^|[?&#])client_id=/i.test(String(href || ""))) {
      return true;
    }
    return false;
  }

  function isDeviceLoginLocation(host, path) {
    var h = bareHost(host);
    var p = String(path || "");
    if (/\/devicelogin\/?$/i.test(p)) {
      return true;
    }
    if ((h === "google.com" || h === "g.co") && /\/device\/?$/i.test(p)) {
      return true;
    }
    if (h === "aka.ms" && /device/i.test(p)) {
      return true;
    }
    if (isMicrosoftIdp(h) && /deviceauth|devicelogin|\/device\/?$/i.test(p)) {
      return true;
    }
    if (isGoogleIdp(h) && /\/(device|usercode)(\/|$)/i.test(p)) {
      return true;
    }
    return false;
  }

  function hasSecretParam(href) {
    return SECRET_PARAM.test(String(href || ""));
  }

  function familyOf(host, items, kind) {
    var seen = {};
    if (isGoogleIdp(host) || (kind === "device" && /^(accounts\.google\.com|google\.com|g\.co)$/.test(bareHost(host)))) {
      return "Google";
    }
    if (
      isMicrosoftIdp(host) ||
      (kind === "device" && /^(microsoft\.com|login\.microsoft\.com|aka\.ms)$/.test(bareHost(host)))
    ) {
      return "Microsoft";
    }
    (items || []).forEach(function (item) {
      if (item && item.family && item.family !== "Unknown") {
        seen[item.family] = true;
      }
    });
    if (seen.Google && seen.Microsoft) {
      return "Mixed";
    }
    if (seen.Google) {
      return "Google";
    }
    if (seen.Microsoft) {
      return "Microsoft";
    }
    if (seen.Either) {
      return "Either";
    }
    return kind === "device" ? "Either" : "Unknown";
  }

  function compactItems(items) {
    return (items || []).map(function (item) {
      return {
        id: item.id,
        raw: item.raw,
        family: item.family,
        heat: item.heat,
        known: item.known === true,
        sentence: item.sentence,
        token: item.token
      };
    });
  }

  function cueFor(kind) {
    if (kind === "device") {
      return {
        badgeTitle: COPY.badgeTitleDevice,
        notificationTitle: COPY.notificationTitleDevice,
        notificationMessage: COPY.notificationMessageDevice,
        notificationContext: COPY.notificationContext,
        popupLead: COPY.popupLeadDevice,
        panelLead: COPY.panelLeadDevice
      };
    }
    return {
      badgeTitle: COPY.badgeTitle,
      notificationTitle: COPY.notificationTitle,
      notificationMessage: COPY.notificationMessage,
      notificationContext: COPY.notificationContext,
      popupLead: COPY.popupLead,
      panelLead: COPY.panelLead
    };
  }

  function snapshotFromUrl(href) {
    var parsed;
    var decoded;
    var host;
    var path;
    var items;
    var authorize;
    var device;
    if (!href || typeof href !== "string") {
      return { ok: false, reason: "empty" };
    }
    parsed = parseUrl(href);
    if (!parsed) {
      return { ok: false, reason: "not-url" };
    }
    if (!isHttpUrl(parsed)) {
      return { ok: false, reason: "scheme" };
    }
    host = parsed.hostname.toLowerCase();
    path = parsed.pathname || "/";
    authorize = isAuthorizeLocation(host, path, href);
    device = isDeviceLoginLocation(host, path);
    if (authorize && !hasSecretParam(href)) {
      if (!root.SemblanceScopes || typeof root.SemblanceScopes.decode !== "function") {
        return { ok: false, reason: "no-decoder" };
      }
      decoded = root.SemblanceScopes.decode(href);
      if (decoded.ok) {
        items = compactItems(decoded.items);
        return {
          ok: true,
          kind: "authorize",
          host: host,
          family: familyOf(host, items, "authorize"),
          tokens: (decoded.tokens || []).slice(),
          items: items,
          known: decoded.known,
          unknown: decoded.unknown,
          nudge: null,
          fingerprint:
            "authorize|" +
            host +
            "|" +
            (decoded.tokens || [])
              .map(function (token) {
                return String(token).toLowerCase();
              })
              .join(" ")
        };
      }
      if (!device) {
        return { ok: false, reason: decoded.reason || "no-scope" };
      }
    }
    if (device) {
      return {
        ok: true,
        kind: "device",
        host: host,
        family: familyOf(host, [], "device"),
        tokens: [],
        items: [],
        known: 0,
        unknown: 0,
        nudge: {
          id: DEVICE_NUDGE.id,
          title: DEVICE_NUDGE.title,
          sentence: DEVICE_NUDGE.sentence
        },
        fingerprint: "device|" + host + "|" + path.toLowerCase()
      };
    }
    if (hasSecretParam(href)) {
      return { ok: false, reason: "secret" };
    }
    return { ok: false, reason: authorize ? "no-scope" : "not-authorize" };
  }

  function recordFromSnapshot(tabId, snap, now) {
    return {
      tabId: tabId,
      kind: snap.kind || "authorize",
      host: snap.host,
      family: snap.family,
      tokens: snap.tokens || [],
      items: snap.items || [],
      known: snap.known || 0,
      unknown: snap.unknown || 0,
      nudge: snap.nudge || null,
      fingerprint: snap.fingerprint,
      detectedAt: now || Date.now(),
      notified: false
    };
  }

  function readMap() {
    if (!root.SemblanceStore || typeof root.SemblanceStore.sessionGet !== "function") {
      return Promise.resolve({});
    }
    return root.SemblanceStore.sessionGet([STORAGE_KEY]).then(function (data) {
      var map = data && data[STORAGE_KEY];
      return map && typeof map === "object" ? map : {};
    });
  }

  function writeMap(map) {
    var patch = {};
    if (!root.SemblanceStore || typeof root.SemblanceStore.sessionSet !== "function") {
      return Promise.resolve(false);
    }
    patch[STORAGE_KEY] = map;
    return root.SemblanceStore.sessionSet(patch);
  }

  function capMap(map) {
    var keys = Object.keys(map);
    var ranked;
    if (keys.length <= TAB_CAP) {
      return map;
    }
    ranked = keys
      .map(function (key) {
        return { key: key, at: (map[key] && map[key].detectedAt) || 0 };
      })
      .sort(function (a, b) {
        return a.at - b.at;
      });
    while (ranked.length > TAB_CAP) {
      delete map[ranked.shift().key];
    }
    return map;
  }

  function readTab(tabId) {
    if (tabId == null || tabId < 0) {
      return Promise.resolve(null);
    }
    return readMap().then(function (map) {
      return map[String(tabId)] || null;
    });
  }

  function setTabBadge(tabId, on, record) {
    var ch = api();
    var action = ch && ch.action;
    var cue = cueFor(record && record.kind);
    if (!action || tabId == null) {
      return;
    }
    if (typeof action.setBadgeText === "function") {
      action.setBadgeText({ tabId: tabId, text: on ? COPY.badgeText : "" });
    }
    if (on && typeof action.setBadgeBackgroundColor === "function") {
      action.setBadgeBackgroundColor({ tabId: tabId, color: "#5c5247" });
    }
    if (on && typeof action.setBadgeTextColor === "function") {
      try {
        action.setBadgeTextColor({ tabId: tabId, color: "#fff8ec" });
      } catch (_err) {
        /* Chrome without badge text color */
      }
    }
    if (typeof action.setTitle === "function") {
      action.setTitle({ tabId: tabId, title: on ? cue.badgeTitle : ACTION_TITLE });
    }
  }

  function notificationId(tabId) {
    return NOTIFICATION_PREFIX + String(tabId);
  }

  function parseNotificationId(id) {
    var raw;
    if (!id || String(id).indexOf(NOTIFICATION_PREFIX) !== 0) {
      return null;
    }
    raw = String(id).slice(NOTIFICATION_PREFIX.length);
    if (!/^\d+$/.test(raw)) {
      return null;
    }
    return Number(raw);
  }

  function extensionUrl(rel) {
    var ch = api();
    if (ch && ch.runtime && typeof ch.runtime.getURL === "function") {
      return ch.runtime.getURL(rel);
    }
    return rel;
  }

  function iconUrl() {
    return extensionUrl("icons/icon128.png");
  }

  function showNotice(tabId, record) {
    var ch = api();
    var id = notificationId(tabId);
    var cue = cueFor(record && record.kind);
    return new Promise(function (resolve) {
      if (!ch || !ch.notifications || typeof ch.notifications.create !== "function") {
        resolve("badge");
        return;
      }
      try {
        ch.notifications.create(
          id,
          {
            type: "basic",
            iconUrl: iconUrl(),
            title: cue.notificationTitle,
            message: cue.notificationMessage,
            contextMessage: cue.notificationContext,
            priority: 0
          },
          function () {
            var err = ch.runtime && ch.runtime.lastError;
            resolve(err ? "badge" : "notification");
          }
        );
      } catch (_err) {
        resolve("badge");
      }
    });
  }

  function clearNotice(tabId) {
    var ch = api();
    if (!ch || !ch.notifications || typeof ch.notifications.clear !== "function") {
      return;
    }
    ch.notifications.clear(notificationId(tabId));
  }

  function openTab(url) {
    var ch = api();
    if (ch && ch.tabs && typeof ch.tabs.create === "function" && typeof url === "string" && url) {
      ch.tabs.create({ url: url });
      return true;
    }
    return false;
  }

  function openCoachFromGesture(tab) {
    var ch = api();
    var opts = {};
    if (!ch) {
      return Promise.resolve("none");
    }
    if (tab && tab.windowId != null) {
      opts.windowId = tab.windowId;
    }
    if (tab && tab.id != null) {
      opts.tabId = tab.id;
    }
    if (ch.sidePanel && typeof ch.sidePanel.open === "function" && (opts.windowId != null || opts.tabId != null)) {
      try {
        var opening = ch.sidePanel.open(opts);
        if (opening && typeof opening.then === "function") {
          return opening.then(
            function () {
              return "panel";
            },
            function () {
              openTab(extensionUrl("sidepanel/sidepanel.html"));
              return "tab";
            }
          );
        }
        return Promise.resolve("panel");
      } catch (_err) {
        openTab(extensionUrl("sidepanel/sidepanel.html"));
        return Promise.resolve("tab");
      }
    }
    openTab(extensionUrl("sidepanel/sidepanel.html"));
    return Promise.resolve("tab");
  }

  function shouldKeep(record, href) {
    var parsed;
    var host;
    var path;
    if (!record) {
      return false;
    }
    if (!href || isIgnorableUrl(href)) {
      return true;
    }
    parsed = parseUrl(href);
    if (!parsed || !isHttpUrl(parsed)) {
      return true;
    }
    host = parsed.hostname.toLowerCase();
    path = parsed.pathname || "/";
    if (host === record.host) {
      return true;
    }
    if (isIdpHost(host)) {
      return true;
    }
    if (record.kind === "device" && isDeviceLoginLocation(host, path)) {
      return true;
    }
    return false;
  }

  function rememberSnapshot(tabId, snap, opts) {
    var notify = !opts || opts.notify !== false;
    var now = (opts && opts.now) || Date.now();
    if (tabId == null || tabId < 0 || !snap || !snap.ok) {
      return Promise.resolve(null);
    }
    return readMap().then(function (map) {
      var key = String(tabId);
      var prev = map[key];
      var record = recordFromSnapshot(tabId, snap, prev && prev.fingerprint === snap.fingerprint ? prev.detectedAt : now);
      if (prev && prev.fingerprint === snap.fingerprint && prev.notified) {
        record.notified = true;
      }
      map[key] = record;
      capMap(map);
      return writeMap(map).then(function () {
        setTabBadge(tabId, true, record);
        if (!notify || record.notified) {
          return record;
        }
        record.notified = true;
        map[key] = record;
        return writeMap(map).then(function () {
          return showNotice(tabId, record).then(function () {
            return record;
          });
        });
      });
    });
  }

  function remember(tabId, href, opts) {
    var snap = snapshotFromUrl(href);
    if (!snap.ok) {
      return Promise.resolve(null);
    }
    return rememberSnapshot(tabId, snap, opts);
  }

  function forget(tabId) {
    if (tabId == null || tabId < 0) {
      return Promise.resolve(null);
    }
    return readMap().then(function (map) {
      var key = String(tabId);
      if (!map[key]) {
        setTabBadge(tabId, false);
        return null;
      }
      delete map[key];
      return writeMap(map).then(function () {
        setTabBadge(tabId, false);
        clearNotice(tabId);
        return null;
      });
    });
  }

  function moveTab(fromId, toId) {
    if (fromId == null || toId == null || fromId === toId) {
      return Promise.resolve(null);
    }
    return readMap().then(function (map) {
      var fromKey = String(fromId);
      var toKey = String(toId);
      var record = map[fromKey];
      if (!record) {
        return null;
      }
      delete map[fromKey];
      record.tabId = toId;
      map[toKey] = record;
      return writeMap(map).then(function () {
        setTabBadge(fromId, false);
        setTabBadge(toId, true, record);
        return record;
      });
    });
  }

  function onUrl(tabId, href, opts) {
    var snap;
    if (tabId == null || tabId < 0 || !href || isIgnorableUrl(href)) {
      return Promise.resolve(null);
    }
    snap = snapshotFromUrl(href);
    if (snap.ok) {
      return rememberSnapshot(tabId, snap, opts);
    }
    return readTab(tabId).then(function (hit) {
      if (!hit) {
        return null;
      }
      if (shouldKeep(hit, href)) {
        return hit;
      }
      return forget(tabId);
    });
  }

  function onNavDetails(details, opts) {
    if (!details || details.frameId !== 0) {
      return Promise.resolve(null);
    }
    return onUrl(details.tabId, details.url, opts);
  }

  function hydrateOpenTabs() {
    var ch = api();
    return readMap().then(function (map) {
      Object.keys(map).forEach(function (key) {
        var record = map[key];
        if (record && record.tabId != null) {
          setTabBadge(record.tabId, true, record);
        }
      });
      if (!ch || !ch.tabs || typeof ch.tabs.query !== "function") {
        return map;
      }
      return new Promise(function (resolve) {
        ch.tabs.query({}, function (tabs) {
          var list = Array.isArray(tabs) ? tabs : [];
          var chain = Promise.resolve();
          list.forEach(function (tab) {
            if (!tab || tab.id == null || !tab.url) {
              return;
            }
            chain = chain.then(function () {
              return onUrl(tab.id, tab.url, { notify: false });
            });
          });
          chain.then(
            function () {
              resolve(map);
            },
            function () {
              resolve(map);
            }
          );
        });
      });
    });
  }

  function onNotificationClicked(id) {
    var tabId = parseNotificationId(id);
    var ch = api();
    if (tabId == null) {
      return Promise.resolve(null);
    }
    clearNotice(tabId);
    if (!ch || !ch.tabs || typeof ch.tabs.get !== "function") {
      return openCoachFromGesture(null);
    }
    return new Promise(function (resolve) {
      ch.tabs.get(tabId, function (tab) {
        var err = ch.runtime && ch.runtime.lastError;
        if (err || !tab) {
          openCoachFromGesture(null).then(resolve);
          return;
        }
        if (typeof ch.tabs.update === "function") {
          ch.tabs.update(tabId, { active: true });
        }
        openCoachFromGesture(tab).then(resolve);
      });
    });
  }

  function attachWorker() {
    var ch = api();
    if (!ch) {
      return false;
    }
    if (ch.webNavigation && ch.webNavigation.onCommitted && typeof ch.webNavigation.onCommitted.addListener === "function") {
      ch.webNavigation.onCommitted.addListener(function (details) {
        onNavDetails(details);
      });
    }
    if (
      ch.webNavigation &&
      ch.webNavigation.onHistoryStateUpdated &&
      typeof ch.webNavigation.onHistoryStateUpdated.addListener === "function"
    ) {
      ch.webNavigation.onHistoryStateUpdated.addListener(function (details) {
        onNavDetails(details, { notify: false });
      });
    }
    if (ch.tabs && ch.tabs.onUpdated && typeof ch.tabs.onUpdated.addListener === "function") {
      ch.tabs.onUpdated.addListener(function (tabId, changeInfo) {
        if (!changeInfo || !changeInfo.url) {
          return;
        }
        onUrl(tabId, changeInfo.url);
      });
    }
    if (ch.tabs && ch.tabs.onRemoved && typeof ch.tabs.onRemoved.addListener === "function") {
      ch.tabs.onRemoved.addListener(function (tabId) {
        forget(tabId);
      });
    }
    if (ch.tabs && ch.tabs.onReplaced && typeof ch.tabs.onReplaced.addListener === "function") {
      ch.tabs.onReplaced.addListener(function (addedId, removedId) {
        moveTab(removedId, addedId);
      });
    }
    if (ch.notifications && ch.notifications.onClicked && typeof ch.notifications.onClicked.addListener === "function") {
      ch.notifications.onClicked.addListener(function (id) {
        onNotificationClicked(id);
      });
    }
    hydrateOpenTabs();
    return true;
  }

  root.SemblanceWatch = {
    STORAGE_KEY: STORAGE_KEY,
    NOTIFICATION_PREFIX: NOTIFICATION_PREFIX,
    COPY: COPY,
    DEVICE_NUDGE: DEVICE_NUDGE,
    cueFor: cueFor,
    snapshotFromUrl: snapshotFromUrl,
    isAuthorizeLocation: isAuthorizeLocation,
    isDeviceLoginLocation: isDeviceLoginLocation,
    hasSecretParam: hasSecretParam,
    readTab: readTab,
    remember: remember,
    forget: forget,
    moveTab: moveTab,
    onUrl: onUrl,
    onNavDetails: onNavDetails,
    openCoachFromGesture: openCoachFromGesture,
    onNotificationClicked: onNotificationClicked,
    attachWorker: attachWorker,
    parseNotificationId: parseNotificationId
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
