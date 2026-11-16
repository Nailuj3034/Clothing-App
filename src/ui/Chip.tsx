import type { ReactNode } from 'react'

/** Auswahl-Chip (Filter, Mehrfachauswahl). `selected` steuert die Optik und aria-pressed. */
export function Chip({ selected, onClick, children }:
  { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip${selected ? ' chip--on' : ''}`} aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  )
}
