/** Settings for the pixel art post-processing effect. */
export interface PixelArtEffectSettings {
  enabled: boolean
  /** Source pixels per block (2-32) */
  pixelSize: number
  /** Posterization levels per channel: 0 = disabled, 2-32 = color reduction */
  colorLevels: number
  /** 1px dark edge outlines between color blocks */
  outline: boolean
}

export interface PixelArtEffectPreset {
  label: string
  settings: Omit<PixelArtEffectSettings, 'enabled'>
}

export const PIXEL_ART_EFFECT_PRESETS: PixelArtEffectPreset[] = [
  { label: 'Subtle', settings: { pixelSize: 4, colorLevels: 0, outline: false } },
  { label: 'Classic 8-bit', settings: { pixelSize: 8, colorLevels: 8, outline: true } },
  { label: 'Retro 16-bit', settings: { pixelSize: 6, colorLevels: 16, outline: false } },
  { label: 'Chunky', settings: { pixelSize: 16, colorLevels: 4, outline: true } },
  { label: 'Mosaic', settings: { pixelSize: 24, colorLevels: 0, outline: false } },
]
