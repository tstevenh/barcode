#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://api.dataforseo.com/v3";

const locales = [
  {
    language: "Spanish",
    market: "Mexico",
    location_code: 2484,
    language_code: "es",
    keywords: [
      "generador de codigos qr",
      "generador de codigo qr",
      "generador qr",
      "crear codigo qr",
      "generador de codigo de barras",
      "generador codigo de barras",
      "generador de codigos de barras",
      "generador ean 13",
      "generador code 128",
      "generador data matrix",
      "generador pdf417",
      "generador gs1 128",
      "generador upc",
      "generador isbn",
    ],
  },
  {
    language: "Spanish",
    market: "Spain",
    location_code: 2724,
    language_code: "es",
    keywords: [
      "generador de codigos qr",
      "generador de codigo qr",
      "generador qr",
      "crear codigo qr",
      "generador de codigo de barras",
      "generador codigo de barras",
      "generador de codigos de barras",
      "generador ean 13",
      "generador code 128",
      "generador data matrix",
      "generador pdf417",
      "generador gs1 128",
      "generador upc",
      "generador isbn",
    ],
  },
  {
    language: "Portuguese",
    market: "Brazil",
    location_code: 2076,
    language_code: "pt",
    keywords: [
      "gerador de qr code",
      "gerador qr code",
      "criar qr code",
      "gerador de codigo qr",
      "gerador de codigo de barras",
      "gerador codigo de barras",
      "gerador de codigos de barras",
      "gerador ean 13",
      "gerador code 128",
      "gerador data matrix",
      "gerador pdf417",
      "gerador gs1 128",
      "gerador upc",
      "gerador isbn",
    ],
  },
  {
    language: "German",
    market: "Germany",
    location_code: 2276,
    language_code: "de",
    keywords: [
      "qr code generator",
      "qr code erstellen",
      "qr code generieren",
      "barcode generator",
      "barcode erstellen",
      "strichcode generator",
      "strichcode erstellen",
      "ean 13 generator",
      "code 128 generator",
      "data matrix code generator",
      "pdf417 generator",
      "gs1 128 generator",
      "upc generator",
      "isbn barcode generator",
    ],
  },
  {
    language: "French",
    market: "France",
    location_code: 2250,
    language_code: "fr",
    keywords: [
      "generateur qr code",
      "generateur de qr code",
      "creer qr code",
      "generateur code barre",
      "generateur de code barre",
      "generateur code barres",
      "generateur ean 13",
      "generateur code 128",
      "generateur data matrix",
      "generateur pdf417",
      "generateur gs1 128",
      "generateur upc",
      "generateur isbn",
    ],
  },
  {
    language: "Italian",
    market: "Italy",
    location_code: 2380,
    language_code: "it",
    keywords: [
      "generatore qr code",
      "creare qr code",
      "generatore codice qr",
      "generatore codice a barre",
      "generatore codici a barre",
      "generatore ean 13",
      "generatore code 128",
      "generatore data matrix",
      "generatore pdf417",
      "generatore gs1 128",
      "generatore upc",
      "generatore isbn",
    ],
  },
  {
    language: "Dutch",
    market: "Netherlands",
    location_code: 2528,
    language_code: "nl",
    keywords: [
      "qr code generator",
      "qr code maken",
      "qr code aanmaken",
      "barcode generator",
      "barcode maken",
      "streepjescode generator",
      "streepjescode maken",
      "ean 13 generator",
      "code 128 generator",
      "data matrix generator",
      "pdf417 generator",
      "gs1 128 generator",
    ],
  },
  {
    language: "Polish",
    market: "Poland",
    location_code: 2616,
    language_code: "pl",
    keywords: [
      "generator kodow qr",
      "generator kodu qr",
      "utworz kod qr",
      "generator kodow kreskowych",
      "generator kodu kreskowego",
      "generator barcode",
      "generator ean 13",
      "generator code 128",
      "generator data matrix",
      "generator pdf417",
      "generator gs1 128",
    ],
  },
  {
    language: "Turkish",
    market: "Turkey",
    location_code: 2792,
    language_code: "tr",
    keywords: [
      "qr kod olusturucu",
      "qr kod oluşturucu",
      "qr kod oluşturma",
      "karekod olusturucu",
      "karekod oluşturucu",
      "barkod olusturucu",
      "barkod oluşturucu",
      "barkod generator",
      "ean 13 oluşturucu",
      "code 128 oluşturucu",
      "data matrix oluşturucu",
      "pdf417 oluşturucu",
    ],
  },
  {
    language: "Indonesian",
    market: "Indonesia",
    location_code: 2360,
    language_code: "id",
    keywords: [
      "generator qr code",
      "pembuat qr code",
      "pembuat kode qr",
      "buat qr code",
      "generator barcode",
      "pembuat barcode",
      "buat barcode",
      "generator kode batang",
      "generator ean 13",
      "generator code 128",
      "generator data matrix",
      "generator pdf417",
    ],
  },
  {
    language: "Japanese",
    market: "Japan",
    location_code: 2392,
    language_code: "ja",
    keywords: [
      "qrコード 作成",
      "qrコード 生成",
      "qrコードジェネレーター",
      "バーコード 作成",
      "バーコード 生成",
      "バーコードジェネレーター",
      "janコード 作成",
      "ean 13 作成",
      "code128 作成",
      "data matrix 作成",
      "pdf417 作成",
    ],
  },
  {
    language: "Arabic",
    market: "Saudi Arabia",
    location_code: 2682,
    language_code: "ar",
    keywords: [
      "مولد qr code",
      "مولد رمز qr",
      "انشاء رمز qr",
      "منشئ باركود",
      "مولد باركود",
      "انشاء باركود",
      "مولد باركود ean 13",
      "مولد code 128",
      "مولد data matrix",
      "مولد pdf417",
      "مولد باركود فاتورة",
      "zatca qr code generator",
    ],
  },
];

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, headers) {
  return [headers.join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n");
}

function score(row) {
  const volume = Number(row.search_volume ?? 0);
  const cpc = Number(row.cpc ?? 0);
  const competitionIndex = Number(row.competition_index ?? 100);
  const competitionBonus = row.competition === "LOW" ? 45 : row.competition === "MEDIUM" ? 18 : -60;
  return Math.round(Math.log10(volume + 10) * 35 + Math.min(cpc, 25) * 5 - competitionIndex * 0.9 + competitionBonus);
}

async function post(pathname, payload, auth) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok || json.status_code >= 40000) {
    throw new Error(JSON.stringify(json, null, 2));
  }
  return json;
}

