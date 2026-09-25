/*
Filename: vite.config.ts
Last Edit Date: 2026-09-25 EST
Purpose: Vite build config: React, HTTPS dev server, and PWA manifest/service worker.
*/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// Passkeys (WebAuthn) require a secure context on phones, so the dev server
// runs over HTTPS with a self-signed cert (accept the browser warning once
// on your phone) in addition to localhost.
// Served from the custom domain https://gas.nwohiovisibility.com/ in
// production (public/CNAME), so assets are served from the root rather
// than a GitHub Pages project sub-path.
export default defineConfig(() => ({
  base: '/',
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Gas Mileage Tracker',
        short_name: 'Gas Tracker',
        description: 'Log your fill-ups to track fuel cost and MPG over time.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024
      }
    })
  ],
  server: {
    host: true,
    open: true,
    port: 5173,
    strictPort: true
  }
}))
