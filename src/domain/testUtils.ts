import type { Item } from './types'

/** Test-Helfer: erzeugt ein Teil mit sinnvollen Standardwerten; nur die relevanten Felder werden überschrieben. */
export function makeItem(overrides: Partial<Item> & Pick<Item, 'id'>): Item {
  return {
    name: overrides.id,
    category: 'top',
    accessoryType: null,
    isCore: false,
    colorPrimary: 'black',
    colorSecondary: null,
    warmth: 'medium',
    occasions: ['uni', 'leisure', 'going_out', 'sport'],
    photoPath: null,
    available: true,
    archivedAt: null,
    ...overrides,
  }
}
