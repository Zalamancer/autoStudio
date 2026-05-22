/**
 * Cinema Camera type definitions — professional camera body, lens, and optical settings.
 */

export interface CameraBody {
  id: string
  name: string
  brand: string
  sensorWidth: number // mm
  sensorHeight: number
  maxResolution: { width: number; height: number }
  dynamicRange: number // stops
  nativeISO: number
  colorScience: 'warm' | 'neutral' | 'cool'
  grainProfile: { intensity: number; size: number; color: boolean }
}

export interface LensProfile {
  id: string
  name: string
  brand: string
  focalLength: number // mm (or range for zooms)
  maxAperture: number // f-number
  minAperture: number
  bokehBlades: number
  bokehShape: 'circle' | 'hexagon' | 'octagon'
  chromaticAberration: number // 0-1
  vignetting: number // 0-1
  distortion: number // barrel (-1) to pincushion (+1)
  flareCharacter: 'minimal' | 'warm' | 'anamorphic' | 'vintage'
  anamorphic: boolean
  anamorphicSqueeze: number // 1.0, 1.33, 2.0
}

export interface OpticalSettings {
  cameraBodyId: string
  lensProfileId: string
  aperture: number
  focalLength: number
  iso: number
  shutterAngle: number // 0-360
  whiteBalance: number // Kelvin
  focusDistance: number // meters
  dofEnabled: boolean
  bokehEnabled: boolean
  vignettingEnabled: boolean
  chromaticAberrationEnabled: boolean
  lensFlareEnabled: boolean
  filmGrainEnabled: boolean
  anamorphicEnabled: boolean
}

export interface GenreMotionPreset {
  id: string
  name: string
  genre: string
  description: string
  keyframes: CinemaKeyframe[]
  opticalOverrides: Partial<OpticalSettings>
}

export interface CinemaKeyframe {
  framePercent: number // 0-100
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  zoom: number
  focusDistance?: number
  aperture?: number
  easing: string
}

export type CinemaPresetCategory = 'establishing' | 'dialogue' | 'action' | 'emotion' | 'transition' | 'genre'

export interface CinemaPreset {
  id: string
  name: string
  category: CinemaPresetCategory
  description: string
  opticalSettings: Partial<OpticalSettings>
  keyframes: CinemaKeyframe[]
}

export interface ShotGridEntry {
  id: string
  presetId: string
  label: string
  thumbnailColor: string
}
