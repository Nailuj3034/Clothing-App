import { createClient } from '@supabase/supabase-js'

/**
 * Der eine Supabase-Client der App.
 * URL und anon-Key sind öffentlich (stehen in jedem Browser-Bundle) – das ist bei Supabase so gedacht.
 * Geschützt werden die Daten durch Row Level Security in der Datenbank (siehe supabase/migrations).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY fehlen. Siehe .env.example.')
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

/** ID des eingeloggten Nutzers; wirft, wenn niemand eingeloggt ist. */
export async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Nicht eingeloggt.')
  return id
}
