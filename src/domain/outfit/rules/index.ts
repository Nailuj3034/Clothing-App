import { colorHarmony } from './colorHarmony'
import { recentlyWorn } from './recentlyWorn'
import { warmthFit } from './warmthFit'
import type { Rule } from './types'

/** Alle aktiven Bewertungsregeln. Neue Regeln werden einfach hier angehängt. */
export const RULES: Rule[] = [colorHarmony, warmthFit, recentlyWorn]
