# Pro / API waitlist — setup

The "Pro & API — join the early list" section on every page posts to
`/api/waitlist`, which **stores signups in Supabase** and **sends a confirmation
email via Resend**. Until the env vars below are set, the endpoint returns a
friendly `503` and the form shows "Waitlist is temporarily unavailable." — the
rest of the site is unaffected.

## 1. Supabase (storage — required)

1. Create a project at https://supabase.com.
2. In the SQL editor, run:

   ```sql
   create table public.waitlist (
     id          bigint generated always as identity primary key,
     email       text not null unique,
     tier        text,
     features    jsonb default '[]'::jsonb,
     source      text,
     user_agent  text,
     created_at  timestamptz not null default now()
   );

   -- Only the service role writes to this table; keep RLS on with no public policy.
   alter table public.waitlist enable row level security;
   ```

   The `unique` on `email` matters: the endpoint upserts (`on_conflict=email`),
   so a repeat signup refreshes their tier/features instead of erroring.

3. Grab **Project URL** and the **service_role** key from
   Settings → API.

## 2. Resend (confirmation email — optional)

1. Create an account at https://resend.com and verify your sending domain
   (e.g. `barcodeapis.com`).
2. Create an API key.
3. Note a verified from-address, e.g. `Barcode APIs <hello@barcodeapis.com>`.

If you skip this, signups are still stored — no email just goes out.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | ✅ | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server-side only.** Never expose to the browser. |
| `WAITLIST_TABLE` | — | Defaults to `waitlist`. |
| `RESEND_API_KEY` | — | Enables the confirmation email. |
| `WAITLIST_FROM_EMAIL` | — | Verified Resend sender. Required for email to send. |
| `WAITLIST_NOTIFY_EMAIL` | — | Optional: CC every signup to your own inbox. |

Redeploy after setting them.

## 4. Reading the results (this is the whole point)

The painted door is a **demand + price test**. Query it in the Supabase SQL editor:

```sql
-- Interest by tier
select tier, count(*) from waitlist group by tier order by count(*) desc;

-- Which features people actually want (build order)
select f as feature, count(*)
from waitlist, jsonb_array_elements_text(features) as f
group by f order by count(*) desc;
```

That tells you which tier resonates and what to build first — before writing a
line of Stripe/accounts code.

## Local testing

`npm run dev` routes `/api/waitlist` too (see `server.js`). Without the env vars
it returns `503` locally, which is expected. Set the vars in your shell to test
the full store + email path against a real Supabase project.

## Notes / guardrails

- Rate-limited via the shared `api/_rate-limit.js` (per-IP, per-minute).
- Has a hidden honeypot field (`company`) — bots that fill it get a silent `200`
  with no store.
- Feature values are allow-listed server-side; unknown values are dropped.
- Painted-door honesty: the section says "Launching soon" and buttons say
  "Notify me" — nothing implies a live purchase.
