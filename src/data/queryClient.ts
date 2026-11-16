import { QueryClient } from '@tanstack/react-query'

/**
 * Zentraler Cache für Server-Daten (TanStack Query).
 * Daten gelten 30 s als frisch; danach wird im Hintergrund neu geladen, z. B. wenn die App wieder in den Vordergrund kommt.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

/** Einheitliche Cache-Schlüssel, damit Laden und Invalidieren dieselben Namen nutzen. */
export const queryKeys = {
  items: ['items'] as const,
  archivedItems: ['items', 'archived'] as const,
  allItems: ['items', 'all'] as const,
}
