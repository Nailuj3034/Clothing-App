import { useState } from 'react'
import { toLocalDateString } from '../../domain/date'
import { OCCASION_LABELS, TEMP_BAND_LABELS, type Category, type Item, type WornOutfit } from '../../domain/types'
import { ItemThumb } from '../wardrobe/ItemThumb'
import { useAllItems } from '../wardrobe/useItems'
import { useAllOutfits, useRemoveWorn, useSaveWorn } from './useOutfits'

const dateFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
/** 'YYYY-MM-DD' → „Mo., 16.11.2026“ (Mittag, damit keine Zeitzone den Tag verschiebt) */
const formatDay = (d: string) => dateFormat.format(new Date(`${d}T12:00:00`))

/** Verlauf aller getragenen Outfits mit „Nochmal tragen“ und Löschen. */
export function HistoryList() {
  const outfits = useAllOutfits()
  const items = useAllItems()
  const byId = new Map((items.data ?? []).map((i) => [i.id, i]))

  if (outfits.isLoading || items.isLoading) return <p className="muted">Lädt …</p>
  const error = outfits.error ?? items.error
  if (error) return <p className="error" role="alert">{(error as Error).message}</p>
  if (!outfits.data?.length) {
    return (
      <div className="empty">
        <p><strong>Noch nichts getragen.</strong></p>
        <p className="muted">Tippe bei einem Vorschlag auf „Heute getragen“, dann erscheint er hier.</p>
      </div>
    )
  }

  return (
    <ul className="history">
      {outfits.data.map((o) => (
        <HistoryEntry key={o.id} outfit={o}
          items={o.itemIds.map((id) => byId.get(id)).filter((i): i is Item => !!i)} />
      ))}
    </ul>
  )
}

function HistoryEntry({ outfit, items }: { outfit: WornOutfit; items: Item[] }) {
  const [confirm, setConfirm] = useState<'wear' | 'delete' | null>(null)
  const [done, setDone] = useState(false)
  const saveWorn = useSaveWorn()
  const removeWorn = useRemoveWorn()

  const clothes = items.filter((i) => i.category !== 'accessory')
  const jewelry = items.filter((i) => i.category === 'accessory')
  const problems = items.filter((i) => !i.available || i.archivedAt)

  async function wearAgain() {
    await saveWorn.mutateAsync({
      wornOn: toLocalDateString(new Date()),
      tempBand: outfit.tempBand,
      occasion: outfit.occasion,
      items: items.map((i) => ({ itemId: i.id, slot: i.category as Category })),
    })
    setConfirm(null)
    setDone(true)
  }

  return (
    <li className="history__entry">
      <header className="history__head">
        <strong>{formatDay(outfit.wornOn)}</strong>
        <span className="muted">{TEMP_BAND_LABELS[outfit.tempBand]} · {OCCASION_LABELS[outfit.occasion]}</span>
      </header>

      <div className="history__thumbs">
        {clothes.map((i) => (
          <figure key={i.id} className="suggestion__item">
            <ItemThumb item={i} size={56} />
            <figcaption>{i.archivedAt ? `${i.name} (archiviert)` : i.name}</figcaption>
          </figure>
        ))}
      </div>
      {jewelry.length > 0 && (
        <p className="suggestion__jewelry"><strong>Schmuck:</strong> {jewelry.map((j) => j.name).join(', ')}</p>
      )}

      {done && <p className="success" role="status">Für heute gespeichert.</p>}
      {(saveWorn.isError || removeWorn.isError) && (
        <p className="error" role="alert">{((saveWorn.error ?? removeWorn.error) as Error).message}</p>
      )}

      {confirm === null && (
        <div className="suggestion__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirm('delete')}>Löschen</button>
          <button type="button" className="btn btn--primary" disabled={saveWorn.isPending}
            onClick={() => (problems.length ? setConfirm('wear') : wearAgain())}>
            Nochmal tragen
          </button>
        </div>
      )}

      {confirm === 'wear' && (
        <div className="confirm" role="alert">
          <p>
            {problems.map((p) => p.name).join(', ')} {problems.length === 1 ? 'ist' : 'sind'} gerade nicht
            verfügbar oder archiviert. Trotzdem für heute speichern?
          </p>
          <div className="confirm__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>Abbrechen</button>
            <button type="button" className="btn btn--primary" onClick={wearAgain} disabled={saveWorn.isPending}>Trotzdem</button>
          </div>
        </div>
      )}

      {confirm === 'delete' && (
        <div className="confirm" role="alert">
          <p>Diesen Eintrag aus dem Verlauf löschen? Die Teile bleiben im Schrank.</p>
          <div className="confirm__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>Abbrechen</button>
            <button type="button" className="btn btn--danger" disabled={removeWorn.isPending}
              onClick={() => removeWorn.mutate(outfit.id)}>Ja, löschen</button>
          </div>
        </div>
      )}
    </li>
  )
}
