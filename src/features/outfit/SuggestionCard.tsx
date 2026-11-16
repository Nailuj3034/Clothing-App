import type { OutfitSuggestion } from '../../domain/outfit/generate'
import { clothesOf } from '../../domain/outfit/rules/types'
import { ItemThumb } from '../wardrobe/ItemThumb'

/** Ein Outfit-Vorschlag: Vorschaubilder, Punkte, Begründung und Aktionen. */
export function SuggestionCard({ suggestion, rank, onWear, onShow3d, saving }: {
  suggestion: OutfitSuggestion
  rank: number
  onWear: () => void
  onShow3d: () => void
  saving: boolean
}) {
  const clothes = clothesOf(suggestion)
  return (
    <article className="suggestion">
      <header className="suggestion__head">
        <h2 className="suggestion__title">Vorschlag {rank}</h2>
        <span className="suggestion__score">{suggestion.score} Pkt.</span>
      </header>

      <div className="suggestion__thumbs">
        {clothes.map((item) => (
          <figure key={item.id} className="suggestion__item">
            <ItemThumb item={item} size={72} />
            <figcaption>{item.name}</figcaption>
          </figure>
        ))}
      </div>

      {suggestion.accessories.length > 0 && (
        <p className="suggestion__jewelry">
          <strong>Schmuck:</strong> {suggestion.accessories.map((a) => a.name).join(', ')}
        </p>
      )}

      <ul className="suggestion__why">
        {suggestion.reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>

      <div className="suggestion__actions">
        <button type="button" className="btn btn--ghost" onClick={onShow3d}>In 3D ansehen</button>
        <button type="button" className="btn btn--primary" onClick={onWear} disabled={saving}>Heute getragen</button>
      </div>
    </article>
  )
}
