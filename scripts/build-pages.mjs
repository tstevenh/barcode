// Build per-symbology SEO landing pages from the shared catalog + index.html.
//
// English remains at root clean URLs such as /qr-code and /barcodes.
// Localized variants are emitted under /pl/, /de/, /nl/, /fr/ and /ja/.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CATALOG = require(path.join(ROOT, "js/catalog.js"));
const SEO = require(path.join(ROOT, "data/seo-content.js"));
const KW = readJSON(path.join(ROOT, "data/keywords.json")) || {};
const BUILD_I18N = readJSON(path.join(ROOT, "data/i18n-build.json"));
const CONTENT_DIR = path.join(ROOT, "data/content");
const MANIFEST = path.join(ROOT, ".pagegen-manifest.json");

const BASE = SEO.site.baseUrl.replace(/\/$/, "");
const HUB = "barcodes";
const LOCALE_CODES = ["en", "pl", "de", "nl", "fr", "ja"];
const LOCALES = LOCALE_CODES.map((code) => {
  const cfg = BUILD_I18N?.[code];
  if (!cfg) throw new Error(`Missing build i18n locale: ${code}`);
  return { code, ...cfg };
});

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230b1220'/%3E%3Cg fill='white'%3E%3Crect x='6' y='8' width='2' height='16'/%3E%3Crect x='9' y='8' width='1' height='16'/%3E%3Crect x='11' y='8' width='3' height='16'/%3E%3Crect x='15' y='8' width='1' height='16'/%3E%3Crect x='17' y='8' width='2' height='16'/%3E%3Crect x='20' y='8' width='1' height='16'/%3E%3Crect x='22' y='8' width='3' height='16'/%3E%3Crect x='26' y='8' width='1' height='16'/%3E%3C/g%3E%3C/svg%3E";

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; }
}
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = (s) => esc(s).replace(/\s+/g, " ").trim();
const wordCount = (html) => (String(html).replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").match(/\b[\w'-]+\b/g) || []).length;

function fmt(s, vars = {}) {
  return String(s == null ? "" : s).replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function slugify(name) {
  return String(name).toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function loadHints() {
  const src = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");
  const start = src.indexOf("var HINTS_EN = {");
  const b = src.indexOf("{", start);
  let depth = 0, end = -1;
  for (let i = b; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (!depth) { end = i; break; }
    }
  }
  return Function("return (" + src.slice(b, end + 1) + ")")();
}
const HINTS = loadHints();
const UI = loadRuntimeI18n();

function loadRuntimeI18n() {
  const context = { window: {}, console };
  context.window.window = context.window;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8"), context);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/i18n-extra.js"), "utf8"), context);
  return context.window.I18N?.ui || {};
}

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

function localePath(locale, leaf = "") {
  const prefix = locale.prefix ? `/${locale.prefix}` : "";
  if (!leaf) return prefix ? `${prefix}/` : "/";
  return `${prefix}/${leaf}`;
}

function localeUrl(locale, leaf = "") {
  return `${BASE}${localePath(locale, leaf).replace(/\/$/, leaf ? "" : "/")}`;
}

function pageUrl(locale, it) {
  return `${BASE}${localePath(locale, it.slug)}`;
}

function pageHref(locale, it) {
  return localePath(locale, it.slug);
}

function alternates(leaf) {
  const rows = LOCALES.map((locale) => {
    const href = localeUrl(locale, leaf);
    return `<link rel="alternate" hreflang="${locale.hreflang}" href="${href}" />`;
  });
  rows.push(`<link rel="alternate" hreflang="x-default" href="${localeUrl(LOCALES[0], leaf)}" />`);
  return rows.join("\n");
}

function firstSentence(s) {
  const m = String(s || "").match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : String(s || "").trim();
}

function contentPath(locale, id) {
  return locale.code === "en"
    ? path.join(CONTENT_DIR, `${id}.json`)
    : path.join(CONTENT_DIR, locale.code, `${id}.json`);
}

