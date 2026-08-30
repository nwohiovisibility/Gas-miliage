/*
Filename: Lock.tsx
Last Edit Date: 2026-08-29 EST
Version: 1.5
*/
import { useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/browser'
import { supabase } from '../supabaseClient'

// The passkey Edge Functions return a JSON body like { error: "..." } on
// failure; supabase-js only exposes that through the raw Response on the
// thrown error, so this digs it out for a message worth showing someone.
async function invokeFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    let message = error.message
    if (error instanceof FunctionsHttpError) {
      try {
        const parsed = await error.context.json()
        if (parsed?.error) message = parsed.error
      } catch {
        // response wasn't JSON — fall back to the generic message
      }
    }
    throw new Error(message)
  }
  return data as T
}

interface Props {
  onUnlock: () => void
}

type Mode = 'idle' | 'password' | 'enter-code' | 'set-password' | 'offer-passkey'

const LAST_EMAIL_KEY = 'gas-tracker-last-email'

function loadLastEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

function rememberEmail(email: string) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email)
  } catch {
    // private browsing or storage disabled — not worth failing over
  }
}

function arrivedViaEmailLink() {
  return window.location.hash.includes('access_token') || new URLSearchParams(window.location.search).has('code')
}

function arrivedViaRecoveryLink() {
  return window.location.hash.includes('type=recovery')
}

export default function Lock({ onUnlock }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [email, setEmail] = useState(loadLastEmail)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Magic link / password recovery emails redirect back here with auth
  // tokens in the URL. supabase-js turns those into a session automatically
  // on load. A recovery link needs a new password set before anything else;
  // any other link (e.g. a plain magic-link sign-in) can skip straight to
  // passkey setup.
  useEffect(() => {
    if (!arrivedViaEmailLink()) return
    const isRecovery = arrivedViaRecoveryLink()
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.history.replaceState({}, '', window.location.pathname)
        setMode(isRecovery ? 'set-password' : 'offer-passkey')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Try Face ID the moment the lock screen appears, so there's nothing to
  // tap in the common case. Some browsers require a user gesture before
  // they'll show the prompt and block this silently — if so, this fails
  // quietly and the button below is the fallback.
  useEffect(() => {
    if (arrivedViaEmailLink()) return
    handlePasskeyUnlock({ silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePasskeyUnlock(opts?: { silent?: boolean }) {
    setBusy(true)
    if (!opts?.silent) setError(null)
    try {
      const options = await invokeFn<PublicKeyCredentialRequestOptionsJSON>('gas-passkey-login', {
        action: 'options'
      })
      const credential = await startAuthentication({ optionsJSON: options })
      const verified = await invokeFn<{ email: string; token_hash: string }>('gas-passkey-login', {
        action: 'verify',
        credential
      })
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: verified.token_hash,
        type: 'magiclink'
      })
      if (verifyError) throw verifyError
      rememberEmail(verified.email)
      onUnlock()
    } catch (err) {
      if (!opts?.silent) setError(err instanceof Error ? err.message : 'Could not unlock with Face ID.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) {
      rememberEmail(email)
      setMode('offer-passkey')
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email above first, then tap "Forgot password?"')
      return
    }
    setBusy(true)
    setError(null)
    // Email clients (Outlook Safe Links, etc.) often prefetch/scan links in
    // messages, silently burning the single-use recovery link before a
    // person clicks it. The email also includes a 6-digit code alongside
    // the link, so we ask for that instead of depending on the link at all.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setMode('enter-code')
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery'
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) {
      rememberEmail(email.trim())
      setMode('set-password')
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setMode('offer-passkey')
  }

  async function handleRegisterPasskey() {
    setBusy(true)
    setError(null)
    try {
      const options = await invokeFn<PublicKeyCredentialCreationOptionsJSON>('gas-passkey-register', {
        action: 'options'
      })
      const credential = await startRegistration({ optionsJSON: options })
      await invokeFn('gas-passkey-register', { action: 'verify', credential })
      onUnlock()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set up Face ID.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lock-screen">
      <span className="lock-icon">🔒</span>
      <h2>Gas Tracker is locked</h2>

      {mode === 'enter-code' && (
        <form className="lock-password-form" onSubmit={handleVerifyCode}>
          <p>Enter the 6-digit code we emailed to {email}.</p>
          {error && <p className="scan-warning lock-error">{error}</p>}
          <label>
            Code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Verifying…' : 'Verify code'}
          </button>
          <button className="btn-link" type="button" disabled={busy} onClick={handleForgotPassword}>
            Resend code
          </button>
        </form>
      )}

      {mode === 'set-password' && (
        <form className="lock-password-form" onSubmit={handleSetPassword}>
          <p>Set a new password for your account.</p>
          {error && <p className="scan-warning lock-error">{error}</p>}
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save password'}
          </button>
        </form>
      )}

      {mode !== 'offer-passkey' && mode !== 'set-password' && mode !== 'enter-code' && (
        <>
          <button className="btn btn-primary lock-unlock-btn" disabled={busy} onClick={() => handlePasskeyUnlock()}>
            {busy ? 'Waiting…' : '🔓 Unlock with Face ID'}
          </button>

          {error && <p className="scan-warning lock-error">{error}</p>}

          {mode === 'idle' && (
            <button className="btn-link" onClick={() => setMode('password')}>
              Use password instead
            </button>
          )}

          {mode === 'password' && (
            <form className="lock-password-form" onSubmit={handlePasswordSubmit}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button className="btn btn-secondary" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
              <button className="btn-link" type="button" disabled={busy} onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </form>
          )}
        </>
      )}

      {mode === 'offer-passkey' && (
        <div className="lock-offer-passkey">
          <p>Signed in. Set up Face ID so you can unlock without a password next time?</p>
          {error && <p className="scan-warning lock-error">{error}</p>}
          <div className="camera-actions">
            <button className="btn btn-primary" disabled={busy} onClick={handleRegisterPasskey}>
              {busy ? 'Setting up…' : 'Set up Face ID'}
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={onUnlock}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
