import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as outfitsRepo from '../../data/outfitsRepo'
import { queryKeys } from '../../data/queryClient'

/** Wie weit zurück der Verlauf für die Vorschläge geladen wird (Schmuck „lange nicht getragen“ braucht etwas Historie). */
const HISTORY_DAYS = 60

export function useRecentOutfits(today: string) {
  return useQuery({
    queryKey: [...queryKeys.outfits, 'recent', today],
    queryFn: () => outfitsRepo.listRecent(today, HISTORY_DAYS),
  })
}

export function useAllOutfits() {
  return useQuery({ queryKey: [...queryKeys.outfits, 'all'], queryFn: outfitsRepo.listAll })
}

export function useSaveWorn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: outfitsRepo.saveWorn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.outfits }),
  })
}

export function useRemoveWorn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: outfitsRepo.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.outfits }),
  })
}