function contentFor(it, locale) {
  const cat = SEO.categories[it.group] || { label: "Barcode", lede: "a barcode symbology.", uses: [] };
  const localizedCat = { ...cat, label: locale.categories?.[it.group] || cat.label };
  const ov = SEO.overrides[it.id] || {};
  const authoredPath = contentPath(locale, it.id);
  const authored = readJSON(authoredPath);
  if (locale.code !== "en" && !authored) throw new Error(`Missing localized content: ${path.relative(ROOT, authoredPath)}`);
  const source = authored || {};
  const hint = HINTS[it.id] || "";
  const kw = KW[it.id] || {};

  let title = source.title || ov.title || `${it.name} Generator — Free Online | ${SEO.site.name}`;
  const desc = (source.metaDescription || ov.description ||
    `Generate a scannable ${it.name} online, free. ${hint || cat.lede} Live preview with PNG, SVG and PDF export — no signup.`)
    .replace(/\s+/g, " ").trim();
  const lead = source.lead || ov.lead || firstSentence(hint) || firstSentence(cat.lede);
  const uses = source.uses || ov.uses || cat.uses;

  let sections = source.sections;
  if (!sections || !sections.length) {
    const about = ov.about || `${it.name} is ${cat.lede}${hint ? " " + hint : ""}`;
    sections = [{ h2: `About the ${it.name}`, html: `<p>${esc(about)}</p>` }];
  }
  const faq = source.faq || [];
  const primaryKeyword = source.primaryKeyword || kw.primary || `${it.name.toLowerCase()} generator`;
  if (locale.code !== "en" && !String(title).toLowerCase().includes(String(primaryKeyword).toLowerCase())) {
    title = `${primaryKeyword} | ${SEO.site.name}`;
  }
  return {
    cat: localizedCat,
    title,
    desc,
    lead,
    uses,
    sections,
    faq,
    primaryKeyword,
    secondaryKeywords: source.secondaryKeywords || []
  };
}

function headFor(it, c, locale) {
  const url = pageUrl(locale, it);
  const hubUrl = localeUrl(locale, HUB);
  const homeUrl = localeUrl(locale);
  const graph = [
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: locale.home, item: homeUrl },
      { "@type": "ListItem", position: 2, name: locale.barcodeTypes, item: hubUrl },
      { "@type": "ListItem", position: 3, name: `${it.name} ${locale.generatorWord}`, item: url }
    ]},
    { "@type": "SoftwareApplication", name: `${it.name} ${locale.generatorWord}`, applicationCategory: "UtilitiesApplication",
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
    alternates(it.slug),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${attr(c.title)}" />`,
    `<meta property="og:description" content="${attr(c.desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="icon" href="${FAVICON}" />`,
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    ``
  ].join("\n");
}

function heroFor(it, c, locale) {
  return `  <section class="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="hero-content">
      <nav class="crumb" aria-label="${attr(locale.barcodeTypes)}"><a href="${localePath(locale)}">${esc(locale.home)}</a><span>/</span><a href="${localePath(locale, HUB)}">${esc(locale.barcodes)}</a><span>/</span><span>${esc(it.name)}</span></nav>
      <span class="eyebrow">${esc(c.cat.label)}</span>
      <h1>${esc(it.name)} <span class="grad-text">${esc(locale.generatorWord)}</span></h1>
      <p>${esc(c.lead)}</p>
      <a href="#generator" class="btn btn-primary btn-lg">${esc(locale.generatorCta)}</a>
    </div>
  </section>`;
}

function relatedFor(it, locale) {
  const sibs = ITEMS.filter((o) => o.group === it.group && o.id !== it.id).slice(0, 14);
  return sibs.map((o) => `<a href="${pageHref(locale, o)}">${esc(o.name)}</a>`).join("");
}

