import { useOnline } from './useOnline'

/** Hinweisleiste ohne Netz: Daten sind lesbar (aus dem Cache), Änderungen gehen nicht. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return <div className="offline-banner" role="status">Offline – Änderungen sind gerade nicht möglich.</div>
}
