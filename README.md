# Barcode Mint

A fast, offline-capable barcode & QR code generator supporting 100+ symbologies
(QR, Data Matrix, PDF417, Aztec, EAN/UPC, GS1 DataBar, postal codes, HIBC and
more). Live preview, batch/sequence mode, bulk CSV → ZIP/PDF, and a public REST
API. Runs fully in the browser, with a serverless API fallback.

## Quick start (local)

```bash
npm install
npm start
```

Then open <http://localhost:3000>. The static site **and** the REST API are
served together by `server.js`, so local behaviour matches production.

Environment overrides (optional) — copy `.env.example` to `.env`:

- `PORT` — local server port (default `3000`)
- `RATE_LIMIT_RPM` — API requests per IP per minute (default `120`)

## Deploy (Vercel)

The repo is Vercel-ready. `api/*.js` are serverless functions and `vercel.json`
maps clean routes (`/barcode`, `/barcode.png`, `/barcode.svg`, `/health`). Push
to a Vercel-connected repo, or run `vercel`. `server.js` is only used for local
/ self-hosted runs and is ignored by Vercel.

## REST API

```
GET /barcode?type=<symbology>&data=<value>&format=<png|svg>
```

Common parameters: `type`, `data` (required), `format`, `scale`, `height`,
`includetext`, `color`, `bg`, `padding`, `rotate`, `columns`. Full reference and
live examples: open `/api-docs.html`. The API is rate limited (HTTP 429 with
`Retry-After` when exceeded); see **Rate limiting** below.

Example:

```bash
curl -o qr.png "http://localhost:3000/barcode?type=qrcode&data=Hello"
```

## Rate limiting

`api/_rate-limit.js` implements a best-effort, in-memory limit (per instance /
per process). On multi-instance production hosting this is a soft limit; for a
strict cluster-wide cap, back it with a shared store (Vercel KV / Upstash Redis)
behind the same interface.

## Project structure

```
index.html        Generator UI
api-docs.html     REST API documentation
server.js         Local/self-host server (static + API); ignored on Vercel
vercel.json       Serverless routing/rewrites
api/
  barcode.js      Barcode image endpoint (PNG/SVG)
  health.js       Health check
  drawing-svg.js  bwip-js SVG drawing backend
  _rate-limit.js  API rate limiter
js/
  app.js          Application logic, symbology catalog, normalization, export
  qr-local.js     Bundled offline QR encoder (works with zero network)
  i18n.js         UI translations (en, id, es, fr, de)
  i18n-extra.js   Bulk + API translations
css/              Styles
```

## Tech & third-party licenses

Rendering is powered by open-source libraries, loaded via CDN in the browser and
bundled server-side:

- [bwip-js](https://github.com/metafloor/bwip-js) — MIT
- [JsBarcode](https://github.com/lindell/JsBarcode) — MIT
- [jsPDF](https://github.com/parallax/jsPDF) — MIT
- QRCode.js (Kazuhiko Arase), bundled in `js/qr-local.js` — MIT

This application's own source is proprietary. © 2026 Barcode Mint.