function articleFor(it, c, locale) {
  const secs = c.sections.map((s) => `      <h2>${esc(s.h2)}</h2>\n      ${s.html}`).join("\n");
  const uses = (c.uses || []).map((u) => `<li>${esc(u)}</li>`).join("");
  const faq = (c.faq || []).map((f) =>
    `        <details class="faq-item"><summary>${esc(f.q)}</summary><div class="faq-a">${f.a}</div></details>`).join("\n");
  return `  <article class="seo-section">
    <div class="seo-wrap">
${secs}
      ${uses ? `<h2>${esc(locale.commonUses)}</h2>\n      <ul class="seo-uses">${uses}</ul>` : ""}
      ${faq ? `<h2>${esc(locale.faq)}</h2>\n      <div class="faq">\n${faq}\n      </div>` : ""}
      <h2>${esc(locale.related)}</h2>
      <div class="seo-related">${relatedFor(it, locale)}</div>
      <p class="seo-all"><a href="${localePath(locale, HUB)}">${esc(fmt(locale.browseAll, { n: TOTAL }))}</a></p>
    </div>
  </article>
`;
}

const TEMPLATE = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const absolutize = (html) => html
  .replace(/href="css\//g, 'href="/css/')
  .replace(/href="api-docs\.html"/g, 'href="/api-docs.html"')
  .replace(/src="js\//g, 'src="/js/');

function injectLocaleScript(html, locale, extra = "") {
  const script = `<script>window.BARCODE_LOCALE=${JSON.stringify(locale.code)};${extra}</script>\n`;
  return html.replace('<script src="/js/i18n.js"></script>', script + '<script src="/js/i18n.js"></script>');
}

function localizeStaticShell(html, locale) {
  if (locale.code === "en") return html;
  const dict = UI[locale.code] || {};
  html = html.replace(/(<[^>]+data-i18n="([^"]+)"[^>]*>)([^<]*)(<\/[^>]+>)/g, (m, open, key, _text, close) => (
    Object.prototype.hasOwnProperty.call(dict, key) ? `${open}${esc(dict[key])}${close}` : m
  ));
  html = html.replace(/(<[^>]+data-i18n-html="([^"]+)"[^>]*>)([\s\S]*?)(<\/[^>]+>)/g, (m, open, key, _text, close) => (
    Object.prototype.hasOwnProperty.call(dict, key) ? `${open}${dict[key]}${close}` : m
  ));
  html = html.replace(/data-i18n-ph="([^"]+)" placeholder="[^"]*"/g, (m, key) => (
    Object.prototype.hasOwnProperty.call(dict, key) ? `data-i18n-ph="${key}" placeholder="${attr(dict[key])}"` : m
  ));
  const zoomOut = { pl: "Pomniejsz", de: "Verkleinern", nl: "Uitzoomen", fr: "Réduire", ja: "縮小" }[locale.code] || "Zoom out";
  const zoomIn = { pl: "Powiększ", de: "Vergrößern", nl: "Inzoomen", fr: "Agrandir", ja: "拡大" }[locale.code] || "Zoom in";
  const sample = {
    pl: { network: "Siec", password: "haslo123", first: "Jan", last: "Kowalski", meeting: "Spotkanie", hello: "Wiadomosc" },
    de: { network: "Netzwerk", password: "passwort123", first: "Max", last: "Muster", meeting: "Termin", hello: "Nachricht" },
    nl: { network: "Netwerk", password: "wachtwoord123", first: "Jan", last: "Jansen", meeting: "Afspraak", hello: "Bericht" },
    fr: { network: "Reseau", password: "motdepasse123", first: "Jean", last: "Martin", meeting: "Rendez-vous", hello: "Message" },
    ja: { network: "ネットワーク", password: "pass1234", first: "太郎", last: "山田", meeting: "打ち合わせ", hello: "こんにちは" }
  }[locale.code];
  return html
    .replace(/aria-label="Language"/g, `aria-label="${attr(dict.langLabel || locale.name)}"`)
    .replace(/>📋 Copy</g, `>📋 ${esc(dict.btnCopy || "Copy")}<`)
    .replace(/>⬇ ZIP \(batch\)</g, `>⬇ ${esc(dict.btnZip || "ZIP")}<`)
    .replace(/title="Zoom out"/g, `title="${attr(zoomOut)}"`)
    .replace(/title="Zoom in"/g, `title="${attr(zoomIn)}"`)
    .replace(/value="MyNetwork"/g, `value="${attr(sample.network)}"`)
    .replace(/value="password123"/g, `value="${attr(sample.password)}"`)
    .replace(/value="John"/g, `value="${attr(sample.first)}"`)
    .replace(/value="Doe"/g, `value="${attr(sample.last)}"`)
    .replace(/value="Meeting"/g, `value="${attr(sample.meeting)}"`)
    .replace(/value="Hello"/g, `value="${attr(sample.hello)}"`);
}

