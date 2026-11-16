import type { Item, WornOutfit } from '../../types'
import type { OutfitContext } from '../types'

/** Ein mögliches Outfit (Kleidung, ohne Schmuck), das bewertet wird. */
export interface CandidateOutfit {
  top: Item
  bottom: Item
  shoes: Item
  jacket: Item | null
}

/** Kontext für Regeln: Auswahl + bisher getragene Outfits. */
export interface RuleContext extends OutfitContext {
  history: WornOutfit[]
}

/** Ergebnis einer Regel: Punkte (auch negativ) und optional ein Satz für die Begründung. */
export interface RuleResult {
  points: number
  reason?: string
}

/**
 * Eine Bewertungsregel ist eine reine Funktion.
 * Neue Kriterien (z. B. später „persönliche Vorlieben“ aus Bewertungen) = neue Datei + Eintrag in RULES.
 */
export type Rule = (outfit: CandidateOutfit, ctx: RuleContext) => RuleResult

/** Die Kleidungsstücke eines Outfits als Liste (Jacke nur, wenn vorhanden). */
export function clothesOf(o: CandidateOutfit): Item[] {
  return o.jacket ? [o.top, o.bottom, o.shoes, o.jacket] : [o.top, o.bottom, o.shoes]
}
