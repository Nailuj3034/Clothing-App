/**
 * „Automatisch verbessern“: streckt jeden Farbkanal zwischen seinem 1.- und 99.-Perzentil auf 0–255.
 * Das hebt Helligkeit und Kontrast an und gleicht einen Farbstich aus (weil jeder Kanal einzeln gestreckt wird).
 * `strength` mischt das Ergebnis mit dem Original (0 = aus, 1 = voll) – 0.5 wirkt natürlich.
 * Transparente Pixel (Hintergrund nach dem Freistellen) werden ignoriert und nicht verändert.
 */
export function autoLevels(pixels: Uint8ClampedArray, strength = 0.5): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels)
  if (strength <= 0) return out

  for (let c = 0; c < 3; c++) {
    // Histogramm des Kanals über sichtbare Pixel
    const hist = new Uint32Array(256)
    let n = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) continue
      hist[pixels[i + c]]++
      n++
    }
    if (n === 0) return out
    const lo = percentile(hist, n, 0.01)
    const hi = percentile(hist, n, 0.99)
    if (hi - lo < 1) continue

    const scale = 255 / (hi - lo)
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) continue
      const v = pixels[i + c]
      const stretched = (v - lo) * scale
      out[i + c] = v + (stretched - v) * strength
    }
  }
  return out
}

/** Wert, unter dem der Anteil `q` aller Pixel liegt. */
function percentile(hist: Uint32Array, n: number, q: number): number {
  const target = n * q
  let acc = 0
  for (let v = 0; v < 256; v++) {
    acc += hist[v]
    if (acc > target) return v
  }
  return 255
}
