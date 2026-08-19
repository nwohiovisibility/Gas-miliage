# Gas Mileage Tracker

A phone-installable web app (PWA) that scans your odometer and gas pump display
with your camera, does the text recognition entirely on-device, and tracks
fuel cost and MPG over time. Fill-up data is stored in Supabase.

## Set up Supabase

This app uses its own schema (`gas_tracker`) rather than the default
`public` one, so it's the only thing in it.

1. In your Supabase project's SQL editor, run:
   ```sql
   create schema gas_tracker;

   create table gas_tracker.fill_ups (
     id uuid primary key default gen_random_uuid(),
     date date not null,
     odometer numeric not null,
     gallons numeric not null,
     total_cost numeric not null,
     notes text
   );

   -- No login in this app, so RLS stays off and the anon key has full
   -- access to this table. Keep your anon key out of any public repo.
   alter table gas_tracker.fill_ups disable row level security;

   -- Custom schemas aren't reachable via the API by default; grant the
   -- API roles access to this one.
   grant usage on schema gas_tracker to anon, authenticated;
   grant all on gas_tracker.fill_ups to anon, authenticated;
   ```
2. In **Project Settings → Data API**, add `gas_tracker` to **Exposed
   schemas** (it only lists `public` by default — the table is
   unreachable from the app until you add it here).
3. In **Project Settings → API**, copy the **Project URL** and the
   **anon public** key.
4. In this folder, copy `.env.example` to `.env` and fill in those two
   values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   `.env` is gitignored, so these stay out of source control.

## Run it on your phone

1. On your computer, in this folder:
   ```
   npm install
   npm run dev
   ```
2. Vite will print a **Network** URL like `https://192.168.x.x:5173`. Your
   phone and computer must be on the same Wi-Fi network.
3. Open that URL in your phone's browser. The cert is self-signed, so you'll
   see a security warning the first time — tap through it ("Advanced" →
   "Proceed", or "Visit site"). This is required for camera access to work.
4. Add it to your home screen (Share → "Add to Home Screen" on iOS, or the
   browser menu → "Install app" on Android) so it behaves like a real app.

Your dev machine needs to keep running `npm run dev` while you use the app
this way. For a version that works without your computer being on, see
**Deploying for real use** below.

## Using it

- **New Fill-Up**: scan your odometer, confirm/correct the reading, scan the
  pump display, confirm/correct gallons and total cost, then save.
- OCR is a best-effort guess — every extracted number is shown in an editable
  field before you save, so a misread digit is easy to fix.
- **Dashboard**: total spent, total gallons, average MPG, cost per mile, and
  MPG/cost trend charts.
- **History**: every fill-up, editable or deletable, with per-fill-up MPG.
- Data is stored in your Supabase project, so it's shared across every
  device that has this app's URL and `.env` values — the app needs a network
  connection to load or save. Use "Export CSV" in the header to back it up
  or open it in a spreadsheet.

## Deploying for real use

Running `npm run dev` from your computer works for testing, but for
day-to-day use you'll want the app hosted somewhere with a real HTTPS
address, so it works from anywhere and doesn't depend on your computer being
on. Free static hosts that work well for this:

- **Vercel** or **Netlify**: connect this repo, they auto-detect Vite, done.
- **GitHub Pages**: `npm run build` then publish the `dist/` folder.

Any of these gives you a permanent `https://` URL — open it once on your
phone and "Add to Home Screen" as above.

## Tech notes

- React + TypeScript + Vite, built as an installable PWA (`vite-plugin-pwa`).
- Camera capture uses `getUserMedia` with a file-input fallback.
- OCR runs fully client-side via `tesseract.js` (WebAssembly); its language
  data is fetched from a CDN on first use and cached by the service worker
  for offline use afterward.
- Fill-up data is read/written via `@supabase/supabase-js`. No accounts, no
  analytics — the app connects to Supabase with just the anon key, so
  anyone with the deployed URL and that key can read/write the table (see
  "Set up Supabase" above).
- When deploying (Vercel/Netlify/etc.), set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` as environment variables in that host's project
  settings — the same two values from your local `.env`.
