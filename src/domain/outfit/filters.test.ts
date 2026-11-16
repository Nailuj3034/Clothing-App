import { describe, expect, it } from 'vitest'
import { makeItem } from '../testUtils'
import { usableItems } from './filters'
import type { OutfitContext } from './types'

const ctx = (over: Partial<OutfitContext> = {}): OutfitContext =>
  ({ tempBand: 'cool', occasion: 'uni', today: '2026-11-16', ...over })
const ids = (items: { id: string }[]) => items.map((i) => i.id)

describe('usableItems', () => {
  it('lässt nicht verfügbare und archivierte Teile weg', () => {
    const items = [
      makeItem({ id: 'ok' }),
      makeItem({ id: 'wäsche', available: false }),
      makeItem({ id: 'archiv', archivedAt: '2026-11-01T10:00:00Z' }),
    ]
    expect(ids(usableItems(items, ctx()).top)).toEqual(['ok'])
  })

  it('lässt Teile ohne passenden Anlass weg', () => {
    const items = [makeItem({ id: 'uni', occasions: ['uni'] }), makeItem({ id: 'sport', occasions: ['sport'] })]
    expect(ids(usableItems(items, ctx({ occasion: 'uni' })).top)).toEqual(['uni'])
  })

  it('nimmt bei Frost nur warme Kleidung', () => {
    const items = [
      makeItem({ id: 'leicht', warmth: 'light' }),
      makeItem({ id: 'mittel', warmth: 'medium' }),
      makeItem({ id: 'warm', warmth: 'warm' }),
    ]
    expect(ids(usableItems(items, ctx({ tempBand: 'frost' })).top)).toEqual(['warm'])
  })

  it('liefert bei Hitze keine Jacken', () => {
    const items = [makeItem({ id: 'jacke', category: 'jacket', warmth: 'light' })]
    expect(usableItems(items, ctx({ tempBand: 'hot' })).jacket).toEqual([])
  })

  it('wendet den Wärmegrad-Filter nicht auf Accessoires an', () => {
    const items = [makeItem({ id: 'kette', category: 'accessory', accessoryType: 'necklace', warmth: 'light' })]
    expect(ids(usableItems(items, ctx({ tempBand: 'frost' })).accessory)).toEqual(['kette'])
  })

  it('sortiert Teile nach Kategorie', () => {
    const items = [
      makeItem({ id: 't', category: 'top' }), makeItem({ id: 'b', category: 'bottom' }),
      makeItem({ id: 's', category: 'shoes' }), makeItem({ id: 'j', category: 'jacket' }),
    ]
    const u = usableItems(items, ctx())
    expect([ids(u.top), ids(u.bottom), ids(u.shoes), ids(u.jacket)]).toEqual([['t'], ['b'], ['s'], ['j']])
  })
})
