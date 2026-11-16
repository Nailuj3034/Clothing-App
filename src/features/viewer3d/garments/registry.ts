import { Bottom } from './Bottom'
import { Jacket } from './Jacket'
import { Shoes } from './Shoes'
import { Top } from './Top'
import type { GarmentComponent, GarmentSlot } from './types'

/**
 * Welche 3D-Komponente zeichnet welchen Slot?
 * Später (GLB-Modelle): einzelne Einträge hier durch eine Komponente mit `useGLTF` ersetzen –
 * Mannequin und ViewerPage bleiben unverändert.
 */
export const GARMENT_REGISTRY: Record<GarmentSlot, GarmentComponent> = {
  top: Top,
  bottom: Bottom,
  shoes: Shoes,
  jacket: Jacket,
}
