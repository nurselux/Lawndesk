-- Create quotes table
create table if not exists public."Quotes" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid,
  client_name text not null,
  title text not null,
  description text,
  line_items jsonb default '[]'::jsonb,
  amount numeric(10,2) not null default 0,
  status text not null default 'draft',
  share_token uuid not null default gen_random_uuid(),
  expires_at date,
  job_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

-- Unique index on share_token for fast public lookups
create unique index if not exists quotes_share_token_idx on public."Quotes"(share_token);

-- Enable RLS
alter table public."Quotes" enable row level security;

-- Admin: full access to own quotes
drop policy if exists "quotes_admin_all" on public."Quotes";
create policy "quotes_admin_all" on public."Quotes"
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public: read via share_token (no auth required)
drop policy if exists "quotes_public_read" on public."Quotes";
create policy "quotes_public_read" on public."Quotes"
  for select
  using (true);
