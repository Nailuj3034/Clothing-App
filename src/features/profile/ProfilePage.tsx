import { signOut } from '../../data/authRepo'

/** Profil: vorerst nur Abmelden (Theme-Wahl und Archiv folgen in Task 13/15). */
export function ProfilePage() {
  return (
    <main className="page">
      <h1 className="page-title">Profil</h1>
      <div className="stack">
        <button className="btn btn--ghost" onClick={() => signOut()}>Abmelden</button>
      </div>
    </main>
  )
}
