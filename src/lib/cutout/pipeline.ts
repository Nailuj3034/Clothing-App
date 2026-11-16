import type { Category } from '../../domain/types'
import { CUTOUT_CONFIG } from './config'
import { autoLevels } from './levels'
import { assessQuality, binarize, boundingBox, largestComponent, principalAngle, straightenRotation } from './mask'
import { getRemover, type BackgroundRemover } from './remover'

export type CutoutResult =
  | { kind: 'cutout'; blob: Blob; width: number; height: number; uncertain: boolean; reason?: string; rotation: number }
  | { kind: 'failed'; error: string }

export type CutoutStage = 'model' | 'segment' | 'finish'

const REASON_TEXT = {
  'too-small': 'Kaum etwas erkannt – liegt das Teil ganz im Bild?',
  'too-large': 'Der Boden wurde vermutlich mit erkannt.',
  fragmented: 'Das Teil wurde in mehrere Stücke zerlegt.',
} as const

/**
 * Freistell-Kette für ein Foto (Spec, Abschnitt 4):
 * Modell → Maske säubern → Qualität prüfen → zuschneiden → ausrichten → optional verbessern → WebP.
 * Wirft nie: jeder Fehler ergibt { kind: 'failed' }, damit die App immer weitermachen kann.
 */
export async function processPhoto(
  photo: Blob,
  category: Category,
  opts: { enhance: boolean },
  remover: BackgroundRemover = getRemover(),
  onProgress?: (stage: CutoutStage, p?: number) => void,
): Promise<CutoutResult> {
  try {
    onProgress?.('model', 0)
    await remover.load((p) => onProgress?.('model', p))

    onProgress?.('segment')
    const bitmap = await createImageBitmap(photo)
    const { width, height } = bitmap
    const forModel = await createImageBitmap(photo) // wird an den Worker übergeben (danach unbrauchbar)
    const soft = await remover.segment(forModel)

    onProgress?.('finish')
    const quality = assessQuality(soft)
    const main = largestComponent(binarize(soft)).mask
    const box = boundingBox(main)
    if (!box) return { kind: 'failed', error: 'Kein Teil erkannt.' }
    const rotation = straightenRotation(category, principalAngle(main))

    // Original + Maske → RGBA mit Transparenz (weiche Kanten bleiben, Krümel außerhalb des Teils verschwinden)
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const img = ctx.getImageData(0, 0, width, height)
    for (let i = 0; i < soft.data.length; i++) {
      const s = soft.data[i]
      img.data[i * 4 + 3] = main.data[i] ? s : s < CUTOUT_CONFIG.threshold ? s >> 1 : 0
    }
    const pixels = opts.enhance ? autoLevels(img.data) : img.data
    ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0)

    const out = await cropRotateScale(canvas, box, rotation)
    return {
      kind: 'cutout', blob: out.blob, width: out.width, height: out.height, rotation,
      uncertain: !quality.ok, reason: quality.reason ? REASON_TEXT[quality.reason] : undefined,
    }
  } catch (err) {
    return { kind: 'failed', error: (err as Error)?.message ?? String(err) }
  }
}

/** Freisteller manuell drehen (Vorschau: ↺/↻ 90°, ±5°). */
export async function rotateBlob(image: Blob, degrees: number): Promise<Blob> {
  const bitmap = await createImageBitmap(image)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()
  const out = await cropRotateScale(canvas, { x: 0, y: 0, width: canvas.width, height: canvas.height }, degrees)
  return out.blob
}

/** Ausschnitt nehmen, um seine Mitte drehen, auf max. outputMaxSide verkleinern, als WebP ausgeben. */
async function cropRotateScale(
  source: OffscreenCanvas,
  box: { x: number; y: number; width: number; height: number },
  degrees: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad))
  const rotW = box.width * cos + box.height * sin
  const rotH = box.width * sin + box.height * cos
  const scale = Math.min(1, CUTOUT_CONFIG.outputMaxSide / Math.max(rotW, rotH))
  const w = Math.max(1, Math.round(rotW * scale)), h = Math.max(1, Math.round(rotH * scale))

  const out = new OffscreenCanvas(w, h)
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(w / 2, h / 2)
  ctx.rotate(rad)
  ctx.scale(scale, scale)
  ctx.drawImage(source, box.x, box.y, box.width, box.height, -box.width / 2, -box.height / 2, box.width, box.height)
  // WebP mit Transparenz; Browser ohne WebP-Encoder liefern automatisch PNG
  const blob = await out.convertToBlob({ type: 'image/webp', quality: 0.9 })
  return { blob, width: w, height: h }
}
