(function () {
  "use strict";

  var aftermath = document.getElementById("aftermath");
  var allowBtn = document.getElementById("allow-btn");
  var denyBtn = document.getElementById("deny-btn");

  document.querySelectorAll("[data-scope]").forEach(function (li) {
    var scope = window.SemblanceScopes && SemblanceScopes.findByRaw(li.getAttribute("data-scope"));
    var code = li.querySelector("code");
    var line = li.querySelector("p");
    if (!scope || !code || !line) {
      return;
    }
    code.textContent = scope.raw;
    line.textContent = scope.sentence;
  });

  function showAftermath(fromDeny) {
    aftermath.hidden = false;
    if (fromDeny) {
      aftermath.querySelector("h1").textContent = "Deny is the right muscle.";
      aftermath.querySelector("p").textContent =
        "You left without granting mail, Drive, contacts, or a long-lived grant. Open the Semblance side panel anyway — that coach is the part you keep.";
    }
    if (window.SemblanceStore && SemblanceStore.available()) {
      SemblanceStore.setDemoBeat("coach");
    }
    aftermath.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("semblance:unlocked-allow", function () {
    showAftermath(false);
  });

  denyBtn.addEventListener("click", function () {
    showAftermath(true);
  });

  allowBtn.addEventListener("click", function (event) {
    if (event.defaultPrevented) {
      return;
    }
    showAftermath(false);
  });
})();
