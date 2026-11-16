import { describe, expect, it } from 'vitest'
import { daysBetween, toLocalDateString } from './date'

describe('toLocalDateString', () => {
  it('nimmt den lokalen Tag, auch spät abends (nicht den UTC-Tag)', () => {
    expect(toLocalDateString(new Date(2026, 10, 16, 23, 30))).toBe('2026-11-16')
  })
  it('füllt Monat und Tag mit Nullen auf', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 8, 0))).toBe('2026-01-05')
  })
})

describe('daysBetween', () => {
  it('zählt ganze Tage', () => {
    expect(daysBetween('2026-11-14', '2026-11-16')).toBe(2)
  })
  it('funktioniert über den Monatswechsel', () => {
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1)
  })
  it('funktioniert über die Sommerzeit-Umstellung', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })
  it('ist 0 für denselben Tag', () => {
    expect(daysBetween('2026-11-16', '2026-11-16')).toBe(0)
  })
})
