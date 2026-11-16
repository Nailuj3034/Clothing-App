import type { Mask } from './mask'
import { ACTIVE_MODEL, bestDevice, type Device, type Dtype, type ModelId } from './models'

/**
 * Schnittstelle zum Freistellen. Heute: KI-Modell im Browser (Web Worker).
 * Später kann hier z. B. ein Backend-Dienst angeschlossen werden, ohne den Rest der App zu ändern.
 */
export interface BackgroundRemover {
  id: string
  /** Modell laden (beim ersten Mal Download, danach aus dem Cache); p = 0–1 */
  load(onProgress?: (p: number) => void): Promise<void>
  /** Maske in Bildgröße: 0 = Hintergrund, 255 = Teil */
  segment(image: ImageBitmap): Promise<Mask>
}

/** Remover, der das Modell in einem eigenen Web Worker ausführt. */
export function createWorkerRemover(model: ModelId, dtype: Dtype, device: Device = bestDevice()): BackgroundRemover {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  let nextId = 1
  let loading: Promise<void> | null = null
  let progressListener: ((p: number) => void) | undefined
  const pending = new Map<number, { resolve: (m: Mask) => void; reject: (e: Error) => void }>()
  let loadDone: { resolve: () => void; reject: (e: Error) => void } | null = null

  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data
    if (msg.type === 'progress') progressListener?.(msg.p)
    else if (msg.type === 'loaded') loadDone?.resolve()
    else if (msg.type === 'mask') {
      pending.get(msg.id)?.resolve({ width: msg.width, height: msg.height, data: msg.data })
      pending.delete(msg.id)
    } else if (msg.type === 'error') {
      const err = new Error(msg.message)
      if (msg.id !== undefined) { pending.get(msg.id)?.reject(err); pending.delete(msg.id) }
      else { loadDone?.reject(err); loading = null }
    }
  }
  worker.onerror = (e) => {
    const err = new Error(e.message || 'Worker-Fehler')
    loadDone?.reject(err)
    loading = null
    pending.forEach((p) => p.reject(err))
    pending.clear()
  }

  return {
    id: `${model}-${dtype}-${device}`,
    load(onProgress) {
      progressListener = onProgress
      if (!loading) {
        loading = new Promise<void>((resolve, reject) => { loadDone = { resolve, reject } })
        worker.postMessage({ type: 'load', model, dtype, device })
      }
      return loading
    },
    segment(image) {
      const id = nextId++
      return new Promise<Mask>((resolve, reject) => {
        pending.set(id, { resolve, reject })
        worker.postMessage({ type: 'segment', id, bitmap: image }, [image])
      })
    },
  }
}

let defaultRemover: BackgroundRemover | null = null

/** Der Remover, den die App standardmäßig nutzt (ein Worker für die ganze Sitzung). */
export function getRemover(): BackgroundRemover {
  defaultRemover ??= createWorkerRemover(ACTIVE_MODEL.model, ACTIVE_MODEL.dtype)
  return defaultRemover
}
