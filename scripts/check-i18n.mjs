#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG = require(path.join(ROOT, "js/catalog.js"));
const SEO = require(path.join(ROOT, "data/seo-content.js"));
const BUILD_I18N = JSON.parse(fs.readFileSync(path.join(ROOT, "data/i18n-build.json"), "utf8"));
const BASE = SEO.site.baseUrl.replace(/\/$/, "");
const LANGS = ["pl", "de", "nl", "fr", "ja"];
const ALL_LOCALES = ["en", ...LANGS];
const REQUIRED_KEYS = ["id", "title", "metaDescription", "primaryKeyword", "secondaryKeywords", "lead", "sections", "uses", "faq"];
const HTML_HEADINGS = [
  "Common uses",
  "Frequently asked questions",
  "Related barcode types",
  "Browse all",
  "Open the generator",
  "Home",
  "Barcodes"
];
const MARKERS = [
  "the", "and", "for", "with", "your", "free online", "no signup",
  "How to", "What is", ...HTML_HEADINGS
];
const WHITELIST = [
  "Barcode Mint", "QR", "Data Matrix", "PDF417", "Aztec", "Code 128", "EAN", "UPC", "GS1", "GTIN",
  "ISO", "IEC", "ISO/IEC", "AAMVA", "HIBC", "RM4SCC", "PNG", "SVG", "PDF", "CSV", "ZIP", "API", "URL", "REST",
  "USPS", "Royal Mail", "Australia Post", "Japan Post", "Deutsche Post", "DataBar", "MaxiCode", "DotCode",
  "MicroPDF417", "Micro QR", "Han Xin", "Codablock", "Pharmacode", "PZN", "ISBN", "ISSN", "ISMN", "BC412"
];

