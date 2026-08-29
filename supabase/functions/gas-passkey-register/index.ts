// Filename: index.ts
// Last Edit Date: 2026-08-29 EST
// Version: 1.1

import { createClient } from 'npm:@supabase/supabase-js@2'
import { generateRegistrationOptions, verifyRegistrationResponse } from 'npm:@simplewebauthn/server@13'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'gas_tracker' } })
}

// verify_jwt is on for this function, so Supabase Auth has already rejected
// anything without a valid session by the time this code runs — this just
// extracts who that session belongs to.
async function getUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  })
  const {
    data: { user }
  } = await client.auth.getUser()
  return user
}

Deno.serve(async (req) => {
  const headers = { ...corsHeaders(req), 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const user = await getUser(req)
  if (!user?.email) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), { status: 401, headers })
  }

  const db = serviceClient()
  // rpID must be the domain of the *page* that called this function (the
  // app's own origin), not this Edge Function's own domain — those differ
  // here since the function lives on supabase.co while the app is served
  // from localhost or GitHub Pages.
  const origin = req.headers.get('Origin') ?? new URL(req.url).origin
  const rpID = new URL(origin).hostname
  const body = await req.json().catch(() => ({}))

  if (body.action === 'options') {
    const { data: existing } = await db
      .from('passkey_credentials')
      .select('credential_id, transports')
      .eq('user_id', user.id)

    const options = await generateRegistrationOptions({
      rpName: 'Gas Tracker',
      rpID,
      userName: user.email,
      userDisplayName: user.email,
      attestationType: 'none',
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id,
        transports: c.transports ?? undefined
      })),
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' }
    })

    await db.from('passkey_challenges').delete().eq('user_id', user.id)
    const { error: insertError } = await db
      .from('passkey_challenges')
      .insert({ user_id: user.id, challenge: options.challenge })
    if (insertError) {
      return new Response(JSON.stringify({ error: `Could not store challenge: ${insertError.message}` }), {
        status: 500,
        headers
      })
    }

    return new Response(JSON.stringify(options), { headers })
  }

  if (body.action === 'verify') {
    const { data: challengeRow } = await db
      .from('passkey_challenges')
      .select('challenge, expires_at')
      .eq('user_id', user.id)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!challengeRow || new Date(challengeRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Registration expired, try again.' }), {
        status: 400,
        headers
      })
    }

    const verification = await verifyRegistrationResponse({
      response: body.credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false
    })

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ error: 'Could not verify passkey.' }), {
        status: 400,
        headers
      })
    }

    const { credential } = verification.registrationInfo
    await db.from('passkey_credentials').insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: btoa(String.fromCharCode(...credential.publicKey)),
      counter: credential.counter,
      device_label: typeof body.deviceLabel === 'string' ? body.deviceLabel.slice(0, 60) : null,
      transports: credential.transports ?? []
    })
    await db.from('passkey_challenges').delete().eq('user_id', user.id)

    return new Response(JSON.stringify({ verified: true }), { headers })
  }

  return new Response(JSON.stringify({ error: 'Unknown action.' }), { status: 400, headers })
})
