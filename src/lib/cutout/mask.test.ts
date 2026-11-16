import { describe, expect, it } from 'vitest'
import {
  assessQuality, binarize, boundingBox, largestComponent, principalAngle, straightenRotation, type Mask,
} from './mask'

// ---------- Helfer für synthetische Masken ----------
function empty(w: number, h: number): Mask {
  return { width: w, height: h, data: new Uint8Array(w * h) }
}
/** Rechteck (rx, ry, rw, rh) mit Wert 255 in eine Maske zeichnen */
function rect(m: Mask, rx: number, ry: number, rw: number, rh: number, value = 255): Mask {
  for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) m.data[y * m.width + x] = value
  return m
}
/** Um `deg` gedrehtes, gefülltes Rechteck (Breite bw, Höhe bh) um die Bildmitte */
function rotatedRect(w: number, h: number, bw: number, bh: number, deg: number): Mask {
  const m = empty(w, h)
  const a = (deg * Math.PI) / 180
  const cx = w / 2, cy = h / 2
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - cx, dy = y - cy
    // in das Koordinatensystem des Rechtecks zurückdrehen
    const u = dx * Math.cos(a) + dy * Math.sin(a)
    const v = -dx * Math.sin(a) + dy * Math.cos(a)
    if (Math.abs(u) <= bw / 2 && Math.abs(v) <= bh / 2) m.data[y * w + x] = 255
  }
  return m
}
const count = (m: Mask) => m.data.reduce((n, v) => n + (v > 0 ? 1 : 0), 0)

describe('binarize', () => {
  it('setzt Werte unter 128 auf 0 und ab 128 auf 255', () => {
    const m = empty(2, 1)
    m.data[0] = 127
    m.data[1] = 128
    expect([...binarize(m).data]).toEqual([0, 255])
  })
})

describe('largestComponent', () => {
  it('behält nur die größte zusammenhängende Fläche', () => {
    const m = rect(rect(empty(20, 10), 0, 0, 6, 5), 15, 0, 2, 5) // 30 px und 10 px
    const r = largestComponent(m)
    expect(count(r.mask)).toBe(30)
    expect(r.share).toBeCloseTo(0.75)
  })
})

describe('assessQuality', () => {
  it('meldet zu wenig Fläche', () => {
    expect(assessQuality(rect(empty(100, 100), 0, 0, 20, 10)).reason).toBe('too-small') // 2 %
  })
  it('meldet zu viel Fläche (Boden mit erkannt)', () => {
    expect(assessQuality(rect(empty(100, 100), 0, 0, 100, 95)).reason).toBe('too-large') // 95 %
  })
  it('meldet viele Einzelflecken', () => {
    const m = empty(100, 100)
    for (let i = 0; i < 5; i++) rect(m, i * 20, 0, 10, 50) // 5 gleich große Flecken
    expect(assessQuality(m).reason).toBe('fragmented')
  })
  it('akzeptiert ein sauberes Teil', () => {
    const q = assessQuality(rect(empty(100, 100), 20, 20, 50, 60)) // 30 %
    expect(q.ok).toBe(true)
    expect(q.coverage).toBeCloseTo(0.3)
  })
})

describe('boundingBox', () => {
  it('umschließt die Fläche genau ohne Rand', () => {
    expect(boundingBox(rect(empty(100, 100), 10, 20, 30, 40), 0)).toEqual({ x: 10, y: 20, width: 30, height: 40 })
  })
  it('liefert null für eine leere Maske', () => {
    expect(boundingBox(empty(10, 10))).toBeNull()
  })
  it('begrenzt den Rand am Bildrand', () => {
    expect(boundingBox(rect(empty(100, 100), 0, 0, 50, 50), 0.1)).toEqual({ x: 0, y: 0, width: 55, height: 55 })
  })
})

describe('principalAngle', () => {
  it('ist ~0 für ein hohes, schmales Teil', () => {
    expect(principalAngle(rotatedRect(120, 120, 20, 80, 0))).toBeCloseTo(0, 0)
  })
  it('ist ~90 für ein breites, flaches Teil', () => {
    expect(Math.abs(principalAngle(rotatedRect(120, 120, 80, 20, 0)))).toBeCloseTo(90, 0)
  })
  it('misst eine Schräglage von 20°', () => {
    expect(Math.abs(principalAngle(rotatedRect(160, 160, 24, 100, 20)) - 20)).toBeLessThan(2)
  })
})

describe('straightenRotation', () => {
  it('richtet Oberteile senkrecht aus', () => {
    expect(straightenRotation('top', 20)).toBe(-20)
  })
  it('lässt große Abweichungen unverändert', () => {
    expect(straightenRotation('top', 40)).toBe(0)
  })
  it('richtet Schuhe waagerecht aus', () => {
    expect(straightenRotation('shoes', 80)).toBe(10)
  })
  it('dreht Schmuck nie', () => {
    expect(straightenRotation('accessory', 15)).toBe(0)
  })
})
