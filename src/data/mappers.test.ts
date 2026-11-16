import { describe, expect, it } from 'vitest'
import { mapItemRow, toItemPatch, toItemRow, type ItemRow } from './mappers'
import type { ItemInput } from './mappers'

const row: ItemRow = {
  id: 'i1', user_id: 'u1', name: 'Hoodie Navy', category: 'top', accessory_type: null, is_core: false,
  color_primary: 'navy', color_secondary: null, warmth: 'warm', occasions: ['uni', 'leisure'],
  photo_path: null, available: true, archived_at: null,
  created_at: '2026-11-16T10:00:00Z', updated_at: '2026-11-16T10:00:00Z',
}

describe('mapItemRow', () => {
  it('übersetzt snake_case in das Domain-Item', () => {
    expect(mapItemRow(row)).toEqual({
      id: 'i1', name: 'Hoodie Navy', category: 'top', accessoryType: null, isCore: false,
      colorPrimary: 'navy', colorSecondary: null, warmth: 'warm', occasions: ['uni', 'leisure'],
      photoPath: null, available: true, archivedAt: null,
    })
  })
})

describe('toItemRow', () => {
  it('übersetzt ein Domain-Item zurück und behält null-Werte', () => {
    const input: ItemInput = {
      name: 'Kette', category: 'accessory', accessoryType: 'necklace', isCore: true,
      colorPrimary: 'silver', colorSecondary: null, warmth: 'light', occasions: ['going_out'],
      photoPath: null, available: true,
    }
    expect(toItemRow(input, 'u1')).toEqual({
      user_id: 'u1', name: 'Kette', category: 'accessory', accessory_type: 'necklace', is_core: true,
      color_primary: 'silver', color_secondary: null, warmth: 'light', occasions: ['going_out'],
      photo_path: null, available: true,
    })
  })

  it('setzt accessory_type und is_core bei Kleidung zurück', () => {
    const input: ItemInput = {
      name: 'Chino', category: 'bottom', accessoryType: 'ring', isCore: true,
      colorPrimary: 'beige', colorSecondary: null, warmth: 'medium', occasions: ['uni'],
      photoPath: null, available: true,
    }
    const out = toItemRow(input, 'u1')
    expect(out.accessory_type).toBeNull()
    expect(out.is_core).toBe(false)
  })
})

describe('toItemPatch', () => {
  it('übersetzt nur die übergebenen Felder', () => {
    expect(toItemPatch({ available: false })).toEqual({ available: false })
    expect(toItemPatch({ photoPath: null, colorSecondary: 'red' })).toEqual({ photo_path: null, color_secondary: 'red' })
  })
})
