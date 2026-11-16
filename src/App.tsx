import { AuthGate } from './features/auth/AuthGate'
import { signOut } from './data/authRepo'

// Vorläufige Startseite hinter dem Login; Routing und Navigation kommen in Task 4.
export default function App() {
  return (
    <AuthGate>
      <main style={{ padding: '24px 16px' }}>
        <h1 className="page-title">Kleiderschrank</h1>
        <p style={{ color: 'var(--muted)' }}>Du bist eingeloggt. Die App wird gerade aufgebaut.</p>
        <button className="btn btn--ghost" onClick={() => signOut()}>Abmelden</button>
      </main>
    </AuthGate>
  )
}
