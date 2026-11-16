import { getColor } from '../../../domain/palette'
import type { Item } from '../../../domain/types'

/** Metallisches Material für Schmuck. */
function Metal({ color }: { color: string }) {
  return <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
}

/**
 * Schmuck als einfache Formen:
 * Kette = Ring um den Hals, Armband = Ring am rechten Handgelenk,
 * Uhr = Ring + Scheibe am linken Handgelenk, Ringe = kleine Ringe an der rechten Hand.
 */
export function Jewelry({ items }: { items: Item[] }) {
  const necklaces = items.filter((i) => i.accessoryType === 'necklace')
  const bracelets = items.filter((i) => i.accessoryType === 'bracelet')
  const watch = items.find((i) => i.accessoryType === 'watch')
  const rings = items.filter((i) => i.accessoryType === 'ring')
  const hex = (i: Item) => getColor(i.colorPrimary).hex

  return (
    <group>
      {necklaces.map((n, idx) => (
        // mehrere Ketten hängen unterschiedlich tief (Layering)
        <mesh key={n.id} position={[0, 1.42 - idx * 0.04, 0.035 + idx * 0.012]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
          <torusGeometry args={[0.13 + idx * 0.02, 0.008, 8, 48]} />
          <Metal color={hex(n)} />
        </mesh>
      ))}
      {bracelets.map((b, idx) => (
        <mesh key={b.id} position={[0.285, 0.81 + idx * 0.025, 0]} rotation={[Math.PI / 2, 0, 0.12]}>
          <torusGeometry args={[0.055, 0.009, 8, 28]} />
          <Metal color={hex(b)} />
        </mesh>
      ))}
      {watch && (
        <group position={[-0.285, 0.81, 0]} rotation={[0, 0, -0.12]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.055, 0.011, 8, 28]} />
            <Metal color={hex(watch)} />
          </mesh>
          <mesh position={[0, 0, 0.062]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.014, 24]} />
            <Metal color={hex(watch)} />
          </mesh>
        </group>
      )}
      {rings.map((r, idx) => (
        <mesh key={r.id} position={[0.275 + idx * 0.014, 0.728, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.014, 0.005, 6, 16]} />
          <Metal color={hex(r)} />
        </mesh>
      ))}
    </group>
  )
}
