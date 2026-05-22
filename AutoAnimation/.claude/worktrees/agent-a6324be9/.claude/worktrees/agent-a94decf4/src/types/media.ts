export interface MixedMediaPreset {
  id: string
  name: string
  category: MixedMediaCategory
  description: string
  overlayUrl?: string
  blendMode: string
  opacity: number
  filters: Record<string, number>
  animation?: { type: string; speed: number; amplitude: number }
}

export type MixedMediaCategory =
  | 'film-grain'
  | 'light-leak'
  | 'bokeh'
  | 'texture'
  | 'gradient'
  | 'vintage'
  | 'glitch'
  | 'organic'
  | 'abstract'

export interface SoulHexPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  mood: string
  harmony: 'complementary' | 'analogous' | 'triadic' | 'split-complementary'
}

export interface StyleProfile {
  colorPalette: string[]
  contrast: number
  saturation: number
  brightness: number
  grain: number
  vignetting: number
  warmth: number
  mood: string
}

export interface MotionDesignPlan {
  keyframes: Array<{
    time: number
    properties: Record<string, number | string>
    easing: string
  }>
  duration: number
  fps: number
}
