import type { Occasion, TempBand } from '../types'

/** Was Julian vor dem Generieren auswählt, plus das heutige (lokale) Datum. */
export interface OutfitContext {
  tempBand: TempBand
  occasion: Occasion
  /** 'YYYY-MM-DD', lokal */
  today: string
}
