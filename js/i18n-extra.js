/* Extra translations for Bulk generate + Developer API.
   Merged into window.I18N after i18n.js, before app.js.
   Languages other than en/id fall back to en automatically. */
(function () {
  if (!window.I18N || !window.I18N.ui) return;
  function add(lang, obj) {
    window.I18N.ui[lang] = Object.assign({}, window.I18N.ui[lang] || {}, obj);
  }
  var EN = {
    navBulk: "Bulk",
    navApi: "API Docs",
    bulkHeading: "Bulk generate",
    bulkBadge: "CSV \u2192 ZIP / PDF",
    bulkDesc: "Upload a CSV/TXT file or paste values to generate hundreds of barcodes at once \u2014 using the symbology & style selected above. Then download them all as a ZIP of PNGs or a single PDF sheet.",
    bulkUpload: "\u2b06 Upload CSV / TXT",
    bulkPastePh: "\u2026or paste values here, one per line",
    bulkHeaderLbl: "First row is a header",
    bulkDataColLbl: "Data column",
    bulkLabelColLbl: "Label / filename",
    bulkPdfColsLbl: "PDF columns",
    bulkLabelNone: "(use data value)",
    bulkColPrefix: "Column",
    bulkGenerate: "\u2699 Generate",
    bulkDlZip: "\u2b07 ZIP (PNG)",
    bulkDlPdf: "\u2b07 PDF sheet",
    bulkRowsInfo: "{n} rows loaded",
    bulkNone: "No valid data found in the selected column.",
    bulkRendering: "Generating {n}/{t}\u2026",
    bulkDone: "\u2713 {n} barcodes generated",
    bulkFailed: "{n} skipped (invalid)",
    bulkMax: "limited to {n}",
    bulkBuilding: "Building file\u2026",
    bulkZipDone: "\u2713 ZIP ready ({n} images)",
    bulkPdfDone: "\u2713 PDF ready ({n} barcodes)",
    bulkPdfNA: "PDF library not loaded \u2014 check your internet connection.",
    apiHeading: "Developer API",
    apiBadge: "REST \u00b7 image",
    apiDesc: "Run your own barcode API so other apps can fetch barcode images by URL. The ready-to-deploy server code is in the api/ folder of this download.",
    apiUsageT: "Example request",
    apiImgT: "Use it straight inside an <img> tag",
    apiParamsT: "Main parameters",
    apiSetupT: "Run it",
    apiSetup: "In the project root, run npm install then npm start. The app and API serve together at http://localhost:3000."
  };
  var ID = {
    navBulk: "Massal",
    navApi: "API Docs",
    bulkHeading: "Buat massal",
    bulkBadge: "CSV \u2192 ZIP / PDF",
    bulkDesc: "Unggah berkas CSV/TXT atau tempel nilai untuk membuat ratusan barcode sekaligus \u2014 memakai simbologi & gaya yang dipilih di atas. Lalu unduh semuanya sebagai ZIP berisi PNG atau satu lembar PDF.",
    bulkUpload: "\u2b06 Unggah CSV / TXT",
    bulkPastePh: "\u2026atau tempel nilai di sini, satu per baris",
    bulkHeaderLbl: "Baris pertama adalah header",
    bulkDataColLbl: "Kolom data",
    bulkLabelColLbl: "Label / nama file",
    bulkPdfColsLbl: "Kolom PDF",
    bulkLabelNone: "(pakai nilai data)",
    bulkColPrefix: "Kolom",
    bulkGenerate: "\u2699 Buat",
    bulkDlZip: "\u2b07 ZIP (PNG)",
    bulkDlPdf: "\u2b07 Lembar PDF",
    bulkRowsInfo: "{n} baris dimuat",
    bulkNone: "Tidak ada data valid pada kolom yang dipilih.",
    bulkRendering: "Membuat {n}/{t}\u2026",
    bulkDone: "\u2713 {n} barcode dibuat",
    bulkFailed: "{n} dilewati (tidak valid)",
    bulkMax: "dibatasi {n}",
    bulkBuilding: "Menyusun berkas\u2026",
    bulkZipDone: "\u2713 ZIP siap ({n} gambar)",
    bulkPdfDone: "\u2713 PDF siap ({n} barcode)",
    bulkPdfNA: "Pustaka PDF belum dimuat \u2014 periksa koneksi internet Anda.",
    apiHeading: "API untuk Developer",
    apiBadge: "REST \u00b7 gambar",
    apiDesc: "Jalankan API barcode milik Anda sendiri agar aplikasi lain bisa mengambil gambar barcode lewat URL. Kode server siap-pakai ada di folder api/ pada unduhan ini.",
    apiUsageT: "Contoh permintaan",
    apiImgT: "Pakai langsung di dalam tag <img>",
    apiParamsT: "Parameter utama",
    apiSetupT: "Menjalankan",
    apiSetup: "Di root proyek, jalankan npm install lalu npm start. Aplikasi dan API berjalan bersama di http://localhost:3000."
  };
  add("en", EN);
  add("id", ID);
})();
