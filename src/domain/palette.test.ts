import { describe, expect, it } from 'vitest'
import { PALETTE, getColor } from './palette'

const keysWithRole = (role: string) =>
  PALETTE.filter((c) => c.role === role).map((c) => c.key).sort()

describe('PALETTE', () => {
  it('enthält 17 Farben mit eindeutigen Keys', () => {
    expect(PALETTE).toHaveLength(17)
    expect(new Set(PALETTE.map((c) => c.key)).size).toBe(17)
  })

  it('ordnet die Rollen laut Spec zu', () => {
    expect(keysWithRole('neutral')).toEqual(['anthracite', 'beige', 'black', 'grey', 'navy', 'white'])
    expect(keysWithRole('earth')).toEqual(['brown', 'mustard', 'olive'])
    expect(keysWithRole('metal')).toEqual(['gold', 'silver'])
    expect(keysWithRole('accent')).toEqual(['blue', 'burgundy', 'green', 'lightblue', 'pink', 'red'])
  })

  it('gibt Akzenten eine Farbtemperatur', () => {
    for (const k of ['blue', 'lightblue', 'green'] as const) expect(getColor(k).temperature).toBe('cool')
    for (const k of ['red', 'burgundy', 'pink'] as const) expect(getColor(k).temperature).toBe('warm')
  })

  it('hat für jede Farbe einen gültigen Hex-Wert', () => {
    for (const c of PALETTE) expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('getColor', () => {
  it('liefert die Farbe zum Key', () => {
    expect(getColor('navy').label).toBe('Navy')
  })
})
