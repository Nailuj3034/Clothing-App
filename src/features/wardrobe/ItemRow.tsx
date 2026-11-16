import { Link } from 'react-router-dom'
import type { Item } from '../../domain/types'
import { ACCESSORY_LABELS, CATEGORY_LABELS, OCCASION_LABELS, WARMTH_LABELS } from '../../domain/types'
import { ItemThumb } from './ItemThumb'

/** Eine Zeile in der Schrank-Liste. Antippen öffnet das Formular zum Bearbeiten. */
export function ItemRow({ item, action }: { item: Item; action?: React.ReactNode }) {
  const kind = item.accessoryType ? ACCESSORY_LABELS[item.accessoryType] : CATEGORY_LABELS[item.category]
  const occasions = item.occasions.map((o) => OCCASION_LABELS[o]).join(', ')
  // Wärmegrad nur bei Kleidung anzeigen (bei Schmuck irrelevant)
  const meta = item.category === 'accessory' ? [kind, occasions] : [kind, WARMTH_LABELS[item.warmth].toLowerCase(), occasions]
  return (
    <li className={`item-row${item.available ? '' : ' item-row--off'}`}>
      <Link to={`/teil/${item.id}`} className="item-row__main">
        <ItemThumb item={item} />
        <div className="item-row__text">
          <div className="item-row__name">{item.name}</div>
          <div className="item-row__meta">{meta.join(' · ')}</div>
        </div>
      </Link>
      {action}
    </li>
  )
}
