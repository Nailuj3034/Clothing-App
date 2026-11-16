import { Fabric } from './Fabric'
import type { GarmentProps } from './types'

/** Oberteil: Rumpf etwas weiter als der Körper + kurze Ärmel. */
export function Top({ color }: GarmentProps) {
  return (
    <group>
      <mesh position={[0, 1.2, 0]} scale={[1, 1, 0.68]}>
        <capsuleGeometry args={[0.175, 0.22, 8, 24]} />
        <Fabric color={color} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.226, 1.29, 0]} rotation={[0, 0, side * 0.12]}>
          <capsuleGeometry args={[0.06, 0.12, 6, 16]} />
          <Fabric color={color} />
        </mesh>
      ))}
    </group>
  )
}
