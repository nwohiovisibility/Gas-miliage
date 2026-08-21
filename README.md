# Gas Mileage Tracker

A phone-installable web app (PWA) that scans your odometer and gas pump display
with your camera, does the text recognition entirely on-device, and tracks
fuel cost and MPG over time. Fill-up data is stored in Supabase.

## Set up Supabase

This app uses its own schema (`gas_tracker`) rather than the default
`public` one, so it's the only thing in it. Data is locked to your one
account via Row Level Security (RLS) — the anon key alone can't read or
write anything.

### 1. Create your account

Rather than a public sign-up form (which anyone hitting the URL could
use), create your one account directly in the dashboard:
**Authentication → Users → Add user**. Use a real email and a strong
password — this becomes your fallback sign-in if you ever lose access to
your passkey/device. Copy the user's **UUID** shown in the table; you
need it below.

Then, **Authentication → Settings**, turn **off** "Allow new users to
sign up" — nobody else should be able to create an account.

### 2. Create the table

Open the appropriate file in [`sql/`](sql/), replace `YOUR-USER-UUID`
with the UUID from step 1, then copy **only the SQL statements** (not
this README) into the Supabase SQL editor and run it:

- [`sql/schema.sql`](sql/schema.sql) — fresh install, `gas_tracker.fill_ups`
  doesn't exist yet.
- `sql/migrate-existing-table.sql` — only if you already created the table
  before Face ID/account login was added (no `user_id`/RLS yet). This one
  is gitignored locally once you fill in your real UUID, so it won't show
  up if you clone this repo elsewhere or look at it on GitHub.

In **Project Settings → Data API**, add `gas_tracker` to **Exposed
schemas** (it only lists `public` by default — the table is
unreachable from the app until you add it here).

### 3. Turn on Face ID / Touch ID / Windows Hello unlock

**Authentication → Passkeys** → enable **Passkey authentication**. Fill
in:
- **RP Display Name**: anything, e.g. `Gas Tracker`
- **RP ID**: your bare domain, e.g. `your-username.github.io` (no
  `https://`, no path)
- **RP Origins**: `https://your-username.github.io`

The dashboard usually pre-fills these from your project's Site URL —
double check the RP ID matches wherever you deploy the app (see
"Deploying for real use" below), since a passkey only works on the
origin it was registered for.

### 4. Get your API keys and `.env`

In **Project Settings → API**, copy the **Project URL** and the
**anon public** key (also called the "publishable" key in newer
projects). In this folder, copy `.env.example` to `.env` and fill in
those two values:
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

Passkeys are tied to the domain they were registered on, so Face ID won't
work against this local dev URL if you registered it on the deployed
GitHub Pages site (or vice versa) — use "Use password instead" on
whichever origin you didn't set the passkey up on.

## Using it

- **Lock screen**: opens every time you launch the app. Tap "Unlock with
  Face ID" (or Touch ID / Windows Hello, depending on your device) — the
  first time on a new device, use "Use password instead" and then set up
  a passkey when prompted. Tap the 🔒 in the header any time to sign out
  and re-lock.
- **New Fill-Up**: scan your odometer, confirm/correct the reading, scan the
  pump display, confirm/correct gallons and total cost, then save.
- OCR is a best-effort guess — every extracted number is shown in an editable
  field before you save, so a misread digit is easy to fix.
- **Dashboard**: total spent, total gallons, average MPG, cost per mile, and
  MPG/cost trend charts.
- **History**: every fill-up, editable or deletable, with per-fill-up MPG.
- Data is stored in your Supabase project, scoped to your account by Row
  Level Security, so it's only ever visible to you, on any device you sign
  into — the app needs a network connection to load or save. Use "Export
  CSV" in the header to back it up or open it in a spreadsheet.

## Deploying for real use

Running `npm run dev` from your computer works for testing, but for
day-to-day use you'll want the app hosted somewhere with a real HTTPS
address, so it works from anywhere and doesn't depend on your computer being
on. This repo deploys to **GitHub Pages** via the included workflow
(`.github/workflows/deploy.yml`):

1. In the repo on GitHub: **Settings → Secrets and variables → Actions →
   New repository secret**. Add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with the same values from your local `.env` —
   the build needs them to bake the Supabase connection into the static
   files (GitHub Pages can't read a `.env` file at request time).
2. **Settings → Pages → Build and deployment → Source**, set to
   **GitHub Actions**.
3. Push to `main`. The workflow builds and deploys automatically — check
   the **Actions** tab for progress, and the deployed URL afterward
   (`https://<your-username>.github.io/Gas-miliage/`).

Open that URL once on your phone and "Add to Home Screen" as above. Every
future push to `main` redeploys it.

## Tech notes

- React + TypeScript + Vite, built as an installable PWA (`vite-plugin-pwa`).
- Camera capture uses `getUserMedia` with a file-input fallback.
- OCR runs fully client-side via `tesseract.js` (WebAssembly); its language
  data is fetched from a CDN on first use and cached by the service worker
  for offline use afterward.
- Fill-up data is read/written via `@supabase/supabase-js`. Access is
  gated by Supabase Auth (a single account, no public sign-up) plus Row
  Level Security, so the anon key alone can't read or write anything —
  see "Set up Supabase" above. Face ID/Touch ID/Windows Hello unlock uses
  Supabase's (beta) native passkey support.
- Deployed via GitHub Actions to GitHub Pages at the `/Gas-miliage/`
  sub-path (`vite.config.ts` sets `base` accordingly for production
  builds only — local dev still serves from `/`).
