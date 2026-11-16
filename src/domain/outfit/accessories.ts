import { ACCESSORY_TYPES, type AccessoryType, type Item } from '../types'
import { OUTFIT_CONFIG } from './config'
import type { RuleContext } from './rules/types'

/**
 * Wählt den Schmuck für ein Outfit:
 *  1. Start = Standard-Set („Trage ich meistens“), soweit die Art zum Anlass passt, gekürzt auf die Obergrenzen
 *  2. Dann 0 bis maxAccessorySwaps Wechsel: ein anderes Stück wird ergänzt (Art unter der Grenze)
 *     oder ersetzt ein Stück derselben Art. Bevorzugt werden Stücke, die am längsten nicht getragen wurden.
 * Jeder Wechsel liefert einen Begründungssatz. Zufall kommt über rng (testbar).
 */
export function pickAccessories(
  pool: Item[],
  ctx: RuleContext,
  rng: () => number,
): { items: Item[]; reasons: string[] } {
  const allowed = OUTFIT_CONFIG.accessoryTypesByOccasion[ctx.occasion] ?? ACCESSORY_TYPES
  const candidates = pool.filter((i) =>
    i.category === 'accessory' && i.accessoryType && allowed.includes(i.accessoryType)
    && i.available && !i.archivedAt)

  // 1. Standard-Set innerhalb der Obergrenzen
  const chosen: Item[] = []
  for (const item of candidates.filter((i) => i.isCore)) {
    if (countOf(chosen, item.accessoryType!) < limitOf(item.accessoryType!)) chosen.push(item)
  }

  // 2. Gelegentliche Wechsel
  const reasons: string[] = []
  const swaps = Math.floor(rng() * (OUTFIT_CONFIG.maxAccessorySwaps + 1))
  const lastWorn = lastWornDates(ctx)
  let options = candidates
    .filter((i) => !chosen.includes(i))
    .sort((a, b) => (lastWorn.get(a.id) ?? '').localeCompare(lastWorn.get(b.id) ?? '') || a.name.localeCompare(b.name))

  for (let n = 0; n < swaps && options.length > 0; n++) {
    // zufällig unter den drei am längsten nicht getragenen
    const pick = options[Math.floor(rng() * Math.min(3, options.length))]
    options = options.filter((i) => i !== pick)
    const type = pick.accessoryType!

    if (countOf(chosen, type) < limitOf(type)) {
      chosen.push(pick)
      reasons.push(`Dazu: ${pick.name}.`)
    } else {
      const replaced = chosen.find((i) => i.accessoryType === type)!
      chosen.splice(chosen.indexOf(replaced), 1, pick)
      reasons.push(`Heute ${pick.name} statt ${replaced.name}.`)
    }
  }

  return { items: chosen, reasons }
}

function countOf(items: Item[], type: AccessoryType): number {
  return items.filter((i) => i.accessoryType === type).length
}

function limitOf(type: AccessoryType): number {
  return OUTFIT_CONFIG.accessoryLimits[type]
}

/** Letztes Trage-Datum je Teil ('YYYY-MM-DD'); nie getragene Teile fehlen in der Map. */
function lastWornDates(ctx: RuleContext): Map<string, string> {
  const map = new Map<string, string>()
  for (const w of ctx.history) {
    for (const id of w.itemIds) {
      if ((map.get(id) ?? '') < w.wornOn) map.set(id, w.wornOn)
    }
  }
  return map
}
