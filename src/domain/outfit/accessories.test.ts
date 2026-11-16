import { describe, expect, it } from 'vitest'
import type { AccessoryType, Item, WornOutfit } from '../types'
import { makeItem } from '../testUtils'
import { pickAccessories } from './accessories'
import { generate } from './generate'
import type { RuleContext } from './rules/types'

const ctx = (over: Partial<RuleContext> = {}): RuleContext =>
  ({ tempBand: 'mild', occasion: 'uni', today: '2026-11-16', history: [], ...over })
const rng0 = () => 0
/** Liefert nacheinander die angegebenen Zufallswerte (danach 0). */
const seq = (...values: number[]) => () => values.shift() ?? 0
const acc = (id: string, accessoryType: AccessoryType, over: Partial<Item> = {}) =>
  makeItem({ id, category: 'accessory', accessoryType, colorPrimary: 'silver', ...over })
const ids = (l: Item[]) => l.map((i) => i.id).sort()

describe('pickAccessories', () => {
  it('übernimmt das Standard-Set, wenn nichts gewechselt wird', () => {
    const pool = [acc('kette', 'necklace', { isCore: true }), acc('uhr', 'watch', { isCore: true }), acc('ring', 'ring')]
    const r = pickAccessories(pool, ctx(), rng0)
    expect(ids(r.items)).toEqual(['kette', 'uhr'])
    expect(r.reasons).toEqual([])
  })

  it('nimmt beim Sport nur die Uhr, auch wenn Ketten zum Standard-Set gehören', () => {
    const pool = [acc('kette', 'necklace', { isCore: true }), acc('uhr', 'watch', { isCore: true }), acc('armband', 'bracelet')]
    const r = pickAccessories(pool, ctx({ occasion: 'sport' }), seq(0.99, 0))
    expect(ids(r.items)).toEqual(['uhr'])
  })

  it('hält die Obergrenzen ein (max. 1 Uhr, 4 Ringe)', () => {
    const pool = [
      acc('uhr1', 'watch', { isCore: true }), acc('uhr2', 'watch', { isCore: true }),
      ...['r1', 'r2', 'r3', 'r4', 'r5'].map((id) => acc(id, 'ring', { isCore: true })),
    ]
    const r = pickAccessories(pool, ctx(), seq(0.99, 0, 0))
    expect(r.items.filter((i) => i.accessoryType === 'watch')).toHaveLength(1)
    expect(r.items.filter((i) => i.accessoryType === 'ring')).toHaveLength(4)
  })

  it('nimmt nie nicht verfügbare oder archivierte Stücke', () => {
    const pool = [
      acc('weg', 'necklace', { isCore: true, available: false }),
      acc('archiv', 'bracelet', { isCore: true, archivedAt: '2026-11-01' }),
      acc('weg2', 'ring', { available: false }),
    ]
    expect(pickAccessories(pool, ctx(), seq(0.99, 0, 0)).items).toEqual([])
  })

  it('ergänzt bei einem Wechsel ein Stück und begründet es', () => {
    const pool = [acc('kette', 'necklace', { isCore: true }), acc('armband', 'bracelet', { name: 'Gliederarmband' })]
    const r = pickAccessories(pool, ctx(), seq(0.5, 0)) // 0.5 → 1 Wechsel
    expect(ids(r.items)).toEqual(['armband', 'kette'])
    expect(r.reasons).toEqual(['Dazu: Gliederarmband.'])
  })

  it('ersetzt ein Standard-Stück, wenn die Obergrenze der Art erreicht ist', () => {
    const pool = [acc('uhr-alt', 'watch', { isCore: true, name: 'Alltagsuhr' }), acc('uhr-neu', 'watch', { name: 'Chronograph' })]
    const r = pickAccessories(pool, ctx(), seq(0.5, 0))
    expect(ids(r.items)).toEqual(['uhr-neu'])
    expect(r.reasons).toEqual(['Heute Chronograph statt Alltagsuhr.'])
  })

  it('bevorzugt Stücke, die am längsten nicht getragen wurden', () => {
    const worn = (wornOn: string, itemIds: string[]): WornOutfit =>
      ({ id: wornOn, wornOn, tempBand: 'mild', occasion: 'uni', itemIds })
    const pool = [acc('gestern', 'ring'), acc('nie', 'ring'), acc('lange-her', 'ring')]
    const history = [worn('2026-11-15', ['gestern']), worn('2026-11-01', ['lange-her'])]
    const r = pickAccessories(pool, ctx({ history }), seq(0.5, 0))
    expect(ids(r.items)).toEqual(['nie'])
  })
})

describe('generate mit Schmuck', () => {
  it('hängt Schmuck an jeden Vorschlag an', () => {
    const items = [
      makeItem({ id: 't', category: 'top' }), makeItem({ id: 'b', category: 'bottom' }),
      makeItem({ id: 's', category: 'shoes' }), acc('uhr', 'watch', { isCore: true }),
    ]
    const r = generate(items, [], { tempBand: 'warm', occasion: 'uni', today: '2026-11-16' }, rng0)
    if (!r.ok) throw new Error(r.reason)
    expect(r.ranked[0].accessories.map((i) => i.id)).toEqual(['uhr'])
  })
})
