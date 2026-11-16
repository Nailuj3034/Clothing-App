import { OCCASIONS, OCCASION_LABELS, type Occasion } from '../../domain/types'
import { Chip } from '../../ui/Chip'

/** Anlass als Reihe von Chips (genau einer aktiv). */
export function OccasionPicker({ value, onChange }: { value: Occasion; onChange: (o: Occasion) => void }) {
  return (
    <div className="chips" role="group" aria-label="Anlass">
      {OCCASIONS.map((o) => (
        <Chip key={o} selected={value === o} onClick={() => onChange(o)}>{OCCASION_LABELS[o]}</Chip>
      ))}
    </div>
  )
}
