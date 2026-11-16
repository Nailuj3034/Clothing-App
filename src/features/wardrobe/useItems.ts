import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Item } from '../../domain/types'
import type { ItemInput } from '../../data/mappers'
import * as itemsRepo from '../../data/itemsRepo'
import * as photosRepo from '../../data/photosRepo'
import { queryKeys } from '../../data/queryClient'

/** Was mit dem Foto beim Speichern passieren soll. */
export type PhotoChange =
  | { kind: 'keep' }
  | { kind: 'replace'; blob: Blob }
  | { kind: 'remove' }

/** Alle aktiven Teile im Schrank. */
export function useItems() {
  return useQuery({ queryKey: queryKeys.items, queryFn: itemsRepo.list })
}

/**
 * Teil speichern (neu oder bestehend) inkl. Foto.
 * Reihenfolge beim Austauschen: neues Foto hochladen → Teil speichern → altes Foto löschen.
 * So zeigt das Teil nie auf eine Datei, die es nicht (mehr) gibt.
 */
export function useSaveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input, photo }: { id?: string; input: ItemInput; photo: PhotoChange }): Promise<Item> => {
      const oldPath = input.photoPath
      let item = id ? await itemsRepo.update(id, input) : await itemsRepo.create({ ...input, photoPath: null })

      if (photo.kind === 'replace') {
        const newPath = await photosRepo.upload(item.id, photo.blob)
        item = await itemsRepo.update(item.id, { photoPath: newPath })
        if (oldPath) await photosRepo.remove(oldPath).catch(() => undefined) // Aufräumen darf scheitern
      } else if (photo.kind === 'remove' && oldPath) {
        item = await itemsRepo.update(item.id, { photoPath: null })
        await photosRepo.remove(oldPath).catch(() => undefined)
      }
      return item
    },
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

/**
 * „da / weg“ umschalten – optimistisch:
 * Die Liste ändert sich sofort, gespeichert wird im Hintergrund.
 * Schlägt das Speichern fehl (z. B. offline), wird der alte Zustand wiederhergestellt.
 */
export function useToggleAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => itemsRepo.update(id, { available }),
    onMutate: async ({ id, available }) => {
      await qc.cancelQueries({ queryKey: queryKeys.items })
      const previous = qc.getQueryData<Item[]>(queryKeys.items)
      qc.setQueryData<Item[]>(queryKeys.items, (items) =>
        items?.map((i) => (i.id === id ? { ...i, available } : i)))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.items, context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.items }),
  })
}

/** Alle Teile inkl. archivierter – für den Verlauf. */
export function useAllItems() {
  return useQuery({ queryKey: queryKeys.allItems, queryFn: itemsRepo.listAll })
}

export function useArchivedItems() {
  return useQuery({ queryKey: queryKeys.archivedItems, queryFn: itemsRepo.listArchived })
}

/** Archiviertes Teil zurück in den Schrank holen. */
export function useRestoreItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => itemsRepo.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.items }), // trifft auch archived/all
  })
}

/** Endgültig löschen: erst das Foto, dann das Teil (verschwindet dabei auch aus alten Outfits). */
export function useDeleteForever() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: Item) => {
      if (item.photoPath) await photosRepo.remove(item.photoPath).catch(() => undefined)
      await itemsRepo.removeForever(item.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items })
      qc.invalidateQueries({ queryKey: queryKeys.outfits })
    },
  })
}
