import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * Zentraler Cache für Server-Daten (TanStack Query).
 *  - Daten gelten 30 s als frisch; danach wird im Hintergrund neu geladen
 *  - networkMode 'offlineFirst': ohne Netz werden die zuletzt geladenen Daten gezeigt
 *  - gcTime 1 Woche, damit der im Browser gespeicherte Cache (siehe persister) so lange gültig bleibt
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, gcTime: WEEK, networkMode: 'offlineFirst' },
    mutations: { networkMode: 'offlineFirst' },
  },
})

/** Speichert den Daten-Cache im localStorage → nach Neustart ohne Netz sind die letzten Daten sichtbar. */
export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'outfit-cache',
})
export const PERSIST_MAX_AGE = WEEK

/** Einheitliche Cache-Schlüssel, damit Laden und Invalidieren dieselben Namen nutzen. */
export const queryKeys = {
  items: ['items'] as const,
  archivedItems: ['items', 'archived'] as const,
  allItems: ['items', 'all'] as const,
  outfits: ['outfits'] as const,
}
