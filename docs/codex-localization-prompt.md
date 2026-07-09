# TASK: Fully localize the Barcode APIs SEO pages into 5 languages

You are working in the repo at `/Users/tsth/Coding/barcode` (Node, static site + Vercel serverless API). Do NOT change the barcode engine, the API, or the English pages' behavior. Your job is to add complete, native-quality localized versions of the generated landing pages in 5 languages, with ZERO English leakage.

## Target languages (locale code → URL prefix → head-term keyword seed)

- Polish   → `/pl/`  → primary head term "generator kodów kreskowych" (also "generator kodów QR")
- German   → `/de/`  → "barcode generator" (also "strichcode generator", "qr-code generator")
- Dutch    → `/nl/`  → "barcode generator" / "streepjescode generator"
- French   → `/fr/`  → "générateur code barre" (also "générateur code-barres", "générateur QR code")
- Japanese → `/ja/`  → "バーコード 作成" (also "QRコード 作成", "JANコード 作成")

English stays at the root (`/qr-code`, `/barcodes`, etc.) and is the x-default.

## What already exists (read these first)

- `data/content/<id>.json` — 106 English content files. Schema:
  `{ id, title, metaDescription, primaryKeyword, secondaryKeywords[], lead, sections[{h2, html}], uses[], faq[{q,a}] }`
- `js/catalog.js` — the symbology catalog (source of ids, names, groups). `data/briefs.json` — id facts.
- `scripts/build-pages.mjs` — builds `<slug>.html` at repo root from `index.html` (template) + the content JSON. It hard-codes English UI strings (breadcrumb "Home"/"Barcodes", hero CTA "Open the generator ↓", "Common uses", "Frequently asked questions", "Related barcode types", "Browse all N barcode & QR types →") and the hub page. Category labels come from `data/seo-content.js` (`categories[].label`, e.g. "2D Code", "Linear Barcode", "GS1 DataBar", "Postal Code", "Retail (EAN / UPC)").
- `js/i18n.js` + `js/i18n-extra.js` — the tool UI translations. en/id/es/fr/de exist; pl/nl/ja do NOT.
- `index.html` — the app shell embedded on every page (the generator tool). `js/app.js` reads `window.BARCODE_INITIAL_TYPE` on init.
- `vercel.json` has `cleanUrls: true`; `server.js` resolves clean URLs + `<dir>/index.html` for local dev.

## Deliverables

For EACH of the 5 languages, produce:

1. `data/content/<lang>/<id>.json` for all 106 ids — a full translation of the English file, same schema, same structure (7 sections + uses + faq), NOTHING shortened or dropped.
2. Locale-prefixed pages built by the (updated) generator: `<lang>/<slug>.html` served at `/<lang>/<slug>`, plus the localized hub `<lang>/barcodes.html` at `/<lang>/barcodes`, and a localized homepage `<lang>/index.html` at `/<lang>` (translate the hero + all tool chrome).
3. Localized builder UI strings + category labels: add a `data/i18n-build.json` keyed by locale for every English string the builder injects (breadcrumb, CTA, section headings, hub copy, category labels, "Browse all…"). Update `scripts/build-pages.mjs` to be locale-aware: loop over locales, read `data/content/<lang>/`, use the localized strings, output to `<lang>/`, and set `<html lang="…">`.
4. Tool-UI translations: add complete pl/nl/ja entries to `js/i18n.js` and `js/i18n-extra.js` (mirror every key that en has — hints included). Add a `window.BARCODE_LOCALE` hook that the localized pages set and `js/app.js` reads on init to force that UI language (falling back to en if unknown). Verify de/fr are complete too.
5. `hreflang` alternates on EVERY page (all 6 variants incl. en) — `<link rel="alternate" hreflang="pl-PL|de-DE|nl-NL|fr-FR|ja-JP|en" href="…">` plus `hreflang="x-default"` → the English URL. Reciprocal on all locales.
6. Update `sitemap.xml` to include every localized URL; update `robots.txt` if needed. Keep the English build working unchanged.

