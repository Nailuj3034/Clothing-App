import { describe, expect, it } from 'vitest'
import type { ColorKey, WornOutfit } from '../../types'
import { makeItem } from '../../testUtils'
import { colorHarmony } from './colorHarmony'
import { warmthFit } from './warmthFit'
import { recentlyWorn } from './recentlyWorn'
import { RULES } from './index'
import type { CandidateOutfit, RuleContext } from './types'

const ctx = (over: Partial<RuleContext> = {}): RuleContext =>
  ({ tempBand: 'cool', occasion: 'uni', today: '2026-11-16', history: [], ...over })

/** Outfit aus vier Farben (Oberteil, Unterteil, Schuhe, optional Jacke) */
function outfit(top: ColorKey, bottom: ColorKey, shoes: ColorKey, jacket?: ColorKey): CandidateOutfit {
  return {
    top: makeItem({ id: 'top', category: 'top', colorPrimary: top }),
    bottom: makeItem({ id: 'bottom', category: 'bottom', colorPrimary: bottom }),
    shoes: makeItem({ id: 'shoes', category: 'shoes', colorPrimary: shoes }),
    jacket: jacket ? makeItem({ id: 'jacket', category: 'jacket', colorPrimary: jacket }) : null,
  }
}

describe('colorHarmony', () => {
  it('gibt 20 für eine rein neutrale Kombination', () => {
    const r = colorHarmony(outfit('navy', 'beige', 'black'), ctx())
    expect(r.points).toBe(20)
    expect(r.reason).toBe('Ruhige Kombination in neutralen Farben.')
  })

  it('gibt 25 für genau einen Farbakzent und nennt die Farbe', () => {
    const r = colorHarmony(outfit('navy', 'red', 'white'), ctx())
    expect(r.points).toBe(25)
    expect(r.reason).toContain('Rot')
  })

  it('zählt denselben Akzent auf zwei Teilen nur einmal', () => {
    expect(colorHarmony(outfit('red', 'black', 'red'), ctx()).points).toBe(25)
  })

  it('zieht 20 ab, wenn warme und kühle Akzente aufeinandertreffen', () => {
    expect(colorHarmony(outfit('red', 'blue', 'white'), ctx()).points).toBe(-20)
  })

  it('gibt 10 für zwei Akzente gleicher Temperatur', () => {
    expect(colorHarmony(outfit('blue', 'lightblue', 'white'), ctx()).points).toBe(10)
  })

  it('zieht 10 ab bei mehr als zwei Akzenten gleicher Temperatur', () => {
    expect(colorHarmony(outfit('red', 'pink', 'burgundy'), ctx()).points).toBe(-10)
  })

  it('gibt 5 extra für einen Erdton zu sonst neutralen Farben', () => {
    expect(colorHarmony(outfit('olive', 'beige', 'brown'), ctx()).points).toBe(25)
  })

  it('wertet Silber als neutral', () => {
    expect(colorHarmony(outfit('silver', 'black', 'white'), ctx()).points).toBe(20)
  })

  it('berücksichtigt die Jacke', () => {
    expect(colorHarmony(outfit('navy', 'beige', 'black', 'green'), ctx()).points).toBe(25)
  })
})

describe('warmthFit', () => {
  it('gibt 5 je Teil mit ideal passendem Wärmegrad', () => {
    const o: CandidateOutfit = {
      top: makeItem({ id: 'hoodie', category: 'top', warmth: 'warm' }),
      bottom: makeItem({ id: 'jeans', category: 'bottom', warmth: 'medium' }),
      shoes: makeItem({ id: 'boots', category: 'shoes', warmth: 'medium' }),
      jacket: null,
    }
    expect(warmthFit(o, ctx({ tempBand: 'cold' })).points).toBe(5)
  })
})

describe('recentlyWorn', () => {
  const worn = (wornOn: string, itemIds: string[]): WornOutfit =>
    ({ id: wornOn, wornOn, tempBand: 'cool', occasion: 'uni', itemIds })
  const o = outfit('navy', 'beige', 'black')

  it('zieht 8 Punkte für gestern getragene Schuhe ab', () => {
    const r = recentlyWorn(o, ctx({ history: [worn('2026-11-15', ['shoes'])] }))
    expect(r.points).toBe(-8)
    expect(r.reason).toBeDefined()
  })

  it('zieht nichts für vorgestern getragene Teile ab', () => {
    const r = recentlyWorn(o, ctx({ history: [worn('2026-11-14', ['shoes'])] }))
    expect(r.points).toBe(0)
    expect(r.reason).toBeUndefined()
  })

  it('zieht pro Teil ab, auch heute getragene', () => {
    expect(recentlyWorn(o, ctx({ history: [worn('2026-11-16', ['top', 'bottom'])] })).points).toBe(-16)
  })
})

describe('RULES', () => {
  it('enthält die drei Regeln in fester Reihenfolge', () => {
    expect(RULES).toEqual([colorHarmony, warmthFit, recentlyWorn])
  })
})

