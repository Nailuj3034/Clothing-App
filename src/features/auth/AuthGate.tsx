import type { ReactNode } from 'react'
import { useSession } from './useSession'
import { LoginPage } from './LoginPage'

/** Zeigt die App nur mit gültiger Session, sonst die Login-Seite. */
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession()
  if (session === undefined) return null // kurzer Moment beim Start, Session wird geladen
  if (session === null) return <LoginPage />
  return <>{children}</>
}
