import type { Item } from '../../domain/types'

/** Großer Umschalter „da“ / „weg“ – ein Tap genügt. */
export function AvailabilityToggle({ item, onToggle }: { item: Item; onToggle: (available: boolean) => void }) {
  return (
    <button
      type="button"
      className={`avail${item.available ? '' : ' avail--out'}`}
      aria-pressed={item.available}
      aria-label={`${item.name}: ${item.available ? 'da' : 'weg'} – antippen zum Umschalten`}
      onClick={() => onToggle(!item.available)}
    >
      {item.available ? 'da' : 'weg'}
    </button>
  )
}