## Translation quality rules (hard requirements)

- **NO ENGLISH LEAK.** Every human-readable word on a localized page must be in that language: title, meta description, lead, all section prose, uses, FAQ, breadcrumb, buttons, tool labels, hub copy, footer, alt text.
- **Translate COMPLETELY** — do not summarize, cut, or thin any section. Each localized page must keep the full depth of its English source (aim for the same length; the English pages are 800+ words).
- **Native-quality**, not machine-literal. Read naturally to a native speaker in that market.
- **Keyword localization:** the `title`, `metaDescription`, `lead`, first section, and ≥1 FAQ must use the natural in-language search term for that barcode (e.g. DE "QR-Code Generator", "Code 128 Generator"; FR "générateur de QR code", "générateur Code 128"; PL "generator kodów QR", "generator Code 128"; NL "QR-code generator"; JA "QRコード 作成", "Code 128 作成"). Set `primaryKeyword`/`secondaryKeywords` to the localized terms. Use the head-term seeds above on the homepage/hub. Do NOT keyword-stuff.
- **Keep UNTRANSLATED** (these are not leaks): the brand "Barcode APIs"; symbology proper names and standards (QR, Data Matrix, PDF417, Aztec, Code 128, EAN, UPC, GS1, GTIN, ISO/IEC numbers, AAMVA, HIBC, RM4SCC); file formats (PNG, SVG, PDF, CSV, ZIP); acronyms (API, URL, REST); code/example strings like `/barcode?type=<id>&data=...` and AI syntax like `(01)…`; numbers. Everything else translates.
- **Preserve all HTML tags** and structure inside `html` fields — translate the text, keep the markup, keep `<strong>`, `<ul><li>`, `<h3>`, `<p>`.
- **Meta length:** keep localized `title` ≤ ~60 characters where the language allows (Japanese counts by character), `metaDescription` ≈ 140–160 characters (Japanese ≈ 60–90 chars is fine). Valid JSON only.

## How to work (parallelize)

This is 530 content files. Fan out with parallel subagents/goals — whichever is faster in Codex. Suggested split: one track per language, each language split into batches of ~15 ids. Keep closely-related symbologies (Code 128 A/B/C, the 2-of-5 family, the GS1 DataBar family, HIBC LIC/PAS, EAN/UPC) in the same batch so a single translator keeps their terminology consistent and distinct. Have each subagent translate from the English `data/content/<id>.json` into `data/content/<lang>/<id>.json`.

## Verification (must pass before you report done)

Write and run `scripts/check-i18n.mjs` that, for every localized file/page:

1. Validates JSON.
2. Confirms all 106 ids exist per language and every field is present and non-empty.
3. Word/'char' count is within ~15% of the English source (catches cut/thinned content).
4. English-leak scan:
   - For pl/de/nl/fr: fail if any of these English markers appear as whole words: `the, and, for, with, your, free online, no signup, How to, What is, Common uses, Frequently asked questions, Related barcode types, Browse all, Open the generator, Home, Barcodes` (allow the untranslated whitelist above).
   - For ja: fail if any run of ≥25 consecutive ASCII letters/spaces appears (allow the whitelist tokens).
   - Also assert none of the English builder section-heading strings survive in localized HTML output.
5. Confirms every built page has correct `<html lang>`, self-referential canonical, and the full hreflang cluster (6 alternates + x-default), and that the localized primaryKeyword appears in the page `<title>`.

Report a per-language table: files done, min/avg length, leaks found (must be 0).

## Acceptance criteria

- `npm run build` regenerates English + all 5 locales with no errors; `scripts/check-i18n.mjs` reports 0 leaks, 0 missing, 0 thin across all 5 languages.
- Spot-open `/de/qr-code`, `/fr/pdf417`, `/pl/code-128`, `/nl/ean-13`, `/ja/data-matrix` locally: every visible word (hero, tool, article, FAQ, footer) is in-language, the correct barcode is preselected and renders, and hreflang links resolve.
- Do NOT commit any secrets; `dataforseo.local.env` stays git-ignored.
