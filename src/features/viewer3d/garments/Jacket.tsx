import { Fabric } from './Fabric'
import type { GarmentProps } from './types'

/** Jacke: weiter als das Oberteil, lange Ärmel, vorne offen (ein Streifen vom Oberteil bleibt sichtbar). */
export function Jacket({ color }: GarmentProps) {
  return (
    <group>
      {[-1, 1].map((side) => (
        // zwei Hälften, die vorne einen Spalt lassen
        <mesh key={`half${side}`} position={[side * 0.1, 1.2, 0]} scale={[0.72, 1, 0.74]}>
          <capsuleGeometry args={[0.19, 0.24, 8, 24]} />
          <Fabric color={color} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`arm${side}`} position={[side * 0.245, 1.12, 0]} rotation={[0, 0, side * 0.12]}>
          <capsuleGeometry args={[0.074, 0.52, 6, 16]} />
          <Fabric color={color} />
        </mesh>
      ))}
    </group>
  )
}
