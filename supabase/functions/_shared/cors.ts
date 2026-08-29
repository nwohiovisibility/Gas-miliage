// Filename: cors.ts
// Last Edit Date: 2026-08-29 EST
// Version: 1.0

// The app is served from localhost during dev and from GitHub Pages in
// production, so the allowed origin is whatever actually made the request
// rather than a fixed value.
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  }
}
