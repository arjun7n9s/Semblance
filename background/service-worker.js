importScripts(
  "../shared/scopes.js",
  "../shared/rituals.js",
  "../shared/storage.js",
  "../shared/ladder.js"
);

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.get(["reasonLog", "interruptKeys", "demoBeat"], function (data) {
    var patch = {};
    if (!Array.isArray(data.reasonLog)) {
      patch.reasonLog = [];
    }
    if (!data.interruptKeys || typeof data.interruptKeys !== "object") {
      patch.interruptKeys = {};
    }
    if (!data.demoBeat) {
      patch.demoBeat = "idle";
    }
    if (Object.keys(patch).length) {
      chrome.storage.local.set(patch);
    }
  });
});

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "semblance:open") {
    chrome.tabs.create({ url: message.url });
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === "semblance:inspect") {
    sendResponse({ hits: SemblanceRituals.inspect(message.text || "") });
    return false;
  }

  if (message.type === "semblance:scopes") {
    sendResponse({ scopes: SemblanceScopes.all });
    return false;
  }

  return false;
});
