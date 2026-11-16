import { useState, type FormEvent } from 'react'
import { signIn } from '../../data/authRepo'
import './auth.css'

/** Login-Seite: E-Mail + Passwort. Registrierung gibt es bewusst nicht (nur ein Nutzer). */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(await signIn(email.trim(), password))
    setBusy(false)
  }

  return (
    <main className="login">
      <h1 className="page-title">Outfit</h1>
      <p className="login__sub">Melde dich an, um deinen Kleiderschrank zu öffnen.</p>
      <form className="login__form" onSubmit={handleSubmit}>
        <label htmlFor="login-email">E-Mail</label>
        <input id="login-email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="login-password">Passwort</label>
        <input id="login-password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="login__error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>
    </main>
  )
}
