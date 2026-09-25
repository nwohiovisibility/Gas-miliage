/*
Filename: vite-env.d.ts
Last Edit Date: 2026-09-25 EST
Purpose: Type declarations for Vite env variables and the app-version globals.
*/
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

// Set by public/app-version.js, loaded before the app in index.html.
interface Window {
  APP_VERSION?: string
  APP_BUILD_DATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
