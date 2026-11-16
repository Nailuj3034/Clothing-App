import type { Category } from '../domain/types'

/** Einfache Umriss-Symbole pro Kategorie (Platzhalter, wenn kein Foto vorhanden ist). */
const PATHS: Record<Category, string> = {
  top: 'M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z',
  bottom: 'M6 3h12l1 18h-5l-2-11-2 11H5z',
  shoes: 'M2 15c3 0 5-2 7-5l4 3c2 1 5 1 9 2v4H2z',
  jacket: 'M8 3l-5 3v15h6V9h6v12h6V6l-5-3-4 4z',
  accessory: 'M12 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM10 17h4l-1 4h-2z',
}

export function CategoryIcon({ category, color = 'currentColor', size = 28 }:
  { category: Category; color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden="true">
      <path d={PATHS[category]} fillRule="evenodd" />
    </svg>
  )
}
