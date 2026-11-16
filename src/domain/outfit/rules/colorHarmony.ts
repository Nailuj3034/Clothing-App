import { getColor } from '../../palette'
import type { PaletteColor } from '../../types'
import { OUTFIT_CONFIG } from '../config'
import { clothesOf, type Rule } from './types'

/**
 * Farbharmonie nach einfachen Faustregeln:
 *  - Neutrale Farben (inkl. Metall) passen zu allem
 *  - Ein einzelner Farbakzent wirkt am besten
 *  - Zwei Akzente gehen, wenn beide warm oder beide kühl sind
 *  - Warme und kühle Akzente zusammen beißen sich
 *  - Ein Erdton zu sonst neutralen Farben gibt einen kleinen Bonus
 * Bewertet wird nur die Hauptfarbe jedes Teils.
 */
export const colorHarmony: Rule = (outfit) => {
  const p = OUTFIT_CONFIG.colorPoints
  const colors = unique(clothesOf(outfit).map((i) => getColor(i.colorPrimary)))
  const accents = colors.filter((c) => c.role === 'accent')
  const earth = colors.filter((c) => c.role === 'earth')
  const names = (list: PaletteColor[]) => list.map((c) => c.label).join(' und ')

  if (accents.length === 0) {
    if (earth.length > 0) {
      return { points: p.allNeutral + p.earthBonus, reason: `${names(earth)} bringt Wärme in die neutrale Basis.` }
    }
    return { points: p.allNeutral, reason: 'Ruhige Kombination in neutralen Farben.' }
  }

  if (accents.length === 1) {
    return { points: p.singleAccent, reason: `${accents[0].label} als einziger Farbakzent, der Rest hält sich zurück.` }
  }

  const temps = new Set(accents.map((c) => c.temperature))
  if (temps.size > 1) {
    return { points: p.clashingTemps, reason: `${names(accents)} beißen sich (warm und kühl gemischt).` }
  }
  if (accents.length === 2) {
    return { points: p.twoAccentsSameTemp, reason: `${names(accents)} harmonieren miteinander.` }
  }
  return { points: p.tooManyAccents, reason: 'Ziemlich viele Farbakzente auf einmal.' }
}

function unique(colors: PaletteColor[]): PaletteColor[] {
  return [...new Map(colors.map((c) => [c.key, c])).values()]
}
