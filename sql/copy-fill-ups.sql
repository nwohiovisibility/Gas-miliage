-- Filename: copy-fill-ups.sql
-- Last Edit Date: 2026-10-13 EST
-- Purpose: One-time copy of existing fill-ups from the old Supabase project into the new one.

-- Passkeys are not copied: a passkey only works on the domain it was set
-- up on, so set Face ID up again after signing in on the new site.

-- STEP 1 -- run in the OLD project's SQL editor. It returns one row with
-- one column, "sql": an INSERT statement holding every fill-up. Copy that
-- whole value.
select
  'insert into gas_tracker.fill_ups (id, user_id, date, odometer, gallons, total_cost, notes) '
  || 'select v.id, u.id, v.date, v.odometer, v.gallons, v.total_cost, v.notes '
  || 'from (values '
  || string_agg(
       format('(%L::uuid, %L::date, %s, %s, %s, %L)',
              id, date, odometer, gallons, total_cost, notes),
       ', ' order by odometer)
  || ') as v(id, date, odometer, gallons, total_cost, notes) '
  || 'cross join (select id from auth.users where email = ''YOUR-EMAIL'') u '
  || 'on conflict (id) do nothing;' as sql
from gas_tracker.fill_ups;

-- STEP 2 -- in the NEW project's SQL editor (after running schema.sql and
-- creating your user under Authentication -> Users): paste the statement
-- from step 1, replace YOUR-EMAIL with that user's email, and run it.
-- Re-running is safe; rows already copied are skipped. Then check:
--   select count(*) from gas_tracker.fill_ups;
