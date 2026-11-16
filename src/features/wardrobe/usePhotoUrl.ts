import { useQuery } from '@tanstack/react-query'
import * as photosRepo from '../../data/photosRepo'

/**
 * Signierte Anzeige-URL für ein Foto. Gecacht für 50 Minuten (Links gelten 60),
 * damit die Liste beim Scrollen nicht ständig neue Links anfordert.
 */
export function usePhotoUrl(path: string | null) {
  return useQuery({
    queryKey: ['photo-url', path],
    queryFn: () => photosRepo.signedUrl(path!),
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
  })
}
