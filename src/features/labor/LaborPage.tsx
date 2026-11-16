import { useState, type ChangeEvent } from 'react'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../../domain/types'
import { compressImage } from '../../lib/compressImage'
import { MODELS, bestDevice, type Device, type Dtype, type ModelId } from '../../lib/cutout/models'
import { processPhoto, type CutoutResult } from '../../lib/cutout/pipeline'
import { createWorkerRemover, type BackgroundRemover } from '../../lib/cutout/remover'
import './labor.css'

interface Row { name: string; original: string; result?: CutoutResult; url?: string; ms?: number }

/**
 * Modell-Labor (nur über /labor erreichbar): vergleicht Freistell-Modelle mit echten Fotos.
 * Zeigt pro Foto Original, Freisteller (auf Karomuster), Dauer und Qualitätsurteil.
 */
export function LaborPage() {
  const [model, setModel] = useState<ModelId>('birefnet-lite')
  const [dtype, setDtype] = useState<Dtype>('fp16')
  const [device, setDevice] = useState<Device>(bestDevice())
  const [category, setCategory] = useState<Category>('top')
  const [enhance, setEnhance] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState('')
  const [loadMs, setLoadMs] = useState<number | null>(null)
  const [remover, setRemover] = useState<{ key: string; r: BackgroundRemover } | null>(null)

  function currentRemover(): BackgroundRemover {
    const key = `${model}|${dtype}|${device}`
    if (remover?.key === key) return remover.r
    const r = createWorkerRemover(model, dtype, device)
    setRemover({ key, r })
    setLoadMs(null)
    return r
  }

  async function run(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!files.length) return
    const r = currentRemover()
    const start = performance.now()
    setStatus('Modell wird geladen …')
    try {
      await r.load((p) => setStatus(`Modell wird geladen … ${Math.round(p * 100)} %`))
    } catch (err) {
      setStatus(`Modell konnte nicht geladen werden: ${(err as Error).message}`)
      return
    }
    setLoadMs(Math.round(performance.now() - start))

    const newRows: Row[] = files.map((f) => ({ name: f.name, original: URL.createObjectURL(f) }))
    setRows((old) => [...newRows, ...old])
    for (let i = 0; i < files.length; i++) {
      setStatus(`Foto ${i + 1} / ${files.length} wird freigestellt …`)
      const photo = await compressImage(files[i])
      const t = performance.now()
      const result = await processPhoto(photo, category, { enhance }, r)
      const ms = Math.round(performance.now() - t)
      const url = result.kind === 'cutout' ? URL.createObjectURL(result.blob) : undefined
      newRows[i] = { ...newRows[i], result, ms, url }
      setRows((old) => old.map((row) => (row.original === newRows[i].original ? newRows[i] : row)))
    }
    setStatus('Fertig.')
  }

  return (
    <main className="page">
      <h1 className="page-title">Labor</h1>
      <p className="muted">Freistell-Modelle mit echten Fotos vergleichen. Teil flach auf den Boden legen, von oben fotografieren.</p>

      <div className="labor-controls">
        <label>Modell
          <select id="labor-model" value={model} onChange={(e) => setModel(e.target.value as ModelId)}>
            {Object.values(MODELS).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label>Genauigkeit
          <select id="labor-dtype" value={dtype} onChange={(e) => setDtype(e.target.value as Dtype)}>
            <option value="fp16">fp16</option><option value="q8">q8 (kleiner)</option><option value="fp32">fp32 (groß)</option>
          </select>
        </label>
        <label>Rechner
          <select id="labor-device" value={device} onChange={(e) => setDevice(e.target.value as Device)}>
            <option value="webgpu">Grafikchip (WebGPU)</option><option value="wasm">Prozessor (WASM)</option>
          </select>
        </label>
        <label>Kategorie
          <select id="labor-category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
        <label className="labor-check">
          <input id="labor-enhance" type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} /> Automatisch verbessern
        </label>
      </div>

      <label className="btn btn--primary">
        Fotos wählen
        <input id="labor-files" type="file" accept="image/*" multiple hidden onChange={run} />
      </label>
      {status && <p className="muted" role="status">{status}{loadMs !== null && ` · Laden: ${loadMs} ms`}</p>}

      <ul className="labor-list">
        {rows.map((row) => (
          <li key={row.original} className="labor-row">
            <img src={row.original} alt="" />
            <div className="checker">{row.url && <img src={row.url} alt="Freisteller" />}</div>
            <div className="labor-meta">
              <strong>{row.name}</strong>
              {!row.result && <span className="muted">läuft …</span>}
              {row.result?.kind === 'failed' && <span className="error">Fehler: {row.result.error}</span>}
              {row.result?.kind === 'cutout' && (
                <span>{row.ms} ms · gedreht {row.result.rotation.toFixed(0)}° · {row.result.uncertain ? `⚠ ${row.result.reason}` : '✓ sauber'}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
