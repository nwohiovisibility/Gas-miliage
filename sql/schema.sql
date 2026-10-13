-- Filename: schema.sql
-- Last Edit Date: 2026-10-13 EST
-- Purpose: Fresh install of the gas_tracker schema (fill-ups + passkey tables) in a Supabase project.

-- Run this once in the Supabase SQL editor of the project the app uses
-- (see README.md "Set up Supabase"). Everything lives in its own
-- gas_tracker schema, so it can share a project with other apps.

create schema gas_tracker;

-- Fill-ups: each row belongs to the signed-in user who saved it.
create table gas_tracker.fill_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  date date not null,
  odometer numeric not null,
  gallons numeric not null,
  total_cost numeric not null,
  notes text
);

create index fill_ups_user_id_idx on gas_tracker.fill_ups (user_id);

alter table gas_tracker.fill_ups enable row level security;

create policy "individual access" on gas_tracker.fill_ups
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Passkeys (Face ID / Touch ID / Windows Hello). Only the gas-passkey-*
-- Edge Functions touch these, using the service role key, so RLS is on
-- with no policies and nothing is granted to anon/authenticated.
create table gas_tracker.passkey_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  device_label text,
  transports text[],
  created_at timestamptz not null default now()
);

create table gas_tracker.passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge text not null,
  expires_at timestamptz not null default (now() + interval '2 minutes')
);

alter table gas_tracker.passkey_credentials enable row level security;
alter table gas_tracker.passkey_challenges enable row level security;

-- Custom schemas aren't reachable via the API by default, and only
-- signed-in requests (the "authenticated" role) get access to fill-ups --
-- the anon key alone can't touch any of these tables. The service role
-- (used by the Edge Functions) needs its own grants in a custom schema.
grant usage on schema gas_tracker to authenticated, service_role;
grant select, insert, update, delete on gas_tracker.fill_ups to authenticated;
grant all on all tables in schema gas_tracker to service_role;
