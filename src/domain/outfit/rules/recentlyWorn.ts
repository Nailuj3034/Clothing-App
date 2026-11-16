import { daysBetween } from '../../date'
import { OUTFIT_CONFIG } from '../config'
import { clothesOf, type Rule } from './types'

/** Abzug für Teile, die heute oder gestern schon getragen wurden – sie dürfen vorkommen, aber eher weiter hinten. */
export const recentlyWorn: Rule = (outfit, ctx) => {
  const recentIds = new Set(
    ctx.history
      .filter((w) => daysBetween(w.wornOn, ctx.today) <= OUTFIT_CONFIG.recentlyWornDays)
      .flatMap((w) => w.itemIds),
  )
  const repeated = clothesOf(outfit).filter((i) => recentIds.has(i.id))
  if (repeated.length === 0) return { points: 0 }
  return {
    points: -repeated.length * OUTFIT_CONFIG.recentlyWornPenalty,
    reason: `${repeated.map((i) => i.name).join(', ')} hattest du erst kürzlich an.`,
  }
}
