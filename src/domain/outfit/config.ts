import type { AccessoryType, Occasion, TempBand, Warmth } from '../types'

/**
 * Alle Stellschrauben des Outfit-Generators an einer Stelle.
 * Wer Gewichte, Grenzen oder Zeitfenster ändern will, muss nur diese Datei anfassen.
 */

export type JacketRule = 'required' | 'optional' | 'none'

export interface BandRule {
  /** erlaubte Wärmegrade für Kleidung */
  warmth: readonly Warmth[]
  jacket: JacketRule
  /** ideal passender Wärmegrad (gibt Bonuspunkte) */
  preferred: Warmth
}

/** Temperatur-Bänder (Grenzen: Frost <0°, Kalt 0–8°, Kühl 8–15°, Mild 15–22°, Warm 22–27°, Heiß >27°) */
const BANDS: Record<TempBand, BandRule> = {
  frost: { warmth: ['warm'], jacket: 'required', preferred: 'warm' },
  cold: { warmth: ['medium', 'warm'], jacket: 'required', preferred: 'warm' },
  cool: { warmth: ['light', 'medium', 'warm'], jacket: 'required', preferred: 'medium' },
  mild: { warmth: ['light', 'medium'], jacket: 'optional', preferred: 'light' },
  warm: { warmth: ['light', 'medium'], jacket: 'none', preferred: 'light' },
  hot: { warmth: ['light'], jacket: 'none', preferred: 'light' },
}

export const OUTFIT_CONFIG = {
  bands: BANDS,

  /** Teile, die vor höchstens so vielen Tagen getragen wurden, bekommen Abzug (1 = heute oder gestern) */
  recentlyWornDays: 1,
  recentlyWornPenalty: 8,
  /** Exakt gleiche Kombination wird ausgeschlossen, wenn sie in den letzten N Tagen getragen wurde */
  excludeSameComboDays: 3,

  suggestionsPerPage: 3,

  /** Punkte der Farbharmonie-Regel */
  colorPoints: {
    allNeutral: 20,
    singleAccent: 25,
    earthBonus: 5,
    twoAccentsSameTemp: 10,
    clashingTemps: -20,
    tooManyAccents: -10,
  },
  /** Bonus je Kleidungsstück mit ideal passendem Wärmegrad */
  warmthFitPoints: 5,

  /** Schmuck: Obergrenzen pro Art und max. Wechsel gegenüber dem Standard-Set */
  accessoryLimits: { watch: 1, necklace: 2, bracelet: 3, ring: 4 } satisfies Record<AccessoryType, number>,
  maxAccessorySwaps: 2,
  /** Erlaubte Schmuck-Arten je Anlass; fehlt ein Anlass, sind alle Arten erlaubt */
  accessoryTypesByOccasion: { sport: ['watch'] } as Partial<Record<Occasion, readonly AccessoryType[]>>,
} as const
