import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Item } from '../../domain/types'
import { CATEGORY_LABELS } from '../../domain/types'
import { ItemThumb } from '../wardrobe/ItemThumb'
import { useArchivedItems, useDeleteForever, useRestoreItem } from '../wardrobe/useItems'

/** Archiv: archivierte Teile wiederherstellen oder endgültig löschen. */
export function ArchivePage() {
  const navigate = useNavigate()
  const { data: items = [], isLoading, error } = useArchivedItems()

  return (
    <main className="page">
      <header className="form-head">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => navigate('/profil')}>Zurück</button>
        <h1 className="form-head__title">Archiv</h1>
      </header>
      {isLoading && <p className="muted">Lädt …</p>}
      {error && <p className="error" role="alert">{(error as Error).message}</p>}
      {!isLoading && items.length === 0 && <p className="muted">Keine archivierten Teile.</p>}
      <ul className="item-list">
        {items.map((item) => <ArchivedRow key={item.id} item={item} />)}
      </ul>
    </main>
  )
}

function ArchivedRow({ item }: { item: Item }) {
  const [confirm, setConfirm] = useState(false)
  const restore = useRestoreItem()
  const del = useDeleteForever()

  return (
    <li className="archived">
      <div className="archived__main">
        <ItemThumb item={item} />
        <div>
          <div className="item-row__name">{item.name}</div>
          <div className="item-row__meta">{CATEGORY_LABELS[item.category]}</div>
        </div>
      </div>
      {(restore.isError || del.isError) && (
        <p className="error" role="alert">{((restore.error ?? del.error) as Error).message}</p>
      )}
      {!confirm ? (
        <div className="confirm__actions">
          <button type="button" className="btn btn--danger" onClick={() => setConfirm(true)}>Endgültig löschen</button>
          <button type="button" className="btn btn--primary" disabled={restore.isPending}
            onClick={() => restore.mutate(item.id)}>Wiederherstellen</button>
        </div>
      ) : (
        <div className="confirm" role="alert">
          <p>„{item.name}“ endgültig löschen? Das Foto wird gelöscht und das Teil verschwindet auch aus dem Verlauf. Das lässt sich nicht rückgängig machen.</p>
          <div className="confirm__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(false)}>Abbrechen</button>
            <button type="button" className="btn btn--danger" disabled={del.isPending}
              onClick={() => del.mutate(item)}>Ja, löschen</button>
          </div>
        </div>
      )}
    </li>
  )
}
