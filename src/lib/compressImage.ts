import { fitWithin } from './fitWithin'

/**
 * Verkleinert ein Foto im Browser, bevor es hochgeladen wird:
 * längste Seite max. `maxSide` px, Ausgabe als JPEG. Ein Handyfoto (3–5 MB) wird so zu ca. 150–250 KB.
 * `imageOrientation: 'from-image'` dreht das Bild laut EXIF-Daten richtig herum.
 */
export async function compressImage(file: File, maxSide = 1200, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bild konnte nicht verarbeitet werden.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht komprimiert werden.'))),
      'image/jpeg',
      quality,
    )
  })
}
