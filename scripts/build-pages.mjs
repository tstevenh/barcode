// Build per-symbology SEO landing pages from the shared catalog + index.html.
//
//   node scripts/build-pages.mjs
//
// Emits: <dir>/<slug>.html for every symbology, a <dir>/index.html hub page,
// sitemap.xml and robots.txt. Re-run whenever the catalog, SEO content, or
// index.html template changes. Output is committed so it deploys as static.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CATALOG = require(path.join(ROOT, "js/catalog.js"));
const SEO = require(path.join(ROOT, "data/seo-content.js"));

const BASE = SEO.site.baseUrl.replace(/\/$/, "");
const DIR = SEO.site.dir;
const OUT = path.join(ROOT, DIR);

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230b1220'/%3E%3Cg fill='white'%3E%3Crect x='6' y='8' width='2' height='16'/%3E%3Crect x='9' y='8' width='1' height='16'/%3E%3Crect x='11' y='8' width='3' height='16'/%3E%3Crect x='15' y='8' width='1' height='16'/%3E%3Crect x='17' y='8' width='2' height='16'/%3E%3Crect x='20' y='8' width='1' height='16'/%3E%3Crect x='22' y='8' width='3' height='16'/%3E%3Crect x='26' y='8' width='1' height='16'/%3E%3C/g%3E%3C/svg%3E";

// --- helpers ---------------------------------------------------------------
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = (s) => esc(s).replace(/\n/g, " ");

function slugify(name) {
  return String(name).toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pull the app's HINTS_EN one-liners out of i18n.js to seed unique copy.
function loadHints() {
  const src = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");
  const start = src.indexOf("var HINTS_EN = {");
  const braceStart = src.indexOf("{", start);
  let depth = 0, end = -1;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const obj = src.slice(braceStart, end + 1);
  // eslint-disable-next-line no-new-func
  return Function("return (" + obj + ")")();
}
const HINTS = loadHints();

// Flatten catalog with resolved metadata.
const ITEMS = [];
const seen = new Set();
for (const group of CATALOG) {
  for (const it of group.items) {
    let slug = slugify(it.name);
    while (seen.has(slug)) slug = slug + "-" + slugify(it.id);
    seen.add(slug);
    ITEMS.push({ ...it, group: group.groupKey, slug });
  }
}
const TOTAL = ITEMS.length;
const bySlug = (it) => `${BASE}/${DIR}/${it.slug}`;

function firstSentence(s) {
  const m = String(s || "").match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : String(s || "").trim();
}
function contentFor(it) {
  const cat = SEO.categories[it.group] || { label: "Barcode", lede: "a barcode symbology.", uses: [] };
  const ov = SEO.overrides[it.id] || {};
  const hint = HINTS[it.id] || "";
  const about = ov.about || `${it.name} is ${cat.lede}${hint ? " " + hint : ""}`;
  const lead = ov.lead || firstSentence(hint) || firstSentence(about);
  const uses = ov.uses || cat.uses;
  const title = ov.title || `${it.name} Generator — Free Online | ${SEO.site.name}`;
  const desc = ov.description ||
    `Generate a scannable ${it.name} online, free. ${hint || cat.lede} Live preview with PNG, SVG and PDF export — no signup.`.replace(/\s+/g, " ").trim().slice(0, 158);
  return { cat, about, lead, uses, title, desc };
}

// --- head / hero / content builders ---------------------------------------
function headFor(it, c) {
  const url = bySlug(it);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE + "/" },
        { "@type": "ListItem", position: 2, name: "Barcode Types", item: `${BASE}/${DIR}` },
        { "@type": "ListItem", position: 3, name: `${it.name} Generator`, item: url }
      ]},
      { "@type": "SoftwareApplication", name: `${it.name} Generator`, applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: url }
    ]
  };
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
      <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/${DIR}">Barcodes</a><span>/</span><span>${esc(it.name)}</span></nav>
      <span class="eyebrow">${esc(c.cat.label)}</span>
      <h1>${esc(it.name)} <span class="grad-text">Generator</span></h1>
      <p>${esc(c.lead)}</p>
      <a href="#generator" class="btn btn-primary btn-lg">Open the generator ↓</a>
    </div>
  </section>`;
}

function relatedFor(it) {
  const sibs = ITEMS.filter((o) => o.group === it.group && o.id !== it.id).slice(0, 14);
  return sibs.map((o) => `<a href="/${DIR}/${o.slug}">${esc(o.name)}</a>`).join("");
}

function seoSectionFor(it, c) {
  const uses = (c.uses || []).map((u) => `<li>${esc(u)}</li>`).join("");
  return `  <section class="seo-section">
    <div class="seo-wrap">
      <h2>About the ${esc(it.name)}</h2>
      <p>${esc(c.about)}</p>
      ${uses ? `<h3>Common uses</h3>\n      <ul class="seo-uses">${uses}</ul>` : ""}
      <h3>Related barcode types</h3>
      <div class="seo-related">${relatedFor(it)}</div>
      <p class="seo-all"><a href="/${DIR}">Browse all ${TOTAL} barcode &amp; QR types →</a></p>
    </div>
  </section>
