-- Pro / API waitlist table.
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- (This file is a source-of-truth copy; Supabase does not read it automatically.)

create table if not exists public.waitlist (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  tier        text,
  features    jsonb default '[]'::jsonb,
  source      text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Only the service role (used by /api/waitlist) writes here. Keep RLS on with
-- no public policy so the anon key can't read or scrape the list.
alter table public.waitlist enable row level security;

-- ---------------------------------------------------------------------------
-- Handy result queries (run these later to read the demand/price signal):
--
--   select tier, count(*) from waitlist group by tier order by count(*) desc;
--
--   select f as feature, count(*)
--   from waitlist, jsonb_array_elements_text(features) as f
--   group by f order by count(*) desc;
-- ---------------------------------------------------------------------------
