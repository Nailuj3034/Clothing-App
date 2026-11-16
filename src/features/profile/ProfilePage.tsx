import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from '../../data/authRepo'
import { queryClient } from '../../data/queryClient'
import { loadTheme, saveTheme, type ThemePref } from '../../ui/theme'

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
]

/** Profil: Darstellung, Archiv, Abmelden. */
export function ProfilePage() {
  const [theme, setTheme] = useState<ThemePref>(loadTheme)

  function choose(t: ThemePref) {
    setTheme(t)
    saveTheme(t)
  }

  async function logout() {
    queryClient.clear() // gespeicherte Daten vom Gerät entfernen
    await signOut()
  }

  return (
    <main className="page">
      <h1 className="page-title">Profil</h1>

      <section className="stack">
        <h2 className="field__label">Darstellung</h2>
        <div className="segmented segmented--3" role="radiogroup" aria-label="Darstellung">
          {THEMES.map((t) => (
            <button key={t.value} type="button" role="radio" aria-checked={theme === t.value}
              className={theme === t.value ? 'is-on' : ''} onClick={() => choose(t.value)}>{t.label}</button>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="field__label">Kleiderschrank</h2>
        <Link to="/profil/archiv" className="btn btn--ghost">Archiv</Link>
      </section>

      <button className="btn btn--ghost" onClick={logout}>Abmelden</button>
    </main>
  )
}
