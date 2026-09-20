(function () {
  "use strict";

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
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "semblance:open", url: url });
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function openCoachTab() {
    openTab(extensionUrl("sidepanel/sidepanel.html"));
  }

  function canOpenSidePanel() {
    return typeof chrome !== "undefined" && chrome.sidePanel && typeof chrome.sidePanel.open === "function";
  }

  var panelWindowId = null;
  var openPanelBtn = $("open-panel");
  var panelStatus = $("panel-status");

  if (canOpenSidePanel() && chrome.windows && chrome.windows.getCurrent) {
    openPanelBtn.disabled = true;
    chrome.windows.getCurrent(function (win) {
      if (win && win.id != null) {
        panelWindowId = win.id;
      }
      openPanelBtn.disabled = false;
    });
  }

  openPanelBtn.addEventListener("click", function () {
    if (canOpenSidePanel() && panelWindowId != null) {
      // sidePanel.open must run in this click, not inside getCurrent().
      var opening = chrome.sidePanel.open({ windowId: panelWindowId });
      if (opening && typeof opening.then === "function") {
        opening.then(function () {}, function () {
          panelStatus.textContent = "Opened the coach in a tab instead.";
          openCoachTab();
        });
      }
      return;
    }
    panelStatus.textContent = "This Chrome has no side panel. The coach opened in a tab.";
    openCoachTab();
  });

  $("open-lure").addEventListener("click", function () {
    SemblanceStore.setDemoBeat("lure");
    openTab(extensionUrl("demo/lure.html"));
  });
  $("open-allow").addEventListener("click", function () {
    SemblanceStore.setDemoBeat("allow");
    openTab(extensionUrl("demo/allow.html"));
  });

  function appendLiveRow(list, item) {
    var li = document.createElement("li");
    var raw = document.createElement("code");
    var sentence = document.createElement("span");
    li.className = "scope heat-" + (item.heat || "unknown");
    raw.className = "raw";
    raw.textContent = item.token || item.raw || item.title || "";
    sentence.className = "sentence";
    sentence.textContent = item.sentence || "";
    li.appendChild(raw);
    li.appendChild(sentence);
    list.appendChild(li);
  }

  function renderLive(hit) {
    var box = $("live-hit");
    var kicker = $("live-kicker");
    var lead = $("live-lead");
    var list = $("live-list");
    var status = $("live-status");
    var cue;
    if (!box || !list) {
      return;
    }
    list.innerHTML = "";
    if (!hit) {
      box.hidden = true;
      return;
    }
    cue = typeof SemblanceWatch !== "undefined" && SemblanceWatch.cueFor ? SemblanceWatch.cueFor(hit.kind) : null;
    box.hidden = false;
    if (hit.kind === "device") {
      kicker.textContent = "This tab is a device-login door";
      lead.textContent = cue ? cue.popupLead : SemblanceWatch.COPY.popupLeadDevice;
      if (hit.nudge) {
        appendLiveRow(list, hit.nudge);
      }
      status.textContent = "Address bar only. Paste a code below in the coach if a chat sent one. " + SemblanceWatch.COPY.notAScore;
      return;
    }
    kicker.textContent = "This tab is asking for Allow";
    lead.textContent = cue ? cue.popupLead : SemblanceWatch.COPY.popupLead;
    (hit.items || []).forEach(function (item) {
      appendLiveRow(list, item);
    });
    status.textContent =
      (hit.items && hit.items.length ? hit.items.length + " scope" + (hit.items.length === 1 ? "" : "s") : "Scopes") +
      " from this tab. Nothing from the page. " +
      SemblanceWatch.COPY.notAScore;
  }

  function queryActiveTab() {
    return new Promise(function (resolve) {
      if (typeof chrome === "undefined" || !chrome.tabs || typeof chrome.tabs.query !== "function") {
        resolve(null);
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        resolve((tabs && tabs[0]) || null);
      });
    });
  }

  function refreshLive() {
    if (typeof SemblanceWatch === "undefined" || !SemblanceWatch.readTab) {
      return;
    }
    queryActiveTab().then(function (tab) {
      if (!tab || tab.id == null) {
        renderLive(null);
        return;
      }
      SemblanceWatch.readTab(tab.id).then(function (hit) {
        if (hit) {
          renderLive(hit);
          return;
        }
        if (tab.url) {
          SemblanceWatch.onUrl(tab.id, tab.url, { notify: false }).then(function (saved) {
            renderLive(saved || null);
          });
          return;
        }
        renderLive(null);
      });
    });
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (_changes, area) {
      if (area === "session") {
        refreshLive();
      }
    });
  }

  refreshLive();

  if (typeof SemblanceRemind !== "undefined" && SemblanceRemind.read) {
    SemblanceRemind.read().then(function (state) {
      var cue = $("remind-cue");
      if (!cue || !(state.cue || (state.firedAt && !state.on))) {
        return;
      }
      cue.hidden = false;
      cue.textContent = SemblanceRemind.COPY.popupFired;
    });
  }
})();
