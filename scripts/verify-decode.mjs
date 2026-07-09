// Round-trip scannability check: encode each decodable symbology with bwip-js,
// decode the rendered image with ZXing (zxing-wasm), and assert the decoded
// data matches the input. Proves the generated barcodes are genuinely scannable
// and carry the intended payload — for the symbologies ZXing can read.
//
// ZXing cannot decode the exotic long tail (4-state postals, DataBar composites,
// MaxiCode, DotCode, Han Xin, Codablock-F, Mailmark, MSI, GS1 stacked). Those
// are validated by construction (bwip-js / BWIPP + JsBarcode are reference
// encoders) and listed in docs/SCAN-CHECKLIST.md for a one-time manual scan.
//
// Run: npm run verify:decode
import bwipjs from "bwip-js";
import { PNG } from "pngjs";
import { readBarcodesFromImageData } from "zxing-wasm/reader";

const norm = (s) => String(s);
const digits = (s) => String(s).replace(/\D/g, "");
const num = (s) => digits(s).replace(/^0+/, ""); // digits, ignoring leading zeros (UPC-A ↔ EAN-13)

// { label, bcid, text, expect?, cmp?, opts? }
//   cmp: "exact" (default) | "digits" (digits only) | "num" (digits, ignore leading zeros)
//   expect: decoded value to compare against (defaults to text)
//   opts: extra bwip render options (e.g. includecheck)
const CASES = [
  { label: "QR Code",            bcid: "qrcode",            text: "https://example.com" },
  { label: "Micro QR",           bcid: "microqrcode",       text: "12345" },
  { label: "Data Matrix",        bcid: "datamatrix",        text: "Data Matrix 123" },
  { label: "Aztec",              bcid: "azteccode",         text: "Aztec Code 123" },
  { label: "PDF417",             bcid: "pdf417",            text: "PDF417 Barcode" },
  { label: "Code 128",           bcid: "code128",           text: "Barcode APIs" },
  { label: "Code 39",            bcid: "code39",            text: "CODE 39" },
  { label: "Code 93",            bcid: "code93",            text: "CODE 93", opts: { includecheck: true } },
  { label: "Codabar",            bcid: "rationalizedCodabar", text: "A12345678A" },
  { label: "Interleaved 2 of 5", bcid: "interleaved2of5",   text: "1234567890" },
  { label: "EAN-13",             bcid: "ean13",             text: "4006381333931" },
  { label: "EAN-8",              bcid: "ean8",              text: "96385074" },
  { label: "UPC-A",              bcid: "upca",              text: "036000291452", cmp: "num" },
  { label: "UPC-E",              bcid: "upce",              text: "01234565", expect: "0012345000065", cmp: "digits" },
  { label: "GS1-128",            bcid: "gs1-128",           text: "(01)09521234543213(17)261231", cmp: "digits" },
  { label: "GS1 DataMatrix",     bcid: "gs1datamatrix",     text: "(01)09521234543213(17)261231", cmp: "digits" },
  { label: "GS1 QR Code",        bcid: "gs1qrcode",         text: "(01)09521234543213(17)261231", cmp: "digits" },
  { label: "DataBar Omni",       bcid: "databaromni",       text: "(01)09521234543213", cmp: "digits" },
  { label: "DataBar Expanded",   bcid: "databarexpanded",   text: "(01)09521234543213(3103)000123", cmp: "digits" },
];

async function render(bcid, text, opts = {}) {
  const png = await bwipjs.toBuffer({
    bcid, text, scale: 4, includetext: false,
    paddingwidth: 12, paddingheight: 12, backgroundcolor: "ffffff", ...opts
  });
  const img = PNG.sync.read(png);
  return { data: new Uint8ClampedArray(img.data), width: img.width, height: img.height };
}

const rows = [];
let pass = 0;
for (const c of CASES) {
  try {
    const imageData = await render(c.bcid, c.text, c.opts);
    const res = await readBarcodesFromImageData(imageData, { tryHarder: true });
    const out = res.length ? res[0].text : "";
    const cmp = c.cmp || "exact";
    const want = c.expect != null ? c.expect : c.text;
    const ok = cmp === "num" ? (num(out) === num(want) && num(want).length > 0)
      : cmp === "digits" ? (digits(out) === digits(want) && digits(want).length > 0)
      : (norm(out) === norm(want));
    if (ok) pass++;
    rows.push({ label: c.label, in: c.text, out, ok });
  } catch (e) {
    rows.push({ label: c.label, in: c.text, out: "ERR: " + e.message, ok: false });
  }
}

const W = Math.max(...rows.map((r) => r.label.length));
console.log(`\nRound-trip decode (encode -> render -> ZXing decode -> compare)\n`);
for (const r of rows) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label.padEnd(W)}  in=${JSON.stringify(r.in)}  out=${JSON.stringify(r.out)}`);
}
console.log(`\n${pass}/${rows.length} round-tripped successfully.`);
if (pass !== rows.length) process.exitCode = 1;
