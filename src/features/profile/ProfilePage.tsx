import { Link } from 'react-router-dom'
import { signOut } from '../../data/authRepo'

/** Profil: Archiv und Abmelden (Theme-Wahl folgt in Task 15). */
export function ProfilePage() {
  return (
    <main className="page">
      <h1 className="page-title">Profil</h1>
      <div className="stack">
        <Link to="/profil/archiv" className="btn btn--ghost">Archiv</Link>
        <button className="btn btn--ghost" onClick={() => signOut()}>Abmelden</button>
      </div>
    </main>
  )
}
