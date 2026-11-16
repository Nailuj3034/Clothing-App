import { useSyncExternalStore } from 'react'
import type { OutfitSuggestion } from '../../domain/outfit/generate'

/**
 * Merkt sich das Outfit, das im 3D-Tab angezeigt werden soll.
 * Ein winziger globaler Speicher (ohne zusätzliche Bibliothek), den Outfit-Seite und 3D-Ansicht teilen.
 */
let selected: OutfitSuggestion | null = null
const listeners = new Set<() => void>()

function setSelected(o: OutfitSuggestion) {
  selected = o
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSelectedOutfit(): [OutfitSuggestion | null, (o: OutfitSuggestion) => void] {
  const value = useSyncExternalStore(subscribe, () => selected)
  return [value, setSelected]
}
