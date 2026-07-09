// Local development / self-host server for Barcode APIs.
//
// Serves the static site AND runs the /api serverless handlers in one process,
// so `npm start` gives full dev/prod parity at http://localhost:3000 without
// needing the Vercel CLI. On Vercel, these same handlers run as serverless
// functions and this file is ignored.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
// Static files are served from the public/ docroot (mirrors Vercel's
// outputDirectory). API handlers live in ./api and are routed separately.
const WEBROOT = path.join(ROOT, "public");

// Minimal .env loader (no dependency). Reads .env.local then .env; never
// overrides variables already set in the real environment. On Vercel this
// file isn't run, so production env comes from the dashboard.
for (const name of [".env.local", ".env"]) {
  try {
    const txt = fs.readFileSync(path.join(ROOT, name), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const key = m[1];
      let val = m[2].replace(/^["']|["']$/g, "");
      if (process.env[key] === undefined && val !== "") process.env[key] = val;
    }
  } catch { /* file optional */ }
}

const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

// Clean routes -> serverless handler modules (mirrors vercel.json rewrites).
const API_ROUTES = {
  "/api/health": "./api/health.js",
  "/health": "./api/health.js",
  "/api/barcode": "./api/barcode.js",
  "/barcode": "./api/barcode.js",
  "/barcode.png": "./api/barcode.js",
  "/barcode.svg": "./api/barcode.js",
  "/api/waitlist": "./api/waitlist.js"
};

// Give the Node response the Vercel-style helpers the handlers expect.
function decorate(res) {
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (obj) {
    if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = function (body) {
    if (body == null) { res.end(); return res; }
    if (Buffer.isBuffer(body) || typeof body === "string") { res.end(body); return res; }
    if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
    return res;
  };
  return res;
}

function firstFile(candidates) {
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) return c; } catch (e) { /* next */ }
  }
  return null;
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  const base = path.normalize(path.join(WEBROOT, rel));
  // Block path traversal outside the docroot.
  if (base !== WEBROOT && !base.startsWith(WEBROOT + path.sep)) {
    res.statusCode = 403; res.end("Forbidden"); return;
  }
  // Clean-URL resolution (mirrors Vercel cleanUrls): exact file, then .html, then dir index.
  const filePath = firstFile([base, base + ".html", path.join(base, "index.html")]);
  if (!filePath) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, "http://localhost:" + PORT);
  const pathname = parsed.pathname;
  const handlerPath = API_ROUTES[pathname];
  if (handlerPath) {
    let handler;
    try { handler = require(handlerPath); }
    catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Handler load failed: " + (e && e.message) }));
      return;
    }
    req.query = Object.fromEntries(parsed.searchParams.entries());
    decorate(res);
    Promise.resolve(handler(req, res)).catch((e) => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: (e && e.message) || "Server error" }));
      }
    });
    return;
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log("Barcode APIs running at http://localhost:" + PORT);
});
