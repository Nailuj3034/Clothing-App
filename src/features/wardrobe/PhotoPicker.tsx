import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { compressImage } from '../../lib/compressImage'
import type { PhotoChange } from './useItems'
import { usePhotoUrl } from './usePhotoUrl'

/**
 * Foto aufnehmen oder aus der Galerie wählen.
 * Das Bild wird sofort im Browser verkleinert; hochgeladen wird erst beim Speichern des Formulars.
 *  - „Kamera“ nutzt capture="environment" → öffnet am Handy direkt die Rückkamera
 *  - „Galerie“ ohne capture → öffnet die Bildauswahl
 */
export function PhotoPicker({ currentPath, change, onChange }: {
  currentPath: string | null
  change: PhotoChange
  onChange: (c: PhotoChange) => void
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: savedUrl } = usePhotoUrl(change.kind === 'keep' ? currentPath : null)

  // Vorschau für ein neu gewähltes (noch nicht gespeichertes) Foto
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  useEffect(() => {
    if (change.kind !== 'replace') return setPendingUrl(null)
    const url = URL.createObjectURL(change.blob)
    setPendingUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [change])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // dieselbe Datei soll erneut wählbar sein
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onChange({ kind: 'replace', blob: await compressImage(file) })
    } catch {
      setError('Dieses Bild konnte nicht gelesen werden. Versuch ein anderes.')
    } finally {
      setBusy(false)
    }
  }

  const previewUrl = pendingUrl ?? (change.kind === 'keep' ? savedUrl : null)
  const hasPhoto = change.kind === 'replace' || (change.kind === 'keep' && !!currentPath)

  return (
    <div className="photo-picker">
      {previewUrl && <img className="photo-picker__preview" src={previewUrl} alt="Foto des Teils" />}
      {busy && <p className="muted">Bild wird verkleinert …</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <div className="photo-picker__actions">
        <button type="button" className="btn btn--ghost" onClick={() => cameraRef.current?.click()} disabled={busy}>
          {hasPhoto ? 'Neu aufnehmen' : 'Kamera'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => galleryRef.current?.click()} disabled={busy}>
          {hasPhoto ? 'Aus Galerie tauschen' : 'Galerie'}
        </button>
      </div>
      {hasPhoto && (
        <button type="button" className="btn btn--danger" onClick={() => onChange(currentPath ? { kind: 'remove' } : { kind: 'keep' })}>
          Foto entfernen
        </button>
      )}

      <input ref={cameraRef} id="photo-camera" type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
      <input ref={galleryRef} id="photo-gallery" type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}
