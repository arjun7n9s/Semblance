(function (root) {
  "use strict";

  var ALARM_NAME = "semblance-revoke-checkin";
  var NOTIFICATION_ID = "semblance-revoke-checkin";
  var STORAGE_KEY = "revokeRemind";
  var ACTION_TITLE = "Semblance";

  var REVOKE = {
    google: "https://myaccount.google.com/connections?filters=3,4",
    microsoft: "https://account.microsoft.com/privacy/app-access",
    microsoftWork: "https://myaccount.microsoft.com/consent"
  };

  var OPTIONS = [
    { id: "1min", label: "1 minute", delayMs: 60 * 1000 },
    { id: "1hour", label: "1 hour", delayMs: 60 * 60 * 1000 },
    { id: "1day", label: "1 day", delayMs: 24 * 60 * 60 * 1000 },
    { id: "7days", label: "7 days", delayMs: 7 * 24 * 60 * 60 * 1000 }
  ];

  var COPY = {
    lede:
      "Optional. Default off. A local timer that nudges you to open the official connected-apps pages. Reminder only. Semblance does not watch your accounts, scan grants, or ping anyone.",
    offStatus: "Off. No reminder is scheduled. Semblance is not watching your accounts.",
    canceledStatus: "Reminder turned off. The timer is cleared. Semblance is not monitoring anything.",
    firedStatus:
      "Your reminder fired. Semblance did not scan your accounts. This was a check-in you asked for — not live monitoring. Use the official pages above.",
    notificationTitle: "Revoke check-in you asked for",
    notificationMessage:
      "Semblance is not watching your accounts. This is not live monitoring. Open the coach to visit official Google or Microsoft connected-apps pages.",
    notificationContext: "Reminder only. Not an account scan.",
    notificationGoogle: "Open Google connected apps",
    notificationMicrosoft: "Open Microsoft app access",
    badgeText: "!",
    badgeTitle: "Revoke check-in you asked for — not monitoring",
    popupFired: "Your revoke check-in fired. Open the coach — this was a reminder you asked for, not monitoring.",
    scheduleIdle: "Schedule this reminder",
    scheduleReplace: "Replace with this reminder",
    turnOff: "Turn off"
  };

  function api() {
    return typeof chrome !== "undefined" ? chrome : null;
  }

  function findOption(id) {
    var i;
    for (i = 0; i < OPTIONS.length; i += 1) {
      if (OPTIONS[i].id === id) {
        return OPTIONS[i];
      }
    }
    return null;
  }

  function emptyState() {
    return {
      on: false,
      choice: "",
      scheduledAt: 0,
      fireAt: 0,
      firedAt: 0,
      canceledAt: 0,
      cue: false,
      focusCoach: false
    };
  }

  function asNumber(value) {
    var n = Number(value);
    return n > 0 && isFinite(n) ? n : 0;
  }

  function normalize(raw) {
    var state = emptyState();
    if (!raw || typeof raw !== "object") {
      return state;
    }
    state.on = raw.on === true;
    state.choice = typeof raw.choice === "string" && findOption(raw.choice) ? raw.choice : "";
    state.scheduledAt = asNumber(raw.scheduledAt);
    state.fireAt = asNumber(raw.fireAt);
    state.firedAt = asNumber(raw.firedAt);
    state.canceledAt = asNumber(raw.canceledAt);
    state.cue = raw.cue === true;
    state.focusCoach = raw.focusCoach === true;
    if (state.on && !state.fireAt) {
      state.on = false;
    }
    return state;
  }

  function buildRecord(choiceId, now) {
    var option = findOption(choiceId);
    if (!option) {
      return null;
    }
    now = asNumber(now) || Date.now();
    return {
      on: true,
      choice: option.id,
      scheduledAt: now,
      fireAt: now + option.delayMs,
      firedAt: 0,
      canceledAt: 0,
      cue: false,
      focusCoach: false
    };
  }

  function scheduledStatus(when, option) {
    var label = option && option.label ? option.label : "a set time";
    return (
      "Reminder set for " +
      new Date(when).toLocaleString() +
      " (" +
      label +
      "). A timer you asked for — not live monitoring, not an account scan."
    );
  }

  function statusText(state) {
    var current = normalize(state);
    var option;
    if (current.on && current.fireAt) {
      option = findOption(current.choice);
      return scheduledStatus(current.fireAt, option);
    }
    if (current.firedAt) {
      return COPY.firedStatus;
    }
    if (current.canceledAt) {
      return COPY.canceledStatus;
    }
    return COPY.offStatus;
  }

  function read() {
    if (!root.SemblanceStore) {
      return Promise.resolve(emptyState());
    }
    return root.SemblanceStore.get([STORAGE_KEY]).then(function (data) {
      return normalize(data[STORAGE_KEY]);
    });
  }

  function write(state) {
    var saved = normalize(state);
    var patch = {};
    if (!root.SemblanceStore) {
      return Promise.resolve(saved);
    }
    patch[STORAGE_KEY] = saved;
    return root.SemblanceStore.set(patch).then(function () {
      return saved;
    });
  }

  function createAlarm(when) {
    var ch = api();
    return new Promise(function (resolve) {
      if (!ch || !ch.alarms || typeof ch.alarms.create !== "function" || !when) {
        resolve(false);
        return;
      }
      ch.alarms.create(ALARM_NAME, { when: when });
      resolve(true);
    });
  }

  function getAlarm() {
    var ch = api();
    return new Promise(function (resolve) {
      if (!ch || !ch.alarms || typeof ch.alarms.get !== "function") {
        resolve(null);
        return;
      }
      ch.alarms.get(ALARM_NAME, function (alarm) {
        resolve(alarm || null);
      });
    });
  }

  function clearAlarm() {
    var ch = api();
    return new Promise(function (resolve) {
      if (!ch || !ch.alarms || typeof ch.alarms.clear !== "function") {
        resolve(false);
        return;
      }
      ch.alarms.clear(ALARM_NAME, function (wasCleared) {
        resolve(Boolean(wasCleared));
      });
    });
  }

  function setBadge(on) {
    var ch = api();
    var action = ch && ch.action;
    if (!action) {
      return;
    }
    if (typeof action.setBadgeText === "function") {
      action.setBadgeText({ text: on ? COPY.badgeText : "" });
    }
    if (on && typeof action.setBadgeBackgroundColor === "function") {
      action.setBadgeBackgroundColor({ color: "#5c5247" });
    }
    if (on && typeof action.setBadgeTextColor === "function") {
      try {
        action.setBadgeTextColor({ color: "#fff8ec" });
      } catch (_err) {
        /* Chrome without badge text color */
      }
    }
    if (typeof action.setTitle === "function") {
      action.setTitle({ title: on ? COPY.badgeTitle : ACTION_TITLE });
    }
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

  function notificationOptions(withButtons) {
    var opts = {
      type: "basic",
      iconUrl: iconUrl(),
      title: COPY.notificationTitle,
      message: COPY.notificationMessage,
      contextMessage: COPY.notificationContext,
      priority: 0
    };
    if (withButtons) {
      opts.buttons = [{ title: COPY.notificationGoogle }, { title: COPY.notificationMicrosoft }];
    }
    return opts;
  }

  function clearNotification() {
    var ch = api();
    if (!ch || !ch.notifications || typeof ch.notifications.clear !== "function") {
      return;
    }
    ch.notifications.clear(NOTIFICATION_ID);
  }

  function showCue() {
    var ch = api();
    setBadge(true);
    return new Promise(function (resolve) {
      if (!ch || !ch.notifications || typeof ch.notifications.create !== "function") {
        resolve("badge");
        return;
      }
      function finish(via) {
        var err = ch.runtime && ch.runtime.lastError;
        resolve(err ? "badge" : via);
      }
      try {
        ch.notifications.create(NOTIFICATION_ID, notificationOptions(true), function () {
          var err = ch.runtime && ch.runtime.lastError;
          if (err) {
            ch.notifications.create(NOTIFICATION_ID, notificationOptions(false), function () {
              finish("notification");
            });
            return;
          }
          finish("notification");
        });
      } catch (_err) {
        try {
          ch.notifications.create(NOTIFICATION_ID, notificationOptions(false), function () {
            finish("notification");
          });
        } catch (_err2) {
          resolve("badge");
        }
      }
    });
  }

  function openTab(url) {
    var ch = api();
    if (ch && ch.tabs && typeof ch.tabs.create === "function" && typeof url === "string" && url) {
      ch.tabs.create({ url: url });
      return true;
    }
    return false;
  }

  function openCoach() {
    var ch = api();
    return read().then(function (state) {
      state.focusCoach = true;
      return write(state).then(function () {
        if (!ch) {
          return "none";
        }
        if (ch.windows && typeof ch.windows.getLastFocused === "function" && ch.sidePanel && typeof ch.sidePanel.open === "function") {
          ch.windows.getLastFocused({ windowTypes: ["normal"] }, function (win) {
            if (!win || win.id == null) {
              openTab(extensionUrl("sidepanel/sidepanel.html"));
              return;
            }
            var opening = ch.sidePanel.open({ windowId: win.id });
            if (opening && typeof opening.then === "function") {
              opening.then(
                function () {},
                function () {
                  openTab(extensionUrl("sidepanel/sidepanel.html"));
                }
              );
            }
          });
          return "panel";
        }
        if (ch.runtime && typeof ch.runtime.getURL === "function") {
          openTab(extensionUrl("sidepanel/sidepanel.html"));
          return "tab";
        }
        return "none";
      });
    });
  }

  function clearCueVisuals() {
    setBadge(false);
    clearNotification();
  }

  function schedule(choiceId, now) {
    var record = buildRecord(choiceId, now);
    if (!record) {
      return Promise.resolve(null);
    }
    clearCueVisuals();
    return clearAlarm().then(function () {
      return write(record).then(function (saved) {
        return createAlarm(saved.fireAt).then(function () {
          return saved;
        });
      });
    });
  }

  function cancel(now) {
    now = asNumber(now) || Date.now();
    clearCueVisuals();
    return clearAlarm().then(function () {
      return write({
        on: false,
        choice: "",
        scheduledAt: 0,
        fireAt: 0,
        firedAt: 0,
        canceledAt: now,
        cue: false,
        focusCoach: false
      });
    });
  }

  function acknowledgeCue() {
    return read().then(function (state) {
      if (!state.cue && !state.focusCoach) {
        clearCueVisuals();
        return state;
      }
      state.cue = false;
      state.focusCoach = false;
      clearCueVisuals();
      return write(state);
    });
  }

  function clearFocus() {
    return read().then(function (state) {
      if (!state.focusCoach) {
        return state;
      }
      state.focusCoach = false;
      return write(state);
    });
  }

  function ensureAlarm() {
    return read().then(function (state) {
      if (!state.on || !state.fireAt || state.fireAt <= Date.now()) {
        return state;
      }
      return getAlarm().then(function (alarm) {
        if (alarm) {
          return state;
        }
        return createAlarm(state.fireAt).then(function () {
          return state;
        });
      });
    });
  }

  function onAlarm(alarm) {
    if (!alarm || alarm.name !== ALARM_NAME) {
      return Promise.resolve(null);
    }
    return read().then(function (state) {
      if (!state.on) {
        return null;
      }
      state.on = false;
      state.firedAt = Date.now();
      state.cue = true;
      state.focusCoach = true;
      return write(state).then(function () {
        return showCue().then(function () {
          return state;
        });
      });
    });
  }

  function onNotificationClicked(id) {
    if (id !== NOTIFICATION_ID) {
      return Promise.resolve(null);
    }
    return acknowledgeCue().then(function () {
      return openCoach();
    });
  }

  function onNotificationButton(id, index) {
    if (id !== NOTIFICATION_ID) {
      return Promise.resolve(null);
    }
    return acknowledgeCue().then(function () {
      openTab(index === 1 ? REVOKE.microsoft : REVOKE.google);
      return index === 1 ? "microsoft" : "google";
    });
  }

  function attachWorker() {
    var ch = api();
    if (!ch || !ch.alarms || !ch.alarms.onAlarm || typeof ch.alarms.onAlarm.addListener !== "function") {
      return false;
    }
    ch.alarms.onAlarm.addListener(function (alarm) {
      onAlarm(alarm);
    });
    if (ch.notifications && ch.notifications.onClicked && typeof ch.notifications.onClicked.addListener === "function") {
      ch.notifications.onClicked.addListener(function (id) {
        onNotificationClicked(id);
      });
    }
    if (
      ch.notifications &&
      ch.notifications.onButtonClicked &&
      typeof ch.notifications.onButtonClicked.addListener === "function"
    ) {
      ch.notifications.onButtonClicked.addListener(function (id, index) {
        onNotificationButton(id, index);
      });
    }
    return true;
  }

  root.SemblanceRemind = {
    ALARM_NAME: ALARM_NAME,
    NOTIFICATION_ID: NOTIFICATION_ID,
    STORAGE_KEY: STORAGE_KEY,
    REVOKE: REVOKE,
    OPTIONS: OPTIONS,
    COPY: COPY,
    emptyState: emptyState,
    normalize: normalize,
    findOption: findOption,
    buildRecord: buildRecord,
    statusText: statusText,
    read: read,
    schedule: schedule,
    cancel: cancel,
    acknowledgeCue: acknowledgeCue,
    clearFocus: clearFocus,
    ensureAlarm: ensureAlarm,
    onAlarm: onAlarm,
    onNotificationClicked: onNotificationClicked,
    onNotificationButton: onNotificationButton,
    attachWorker: attachWorker,
    openCoach: openCoach
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
