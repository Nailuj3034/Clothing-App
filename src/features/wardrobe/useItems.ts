import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Item } from '../../domain/types'
import type { ItemInput } from '../../data/mappers'
import * as itemsRepo from '../../data/itemsRepo'
import { queryKeys } from '../../data/queryClient'

/** Alle aktiven Teile im Schrank. */
export function useItems() {
  return useQuery({ queryKey: queryKeys.items, queryFn: itemsRepo.list })
}

/** Neues Teil anlegen (id fehlt) oder bestehendes aktualisieren. */
export function useSaveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ItemInput }): Promise<Item> =>
      id ? itemsRepo.update(id, input) : itemsRepo.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.items }),
  })
}

export function useArchiveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => itemsRepo.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.items }),
  })
}
