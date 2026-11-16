import type { Item } from '../types'
import { OUTFIT_CONFIG } from './config'
import type { OutfitContext } from './types'

export type SlotCategory = 'top' | 'bottom' | 'shoes' | 'jacket' | 'accessory'
export type ItemsBySlot = Record<SlotCategory, Item[]>

/**
 * Harte Filter: Welche Teile kommen für diesen Kontext überhaupt in Frage?
 *  - verfügbar und nicht archiviert
 *  - Anlass passt
 *  - Wärmegrad passt zum Temperatur-Band (gilt nicht für Accessoires)
 *  - Jacken nur, wenn das Band Jacken zulässt
 */
export function usableItems(items: Item[], ctx: OutfitContext): ItemsBySlot {
  const band = OUTFIT_CONFIG.bands[ctx.tempBand]
  const result: ItemsBySlot = { top: [], bottom: [], shoes: [], jacket: [], accessory: [] }

  for (const item of items) {
    if (!item.available || item.archivedAt) continue
    if (!item.occasions.includes(ctx.occasion)) continue
    if (item.category !== 'accessory' && !band.warmth.includes(item.warmth)) continue
    if (item.category === 'jacket' && band.jacket === 'none') continue
    result[item.category].push(item)
  }
  return result
}
