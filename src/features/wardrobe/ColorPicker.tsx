import { PALETTE } from '../../domain/palette'
import type { ColorKey } from '../../domain/types'

/**
 * Farbauswahl aus der festen Palette: große runde Felder zum Antippen.
 * `allowNone` zeigt zusätzlich „Keine“ (für die optionale Zweitfarbe).
 */
export function ColorPicker({ value, onChange, allowNone = false, label }: {
  value: ColorKey | null
  onChange: (c: ColorKey | null) => void
  allowNone?: boolean
  label: string
}) {
  return (
    <div className="color-picker" role="radiogroup" aria-label={label}>
      {allowNone && (
        <button type="button" role="radio" aria-checked={value === null}
          className={`swatch swatch--none${value === null ? ' is-on' : ''}`} onClick={() => onChange(null)}>
          <span>Keine</span>
        </button>
      )}
      {PALETTE.map((c) => (
        <button key={c.key} type="button" role="radio" aria-checked={value === c.key} title={c.label}
          className={`swatch${value === c.key ? ' is-on' : ''}`} onClick={() => onChange(c.key)}>
          <span className="swatch__dot" style={{ background: c.hex }} />
          <span className="swatch__label">{c.label}</span>
        </button>
      ))}
    </div>
  )
}
