/**
 * Theme-Wahl: System / Hell / Dunkel.
 * „System“ entfernt das Attribut – dann greift prefers-color-scheme in tokens.css.
 * Gespeichert wird nur im Browser (Komfort-Einstellung pro Gerät).
 */
export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'theme'
const META_COLORS = { light: '#fffaf6', dark: '#000000' }

export function loadTheme(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch { /* ignorieren */ }
  return 'system'
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)

  // Farbe der Browser-/Statusleiste anpassen
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? META_COLORS.dark : META_COLORS.light)
}

export function saveTheme(pref: ThemePref) {
  try { localStorage.setItem(KEY, pref) } catch { /* ignorieren */ }
  applyTheme(pref)
}
