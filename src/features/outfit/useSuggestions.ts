import { useMemo, useState } from 'react'
import { generate, pageSuggestions, type GenerateResult } from '../../domain/outfit/generate'
import type { OutfitContext } from '../../domain/outfit/types'
import { seededRng } from '../../domain/random'
import type { Item, WornOutfit } from '../../domain/types'

/**
 * Verbindet die reine Outfit-Logik mit der Seite:
 * berechnet die Rangliste, wenn sich Schrank, Verlauf oder Auswahl ändern, und blättert seitenweise.
 * Der Zufall bekommt einen festen Startwert pro Sitzung, damit Vorschläge beim Neuzeichnen nicht springen.
 */
export function useSuggestions(items: Item[] | undefined, history: WornOutfit[] | undefined, ctx: OutfitContext) {
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [page, setPage] = useState(0)

  const result: GenerateResult | null = useMemo(() => {
    if (!items || !history) return null
    return generate(items, history, ctx, seededRng(seed))
  }, [items, history, ctx, seed])

  const suggestions = useMemo(
    () => (result?.ok ? pageSuggestions(result.ranked, page, seededRng(seed + page)) : []),
    [result, page, seed],
  )

  return {
    result,
    suggestions,
    next: () => setPage((p) => p + 1),
    reset: () => setPage(0),
  }
}
