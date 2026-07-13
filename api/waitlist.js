// Vercel Serverless Function — Pro / API waitlist capture ("painted door").
//
// Stores a signup { email, tier, features[] } in Supabase and sends a
// confirmation email via Resend. Both integrations are configured purely
// through env vars; if Supabase isn't configured the endpoint fails loudly
// (nothing to store into), while Resend is best-effort (a store still counts
// as success even if the email doesn't go out).
//
// Required env:
//   SUPABASE_URL                 e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    server-side only — never ship to the browser
// Optional env:
//   WAITLIST_TABLE               defaults to "waitlist"
//   RESEND_API_KEY               enables the confirmation email
//   WAITLIST_FROM_EMAIL          verified Resend sender, e.g. "Barcode Mint <hello@barcodemint.com>"
//   WAITLIST_NOTIFY_EMAIL        optional internal address to CC on every signup

const rateLimit = require("./_rate-limit");

const TIERS = new Set(["starter", "pro", "business", "api"]);
const FEATURES = new Set([
  "no-watermark", "commercial-license", "bulk-csv",
  "vector-export", "api-access", "dynamic-qr", "high-res", "team"
]);
const ALLOWED_LOCALES = new Set(["en", "de", "pl", "nl", "fr", "ja"]);

// Localized confirmation email (subject + plain-text body), keyed by locale.
const EMAIL_I18N = {
  en: { subject: "You're on the Barcode Mint early list",
    body: "Thanks for joining the Barcode Mint early list.\n\nWe'll email you the moment it's ready — early-list members get first access and launch pricing.\n\n— Barcode Mint" },
  de: { subject: "Sie stehen auf der Barcode Mint Early-Access-Liste",
    body: "Danke, dass Sie sich für die Early-Access-Liste von Barcode Mint eingetragen haben.\n\nWir melden uns per E-Mail, sobald es so weit ist — Mitglieder der Liste erhalten zuerst Zugang und exklusive Launch-Preise.\n\n— Barcode Mint" },
  pl: { subject: "Jesteś na liście wczesnego dostępu Barcode Mint",
    body: "Dziękujemy za zapisanie się na listę wczesnego dostępu Barcode Mint.\n\nNapiszemy do Ciebie, gdy tylko będzie gotowe — członkowie listy otrzymują dostęp jako pierwsi oraz ceny na start.\n\n— Barcode Mint" },
  nl: { subject: "Je staat op de early-accesslijst van Barcode Mint",
    body: "Bedankt voor je aanmelding voor de early-accesslijst van Barcode Mint.\n\nWe mailen je zodra het zover is — leden van de lijst krijgen als eerste toegang en lanceerprijzen.\n\n— Barcode Mint" },
  fr: { subject: "Vous êtes sur la liste d'accès anticipé de Barcode Mint",
    body: "Merci de vous être inscrit à la liste d'accès anticipé de Barcode Mint.\n\nNous vous écrirons dès que ce sera prêt — les membres de la liste bénéficient d'un accès prioritaire et de tarifs de lancement.\n\n— Barcode Mint" },
  ja: { subject: "Barcode Mint 先行アクセスリストにご登録いただきました",
    body: "Barcode Mint の先行アクセスリストにご登録いただきありがとうございます。\n\n準備が整い次第、メールでお知らせします。先行リストのメンバーは、いち早くご利用いただけるほか、限定の提供開始価格をご案内します。\n\n— Barcode Mint" }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(req) {
  return new Promise((resolve) => {
    // Vercel usually pre-parses JSON into req.body; fall back to raw stream.
    if (req.body && typeof req.body === "object") return resolve(req.body);
    if (typeof req.body === "string") {
      try { return resolve(JSON.parse(req.body)); } catch { return resolve({}); }
    }
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

async function storeSupabase(row) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) { const e = new Error("waitlist store not configured"); e.status = 503; throw e; }
  const table = process.env.WAITLIST_TABLE || "waitlist";
  // Upsert on email so a repeat signup refreshes tier/features instead of erroring.
  const url = `${base.replace(/\/$/, "")}/rest/v1/${table}?on_conflict=email`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify([row])
  });
  if (!resp.ok && resp.status !== 409) {
    const detail = await resp.text().catch(() => "");
    const e = new Error(`store failed (${resp.status})`);
    e.status = 502;
    e.detail = detail.slice(0, 300);
    throw e;
  }
}

async function sendConfirmation(email, locale) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WAITLIST_FROM_EMAIL;
  if (!apiKey || !from) return; // Resend optional — silently skip if unconfigured.
  const copy = EMAIL_I18N[locale] || EMAIL_I18N.en;
  const to = [email];
  if (process.env.WAITLIST_NOTIFY_EMAIL) to.push(process.env.WAITLIST_NOTIFY_EMAIL);
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to, subject: copy.subject, text: copy.body })
  }).catch(() => {}); // never let email failure fail the signup
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const rl = rateLimit(req);
  res.setHeader("X-RateLimit-Limit", String(rl.limit));
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    res.status(429).json({ error: "Too many requests. Please retry in " + rl.retryAfter + "s." });
    return;
  }

  const body = await readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }
  const tier = TIERS.has(String(body.tier)) ? String(body.tier) : null;
  const features = Array.isArray(body.features)
    ? [...new Set(body.features.map(String).filter((f) => FEATURES.has(f)))].slice(0, 12)
    : [];
  const locale = ALLOWED_LOCALES.has(String(body.locale)) ? String(body.locale) : "en";
  // Honeypot: bots fill hidden fields. Silently accept without storing.
  if (body.company) { res.status(200).json({ ok: true }); return; }

  const row = {
    email,
    tier,
    features,
    source: String(body.source || "").slice(0, 120) || null,
    user_agent: String(req.headers["user-agent"] || "").slice(0, 300),
    created_at: new Date().toISOString()
  };

  try {
    await storeSupabase(row);
    await sendConfirmation(email, locale);
    res.status(200).json({ ok: true });
  } catch (e) {
    const status = e && e.status ? e.status : 500;
    if (e && e.detail) console.error("waitlist store error:", e.status, e.detail);
    else console.error("waitlist error:", e && e.message);
    res.status(status).json({ error: status === 503
      ? "Waitlist is temporarily unavailable."
      : "Couldn't save your signup — please try again." });
  }
};
