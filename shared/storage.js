(function (root) {
  "use strict";

  var KEYS = {
    friendWord: "friendWord",
    understoodAt: "understoodAt",
    friendOkAt: "friendOkAt",
    reasonLog: "reasonLog",
    interruptKeys: "interruptKeys",
    demoBeat: "demoBeat",
    revokeRemind: "revokeRemind"
  };

  var LOG_CAP = 40;

  function area(name) {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage[name]) {
      return null;
    }
    return chrome.storage[name];
  }

  function local() {
    return area("local");
  }

  function session() {
    return area("session");
  }

  function get(keys) {
    var store = local();
    if (!store) {
      return Promise.resolve({});
    }
    return new Promise(function (resolve) {
      store.get(keys, function (value) {
        resolve(value || {});
      });
    });
  }

  function set(partial) {
    var store = local();
    if (!store) {
      return Promise.resolve(false);
    }
    return new Promise(function (resolve) {
      store.set(partial, function () {
        resolve(true);
      });
    });
  }

  function sessionGet(keys) {
    var store = session();
    if (!store) {
      return Promise.resolve({});
    }
    return new Promise(function (resolve) {
      store.get(keys, function (value) {
        resolve(value || {});
      });
    });
  }

  function sessionSet(partial) {
    var store = session();
    if (!store) {
      return Promise.resolve(false);
    }
    return new Promise(function (resolve) {
      store.set(partial, function () {
        resolve(true);
      });
    });
  }

  function normalizeWord(word) {
    return String(word || "").trim().toLowerCase();
  }

  function logReason(entry) {
    return get([KEYS.reasonLog]).then(function (data) {
      var log = Array.isArray(data[KEYS.reasonLog]) ? data[KEYS.reasonLog].slice() : [];
      log.unshift({
        id: "r-" + Date.now().toString(36),
        at: Date.now(),
        level: entry.level,
        reason: entry.reason
      });
      if (log.length > LOG_CAP) {
        log = log.slice(0, LOG_CAP);
      }
      return set({ reasonLog: log }).then(function () {
        return log;
      });
    });
  }

  function hasInterrupt(key) {
    return get([KEYS.interruptKeys]).then(function (data) {
      var map = data[KEYS.interruptKeys] || {};
      return Boolean(map[key]);
    });
  }

  function markInterrupt(key) {
    return get([KEYS.interruptKeys]).then(function (data) {
      var map = Object.assign({}, data[KEYS.interruptKeys] || {});
      map[key] = Date.now();
      return set({ interruptKeys: map });
    });
  }

  function isGateOpen() {
    return Promise.all([
      get([KEYS.understoodAt, KEYS.friendOkAt]),
      sessionGet(["friendOk"])
    ]).then(function (pair) {
      var data = pair[0];
      var sess = pair[1];
      return Boolean(data[KEYS.understoodAt] || data[KEYS.friendOkAt] || sess.friendOk);
    });
  }

  function setFriendWord(word) {
    var clean = String(word || "").trim();
    if (!clean) {
      return Promise.all([
        set({ friendWord: "", friendOkAt: 0 }),
        sessionSet({ friendOk: false })
      ]).then(function () {
        return true;
      });
    }
    return set({ friendWord: clean });
  }

  function checkFriendWord(input) {
    return get([KEYS.friendWord]).then(function (data) {
      var saved = normalizeWord(data[KEYS.friendWord]);
      var attempt = normalizeWord(input);
      if (!saved || !attempt || saved !== attempt) {
        return false;
      }
      return Promise.all([
        set({ friendOkAt: Date.now() }),
        sessionSet({ friendOk: true })
      ]).then(function () {
        return true;
      });
    });
  }

  function setUnderstood() {
    return set({ understoodAt: Date.now() });
  }

  function setDemoBeat(beat) {
    return set({ demoBeat: beat });
  }

  function clearGate() {
    return Promise.all([
      set({ understoodAt: 0, friendOkAt: 0 }),
      sessionSet({ friendOk: false })
    ]);
  }

  root.SemblanceStore = {
    KEYS: KEYS,
    available: function () {
      return Boolean(local());
    },
    get: get,
    set: set,
    logReason: logReason,
    hasInterrupt: hasInterrupt,
    markInterrupt: markInterrupt,
    isGateOpen: isGateOpen,
    setFriendWord: setFriendWord,
    checkFriendWord: checkFriendWord,
    setUnderstood: setUnderstood,
    setDemoBeat: setDemoBeat,
    clearGate: clearGate
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
