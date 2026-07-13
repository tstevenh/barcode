// Build per-symbology SEO landing pages from the shared catalog + index.html.
//
// English remains at root clean URLs such as /qr-code and /barcodes.
// Localized variants are emitted under /pl/, /de/, /nl/, /fr/ and /ja/.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { FOOTER_I18N, STATIC_PAGES } from "../data/site-pages.mjs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// Generated pages, sitemap, robots are written into the public/ docroot that
// Vercel serves (outputDirectory: "public"). The client assets css/ and js/
// live in public/ too (js/ doubles as a build input: catalog + i18n). Source
// that is NOT served — templates/, data/, api/ — stays at ROOT. The manifest
// lives at ROOT as build metadata.
const OUTDIR = path.join(ROOT, "public");

const CATALOG = require(path.join(OUTDIR, "js/catalog.js"));
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
const SITE_NAME = SEO.site.name;
const BUILD_DATE = "2026-07-13";

const FAVICON = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%20role%3D%22img%22%20aria-label%3D%22Barcode%20APIs%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%227%22%20fill%3D%22%230b1220%22%2F%3E%3Cg%20fill%3D%22%23ffffff%22%3E%3Crect%20x%3D%2211%22%20y%3D%2211%22%20width%3D%222%22%20height%3D%2210%22%2F%3E%3Crect%20x%3D%2214%22%20y%3D%2211%22%20width%3D%221%22%20height%3D%2210%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2211%22%20width%3D%222%22%20height%3D%2210%22%2F%3E%3Crect%20x%3D%2219%22%20y%3D%2211%22%20width%3D%222%22%20height%3D%2210%22%2F%3E%3C%2Fg%3E%3Cg%20stroke%3D%22%232d50e6%22%20stroke-width%3D%221.7%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M11%206%20H6%20V11%22%2F%3E%3Cpath%20d%3D%22M21%206%20H26%20V11%22%2F%3E%3Cpath%20d%3D%22M11%2026%20H6%20V21%22%2F%3E%3Cpath%20d%3D%22M21%2026%20H26%20V21%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; }
}
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = (s) => esc(s).replace(/\s+/g, " ").trim();
const wordCount = (html) => {
  const text = String(html).replace(/<[^>]+>/g, " ").replace(/&[a-z0-9#]+;/gi, " ");
  const latin = text.match(/\b[\p{Script=Latin}\p{N}'-]+\b/gu) || [];
  const cjk = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/gu) || [];
  return latin.length + cjk.length;
};

function fmt(s, vars = {}) {
  return String(s == null ? "" : s).replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function cleanText(s) {
  return String(s == null ? "" : s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalized(s) {
  return cleanText(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Title-case an English keyword phrase while preserving standard/acronym casing.
const KEYWORD_ACRONYMS = new Set([
  "qr", "ean", "upc", "gs1", "pdf417", "isbn", "issn", "ismn", "hibc", "epc", "zatca",
  "msi", "itf", "dpd", "usps", "kix", "ntin", "ppn", "pzn", "iata", "nve", "sscc",
  "gtin", "vin", "daft", "bc412", "ascii", "2d", "1d", "lic", "pas", "dl", "id",
  "url", "sms", "png", "svg", "pdf", "csv", "api", "planet", "postnet", "upu"
]);
function titleCaseKeyword(s) {
  return String(s).split(/(\s+|-)/).map((tok) => {
    if (/^\s+$/.test(tok) || tok === "-") return tok;
    const lower = tok.toLowerCase();
    if (KEYWORD_ACRONYMS.has(lower)) return tok.toUpperCase();
    return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
  }).join("");
}

function seoTitleFor(it, primaryKeyword) {
  const keyword = cleanText(primaryKeyword);
  const name = cleanText(it.name);
  const nKeyword = normalized(keyword);
  const nName = normalized(name);
  const core = nKeyword && nName && !nKeyword.includes(nName) ? `${keyword} ${name}` : keyword;
  return `${core} | ${SITE_NAME}`;
}

function seoDescriptionFor(it, primaryKeyword, locale) {
  const template = locale.metaDescriptionTemplate || LOCALES[0].metaDescriptionTemplate;
  return fmt(template, { keyword: cleanText(primaryKeyword), name: cleanText(it.name), brand: SITE_NAME })
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(name) {
  return String(name).toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function loadHints() {
  const src = fs.readFileSync(path.join(OUTDIR, "js/i18n.js"), "utf8");
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
  vm.runInNewContext(fs.readFileSync(path.join(OUTDIR, "js/i18n.js"), "utf8"), context);
  vm.runInNewContext(fs.readFileSync(path.join(OUTDIR, "js/i18n-extra.js"), "utf8"), context);
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

  let primaryKeyword = source.primaryKeyword || kw.primary || `${it.name.toLowerCase()} generator`;
  // EN keyword strings are authored lowercase; present them Title-Cased (acronyms preserved).
  // Localized keywords are authored with correct casing already, so leave them untouched.
  if (locale.code === "en") primaryKeyword = titleCaseKeyword(primaryKeyword);
  const title = seoTitleFor(it, primaryKeyword);
  const desc = seoDescriptionFor(it, primaryKeyword, locale);
  const lead = source.lead || ov.lead || firstSentence(hint) || firstSentence(cat.lede);
  const uses = source.uses || ov.uses || cat.uses;

  let sections = source.sections;
  if (!sections || !sections.length) {
    const about = ov.about || `${it.name} is ${cat.lede}${hint ? " " + hint : ""}`;
    sections = [{ h2: `About the ${it.name}`, html: `<p>${esc(about)}</p>` }];
  }
  const faq = source.faq || [];
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

function jsonLdSiteGraph(locale, url, title, desc, extra = []) {
  const orgId = `${BASE}/#organization`;
  const siteId = `${BASE}/#website`;
  const pageId = `${url}#webpage`;
  return [
    { "@type": "Organization", "@id": orgId, name: SITE_NAME, url: `${BASE}/` },
    { "@type": "WebSite", "@id": siteId, name: SITE_NAME, url: `${BASE}/`, publisher: { "@id": orgId }, inLanguage: locale.htmlLang },
    {
      "@type": "WebPage",
      "@id": pageId,
      url,
      name: cleanText(title),
      description: cleanText(desc),
      isPartOf: { "@id": siteId },
      publisher: { "@id": orgId },
      inLanguage: locale.htmlLang
    },
    ...extra
  ];
}

function howToFor(it, c, locale, url) {
  const hasHowSection = (c.sections || []).some((s) => /how|utworz|erstell|maak|crée|créer|作成/i.test(cleanText(s.h2)));
  if (!hasHowSection || !Array.isArray(locale.howToSteps) || !locale.howToSteps.length) return null;
  return {
    "@type": "HowTo",
    name: fmt(locale.howToName, { keyword: cleanText(c.primaryKeyword), name: cleanText(it.name) }),
    description: cleanText(c.lead),
    totalTime: "PT1M",
    tool: [{ "@type": "HowToTool", name: SITE_NAME }],
    supply: [{ "@type": "HowToSupply", name: cleanText(locale.howToSupply || it.name) }],
    step: locale.howToSteps.map((text, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: fmt(text.name, { keyword: cleanText(c.primaryKeyword), name: cleanText(it.name) }),
      text: fmt(text.text, { keyword: cleanText(c.primaryKeyword), name: cleanText(it.name), brand: SITE_NAME }),
      url: `${url}#generator`
    }))
  };
}

function headFor(it, c, locale, leaf = it.slug) {
  const url = localeUrl(locale, leaf);
  const hubUrl = localeUrl(locale, HUB);
  const homeUrl = localeUrl(locale);
  const breadcrumb = { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: locale.home, item: homeUrl },
    { "@type": "ListItem", position: 2, name: locale.barcodeTypes, item: hubUrl },
    { "@type": "ListItem", position: 3, name: cleanText(c.primaryKeyword), item: url }
  ]};
  const graph = jsonLdSiteGraph(locale, url, c.title, c.desc, [
    { "@type": "BreadcrumbList", itemListElement: [
      ...breadcrumb.itemListElement
    ]},
    { "@type": "SoftwareApplication", name: cleanText(c.primaryKeyword), applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url, publisher: { "@id": `${BASE}/#organization` } }
  ]);
  const howTo = howToFor(it, c, locale, url);
  if (howTo) graph.push(howTo);
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
    alternates(leaf),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${attr(c.title)}" />`,
    `<meta property="og:description" content="${attr(c.desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta property="og:image" content="${BASE}/og/og-default.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:image" content="${BASE}/og/og-default.png" />`,
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
      <h1>${esc(c.primaryKeyword)}</h1>
      <p>${esc(c.lead)}</p>
      <a href="#generator" class="btn btn-primary btn-lg">${esc(locale.generatorCta)}</a>
    </div>
  </section>`;
}

function relatedFor(it, locale) {
  const sibs = ITEMS.filter((o) => o.group === it.group && o.id !== it.id).slice(0, 14);
  return sibs.map((o) => `<a href="${pageHref(locale, o)}">${esc(o.name)} ${esc(locale.generatorWord)}</a>`).join("");
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

const TEMPLATE = fs.readFileSync(path.join(ROOT, "templates/app-shell.html"), "utf8");
const absolutize = (html) => html
  .replace(/href="css\//g, 'href="/css/')
  .replace(/href="api-docs\.html"/g, 'href="/api-docs"')
  .replace(/src="js\//g, 'src="/js/');

function injectLocaleScript(html, locale, extra = "") {
  const script = `<script>window.BARCODE_LOCALE=${JSON.stringify(locale.code)};${extra}</script>\n`;
  return html.replace('<script src="/js/i18n.js"></script>', script + '<script src="/js/i18n.js"></script>');
}

function localizeStaticShell(html, locale) {
  if (locale.code === "en") return html;
  const dict = UI[locale.code] || {};
  if (dict.heroTitleHtml) {
    html = html.replace(
      /<h1 class="reveal" data-i18n-html="heroTitleHtml">[\s\S]*?<\/h1>/,
      `<h1 class="reveal" data-i18n-html="heroTitleHtml">${dict.heroTitleHtml}</h1>`
    );
  }
  html = html.replace(/(<[^>]+data-i18n="([^"]+)"[^>]*>)([^<]*)(<\/[^>]+>)/g, (m, open, key, _text, close) => (
    Object.prototype.hasOwnProperty.call(dict, key) ? `${open}${esc(dict[key])}${close}` : m
  ));
  html = html.replace(/(<[^>]+data-i18n-html="([^"]+)"[^>]*>)([\s\S]*?)(<\/[^>]+>)/g, (m, open, key, _text, close) => (
    key === "heroTitleHtml" ? m :
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
    .replace(/>Copy</g, `>${esc(dict.btnCopy || "Copy")}<`)
    .replace(/>↓ ZIP</g, `>↓ ${esc(dict.btnZip || "ZIP")}<`)
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

function buildPage(it, locale, leaf = it.slug) {
  const c = contentFor(it, locale);
  let html = TEMPLATE;
  html = html.replace('<html lang="en">', `<html lang="${attr(locale.htmlLang)}">`);
  const headStart = html.indexOf("<title>");
  const cssMarker = html.indexOf('<link rel="stylesheet" href="css/style.css"');
  html = html.slice(0, headStart) + headFor(it, c, locale, leaf) + html.slice(cssMarker);
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
  html = withFooter(html, locale);
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
  const desc = fmt(locale.hubDescription, { n: TOTAL });
  const ld = { "@context": "https://schema.org", "@graph": jsonLdSiteGraph(locale, url, fmt(locale.hubTitle, { n: TOTAL }), desc, [
    { "@type": "CollectionPage", url, name: fmt(locale.hubTitle, { n: TOTAL }), description: desc }
  ]) };
  return `<!DOCTYPE html>
<html lang="${attr(locale.htmlLang)}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" /></noscript>
<title>${esc(fmt(locale.hubTitle, { n: TOTAL }))}</title>
<meta name="description" content="${attr(desc)}" />
<meta name="theme-color" content="#0b1220" />
<link rel="canonical" href="${url}" />
${alternates(HUB)}
<meta property="og:type" content="website" />
<meta property="og:title" content="${attr(locale.hubOgTitle)}" />
<meta property="og:description" content="${attr(desc)}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta property="og:image" content="${BASE}/og/og-hub.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="${BASE}/og/og-hub.png" />
<link rel="icon" href="${FAVICON}" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <header class="topbar">
    <a class="brand" href="${localePath(locale)}" style="text-decoration:none;color:inherit">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <div><span class="brand-title">${esc(SITE_NAME)}</span><p>${esc(locale.brandTagline)}</p></div>
    </a>
    <nav class="top-actions">
      <a href="${localePath(locale)}" class="btn btn-ghost">${esc(locale.navGenerator)}</a>
      <a href="/api-docs" class="btn btn-ghost">${esc(locale.navApi)}</a>
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
${footerHtml(locale)}
</body>
</html>
`;
}

function homeHead(locale, c = null) {
  const url = localeUrl(locale);
  const extra = [];
  if (c && c.faq && c.faq.length) {
    extra.push({ "@type": "FAQPage", mainEntity: c.faq.map((f) => ({
      "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: String(f.a).replace(/<[^>]+>/g, "") } })) });
  }
  const ld = { "@context": "https://schema.org", "@graph": jsonLdSiteGraph(locale, url, locale.homeTitle, locale.homeDescription, extra) };
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
    `<meta property="og:image" content="${BASE}/og/og-default.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:image" content="${BASE}/og/og-default.png" />`,
    `<link rel="icon" href="${FAVICON}" />`,
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    ``
  ].join("\n");
}

// The homepage keeps its broad hero + head, but is enriched with the QR Code
// landing content (article + FAQ) so "/" is a substantial, rankable page and the
// generator defaults to QR Code.
function localizedHome(locale) {
  const homeItem = ITEMS.find((x) => x.id === "qrcode");
  const c = homeItem ? contentFor(homeItem, locale) : null;
  let html = TEMPLATE;
  html = html.replace('<html lang="en">', `<html lang="${attr(locale.htmlLang)}">`);
  const headStart = html.indexOf("<title>");
  const cssMarker = html.indexOf('<link rel="stylesheet" href="css/style.css"');
  html = html.slice(0, headStart) + homeHead(locale, c) + html.slice(cssMarker);
  if (homeItem && c) {
    html = html.replace('<script src="js/catalog.js"></script>',
      `<script>window.BARCODE_INITIAL_TYPE=${JSON.stringify(homeItem.id)};</script>\n  <script src="js/catalog.js"></script>`);
    html = html.replace('<footer class="footer">', articleFor(homeItem, c, locale) + '  <footer class="footer">');
  }
  html = absolutize(html);
  html = injectLocaleScript(html, locale);
  html = localizeStaticShell(html, locale);
  html = localizeShellLinks(html, locale);
  html = withFooter(html, locale);
  return html;
}

const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

// Shared expanded footer. Content-page links (about/contact/…) are English-only
// and shared across locales; hub/home links are localized.
function footerHtml(locale) {
  const f = FOOTER_I18N[locale.code] || FOOTER_I18N.en;
  return `  <footer class="site-footer">
    <div class="footer-wrap">
      <a class="footer-brand-row" href="${localePath(locale)}">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="footer-name">${esc(SITE_NAME)}</span>
      </a>
      <nav class="footer-nav" aria-label="Footer">
        <a href="${localePath(locale, HUB)}">${esc(f.allBarcodes)}</a>
        <a href="/about">${esc(f.about)}</a>
        <a href="/contact">${esc(f.contact)}</a>
        <a href="/privacy">${esc(f.privacy)}</a>
        <a href="/terms">${esc(f.terms)}</a>
        <a href="/disclaimer">${esc(f.disclaimer)}</a>
        <a href="/api-docs">${esc(f.apiDocs)}</a>
      </nav>
      <nav class="footer-nav footer-sub" aria-label="Resources">
        <a href="/sitemap.xml">${esc(f.sitemap)}</a>
        <a href="/llms.txt">LLMS.TXT</a>
        <a href="/llms-full.txt">LLMS-FULL.TXT</a>
      </nav>
      <p class="footer-tag">${esc(f.tagline)}</p>
      <p class="footer-copy">© 2026 ${esc(SITE_NAME)}</p>
    </div>
  </footer>`;
}

function withFooter(html, locale) {
  return html.replace(/<footer class="footer">[\s\S]*?<\/footer>/, () => footerHtml(locale));
}

// English-only content pages (About / Contact / Privacy / Terms / Disclaimer).
function staticPageHtml(page) {
  const en = LOCALES[0];
  const url = `${BASE}/${page.slug}`;
  const ld = { "@context": "https://schema.org", "@graph": jsonLdSiteGraph(en, url, page.title, page.description, [
    { "@type": "WebPage", url, name: cleanText(page.title), description: cleanText(page.description) }
  ]) };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="${FONTS}" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="${FONTS}" /></noscript>
<title>${esc(page.title)}</title>
<meta name="description" content="${attr(page.description)}" />
<meta name="theme-color" content="#0b1220" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${attr(page.title)}" />
<meta property="og:description" content="${attr(page.description)}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta property="og:image" content="${BASE}/og/og-default.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="${BASE}/og/og-default.png" />
<link rel="icon" href="${FAVICON}" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/" style="text-decoration:none;color:inherit">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <div><span class="brand-title">${esc(SITE_NAME)}</span><p>Free Online Barcode &amp; QR Code Generator</p></div>
    </a>
    <nav class="top-actions">
      <a href="/barcodes" class="btn btn-ghost">All barcodes</a>
      <a href="/#pro" class="btn btn-ghost">Pro &amp; API</a>
      <a href="/api-docs" class="btn btn-ghost">API Docs</a>
    </nav>
  </header>
  <section class="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="hero-content">
      <span class="eyebrow">${esc(page.eyebrow)}</span>
      <h1>${esc(page.h1)}</h1>
      <p>${esc(page.lead)}</p>
    </div>
  </section>
  <article class="seo-section doc"><div class="seo-wrap">
${page.bodyHtml}
  </div></article>
${footerHtml(en)}
</body>
</html>
`;
}

function llmsTxt() {
  const lines = [];
  lines.push(`# ${SITE_NAME}`, "");
  lines.push(`> Free online barcode & QR code generator — 100+ symbologies (QR, Data Matrix, PDF417, EAN, UPC, GS1, Code 128 and more) with live preview and PNG / SVG export, plus a REST API.`, "");
  lines.push("## Pages", "");
  lines.push(`- [Barcode & QR code generator](${BASE}/): Generate any of 100+ barcode types in the browser with live preview.`);
  lines.push(`- [All barcode types](${BASE}/${HUB}): Browse every supported symbology.`);
  lines.push(`- [API documentation](${BASE}/api-docs): REST API for generating barcodes programmatically.`);
  lines.push(`- [About](${BASE}/about)`, `- [Contact](${BASE}/contact)`, `- [Privacy](${BASE}/privacy)`, `- [Terms](${BASE}/terms)`, `- [Disclaimer](${BASE}/disclaimer)`, "");
  lines.push("## Barcode generators", "");
  for (const it of ITEMS) {
    const hint = (HINTS[it.id] || "").replace(/\s+/g, " ").trim();
    lines.push(`- [${it.name} Generator](${BASE}/${it.slug})${hint ? ": " + hint : ""}`);
  }
  lines.push("");
  return lines.join("\n");
}

function llmsFullTxt() {
  const en = LOCALES[0];
  const out = [];
  out.push(`# ${SITE_NAME} — full content export`, "");
  out.push(`> Full text of every barcode generator page, for LLM / AI consumption. Generated from the same source as the live pages.`, "");
  for (const it of ITEMS) {
    const c = contentFor(it, en);
    out.push(`## ${it.name}`, "");
    out.push(`URL: ${BASE}/${it.slug}`, `Keyword: ${cleanText(c.primaryKeyword)}`, "");
    out.push(cleanText(c.desc), "");
    if (c.lead) out.push(cleanText(c.lead), "");
    for (const s of c.sections) {
      out.push(`### ${cleanText(s.h2)}`, "", cleanText(s.html), "");
    }
    if (c.faq && c.faq.length) {
      out.push(`### FAQ`, "");
      for (const q of c.faq) out.push(`**${cleanText(q.q)}** ${cleanText(q.a)}`, "");
    }
    out.push("---", "");
  }
  return out.join("\n");
}

function sitemap() {
  const urls = [];
  urls.push(`${BASE}/`, `${BASE}/${HUB}`);
  for (const page of STATIC_PAGES) urls.push(`${BASE}/${page.slug}`);
  for (const it of ITEMS) urls.push(pageUrl(LOCALES[0], it));
  for (const locale of LOCALES.slice(1)) {
    urls.push(localeUrl(locale), localeUrl(locale, HUB));
    for (const it of ITEMS) urls.push(pageUrl(locale, it));
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join("\n")}\n</urlset>\n`;
}
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;

function writeGenerated(rel, html, written) {
  const target = path.join(OUTDIR, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  written.push(rel);
}

const prev = readJSON(MANIFEST) || [];
for (const f of prev) {
  try { fs.rmSync(path.join(OUTDIR, f), { force: true }); } catch (e) {}
}
fs.rmSync(path.join(OUTDIR, "barcodes"), { recursive: true, force: true });

const written = [];
let thin = 0, minW = Infinity, pageCount = 0;
for (const locale of LOCALES) {
  writeGenerated(locale.code === "en" ? "index.html" : `${locale.prefix}/index.html`, localizedHome(locale), written);
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
for (const page of STATIC_PAGES) writeGenerated(`${page.slug}.html`, staticPageHtml(page), written);
writeGenerated("llms.txt", llmsTxt(), written);
writeGenerated("llms-full.txt", llmsFullTxt(), written);
writeGenerated("sitemap.xml", sitemap(), written);
writeGenerated("robots.txt", robots, written);
fs.writeFileSync(MANIFEST, JSON.stringify(written, null, 0));

console.log(`Built ${pageCount} landing pages + ${LOCALES.length} hubs + ${LOCALES.length} homepages + ${STATIC_PAGES.length} static pages + llms.txt + llms-full.txt + sitemap + robots.`);
console.log(`Word counts: min ${minW === Infinity ? 0 : minW}; pages under 800 words: ${thin}/${pageCount}`);
console.log(`Sample: /${ITEMS[0].slug}, /de/${ITEMS.find((x) => x.id === "pdf417").slug}, /ja/${ITEMS.find((x) => x.id === "EAN13").slug}`);
