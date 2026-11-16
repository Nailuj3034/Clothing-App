import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toLocalDateString } from '../../domain/date'
import type { OutfitSuggestion } from '../../domain/outfit/generate'
import type { OutfitContext } from '../../domain/outfit/types'
import type { Occasion, TempBand } from '../../domain/types'
import { useItems } from '../wardrobe/useItems'
import { HistoryList } from './HistoryList'
import { OccasionPicker } from './OccasionPicker'
import { SuggestionCard } from './SuggestionCard'
import { TempBandPicker } from './TempBandPicker'
import { useSelectedOutfit } from './selectedOutfitStore'
import { useRecentOutfits, useSaveWorn } from './useOutfits'
import { useSuggestions } from './useSuggestions'
import './outfit.css'

const STORAGE_KEY = 'outfit-context'

/** Letzte Auswahl aus dem Browser lesen (darf fehlen oder blockiert sein). */
function loadChoice(): { tempBand: TempBand; occasion: Occasion } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved?.tempBand && saved?.occasion) return saved
  } catch { /* ignorieren */ }
  return { tempBand: 'cool', occasion: 'uni' }
}

function saveChoice(choice: { tempBand: TempBand; occasion: Occasion }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(choice)) } catch { /* ignorieren */ }
}

/** Outfit-Tab: Temperatur + Anlass wählen, Vorschläge ansehen, als getragen speichern. */
export function OutfitPage() {
  const navigate = useNavigate()
  const today = toLocalDateString(new Date())
  const [choice, setChoice] = useState(loadChoice)
  const ctx: OutfitContext = useMemo(() => ({ ...choice, today }), [choice, today])

  const items = useItems()
  const history = useRecentOutfits(today)
  const { result, suggestions, next, reset } = useSuggestions(items.data, history.data, ctx)
  const saveWorn = useSaveWorn()
  const [, select] = useSelectedOutfit()
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [view, setView] = useState<'suggest' | 'history'>('suggest')

  function update(patch: Partial<typeof choice>) {
    const nextChoice = { ...choice, ...patch }
    setChoice(nextChoice)
    saveChoice(nextChoice)
    reset()
    setSavedMsg(null)
  }

  async function wear(s: OutfitSuggestion) {
    setSavedMsg(null)
    await saveWorn.mutateAsync({
      wornOn: today,
      tempBand: ctx.tempBand,
      occasion: ctx.occasion,
      items: [
        { itemId: s.top.id, slot: 'top' },
        { itemId: s.bottom.id, slot: 'bottom' },
        { itemId: s.shoes.id, slot: 'shoes' },
        ...(s.jacket ? [{ itemId: s.jacket.id, slot: 'jacket' as const }] : []),
        ...s.accessories.map((a) => ({ itemId: a.id, slot: 'accessory' as const })),
      ],
    })
    reset()
    setSavedMsg('Gespeichert. Viel Spaß heute!')
  }

  function show3d(s: OutfitSuggestion) {
    select(s)
    navigate('/3d')
  }

  const loading = items.isLoading || history.isLoading
  const loadError = items.error ?? history.error

  return (
    <main className="page">
      <h1 className="page-title">Outfit</h1>

      <div className="segmented" role="tablist" aria-label="Ansicht">
        <button type="button" role="tab" aria-selected={view === 'suggest'}
          className={view === 'suggest' ? 'is-on' : ''} onClick={() => setView('suggest')}>Vorschläge</button>
        <button type="button" role="tab" aria-selected={view === 'history'}
          className={view === 'history' ? 'is-on' : ''} onClick={() => setView('history')}>Verlauf</button>
      </div>

      {view === 'history' ? <HistoryList /> : (<>
      <section className="stack" aria-label="Auswahl">
        <TempBandPicker value={choice.tempBand} onChange={(tempBand) => update({ tempBand })} />
        <OccasionPicker value={choice.occasion} onChange={(occasion) => update({ occasion })} />
      </section>

      {savedMsg && <p className="success" role="status">{savedMsg}</p>}
      {saveWorn.isError && <p className="error" role="alert">{(saveWorn.error as Error).message}</p>}
      {loading && <p className="muted">Lädt …</p>}
      {loadError && <p className="error" role="alert">{(loadError as Error).message}</p>}

      {result && !result.ok && (
        <div className="no-outfit">
          <p><strong>Gerade kein Outfit möglich.</strong></p>
          <p>{result.reason}</p>
        </div>
      )}

      {suggestions.map((s, i) => (
        <SuggestionCard key={`${s.key}-${i}`} suggestion={s} rank={i + 1}
          onWear={() => wear(s)} onShow3d={() => show3d(s)} saving={saveWorn.isPending} />
      ))}

      {result?.ok && (
        <button type="button" className="btn btn--ghost" onClick={next}>Neue Vorschläge</button>
      )}
      </>)}
    </main>
  )
}
