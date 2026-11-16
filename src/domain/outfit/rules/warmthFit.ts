import { OUTFIT_CONFIG } from '../config'
import { clothesOf, type Rule } from './types'

/** Bonus für jedes Kleidungsstück, dessen Wärmegrad ideal zur gewählten Temperatur passt. */
export const warmthFit: Rule = (outfit, ctx) => {
  const preferred = OUTFIT_CONFIG.bands[ctx.tempBand].preferred
  const matching = clothesOf(outfit).filter((i) => i.warmth === preferred)
  if (matching.length === 0) return { points: 0 }
  return {
    points: matching.length * OUTFIT_CONFIG.warmthFitPoints,
    reason: `${matching.map((i) => i.name).join(', ')} ${matching.length === 1 ? 'passt' : 'passen'} gut zur Temperatur.`,
  }
}
