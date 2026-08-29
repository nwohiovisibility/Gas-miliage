/*
Filename: vite.config.ts
Last Edit Date: 2026-08-29 EST
Version: 1.0
*/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// Camera access (getUserMedia) requires a secure context on phones, so the
// dev server runs over HTTPS with a self-signed cert (accept the browser
// warning once on your phone) in addition to localhost.
// Served from https://<user>.github.io/Gas-miliage/ in production, so
// asset URLs and the PWA manifest need that sub-path prefix. Dev keeps
// serving from the root so the existing phone-testing flow is unaffected.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Gas-miliage/' : '/',
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Gas Mileage Tracker',
        short_name: 'Gas Tracker',
        description: 'Scan your odometer and gas pump to track fuel cost and MPG over time.',
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
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        runtimeCaching: [
          {
            // Tesseract.js fetches its OCR worker/core/language files from
            // a CDN on first use; cache them so later scans work offline.
            urlPattern: ({ url }) =>
              url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-assets',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
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
