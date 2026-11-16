import { Fabric } from './Fabric'
import type { GarmentProps } from './types'

/** Schuhe: flache, längliche Formen unter den Beinen. */
export function Shoes({ color }: GarmentProps) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.09, 0.055, 0.045]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.7]}>
          <capsuleGeometry args={[0.058, 0.15, 6, 16]} />
          <Fabric color={color} />
        </mesh>
      ))}
    </group>
  )
}
