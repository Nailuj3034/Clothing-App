/**
 * Stellschrauben der Freistell-Kette (Startwerte laut Design-Dokument).
 * Bei schlechten Ergebnissen hier nachjustieren.
 */
export const CUTOUT_CONFIG = {
  /** Maskenwert ab dem ein Pixel zum Teil gehört (0–255) */
  threshold: 128,
  /** Unter 3 % Fläche: wahrscheinlich nichts erkannt */
  minCoverage: 0.03,
  /** Über 90 % Fläche: wahrscheinlich Boden mit erkannt */
  maxCoverage: 0.9,
  /** Größte Fläche muss mind. 70 % aller erkannten Flächen ausmachen, sonst „zerfasert“ */
  minLargestShare: 0.7,
  /** Nur Schieflagen unter 30° werden automatisch gerade gerückt */
  maxStraighten: 30,
  /** Rand um das Teil beim Zuschneiden, relativ zur längeren Seite */
  padding: 0.04,
  /** Längste Seite des gespeicherten Freistellers in Pixeln */
  outputMaxSide: 1000,
} as const
