// Best-effort in-memory rate limiter (per serverless instance / per process).
//
// This keeps the public API fast and makes the documented HTTP 429 real. Because
// Vercel may run several instances, this is a soft limit, not a hard global cap.
// For strict, cluster-wide limits, back it with a shared store (Vercel KV /
// Upstash Redis) — swap the Map for KV get/incr with the same interface.
const WINDOW_MS = 60 * 1000;
const MAX = parseInt(process.env.RATE_LIMIT_RPM, 10) || 120; // requests per IP per minute
const hits = new Map();

function clientIp(req) {
  const xff = req.headers && req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

module.exports = function rateLimit(req) {
  const ip = clientIp(req);
  const now = Date.now();
  let rec = hits.get(ip);
  if (!rec || now - rec.start >= WINDOW_MS) { rec = { start: now, count: 0 }; hits.set(ip, rec); }
  rec.count++;
  // Opportunistic cleanup so the Map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.start >= WINDOW_MS) hits.delete(k);
  }
  if (rec.count > MAX) {
    const retryAfter = Math.max(1, Math.ceil((rec.start + WINDOW_MS - now) / 1000));
    return { ok: false, retryAfter: retryAfter, limit: MAX, remaining: 0 };
  }
  return { ok: true, retryAfter: 0, limit: MAX, remaining: MAX - rec.count };
};
