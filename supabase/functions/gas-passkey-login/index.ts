// Filename: index.ts
// Last Edit Date: 2026-08-29 EST
// Version: 1.0

import { createClient } from 'npm:@supabase/supabase-js@2'
import { generateAuthenticationOptions, verifyAuthenticationResponse } from 'npm:@simplewebauthn/server@13'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: 'gas_tracker' } })
}

function adminAuthClient() {
  // Needs the default `auth` schema, not `gas_tracker`, to call admin.* methods.
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

Deno.serve(async (req) => {
  const headers = { ...corsHeaders(req), 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const db = serviceClient()
  // See gas-passkey-register for why this comes from the Origin header
  // rather than this function's own request URL.
  const origin = req.headers.get('Origin') ?? new URL(req.url).origin
  const rpID = new URL(origin).hostname
  const body = await req.json().catch(() => ({}))

  if (body.action === 'options') {
    const { data: credentials } = await db.from('passkey_credentials').select('credential_id, transports')

    if (!credentials || credentials.length === 0) {
      return new Response(JSON.stringify({ error: 'No passkeys are set up yet.' }), {
        status: 400,
        headers
      })
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((c) => ({
        id: c.credential_id,
        transports: c.transports ?? undefined
      })),
      userVerification: 'preferred'
    })

    await db.from('passkey_challenges').insert({ user_id: null, challenge: options.challenge })

    return new Response(JSON.stringify(options), { headers })
  }

  if (body.action === 'verify') {
    const credentialId = body.credential?.id
    const { data: stored } = await db
      .from('passkey_credentials')
      .select('id, user_id, credential_id, public_key, counter, transports')
      .eq('credential_id', credentialId)
      .maybeSingle()

    if (!stored) {
      return new Response(JSON.stringify({ error: 'Unrecognized passkey.' }), { status: 400, headers })
    }

    const { data: challengeRow } = await db
      .from('passkey_challenges')
      .select('id, challenge, expires_at')
      .is('user_id', null)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!challengeRow || new Date(challengeRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Login expired, try again.' }), { status: 400, headers })
    }

    const publicKeyBytes = Uint8Array.from(atob(stored.public_key), (c) => c.charCodeAt(0))

    const verification = await verifyAuthenticationResponse({
      response: body.credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: stored.credential_id,
        publicKey: publicKeyBytes,
        counter: stored.counter,
        transports: stored.transports ?? undefined
      }
    })

    if (!verification.verified) {
      return new Response(JSON.stringify({ error: 'Could not verify passkey.' }), { status: 400, headers })
    }

    await db
      .from('passkey_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('id', stored.id)
    await db.from('passkey_challenges').delete().eq('id', challengeRow.id)

    const authClient = adminAuthClient()
    const {
      data: { user },
      error: userError
    } = await authClient.auth.admin.getUserById(stored.user_id)
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Account not found.' }), { status: 400, headers })
    }

    const { data: link, error: linkError } = await authClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    })
    if (linkError || !link) {
      return new Response(JSON.stringify({ error: linkError?.message ?? 'Could not sign in.' }), {
        status: 400,
        headers
      })
    }

    return new Response(
      JSON.stringify({ email: user.email, token_hash: link.properties.hashed_token }),
      { headers }
    )
  }

  return new Response(JSON.stringify({ error: 'Unknown action.' }), { status: 400, headers })
})
