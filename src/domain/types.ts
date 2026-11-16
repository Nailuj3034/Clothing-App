/**
 * Fachliche Grundtypen der App.
 * Diese Datei ist das „Vokabular“ – alle Schichten (data, features) bauen darauf auf.
 * Neue Kategorien/Anlässe: hier ergänzen + Check-Constraint in der Datenbank-Migration.
 */

export type Category = 'top' | 'bottom' | 'shoes' | 'jacket' | 'accessory'
export type AccessoryType = 'necklace' | 'ring' | 'bracelet' | 'watch'
export type Warmth = 'light' | 'medium' | 'warm'
export type Occasion = 'uni' | 'leisure' | 'going_out' | 'sport'
/** Temperatur-Band, das Julian vor dem Generieren auswählt (später: aus Wetter-API). */
export type TempBand = 'frost' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot'

export type ColorKey =
  | 'black' | 'white' | 'grey' | 'anthracite' | 'navy' | 'beige'
  | 'brown' | 'olive' | 'mustard'
  | 'blue' | 'lightblue' | 'green' | 'red' | 'burgundy' | 'pink'
  | 'silver' | 'gold'

export interface PaletteColor {
  key: ColorKey
  label: string
  hex: string
  /** Rolle für die Farbharmonie-Regeln */
  role: 'neutral' | 'earth' | 'accent' | 'metal'
  /** Farbtemperatur (nur für Akzente relevant) */
  temperature: 'cool' | 'warm' | 'none'
}

/** Ein Kleidungsstück oder Accessoire im Schrank. */
export interface Item {
  id: string
  name: string
  category: Category
  /** Nur bei category === 'accessory' gesetzt */
  accessoryType: AccessoryType | null
  /** Schmuck: „Trage ich meistens“ (Standard-Set) */
  isCore: boolean
  colorPrimary: ColorKey
  colorSecondary: ColorKey | null
  warmth: Warmth
  occasions: Occasion[]
  /** Pfad im privaten Storage-Bucket, keine URL */
  photoPath: string | null
  available: boolean
  /** ISO-Zeitstempel; gesetzt = archiviert */
  archivedAt: string | null
}

/** Ein als „getragen“ gespeichertes Outfit. */
export interface WornOutfit {
  id: string
  /** Lokales Datum im Format YYYY-MM-DD */
  wornOn: string
  tempBand: TempBand
  occasion: Occasion
  itemIds: string[]
}

// ---- Deutsche Anzeigenamen (UI) ----

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Oberteil', bottom: 'Unterteil', shoes: 'Schuhe', jacket: 'Jacke', accessory: 'Accessoire',
}
export const ACCESSORY_LABELS: Record<AccessoryType, string> = {
  necklace: 'Kette', ring: 'Ring', bracelet: 'Armband', watch: 'Uhr',
}
export const WARMTH_LABELS: Record<Warmth, string> = { light: 'Leicht', medium: 'Mittel', warm: 'Warm' }
export const OCCASION_LABELS: Record<Occasion, string> = {
  uni: 'Uni', leisure: 'Freizeit', going_out: 'Ausgehen', sport: 'Sport',
}
export const TEMP_BAND_LABELS: Record<TempBand, string> = {
  frost: 'Frost <0°', cold: 'Kalt 0–8°', cool: 'Kühl 8–15°',
  mild: 'Mild 15–22°', warm: 'Warm 22–27°', hot: 'Heiß >27°',
}

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]
export const ACCESSORY_TYPES = Object.keys(ACCESSORY_LABELS) as AccessoryType[]
export const WARMTHS = Object.keys(WARMTH_LABELS) as Warmth[]
export const OCCASIONS = Object.keys(OCCASION_LABELS) as Occasion[]
export const TEMP_BANDS = Object.keys(TEMP_BAND_LABELS) as TempBand[]
