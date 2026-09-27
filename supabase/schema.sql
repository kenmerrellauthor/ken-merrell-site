-- Ken Merrell website: run once in the Supabase SQL editor.
-- Each row holds one JSON document, so new fields never need a migration.

create table if not exists public.books    (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists public.videos   (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists public.readers  (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.settings (id text primary key, data jsonb not null, updated_at timestamptz default now());

-- The site talks to Supabase only from the server with the service role key.
-- Row level security with no policies blocks the public anon key completely.
alter table public.books    enable row level security;
alter table public.videos   enable row level security;
alter table public.readers  enable row level security;
alter table public.settings enable row level security;

-- Public bucket for covers, banners and the author photo.
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;
