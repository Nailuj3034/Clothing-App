/// <reference lib="webworker" />
/**
 * Web Worker für das Freistellen. Läuft in einem eigenen Thread, damit die Oberfläche nie einfriert.
 * Nachrichten rein:  { type: 'load', model, dtype, device }  |  { type: 'segment', id, bitmap }
 * Nachrichten raus:  { type: 'progress', p } | { type: 'loaded' } | { type: 'mask', id, width, height, data } | { type: 'error', id?, message }
 */
import { env, pipeline, RawImage, type BackgroundRemovalPipeline } from '@huggingface/transformers'
import { MODELS, type Device, type Dtype, type ModelId } from './models'

// Laufzeit-Dateien von der eigenen Adresse (offline-fähig), Modelle aus dem Browser-Cache
env.allowLocalModels = false
env.useBrowserCache = true
if (env.backends.onnx.wasm) env.backends.onnx.wasm.wasmPaths = '/ort/'

// pipeline() hat sehr viele Typ-Varianten (TS-Fehler „union type too complex“) → schlanker Typ für unseren Fall
const createRemover = pipeline as unknown as (
  task: 'background-removal', model: string, options: Record<string, unknown>,
) => Promise<BackgroundRemovalPipeline>

let remover: BackgroundRemovalPipeline | null = null
let loadedKey = ''

type InMessage =
  | { type: 'load'; model: ModelId; dtype: Dtype; device: Device }
  | { type: 'segment'; id: number; bitmap: ImageBitmap }

const post = (msg: unknown, transfer: Transferable[] = []) => (self as DedicatedWorkerGlobalScope).postMessage(msg, transfer)

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data
  try {
    if (msg.type === 'load') {
      const key = `${msg.model}|${msg.dtype}|${msg.device}`
      if (remover && loadedKey === key) return post({ type: 'loaded' })
      const info = MODELS[msg.model]
      // Fortschritt über alle Dateien des Modells mitteln
      const files = new Map<string, number>()
      remover = await createRemover('background-removal', info.repo, {
        revision: info.revision,
        dtype: msg.dtype,
        device: msg.device,
        progress_callback: (p: { status: string; file?: string; progress?: number }) => {
          if (p.status === 'progress' && p.file) {
            files.set(p.file, p.progress ?? 0)
            const avg = [...files.values()].reduce((a, b) => a + b, 0) / files.size
            post({ type: 'progress', p: avg / 100 })
          }
        },
      })
      loadedKey = key
      return post({ type: 'loaded' })
    }

    if (msg.type === 'segment') {
      if (!remover) throw new Error('Modell nicht geladen')
      const { bitmap } = msg
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const image = new RawImage(data, width, height, 4)

      const [result] = await remover(image)
      // Ergebnis ist RGBA; der Alphakanal ist die Maske
      const rgba = result.data as Uint8ClampedArray
      const mask = new Uint8Array(width * height)
      for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4 + 3]
      return post({ type: 'mask', id: msg.id, width, height, data: mask }, [mask.buffer])
    }
  } catch (err) {
    post({ type: 'error', id: msg.type === 'segment' ? msg.id : undefined, message: (err as Error).message ?? String(err) })
  }
}
