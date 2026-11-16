import type { Category, Occasion, TempBand, WornOutfit } from '../domain/types'
import { mapOutfitRow, type OutfitRow } from './mappers'
import { supabase } from './supabase'

/** Zugriff auf getragene Outfits (`outfits` + `outfit_items`). */

const SELECT = '*, outfit_items(item_id, slot)'

/** Getragene Outfits der letzten `days` Tage (ab `today`, lokal), neueste zuerst. */
export async function listRecent(today: string, days: number): Promise<WornOutfit[]> {
  const from = new Date(`${today}T00:00:00`)
  from.setDate(from.getDate() - days)
  const fromStr = from.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('outfits').select(SELECT).gte('worn_on', fromStr)
    .order('worn_on', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw new Error(`Verlauf laden fehlgeschlagen: ${error.message}`)
  return (data as OutfitRow[]).map(mapOutfitRow)
}

/** Kompletter Verlauf, neueste zuerst. */
export async function listAll(): Promise<WornOutfit[]> {
  const { data, error } = await supabase
    .from('outfits').select(SELECT)
    .order('worn_on', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw new Error(`Verlauf laden fehlgeschlagen: ${error.message}`)
  return (data as OutfitRow[]).map(mapOutfitRow)
}

export interface SaveWornInput {
  wornOn: string
  tempBand: TempBand
  occasion: Occasion
  items: { itemId: string; slot: Category }[]
}

/** Speichert ein getragenes Outfit (Kopf + Teile). Schlagen die Teile fehl, wird der Kopf wieder entfernt. */
export async function saveWorn(input: SaveWornInput): Promise<void> {
  const { data, error } = await supabase
    .from('outfits')
    .insert({ worn_on: input.wornOn, temp_band: input.tempBand, occasion: input.occasion })
    .select('id').single()
  if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`)

  const outfitId = (data as { id: string }).id
  const { error: itemsError } = await supabase
    .from('outfit_items')
    .insert(input.items.map((i) => ({ outfit_id: outfitId, item_id: i.itemId, slot: i.slot })))
  if (itemsError) {
    await supabase.from('outfits').delete().eq('id', outfitId)
    throw new Error(`Speichern fehlgeschlagen: ${itemsError.message}`)
  }
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from('outfits').delete().eq('id', id)
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`)
}
