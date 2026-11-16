import { describe, expect, it } from 'vitest'
import type { Item, WornOutfit } from '../types'
import { makeItem } from '../testUtils'
import { generate, pageSuggestions, type OutfitSuggestion } from './generate'
import type { OutfitContext } from './types'

const ctx = (over: Partial<OutfitContext> = {}): OutfitContext =>
  ({ tempBand: 'mild', occasion: 'uni', today: '2026-11-16', ...over })
const rng0 = () => 0
const worn = (wornOn: string, itemIds: string[]): WornOutfit =>
  ({ id: wornOn, wornOn, tempBand: 'mild', occasion: 'uni', itemIds })

/** Kleiner Schrank: 2 Oberteile, 1 Unterteil, 1 Paar Schuhe, 1 Jacke (alle „mittel“) */
const wardrobe: Item[] = [
  makeItem({ id: 'shirt-navy', category: 'top', colorPrimary: 'navy' }),
  makeItem({ id: 'shirt-red', category: 'top', colorPrimary: 'red' }),
  makeItem({ id: 'chino', category: 'bottom', colorPrimary: 'beige' }),
  makeItem({ id: 'sneaker', category: 'shoes', colorPrimary: 'white' }),
  makeItem({ id: 'jacke', category: 'jacket', colorPrimary: 'black' }),
]

function okRanked(items: Item[], history: WornOutfit[] = [], c = ctx()): OutfitSuggestion[] {
  const r = generate(items, history, c, rng0)
  if (!r.ok) throw new Error(`erwartet ok, bekam: ${r.reason}`)
  return r.ranked
}

