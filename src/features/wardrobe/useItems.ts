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
