// Build per-symbology SEO landing pages from the shared catalog + index.html.
//
//   node scripts/build-pages.mjs
//
// Each barcode type gets its own ROOT-level clean URL (e.g. /qr-code, /pdf417),
// a keyword-aligned <title>/meta, a unique 800+ word article, FAQ (+ FAQPage
// schema) and the live generator pre-selected to that type. Also emits a hub
// page (/barcodes), sitemap.xml and robots.txt. Output is committed and served
// statically; a manifest tracks generated files so re-runs clean up safely.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CATALOG = require(path.join(ROOT, "js/catalog.js"));
const SEO = require(path.join(ROOT, "data/seo-content.js"));
const KW = readJSON(path.join(ROOT, "data/keywords.json")) || {};
const CONTENT_DIR = path.join(ROOT, "data/content");
const MANIFEST = path.join(ROOT, ".pagegen-manifest.json");

const BASE = SEO.site.baseUrl.replace(/\/$/, "");
const HUB = "barcodes"; // hub at /barcodes (file barcodes.html) — distinct from the /barcode API

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230b1220'/%3E%3Cg fill='white'%3E%3Crect x='6' y='8' width='2' height='16'/%3E%3Crect x='9' y='8' width='1' height='16'/%3E%3Crect x='11' y='8' width='3' height='16'/%3E%3Crect x='15' y='8' width='1' height='16'/%3E%3Crect x='17' y='8' width='2' height='16'/%3E%3Crect x='20' y='8' width='1' height='16'/%3E%3Crect x='22' y='8' width='3' height='16'/%3E%3Crect x='26' y='8' width='1' height='16'/%3E%3C/g%3E%3C/svg%3E";

