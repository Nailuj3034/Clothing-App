import { Fabric } from './Fabric'
import type { GarmentProps } from './types'

/** Unterteil: Hüfte + zwei Hosenbeine. */
export function Bottom({ color }: GarmentProps) {
  return (
    <group>
      <mesh position={[0, 0.94, 0]} scale={[1, 1, 0.75]}>
        <capsuleGeometry args={[0.165, 0.08, 8, 24]} />
        <Fabric color={color} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.09, 0.52, 0]}>
          <capsuleGeometry args={[0.082, 0.6, 6, 16]} />
          <Fabric color={color} />
        </mesh>
      ))}
    </group>
  )
}
