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
})();
