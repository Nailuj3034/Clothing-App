import { getColor } from '../../domain/palette'
import type { Item } from '../../domain/types'
import { GARMENT_REGISTRY } from './garments/registry'
import { Jewelry } from './garments/Jewelry'
import { EMPTY_FABRIC, type GarmentSlot } from './garments/types'

/** Was die Figur trägt. Fehlende Slots bleiben leer bzw. neutral. */
export interface MannequinOutfit {
  top: Item | null
  bottom: Item | null
  shoes: Item | null
  jacket: Item | null
  accessories: Item[]
}

const SKIN = '#d9d2ca'

function Body() {
  const skin = <meshStandardMaterial color={SKIN} roughness={0.6} />
  return (
    <group>
      <mesh position={[0, 1.67, 0]}><sphereGeometry args={[0.11, 32, 24]} />{skin}</mesh>
      <mesh position={[0, 1.53, 0]}><cylinderGeometry args={[0.045, 0.05, 0.12, 16]} />{skin}</mesh>
      <mesh position={[0, 1.2, 0]} scale={[1, 1, 0.65]}><capsuleGeometry args={[0.16, 0.22, 8, 24]} />{skin}</mesh>
      <mesh position={[0, 0.95, 0]} scale={[1, 1, 0.72]}><capsuleGeometry args={[0.15, 0.08, 8, 24]} />{skin}</mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Arm + Hand */}
          <mesh position={[side * 0.24, 1.08, 0]} rotation={[0, 0, side * 0.12]}><capsuleGeometry args={[0.05, 0.5, 6, 16]} />{skin}</mesh>
          <mesh position={[side * 0.29, 0.77, 0]}><sphereGeometry args={[0.05, 16, 12]} />{skin}</mesh>
          {/* Bein */}
          <mesh position={[side * 0.09, 0.52, 0]}><capsuleGeometry args={[0.068, 0.62, 6, 16]} />{skin}</mesh>
        </group>
      ))}
    </group>
  )
}

/** Stilisierte Figur; jede Kleidungs-Komponente kommt aus dem Register. */
export function Mannequin({ outfit }: { outfit: MannequinOutfit }) {
  const slots: GarmentSlot[] = ['bottom', 'shoes', 'top', 'jacket']
  return (
    <group>
      <Body />
      {slots.map((slot) => {
        const item = outfit[slot]
        if (slot === 'jacket' && !item) return null // ohne Jacke keine Jacke zeichnen
        const Garment = GARMENT_REGISTRY[slot]
        return <Garment key={slot} item={item} color={item ? getColor(item.colorPrimary).hex : EMPTY_FABRIC} />
      })}
      <Jewelry items={outfit.accessories} />
      {/* Bodenscheibe */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 48]} />
        <meshStandardMaterial color="#8f8a86" transparent opacity={0.25} />
      </mesh>
    </group>
  )
}
