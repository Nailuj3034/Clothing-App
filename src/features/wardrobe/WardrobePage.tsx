import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../../domain/types'
import { Chip } from '../../ui/Chip'
import { ItemRow } from './ItemRow'
import { AvailabilityToggle } from './AvailabilityToggle'
import { useItems, useToggleAvailability } from './useItems'
import './wardrobe.css'

/** Startseite: Kleiderschrank mit Kategorie-Filter und +-Button. */
export function WardrobePage() {
  const { data: items = [], isLoading, error } = useItems()
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const toggle = useToggleAvailability()

  const visible = filter === 'all' ? items : items.filter((i) => i.category === filter)
  const count = (c: Category) => items.filter((i) => i.category === c).length

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page-title">Kleider&shy;schrank</h1>
      </header>

      <div className="chips" role="group" aria-label="Nach Kategorie filtern">
        <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>Alle · {items.length}</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={filter === c} onClick={() => setFilter(c)}>
            {CATEGORY_LABELS[c]} · {count(c)}
          </Chip>
        ))}
      </div>

      {toggle.isError && (
        <p className="error" role="alert">Änderung nicht gespeichert – bist du offline? Versuch es gleich nochmal.</p>
      )}
      {isLoading && <p className="muted">Lädt …</p>}
      {error && <p className="error" role="alert">{(error as Error).message}</p>}
      {!isLoading && !error && items.length === 0 && (
        <div className="empty">
          <p><strong>Dein Schrank ist noch leer.</strong></p>
          <p className="muted">Tippe unten rechts auf +, um dein erstes Teil anzulegen.</p>
        </div>
      )}

      <ul className="item-list">
        {visible.map((item) => (
          <ItemRow key={item.id} item={item} action={
            <AvailabilityToggle item={item} onToggle={(available) => toggle.mutate({ id: item.id, available })} />
          } />
        ))}
      </ul>

      <Link to="/teil/neu" className="fab" aria-label="Teil hinzufügen">+</Link>
    </main>
  )
}
