/** Settings for the hand-drawn "boiling line" sketch effect. */
export interface BoilingLineSettings {
  enabled: boolean
  /** Displacement strength 1-10 */
  intensity: number
  /** Turbulence detail level */
  detail: 'low' | 'medium' | 'high'
  /** Frames to hold each seed pattern before cycling (1-4) */
  frameHold: number
  /** Edge-specific roughening via feMorphology (erode/dilate) */
  roughenEdges?: boolean
  /** Stroke width variation 0-10 (SVG objects only) */
  strokeJitter?: number
}

export interface BoilingLinePreset {
  label: string
  settings: Omit<BoilingLineSettings, 'enabled'>
}

export const BOILING_LINE_PRESETS: BoilingLinePreset[] = [
  { label: 'Subtle Sketch', settings: { intensity: 2, detail: 'medium', frameHold: 2, roughenEdges: false, strokeJitter: 0 } },
  { label: 'Classic Boiling', settings: { intensity: 4, detail: 'medium', frameHold: 2, roughenEdges: false, strokeJitter: 0 } },
  { label: 'Rough Sketch', settings: { intensity: 7, detail: 'low', frameHold: 1, roughenEdges: true, strokeJitter: 5 } },
  { label: 'Gentle Wobble', settings: { intensity: 3, detail: 'low', frameHold: 3, roughenEdges: false, strokeJitter: 0 } },
]
