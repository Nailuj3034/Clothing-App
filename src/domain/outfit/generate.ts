import { daysBetween } from '../date'
import { OCCASION_LABELS, TEMP_BAND_LABELS, type Item, type WornOutfit } from '../types'
import { pickAccessories } from './accessories'
import { OUTFIT_CONFIG } from './config'
import { usableItems, type ItemsBySlot } from './filters'
import { RULES } from './rules'
import { clothesOf, type CandidateOutfit, type RuleContext } from './rules/types'
import type { OutfitContext } from './types'

/** Ein fertig bewerteter Vorschlag. */
export interface OutfitSuggestion extends CandidateOutfit {
  accessories: Item[]
  score: number
  /** Begründungssätze für „warum dieses Outfit“ */
  reasons: string[]
  /** Eindeutiger Schlüssel der Kleidungs-Kombination (sortierte IDs, ohne Schmuck) */
  key: string
}

export type GenerateResult =
  | { ok: true; ranked: OutfitSuggestion[] }
  | { ok: false; reason: string }

/**
 * Anzahl unterschiedlicher Schmuck-Varianten pro Durchlauf.
 * Die Schmuckwahl hängt nicht von der Kleidung ab – deshalb werden nur wenige Varianten berechnet
 * und reihum verteilt, statt für jede der (teils zehntausenden) Kombinationen neu zu rechnen.
 */
export const JEWELRY_VARIANTS = 6

const REQUIRED_SLOTS = [
  { slot: 'top', label: 'Oberteile' },
  { slot: 'bottom', label: 'Unterteile' },
  { slot: 'shoes', label: 'Schuhe' },
] as const

/**
 * Erzeugt alle gültigen Outfits, bewertet sie und gibt sie sortiert zurück.
 *
 * Ablauf: harte Filter → Kandidaten (alle Kombinationen) → kürzlich getragene Kombis ausschließen
 *         → mit allen Regeln bewerten → nach Punkten sortieren.
 * Danach bekommt jeder Vorschlag seinen Schmuck (eigener Schritt, damit die Kombinationen nicht explodieren).
 * Reine Funktion: Datum steckt in ctx.today, Zufall kommt über rng.
 */
export function generate(items: Item[], history: WornOutfit[], ctx: OutfitContext, rng: () => number): GenerateResult {
  const usable = usableItems(items, ctx)

  const missing = findMissing(items, usable, ctx)
  if (missing) return { ok: false, reason: missing }

  const candidates = buildCandidates(usable, ctx)
  const recentKeys = recentComboKeys(items, history, ctx.today)
  const fresh = candidates.filter((c) => !recentKeys.has(comboKey(c)))
  if (fresh.length === 0) {
    return {
      ok: false,
      reason: `Alle passenden Kombinationen hast du in den letzten ${OUTFIT_CONFIG.excludeSameComboDays} Tagen getragen.`,
    }
  }

  const ruleCtx: RuleContext = { ...ctx, history }
  const ranked = fresh
    .map((c) => score(c, ruleCtx))
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))

  const variants = Array.from({ length: JEWELRY_VARIANTS }, () => pickAccessories(usable.accessory, ruleCtx, rng))
  const withJewelry = ranked.map((s, i) => {
    const jewelry = variants[i % JEWELRY_VARIANTS]
    return { ...s, accessories: jewelry.items, reasons: [...s.reasons, ...jewelry.reasons] }
  })

  return { ok: true, ranked: withJewelry }
}

/**
 * Eine Seite mit Vorschlägen für „Neuer Vorschlag“:
 * Seite 0 = Plätze 1–3, Seite 1 = 4–6 usw. Danach zufällige Auswahl aus dem oberen Drittel.
 */
export function pageSuggestions(ranked: OutfitSuggestion[], page: number, rng: () => number): OutfitSuggestion[] {
  const perPage = OUTFIT_CONFIG.suggestionsPerPage
  const start = page * perPage
  if (start < ranked.length) return ranked.slice(start, start + perPage)

  const pool = ranked.slice(0, Math.max(perPage, Math.ceil(ranked.length / 3)))
  return shuffle(pool, rng).slice(0, perPage)
}

// ---------- Hilfsfunktionen ----------

/** Prüft, ob Pflicht-Teile fehlen, und erklärt warum (Anlass oder Temperatur). */
function findMissing(items: Item[], usable: ItemsBySlot, ctx: OutfitContext): string | null {
  const occasion = OCCASION_LABELS[ctx.occasion]
  const band = TEMP_BAND_LABELS[ctx.tempBand]

  for (const { slot, label } of REQUIRED_SLOTS) {
    if (usable[slot].length > 0) continue
    const forOccasion = items.some((i) =>
      i.category === slot && i.available && !i.archivedAt && i.occasions.includes(ctx.occasion))
    return forOccasion
      ? `Keine verfügbaren ${label}, die zu „${band}“ passen.`
      : `Keine verfügbaren ${label} für den Anlass „${occasion}“.`
  }

  if (OUTFIT_CONFIG.bands[ctx.tempBand].jacket === 'required' && usable.jacket.length === 0) {
    return `Bei „${band}“ gehört eine Jacke dazu, aber keine passende ist verfügbar.`
  }
  return null
}

/** Alle Kombinationen aus Oberteil × Unterteil × Schuhe (× Jacke, je nach Temperatur). */
function buildCandidates(u: ItemsBySlot, ctx: OutfitContext): CandidateOutfit[] {
  const rule = OUTFIT_CONFIG.bands[ctx.tempBand].jacket
  const jackets: (Item | null)[] =
    rule === 'required' ? u.jacket : rule === 'optional' ? [null, ...u.jacket] : [null]

  const result: CandidateOutfit[] = []
  for (const top of u.top)
    for (const bottom of u.bottom)
      for (const shoes of u.shoes)
        for (const jacket of jackets) result.push({ top, bottom, shoes, jacket })
  return result
}

function comboKey(c: CandidateOutfit): string {
  return keyOf(clothesOf(c).map((i) => i.id))
}

function keyOf(ids: string[]): string {
  return [...ids].sort().join('|')
}

/** Schlüssel der Kleidungs-Kombinationen, die in den letzten N Tagen getragen wurden (Schmuck zählt nicht). */
function recentComboKeys(items: Item[], history: WornOutfit[], today: string): Set<string> {
  const category = new Map(items.map((i) => [i.id, i.category]))
  return new Set(
    history
      .filter((w) => daysBetween(w.wornOn, today) < OUTFIT_CONFIG.excludeSameComboDays)
      .map((w) => keyOf(w.itemIds.filter((id) => category.has(id) && category.get(id) !== 'accessory'))),
  )
}

/** Wendet alle Regeln an und sammelt Punkte und Begründungen. */
function score(c: CandidateOutfit, ctx: RuleContext): OutfitSuggestion {
  const results = RULES.map((rule) => rule(c, ctx))
  return {
    ...c,
    accessories: [],
    score: results.reduce((sum, r) => sum + r.points, 0),
    reasons: results.flatMap((r) => (r.reason ? [r.reason] : [])),
    key: comboKey(c),
  }
}

/** Fisher-Yates-Mischen mit übergebenem Zufall (deterministisch testbar). */
function shuffle<T>(list: T[], rng: () => number): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
