import { describe, expect, it } from 'vitest'
import { seededRng } from './random'

describe('seededRng', () => {
  it('liefert bei gleichem Startwert dieselbe Folge', () => {
    const a = seededRng(42), b = seededRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('liefert Werte zwischen 0 (inkl.) und 1 (exkl.)', () => {
    const r = seededRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('liefert bei anderem Startwert eine andere Folge', () => {
    expect(seededRng(1)()).not.toBe(seededRng(2)())
  })
})
