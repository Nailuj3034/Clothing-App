import type { ComponentType } from 'react'
import type { Item } from '../../../domain/types'

/** Props jeder Kleidungs-Komponente in 3D. `color` = Hex der Hauptfarbe (oder neutral, wenn item fehlt). */
export interface GarmentProps {
  item: Item | null
  color: string
}

export type GarmentSlot = 'top' | 'bottom' | 'shoes' | 'jacket'
export type GarmentComponent = ComponentType<GarmentProps>

/** Neutrale „Stoff“-Farbe für leere Slots */
export const EMPTY_FABRIC = '#b9b2aa'
