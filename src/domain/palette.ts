import type { ColorKey, PaletteColor } from './types'

/**
 * Feste Farbpalette. Jede Farbe hat
 *  - hex: für Vorschauflächen und die 3D-Figur
 *  - role/temperature: für die Farbharmonie-Regeln des Outfit-Generators.
 * Metall zählt in der Harmonie wie neutral.
 */
export const PALETTE: readonly PaletteColor[] = [
  { key: 'black', label: 'Schwarz', hex: '#1a1a1a', role: 'neutral', temperature: 'none' },
  { key: 'white', label: 'Weiß', hex: '#f7f7f5', role: 'neutral', temperature: 'none' },
  { key: 'grey', label: 'Grau', hex: '#9a9a9e', role: 'neutral', temperature: 'none' },
  { key: 'anthracite', label: 'Anthrazit', hex: '#3b3d42', role: 'neutral', temperature: 'none' },
  { key: 'navy', label: 'Navy', hex: '#1f2a44', role: 'neutral', temperature: 'none' },
  { key: 'beige', label: 'Beige', hex: '#d9c7a7', role: 'neutral', temperature: 'none' },
  { key: 'brown', label: 'Braun', hex: '#6b4a2f', role: 'earth', temperature: 'none' },
  { key: 'olive', label: 'Olive', hex: '#6b6b3a', role: 'earth', temperature: 'none' },
  { key: 'mustard', label: 'Senf', hex: '#c9a23a', role: 'earth', temperature: 'none' },
  { key: 'blue', label: 'Blau', hex: '#2f5fbf', role: 'accent', temperature: 'cool' },
  { key: 'lightblue', label: 'Hellblau', hex: '#9cc3e6', role: 'accent', temperature: 'cool' },
  { key: 'green', label: 'Grün', hex: '#2e7d4f', role: 'accent', temperature: 'cool' },
  { key: 'red', label: 'Rot', hex: '#c8202f', role: 'accent', temperature: 'warm' },
  { key: 'burgundy', label: 'Bordeaux', hex: '#6d1a2a', role: 'accent', temperature: 'warm' },
  { key: 'pink', label: 'Rosa', hex: '#f0a3b8', role: 'accent', temperature: 'warm' },
  { key: 'silver', label: 'Silber', hex: '#c0c4c8', role: 'metal', temperature: 'none' },
  { key: 'gold', label: 'Gold', hex: '#d4af37', role: 'metal', temperature: 'none' },
]

const BY_KEY = new Map(PALETTE.map((c) => [c.key, c]))

/** Liefert die Palettenfarbe zu einem Key. */
export function getColor(key: ColorKey): PaletteColor {
  const color = BY_KEY.get(key)
  if (!color) throw new Error(`Unbekannte Farbe: ${key}`)
  return color
}
