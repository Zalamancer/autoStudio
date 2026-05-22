/**
 * Core cinema camera service — DOF calculation, optical settings application,
 * genre keyframe generation, and lens distortion.
 */

import type { OpticalSettings, LensProfile, CinemaKeyframe } from '@/types/cinemaCamera'
import { getCameraBody } from '@/data/cameraBodies'
import { getLensProfile } from '@/data/lensProfiles'
import { GENRE_MOTION_PRESETS } from '@/data/genreMotionPresets'

// ── Depth of Field ──────────────────────────────────────────────────

export interface DOFResult {
  /** Near focus limit in meters */
  nearLimit: number
  /** Far focus limit in meters */
  farLimit: number
  /** Total depth of field in meters */
  totalDOF: number
  /** Circle of confusion in mm */
  circleOfConfusion: number
  /** Blur radius for background (0-1 normalized) */
  backgroundBlur: number
}

/**
 * Calculate depth of field based on optical settings.
 * Uses the thin lens approximation.
 */
export function calculateDOF(settings: OpticalSettings): DOFResult {
  const body = getCameraBody(settings.cameraBodyId)
  const sensorDiag = body
    ? Math.sqrt(body.sensorWidth ** 2 + body.sensorHeight ** 2)
    : 43.27 // Full frame default

  // Circle of confusion (standard: sensor diagonal / 1500)
  const coc = sensorDiag / 1500

  const f = settings.focalLength
  const N = settings.aperture
  const s = Math.max(settings.focusDistance * 1000, f + 1) // mm, avoid singularity

  // Hyperfocal distance in mm
  const H = (f * f) / (N * coc) + f

  // Near and far limits
  const nearMM = (s * (H - f)) / (H + s - 2 * f)
  const farMM = s >= H ? Infinity : (s * (H - f)) / (H - s)

  const nearLimit = Math.max(0.01, nearMM / 1000)
  const farLimit = farMM === Infinity ? Infinity : farMM / 1000

  const totalDOF = farLimit === Infinity ? Infinity : farLimit - nearLimit

  // Background blur approximation (0-1)
  const backgroundBlur = Math.min(1, (f * f) / (N * s * 0.05))

  return {
    nearLimit,
    farLimit,
    totalDOF,
    circleOfConfusion: coc,
    backgroundBlur,
  }
}

// ── Optical Settings Application ────────────────────────────────────

/**
 * Apply optical settings to a 2D canvas context (vignette, CA, grain simulation).
 * This is a lightweight preview — full effects use the effect cache system.
 */
export function applyOpticalSettings(
  ctx: CanvasRenderingContext2D,
  settings: OpticalSettings,
): void {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const lens = getLensProfile(settings.lensProfileId)

  // Vignetting
  if (settings.vignettingEnabled && lens) {
    const vAmount = lens.vignetting
    const cx = w / 2
    const cy = h / 2
    const r = Math.sqrt(cx * cx + cy * cy)
    const grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${vAmount})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  // Film grain (lightweight preview)
  if (settings.filmGrainEnabled) {
    const body = getCameraBody(settings.cameraBodyId)
    const intensity = body?.grainProfile.intensity ?? 0.08
    const imageData = ctx.getImageData(0, 0, w, h)
    const d = imageData.data
    const isoMultiplier = Math.max(1, settings.iso / 800)
    const grainStrength = intensity * isoMultiplier * 255

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      const noise = (Math.random() - 0.5) * grainStrength
      d[i] = Math.max(0, Math.min(255, d[i] + noise))
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise))
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise))
    }
    ctx.putImageData(imageData, 0, 0)
  }
}

// ── Genre Keyframe Generation ───────────────────────────────────────

/**
 * Generate camera keyframes for a genre preset over a given duration.
 * Converts framePercent values to absolute frame numbers.
 */
export function generateGenreKeyframes(
  genre: string,
  _totalFrames: number,
): CinemaKeyframe[] {
  const preset = GENRE_MOTION_PRESETS.find((p) => p.genre === genre)
  if (!preset) return []

  return preset.keyframes.map((kf) => ({
    framePercent: kf.framePercent,
    position: { ...kf.position },
    rotation: { ...kf.rotation },
    zoom: kf.zoom,
    focusDistance: kf.focusDistance,
    aperture: kf.aperture,
    easing: kf.easing,
  }))
}

// ── Lens Distortion ─────────────────────────────────────────────────

export interface LensDistortionResult {
  /** Barrel/pincushion distortion coefficient */
  distortion: number
  /** Chromatic aberration red/blue shift in pixels */
  chromaticShift: number
  /** Vignetting falloff amount */
  vignettingAmount: number
  /** Whether anamorphic squeeze is active */
  isAnamorphic: boolean
  /** Anamorphic squeeze ratio */
  squeeze: number
}

/**
 * Get lens distortion parameters from a lens profile.
 */
export function getLensDistortion(lens: LensProfile): LensDistortionResult {
  return {
    distortion: lens.distortion,
    chromaticShift: lens.chromaticAberration * 10, // Scale to pixel offset
    vignettingAmount: lens.vignetting,
    isAnamorphic: lens.anamorphic,
    squeeze: lens.anamorphicSqueeze,
  }
}
