# Gas Mileage Tracker

A phone-installable web app (PWA) that scans your odometer and gas pump display
with your camera, does the text recognition entirely on-device (no cloud, no
API keys, works offline after first load), and tracks fuel cost and MPG over
time.

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
- Data is stored locally in the browser (`localStorage`) — nothing leaves
  your phone. Use "Export CSV" in the header to back it up or open it in a
  spreadsheet.

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
- No backend, no accounts, no analytics.
