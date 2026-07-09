// Vercel Serverless Function — Barcode REST API
// Endpoint after deploy: https://<project>.vercel.app/api/barcode?type=qrcode&data=Hello
// (with the rewrite in vercel.json you can also call /barcode)

const bwipjs = require("bwip-js");
const drawsvg = require("./drawing-svg");
const rateLimit = require("./_rate-limit");

// --- Access control --------------------------------------------------------
// The public /barcode endpoint is gated: first-party calls from our own
// generator are allowed; every other caller needs a valid API key. Keys are
// provisioned via the BARCODE_API_KEYS env var (comma-separated) until the
// account-based key system ships. With no keys configured, only first-party
// calls succeed — which is what we want pre-launch.
const API_KEYS = new Set(String(process.env.BARCODE_API_KEYS || "").split(",").map((s) => s.trim()).filter(Boolean));
const FIRST_PARTY_HOSTS = ["barcodeapis.com", "www.barcodeapis.com", "localhost", "127.0.0.1"];
function hostOf(u) { try { return new URL(u).hostname; } catch (e) { return ""; } }
function isAllowedHost(h) { return !!h && (FIRST_PARTY_HOSTS.includes(h) || h.endsWith(".vercel.app")); }
function isFirstParty(req) {
  // Sec-Fetch-Site is set by the browser and cannot be forged by page scripts;
  // it reliably marks the generator's own same-origin image/fetch requests.
  const sfs = req.headers["sec-fetch-site"];
  if (sfs === "same-origin" || sfs === "same-site") return true;
  const o = req.headers.origin, r = req.headers.referer;
  if (o && isAllowedHost(hostOf(o))) return true;
  if (r && isAllowedHost(hostOf(r))) return true;
  return false;
}
function apiKeyOf(req, get) {
  const h = req.headers["x-api-key"];
  return String((Array.isArray(h) ? h[0] : h) || get("key") || "").trim();
}

const ALIASES = {
  qr: "qrcode", qrcode: "qrcode", microqr: "microqrcode",
  datamatrix: "datamatrix", dm: "datamatrix", gs1datamatrix: "gs1datamatrix",
  gs1qrcode: "gs1qrcode", gs1dlqrcode: "gs1dlqrcode", gs1dldatamatrix: "gs1dldatamatrix",
  pdf417: "pdf417", micropdf417: "micropdf417",
  aztec: "azteccode", azteccode: "azteccode", maxicode: "maxicode",
  dotcode: "dotcode", hanxin: "hanxin", codablockf: "codablockf",
  mailmark: "mailmark", mailmark2d: "mailmark", royalmailmailmark2d: "mailmark",
  swissqrcode: "swissqrcode", zatcaqrcode: "qrcode", epcqrcode: "qrcode", mecard: "qrcode",
  ntin: "gs1datamatrix", ppn: "gs1datamatrix",
  hibccode39: "hibccode39", hibccode128: "hibccode128", hibcpascode39: "hibccode39", hibcpascode128: "hibccode128", hibcqrcode: "hibcqrcode", hibcpasqrcode: "hibcqrcode",
  hibcdatamatrix: "hibcdatamatrix", hibcpasdatamatrix: "hibcdatamatrix", hibcpdf417: "hibcpdf417", hibcpaspdf417: "hibcpdf417", hibccodablockf: "hibccodablockf",
  code128: "code128", code128a: "code128", code128b: "code128", code128c: "code128", code39: "code39", code39ext: "code39ext", code39fullascii: "code39ext",
  code93: "code93", code11: "code11", codabar: "rationalizedCodabar",
  itf: "interleaved2of5", itf14: "itf14", code25: "code2of5",
  flattermarken: "flattermarken", dpd: "code128", dpdlabel: "code128",
  upus10: "code128", s10: "code128", koreapost: "code128",
  msi: "msi", msi10: "msi", msi11: "msi", code32: "code32", pharmacode: "pharmacode", telepen: "telepen",
  ean13: "ean13", ean8: "ean8", ean5: "ean5", ean2: "ean2", ean14: "ean14",
  ean8composite: "ean8composite", ean13composite: "ean13composite",
  upc: "upca", upca: "upca", upce: "upce", upcacomposite: "upcacomposite", upcecomposite: "upcecomposite",
  isbn: "isbn", isbn13addon5: "isbn", issn: "issn", issnaddon2: "issn", ismn: "ismn",
  databar: "databaromni", gs1128: "gs1-128", "gs1-128": "gs1-128", "gs1-128composite": "gs1-128composite",
  "gs1-cc": "gs1-cc", gs1cc: "gs1-cc",
  databaromni: "databaromni", databarstacked: "databarstacked", databarstackedomni: "databarstackedomni",
  databartruncated: "databartruncated", databarlimited: "databarlimited", databarexpanded: "databarexpanded",
  databarexpandedstacked: "databarexpandedstacked",
  databaromnicomposite: "databaromnicomposite", databarstackedcomposite: "databarstackedcomposite",
  databarstackedomnicomposite: "databarstackedomnicomposite", databarlimitedcomposite: "databarlimitedcomposite",
  databartruncatedcomposite: "databartruncatedcomposite",
  databarexpandedcomposite: "databarexpandedcomposite", databarexpandedstackedcomposite: "databarexpandedstackedcomposite",
  uspsimpackage: "gs1-128", postnet: "postnet", planet: "planet", imb: "onecode", onecode: "onecode",
  royalmail: "royalmail", mailmark4state: "royalmail",
  daft: "daft", kix: "kix", auspost: "auspost", japanpost: "japanpost",
  identcode: "identcode", leitcode: "leitcode"
};

