import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ACCESSORY_LABELS, ACCESSORY_TYPES, CATEGORIES, CATEGORY_LABELS, OCCASIONS, OCCASION_LABELS,
  WARMTHS, WARMTH_LABELS, type Item,
} from '../../domain/types'
import type { ItemInput } from '../../data/mappers'
import { Chip } from '../../ui/Chip'
import { ColorPicker } from './ColorPicker'
import { PhotoPicker } from './PhotoPicker'
import { useArchiveItem, useItems, useSaveItem, type PhotoChange } from './useItems'

const EMPTY: ItemInput = {
  name: '', category: 'top', accessoryType: null, isCore: false,
  colorPrimary: 'black', colorSecondary: null, warmth: 'medium', occasions: [],
  photoPath: null, available: true,
}

function toInput(item: Item): ItemInput {
  const { id: _id, archivedAt: _a, ...input } = item
  return input
}

/** Prüft das Formular und gibt eine deutsche Fehlermeldung zurück (oder null). */
function validate(f: ItemInput): string | null {
  if (!f.name.trim()) return 'Bitte gib dem Teil einen Namen.'
  if (f.category === 'accessory' && !f.accessoryType) return 'Bitte wähle die Art des Accessoires.'
  if (f.occasions.length === 0) return 'Bitte wähle mindestens einen Anlass.'
  return null
}

/** Formular zum Anlegen (/teil/neu) und Bearbeiten (/teil/:id) eines Teils. */
export function ItemFormPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { data: items, isLoading } = useItems()
  const existing = items?.find((i) => i.id === id)

  const [form, setForm] = useState<ItemInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [showSecondary, setShowSecondary] = useState(false)
  const [photo, setPhoto] = useState<PhotoChange>({ kind: 'keep' })
  const save = useSaveItem()
  const archive = useArchiveItem()

  // Bestehendes Teil ins Formular laden, sobald es aus dem Cache verfügbar ist
  useEffect(() => { if (existing) setForm(toInput(existing)) }, [existing])

  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const toggleOccasion = (o: ItemInput['occasions'][number]) =>
    set('occasions', form.occasions.includes(o) ? form.occasions.filter((x) => x !== o) : [...form.occasions, o])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const message = validate(form)
    if (message) return setError(message)
    setError(null)
    try {
      await save.mutateAsync({ id, input: { ...form, name: form.name.trim() }, photo })
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleArchive() {
    if (!id) return
    await archive.mutateAsync(id)
    navigate('/')
  }

  if (!isNew && isLoading) return <main className="page"><p className="muted">Lädt …</p></main>
  if (!isNew && !existing) return <main className="page"><p>Dieses Teil gibt es nicht (mehr).</p></main>

  return (
    <main className="page page--form">
      <header className="form-head">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => navigate(-1)}>Zurück</button>
        <h1 className="form-head__title">{isNew ? 'Neues Teil' : 'Teil bearbeiten'}</h1>
      </header>

      <form className="item-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="field">
          <legend className="field__label">Foto (optional)</legend>
          <PhotoPicker currentPath={form.photoPath} change={photo} onChange={setPhoto} />
        </fieldset>

        <label className="field">
          <span className="field__label">Name</span>
          <input id="item-name" className="input" value={form.name} maxLength={80}
            placeholder="z. B. Hoodie Navy" onChange={(e) => set('name', e.target.value)} />
        </label>

        <fieldset className="field">
          <legend className="field__label">Kategorie</legend>
          <div className="chips chips--wrap">
            {CATEGORIES.map((c) => (
              <Chip key={c} selected={form.category === c} onClick={() => set('category', c)}>{CATEGORY_LABELS[c]}</Chip>
            ))}
          </div>
        </fieldset>

        {form.category === 'accessory' && (
          <>
            <fieldset className="field">
              <legend className="field__label">Art</legend>
              <div className="chips chips--wrap">
                {ACCESSORY_TYPES.map((t) => (
                  <Chip key={t} selected={form.accessoryType === t} onClick={() => set('accessoryType', t)}>
                    {ACCESSORY_LABELS[t]}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <label className="switch-row">
              <span>
                <strong>Trage ich meistens</strong>
                <small className="muted">Gehört zu deinem Standard-Set und ist in Vorschlägen meist dabei.</small>
              </span>
              <input id="item-core" type="checkbox" className="switch" checked={form.isCore}
                onChange={(e) => set('isCore', e.target.checked)} />
            </label>
          </>
        )}

        <fieldset className="field">
          <legend className="field__label">Hauptfarbe</legend>
          <ColorPicker label="Hauptfarbe" value={form.colorPrimary} onChange={(c) => c && set('colorPrimary', c)} />
        </fieldset>

        {/* Zweitfarbe ist selten nötig – eingeklappt, bis man sie braucht */}
        {form.colorSecondary === null && !showSecondary ? (
          <button type="button" className="btn btn--ghost" onClick={() => setShowSecondary(true)}>+ Zweitfarbe hinzufügen</button>
        ) : (
          <fieldset className="field">
            <legend className="field__label">Zweitfarbe (optional)</legend>
            <ColorPicker label="Zweitfarbe" allowNone value={form.colorSecondary} onChange={(c) => set('colorSecondary', c)} />
          </fieldset>
        )}

        {/* Wärmegrad nur bei Kleidung – bei Schmuck spielt er keine Rolle */}
        {form.category !== 'accessory' && (
          <fieldset className="field">
            <legend className="field__label">Wärmegrad</legend>
            <div className="chips chips--wrap">
              {WARMTHS.map((w) => (
                <Chip key={w} selected={form.warmth === w} onClick={() => set('warmth', w)}>{WARMTH_LABELS[w]}</Chip>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="field">
          <legend className="field__label">Anlass (mehrere möglich)</legend>
          <div className="chips chips--wrap">
            {OCCASIONS.map((o) => (
              <Chip key={o} selected={form.occasions.includes(o)} onClick={() => toggleOccasion(o)}>
                {OCCASION_LABELS[o]}
              </Chip>
            ))}
          </div>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={save.isPending}>
            {save.isPending ? 'Speichert …' : 'Speichern'}
          </button>

          {!isNew && !confirmArchive && (
            <button type="button" className="btn btn--danger" onClick={() => setConfirmArchive(true)}>Archivieren</button>
          )}
          {!isNew && confirmArchive && (
            <div className="confirm" role="alert">
              <p>Teil archivieren? Es verschwindet aus dem Schrank, bleibt aber im Verlauf und lässt sich im Profil wiederherstellen.</p>
              <div className="confirm__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmArchive(false)}>Abbrechen</button>
                <button type="button" className="btn btn--danger" onClick={handleArchive} disabled={archive.isPending}>
                  Ja, archivieren
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </main>
  )
}
