-- Ken Merrell website: run once in the Supabase SQL editor.
-- Each row holds one JSON document, so new fields never need a migration.

create table if not exists public.books    (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists public.videos   (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists public.readers  (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.settings (id text primary key, data jsonb not null, updated_at timestamptz default now());

-- First-party attribution and conversion analytics. Reader contact data is kept in
-- the server-only JSON payload and is never exposed through the public anon key.
create table if not exists public.analytics_sessions (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.analytics_events (
  id text primary key,
  session_id text not null,
  occurred_at timestamptz not null,
  data jsonb not null
);

create index if not exists analytics_sessions_created_at_idx on public.analytics_sessions (created_at desc);
create index if not exists analytics_events_occurred_at_idx on public.analytics_events (occurred_at desc);
create index if not exists analytics_events_session_id_idx on public.analytics_events (session_id, occurred_at);

-- The site talks to Supabase only from the server with the service role key.
-- Row level security with no policies blocks the public anon key completely.
alter table public.books    enable row level security;
alter table public.videos   enable row level security;
alter table public.readers  enable row level security;
alter table public.settings enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

-- Public bucket for covers, banners and the author photo.
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;
