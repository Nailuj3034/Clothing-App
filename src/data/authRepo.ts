import { supabase } from './supabase'

/** Login mit E-Mail und Passwort. Gibt bei Fehler eine deutsche Meldung zurück, sonst null. */
export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return null
  if (error.message.toLowerCase().includes('invalid')) return 'E-Mail oder Passwort stimmt nicht.'
  return 'Anmeldung fehlgeschlagen. Prüfe deine Internetverbindung und versuch es nochmal.'
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