function summarize(rows) {
  const byLocale = new Map();
  for (const row of rows) {
    const key = `${row.language} (${row.market})`;
    const current = byLocale.get(key) ?? {
      language: row.language,
      market: row.market,
      total_volume: 0,
      low_comp_volume: 0,
      low_medium_volume: 0,
      weighted_cpc_sum: 0,
      weighted_competition_sum: 0,
      keyword_count: 0,
      low_keyword_count: 0,
      top_keywords: [],
      opportunity_score: 0,
    };
    const volume = Number(row.search_volume ?? 0);
    current.total_volume += volume;
    current.keyword_count += volume > 0 ? 1 : 0;
    if (row.competition === "LOW") {
      current.low_comp_volume += volume;
      current.low_keyword_count += volume > 0 ? 1 : 0;
    }
    if (row.competition === "LOW" || row.competition === "MEDIUM") current.low_medium_volume += volume;
    current.weighted_cpc_sum += Number(row.cpc ?? 0) * volume;
    current.weighted_competition_sum += Number(row.competition_index ?? 0) * volume;
    current.opportunity_score += row.score;
    current.top_keywords.push(row);
    byLocale.set(key, current);
  }

  return [...byLocale.values()]
    .map((item) => ({
      ...item,
      weighted_avg_cpc: item.total_volume ? Number((item.weighted_cpc_sum / item.total_volume).toFixed(2)) : 0,
      weighted_avg_competition_index: item.total_volume ? Number((item.weighted_competition_sum / item.total_volume).toFixed(1)) : 0,
      top_keywords: item.top_keywords
        .sort((a, b) => b.score - a.score || b.search_volume - a.search_volume)
        .slice(0, 8)
        .map((row) => ({
          keyword: row.keyword,
          volume: row.search_volume,
          competition: row.competition,
          competition_index: row.competition_index,
          cpc: row.cpc,
          score: row.score,
        })),
    }))
    .sort((a, b) => {
      const aRank = Math.log10(a.low_medium_volume + 10) * 45 + a.weighted_avg_cpc * 18 - a.weighted_avg_competition_index;
      const bRank = Math.log10(b.low_medium_volume + 10) * 45 + b.weighted_avg_cpc * 18 - b.weighted_avg_competition_index;
      return bRank - aRank;
    });
}

async function main() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) throw new Error("Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD");

  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const rows = [];
  for (const locale of locales) {
    const response = await post("/keywords_data/google_ads/search_volume/live", [
      {
        location_code: locale.location_code,
        language_code: locale.language_code,
        keywords: [...new Set(locale.keywords)],
      },
    ], auth);
    const task = response.tasks?.[0];
    for (const item of task.result ?? []) {
      const row = {
        language: locale.language,
        market: locale.market,
        keyword: item.keyword,
        search_volume: item.search_volume ?? 0,
        competition: item.competition ?? "",
        competition_index: item.competition_index ?? "",
        cpc: item.cpc ?? "",
      };
      rows.push({ ...row, score: score(row) });
    }
  }

  const outDir = path.resolve("seo-research/language-opportunities");
  await mkdir(outDir, { recursive: true });
  const headers = ["language", "market", "keyword", "search_volume", "competition", "competition_index", "cpc", "score"];
  const sortedRows = rows.sort((a, b) => b.score - a.score || b.search_volume - a.search_volume);
  const summary = summarize(sortedRows);

  await writeFile(path.join(outDir, "barcode-language-keywords.csv"), toCsv(sortedRows, headers));
  await writeFile(path.join(outDir, "barcode-language-summary.json"), JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({ outDir, locales: summary.slice(0, 8) }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
