/* =========================================================================
   Pro / API waitlist — painted-door capture.
   Progressive enhancement: the section is readable without JS; this wires the
   tier pills, feature-vote chips, and the POST to /api/waitlist.
   ========================================================================= */
(function () {
  var root = document.getElementById("pro");
  if (!root) return;
  var form = root.querySelector(".pro-form");
  if (!form) return;

  var emailInput = form.querySelector('input[type="email"]');
  var tierPills = Array.prototype.slice.call(form.querySelectorAll("[data-tier]"));
  var chips = Array.prototype.slice.call(form.querySelectorAll("[data-feature]"));
  var msg = form.querySelector(".pro-msg");
  var submitBtn = form.querySelector('button[type="submit"]');
  var selectedTier = "pro";
  var LOCALE = (window.BARCODE_LOCALE || "en");

  // Localized string lookup (dicts live in i18n.js, already loaded in <head>).
  function t(key, fallback) {
    var ui = (window.I18N && window.I18N.ui) || {};
    var d = ui[LOCALE] || ui.en || {};
    if (d[key] != null) return d[key];
    if (ui.en && ui.en[key] != null) return ui.en[key];
    return fallback;
  }

  function setTier(t) {
    selectedTier = t;
    tierPills.forEach(function (p) {
      var on = p.getAttribute("data-tier") === t;
      p.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  tierPills.forEach(function (p) {
    p.addEventListener("click", function () { setTier(p.getAttribute("data-tier")); });
  });

  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
    });
  });

  // Card CTAs and locked-feature teasers (anywhere on the page) pre-select a
  // tier and bring the form into view.
  Array.prototype.slice.call(document.querySelectorAll("[data-notify]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTier(btn.getAttribute("data-notify"));
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      if (emailInput) setTimeout(function () { emailInput.focus(); }, 350);
    });
  });

  function show(kind, text) {
    if (!msg) return;
    msg.textContent = text;
    msg.setAttribute("data-kind", kind);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = (emailInput && emailInput.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      show("error", t("proMsgInvalidEmail", "Please enter a valid email address."));
      if (emailInput) emailInput.focus();
      return;
    }
    var features = chips
      .filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })
      .map(function (c) { return c.getAttribute("data-feature"); });

    var honeypot = form.querySelector('input[name="company"]');
    var payload = {
      email: email,
      tier: selectedTier,
      features: features,
      source: location.pathname,
      locale: LOCALE,
      company: honeypot ? honeypot.value : ""
    };

    submitBtn.disabled = true;
    show("pending", t("proMsgPending", "Adding you…"));

    fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok) {
          form.setAttribute("data-done", "true");
          show("success", t("proMsgSuccess", "You're on the list — we'll email you the moment it launches."));
        } else {
          submitBtn.disabled = false;
          show("error", t("proMsgError", "Something went wrong — please try again."));
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        show("error", t("proMsgNetwork", "Network error — please try again."));
      });
  });

  setTier("pro");
})();
