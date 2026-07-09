/* =========================================================================
   Living Ink — progressive enhancement layer.
   Zero coupling to app.js internals. The site works fully without this file.
   - Fires the cobalt scan-line sweep each time the code re-renders.
   - Mirrors the #status validity into the hardware readout dot.
   - Keeps the human-readable plate caption in sync.
   - Wires the quick-pick chips to the existing symbology list (native links).
   Honors prefers-reduced-motion.

   NOTE: the #preview MutationObserver watches childList only (the barcode
   node is replaced on every render) and the sweep class is toggled on the
   *stage*, which is NOT observed — so there is no self-retriggering loop.
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var stage = document.querySelector(".preview-stage");
  var preview = document.getElementById("preview");
  var status = document.getElementById("status");
  var readout = document.getElementById("readout");
  var caption = document.getElementById("plateCaption");
  var dataEl = document.getElementById("data");

  /* ---- scan-line sweep on each render (toggles class on stage only) ---- */
  var sweepTimer = null;
  function triggerSweep() {
    if (reduce || !stage) return;
    var h = stage.getBoundingClientRect().height;
    if (h) stage.style.setProperty("--stage-h", h + "px");
    stage.classList.remove("scanning");
    void stage.offsetWidth; // reflow so the animation restarts
    stage.classList.add("scanning");
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(function () { stage.classList.remove("scanning"); }, 1300);
  }

  /* ---- readout state mirror (idle / ok / err) ---- */
  function syncReadout() {
    if (!readout || !status) return;
    var state = status.classList.contains("ok") ? "ok"
              : status.classList.contains("err") ? "err"
              : "idle";
    readout.setAttribute("data-state", state);
  }

  /* ---- human-readable caption under the plate ---- */
  function syncCaption() {
    if (!caption) return;
    var batch = preview && preview.classList.contains("barcode-batch");
    if (batch) { caption.textContent = ""; return; }
    var v = (dataEl && dataEl.value ? dataEl.value : "").replace(/\s+/g, " ").trim();
    if (v.length > 64) v = v.slice(0, 61) + "…";
    caption.textContent = v;
  }

  /* Observe the preview node for engine re-renders (childList only). */
  if (preview && "MutationObserver" in window) {
    var pObs = new MutationObserver(function () { triggerSweep(); syncCaption(); });
    pObs.observe(preview, { childList: true });
  }
  /* Observe #status class changes to drive the readout dot. */
  if (status && "MutationObserver" in window) {
    var sObs = new MutationObserver(syncReadout);
    sObs.observe(status, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---- quick-pick chips → reuse the real symbology links ---- */
  var chips = Array.prototype.slice.call(document.querySelectorAll(".qp[data-type]"));
  function findItem(type) {
    var esc = (window.CSS && CSS.escape) ? CSS.escape(type) : type;
    return document.querySelector('.type-item[data-id="' + esc + '"]');
  }
  function syncChips() {
    var active = document.querySelector(".type-item.active");
    var activeId = active ? active.getAttribute("data-id") : null;
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", c.getAttribute("data-type") === activeId ? "true" : "false");
    });
  }
  chips.forEach(function (chip) {
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", function () {
      if (chip.getAttribute("aria-pressed") === "true") return; // already active
      var item = findItem(chip.getAttribute("data-type"));
      if (item) item.click(); // reuses app.js's correct slug/href + in-place switch
    });
  });
  /* The symbology list is built by app.js after load; sync chip state when
     items appear or the active item changes (list class mutations). */
  var list = document.getElementById("typeList");
  if (list && "MutationObserver" in window) {
    var lObs = new MutationObserver(syncChips);
    lObs.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  window.addEventListener("load", function () { syncReadout(); syncCaption(); syncChips(); });
})();
