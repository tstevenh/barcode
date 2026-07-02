(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ---- i18n state ----
  const DICT = window.I18N || { meta: { langs: [{ code: "en", label: "English" }] }, ui: { en: {} }, hints: { en: {} } };
  const AVAILABLE = DICT.meta.langs.map((l) => l.code);
  function detectLang() {
    const saved = localStorage.getItem("bcs_lang");
    if (saved && AVAILABLE.includes(saved)) return saved;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return AVAILABLE.includes(nav) ? nav : "en";
  }
  let lang = detectLang();
  function T(key) { const d = DICT.ui[lang] || DICT.ui.en; return (key in d) ? d[key] : (DICT.ui.en[key] != null ? DICT.ui.en[key] : key); }
  function TF(key, n) { return T(key).replace("{n}", n); }
  function hintFor(id) { const h = DICT.hints[lang] || DICT.hints.en; return h[id] || DICT.hints.en[id] || ""; }

  // ---- Symbology catalog ----
  // engine: jsbarcode | qr | bwip ; kind: 2d | linear | postal | ean ; bcid defaults to id ; def = default data
  // Shared with the page builder via js/catalog.js; inline copy below is a fallback.
  const CATALOG = (typeof window !== "undefined" && window.BARCODE_CATALOG) || [
    { groupKey: "grp2D", items: [
      { id: "qrcode",        name: "QR Code",                       engine: "qr",   kind: "2d", bcid: "qrcode", def: "https://example.com" },
      { id: "gs1qrcode",     name: "GS1 QR Code",                   engine: "bwip", kind: "2d", def: "(01)09521234543213(17)261231" },
      { id: "gs1dlqrcode",   name: "GS1 Digital Link QR Code",      engine: "bwip", kind: "2d", def: "https://id.gs1.org/01/09521234543213/10/ABC123" },
      { id: "gs1dldatamatrix", name: "GS1 Digital Link Data Matrix", engine: "bwip", kind: "2d", def: "https://id.gs1.org/01/09521234543213/10/ABC123" },
      { id: "datamatrix",    name: "Data Matrix",                   engine: "bwip", kind: "2d", def: "Data Matrix" },
      { id: "gs1datamatrix", name: "GS1 Data Matrix",               engine: "bwip", kind: "2d", def: "(01)09521234543213(17)261231" },
      { id: "pdf417",        name: "PDF417",                        engine: "bwip", kind: "2d", def: "PDF417 Barcode" },
      { id: "micropdf417",   name: "MicroPDF417",                   engine: "bwip", kind: "2d", def: "MicroPDF417" },
      { id: "azteccode",     name: "Aztec",                         engine: "bwip", kind: "2d", def: "Aztec Code" },
      { id: "microqr",       name: "Micro QR",                      engine: "bwip", kind: "2d", bcid: "microqrcode", def: "12345" },
      { id: "maxicode",      name: "MaxiCode",                      engine: "bwip", kind: "2d", def: "MaxiCode" },
      { id: "dotcode",       name: "DotCode",                       engine: "bwip", kind: "2d", def: "DotCode" },
      { id: "hanxin",        name: "Han Xin Code",                  engine: "bwip", kind: "2d", def: "Han Xin" },
      { id: "codablockf",    name: "Codablock-F",                   engine: "bwip", kind: "2d", def: "Codablock-F" },
      { id: "mailmark2d",    name: "Royal Mail Mailmark 2D",        engine: "bwip", kind: "2d", bcid: "mailmark", def: "JGB 010123456712345678AB12CD30123456789012345678901" },
      { id: "swissqrcode",   name: "Swiss QR Code",                 engine: "bwip", kind: "2d", def: "SPC\n0200\n1\nCH4431999123000889012\nS\nRobert Schneider AG\nRue du Lac\n1268\n2501\nBiel\nCH\n\n\n\n\n\n\n\n1949.75\nCHF\nS\nMax Mustermann\nMusterstrasse\n1\n8000\nSeldwyla\nCH\nQRR\n210000000003139471430009017\nOrder 123\nEPD" },
      { id: "zatcaqrcode",   name: "ZATCA QR Code",                 engine: "bwip", kind: "2d", bcid: "qrcode", def: "AQlMQVcgU1RPUkUCDzEyMzQ1Njc4OTAxMjM0NQMUMjAyNi0wNi0zMFQxMjowMDowMFoEBjEwMC4wMAUFMTUuMDA=" },
      { id: "epcqrcode",     name: "EPC QR Code",                   engine: "bwip", kind: "2d", bcid: "qrcode", def: "BCD\n002\n1\nSCT\nBICBANKXXXX\nLAW STORE\nDE89370400440532013000\nEUR1.00\n\n\nPayment" },
      { id: "mecard",        name: "MeCard",                        engine: "bwip", kind: "2d", bcid: "qrcode", def: "MECARD:N:Doe,John;TEL:+15550100;EMAIL:john@example.com;URL:https://example.com;;" },
      { id: "ntin",          name: "NTIN Code",                     engine: "bwip", kind: "2d", bcid: "gs1datamatrix", def: "(01)09521234543213(17)261231(10)LOT123(21)SERIAL123" },
      { id: "ppn",           name: "PPN Code",                      engine: "bwip", kind: "2d", bcid: "gs1datamatrix", def: "(01)09521234543213(17)261231(10)LOT123(21)SERIAL123" },
      { id: "hibcqrcode",    name: "HIBC LIC QR Code",              engine: "bwip", kind: "2d", def: "+A123BJC5D6E71" },
      { id: "hibcdatamatrix", name: "HIBC LIC Data Matrix",          engine: "bwip", kind: "2d", def: "+A123BJC5D6E71" },
      { id: "hibcpdf417",    name: "HIBC LIC PDF417",               engine: "bwip", kind: "2d", def: "+A123BJC5D6E71" },
      { id: "hibccodablockf", name: "HIBC LIC Codablock-F",         engine: "bwip", kind: "2d", def: "+A123BJC5D6E71" },
      { id: "hibcpasqrcode", name: "HIBC PAS QR Code",              engine: "bwip", kind: "2d", bcid: "hibcqrcode", def: "+$$52001510X3" },
      { id: "hibcpasdatamatrix", name: "HIBC PAS Data Matrix",      engine: "bwip", kind: "2d", bcid: "hibcdatamatrix", def: "+$$52001510X3" },
      { id: "hibcpaspdf417", name: "HIBC PAS PDF417",               engine: "bwip", kind: "2d", bcid: "hibcpdf417", def: "+$$52001510X3" }
    ]},
    { groupKey: "grpLinear", items: [
      { id: "CODE128",        name: "Code 128",            engine: "jsbarcode", kind: "linear", def: "Barcode Studio" },
      { id: "CODE128A",       name: "Code 128 A",          engine: "jsbarcode", kind: "linear", def: "BARCODE 128A" },
      { id: "CODE128B",       name: "Code 128 B",          engine: "jsbarcode", kind: "linear", def: "Barcode 128B" },
      { id: "CODE128C",       name: "Code 128 C",          engine: "jsbarcode", kind: "linear", def: "12345678" },
      { id: "CODE39",         name: "Code 39",             engine: "jsbarcode", kind: "linear", def: "CODE 39" },
      { id: "code39ext",      name: "Code-39 Full ASCII",  engine: "bwip",      kind: "linear", def: "Code-39 Full ASCII!" },
      { id: "code93",         name: "Code 93",             engine: "bwip",      kind: "linear", def: "ABC1234567" },
      { id: "code11",         name: "Code 11",             engine: "bwip",      kind: "linear", def: "1234567890" },
      { id: "code25",         name: "Standard 2 of 5",     engine: "bwip",      kind: "linear", bcid: "code2of5", def: "1234567890" },
      { id: "flattermarken",  name: "Flattermarken",       engine: "bwip",      kind: "linear", def: "12345" },
      { id: "ITF",            name: "Interleaved 2 of 5",  engine: "jsbarcode", kind: "linear", def: "1234567890" },
      { id: "ITF14",          name: "ITF-14",              engine: "jsbarcode", kind: "linear", def: "1234567890123" },
      { id: "industrial2of5", name: "Industrial 2 of 5",   engine: "bwip",      kind: "linear", def: "1234567890" },
      { id: "iata2of5",       name: "IATA 2 of 5",         engine: "bwip",      kind: "linear", def: "1234567890" },
      { id: "matrix2of5",     name: "Matrix 2 of 5",       engine: "bwip",      kind: "linear", def: "1234567890" },
      { id: "dpdlabel",       name: "DPD Barcode / DPD Parcel Label", engine: "bwip", kind: "linear", bcid: "code128", def: "0101234567890128" },
      { id: "upus10",         name: "UPU S10",             engine: "bwip",      kind: "linear", bcid: "code128", def: "RR123456785ID" },
      { id: "MSI",            name: "MSI",                 engine: "jsbarcode", kind: "linear", def: "123456" },
      { id: "MSI10",          name: "MSI Mod 10",          engine: "jsbarcode", kind: "linear", def: "123456" },
      { id: "MSI11",          name: "MSI Mod 11",          engine: "jsbarcode", kind: "linear", def: "123456" },
      { id: "code32",         name: "Code 32 (Italian)",   engine: "bwip",      kind: "linear", def: "01234567" },
      { id: "pharmacode",     name: "Pharmacode",          engine: "jsbarcode", kind: "linear", def: "1234" },
      { id: "pharmacode2",    name: "Pharmacode 2-track",  engine: "bwip",      kind: "linear", def: "1234" },
      { id: "codabar",        name: "Codabar",             engine: "jsbarcode", kind: "linear", def: "A12345678A" },
      { id: "telepen",        name: "Telepen",             engine: "bwip",      kind: "linear", def: "Telepen" },
      { id: "channelcode",    name: "Channel Code",        engine: "bwip",      kind: "linear", def: "1234" },
      { id: "bc412",          name: "BC412",               engine: "bwip",      kind: "linear", def: "ABC123" },
      { id: "pzn",            name: "PZN (Pharma)",        engine: "bwip",      kind: "linear", def: "123456" },
      { id: "gs1-128",        name: "GS1-128",             engine: "bwip",      kind: "linear", def: "(01)09521234543213" },
      { id: "gs1-128composite", name: "GS1-128 Composite Symbology", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "hibccode39",     name: "HIBC LIC Code 39",    engine: "bwip",      kind: "linear", def: "+A123BJC5D6E71" },
      { id: "hibccode128",    name: "HIBC LIC Code 128",   engine: "bwip",      kind: "linear", def: "+A123BJC5D6E71" },
      { id: "hibcpascode39",  name: "HIBC PAS Code 39",    engine: "bwip",      kind: "linear", bcid: "hibccode39",  def: "+$$52001510X3" },
      { id: "hibcpascode128", name: "HIBC PAS Code 128",   engine: "bwip",      kind: "linear", bcid: "hibccode128", def: "+$$52001510X3" }
    ]},
    { groupKey: "grpGS1", items: [
      { id: "databaromni",        name: "DataBar Omni",          engine: "bwip", kind: "linear", def: "(01)09521234543213" },
      { id: "databarstacked",     name: "DataBar Stacked",       engine: "bwip", kind: "linear", def: "(01)09521234543213" },
      { id: "databarstackedomni", name: "DataBar Stacked Omni",  engine: "bwip", kind: "linear", def: "(01)09521234543213" },
      { id: "databartruncated",   name: "DataBar Truncated",     engine: "bwip", kind: "linear", def: "(01)09521234543213" },
      { id: "databarlimited",     name: "DataBar Limited",       engine: "bwip", kind: "linear", def: "(01)09521234543213" },
      { id: "databarexpanded",    name: "DataBar Expanded",      engine: "bwip", kind: "linear", def: "(01)09521234543213" },
      { id: "databarexpandedstacked", name: "GS1 DataBar Expanded Stacked", engine: "bwip", kind: "linear", def: "(01)09521234543213" },
      { id: "databaromnicomposite", name: "GS1 DataBar Composite", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "databarstackedcomposite", name: "GS1 DataBar Stacked Composite", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "databarstackedomnicomposite", name: "GS1 DataBar Stacked Omni Composite", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "databarlimitedcomposite", name: "GS1 DataBar Limited Composite", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "databartruncatedcomposite", name: "GS1 DataBar Truncated Composite", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "databarexpandedcomposite", name: "GS1 DataBar Expanded Composite", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "databarexpandedstackedcomposite", name: "GS1 DataBar Expanded Stacked Composite", engine: "bwip", kind: "linear", def: "(01)09521234543213|(21)ABC123" },
      { id: "gs1-cc", name: "GS1 Composite 2D Component", engine: "bwip", kind: "linear", def: "(01)09521234543213(17)261231" }
    ]},
    { groupKey: "grpPostal", items: [
      { id: "postnet",   name: "USPS POSTNET",          engine: "bwip", kind: "postal", def: "12345" },
      { id: "planet",    name: "USPS PLANET",           engine: "bwip", kind: "postal", def: "12345678901" },
      { id: "onecode",   name: "USPS Intelligent Mail", engine: "bwip", kind: "postal", def: "01234567094987654321" },
      { id: "uspsimpackage", name: "USPS IM Package",    engine: "bwip", kind: "postal", bcid: "gs1-128", def: "(420)12345(92)1234567890123456789012" },
      { id: "royalmail", name: "Royal Mail 4-State",    engine: "bwip", kind: "postal", def: "LE28HS9Z" },
      { id: "mailmark4state", name: "Royal Mail Mailmark 4-State", engine: "bwip", kind: "postal", bcid: "royalmail", def: "LE28HS9Z" },
      { id: "daft",      name: "DAFT",                  engine: "bwip", kind: "postal", def: "DAFTADFTADFT" },
      { id: "kix",       name: "Royal Dutch KIX",       engine: "bwip", kind: "postal", def: "2500GG30250" },
      { id: "auspost",   name: "Australia Post",        engine: "bwip", kind: "postal", def: "5956439111ABA" },
      { id: "japanpost", name: "Japan Post",            engine: "bwip", kind: "postal", def: "1310022" },
      { id: "koreapost", name: "Korean Postal Authority Code", engine: "bwip", kind: "postal", bcid: "code128", def: "12345" },
      { id: "identcode", name: "Deutsche Post Identcode", engine: "bwip", kind: "postal", def: "563102430313" },
      { id: "leitcode",  name: "Deutsche Post Leitcode",  engine: "bwip", kind: "postal", def: "21348075016401" }
    ]},
    { groupKey: "grpEan", items: [
      { id: "EAN13", name: "EAN-13",       engine: "jsbarcode", kind: "ean", def: "123456789012" },
      { id: "EAN8",  name: "EAN-8",        engine: "jsbarcode", kind: "ean", def: "1234567" },
      { id: "EAN5",  name: "EAN-5 add-on", engine: "jsbarcode", kind: "ean", def: "12345" },
      { id: "EAN2",  name: "EAN-2 add-on", engine: "jsbarcode", kind: "ean", def: "12" },
      { id: "UPC",   name: "UPC-A",        engine: "jsbarcode", kind: "ean", def: "12345678901" },
      { id: "UPCE",  name: "UPC-E",        engine: "jsbarcode", kind: "ean", def: "123456" },
      { id: "ean14", name: "EAN-14",       engine: "bwip",      kind: "ean", def: "(01)09521234543213" },
      { id: "ean8composite", name: "EAN-8 Composite", engine: "bwip", kind: "ean", def: "1234567|(21)A123" },
      { id: "ean13composite", name: "EAN-13 Composite", engine: "bwip", kind: "ean", def: "123456789012|(21)A123" },
      { id: "upcacomposite", name: "UPC-A Composite", engine: "bwip", kind: "ean", def: "12345678901|(21)A123" },
      { id: "upcecomposite", name: "UPC-E Composite", engine: "bwip", kind: "ean", def: "1234567|(21)A123" },
      { id: "isbn",  name: "ISBN",         engine: "bwip",      kind: "linear", def: "978-1-56581-231-4" },
      { id: "isbn13addon5", name: "ISBN-13 + 5 add-on", engine: "bwip", kind: "linear", bcid: "isbn", def: "978-1-56581-231-4 90000" },
      { id: "issn",  name: "ISSN",         engine: "bwip",      kind: "linear", def: "0317-8471" },
      { id: "issnaddon2", name: "ISSN + 2 add-on", engine: "bwip", kind: "linear", bcid: "issn", def: "0317-8471 05" },
      { id: "ismn",  name: "ISMN",         engine: "bwip",      kind: "linear", def: "979-0-2600-0043-8" }
    ]}
  ];

  const DEFAULTS = {};
  CATALOG.forEach((g) => g.items.forEach((it) => { DEFAULTS[it.id] = it.def; }));

  const FORMAT_MAP = {
    CODE128: "CODE128", CODE128A: "CODE128A", CODE128B: "CODE128B", CODE128C: "CODE128C",
    CODE39: "CODE39", ITF: "ITF", ITF14: "ITF14", MSI: "MSI", MSI10: "MSI10", MSI11: "MSI11",
    pharmacode: "pharmacode", codabar: "codabar",
    EAN13: "EAN13", EAN8: "EAN8", EAN5: "EAN5", EAN2: "EAN2", UPC: "UPC", UPCE: "UPCE"
  };

  let current = "CODE128";
  let zoom = 1;
  let lastSvg = null;
  let lastCanvas = null;
  let lastApiPng = null;
  let lastApiSvg = null;
  let batchItems = [];
  let normalizeNotice = "";

  function findItem(id) { for (const g of CATALOG) for (const it of g.items) if (it.id === id) return it; return null; }
  function engineOf(id) { const it = findItem(id); return it ? it.engine : "jsbarcode"; }
  function itemKind(id) { const it = findItem(id); return it ? it.kind : "linear"; }
  function bcidOf(id) { const it = findItem(id); return (it && it.bcid) ? it.bcid : id; }
  function bwipExtraOptions(id) {
    if (id === "mailmark2d") return { type: "7" };
    return {};
  }
  function is2D(id) { const it = findItem(id); return !!it && (it.engine === "qr" || (it.engine === "bwip" && it.kind === "2d")); }

  // ---- Sidebar ----
  function buildSidebar(filter) {
    const list = $("typeList"); list.innerHTML = "";
    const f = (filter || "").trim().toLowerCase();
    CATALOG.forEach((grp) => {
      const matches = grp.items.filter((it) => !f || it.name.toLowerCase().includes(f) || it.id.toLowerCase().includes(f));
      if (!matches.length) return;
      const gl = document.createElement("div"); gl.className = "type-group-label"; gl.textContent = T(grp.groupKey); list.appendChild(gl);
      matches.forEach((it) => {
        const b = document.createElement("button");
        b.className = "type-item" + (it.id === current ? " active" : "");
        b.textContent = it.name; b.dataset.id = it.id;
        b.addEventListener("click", () => selectType(it.id));
        list.appendChild(b);
      });
    });
  }

  function updateHint() { $("typeHint").textContent = hintFor(current); }

  function selectType(id) {
    const prev = current; current = id;
    const item = findItem(id);
    $("activeType").textContent = item ? item.name : id;
    updateHint();
    if ($("data").value === DEFAULTS[prev]) $("data").value = DEFAULTS[id] || "";
    const eng = engineOf(id);
    const kind = itemKind(id);
    $("qrProps").hidden = (id !== "qrcode");
    $("twoDProps").hidden = (eng !== "bwip");
    $("linearProps").hidden = (eng !== "jsbarcode");
    $("pdfColsRow").style.display = (id === "pdf417") ? "" : "none";
    $("bwipHeightRow").style.display = (eng === "bwip" && (kind === "linear" || kind === "postal")) ? "" : "none";
    $("bwipTextRow").style.display = (eng === "bwip" && kind === "linear") ? "" : "none";
    const twoD = is2D(id);
    $("contentTypeRow").hidden = !twoD;
    if (!twoD) $("ctSelect").value = "text";
    document.querySelectorAll(".type-item").forEach((el) => el.classList.toggle("active", el.dataset.id === id));
    applyContentType();
  }

  function setStatus(msg, cls) {
    const s = $("status");
    let text = msg || "";
    if (cls === "ok" && normalizeNotice) text += " • " + normalizeNotice;
    s.textContent = text;
    s.className = "prop-note" + (cls ? " " + cls : "");
  }
  function bgColor() { return $("transparent").checked ? "transparent" : $("bg").value; }
  function hex(c) { return (c || "#000000").replace("#", ""); }

  // ---- Data normalizer ----
  // Several symbologies are not free-form text.  They require fixed digit
  // lengths and a check digit.  Normalizing here prevents half-generated or
  // invalid barcodes when users paste values with spaces, dashes, or a wrong
  // checksum.
  function onlyDigits(v) { return String(v == null ? "" : v).replace(/\D/g, ""); }
  function rightPadDigits(d, len) {
    d = onlyDigits(d);
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
  function normalizeEanLike(value, bodyLen) {
    const body = rightPadDigits(onlyDigits(value), bodyLen);
    return body + mod10CheckDigit(body);
  }
  function normalizeFixedDigits(value, len) { return rightPadDigits(value, len); }
  function normalizeEvenDigits(value, minLen) {
    let d = onlyDigits(value);
    if (!d) d = "0".repeat(minLen || 2);
    if (d.length < (minLen || 2)) d = d.padStart(minLen || 2, "0");
    if (d.length % 2) d = "0" + d;
    return d;
  }
  function normalizeGtin14Digits(value, limited) {
    // FINAL V10: DataBar/EAN-14 must be valid GTIN-14 for BWIPP.
    // User input is never replaced by a hardcoded sample. We extract digits from
    // the user's value, strip an optional GS1 AI 01 prefix, then make a valid
    // 14-digit GTIN by recomputing the final check digit.
    const raw = String(value == null ? "" : value).trim();
    const primary = raw.split("|")[0].trim();
    let d = "";
    const ai = primary.match(/^\(01\)(\d+)/);
    if (ai) d = ai[1];
    else {
      d = onlyDigits(primary);
      // Many users paste 01 + GTIN as plain digits. Treat only that exact case
      // as AI 01, e.g. 0109521234543213 -> 09521234543213.
      if (d.slice(0, 2) === "01" && d.length >= 15) d = d.slice(2);
    }
    if (!d) throw new Error(T("errDataBarDigits"));

    // Make a 13-digit body, then calculate the 14th check digit.
    // If user typed 14 digits, the last digit is treated as old check digit and
    // recalculated so the barcode is always valid. If user typed >14 digits,
    // extra digits cannot exist in EAN-14/DataBar, so they are not encoded; use
    // Code 128 when the exact long number must be preserved.
    let body = d.length >= 13 ? d.slice(0, 13) : d.padStart(13, "0");
    let out = body + mod10CheckDigit(body);

    // DataBar Limited accepts GTINs with packaging indicator 0 or 1 only.
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
    // Composite DataBar expects the primary part to start with an AI such as `(01)`.
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
    const digits = normalizeFixedDigits(raw, 8);
    const weights = [8, 6, 4, 2, 3, 5, 9, 7];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(digits[i], 10) * weights[i];
    let cd = 11 - (sum % 11);
    if (cd === 10) cd = 0;
    if (cd === 11) cd = 5;
    return service + digits + String(cd) + country;
  }
  function normalizeForCurrent(value) {
    const v = String(value == null ? "" : value);
    switch (current) {
      case "EAN13": return normalizeEanLike(v, 12);
      case "EAN8": return normalizeEanLike(v, 7);
      case "UPC": return normalizeEanLike(v, 11);
      case "ITF14": return normalizeEanLike(v, 13);
      case "EAN5": return normalizeFixedDigits(v, 5);
      case "EAN2": return normalizeFixedDigits(v, 2);
      case "CODE128C":
      case "ITF": return normalizeEvenDigits(v, 2);
      case "MSI":
      case "MSI10":
      case "MSI11": return normalizeFixedDigits(v, Math.max(1, onlyDigits(v).length));
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
      case "ean14": return normalizeDataBarAi01(v, false);
      case "ean8composite": return ensureComposite(normalizeEanLike(v.split("|")[0], 7), v);
      case "ean13composite": return ensureComposite(normalizeEanLike(v.split("|")[0], 12), v);
      case "upcacomposite": return ensureComposite(normalizeEanLike(v.split("|")[0], 11), v);
      case "upcecomposite": return ensureComposite(normalizeFixedDigits(v.split("|")[0], 7), v);
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
      case "upus10": return normalizeUpuS10(v);
      case "uspsimpackage": return normalizeGs1Ai01(v);
      case "koreapost": return normalizeFixedDigits(v, 5);
      case "gs1qrcode":
      case "gs1dldatamatrix":
      case "gs1dlqrcode":
      case "ntin":
      case "ppn":
      case "gs1-cc":
        return normalizeGs1Ai01(v);
      case "mailmark2d": return v || DEFAULTS.mailmark2d;
      case "swissqrcode": return v || DEFAULTS.swissqrcode;
      default:
        return v;
    }
  }

  // ---- Smart content (content templates) ----
  function currentCt() { return is2D(current) ? $("ctSelect").value : "text"; }
  function applyContentType() {
    const ct = currentCt();
    const plain = (ct === "text" || ct === "url");
    $("data").style.display = plain ? "" : "none";
    $("builderFields").hidden = plain;
    document.querySelectorAll("#builderFields .ct-block").forEach((b) => { b.style.display = (b.dataset.ct === ct) ? "" : "none"; });
    const seq = document.querySelector(".seq"); if (seq) seq.style.display = plain ? "" : "none";
    render();
  }
  function wifiEsc(s) { return (s || "").replace(/([\\;,:"])/g, "\\$1"); }
  function icsDate(v) { if (!v) return ""; const d = v.replace(/[-:]/g, ""); return d.length === 13 ? d + "00" : d; }
  function getEncodedValue() {
    const ct = currentCt();
    if (ct === "text" || ct === "url") return $("data").value;
    if (ct === "wifi") {
      const enc = $("wEnc").value;
      const ssid = wifiEsc($("wSsid").value);
      const pass = wifiEsc($("wPass").value);
      const hidden = $("wHidden").checked ? "H:true;" : "";
      return "WIFI:T:" + enc + ";S:" + ssid + ";P:" + (enc === "nopass" ? "" : pass) + ";" + hidden + ";";
    }
    if (ct === "vcard") {
      const f = $("vFirst").value, l = $("vLast").value;
      return "BEGIN:VCARD\nVERSION:3.0\nN:" + l + ";" + f +
        "\nFN:" + (f + " " + l).trim() +
        "\nORG:" + $("vOrg").value +
        "\nTITLE:" + $("vTitle").value +
        "\nTEL:" + $("vPhone").value +
        "\nEMAIL:" + $("vEmail").value +
        "\nURL:" + $("vUrl").value +
        "\nADR:;;" + $("vAddr").value +
        "\nEND:VCARD";
    }
    if (ct === "email") {
      const to = $("eTo").value, q = [];
      if ($("eSub").value) q.push("subject=" + encodeURIComponent($("eSub").value));
      if ($("eBody").value) q.push("body=" + encodeURIComponent($("eBody").value));
      return "mailto:" + to + (q.length ? "?" + q.join("&") : "");
    }
    if (ct === "sms") return "SMSTO:" + $("sNum").value + ":" + $("sMsg").value;
    if (ct === "tel") return "tel:" + $("tNum").value;
    if (ct === "geo") return "geo:" + $("gLat").value + "," + $("gLng").value;
    if (ct === "event") {
      return "BEGIN:VEVENT\nSUMMARY:" + $("cTitle").value +
        "\nLOCATION:" + $("cLoc").value +
        "\nDTSTART:" + icsDate($("cStart").value) +
        "\nDTEND:" + icsDate($("cEnd").value) +
        "\nDESCRIPTION:" + $("cDesc").value +
        "\nEND:VEVENT";
    }
    return $("data").value;
  }

  // ---- JsBarcode (linear) ----
  function makeLinearSvg(value) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, value, {
      format: FORMAT_MAP[current] || "CODE128",
      lineColor: $("fg").value, background: bgColor(),
      width: parseFloat($("barWidth").value), height: parseInt($("barHeight").value, 10),
      displayValue: $("displayValue").checked, fontSize: parseInt($("fontSize").value, 10),
      textAlign: $("textAlign").value, margin: parseInt($("margin").value, 10),
      valid: function (v) { if (!v) throw new Error(T("errInvalid")); }
    });
    return svg;
  }

  // ---- QRCode ----
  function qrCanvasHasPixels(canvas) {
    return !!(canvas && canvas.width > 0 && canvas.height > 0);
  }
  function qrBwipOpts(value) {
    const size = parseInt($("qrSize").value, 10) || 300;
    const pad = Math.max(0, Math.round(parseInt($("margin").value, 10) / 8));
    const opts = {
      bcid: "qrcode", text: value,
      scale: Math.max(2, Math.min(12, Math.round(size / 90))),
      paddingwidth: pad, paddingheight: pad,
      eclevel: $("qrEcc").value,
      barcolor: hex($("fg").value)
    };
    if (!$("transparent").checked) opts.backgroundcolor = hex($("bg").value);
    return opts;
  }
  function makeQrCanvas(value, cb) {
    const canvas = document.createElement("canvas");
    let finished = false;
    function done(err, out) { if (finished) return; finished = true; cb(err, out); }
    function fallback(err0) {
      try {
        if (typeof bwipjs === "undefined" || typeof bwipjs.toCanvas !== "function") throw err0 || new Error("QR engine unavailable");
        const fb = document.createElement("canvas");
        bwipjs.toCanvas(fb, qrBwipOpts(value));
        if (!qrCanvasHasPixels(fb)) throw new Error("QR fallback produced an empty canvas");
        done(null, fb);
      } catch (e) {
        done(e || err0 || new Error("QR generation failed"), null);
      }
    }
    try {
      if (typeof QRCode === "undefined" || !QRCode || typeof QRCode.toCanvas !== "function") return fallback(new Error("QRCode library not loaded"));
      QRCode.toCanvas(canvas, value, {
        width: parseInt($("qrSize").value, 10),
        margin: Math.max(0, Math.round(parseInt($("margin").value, 10) / 8)),
        errorCorrectionLevel: $("qrEcc").value,
        color: { dark: $("fg").value, light: $("transparent").checked ? "#0000" : $("bg").value }
      }, (err) => {
        if (err || !qrCanvasHasPixels(canvas)) return fallback(err || new Error("QR canvas empty"));
        done(null, canvas);
      });
      setTimeout(() => {
        if (!finished) {
          if (qrCanvasHasPixels(canvas)) done(null, canvas);
          else fallback(new Error("QR render timeout"));
        }
      }, 2500);
    } catch (e) { fallback(e); }
  }
  function makeQrSvg(value, cb) {
    function fallback(err0) {
      try {
        if (typeof bwipjs !== "undefined" && typeof bwipjs.toSVG === "function") return cb(null, bwipjs.toSVG(qrBwipOpts(value)));
      } catch (e) { return cb(e || err0); }
      cb(err0 || new Error("QR SVG engine unavailable"));
    }
    try {
      if (typeof QRCode === "undefined" || !QRCode || typeof QRCode.toString !== "function") return fallback(new Error("QRCode SVG library not loaded"));
      QRCode.toString(value, {
        type: "svg", width: parseInt($("qrSize").value, 10),
        margin: Math.max(0, Math.round(parseInt($("margin").value, 10) / 8)),
        errorCorrectionLevel: $("qrEcc").value,
        color: { dark: $("fg").value, light: $("transparent").checked ? "#0000" : $("bg").value }
      }, (err, svg) => err || !svg ? fallback(err || new Error("QR SVG empty")) : cb(null, svg));
    } catch (e) { fallback(e); }
  }

  // ---- bwip-js (Data Matrix / PDF417 / Aztec / linear / postal / GS1 / …) ----
  function bwipOpts(value) {
    const pad = Math.max(0, Math.round(parseInt($("margin").value, 10) / 4));
    const kind = itemKind(current);
    const opts = {
      bcid: bcidOf(current), text: value,
      scale: parseInt($("tdScale").value, 10),
      paddingwidth: pad, paddingheight: pad,
      barcolor: hex($("fg").value)
    };
    if (!$("transparent").checked) opts.backgroundcolor = hex($("bg").value);
    if (kind === "linear" || kind === "postal") { opts.height = parseInt($("bwipHeight").value, 10) || 12; }
    if (current === "code93") { opts.height = Math.max(opts.height || 12, 40); opts.scale = Math.max(opts.scale || 4, 6); opts.includetext = true; opts.includecheck = true; opts.textxalign = "center"; }
    if (current === "micropdf417") { opts.scale = Math.max(opts.scale || 4, 5); }
    if (current === "microqr") { opts.scale = Math.max(opts.scale || 4, 8); }
    if (kind === "linear" && $("bwipText").checked) { opts.includetext = true; opts.textxalign = "center"; }
    if (current === "pdf417") { const cols = parseInt($("pdfCols").value, 10); if (cols > 0) opts.columns = cols; }
    if (current === "maxicode") { opts.mode = 4; }
    Object.assign(opts, bwipExtraOptions(current));
    return opts;
  }
  function makeBwipCanvas(value) {
    const canvas = document.createElement("canvas");
    bwipjs.toCanvas(canvas, bwipOpts(value));
    return canvas;
  }
  function makeBwipSvg(value) {
    if (typeof bwipjs.toSVG !== "function") return null;
    try { return bwipjs.toSVG(bwipOpts(value)); } catch (e) { return null; }
  }

  // ---- Sequence ----
  function buildSequence(base) {
    const count = Math.min(100, Math.max(2, parseInt($("seqCount").value, 10) || 2));
    const start = parseInt($("seqStart").value, 10) || 0;
    const prefix = $("seqPrefix").value || "";
    const pad = Math.max(0, parseInt($("seqPad").value, 10) || 0);
    const out = [];
    for (let i = 0; i < count; i++) {
      const num = String(start + i).padStart(pad, "0");
      out.push(prefix ? prefix + num : (base ? base + num : num));
    }
    return out;
  }

  // ---- Render ----
  function render() {
    const preview = $("preview");
    preview.innerHTML = ""; preview.classList.remove("barcode-batch");
    lastSvg = null; lastCanvas = null; lastApiPng = null; lastApiSvg = null; batchItems = []; $("dlZip").hidden = true;
    const ct = currentCt();
    const plain = (ct === "text" || ct === "url");
    const encoded = getEncodedValue();
    const seq = $("seqEnable").checked && plain;
    if (!encoded && !seq) { showError(T("stEnterData")); return; }
    let values;
    normalizeNotice = "";
    try {
      values = (seq ? buildSequence($("data").value) : [encoded]).map(normalizeForCurrent);
      if (!seq && String(values[0]) !== String(encoded)) {
        normalizeNotice = "Encoded valid: " + values[0];
      }
    } catch (e) {
      showError((e && e.message) || T("errInvalid"));
      return;
    }
    const eng = engineOf(current);
    if (eng === "qr") renderQrList(values);
    else if (eng === "bwip") renderBwipList(values);
    else renderLinearList(values);
    popPreview();
  }

  function popPreview() { const el = $("preview"); el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  function showError(msg) {
    const p = $("preview");
    p.innerHTML = "";
    const d = document.createElement("div");
    d.className = "error-msg";
    d.textContent = "⚠ " + (msg || "");
    p.appendChild(d);
    setStatus(msg, "err");
  }

  function hasApiFallback() { return !!window.BARCODE_HAS_API && typeof location !== "undefined" && location.protocol.indexOf("http") === 0; }
  function apiBarcodeUrl(value, format) {
    const qs = new URLSearchParams();
    qs.set("type", current);
    qs.set("data", value);
    qs.set("format", format || "png");
    qs.set("scale", String(parseInt($("tdScale").value, 10) || 3));
    qs.set("padding", String(Math.max(0, Math.round(parseInt($("margin").value, 10) / 4))));
    qs.set("color", $("fg").value.replace("#", ""));
    if (!$("transparent").checked) qs.set("bg", $("bg").value.replace("#", ""));
    const kind = itemKind(current);
    if (kind === "linear" || kind === "postal") qs.set("height", String(parseInt($("bwipHeight").value, 10) || 12));
    if ((kind === "linear" || engineOf(current) === "jsbarcode") && $("bwipText") && $("bwipText").checked) qs.set("includetext", "1");
    if (current === "pdf417") { const cols = parseInt($("pdfCols").value, 10); if (cols > 0) qs.set("columns", String(cols)); }
    return "/api/barcode?" + qs.toString();
  }
  function renderApiImageList(values) {
    const preview = $("preview"); const batch = values.length > 1;
    if (!hasApiFallback()) { showError(T("errEngineCdn")); return; }
    if (batch) preview.classList.add("barcode-batch");
    let done = 0, failed = 0;
    values.forEach(function (v) {
      const img = document.createElement("img");
      img.alt = current + " barcode";
      img.loading = "eager";
      img.decoding = "async";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.onload = function () {
        done++;
        if (done + failed === values.length) {
          applyZoom();
          $("dlZip").hidden = true;
          setStatus(failed ? TF("errApiPartial", failed) : (batch ? TF("stCodes", values.length) : T("stValid")), failed ? "err" : "ok");
        }
      };
      img.onerror = function () {
        failed++;
        const url = img.src;
        if (typeof fetch === "function") {
          fetch(url, { cache: "no-store" }).then(function (r) { return r.json().catch(function () { return {}; }); })
            .then(function (j) {
              const m = j && j.error ? j.error : T("errApiPreview");
              if (done + failed === values.length) showError(m);
            })
            .catch(function () { if (done + failed === values.length) showError(T("errApiPreview")); });
        } else if (done + failed === values.length) {
          showError(T("errApiPreview"));
        }
      };
      img.src = apiBarcodeUrl(v, "png");
      if (batch) { const w = document.createElement("div"); w.className = "batch-item"; w.appendChild(img); preview.appendChild(w); }
      else { preview.appendChild(img); lastApiPng = img.src; lastApiSvg = apiBarcodeUrl(v, "svg"); }
    });
  }

  function renderLinearList(values) {
    const preview = $("preview"); const batch = values.length > 1;
    if (batch) preview.classList.add("barcode-batch");
    try {
      if (typeof JsBarcode === "undefined") { if (hasApiFallback()) { renderApiImageList(values); return; } throw new Error(T("errJsBarcode")); }
      values.forEach((v) => {
        const svg = makeLinearSvg(v); const svgStr = new XMLSerializer().serializeToString(svg);
        if (batch) { const w = document.createElement("div"); w.className = "batch-item"; w.appendChild(svg); preview.appendChild(w); batchItems.push({ svg: svgStr, label: v }); }
        else { preview.appendChild(svg); lastSvg = svgStr; }
      });
      applyZoom(); $("dlZip").hidden = !batch;
      setStatus(batch ? TF("stBarcodes", values.length) : T("stValid"), "ok");
    } catch (e) { showError(e.message || T("errInvalid")); }
  }

  function renderBwipList(values) {
    if (typeof bwipjs === "undefined") { if (hasApiFallback()) { renderApiImageList(values); return; } showError(T("errBwip")); return; }
    const preview = $("preview"); const batch = values.length > 1;
    if (batch) preview.classList.add("barcode-batch");
    try {
      values.forEach((v) => {
        const canvas = makeBwipCanvas(v);
        if (batch) { const w = document.createElement("div"); w.className = "batch-item"; w.appendChild(canvas); preview.appendChild(w); batchItems.push({ canvas: canvas, label: v }); }
        else { preview.appendChild(canvas); lastCanvas = canvas; lastSvg = makeBwipSvg(v); }
      });
      applyZoom(); $("dlZip").hidden = !batch;
      setStatus(batch ? TF("stCodes", values.length) : T("stValid"), "ok");
    } catch (e) {
      const msg = (typeof e === "string") ? e : (e && e.message) || T("errInvalid");
      showError(msg);
    }
  }

  function renderQrList(values) {
    const preview = $("preview"); const batch = values.length > 1;
    if (batch) preview.classList.add("barcode-batch");
    let done = 0, errors = [];
    try {
      values.forEach((v, idx) => {
        makeQrCanvas(v, (err, canvas) => {
          if (err || !canvas) errors.push(err && err.message ? err.message : T("errQr"));
          else if (batch) { const w = document.createElement("div"); w.className = "batch-item"; w.appendChild(canvas); preview.appendChild(w); batchItems[idx] = { canvas: canvas, label: v }; }
          else { preview.appendChild(canvas); lastCanvas = canvas; }
          if (++done === values.length) {
            if (errors.length) showError(errors[0] || T("errQr"));
            else { applyZoom(); $("dlZip").hidden = !batch; setStatus(batch ? TF("stQrCodes", values.length) : T("stValid"), "ok"); }
          }
        });
      });
      if (!batch) makeQrSvg(values[0], (e, s) => { if (!e && s) lastSvg = s; });
    } catch (e) { showError((e && e.message) || T("errQr")); }
  }

  // ---- Zoom ----
  function applyZoom() { $("preview").style.transform = "scale(" + zoom + ")"; $("zoomLabel").textContent = Math.round(zoom * 100) + "%"; }

  // ---- SVG -> canvas ----
  function svgToCanvas(svgStr, cb) {
    const img = new Image();
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = function () {
      const scale = 3, c = document.createElement("canvas");
      c.width = (img.width || 320) * scale; c.height = (img.height || 160) * scale;
      const ctx = c.getContext("2d");
      if (!$("transparent").checked) { ctx.fillStyle = $("bg").value; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); cb(c);
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }
  function downloadURL(url, name) { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function safeName(v) { return (v || "barcode").toString().replace(/[^a-z0-9_-]+/gi, "_").slice(0, 40); }
  function fileBase() { return "barcode-" + current.toLowerCase(); }

  // ---- Downloads ----
  $("dlPng").addEventListener("click", function () {
    if (lastCanvas) { downloadURL(lastCanvas.toDataURL("image/png"), fileBase() + ".png"); return; }
    if (lastApiPng) { downloadURL(lastApiPng, fileBase() + ".png"); return; }
    if (lastSvg) { svgToCanvas(lastSvg, (c) => c ? downloadURL(c.toDataURL("image/png"), fileBase() + ".png") : alert(T("nothingExport"))); return; }
    alert(T("genFirst"));
  });
  $("dlSvg").addEventListener("click", function () {
    if (lastApiSvg) { downloadURL(lastApiSvg, fileBase() + ".svg"); return; }
    if (!lastSvg) { alert(T("svgNA")); return; }
    downloadURL(URL.createObjectURL(new Blob([lastSvg], { type: "image/svg+xml" })), fileBase() + ".svg");
  });
  $("copyBtn").addEventListener("click", async function () {
    const btn = this;
    try {
      let canvas = lastCanvas;
      if (!canvas && lastApiPng) {
        const blob = await fetch(lastApiPng).then((r) => r.ok ? r.blob() : null).catch(() => null);
        if (blob) {
          const img = new Image();
          const url = URL.createObjectURL(blob);
          canvas = await new Promise((res) => {
            img.onload = function () { const c = document.createElement("canvas"); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height; c.getContext("2d").drawImage(img, 0, 0); URL.revokeObjectURL(url); res(c); };
            img.onerror = function () { URL.revokeObjectURL(url); res(null); };
            img.src = url;
          });
        }
      }
      if (!canvas && lastSvg) canvas = await new Promise((res) => svgToCanvas(lastSvg, res));
      if (!canvas) { alert(T("genSingleFirst")); return; }
      canvas.toBlob(async (blob) => {
        try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); btn.textContent = "✓ " + T("btnCopied"); setTimeout(() => btn.textContent = "📋 " + T("btnCopy"), 1500); }
        catch (e) { alert(T("copyNA")); }
      });
    } catch (e) { alert(T("copyFail")); }
  });
  $("dlZip").addEventListener("click", async function () {
    if (!batchItems.length) { alert(T("genFirst")); return; }
    setStatus(T("stPacking"));
    const files = [];
    for (let i = 0; i < batchItems.length; i++) {
      const it = batchItems[i]; if (!it) continue;
      let canvas = it.canvas;
      if (!canvas && it.svg) canvas = await new Promise((res) => svgToCanvas(it.svg, res));
      if (!canvas) continue;
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const buf = new Uint8Array(await blob.arrayBuffer());
      files.push({ name: safeName(it.label) + ".png", data: buf });
    }
    const zip = buildZip(files);
    downloadURL(URL.createObjectURL(new Blob([zip], { type: "application/zip" })), "barcodes.zip");
    setStatus(TF("stZipped", files.length), "ok");
  });

  // ---- Minimal ZIP (STORE) ----
  function buildZip(files) {
    const enc = new TextEncoder(); const chunks = []; const central = []; let offset = 0;
    const crcTable = makeCrcTable();
    const u16 = (n) => new Uint8Array([n & 255, (n >> 8) & 255]);
    const u32 = (n) => new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]);
    const push = (a) => { chunks.push(a); offset += a.length; };
    files.forEach((f) => {
      const nameBytes = enc.encode(f.name); const crc = crc32(f.data, crcTable); const localStart = offset;
      push(u32(0x04034b50)); push(u16(20)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0));
      push(u32(crc)); push(u32(f.data.length)); push(u32(f.data.length)); push(u16(nameBytes.length)); push(u16(0));
      push(nameBytes); push(f.data);
      const c = [];
      c.push(u32(0x02014b50)); c.push(u16(20)); c.push(u16(20)); c.push(u16(0)); c.push(u16(0)); c.push(u16(0)); c.push(u16(0));
      c.push(u32(crc)); c.push(u32(f.data.length)); c.push(u32(f.data.length)); c.push(u16(nameBytes.length)); c.push(u16(0)); c.push(u16(0));
      c.push(u16(0)); c.push(u16(0)); c.push(u32(0)); c.push(u32(localStart)); c.push(nameBytes);
      const merged = concat(c); central.push({ bytes: merged, size: merged.length });
    });
    const cdStart = offset; let cdSize = 0;
    central.forEach((c) => { push(c.bytes); cdSize += c.size; });
    push(u32(0x06054b50)); push(u16(0)); push(u16(0)); push(u16(files.length)); push(u16(files.length));
    push(u32(cdSize)); push(u32(cdStart)); push(u16(0));
    return concat(chunks);
  }
  function concat(arrs) { let len = 0; arrs.forEach((a) => len += a.length); const out = new Uint8Array(len); let o = 0; arrs.forEach((a) => { out.set(a, o); o += a.length; }); return out; }
  function makeCrcTable() { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; }
  function crc32(buf, table) { let crc = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 255]; return (crc ^ 0xFFFFFFFF) >>> 0; }

  // ---- Controls ----
  function bindRange(id) { const el = $(id), out = $(id + "V"); el.addEventListener("input", () => { if (out) out.textContent = (id === "pdfCols" && el.value === "0") ? T("pdfAuto") : el.value; render(); }); }
  ["barWidth", "barHeight", "fontSize", "qrSize", "margin", "tdScale", "pdfCols", "bwipHeight"].forEach(bindRange);
  ["data", "displayValue", "textAlign", "qrEcc", "fg", "bg", "transparent", "bwipText", "seqCount", "seqStart", "seqPrefix", "seqPad"].forEach((id) => {
    const el = $(id); if (!el) return; el.addEventListener("input", render); el.addEventListener("change", render);
  });
  // smart-content builder inputs
  ["wSsid", "wPass", "wEnc", "wHidden", "vFirst", "vLast", "vOrg", "vTitle", "vPhone", "vEmail", "vUrl", "vAddr",
   "eTo", "eSub", "eBody", "sNum", "sMsg", "tNum", "gLat", "gLng", "cTitle", "cLoc", "cStart", "cEnd", "cDesc"].forEach((id) => {
    const el = $(id); if (!el) return; el.addEventListener("input", render); el.addEventListener("change", render);
  });
  $("ctSelect").addEventListener("change", applyContentType);
  $("seqEnable").addEventListener("change", function () { $("seqFields").classList.toggle("show", this.checked); render(); });
  $("typeSearch").addEventListener("input", function () { buildSidebar(this.value); });
  document.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    zoom = b.dataset.zoom === "in" ? Math.min(3, zoom + 0.25) : Math.max(0.5, zoom - 0.25); applyZoom();
  }));
  $("resetBtn").addEventListener("click", function () {
    $("barWidth").value = 2; $("barHeight").value = 100; $("fontSize").value = 18;
    $("qrSize").value = 300; $("margin").value = 10; $("textAlign").value = "center";
    $("qrEcc").value = "M"; $("tdScale").value = 4; $("pdfCols").value = 0; $("bwipHeight").value = 12;
    $("fg").value = "#000000"; $("bg").value = "#ffffff";
    $("transparent").checked = false; $("displayValue").checked = true; $("bwipText").checked = false;
    $("seqEnable").checked = false; $("seqFields").classList.remove("show");
    $("ctSelect").value = "text";
    ["barWidth", "barHeight", "fontSize", "qrSize", "margin", "tdScale", "bwipHeight"].forEach((id) => { const o = $(id + "V"); if (o) o.textContent = $(id).value; });
    $("pdfColsV").textContent = T("pdfAuto");
    $("data").value = DEFAULTS[current] || ""; zoom = 1; applyZoom(); applyContentType();
  });
  $("printBtn").addEventListener("click", () => window.print());

  // ---- Language ----
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = T(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = T(el.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = T(el.dataset.i18nHtml); });
    $("copyBtn").textContent = "📋 " + T("btnCopy");
    $("dlZip").textContent = "⬇ " + T("btnZip");
    if ($("pdfCols").value === "0") $("pdfColsV").textContent = T("pdfAuto");
    buildSidebar($("typeSearch").value || "");
    updateHint();
  }
  function buildLangSelect() {
    const sel = $("langSelect"); if (!sel) return;
    sel.innerHTML = "";
    DICT.meta.langs.forEach((l) => {
      const o = document.createElement("option"); o.value = l.code; o.textContent = l.label;
      if (l.code === lang) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener("change", function () {
      lang = this.value; localStorage.setItem("bcs_lang", lang);
      applyLang(); render();
    });
  }

  // ---- Bulk generate (CSV -> ZIP / PDF) ----
  let bulkRows = [];
  let bulkItems = [];
  const BULK_MAX = 1000;
  const NL = String.fromCharCode(10), CR = String.fromCharCode(13), TAB = String.fromCharCode(9), DQ = String.fromCharCode(34);
  const DOT = " " + String.fromCharCode(183) + " ";

  function detectDelim(line) {
    function cnt(ch) { let n = 0; for (let i = 0; i < line.length; i++) if (line[i] === ch) n++; return n; }
    const c = cnt(","), s = cnt(";"), t = cnt(TAB);
    if (t > 0 && t >= c && t >= s) return TAB;
    if (s > 0 && s > c) return ";";
    return ",";
  }

  function parseCSV(text) {
    text = String(text || "");
    let clean = "";
    for (let i = 0; i < text.length; i++) { if (text[i] !== CR) clean += text[i]; }
    while (clean.length && clean[clean.length - 1] === NL) clean = clean.slice(0, -1);
    if (!clean) return [];
    const delim = detectDelim(clean.split(NL)[0] || "");
    const rows = []; let row = [], field = "", inq = false;
    for (let j = 0; j < clean.length; j++) {
      const ch = clean[j];
      if (inq) {
        if (ch === DQ) { if (clean[j + 1] === DQ) { field += DQ; j++; } else inq = false; }
        else field += ch;
      } else if (ch === DQ) { inq = true; }
      else if (ch === delim) { row.push(field); field = ""; }
      else if (ch === NL) { row.push(field); rows.push(row); row = []; field = ""; }
      else field += ch;
    }
    row.push(field); rows.push(row);
    return rows;
  }

  function bulkColumns() {
    const sel1 = $("bulkDataCol"), sel2 = $("bulkLabelCol");
    if (!sel1 || !sel2) return;
    const prev1 = sel1.value, prev2 = sel2.value;
    sel1.innerHTML = ""; sel2.innerHTML = "";
    const none = document.createElement("option");
    none.value = "-1"; none.textContent = T("bulkLabelNone"); sel2.appendChild(none);
    const header = $("bulkHeader").checked;
    const ncol = bulkRows.reduce((m, r) => Math.max(m, r.length), 0);
    for (let i = 0; i < ncol; i++) {
      const label = (header && bulkRows[0] && bulkRows[0][i]) ? bulkRows[0][i] : (T("bulkColPrefix") + " " + (i + 1));
      const o1 = document.createElement("option"); o1.value = String(i); o1.textContent = label; sel1.appendChild(o1);
      const o2 = document.createElement("option"); o2.value = String(i); o2.textContent = label; sel2.appendChild(o2);
    }
    if (prev1) sel1.value = prev1;
    if (prev2) sel2.value = prev2;
  }

  function bulkSetText(text) {
    bulkRows = parseCSV(text);
    bulkColumns();
    const info = $("bulkInfo");
    if (info) info.textContent = bulkRows.length ? TF("bulkRowsInfo", bulkRows.length) : "";
  }

  function bulkRenderValue(value) {
    return new Promise((resolve) => {
      const eng = engineOf(current);
      try {
        if (eng === "qr") {
          makeQrCanvas(value, (err, canvas) => resolve(err ? null : canvas));
        } else if (eng === "bwip") {
          resolve(makeBwipCanvas(value) || null);
        } else {
          const svg = makeLinearSvg(value);
          const s = new XMLSerializer().serializeToString(svg);
          svgToCanvas(s, (c) => resolve(c || null));
        }
      } catch (e) { resolve(null); }
    });
  }

  async function bulkGenerate() {
    if (!bulkRows.length) { setStatus(T("bulkNone"), "err"); return; }
    const header = $("bulkHeader").checked;
    const dataCol = parseInt($("bulkDataCol").value, 10) || 0;
    const labelCol = parseInt($("bulkLabelCol").value, 10);
    const srcRows = header ? bulkRows.slice(1) : bulkRows.slice();
    let items = [];
    srcRows.forEach((r) => {
      const v = (r[dataCol] != null ? String(r[dataCol]) : "").trim();
      if (!v) return;
      const lbl = (labelCol >= 0 && r[labelCol] != null && String(r[labelCol]).trim()) ? String(r[labelCol]).trim() : v;
      items.push({ value: v, label: lbl });
    });
    if (!items.length) { setStatus(T("bulkNone"), "err"); return; }
    let limited = false;
    if (items.length > BULK_MAX) { items = items.slice(0, BULK_MAX); limited = true; }
    bulkItems = [];
    const prog = $("bulkProgress"), bar = $("bulkBar");
    if (prog) prog.hidden = false;
    $("bulkGenBtn").disabled = true;
    $("bulkDlZip").hidden = true; $("bulkDlPdf").hidden = true;
    let fail = 0;
    for (let i = 0; i < items.length; i++) {
      let normalizedValue;
      try { normalizedValue = normalizeForCurrent(items[i].value); }
      catch (e) { fail++; continue; }
      const canvas = await bulkRenderValue(normalizedValue);
      if (canvas) bulkItems.push({ canvas: canvas, label: items[i].label, value: normalizedValue });
      else fail++;
      if (i % 5 === 0 || i === items.length - 1) {
        if (bar) bar.style.width = Math.round(((i + 1) / items.length) * 100) + "%";
        setStatus(T("bulkRendering").replace("{n}", i + 1).replace("{t}", items.length), "");
        await new Promise((res) => setTimeout(res, 0));
      }
    }
    $("bulkGenBtn").disabled = false;
    if (prog) prog.hidden = true;
    if (bar) bar.style.width = "0%";
    if (!bulkItems.length) { setStatus(T("bulkNone"), "err"); return; }
    $("bulkDlZip").hidden = false; $("bulkDlPdf").hidden = false;
    let msg = TF("bulkDone", bulkItems.length);
    if (fail) msg += DOT + TF("bulkFailed", fail);
    if (limited) msg += DOT + TF("bulkMax", BULK_MAX);
    setStatus(msg, "ok");
  }

  async function bulkDownloadZip() {
    if (!bulkItems.length) return;
    setStatus(T("bulkBuilding"));
    const files = []; const used = {};
    for (const it of bulkItems) {
      const blob = await new Promise((res) => it.canvas.toBlob(res, "image/png"));
      if (!blob) continue;
      const buf = new Uint8Array(await blob.arrayBuffer());
      let base = safeName(it.label), name = base, k = 1;
      while (used[name]) name = base + "_" + (k++);
      used[name] = 1;
      files.push({ name: name + ".png", data: buf });
    }
    const zip = buildZip(files);
    downloadURL(URL.createObjectURL(new Blob([zip], { type: "application/zip" })), "barcodes-" + current.toLowerCase() + ".zip");
    setStatus(TF("bulkZipDone", files.length), "ok");
  }

  async function bulkDownloadPdf() {
    if (!bulkItems.length) return;
    const ns = window.jspdf || window.jsPDF;
    const Ctor = ns && (ns.jsPDF || ns);
    if (!Ctor) { alert(T("bulkPdfNA")); return; }
    setStatus(T("bulkBuilding"));
    const doc = new Ctor({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = 210, pageH = 297, margin = 12, gap = 6;
    let cols = parseInt($("bulkPdfCols").value, 10) || 3;
    cols = Math.max(1, Math.min(6, cols));
    const cellW = (pageW - 2 * margin - (cols - 1) * gap) / cols;
    const imgMaxH = cellW * 0.6, labelH = 6, cellH = imgMaxH + labelH + gap;
    const rowsPerPage = Math.max(1, Math.floor((pageH - 2 * margin + gap) / cellH));
    const perPage = cols * rowsPerPage;
    doc.setFontSize(8);
    for (let i = 0; i < bulkItems.length; i++) {
      const idx = i % perPage;
      if (i > 0 && idx === 0) doc.addPage();
      const rr = Math.floor(idx / cols), cc = idx % cols;
      const x = margin + cc * (cellW + gap);
      const y = margin + rr * cellH;
      const it = bulkItems[i];
      const dataURL = it.canvas.toDataURL("image/png");
      const ratio = (it.canvas.height || 1) / (it.canvas.width || 1);
      let w = cellW, h = cellW * ratio;
      if (h > imgMaxH) { h = imgMaxH; w = imgMaxH / ratio; }
      const ix = x + (cellW - w) / 2;
      try { doc.addImage(dataURL, "PNG", ix, y, w, h); } catch (e) {}
      const lbl = (it.label || "").toString().slice(0, 30);
      doc.text(lbl, x + cellW / 2, y + imgMaxH + 3.5, { align: "center", maxWidth: cellW });
    }
    doc.save("barcodes-" + current.toLowerCase() + ".pdf");
    setStatus(TF("bulkPdfDone", bulkItems.length), "ok");
  }

  function initBulk() {
    const file = $("bulkFile"), paste = $("bulkPaste");
    if (file) file.addEventListener("change", function () {
      const f = this.files && this.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { if (paste) paste.value = reader.result; bulkSetText(String(reader.result || "")); };
      reader.readAsText(f);
    });
    if (paste) paste.addEventListener("input", function () { bulkSetText(this.value); });
    const hdr = $("bulkHeader");
    if (hdr) hdr.addEventListener("change", function () { bulkColumns(); const info = $("bulkInfo"); if (info && bulkRows.length) info.textContent = TF("bulkRowsInfo", bulkRows.length); });
    const gen = $("bulkGenBtn"); if (gen) gen.addEventListener("click", bulkGenerate);
    const dz = $("bulkDlZip"); if (dz) dz.addEventListener("click", bulkDownloadZip);
    const dp = $("bulkDlPdf"); if (dp) dp.addEventListener("click", bulkDownloadPdf);
  }

  // ---- Reveal on scroll ----
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  // ---- Init ----
  function init() {
    buildLangSelect();
    applyLang();
    initReveal();
    initBulk();
    buildSidebar("");
    // Per-type landing pages set window.BARCODE_INITIAL_TYPE; default to QR Code so the
    // first visible preview never depends on JsBarcode or bwip-js.
    let initialType = (typeof window !== "undefined" && window.BARCODE_INITIAL_TYPE) || "qrcode";
    if (!findItem(initialType)) initialType = "qrcode";
    selectType(initialType);
    const libs = window.__barcodeLibs || {};
    if (libs.jsbarcode && typeof libs.jsbarcode.then === "function") {
      libs.jsbarcode.then(function (ok) { if (ok && engineOf(current) === "jsbarcode") render(); });
    }
    if (libs.bwip && typeof libs.bwip.then === "function") {
      libs.bwip.then(function (ok) { if (ok && engineOf(current) === "bwip") render(); });
    }
    const loader = $("loader");
    if (loader) setTimeout(() => loader.classList.add("hidden"), 250);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
