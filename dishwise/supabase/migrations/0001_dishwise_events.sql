-- Dishwise validation analytics.
-- Anonymous product events only: no names, emails, IP addresses, photos or notes.

create table if not exists public.dishwise_events (
  id        uuid primary key,
  anon_id   text not null check (char_length(anon_id) between 6 and 64),
  scan_id   text,
  name      text not null check (char_length(name) <= 40),
  props     jsonb not null default '{}'::jsonb,
  invite    text check (char_length(invite) <= 40),
  ts        timestamptz not null default now()
);

create index if not exists dishwise_events_ts_idx   on public.dishwise_events (ts);
create index if not exists dishwise_events_name_idx on public.dishwise_events (name);
create index if not exists dishwise_events_anon_idx on public.dishwise_events (anon_id);

-- Row-level security ON with NO policies: the public (anon) key can neither read
-- nor write. Only the server, using the service-role key, can access this table.
alter table public.dishwise_events enable row level security;
revoke all on public.dishwise_events from anon, authenticated;
