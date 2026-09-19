(function () {
  "use strict";

  if (window.__semblanceCoachStarted) {
    return;
  }

  var path = (location.pathname || "").replace(/\\/g, "/");
  if (!/\/demo\/(allow|lure)\.html$/i.test(path)) {
    return;
  }

  window.__semblanceCoachStarted = true;

  var beat = /allow\.html$/i.test(path) ? "allow" : "lure";
  var pageKey = "demo-" + beat;

  function el(name, attrs, text) {
    var node = document.createElement(name);
    var key;
    attrs = attrs || {};
    for (key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    if (text) {
      node.textContent = text;
    }
    return node;
  }

  function mountChip(title, body) {
    if (document.querySelector(".semblance-chip")) {
      return;
    }
    var chip = el("aside", { class: "semblance-chip", role: "note" });
    chip.appendChild(el("strong", null, title));
    chip.appendChild(el("p", null, body));
    document.documentElement.appendChild(chip);
  }

  function closeSheet(sheet) {
    if (sheet && sheet.parentNode) {
      sheet.parentNode.removeChild(sheet);
    }
  }

  function mountSheet(kind) {
    if (document.querySelector(".semblance-sheet")) {
      return null;
    }
    var sheet = el("div", { class: "semblance-sheet", role: "dialog", "aria-modal": "true" });
    var card = el("div", { class: "semblance-card" });
    var title =
      kind === "hard-stop" ? "That Allow is the login." : "Pause. Read this before Allow.";
    var body =
      kind === "hard-stop"
        ? "MFA never ran. The click is the whole breach. A friend-word or an I-understand is required — this browser only, no ping."
        : "Scary scopes are written in adult jargon so they look normal. Semblance translates them. Confirm with the shared word, or say you understand.";

    card.appendChild(el("h2", null, title));
    card.appendChild(el("p", null, body));

    var label = el("label", { for: "semblance-word" }, "Shared word");
    var input = el("input", {
      id: "semblance-word",
      type: "text",
      autocomplete: "off",
      spellcheck: "false"
    });
    var actions = el("div", { class: "semblance-actions" });
    var verify = el("button", { type: "button" }, "Friend verify");
    var understand = el("button", { type: "button", class: "ghost" }, "I understand");
    var note = el("p", { class: "semblance-note" });

    function finish(okText) {
      note.textContent = okText;
      window.setTimeout(function () {
        closeSheet(sheet);
      }, 350);
    }

    verify.addEventListener("click", function () {
      if (!window.SemblanceStore || !SemblanceStore.available()) {
        note.textContent = "Load Semblance unpacked to store a shared word in this browser.";
        return;
      }
      SemblanceStore.checkFriendWord(input.value).then(function (ok) {
        if (!ok) {
          note.textContent = "No match. Set the word in the Semblance popup, together.";
          return;
        }
        finish("Friend word matches. The gate is open in this browser.");
      });
    });

    understand.addEventListener("click", function () {
      if (!window.SemblanceStore || !SemblanceStore.available()) {
        finish("Noted on this page. Pin Semblance to keep the gate.");
        return;
      }
      SemblanceStore.setUnderstood().then(function () {
        finish("Recorded. Allow would have been the breach.");
      });
    });

    actions.appendChild(verify);
    actions.appendChild(understand);
    card.appendChild(label);
    card.appendChild(input);
    card.appendChild(actions);
    card.appendChild(note);
    sheet.appendChild(card);
    document.documentElement.appendChild(sheet);
    input.focus();
    return sheet;
  }

  function bindAllow() {
    var allow = document.getElementById("allow-btn");
    if (!allow) {
      return;
    }
    allow.addEventListener(
      "click",
      function (event) {
        if (!window.SemblanceLadder) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        SemblanceLadder.decide(pageKey).then(function (decision) {
          if (decision.action === "pass") {
            document.dispatchEvent(new CustomEvent("semblance:unlocked-allow"));
            return;
          }
          if (decision.action === "pause" || decision.action === "hard-stop") {
            SemblanceLadder.commit(pageKey, decision.action);
            mountSheet(decision.action);
            return;
          }
          mountSheet("hard-stop");
        });
      },
      true
    );
  }

  if (window.SemblanceStore && SemblanceStore.available()) {
    SemblanceStore.setDemoBeat(beat);
  }

  if (beat === "lure") {
    mountChip(
      "Semblance · Beat A",
      "Scripted friend chat. The next click is the lesson — not a real login."
    );
  } else {
    mountChip(
      "Semblance · Beat B",
      "FAKE allow screen. Open the toolbar popup after you deal with the gate."
    );
    bindAllow();
    if (window.SemblanceLadder) {
      SemblanceLadder.decide(pageKey).then(function (decision) {
        if (decision.action === "pause") {
          SemblanceLadder.commit(pageKey, "pause");
          mountSheet("pause");
        }
      });
    }
  }
})();