function localizeShellLinks(html, locale) {
  if (locale.code === "en") return html;
  return html
    .replace(/href="\/barcodes"/g, `href="${localePath(locale, HUB)}"`)
    .replace(/href="\/"/g, `href="${localePath(locale)}"`);
}

function buildPage(it, locale) {
  const c = contentFor(it, locale);
  let html = TEMPLATE;
  html = html.replace('<html lang="en">', `<html lang="${attr(locale.htmlLang)}">`);
  const headStart = html.indexOf("<title>");
  const cssMarker = html.indexOf('<link rel="stylesheet" href="css/style.css"');
  html = html.slice(0, headStart) + headFor(it, c, locale) + html.slice(cssMarker);
  const hStart = html.indexOf('<section class="hero">');
  const hEnd = html.indexOf("</section>", hStart) + "</section>".length;
  html = html.slice(0, hStart) + heroFor(it, c, locale).trimStart() + html.slice(hEnd);
  html = html.replace('<script src="js/catalog.js"></script>',
    `<script>window.BARCODE_INITIAL_TYPE=${JSON.stringify(it.id)};</script>\n  <script src="js/catalog.js"></script>`);
  html = html.replace('<footer class="footer">', articleFor(it, c, locale) + '  <footer class="footer">');
  html = absolutize(html);
  html = injectLocaleScript(html, locale);
  html = localizeStaticShell(html, locale);
  html = localizeShellLinks(html, locale);
  return { html, words: wordCount(articleFor(it, c, locale)), primaryKeyword: c.primaryKeyword };
}

function hubPage(locale) {
  const groups = CATALOG.map((g) => {
    const label = locale.categories?.[g.groupKey] || g.groupKey;
    const rows = g.items.map((raw) => {
      const it = ITEMS.find((x) => x.id === raw.id);
      return `      <a class="hub-item" href="${pageHref(locale, it)}"><span class="hub-name">${esc(it.name)}</span><span class="hub-hint">${esc(HINTS[it.id] || "")}</span></a>`;
    }).join("\n");
    return `    <section class="hub-group">\n      <h2>${esc(label)}</h2>\n      <div class="hub-grid">\n${rows}\n      </div>\n    </section>`;
  }).join("\n");
  const url = localeUrl(locale, HUB);
  return `<!DOCTYPE html>
<html lang="${attr(locale.htmlLang)}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(fmt(locale.hubTitle, { n: TOTAL }))}</title>
<meta name="description" content="${attr(fmt(locale.hubDescription, { n: TOTAL }))}" />
<meta name="theme-color" content="#0b1220" />
<link rel="canonical" href="${url}" />
${alternates(HUB)}
<meta property="og:type" content="website" />
<meta property="og:title" content="${attr(locale.hubOgTitle)}" />
<meta property="og:url" content="${url}" />
<link rel="icon" href="${FAVICON}" />
<link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <header class="topbar">
    <a class="brand" href="${localePath(locale)}" style="text-decoration:none;color:inherit">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <div><h1>Barcode Studio</h1><p>${esc(locale.brandTagline)}</p></div>
    </a>
    <nav class="top-actions">
      <a href="${localePath(locale)}" class="btn btn-ghost">${esc(locale.navGenerator)}</a>
      <a href="/api-docs.html" class="btn btn-ghost">${esc(locale.navApi)}</a>
    </nav>
  </header>
  <section class="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="hero-content">
      <span class="eyebrow">${esc(fmt(locale.hubEyebrow, { n: TOTAL }))}</span>
      <h1>${locale.hubH1Html}</h1>
      <p>${esc(locale.hubLead)}</p>
    </div>
  </section>
  <main class="hub">
${groups}
  </main>
  <footer class="footer"><span class="footer-brand">Barcode Studio</span> · ${esc(locale.footerText)}</footer>
</body>
</html>
`;
}