function clampInt(v, min, max, def) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}
function hex(c) {
  if (!c) return undefined;
  c = String(c).replace(/^#/, "").trim();
  return /^[0-9a-fA-F]{6}$/.test(c) ? c : undefined;
}
function truthy(v) {
  return v === "1" || v === "true" || v === "yes" || v === "";
}

const DEFAULT_SWISS_QR = "SPC\n0200\n1\nCH4431999123000889012\nS\nRobert Schneider AG\nRue du Lac\n1268\n2501\nBiel\nCH\n\n\n\n\n\n\n\n1949.75\nCHF\nS\nMax Mustermann\nMusterstrasse\n1\n8000\nSeldwyla\nCH\nQRR\n210000000003139471430009017\nOrder 123\nEPD";
const DEFAULT_MAILMARK_2D = "JGB 010123456712345678AB12CD30123456789012345678901";
const DEFAULT_ZATCA_QR = "AQxCQVJDT0RFIEFQSVMCDzEyMzQ1Njc4OTAxMjM0NQMUMjAyNi0wNi0zMFQxMjowMDowMFoEBjEwMC4wMAUFMTUuMDA=";
const DEFAULT_EPC_QR = "BCD\n002\n1\nSCT\nBICBANKXXXX\nBARCODE APIS\nDE89370400440532013000\nEUR1.00\n\n\nPayment";
const DEFAULT_MECARD = "MECARD:N:Doe,John;TEL:+15550100;EMAIL:john@example.com;URL:https://example.com;;";

function onlyDigits(v) {
  return String(v == null ? "" : v).replace(/\D/g, "");
}
function padDigits(v, len) {
  let d = onlyDigits(v);
  if (!d) d = "0";
  if (d.length > len) return d.slice(0, len);
  return d.padStart(len, "0");
}
function mod10CheckDigit(base) {
  const d = onlyDigits(base);
  let sum = 0;
  for (let i = d.length - 1, pos = 0; i >= 0; i--, pos++) {
    sum += parseInt(d[i], 10) * (pos % 2 === 0 ? 3 : 1);
  }
  return String((10 - (sum % 10)) % 10);
}
function eanLike(v, bodyLen) {
  const body = padDigits(v, bodyLen);
  return body + mod10CheckDigit(body);
}
function evenDigits(v, minLen) {
  let d = onlyDigits(v);
  if (!d) d = "0".repeat(minLen || 2);
  if (d.length < (minLen || 2)) d = d.padStart(minLen || 2, "0");
  if (d.length % 2) d = "0" + d;
  return d;
}
function normalizeGtin14Digits(value, limited) {
  // FINAL V10: no hardcoded replacement. Build a valid GTIN-14 from user input.
  const raw = String(value == null ? "" : value).trim();
  const primary = raw.split("|")[0].trim();
  let d = "";
  const ai = primary.match(/^\(01\)(\d+)/);
  if (ai) d = ai[1];
  else {
    d = onlyDigits(primary);
    if (d.slice(0, 2) === "01" && d.length >= 15) d = d.slice(2);
  }
  if (!d) {
    const err = new Error("DataBar / EAN-14 accepts digits only. Enter at least 1 digit; a valid GTIN-14 is generated automatically.");
    err.status = 400;
    throw err;
  }
  let body = d.length >= 13 ? d.slice(0, 13) : d.padStart(13, "0");
  let out = body + mod10CheckDigit(body);
  if (limited && !/^[01]/.test(out)) {
    body = "0" + body.slice(1);
    out = body + mod10CheckDigit(body);
  }
  return out;
}

function normalizeGtin14Ai01(value, limited) {
  return "(01)" + normalizeGtin14Digits(value, limited);
}
function normalizeGs1Ai01(value) {
  const s = String(value == null ? "" : value);
  if (/\(01\)/.test(s)) {
    return s.replace(/\(01\)(\d{13,14})/g, function (_, digits) {
      const body = digits.length >= 14 ? digits.slice(0, 13) : digits.slice(0, 13);
      return "(01)" + body + mod10CheckDigit(body);
    });
  }
  return s;
}
function normalizeGs1Ai01Value(value) {
  const s = String(value == null ? "" : value);
  if (/\(01\)\d{13,14}/.test(s)) return normalizeGs1Ai01(s);
  const d = onlyDigits(s);
  if (d.length >= 13) return "(01)" + normalizeGtin14Digits(d, false);
  return s || "(01)09521234543213";
}
function normalizeDataBarAi01(value, limited) {
  // BWIPP GS1 DataBar fixed-length variants require a solitary AI (01) value.
  // User may type either 09521234543213 or (01)09521234543213; we encode (01)+GTIN.
  return normalizeGtin14Ai01(value, !!limited);
}
function normalizeCompositeAIs(value) {
  const s = String(value == null ? "" : value).trim();
  if (!s) return "(21)ABC123";
  return s[0] === "(" ? s : "(21)" + s.replace(/^\|+/, "");
}
function normalizeDataBarComposite(value, limited) {
  const s = String(value == null ? "" : value);
  const parts = s.split("|");
  return normalizeGtin14Ai01(parts[0] || "09521234543213", !!limited) + "|" + normalizeCompositeAIs(parts[1] || "(21)ABC123");
}
function ensureComposite(main, original) {
  const s = String(original == null ? "" : original);
  const i = s.indexOf("|");
  return main + "|" + (i >= 0 ? (s.slice(i + 1) || "(21)A123") : "(21)A123");
}
function normalizeUpuS10(value) {
  const raw = String(value == null ? "" : value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = raw.replace(/[^A-Z]/g, "") || "RRID";
  const service = (letters.slice(0, 2) || "RR").padEnd(2, "R");
  const country = (letters.slice(-2) || "ID").padEnd(2, "I");
  const digits = padDigits(raw, 8);
  const weights = [8, 6, 4, 2, 3, 5, 9, 7];
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += parseInt(digits[i], 10) * weights[i];
  let cd = 11 - (sum % 11);
  if (cd === 10) cd = 0;
  if (cd === 11) cd = 5;
  return service + digits + String(cd) + country;
}
function normalizeData(inputType, bcid, data) {
  const key = String(inputType || bcid || "").toLowerCase();
  const type = String(bcid || "").toLowerCase();
  const v = String(data == null ? "" : data);
  switch (key) {
    case "ean13": return eanLike(v, 12);
    case "ean8": return eanLike(v, 7);
    case "upc":
    case "upca": return eanLike(v, 11);
    case "upce": return padDigits(v, 7);
    case "itf14": return eanLike(v, 13);
    case "ean14": return normalizeDataBarAi01(v, false);
    case "ean5": return padDigits(v, 5);
    case "ean2": return padDigits(v, 2);
    case "code128c":
    case "itf": return evenDigits(v, 2);
    case "ean8composite": return ensureComposite(eanLike(v.split("|")[0], 7), v);
    case "ean13composite": return ensureComposite(eanLike(v.split("|")[0], 12), v);
    case "upcacomposite": return ensureComposite(eanLike(v.split("|")[0], 11), v);
    case "upcecomposite": return ensureComposite(padDigits(v.split("|")[0], 7), v);
    case "gs1-128composite": {
      const parts = v.split("|");
      return normalizeGs1Ai01(parts[0] || "(01)09521234543213") + "|" + (parts[1] || "(21)ABC123");
    }
    case "databaromnicomposite":
    case "databarstackedcomposite":
    case "databarstackedomnicomposite":
    case "databartruncatedcomposite":
      return normalizeDataBarComposite(v, false);
    case "databarlimitedcomposite":
      return normalizeDataBarComposite(v, true);
    case "databarexpandedcomposite":
    case "databarexpandedstackedcomposite": {
      const parts = v.split("|");
      return normalizeGs1Ai01Value(parts[0] || "(01)09521234543213") + "|" + (parts[1] || "(21)ABC123");
    }
    case "upus10":
    case "s10": return normalizeUpuS10(v);
    case "koreapost": return padDigits(v, 5);
    case "mailmark":
    case "mailmark2d":
    case "royalmailmailmark2d": return v || DEFAULT_MAILMARK_2D;
    case "swissqrcode": return v || DEFAULT_SWISS_QR;
    case "zatcaqrcode": return v || DEFAULT_ZATCA_QR;
    case "epcqrcode": return v || DEFAULT_EPC_QR;
    case "mecard": return v || DEFAULT_MECARD;
    case "gs1qrcode":
    case "gs1datamatrix":
    case "gs1dldatamatrix":
    case "gs1dlqrcode":
    case "ntin":
    case "ppn":
    case "gs1-cc":
    case "uspsimpackage":
      return normalizeGs1Ai01(v);
    default:
      switch (type) {
        case "ean13": return eanLike(v, 12);
        case "ean8": return eanLike(v, 7);
        case "upca": return eanLike(v, 11);
        case "itf14": return eanLike(v, 13);
        case "interleaved2of5": return evenDigits(v, 2);
        case "msi": return padDigits(v, Math.max(1, onlyDigits(v).length));
        case "pharmacode": {
          let n = parseInt(onlyDigits(v), 10);
          if (!isFinite(n) || n < 3) n = 3;
          if (n > 131070) n = 131070;
          return String(n);
        }
        case "gs1datamatrix":
        case "gs1-128":
          return normalizeGs1Ai01(v);
        case "databaromni":
        case "databarstacked":
        case "databarstackedomni":
        case "databartruncated":
          return normalizeDataBarAi01(v, false);
        case "databarlimited":
          return normalizeDataBarAi01(v, true);
        case "databarexpanded":
        case "databarexpandedstacked":
          return normalizeGs1Ai01Value(v);
        default:
          return v;
      }
  }
}
function renderSvg(opts) {
  return bwipjs.render(opts, drawsvg(opts, bwipjs.FontLib));
}
function buildOpts(get) {
  const inputType = (get("type") || get("bcid") || "qrcode").toLowerCase();
  let type = ALIASES[inputType] || inputType;
  const data = get("data") != null ? get("data") : get("text");
  if (data == null || data === "") {
    const err = new Error("Missing required 'data' parameter");
    err.status = 400;
    throw err;
  }
  const opts = { bcid: type, text: normalizeData(inputType, type, data), scale: clampInt(get("scale"), 1, 20, 3) };
  if (get("height")) opts.height = clampInt(get("height"), 1, 400, 12);
  if (inputType === "code93" || type === "code93") { opts.height = Math.max(opts.height || 12, 40); opts.scale = Math.max(opts.scale || 3, 6); opts.includetext = true; opts.includecheck = true; opts.textxalign = "center"; }
  if (inputType === "micropdf417" || type === "micropdf417") opts.scale = Math.max(opts.scale || 3, 5);
  if (inputType === "microqr" || type === "microqrcode") opts.scale = Math.max(opts.scale || 3, 8);
  if (get("width")) opts.width = clampInt(get("width"), 1, 400, 0);
  if (truthy(get("includetext"))) opts.includetext = true;
  if (get("textalign")) opts.textxalign = get("textalign");
  const rotate = (get("rotate") || "").toUpperCase();
  if (["N", "R", "L", "I"].includes(rotate)) opts.rotate = rotate;
  const bar = hex(get("color") || get("barcolor"));
  if (bar) opts.barcolor = bar;
  const bg = get("bg") || get("backgroundcolor");
  if (bg && bg !== "transparent") {
    const b = hex(bg);
    if (b) opts.backgroundcolor = b;
  }
  if (get("padding")) {
    const p = clampInt(get("padding"), 0, 100, 0);
    opts.paddingwidth = p;
    opts.paddingheight = p;
  }
  if (type === "maxicode") opts.mode = clampInt(get("mode"), 2, 6, 4);
  if (type === "mailmark") opts.type = get("mailmarktype") || get("subtype") || "7";
  if (get("columns")) opts.columns = clampInt(get("columns"), 1, 30, 0);
  return opts;
}

module.exports = async (req, res) => {
  // CORS: reflect our own / preview origins only (no more wildcard). First-party
  // same-origin image & fetch calls don't rely on CORS, so the generator is
  // unaffected; this just stops other sites' browser JS from calling us.
  const origin = String(req.headers.origin || "");
  if (isAllowedHost(hostOf(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "x-api-key");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  const rl = rateLimit(req);
  res.setHeader("X-RateLimit-Limit", String(rl.limit));
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    res.status(429).json({ error: "Too many requests. Please retry in " + rl.retryAfter + "s." });
    return;
  }
  const q = req.query || {};
  const get = (k) => {
    const v = q[k];
    if (v == null) return null;
    return String(Array.isArray(v) ? v[0] : v);
  };
  // Gate: first-party generator calls pass; anyone else needs a valid API key.
  if (!isFirstParty(req) && !API_KEYS.has(apiKeyOf(req, get))) {
    res.status(401).json({ error: "An API key is required. The Barcode APIs API launches with paid plans — join the early list at https://barcodeapis.com/#pro" });
    return;
  }
  // Resolve output format: explicit ?format= wins, else infer from a .svg/.png
  // path suffix (so /barcode.svg and /barcode.png honour their contract), else png.
  const rawUrl = String(req.url || "");
  const pathExt = /\.svg(\?|$)/i.test(rawUrl) ? "svg" : (/\.png(\?|$)/i.test(rawUrl) ? "png" : null);
  const format = (get("format") || pathExt || "png").toLowerCase();
  try {
    const opts = buildOpts(get);
    if (format === "svg") {
      const svg = renderSvg(opts);
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.status(200).send(svg);
      return;
    }
    const png = await bwipjs.toBuffer(opts);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).send(png);
  } catch (e) {
    const status = e && e.status ? e.status : 400;
    const msg = typeof e === "string" ? e : (e && e.message) || "Invalid request";
    res.status(status).json({ error: msg });
  }
};