describe('generate', () => {
  it('baut vollständige Outfits aus dem Schrank', () => {
    const [best] = okRanked(wardrobe)
    expect(best.top.category).toBe('top')
    expect(best.bottom.id).toBe('chino')
    expect(best.shoes.id).toBe('sneaker')
  })

  it('nimmt bei „kühl“ immer eine Jacke', () => {
    const ranked = okRanked(wardrobe, [], ctx({ tempBand: 'cool' }))
    expect(ranked.every((s) => s.jacket?.id === 'jacke')).toBe(true)
  })

  it('nimmt bei „warm“ keine Jacke', () => {
    const items = wardrobe.map((i) => ({ ...i, warmth: 'light' as const }))
    const ranked = okRanked(items, [], ctx({ tempBand: 'warm' }))
    expect(ranked.every((s) => s.jacket === null)).toBe(true)
  })

  it('bietet bei „mild“ Outfits mit und ohne Jacke an', () => {
    const ranked = okRanked(wardrobe)
    expect(ranked.some((s) => s.jacket === null)).toBe(true)
    expect(ranked.some((s) => s.jacket !== null)).toBe(true)
  })

  it('sortiert absteigend nach Punkten', () => {
    const scores = okRanked(wardrobe).map((s) => s.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('liefert Score und Begründungen', () => {
    const [best] = okRanked(wardrobe)
    expect(typeof best.score).toBe('number')
    expect(best.reasons.length).toBeGreaterThan(0)
    expect(best.accessories).toEqual([])
  })

  it('bildet den Schlüssel aus den sortierten Kleidungs-IDs', () => {
    const s = okRanked(wardrobe).find((x) => x.jacket === null && x.top.id === 'shirt-navy')!
    expect(s.key).toBe('chino|shirt-navy|sneaker')
  })

  it('schließt eine Kombination aus, die vor 2 Tagen getragen wurde', () => {
    const history = [worn('2026-11-14', ['shirt-navy', 'chino', 'sneaker'])]
    expect(okRanked(wardrobe, history).map((s) => s.key)).not.toContain('chino|shirt-navy|sneaker')
  })

  it('erlaubt eine Kombination wieder, die vor 4 Tagen getragen wurde', () => {
    const history = [worn('2026-11-12', ['shirt-navy', 'chino', 'sneaker'])]
    expect(okRanked(wardrobe, history).map((s) => s.key)).toContain('chino|shirt-navy|sneaker')
  })

  it('ignoriert Schmuck beim Vergleich mit getragenen Kombinationen', () => {
    const items = [...wardrobe, makeItem({ id: 'uhr', category: 'accessory', accessoryType: 'watch' })]
    const history = [worn('2026-11-15', ['shirt-navy', 'chino', 'sneaker', 'uhr'])]
    expect(okRanked(items, history).map((s) => s.key)).not.toContain('chino|shirt-navy|sneaker')
  })

  it('meldet fehlende Schuhe für den Anlass', () => {
    const items = wardrobe.map((i) => (i.category === 'shoes' ? { ...i, occasions: ['uni' as const] } : i))
    expect(generate(items, [], ctx({ occasion: 'sport' }), rng0))
      .toEqual({ ok: false, reason: 'Keine verfügbaren Schuhe für den Anlass „Sport“.' })
  })

  it('meldet, wenn nur die Temperatur nicht passt', () => {
    const r = generate(wardrobe, [], ctx({ tempBand: 'frost' }), rng0)
    expect(r).toEqual({ ok: false, reason: 'Keine verfügbaren Oberteile, die zu „Frost <0°“ passen.' })
  })

  it('meldet eine fehlende Jacke, wenn sie Pflicht ist', () => {
    const items = wardrobe.filter((i) => i.category !== 'jacket')
    const r = generate(items, [], ctx({ tempBand: 'cool' }), rng0)
    expect(r).toEqual({ ok: false, reason: 'Bei „Kühl 8–15°“ gehört eine Jacke dazu, aber keine passende ist verfügbar.' })
  })

  it('meldet, wenn alle Kombinationen kürzlich getragen wurden', () => {
    const items = [
      makeItem({ id: 't', category: 'top' }), makeItem({ id: 'b', category: 'bottom' }),
      makeItem({ id: 's', category: 'shoes' }),
    ]
    const r = generate(items, [worn('2026-11-15', ['t', 'b', 's'])], ctx({ tempBand: 'warm' }), rng0)
    expect(r).toEqual({ ok: false, reason: 'Alle passenden Kombinationen hast du in den letzten 3 Tagen getragen.' })
  })

  it('ignoriert nicht verfügbare und archivierte Teile', () => {
    const items = [
      ...wardrobe,
      makeItem({ id: 'weg', category: 'top', available: false }),
      makeItem({ id: 'archiv', category: 'top', archivedAt: '2026-11-01' }),
    ]
    const tops = new Set(okRanked(items).map((s) => s.top.id))
    expect(tops.has('weg') || tops.has('archiv')).toBe(false)
  })
})

describe('pageSuggestions', () => {
  const fake = (n: number): OutfitSuggestion[] =>
    Array.from({ length: n }, (_, i) => ({ key: `k${i}` }) as OutfitSuggestion)
  const keys = (l: OutfitSuggestion[]) => l.map((s) => s.key)

  it('liefert auf Seite 0 die Plätze 1–3 und auf Seite 1 die Plätze 4–6', () => {
    const ranked = fake(9)
    expect(keys(pageSuggestions(ranked, 0, rng0))).toEqual(['k0', 'k1', 'k2'])
    expect(keys(pageSuggestions(ranked, 1, rng0))).toEqual(['k3', 'k4', 'k5'])
  })

  it('wählt nach dem Ende 3 verschiedene aus dem oberen Drittel', () => {
    const ranked = fake(12)
    let seed = 0.37
    const rng = () => (seed = (seed * 9301 + 0.49297) % 1)
    const page = keys(pageSuggestions(ranked, 4, rng))
    expect(page).toHaveLength(3)
    expect(new Set(page).size).toBe(3)
    for (const k of page) expect(['k0', 'k1', 'k2', 'k3']).toContain(k)
  })

  it('ist mit gleichem Zufall reproduzierbar', () => {
    const ranked = fake(12)
    expect(pageSuggestions(ranked, 5, rng0)).toEqual(pageSuggestions(ranked, 5, rng0))
  })
})
