import { describe, expect, it } from 'vitest'
import { fitWithin } from './fitWithin'

describe('fitWithin', () => {
  it('verkleinert Hochformat auf max. 1200 px an der langen Seite', () => {
    expect(fitWithin(3000, 4000, 1200)).toEqual({ width: 900, height: 1200 })
  })
  it('verkleinert Querformat proportional', () => {
    expect(fitWithin(4000, 3000, 1200)).toEqual({ width: 1200, height: 900 })
  })
  it('vergrößert kleine Bilder nicht', () => {
    expect(fitWithin(800, 600, 1200)).toEqual({ width: 800, height: 600 })
  })
  it('rundet auf ganze Pixel', () => {
    expect(fitWithin(4032, 3024, 1200)).toEqual({ width: 1200, height: 900 })
    expect(fitWithin(1000, 3001, 1200)).toEqual({ width: 400, height: 1200 })
  })
})
