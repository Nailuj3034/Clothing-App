import { TEMP_BANDS, TEMP_BAND_LABELS, type TempBand } from '../../domain/types'

/** Temperatur als 3×2-Raster großer Buttons. */
export function TempBandPicker({ value, onChange }: { value: TempBand; onChange: (b: TempBand) => void }) {
  return (
    <div className="band-grid" role="radiogroup" aria-label="Temperatur">
      {TEMP_BANDS.map((b) => {
        const [name, range] = TEMP_BAND_LABELS[b].split(' ')
        return (
          <button key={b} type="button" role="radio" aria-checked={value === b}
            className={`band${value === b ? ' is-on' : ''}`} onClick={() => onChange(b)}>
            <span className="band__name">{name}</span>
            <span className="band__range">{range}</span>
          </button>
        )
      })}
    </div>
  )
}
