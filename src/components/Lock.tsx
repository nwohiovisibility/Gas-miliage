import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface Props {
  onUnlock: () => void
}

type Mode = 'idle' | 'password' | 'offer-passkey'

function arrivedViaEmailLink() {
  return window.location.hash.includes('access_token') || new URLSearchParams(window.location.search).has('code')
}

export default function Lock({ onUnlock }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Magic link / password recovery emails redirect back here with auth
  // tokens in the URL. supabase-js turns those into a session automatically
  // on load — this just recognizes that and skips straight to passkey setup
  // instead of asking for a password we don't have.
  useEffect(() => {
    if (!arrivedViaEmailLink()) return
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.history.replaceState({}, '', window.location.pathname)
        setMode('offer-passkey')
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
    const { data, error } = await supabase.auth.signInWithPasskey()
    setBusy(false)
    if (error) {
      if (!opts?.silent) setError(error.message)
      return
    }
    if (data.session) onUnlock()
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
    if (data.session) setMode('offer-passkey')
  }

  async function handleRegisterPasskey() {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.registerPasskey()
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    onUnlock()
  }

  return (
    <div className="lock-screen">
      <span className="lock-icon">🔒</span>
      <h2>Gas Tracker is locked</h2>

      {mode !== 'offer-passkey' && (
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
