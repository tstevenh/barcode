# Living Ink — Barcode Mint homepage redesign

**Date:** 2026-07-07 · **Scope:** Phase 1 = homepage (`index.html`) only. Phase 2 (later, on approval of the live result) = port to `templates/app-shell.html` + rebuild all 106 pages × 6 languages.

## Goal
Make the site stop reading as generic AI-SaaS while keeping every bit of functionality. Target user (per `PRODUCT.md`): non-technical small-business / retail / warehouse operator, on a deadline, who must **trust the code will scan**. So the redesign promotes exactly that value: *make a provably-scannable code, immediately.*

## Concept: "Living Ink"
The barcode is a living specimen that draws itself and proves it scans.

- **The tool is the hero**, not a marketing hero above it. You land able to make a code.
- **The Specimen plate**: the live code sits on an oversized paper plate framed with registration crop-marks + a mm ruler, like a press proof. On every valid render it (a) draws in via a wipe and (b) a single **cobalt scan-line sweeps across once** → lands on a hardware-style readout (`● SCANNABLE · CODE 128 · 13 chars`). The scan-line is the identity, echoed as a thin cobalt rule under section headers.
- **Character = type-foundry specimen sheet / lab print**, not a dashboard. Oversized display type; all labels/data/specs/readouts in mechanical monospace on hairline rules + tick-marks. The card / pill / soft-shadow SaaS vocabulary is removed and replaced with ruled "plates," crop-marks, rulers.
- **Type:** Bricolage Grotesque (display + body) + IBM Plex Mono (spec/labels/readouts). Google Fonts, `font-display:swap`, system fallback.
- **Palette:** true-neutral paper, near-black ink, one **cobalt** spot color used ONLY for live/verified/scan/focus — never decoration. Not beige, not gradient. (Honors brand anti-references.)

## Layout
- **Masthead** — barcode-glyph wordmark + mono nav (All barcodes / Bulk / API / language), cobalt scan-rule beneath.
- **Hero headline band** — mono eyebrow + oversized display headline + trust line (free · no login · PNG/SVG · 106 types).
- **The Studio** (2-col on desktop):
  - **Left, sticky:** the Specimen plate (giant live `#preview`, ruler, crop-marks, scan-line), the `#status` readout, and the download row (`#dlPng/#dlSvg/#copyBtn/#dlZip`). Sticky so the code is always visible while refining.
  - **Right, scrolls:** numbered spec-sheet steps — `01 Symbology` (quick-pick chips + `#typeSearch` + full `#typeList`), `02 Data` (`#data` + `#ctSelect` + `#builderFields` + `#seq`), `03 Options` (`#linearProps/#qrProps/#twoDProps` + colors + margin), `04 Bulk` (`#bulk`).
- **SEO article + FAQ + related + footer** — restyled into the specimen aesthetic (kept in full; it's the SEO engine).

## Constraints / safety
- **No engine changes.** `app.js` binds everything via `getElementById`, so the HTML is re-laid-out freely while preserving all 76 IDs + class/attr hooks (`.type-item`, `.reveal`, `[data-zoom]`, `[data-i18n*]`, `#builderFields .ct-block`, `.seq`) + every `data-i18n` key. `catalog.js`, `i18n*.js`, `qr-local.js` untouched.
- **One new file:** `js/living-ink.js` — progressive enhancement only: MutationObserver on `#preview` retriggers scan-line/draw-in; wires new quick-pick chips to the existing type list. Zero coupling to app internals; site works fully without it.
- Keep back-compat token aliases so `bulk-api.css` / `api-docs.css` still resolve.
- `prefers-reduced-motion` disables sweep + draw-in; WCAG AA contrast; visible focus rings; print CSS updated.

## Files (phase 1)
`index.html` (rewrite), `css/style.css` (Living Ink rewrite, aliases kept), `js/living-ink.js` (new), font `<link>` in head. Not touched: everything else.
