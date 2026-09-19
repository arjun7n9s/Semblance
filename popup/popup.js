(function () {
  "use strict";

  var REVOKE = {
    google: "https://myaccount.google.com/connections?filters=3,4",
    microsoft: "https://account.microsoft.com/privacy/app-access",
    microsoftWork: "https://myaccount.microsoft.com/consent"
  };

  function $(id) {
    return document.getElementById(id);
  }

  function extensionUrl(rel) {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(rel);
    }
    return new URL("../" + rel, window.location.href).href;
  }

  function openTab(url) {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: url });
      return;
    }
    window.open(url, "_blank", "noopener");
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
      var li = document.createElement("li");
      var raw = document.createElement("span");
      var sentence = document.createElement("span");
      li.className = "heat-" + scope.heat;
      raw.className = "raw";
      raw.textContent = scope.family + " · " + scope.raw;
      sentence.textContent = scope.sentence;
      li.appendChild(raw);
      li.appendChild(sentence);
      list.appendChild(li);
    });
  }

  function renderRitual(hits) {
    var list = $("ritual-hits");
    list.innerHTML = "";
    if (!hits.length) {
      list.innerHTML =
        '<li class="empty">No paste / localhost-auth ritual in that text. Still: do not paste codes for a stranger.</li>';
      return;
    }
    hits.forEach(function (hit) {
      var li = document.createElement("li");
      var raw = document.createElement("span");
      var sentence = document.createElement("span");
      raw.className = "raw heat-high";
      raw.textContent = hit.title;
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

  function refreshGate() {
    if (!SemblanceStore.available()) {
      $("gate-status").textContent = "Storage is unavailable in this window.";
      return;
    }
    SemblanceStore.get(["friendWord", "understoodAt", "reasonLog", "demoBeat"]).then(function (data) {
      if (data.friendWord) {
        $("friend-word").value = data.friendWord;
      }
      SemblanceStore.isGateOpen().then(function (open) {
        if (open && data.understoodAt) {
          $("gate-status").textContent = "Gate open: I understand is on file in this browser.";
        } else if (open) {
          $("gate-status").textContent = "Gate open: friend word checked this session.";
        } else if (data.friendWord) {
          $("gate-status").textContent = "Shared word saved. It never leaves this browser.";
        } else {
          $("gate-status").textContent = "No gate yet. Save a word or tap I understand.";
        }
      });
      if (data.demoBeat === "allow" || data.demoBeat === "coach") {
        $("beat-c").hidden = false;
        $("lede").textContent =
          "Beat C. You already saw the fake Allow. The coach below is the part worth keeping installed.";
      }
      renderLog(data.reasonLog || []);
    });
  }

  $("scope-query").addEventListener("input", function (event) {
    renderScopes(event.target.value);
  });

  $("save-word").addEventListener("click", function () {
    SemblanceStore.setFriendWord($("friend-word").value).then(function () {
      $("gate-status").textContent = $("friend-word").value.trim()
        ? "Shared word saved locally."
        : "Shared word cleared.";
    });
  });

  $("understand").addEventListener("click", function () {
    SemblanceStore.setUnderstood().then(function () {
      SemblanceStore.setDemoBeat("coach");
      refreshGate();
    });
  });

  $("ritual-check").addEventListener("click", function () {
    var text = $("ritual-input").value;
    renderRitual(SemblanceRituals.inspect(text));
    $("ritual-input").value = "";
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
  $("open-lure").addEventListener("click", function () {
    SemblanceStore.setDemoBeat("lure");
    openTab(extensionUrl("demo/lure.html"));
  });
  $("open-allow").addEventListener("click", function () {
    SemblanceStore.setDemoBeat("allow");
    openTab(extensionUrl("demo/allow.html"));
  });

  renderScopes("");
  refreshGate();
})();
