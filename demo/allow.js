(function () {
  "use strict";

  var aftermath = document.getElementById("aftermath");
  var allowBtn = document.getElementById("allow-btn");
  var denyBtn = document.getElementById("deny-btn");

  function showAftermath(fromDeny) {
    aftermath.hidden = false;
    if (fromDeny) {
      aftermath.querySelector("h1").textContent = "Deny is the right muscle.";
      aftermath.querySelector("p").textContent =
        "You left without granting mail, Drive, contacts, or a long leash. Open the Semblance popup anyway — Beat C is the coach you keep.";
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

  if (!window.SemblanceLadder) {
    allowBtn.addEventListener("click", function (event) {
      event.preventDefault();
      showAftermath(false);
    });
  }
})();
