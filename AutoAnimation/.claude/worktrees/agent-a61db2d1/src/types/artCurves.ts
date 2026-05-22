export type ArtCurveStyle = 'swirl'

export interface ArtCurve {
  id: string
  /** Control points [x, y, z] in 0-800 / 0-600 space */
  points: [number, number, number][]
  widthStart: number
  widthMid: number
  widthEnd: number
  /** Head color (gradient start) */
  color: string
  /** Tail color (gradient end) — smooth gradient along the body */
  colorEnd: string
  opacity: number
  /** Neon glow effect */
  glow: boolean
}

export interface ArtCurveComposition {
  id: string
  name: string
  curves: ArtCurve[]
  palette: string[]
  animated: boolean
  seed: number
  style: ArtCurveStyle
  complexity: number
  /** Global width overrides applied when generating */
  globalWidthStart: number
  globalWidthMid: number
  globalWidthEnd: number
  /** Background color behind the curves */
  bgColor: string
  /** Whether the background is transparent (alpha) */
  bgTransparent: boolean
  position: { x: number; y: number }
  scale: number
  opacity: number
  rotation: number
  zIndex: number
  visible: boolean
  startFrame: number
  endFrame: number
}
