(function () {
  "use strict";

  var REVOKE = SemblanceRemind.REVOKE;

  function $(id) {
    return document.getElementById(id);
  }

  function openTab(url) {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: url });
      return;
    }
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "semblance:open", url: url });
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function appendScopeRow(list, scope, token) {
    var li = document.createElement("li");
    var meta = document.createElement("span");
    var raw = document.createElement("code");
    var sentence = document.createElement("span");
    li.className = "scope heat-" + scope.heat;
    meta.className = "meta";
    meta.textContent = scope.family + " · " + scope.heat;
    raw.className = "raw";
    raw.textContent = token || scope.raw;
    sentence.className = "sentence";
    sentence.textContent = scope.sentence;
    li.appendChild(meta);
    li.appendChild(raw);
    li.appendChild(sentence);
    list.appendChild(li);
  }

  function renderScopes(query) {
    var list = $("scope-list");
    var rows = SemblanceScopes.filter(query);
    list.innerHTML = "";
    if (!rows.length) {
      list.innerHTML = '<li class="empty">No scope matches that search.</li>';
      return;
    }
    rows.forEach(function (scope) {
      appendScopeRow(list, scope);
    });
  }

  function renderDecoded(result) {
    var list = $("scope-decoded");
    var status = $("scope-decode-status");
    var unknownBit;
    list.innerHTML = "";
    if (!result.ok) {
      list.hidden = true;
      if (result.reason === "empty") {
        status.textContent = "Paste an Allow URL or a scope= query first. Nothing was stored.";
        return;
      }
      if (result.reason === "empty-scope") {
        status.textContent = "That paste has an empty scope=. Nothing to translate. Nothing was stored.";
        return;
      }
      status.textContent =
        "No scope= in that paste. Semblance does not score links. Paste an Allow URL or a scope list.";
      return;
    }
    list.hidden = false;
    unknownBit =
      result.unknown === 0
        ? "None unknown."
        : result.unknown === 1
          ? "1 unknown."
          : result.unknown + " unknown.";
    status.textContent =
      result.items.length +
      (result.items.length === 1 ? " scope from that paste. " : " scopes from that paste. ") +
      unknownBit +
      " Nothing was stored. This is not a link score.";
    result.items.forEach(function (scope) {
      appendScopeRow(list, scope, scope.token);
    });
  }

  function renderRitual(hits) {
    var list = $("ritual-hits");
    var status = $("ritual-status");
    list.innerHTML = "";
    if (!hits.length) {
      status.textContent = "No paste / localhost-auth ritual in that text. Nothing was stored.";
      list.innerHTML =
        '<li class="empty">Still: do not paste codes for a stranger. The box above is unchanged.</li>';
      return;
    }
    status.textContent =
      hits.length === 1
        ? "1 ritual in that paste. Nothing was stored."
        : hits.length + " rituals in that paste. Nothing was stored.";
    hits.forEach(function (hit) {
      var li = document.createElement("li");
      var raw = document.createElement("span");
      var sentence = document.createElement("span");
      li.className = "hit";
      raw.className = "raw heat-high";
      raw.textContent = hit.title;
      sentence.className = "sentence";
      sentence.textContent = hit.sentence;
      li.appendChild(raw);
      li.appendChild(sentence);
      list.appendChild(li);
    });
  }

  function renderLog(entries) {
    var list = $("reason-log");
    list.innerHTML = "";
    if (!entries || !entries.length) {
      list.innerHTML = '<li class="empty">No interrupts yet.</li>';
      return;
    }
    entries.slice(0, 8).forEach(function (entry) {
      var li = document.createElement("li");
      var raw = document.createElement("span");
      var reason = document.createElement("span");
      raw.className = "raw";
      raw.textContent = entry.level + " · " + new Date(entry.at).toLocaleString();
      reason.textContent = entry.reason;
      li.appendChild(raw);
      li.appendChild(reason);
      list.appendChild(li);
    });
  }

  function refreshRemind() {
    var status = $("remind-status");
    var when = $("remind-when");
    var onBtn = $("remind-on");
    var offBtn = $("remind-off");
    if (!status || !SemblanceRemind) {
      return;
    }
    if (!SemblanceStore.available()) {
      status.textContent = "Storage is unavailable in this window.";
      return;
    }
    SemblanceRemind.read().then(function (state) {
      if (state.on && state.choice && when) {
        when.value = state.choice;
      }
      if (onBtn) {
        onBtn.textContent = state.on ? SemblanceRemind.COPY.scheduleReplace : SemblanceRemind.COPY.scheduleIdle;
      }
      if (offBtn) {
        offBtn.disabled = !state.on && !state.cue && !state.firedAt;
      }
      status.textContent = SemblanceRemind.statusText(state);
      if (state.cue || state.focusCoach) {
        var section = $("revoke-checkin");
        if (section && typeof section.scrollIntoView === "function") {
          section.scrollIntoView({ block: "nearest" });
        }
        SemblanceRemind.acknowledgeCue();
      }
      SemblanceRemind.ensureAlarm();
    });
  }

  function refreshGate() {
    if (!SemblanceStore.available()) {
      $("gate-status").textContent = "Storage is unavailable in this window.";
      return;
    }
    SemblanceStore.get(["friendWord", "understoodAt", "friendOkAt", "reasonLog", "demoBeat"]).then(
      function (data) {
        if (data.friendWord) {
          $("friend-word").value = data.friendWord;
        } else {
          $("friend-word").value = "";
        }
        SemblanceStore.isGateOpen().then(function (open) {
          if (open && data.understoodAt) {
            $("gate-status").textContent = "Noted in this browser: you owned the click.";
          } else if (open) {
            $("gate-status").textContent = "Friend word verified in this browser.";
          } else if (data.friendWord) {
            $("gate-status").textContent =
              "Shared word saved locally. Type it below to verify before you click Allow.";
          } else {
            $("gate-status").textContent = "No pause on file yet. Save a word or tap I understand.";
          }
        });
        if (data.demoBeat === "allow" || data.demoBeat === "coach") {
          $("beat-c").hidden = false;
          $("lede").textContent =
            "You already saw the fake Allow. The coach below is the part worth keeping installed.";
        }
        renderLog(data.reasonLog || []);
      }
    );
  }

  $("scope-query").addEventListener("input", function (event) {
    renderScopes(event.target.value);
  });

  $("scope-decode").addEventListener("click", function () {
    renderDecoded(SemblanceScopes.decode($("scope-decode-input").value));
  });

  $("scope-decode-input").addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      $("scope-decode").click();
    }
  });

  $("save-word").addEventListener("click", function () {
    SemblanceStore.setFriendWord($("friend-word").value).then(function () {
      refreshGate();
    });
  });

  $("friend-word").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      $("save-word").click();
    }
  });

  $("check-word").addEventListener("click", function () {
    var attempt = $("friend-check").value;
    if (!SemblanceStore.available()) {
      $("gate-status").textContent = "Storage is unavailable in this window.";
      return;
    }
    SemblanceStore.get(["friendWord"]).then(function (data) {
      if (!data.friendWord) {
        $("gate-status").textContent = "Save a shared word first. Nothing was sent.";
        return;
      }
      SemblanceStore.checkFriendWord(attempt).then(function (ok) {
        if (!ok) {
          $("gate-status").textContent =
            "No match. The word stays in this browser only — nothing was sent.";
          return;
        }
        $("friend-check").value = "";
        refreshGate();
      });
    });
  });

  $("friend-check").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      $("check-word").click();
    }
  });

  $("understand").addEventListener("click", function () {
    SemblanceStore.setUnderstood().then(function () {
      refreshGate();
    });
  });

  $("ritual-check").addEventListener("click", function () {
    var text = $("ritual-input").value;
    if (!String(text || "").trim()) {
      $("ritual-status").textContent = "Paste a URL or a line first. Nothing was stored.";
      $("ritual-hits").innerHTML = "";
      return;
    }
    renderRitual(SemblanceRituals.inspect(text));
  });

  $("revoke-google").addEventListener("click", function () {
    openTab(REVOKE.google);
  });
  $("revoke-microsoft").addEventListener("click", function () {
    openTab(REVOKE.microsoft);
  });
  $("revoke-microsoft-work").addEventListener("click", function () {
    openTab(REVOKE.microsoftWork);
  });

  $("remind-on").addEventListener("click", function () {
    var choice = $("remind-when").value;
    SemblanceRemind.schedule(choice).then(function (state) {
      if (!state) {
        $("remind-status").textContent = "Pick a time first. Nothing was scheduled.";
        return;
      }
      refreshRemind();
    });
  });

  $("remind-off").addEventListener("click", function () {
    SemblanceRemind.cancel().then(function () {
      refreshRemind();
    });
  });

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (_changes, area) {
      if (area === "local" || area === "session") {
        refreshGate();
        if (area === "local") {
          refreshRemind();
        }
      }
    });
  }

  renderScopes("");
  refreshGate();
  refreshRemind();
})();
