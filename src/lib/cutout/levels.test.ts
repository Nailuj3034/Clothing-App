import { describe, expect, it } from 'vitest'
import { autoLevels } from './levels'

/** RGBA-Pixel aus [r,g,b,a]-Tupeln */
const px = (...p: [number, number, number, number][]) => new Uint8ClampedArray(p.flat())
const channel = (a: Uint8ClampedArray, c: number) => a.filter((_, i) => i % 4 === c)
const mean = (a: Uint8ClampedArray) => a.reduce((s, v) => s + v, 0) / a.length

/** Dunkles, graues Bild mit Werten 40–90 */
const dark = px(...Array.from({ length: 50 }, (_, i) => {
  const v = 40 + i
  return [v, v, v, 255] as [number, number, number, number]
}))

describe('autoLevels', () => {
  it('hellt ein dunkles Bild auf', () => {
    expect(mean(channel(autoLevels(dark), 0))).toBeGreaterThan(mean(channel(dark, 0)))
  })

  it('lässt Alpha unverändert', () => {
    expect([...channel(autoLevels(dark), 3)]).toEqual([...channel(dark, 3)])
  })

  it('lässt komplett transparente Pixel unverändert', () => {
    const img = px([10, 20, 30, 0], ...Array.from({ length: 10 }, (_, i) => [50 + i, 50 + i, 50 + i, 255] as [number, number, number, number]))
    expect([...autoLevels(img).slice(0, 4)]).toEqual([10, 20, 30, 0])
  })

  it('ändert nichts bei Stärke 0', () => {
    expect([...autoLevels(dark, 0)]).toEqual([...dark])
  })

  it('verringert einen Blaustich', () => {
    const blue = px(...Array.from({ length: 50 }, (_, i) => [80 + i, 80 + i, 140 + i, 255] as [number, number, number, number]))
    const out = autoLevels(blue)
    const gapBefore = mean(channel(blue, 2)) - mean(channel(blue, 0))
    const gapAfter = mean(channel(out, 2)) - mean(channel(out, 0))
    expect(gapAfter).toBeLessThan(gapBefore)
  })

  it('verändert das Original nicht', () => {
    const copy = new Uint8ClampedArray(dark)
    autoLevels(dark)
    expect([...dark]).toEqual([...copy])
  })
})
