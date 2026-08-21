-- Fresh install: run this in the Supabase SQL editor if gas_tracker.fill_ups
-- does not exist yet. Replace YOUR-USER-UUID with the UUID of the user you
-- created under Authentication -> Users (see README.md "Set up Supabase").

create schema gas_tracker;

create table gas_tracker.fill_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  date date not null,
  odometer numeric not null,
  gallons numeric not null,
  total_cost numeric not null,
  notes text
);

alter table gas_tracker.fill_ups enable row level security;

create policy "individual access" on gas_tracker.fill_ups
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Custom schemas aren't reachable via the API by default, and only
-- signed-in requests (the "authenticated" role) get access -- the
-- anon key alone can't touch this table at all.
grant usage on schema gas_tracker to authenticated;
grant select, insert, update, delete on gas_tracker.fill_ups to authenticated;