function homeHead(locale) {
  const url = localeUrl(locale);
  return [
    `<title>${esc(locale.homeTitle)}</title>`,
    `<meta name="description" content="${attr(locale.homeDescription)}" />`,
    `<meta name="theme-color" content="#0b1220" />`,
    `<link rel="canonical" href="${url}" />`,
    alternates(""),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${attr(locale.homeTitle)}" />`,
    `<meta property="og:description" content="${attr(locale.homeDescription)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="icon" href="${FAVICON}" />`,
    ``
  ].join("\n");
}

function localizedHome(locale) {
  let html = TEMPLATE;
  html = html.replace('<html lang="en">', `<html lang="${attr(locale.htmlLang)}">`);
  const headStart = html.indexOf("<title>");
  const cssMarker = html.indexOf('<link rel="stylesheet" href="css/style.css"');
  html = html.slice(0, headStart) + homeHead(locale) + html.slice(cssMarker);
  html = absolutize(html);
  html = injectLocaleScript(html, locale);
  html = localizeStaticShell(html, locale);
  html = localizeShellLinks(html, locale);
  return html;
}

function sitemap() {
  const urls = [];
  urls.push(`${BASE}/`, `${BASE}/${HUB}`, `${BASE}/api-docs.html`);
  for (const it of ITEMS) urls.push(pageUrl(LOCALES[0], it));
  for (const locale of LOCALES.slice(1)) {
    urls.push(localeUrl(locale), localeUrl(locale, HUB));
    for (const it of ITEMS) urls.push(pageUrl(locale, it));
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
}
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;

function writeGenerated(rel, html, written) {
  const target = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  written.push(rel);
}

const prev = readJSON(MANIFEST) || [];
for (const f of prev) {
  try { fs.rmSync(path.join(ROOT, f), { force: true }); } catch (e) {}
}
fs.rmSync(path.join(ROOT, "barcodes"), { recursive: true, force: true });

const written = [];
let thin = 0, minW = Infinity, pageCount = 0;
for (const locale of LOCALES) {
  if (locale.code !== "en") {
    writeGenerated(`${locale.prefix}/index.html`, localizedHome(locale), written);
  }
  for (const it of ITEMS) {
    const { html, words } = buildPage(it, locale);
    const file = locale.code === "en" ? `${it.slug}.html` : `${locale.prefix}/${it.slug}.html`;
    writeGenerated(file, html, written);
    pageCount++;
    minW = Math.min(minW, words);
    if (words < 800) thin++;
  }
  const hubFile = locale.code === "en" ? "barcodes.html" : `${locale.prefix}/barcodes.html`;
  writeGenerated(hubFile, hubPage(locale), written);
}
writeGenerated("sitemap.xml", sitemap(), written);
writeGenerated("robots.txt", robots, written);
fs.writeFileSync(MANIFEST, JSON.stringify(written, null, 0));

console.log(`Built ${pageCount} landing pages + ${LOCALES.length} hubs + ${LOCALES.length - 1} localized homepages + sitemap + robots.`);
console.log(`Word counts: min ${minW === Infinity ? 0 : minW}; pages under 800 words: ${thin}/${pageCount}`);
console.log(`Sample: /${ITEMS[0].slug}, /de/${ITEMS.find((x) => x.id === "pdf417").slug}, /ja/${ITEMS.find((x) => x.id === "EAN13").slug}`);
