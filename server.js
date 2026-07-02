// Local development / self-host server for Barcode Studio.
//
// Serves the static site AND runs the /api serverless handlers in one process,
// so `npm start` gives full dev/prod parity at http://localhost:3000 without
// needing the Vercel CLI. On Vercel, these same handlers run as serverless
// functions and this file is ignored.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
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
  "/barcode.svg": "./api/barcode.js"
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

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  const filePath = path.normalize(path.join(ROOT, rel));
  // Block path traversal outside the project root.
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.statusCode = 403; res.end("Forbidden"); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Not found");
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  });
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
  console.log("Barcode Studio running at http://localhost:" + PORT);
});
