import type { Occasion, TempBand } from '../../domain/types'

/** Zuletzt gewählte Temperatur + Anlass, im Browser gemerkt (darf fehlen oder blockiert sein). */
export interface OutfitChoice { tempBand: TempBand; occasion: Occasion }

const STORAGE_KEY = 'outfit-context'

export function loadChoice(): OutfitChoice {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved?.tempBand && saved?.occasion) return saved
  } catch { /* ignorieren */ }
  return { tempBand: 'cool', occasion: 'uni' }
}

export function saveChoice(choice: OutfitChoice) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(choice)) } catch { /* ignorieren */ }
}
