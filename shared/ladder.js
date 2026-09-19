(function (root) {
  "use strict";

  function decide(pageKey) {
    var store = root.SemblanceStore;
    if (!store || !store.available()) {
      return Promise.resolve({ action: "pause", gated: false, offline: true });
    }
    return store.isGateOpen().then(function (open) {
      if (open) {
        return { action: "pass", gated: false, offline: false };
      }
      return Promise.all([
        store.hasInterrupt(pageKey + ":pause"),
        store.hasInterrupt(pageKey + ":hard")
      ]).then(function (flags) {
        if (!flags[0]) {
          return { action: "pause", gated: true, offline: false };
        }
        if (!flags[1]) {
          return { action: "hard-stop", gated: true, offline: false };
        }
        return { action: "quiet", gated: true, offline: false };
      });
    });
  }

  function commit(pageKey, action) {
    var store = root.SemblanceStore;
    if (!store || !store.available()) {
      return Promise.resolve();
    }
    if (action === "pause") {
      return store.markInterrupt(pageKey + ":pause").then(function () {
        return store.logReason({
          level: "pause",
          reason: "scary-scope-allow"
        });
      });
    }
    if (action === "hard-stop") {
      return store.markInterrupt(pageKey + ":hard").then(function () {
        return store.logReason({
          level: "hard-stop",
          reason: "allow-without-gate"
        });
      });
    }
    return Promise.resolve();
  }

  root.SemblanceLadder = {
    decide: decide,
    commit: commit
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