`;
}

// --- template transform ----------------------------------------------------
const TEMPLATE = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

function absolutize(html) {
  return html
    .replace(/href="css\//g, 'href="/css/')
    .replace(/src="js\//g, 'src="/js/')
    .replace(/href="api-docs\.html"/g, 'href="/api-docs.html"');
}

function buildPage(it) {
  const c = contentFor(it);
  let html = TEMPLATE;

  // 1) head: replace <title> … up to the first stylesheet link
  const headStart = html.indexOf("<title>");
  const cssMarker = html.indexOf('<link rel="stylesheet" href="css/style.css"');
  html = html.slice(0, headStart) + headFor(it, c) + html.slice(cssMarker);

  // 2) hero: replace the whole hero section with a per-type hero
  const hStart = html.indexOf('<section class="hero">');
  const hEnd = html.indexOf("</section>", hStart) + "</section>".length;
  html = html.slice(0, hStart) + heroFor(it, c).trimStart() + html.slice(hEnd);

  // 3) preselect the symbology before scripts load
  html = html.replace(
    '<script src="js/catalog.js"></script>',
    `<script>window.BARCODE_INITIAL_TYPE=${JSON.stringify(it.id)};</script>\n  <script src="js/catalog.js"></script>`
  );

  // 4) inject the SEO content section above the footer
  html = html.replace('<footer class="footer">', seoSectionFor(it, c) + '  <footer class="footer">');

  return absolutize(html);
}

// --- hub page --------------------------------------------------------------
function hubPage() {
  const groups = CATALOG.map((g) => {
    const cat = SEO.categories[g.groupKey] || { label: g.groupKey };
    const rows = g.items.map((raw) => {
      const it = ITEMS.find((x) => x.id === raw.id);
      const hint = HINTS[it.id] || "";
      return `      <a class="hub-item" href="/${DIR}/${it.slug}"><span class="hub-name">${esc(it.name)}</span><span class="hub-hint">${esc(hint)}</span></a>`;
    }).join("\n");
    return `    <section class="hub-group">\n      <h2>${esc(cat.label)}</h2>\n      <div class="hub-grid">\n${rows}\n      </div>\n    </section>`;
  }).join("\n");

  const url = `${BASE}/${DIR}`;
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
function sitemap() {
  const urls = [`${BASE}/`, `${BASE}/${DIR}`, `${BASE}/api-docs.html`, ...ITEMS.map(bySlug)];
  const body = urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;

// --- write -----------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const it of ITEMS) fs.writeFileSync(path.join(OUT, it.slug + ".html"), buildPage(it));
fs.writeFileSync(path.join(OUT, "index.html"), hubPage());
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap());
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);

console.log(`Built ${ITEMS.length} type pages + hub, sitemap.xml, robots.txt`);
console.log(`Sample URLs: /${DIR}/${ITEMS[0].slug}, /${DIR}/${ITEMS.find((x)=>x.id==="CODE128").slug}, /${DIR}/${ITEMS.find((x)=>x.id==="EAN13").slug}`);
