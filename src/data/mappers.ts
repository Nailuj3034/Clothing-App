import type { AccessoryType, Category, ColorKey, Item, Occasion, Warmth } from '../domain/types'

/** Eine Zeile der Tabelle `items`, so wie Supabase sie liefert (snake_case). */
export interface ItemRow {
  id: string
  user_id: string
  name: string
  category: Category
  accessory_type: AccessoryType | null
  is_core: boolean
  color_primary: ColorKey
  color_secondary: ColorKey | null
  warmth: Warmth
  occasions: Occasion[]
  photo_path: string | null
  available: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** Felder, die das Formular liefert (ID und Archiv-Status verwaltet die Datenbank). */
export type ItemInput = Omit<Item, 'id' | 'archivedAt'>

export type ItemRowInsert = Omit<ItemRow, 'id' | 'archived_at' | 'created_at' | 'updated_at'>

/** Datenbank-Zeile → Domain-Item */
export function mapItemRow(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    accessoryType: row.accessory_type,
    isCore: row.is_core,
    colorPrimary: row.color_primary,
    colorSecondary: row.color_secondary,
    warmth: row.warmth,
    occasions: row.occasions,
    photoPath: row.photo_path,
    available: row.available,
    archivedAt: row.archived_at,
  }
}

/**
 * Formular-Daten → Datenbank-Zeile.
 * Art und „Trage ich meistens“ gibt es nur bei Accessoires (sonst greift der Check-Constraint der DB).
 */
export function toItemRow(input: ItemInput, userId: string): ItemRowInsert {
  const isAccessory = input.category === 'accessory'
  return {
    user_id: userId,
    name: input.name,
    category: input.category,
    accessory_type: isAccessory ? input.accessoryType : null,
    is_core: isAccessory ? input.isCore : false,
    color_primary: input.colorPrimary,
    color_secondary: input.colorSecondary,
    warmth: input.warmth,
    occasions: input.occasions,
    photo_path: input.photoPath,
    available: input.available,
  }
}

/** Spaltennamen der Formular-Felder in der Datenbank */
const COLUMN: Record<keyof ItemInput, keyof ItemRowInsert> = {
  name: 'name',
  category: 'category',
  accessoryType: 'accessory_type',
  isCore: 'is_core',
  colorPrimary: 'color_primary',
  colorSecondary: 'color_secondary',
  warmth: 'warmth',
  occasions: 'occasions',
  photoPath: 'photo_path',
  available: 'available',
}

/** Teil-Update (z. B. nur Verfügbarkeit) → Datenbank-Spalten. Nicht übergebene Felder bleiben weg. */
export function toItemPatch(patch: Partial<ItemInput>): Partial<ItemRowInsert> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) out[COLUMN[key as keyof ItemInput]] = value
  }
  return out as Partial<ItemRowInsert>
}