function slugify(name) {
  return String(name).toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const RESERVED = new Set(["barcode", "barcodes", "api", "api-docs", "health", "index", "css", "js", "sitemap", "robots"]);
const ITEMS = [];
const seen = new Set();
for (const group of CATALOG) {
  for (const it of group.items) {
    let slug = slugify(it.name);
    if (RESERVED.has(slug)) slug = `${slug}-barcode`;
    while (seen.has(slug)) slug = `${slug}-${slugify(it.id)}`;
    seen.add(slug);
    ITEMS.push({ ...it, group: group.groupKey, slug });
  }
}
for (const item of ITEMS) WHITELIST.push(item.name);
WHITELIST.push("Code", "Digital Link", "Composite Symbology", "Expanded Stacked", "Full ASCII");

function readJSON(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${file}: invalid JSON (${error.message})`);
    return null;
  }
}

function stripHtml(s) {
  return String(s ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function latinWordCount(s) {
  return (stripHtml(s).match(/\b[\p{L}\p{N}'-]+\b/gu) || []).length;
}

function jaCharCount(s) {
  return (stripHtml(s).match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/gu) || []).length;
}

function contentText(j) {
  return [
    j.title,
    j.metaDescription,
    j.primaryKeyword,
    ...(j.secondaryKeywords || []),
    j.lead,
    ...(j.sections || []).flatMap((s) => [s.h2, s.html]),
    ...(j.uses || []),
    ...(j.faq || []).flatMap((f) => [f.q, f.a])
  ].join("\n");
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeWhitelist(text) {
  let out = String(text);
  for (const term of [...WHITELIST].sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(escapeRe(term), "gi"), " ");
  }
  out = out.replace(/\/barcode\?[^"' <]+/g, " ");
  out = out.replace(/\([0-9]{2}\)[0-9A-Z]+/g, " ");
  return out;
}

function markerLeaks(text, lang) {
  const clean = removeWhitelist(stripHtml(text));
  if (lang === "ja") {
    return (clean.match(/[A-Za-z][A-Za-z ]{24,}[A-Za-z]/g) || []).slice(0, 5);
  }
  const leaks = [];
  for (const marker of MARKERS) {
    const re = marker.includes(" ")
      ? new RegExp(escapeRe(marker), "i")
      : new RegExp(`\\b${escapeRe(marker)}\\b`, "i");
    if (re.test(clean)) leaks.push(marker);
  }
  return leaks;
}

function localePath(locale, leaf = "") {
  if (locale === "en") return leaf ? `/${leaf}` : "/";
  return leaf ? `/${locale}/${leaf}` : `/${locale}/`;
}

function urlFor(locale, leaf = "") {
  return `${BASE}${localePath(locale, leaf)}`;
}

function expectedAlternates(leaf) {
  return [
    ...ALL_LOCALES.map((locale) => ({
      hreflang: BUILD_I18N[locale].hreflang,
      href: urlFor(locale, leaf)
    })),
    { hreflang: "x-default", href: urlFor("en", leaf) }
  ];
}

function extractTitle(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/&amp;/g, "&").trim() || "";
}

function extractMetaDescription(html) {
  return html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, "&").trim() || "";
}

function extractH1Count(html) {
  return (html.match(/<h1\b/gi) || []).length;
}

function extractJsonLdGraphs(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]));
}

function graphTypes(jsonLd) {
  const nodes = Array.isArray(jsonLd?.["@graph"]) ? jsonLd["@graph"] : [jsonLd];
  return new Set(nodes.flatMap((node) => Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]]).filter(Boolean));
}

function pageFile(locale, slug) {
  if (!slug) return locale === "en" ? path.join(ROOT, "index.html") : path.join(ROOT, locale, "index.html");
  return locale === "en" ? path.join(ROOT, `${slug}.html`) : path.join(ROOT, locale, `${slug}.html`);
}

function checkPage(locale, slug, primaryKeyword, errors) {
  const file = pageFile(locale, slug);
  if (!fs.existsSync(file)) {
    errors.push(`${locale}/${slug}: missing built page`);
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  const cfg = BUILD_I18N[locale];
  if (!html.includes('class="seo-section"')) {
    errors.push(`${locale}/${slug || "index"}: missing SEO article block`);
  }
  if (extractH1Count(html) !== 1) {
    errors.push(`${locale}/${slug || "index"}: expected exactly one h1`);
  }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
  if (!h1.toLowerCase().includes(String(primaryKeyword).toLowerCase())) {
    errors.push(`${locale}/${slug || "index"}: primaryKeyword not in h1 (${primaryKeyword})`);
  }
  if (!new RegExp(`<html\\s+lang=["']${escapeRe(cfg.htmlLang)}["']`, "i").test(html)) {
    errors.push(`${locale}/${slug}: incorrect html lang`);
  }
  const canonical = `<link rel="canonical" href="${urlFor(locale, slug)}" />`;
  if (!html.includes(canonical)) errors.push(`${locale}/${slug}: missing self canonical`);
  for (const alt of expectedAlternates(slug)) {
    const tag = `<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`;
    if (!html.includes(tag)) errors.push(`${locale}/${slug}: missing hreflang ${alt.hreflang}`);
  }
  const desc = extractMetaDescription(html);
  if (!desc || !desc.toLowerCase().includes(String(primaryKeyword).toLowerCase())) {
    errors.push(`${locale}/${slug || "index"}: primaryKeyword not in meta description (${primaryKeyword})`);
  }
  for (const tag of [
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'name="twitter:card"'
  ]) {
    if (!html.includes(tag)) errors.push(`${locale}/${slug || "index"}: missing ${tag}`);
  }
  try {
    const blocks = extractJsonLdGraphs(html);
    if (!blocks.length) errors.push(`${locale}/${slug || "index"}: missing JSON-LD`);
    const types = new Set(blocks.flatMap((block) => [...graphTypes(block)]));
    for (const type of ["Organization", "WebSite", "WebPage", "BreadcrumbList", "SoftwareApplication", "FAQPage", "HowTo"]) {
      if (!types.has(type)) errors.push(`${locale}/${slug || "index"}: JSON-LD missing ${type}`);
    }
  } catch (error) {
    errors.push(`${locale}/${slug || "index"}: invalid JSON-LD (${error.message})`);
  }
  if (locale !== "en") {
    const pageLeaks = markerLeaks(html, locale).filter((m) => !["the", "and", "for", "with", "your"].includes(m));
    if (pageLeaks.length) errors.push(`${locale}/${slug}: builder English leak ${pageLeaks.join(", ")}`);
    const title = extractTitle(html).toLowerCase();
    if (!title.includes(String(primaryKeyword).toLowerCase())) {
      errors.push(`${locale}/${slug}: primaryKeyword not in title (${primaryKeyword})`);
    }
  }
}

function checkHub(locale, errors) {
  const file = pageFile(locale, "barcodes");
  const html = fs.readFileSync(file, "utf8");
  for (const tag of [
    `<link rel="canonical" href="${urlFor(locale, "barcodes")}" />`,
    'property="og:description"',
    'name="twitter:card"',
    'type="application/ld+json"'
  ]) {
    if (!html.includes(tag)) errors.push(`${locale}/barcodes: missing ${tag}`);
  }
}

function checkHome(locale, errors) {
  const file = pageFile(locale, "");
  const html = fs.readFileSync(file, "utf8");
  const cfg = BUILD_I18N[locale];
  if (extractH1Count(html) !== 1) errors.push(`${locale}/index: expected exactly one h1`);
  for (const tag of [
    `<html lang="${cfg.htmlLang}">`,
    `<link rel="canonical" href="${urlFor(locale, "")}" />`,
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'name="twitter:card"'
  ]) {
    if (!html.includes(tag)) errors.push(`${locale}/index: missing ${tag}`);
  }
  for (const alt of expectedAlternates("")) {
    const tag = `<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`;
    if (!html.includes(tag)) errors.push(`${locale}/index: missing hreflang ${alt.hreflang}`);
  }
  try {
    const types = new Set(extractJsonLdGraphs(html).flatMap((block) => [...graphTypes(block)]));
    for (const type of ["Organization", "WebSite", "WebPage"]) {
      if (!types.has(type)) errors.push(`${locale}/index: JSON-LD missing ${type}`);
    }
  } catch (error) {
    errors.push(`${locale}/index: invalid JSON-LD (${error.message})`);
  }
}

const errors = [];
const rows = [];
const english = new Map();
const seenTitles = new Map();
const seenDescriptions = new Map();
for (const it of ITEMS) {
  const file = path.join(ROOT, "data/content", `${it.id}.json`);
  const j = readJSON(file, errors);
  if (j) english.set(it.id, { json: j, words: latinWordCount(contentText(j)) });
}

checkHome("en", errors);
for (const it of ITEMS) {
  const en = english.get(it.id)?.json;
  if (en) checkPage("en", it.slug, en.primaryKeyword, errors);
}
checkHub("en", errors);

for (const lang of LANGS) {
  let filesDone = 0;
  let minRatio = Infinity;
  let avgRatio = 0;
  let leakCount = 0;
  let thinCount = 0;
  for (const it of ITEMS) {
    const file = path.join(ROOT, "data/content", lang, `${it.id}.json`);
    if (!fs.existsSync(file)) {
      errors.push(`${lang}/${it.id}: missing content file`);
      continue;
    }
    const j = readJSON(file, errors);
    if (!j) continue;
    filesDone++;
    for (const key of REQUIRED_KEYS) {
      if (!(key in j)) errors.push(`${lang}/${it.id}: missing field ${key}`);
    }
    if (j.id !== it.id) errors.push(`${lang}/${it.id}: id mismatch`);
    for (const key of ["title", "metaDescription", "primaryKeyword", "lead"]) {
      if (!String(j[key] ?? "").trim()) errors.push(`${lang}/${it.id}: empty ${key}`);
    }
    if (!Array.isArray(j.secondaryKeywords) || !j.secondaryKeywords.length) errors.push(`${lang}/${it.id}: empty secondaryKeywords`);
    if (!Array.isArray(j.sections) || !j.sections.length) errors.push(`${lang}/${it.id}: empty sections`);
    if (!Array.isArray(j.uses) || !j.uses.length) errors.push(`${lang}/${it.id}: empty uses`);
    if (!Array.isArray(j.faq) || !j.faq.length) errors.push(`${lang}/${it.id}: empty faq`);
    const en = english.get(it.id)?.json;
    if (en) {
      for (const key of ["secondaryKeywords", "sections", "uses", "faq"]) {
        if ((j[key] || []).length !== (en[key] || []).length) errors.push(`${lang}/${it.id}: ${key} count mismatch`);
      }
    }
    for (const [idx, section] of (j.sections || []).entries()) {
      if (!section.h2 || !section.html) errors.push(`${lang}/${it.id}: section ${idx} missing h2/html`);
    }
    for (const [idx, faq] of (j.faq || []).entries()) {
      if (!faq.q || !faq.a) errors.push(`${lang}/${it.id}: faq ${idx} missing q/a`);
    }
    const sourceWords = english.get(it.id)?.words || 1;
    const length = lang === "ja" ? jaCharCount(contentText(j)) : latinWordCount(contentText(j));
    const ratio = length / sourceWords;
    minRatio = Math.min(minRatio, ratio);
    avgRatio += ratio;
    if (ratio < 0.85) {
      thinCount++;
      errors.push(`${lang}/${it.id}: thin content ratio ${ratio.toFixed(2)}`);
    }
    const leaks = markerLeaks(contentText(j), lang);
    if (leaks.length) {
      leakCount += leaks.length;
      errors.push(`${lang}/${it.id}: English leak ${leaks.join(", ")}`);
    }
    checkPage(lang, it.slug, j.primaryKeyword, errors);
  }
  checkHome(lang, errors);
  checkHub(lang, errors);
  rows.push({
    lang,
    filesDone,
    minRatio: Number((minRatio === Infinity ? 0 : minRatio).toFixed(2)),
    avgRatio: Number((filesDone ? avgRatio / filesDone : 0).toFixed(2)),
    leaks: leakCount,
    thin: thinCount
  });
}

for (const locale of ALL_LOCALES) {
  for (const slug of ["", "barcodes", ...ITEMS.map((it) => it.slug)]) {
    const html = fs.readFileSync(pageFile(locale, slug), "utf8");
    const title = extractTitle(html);
    const desc = extractMetaDescription(html);
    const key = `${locale}/${slug || "index"}`;
    // Titles/descriptions must be unique WITHIN a locale. Identical titles across
    // locales are fine — those are hreflang alternates of the same page (e.g.
    // "Code 128 Barcode Generator" is the same phrase in English and German).
    const tKey = `${locale} ${title}`;
    const dKey = `${locale} ${desc}`;
    if (seenTitles.has(tKey)) errors.push(`${key}: duplicate title also used by ${seenTitles.get(tKey)}`);
    else seenTitles.set(tKey, key);
    if (seenDescriptions.has(dKey)) errors.push(`${key}: duplicate meta description also used by ${seenDescriptions.get(dKey)}`);
    else seenDescriptions.set(dKey, key);
  }
}

const sitemapFile = path.join(ROOT, "sitemap.xml");
if (fs.existsSync(sitemapFile)) {
  const sitemap = fs.readFileSync(sitemapFile, "utf8");
  const locs = sitemap.match(/<loc>/g) || [];
  const expected = ITEMS.length * ALL_LOCALES.length + ALL_LOCALES.length + ALL_LOCALES.length + 1;
  if (locs.length !== expected) errors.push(`sitemap.xml: expected ${expected} URLs, found ${locs.length}`);
  if (!sitemap.includes(`<loc>${BASE}/api-docs.html</loc>`)) errors.push("sitemap.xml: missing api-docs URL");
} else {
  errors.push("sitemap.xml: missing");
}

console.log("lang,files,min_ratio,avg_ratio,leaks,thin");
for (const row of rows) {
  console.log(`${row.lang},${row.filesDone},${row.minRatio},${row.avgRatio},${row.leaks},${row.thin}`);
}

if (errors.length) {
  console.error(`\n${errors.length} i18n check failures:`);
  for (const line of errors.slice(0, 200)) console.error(`- ${line}`);
  if (errors.length > 200) console.error(`... ${errors.length - 200} more`);
  process.exit(1);
}

console.log("\nAll localized content and pages passed i18n checks.");
