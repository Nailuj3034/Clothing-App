import { NavLink } from 'react-router-dom'

/** Navigation unten – im Daumenbereich. */
const TABS = [
  { to: '/', label: 'Schrank', icon: 'M4 3h16v18H4zM12 3v18M9 11v2M15 11v2' },
  { to: '/outfit', label: 'Outfit', icon: 'M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z' },
  { to: '/3d', label: '3D', icon: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7' },
  { to: '/profil', label: 'Profil', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}
          className={({ isActive }) => `bottom-nav__tab${isActive ? ' is-active' : ''}`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={t.icon} /></svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
