import type { Category } from '../../domain/types'
import { CUTOUT_CONFIG } from './config'

/**
 * Reine Helfer für Segmentierungs-Masken (ohne Browser-APIs, daher testbar).
 * Eine Maske hat pro Pixel einen Wert 0–255: wie sicher das Pixel zum Kleidungsstück gehört.
 */
export interface Mask {
  width: number
  height: number
  /** Zeilenweise, Länge width × height */
  data: Uint8Array
}

export interface Box { x: number; y: number; width: number; height: number }

const isOn = (v: number) => v >= CUTOUT_CONFIG.threshold

/** Harte Maske: jedes Pixel ist entweder 0 oder 255. */
export function binarize(mask: Mask, threshold: number = CUTOUT_CONFIG.threshold): Mask {
  const data = new Uint8Array(mask.data.length)
  for (let i = 0; i < data.length; i++) data[i] = mask.data[i] >= threshold ? 255 : 0
  return { width: mask.width, height: mask.height, data }
}

/**
 * Behält nur die größte zusammenhängende Fläche (4er-Nachbarschaft) – entfernt Krümel und Bodenreste.
 * `share` = Anteil der größten Fläche an allen erkannten Pixeln (1 = nur eine Fläche).
 */
export function largestComponent(mask: Mask): { mask: Mask; share: number } {
  const { width: w, height: h } = mask
  const labels = new Int32Array(w * h) // 0 = nicht besucht
  const stack = new Int32Array(w * h)
  let label = 0, bestLabel = 0, bestSize = 0, total = 0

  for (let start = 0; start < w * h; start++) {
    if (!isOn(mask.data[start]) || labels[start]) continue
    label++
    let size = 0, top = 0
    stack[top++] = start
    labels[start] = label
    while (top > 0) {
      const i = stack[--top]
      size++
      const x = i % w, y = (i / w) | 0
      // Nachbarn: links, rechts, oben, unten
      if (x > 0 && isOn(mask.data[i - 1]) && !labels[i - 1]) { labels[i - 1] = label; stack[top++] = i - 1 }
      if (x < w - 1 && isOn(mask.data[i + 1]) && !labels[i + 1]) { labels[i + 1] = label; stack[top++] = i + 1 }
      if (y > 0 && isOn(mask.data[i - w]) && !labels[i - w]) { labels[i - w] = label; stack[top++] = i - w }
      if (y < h - 1 && isOn(mask.data[i + w]) && !labels[i + w]) { labels[i + w] = label; stack[top++] = i + w }
    }
    total += size
    if (size > bestSize) { bestSize = size; bestLabel = label }
  }

  const data = new Uint8Array(w * h)
  for (let i = 0; i < data.length; i++) data[i] = labels[i] === bestLabel && bestLabel ? 255 : 0
  return { mask: { width: w, height: h, data }, share: total ? bestSize / total : 0 }
}

/** Plausibilitätsprüfung: Ist die Maske vermutlich ein sauber erkanntes Teil? */
export function assessQuality(mask: Mask): { ok: boolean; coverage: number; reason?: 'too-small' | 'too-large' | 'fragmented' } {
  let on = 0
  for (const v of mask.data) if (isOn(v)) on++
  const coverage = on / mask.data.length
  if (coverage < CUTOUT_CONFIG.minCoverage) return { ok: false, coverage, reason: 'too-small' }
  if (coverage > CUTOUT_CONFIG.maxCoverage) return { ok: false, coverage, reason: 'too-large' }
  if (largestComponent(mask).share < CUTOUT_CONFIG.minLargestShare) return { ok: false, coverage, reason: 'fragmented' }
  return { ok: true, coverage }
}

/** Kleinstes Rechteck um alle erkannten Pixel, plus Rand (relativ zur längeren Seite), am Bildrand begrenzt. */
export function boundingBox(mask: Mask, padding: number = CUTOUT_CONFIG.padding): Box | null {
  const { width: w, height: h } = mask
  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!isOn(mask.data[y * w + x])) continue
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  if (maxX < 0) return null
  const pad = Math.round(Math.max(maxX - minX + 1, maxY - minY + 1) * padding)
  const x0 = Math.max(0, minX - pad), y0 = Math.max(0, minY - pad)
  const x1 = Math.min(w, maxX + 1 + pad), y1 = Math.min(h, maxY + 1 + pad)
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/**
 * Winkel der langen Achse des Teils zur Senkrechten in Grad, Bereich (−90, 90].
 * Berechnet über die Momente zweiter Ordnung (wie „schräg“ die Pixelwolke liegt).
 */
export function principalAngle(mask: Mask): number {
  const { width: w, height: h } = mask
  let n = 0, sx = 0, sy = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (isOn(mask.data[y * w + x])) { n++; sx += x; sy += y }
  }
  if (n === 0) return 0
  const mx = sx / n, my = sy / n
  let mu20 = 0, mu02 = 0, mu11 = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!isOn(mask.data[y * w + x])) continue
    const dx = x - mx, dy = y - my
    mu20 += dx * dx
    mu02 += dy * dy
    mu11 += dx * dy
  }
  const thetaFromX = (0.5 * Math.atan2(2 * mu11, mu20 - mu02) * 180) / Math.PI
  return normalize(thetaFromX - 90)
}

/**
 * Welche Drehung (Grad) das Teil gerade rückt:
 * Kleidung senkrecht, Schuhe waagerecht, Schmuck nie. Große Abweichungen bleiben unverändert.
 */
export function straightenRotation(category: Category, angle: number): number {
  if (category === 'accessory') return 0
  const target = category === 'shoes' ? 90 : 0
  const deviation = normalize(angle - target)
  if (Math.abs(deviation) >= CUTOUT_CONFIG.maxStraighten) return 0
  return deviation === 0 ? 0 : -deviation
}

/** Winkel in den Bereich (−90, 90] bringen (eine Achse hat keine Richtung). */
function normalize(deg: number): number {
  let d = deg % 180
  if (d <= -90) d += 180
  if (d > 90) d -= 180
  return d
}
