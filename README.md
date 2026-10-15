<!--
Filename: README.md
Last Edit Date: 2026-10-15 EST
Purpose: Setup, usage, and deployment notes for the Gas Mileage Tracker.
-->

# Gas Mileage Tracker

A phone-installable web app (PWA) for logging fill-ups (odometer, gallons,
total cost) and tracking fuel cost and MPG over time. Fill-up data is stored in Supabase.

## Set up Supabase

The app lives in the shared personal Supabase project (**Tools**, in the
Ghostwolf Tools org), alongside the reminders app. It uses its own schema
(`gas_tracker`) rather than `public`, so it stays separate from anything
else in that project. Data is locked to your one account via Row Level
Security (RLS): the publishable/anon key alone can't read or write
anything, even though that key is visible in the deployed page.

### 1. Create the tables and Edge Functions

- Run [`sql/schema.sql`](sql/schema.sql) once in the project's SQL editor
  (fill-ups table plus the two passkey tables).
- Deploy the two Face ID functions from this repo:
  `supabase functions deploy gas-passkey-login --no-verify-jwt` and
  `supabase functions deploy gas-passkey-register` (JWT check stays on).
- In **Project Settings → Data API**, add `gas_tracker` to **Exposed
  schemas** (it only lists `public` by default; the app and the functions
  can't reach the tables until you add it).

### 2. Create your account

Rather than a public sign-up form (which anyone hitting the URL could
use), create your one account directly in the dashboard:
**Authentication → Users → Add user**. Use a real email and a strong
password; this is your fallback sign-in if you ever lose your
passkey/device.

Then, **Authentication → Sign In / Providers → User Signups**, turn **off** "Allow new users to
sign up", unless another app in the same project needs public sign-up
(the setting is project-wide).

Under **Authentication → URL Configuration**, add
`https://gas.ghostwolftools.com` (and `https://localhost:5173` for local
dev, plus the `*.workers.dev` address while testing) to **Redirect URLs**;
otherwise auth emails fall back to the Site URL.

Under **Authentication → Emails → Templates → Reset Password**, make the
email show the 6-digit code (the app asks for the code, not the link;
see `handleForgotPassword` in `src/components/Lock.tsx`), e.g.:
```html
<h2>Reset your password</h2>
<p>Enter this code in the app:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>If you didn't ask for this, ignore this email.</p>
```
Keep **Email OTP Length** (Sign In / Providers → Email) at 6 to match the
app's code box.

### 3. Copy over existing fill-ups (one time)

[`sql/copy-fill-ups.sql`](sql/copy-fill-ups.sql) moves fill-ups from the
old project: run step 1 in the old project, then paste its output into
the new project with your email filled in. Passkeys don't carry over
(they're tied to the old domain); set up Face ID again after your first
password sign-in on the new site.

### 4. Get your API keys and `.env`

In **Project Settings → API Keys**, copy the **Project URL** and the
**publishable** key (`sb_publishable_...`; the legacy anon key also
works). In this folder, copy `.env.example` to `.env` and fill in those
two values:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```
`.env` is gitignored, so these stay out of source control. The deployed
build gets the same two values from Cloudflare build variables (below).

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
   "Proceed", or "Visit site"). This is required for passkeys to work.
4. Add it to your home screen (Share → "Add to Home Screen" on iOS, or the
   browser menu → "Install app" on Android) so it behaves like a real app.

Your dev machine needs to keep running `npm run dev` while you use the app
this way. For a version that works without your computer being on, see
**Deploying for real use** below.

Passkeys are tied to the domain they were registered on, so Face ID won't
work against this local dev URL if you registered it on the deployed
site (or vice versa) — use "Use password instead" on
whichever origin you didn't set the passkey up on.

## Using it

- **Lock screen**: opens every time you launch the app. Tap "Unlock with
  Face ID" (or Touch ID / Windows Hello, depending on your device) — the
  first time on a new device, use "Use password instead" and then set up
  a passkey when prompted. Tap the 🔒 in the header any time to sign out
  and re-lock.
- **New Fill-Up**: enter your odometer reading, then gallons (to 3 decimals,
  as the pump shows) and total cost, confirm the date, and save.
- **Dashboard**: total spent, total gallons, average MPG, cost per mile, and
  MPG/cost trend charts.
- **History**: every fill-up, editable or deletable, with per-fill-up MPG.
- Data is stored in your Supabase project, scoped to your account by Row
  Level Security, so it's only ever visible to you, on any device you sign
  into — the app needs a network connection to load or save. Use "Export
  CSV" in the header to back it up or open it in a spreadsheet.

## Deploying for real use

The app is hosted on **Cloudflare Workers** (static assets) at
`https://gas.ghostwolftools.com`. Every push to `main` builds and deploys
it. `wrangler.jsonc` tells Cloudflare to serve the built `dist/` folder.

One-time setup, in the personal Cloudflare account:

1. **Workers & Pages → Create → Import a repository**, pick
   `nwohiovisibility/Gas_Mileage`.
2. Project name `gas-mileage`, production branch `main`.
   **Build command**: `npm run build`. **Deploy command**: leave the
   default `npx wrangler deploy`. (Cloudflare installs dependencies
   itself, and it ignores a build command written in `wrangler.jsonc`, so
   it has to be set here.)
3. Under **Build variables** (Settings → Build → Variables and secrets),
   add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same
   values as your `.env`. Vite bakes them into the build, so they must be
   *build* variables, not runtime ones.
4. Save and deploy, then check the `*.workers.dev` URL works.
5. Custom domain: **the Worker → Settings → Domains & Routes → Add →
   Custom domain**, enter `gas.ghostwolftools.com`. This needs
   `ghostwolftools.com` to be a zone in the same Cloudflare account
   (nameservers pointed at Cloudflare); Cloudflare then creates the DNS
   record and certificate itself.

Open the site once on your phone and "Add to Home Screen" as above.

## Tech notes

- React + TypeScript + Vite, built as an installable PWA (`vite-plugin-pwa`).
- Fill-up data is read/written via `@supabase/supabase-js`. Access is
  gated by Supabase Auth (a single account, no public sign-up) plus Row
  Level Security, so the publishable key alone can't read or write
  anything. See "Set up Supabase" above.
- Face ID/Touch ID/Windows Hello unlock uses this repo's own Edge
  Functions (`supabase/functions/gas-passkey-*`) and the
  `gas_tracker.passkey_*` tables. A passkey only works on the domain it
  was set up on.
- Hosted on Cloudflare Workers static assets from the site root
  (`vite.config.ts` uses `base: '/'`).