// --- helpers ---------------------------------------------------------------
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; } }
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = (s) => esc(s).replace(/\s+/g, " ").trim();
const wordCount = (html) => (String(html).replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").match(/\b[\w'-]+\b/g) || []).length;

function slugify(name) {
  return String(name).toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function loadHints() {
  const src = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");
  const start = src.indexOf("var HINTS_EN = {");
  const b = src.indexOf("{", start);
  let depth = 0, end = -1;
  for (let i = b; i < src.length; i++) { if (src[i] === "{") depth++; else if (src[i] === "}") { depth--; if (!depth) { end = i; break; } } }
  return Function("return (" + src.slice(b, end + 1) + ")")();
}
const HINTS = loadHints();

// Flatten catalog with resolved slug + reserved-word guard.
const RESERVED = new Set(["barcode", "barcodes", "api", "api-docs", "health", "index", "css", "js", "sitemap", "robots"]);
const ITEMS = [];
const seen = new Set();
for (const group of CATALOG) {
  for (const it of group.items) {
    let slug = slugify(it.name);
    if (RESERVED.has(slug)) slug = slug + "-barcode";
    while (seen.has(slug)) slug = slug + "-" + slugify(it.id);
    seen.add(slug);
    ITEMS.push({ ...it, group: group.groupKey, slug });
  }
}
const TOTAL = ITEMS.length;
const urlFor = (it) => `${BASE}/${it.slug}`;

function firstSentence(s) { const m = String(s || "").match(/^[^.!?]+[.!?]/); return m ? m[0].trim() : String(s || "").trim(); }

// Merge authored content (data/content/<id>.json) > seo-content overrides > derived.
function contentFor(it) {
  const cat = SEO.categories[it.group] || { label: "Barcode", lede: "a barcode symbology.", uses: [] };
  const ov = SEO.overrides[it.id] || {};
  const authored = readJSON(path.join(CONTENT_DIR, it.id + ".json")) || {};
  const hint = HINTS[it.id] || "";
  const kw = KW[it.id] || {};

  const title = authored.title || ov.title || `${it.name} Generator — Free Online | ${SEO.site.name}`;
  const desc = (authored.metaDescription || ov.description ||
    `Generate a scannable ${it.name} online, free. ${hint || cat.lede} Live preview with PNG, SVG and PDF export — no signup.`)
    .replace(/\s+/g, " ").trim();
  const lead = authored.lead || ov.lead || firstSentence(hint) || firstSentence(cat.lede);
  const uses = authored.uses || ov.uses || cat.uses;

  // Article sections: authored preferred; otherwise a minimal derived fallback.
  let sections = authored.sections;
  if (!sections || !sections.length) {
    const about = ov.about || `${it.name} is ${cat.lede}${hint ? " " + hint : ""}`;
    sections = [{ h2: `About the ${it.name}`, html: `<p>${esc(about)}</p>` }];
  }
  const faq = authored.faq || [];
  return { cat, title, desc, lead, uses, sections, faq, primaryKeyword: authored.primaryKeyword || kw.primary || `${it.name.toLowerCase()} generator` };
}

// --- head ------------------------------------------------------------------
function headFor(it, c) {
  const url = urlFor(it);
  const graph = [
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE + "/" },
      { "@type": "ListItem", position: 2, name: "Barcode Types", item: `${BASE}/${HUB}` },
      { "@type": "ListItem", position: 3, name: `${it.name} Generator`, item: url }
    ]},
    { "@type": "SoftwareApplication", name: `${it.name} Generator`, applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url }
  ];
  if (c.faq && c.faq.length) {
    graph.push({ "@type": "FAQPage", mainEntity: c.faq.map((f) => ({
      "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: String(f.a).replace(/<[^>]+>/g, "") } })) });
  }
  const ld = { "@context": "https://schema.org", "@graph": graph };
  return [
    `<title>${esc(c.title)}</title>`,
    `<meta name="description" content="${attr(c.desc)}" />`,
    `<meta name="theme-color" content="#0b1220" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${attr(it.name + " Generator | " + SEO.site.name)}" />`,
    `<meta property="og:description" content="${attr(c.desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="icon" href="${FAVICON}" />`,
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    ``
  ].join("\n");
}

function heroFor(it, c) {
  return `  <section class="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="hero-content">
      <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/${HUB}">Barcodes</a><span>/</span><span>${esc(it.name)}</span></nav>
      <span class="eyebrow">${esc(c.cat.label)}</span>
      <h1>${esc(it.name)} <span class="grad-text">Generator</span></h1>
      <p>${esc(c.lead)}</p>
      <a href="#generator" class="btn btn-primary btn-lg">Open the generator ↓</a>
    </div>
  </section>`;
}

function relatedFor(it) {
  const sibs = ITEMS.filter((o) => o.group === it.group && o.id !== it.id).slice(0, 14);
  return sibs.map((o) => `<a href="/${o.slug}">${esc(o.name)}</a>`).join("");
}

function articleFor(it, c) {
  const secs = c.sections.map((s) => `      <h2>${esc(s.h2)}</h2>\n      ${s.html}`).join("\n");
  const uses = (c.uses || []).map((u) => `<li>${esc(u)}</li>`).join("");
  const faq = (c.faq || []).map((f) =>
    `        <details class="faq-item"><summary>${esc(f.q)}</summary><div class="faq-a">${f.a}</div></details>`).join("\n");
  return `  <article class="seo-section">
    <div class="seo-wrap">
${secs}
      ${uses ? `<h2>Common uses</h2>\n      <ul class="seo-uses">${uses}</ul>` : ""}
      ${faq ? `<h2>Frequently asked questions</h2>\n      <div class="faq">\n${faq}\n      </div>` : ""}
      <h2>Related barcode types</h2>
      <div class="seo-related">${relatedFor(it)}</div>
      <p class="seo-all"><a href="/${HUB}">Browse all ${TOTAL} barcode &amp; QR types →</a></p>
    </div>
  </article>
`;
}

// --- template transform ----------------------------------------------------
const TEMPLATE = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const absolutize = (html) => html
  .replace(/href="css\//g, 'href="/css/')
  .replace(/src="js\//g, 'src="/js/')
  .replace(/href="api-docs\.html"/g, 'href="/api-docs.html"');

function buildPage(it) {
  const c = contentFor(it);
  let html = TEMPLATE;
  const headStart = html.indexOf("<title>");
  const cssMarker = html.indexOf('<link rel="stylesheet" href="css/style.css"');
  html = html.slice(0, headStart) + headFor(it, c) + html.slice(cssMarker);
  const hStart = html.indexOf('<section class="hero">');
  const hEnd = html.indexOf("</section>", hStart) + "</section>".length;
  html = html.slice(0, hStart) + heroFor(it, c).trimStart() + html.slice(hEnd);
  html = html.replace('<script src="js/catalog.js"></script>',
    `<script>window.BARCODE_INITIAL_TYPE=${JSON.stringify(it.id)};</script>\n  <script src="js/catalog.js"></script>`);
  html = html.replace('<footer class="footer">', articleFor(it, c) + '  <footer class="footer">');
  return { html: absolutize(html), words: wordCount(articleFor(it, c)) };
}

// --- hub --------------------------------------------------------------------
function hubPage() {
  const groups = CATALOG.map((g) => {
    const cat = SEO.categories[g.groupKey] || { label: g.groupKey };
    const rows = g.items.map((raw) => {
      const it = ITEMS.find((x) => x.id === raw.id);
      return `      <a class="hub-item" href="/${it.slug}"><span class="hub-name">${esc(it.name)}</span><span class="hub-hint">${esc(HINTS[it.id] || "")}</span></a>`;
    }).join("\n");
    return `    <section class="hub-group">\n      <h2>${esc(cat.label)}</h2>\n      <div class="hub-grid">\n${rows}\n      </div>\n    </section>`;
  }).join("\n");
  const url = `${BASE}/${HUB}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>All Barcode &amp; QR Code Types (${TOTAL}) — ${SEO.site.name}</title>
<meta name="description" content="Browse ${TOTAL} barcode and QR code types you can generate free online — QR, Data Matrix, PDF417, Code 128, EAN, UPC, GS1 and more. Pick a type to generate and export." />
<meta name="theme-color" content="#0b1220" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="All Barcode &amp; QR Code Types — ${SEO.site.name}" />
<meta property="og:url" content="${url}" />
<link rel="icon" href="${FAVICON}" />
<link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/" style="text-decoration:none;color:inherit">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <div><h1>Barcode Studio</h1><p>Free Online Barcode &amp; QR Code Generator</p></div>
    </a>
    <nav class="top-actions">
      <a href="/" class="btn btn-ghost">Generator</a>
      <a href="/api-docs.html" class="btn btn-ghost">API Docs</a>
    </nav>
  </header>
  <section class="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="hero-content">
      <span class="eyebrow">${TOTAL} symbologies</span>
      <h1>Every barcode, <span class="grad-text">one generator</span></h1>
      <p>Pick a barcode or QR code type below to open the live generator, customise it, and export as PNG, SVG or PDF — free and without signup.</p>
    </div>
  </section>
  <main class="hub">
${groups}
  </main>
  <footer class="footer"><span class="footer-brand">Barcode Studio</span> · made by Lawstore since 2026</footer>
</body>
</html>
`;
}

// --- sitemap / robots ------------------------------------------------------
const sitemap = () => {
  const urls = [`${BASE}/`, `${BASE}/${HUB}`, `${BASE}/api-docs.html`, ...ITEMS.map(urlFor)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
};
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;

// --- write (with safe manifest-based cleanup) ------------------------------
const prev = readJSON(MANIFEST) || [];
for (const f of prev) { try { fs.rmSync(path.join(ROOT, f), { force: true }); } catch (e) {} }
fs.rmSync(path.join(ROOT, "barcodes"), { recursive: true, force: true }); // retire old /barcodes/<slug> dir

const written = [];
let thin = 0, minW = Infinity;
for (const it of ITEMS) {
  const { html, words } = buildPage(it);
  const file = it.slug + ".html";
  fs.writeFileSync(path.join(ROOT, file), html);
  written.push(file);
  minW = Math.min(minW, words);
  if (words < 800) thin++;
}
fs.writeFileSync(path.join(ROOT, "barcodes.html"), hubPage()); written.push("barcodes.html");
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap()); written.push("sitemap.xml");
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots); written.push("robots.txt");
fs.writeFileSync(MANIFEST, JSON.stringify(written, null, 0));

console.log(`Built ${ITEMS.length} root pages + hub + sitemap + robots.`);
console.log(`Word counts: min ${minW === Infinity ? 0 : minW}; pages under 800 words: ${thin}/${ITEMS.length}`);
console.log(`Sample: /${ITEMS[0].slug}, /${ITEMS.find((x) => x.id === "pdf417").slug}, /${ITEMS.find((x) => x.id === "EAN13").slug}`);
