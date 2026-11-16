/**
 * Datums-Helfer. Ein „Tag“ ist in der App immer ein lokales Datum als String 'YYYY-MM-DD'.
 * So zählt „Heute getragen“ um 23:30 Uhr auch wirklich für heute (und nicht für den UTC-Tag).
 */

/** Lokales Datum eines Zeitpunkts als 'YYYY-MM-DD'. */
export function toLocalDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Anzahl ganzer Tage von a bis b (b − a).
 * Rechnet über UTC-Mitternacht, damit Sommer-/Winterzeit keinen halben Tag „verschluckt“.
 */
export function daysBetween(a: string, b: string): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000)
}
