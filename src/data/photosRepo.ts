import { requireUserId, supabase } from './supabase'

/**
 * Fotos im privaten Bucket `item-photos`.
 * Pfad: {user_id}/{item_id}-{timestamp}.jpg – der Zeitstempel sorgt dafür, dass ein ausgetauschtes Foto
 * eine neue Adresse bekommt (kein veraltetes Bild aus dem Browser-Cache).
 */
const BUCKET = 'item-photos'
/** Gültigkeit der signierten Anzeige-Links in Sekunden (1 Stunde) */
export const SIGNED_URL_SECONDS = 3600

export async function upload(itemId: string, blob: Blob): Promise<string> {
  const userId = await requireUserId()
  const path = `${userId}/${itemId}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error(`Foto-Upload fehlgeschlagen: ${error.message}`)
  return path
}

export async function remove(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`Foto löschen fehlgeschlagen: ${error.message}`)
}

/** Zeitlich begrenzter Link zum Anzeigen eines privaten Fotos. */
export async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error) throw new Error(`Foto laden fehlgeschlagen: ${error.message}`)
  return data.signedUrl
}
