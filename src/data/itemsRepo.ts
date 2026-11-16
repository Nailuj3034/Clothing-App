import type { Item } from '../domain/types'
import { mapItemRow, toItemPatch, toItemRow, type ItemInput, type ItemRow } from './mappers'
import { requireUserId, supabase } from './supabase'

/**
 * Zugriff auf die Tabelle `items`.
 * Die UI ruft nur diese Funktionen auf und weiß nichts von Supabase.
 */

function fail(action: string, error: { message: string }): never {
  throw new Error(`${action} fehlgeschlagen: ${error.message}`)
}

/** Alle nicht archivierten Teile, neueste zuerst. */
export async function list(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items').select('*').is('archived_at', null).order('created_at', { ascending: false })
  if (error) fail('Laden', error)
  return (data as ItemRow[]).map(mapItemRow)
}

/** Archivierte Teile, zuletzt archivierte zuerst. */
export async function listArchived(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items').select('*').not('archived_at', 'is', null).order('archived_at', { ascending: false })
  if (error) fail('Laden', error)
  return (data as ItemRow[]).map(mapItemRow)
}

/** Alle Teile inkl. archivierter (für den Verlauf). */
export async function listAll(): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select('*')
  if (error) fail('Laden', error)
  return (data as ItemRow[]).map(mapItemRow)
}

export async function create(input: ItemInput): Promise<Item> {
  const userId = await requireUserId()
  const { data, error } = await supabase.from('items').insert(toItemRow(input, userId)).select().single()
  if (error) fail('Speichern', error)
  return mapItemRow(data as ItemRow)
}

export async function update(id: string, patch: Partial<ItemInput>): Promise<Item> {
  const { data, error } = await supabase.from('items').update(toItemPatch(patch)).eq('id', id).select().single()
  if (error) fail('Speichern', error)
  return mapItemRow(data as ItemRow)
}

export async function archive(id: string): Promise<void> {
  const { error } = await supabase.from('items').update({ archived_at: new Date().toISOString() }).eq('id', id)
  if (error) fail('Archivieren', error)
}

export async function restore(id: string): Promise<void> {
  const { error } = await supabase.from('items').update({ archived_at: null }).eq('id', id)
  if (error) fail('Wiederherstellen', error)
}

/** Endgültig löschen. Das Foto entfernt der Aufrufer vorher über photosRepo. */
export async function removeForever(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) fail('Löschen', error)
}
