import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { toLocalDateString } from '../../domain/date'
import type { OutfitContext } from '../../domain/outfit/types'
import { loadChoice } from '../outfit/outfitChoice'
import { useSelectedOutfit } from '../outfit/selectedOutfitStore'
import { useRecentOutfits } from '../outfit/useOutfits'
import { useSuggestions } from '../outfit/useSuggestions'
import { useItems } from '../wardrobe/useItems'
import { Mannequin, type MannequinOutfit } from './Mannequin'
import './viewer.css'

const EMPTY: MannequinOutfit = { top: null, bottom: null, shoes: null, jacket: null, accessories: [] }

/**
 * 3D-Tab: zeigt das in „In 3D ansehen“ gewählte Outfit,
 * sonst den ersten aktuellen Vorschlag, sonst eine neutrale Figur.
 * Diese Seite wird erst geladen, wenn man den Tab öffnet (eigener JS-Chunk mit three.js).
 */
export default function ViewerPage() {
  const [selected] = useSelectedOutfit()
  const today = toLocalDateString(new Date())
  const ctx: OutfitContext = useMemo(() => ({ ...loadChoice(), today }), [today])
  const items = useItems()
  const history = useRecentOutfits(today)
  const { suggestions } = useSuggestions(items.data, history.data, ctx)

  const outfit = selected ?? suggestions[0] ?? null
  const shown: MannequinOutfit = outfit ?? EMPTY
  const names = outfit
    ? [outfit.top, outfit.bottom, outfit.shoes, outfit.jacket, ...outfit.accessories].filter(Boolean).map((i) => i!.name)
    : []

  return (
    <main className="page page--viewer">
      <h1 className="page-title">3D</h1>
      <div className="viewer">
        <Canvas dpr={[1, 2]} frameloop="demand" camera={{ position: [0, 1.15, 2.6], fov: 40 }} gl={{ antialias: true }}>
          <hemisphereLight args={['#ffffff', '#8c8580', 1.4]} />
          <directionalLight position={[2, 3, 2]} intensity={1.6} />
          <directionalLight position={[-2, 1.5, -1.5]} intensity={0.5} />
          <Mannequin outfit={shown} />
          <OrbitControls target={[0, 0.95, 0]} enablePan={false} minDistance={1.3} maxDistance={4}
            minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.62} />
        </Canvas>
      </div>
      <p className="muted viewer__hint">Mit einem Finger drehen, mit zwei Fingern zoomen.</p>
      {outfit
        ? <p className="viewer__names">{names.join(' · ')}</p>
        : <p className="muted">Noch kein Outfit. Lege Teile an oder wähle im Outfit-Tab „In 3D ansehen“.</p>}
    </main>
  )
}
