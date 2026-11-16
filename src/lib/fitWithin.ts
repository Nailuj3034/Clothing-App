/**
 * Berechnet die Zielgröße eines Bildes, sodass die längere Seite höchstens `maxSide` Pixel hat.
 * Seitenverhältnis bleibt erhalten, kleine Bilder werden nicht vergrößert.
 */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}
