import type { Item } from '../../domain/types'
import { getColor } from '../../domain/palette'
import { CategoryIcon } from '../../ui/CategoryIcon'

/**
 * Vorschaubild eines Teils.
 * Ohne Foto: Fläche in der Hauptfarbe mit Kategorie-Symbol (Foto-Anzeige folgt in Task 5).
 */
export function ItemThumb({ item, size = 56 }: { item: Item; size?: number }) {
  const color = getColor(item.colorPrimary)
  const iconColor = isLight(color.hex) ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.85)'
  return (
    <div className="thumb" style={{ width: size, height: size, background: color.hex }}>
      <CategoryIcon category={item.category} color={iconColor} size={Math.round(size * 0.55)} />
    </div>
  )
}

/** Grobe Helligkeit eines Hex-Werts, damit das Symbol auf hellen Farben dunkel ist. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 160
}
