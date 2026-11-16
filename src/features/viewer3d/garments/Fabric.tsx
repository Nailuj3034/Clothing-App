/** Einheitliches, mattes Stoff-Material für alle Kleidungsteile. */
export function Fabric({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
}
