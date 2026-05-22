/**
 * Virtual Camera System — Perlin noise shake, DOF blur, and advanced camera presets.
 *
 * Provides:
 * - Simplex-inspired 2D Perlin noise for organic camera shake
 * - getCameraShake() for per-frame shake displacement with decay
 * - getDOFBlur() for depth-of-field blur amount per layer
 * - Camera preset factories (Dolly Zoom, Shake, Whip Pan, Breathing)
 */

import type { CameraKeyframe } from '@/stores/useCameraStore'

// ── Perlin Noise (Simplex-inspired 2D) ───────────────────────────────
// Compact implementation using hash-based gradient noise (~50 lines).
// Produces smooth, continuous noise suitable for camera shake.

const PERM_SIZE = 256
const permutation: number[] = []
const gradients2D: [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
]

// Initialize permutation table with a fixed seed for deterministic output
function initPerm(seed: number): void {
  if (permutation.length === PERM_SIZE * 2) return
  permutation.length = 0

  // Fisher-Yates shuffle with seeded PRNG
  const p: number[] = []
  for (let i = 0; i < PERM_SIZE; i++) p[i] = i

  let s = seed
  const nextRand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }

  for (let i = PERM_SIZE - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }

  // Double the permutation for wrapping
  for (let i = 0; i < PERM_SIZE * 2; i++) {
    permutation[i] = p[i % PERM_SIZE]
  }
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10) // Improved Perlin fade
}

function dot2(gx: number, gy: number, dx: number, dy: number): number {
  return gx * dx + gy * dy
}

/**
 * 2D Perlin noise at (x, y). Returns value in [-1, 1].
 */
export function perlinNoise2D(x: number, y: number, seed: number = 42): number {
  initPerm(seed)

  const xi = Math.floor(x) & (PERM_SIZE - 1)
  const yi = Math.floor(y) & (PERM_SIZE - 1)
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)

  const u = fade(xf)
  const v = fade(yf)

  // Hash corner coordinates
  const aa = permutation[permutation[xi] + yi] % 8
  const ab = permutation[permutation[xi] + yi + 1] % 8
  const ba = permutation[permutation[xi + 1] + yi] % 8
  const bb = permutation[permutation[xi + 1] + yi + 1] % 8

  const [g00x, g00y] = gradients2D[aa]
  const [g01x, g01y] = gradients2D[ab]
  const [g10x, g10y] = gradients2D[ba]
  const [g11x, g11y] = gradients2D[bb]

  const n00 = dot2(g00x, g00y, xf, yf)
  const n10 = dot2(g10x, g10y, xf - 1, yf)
  const n01 = dot2(g01x, g01y, xf, yf - 1)
  const n11 = dot2(g11x, g11y, xf - 1, yf - 1)

  // Bilinear interpolation with fade
  const nx0 = n00 + u * (n10 - n00)
  const nx1 = n01 + u * (n11 - n01)
  return nx0 + v * (nx1 - nx0)
}

// ── Camera Shake ─────────────────────────────────────────────────────

export interface ShakeResult {
  /** Horizontal displacement in pixels (relative to canvas width) */
  dx: number
  /** Vertical displacement in pixels (relative to canvas height) */
  dy: number
  /** Rotational displacement in degrees */
  rotation: number
}

/**
 * Compute camera shake displacement for a given frame.
 *
 * @param frame - Current frame number
 * @param intensity - Shake intensity (0-1, default 0.5). Controls amplitude.
 * @param frequency - Noise frequency (default 0.1). Higher = faster shake.
 * @param decay - Exponential decay rate (0-1, default 0). 0 = no decay, 1 = instant decay.
 *                Decay is relative to totalFrames if provided, otherwise no decay.
 * @param seed - Noise seed for deterministic shake (default 42)
 * @param totalFrames - Total duration in frames (used for decay calculation)
 * @returns ShakeResult with dx, dy (as percentage -5 to 5), and rotation in degrees
 */
export function getCameraShake(
  frame: number,
  intensity: number = 0.5,
  frequency: number = 0.1,
  decay: number = 0,
  seed: number = 42,
  totalFrames?: number,
): ShakeResult {
  if (intensity <= 0) return { dx: 0, dy: 0, rotation: 0 }

  // Calculate decay multiplier
  let decayMult = 1
  if (decay > 0 && totalFrames && totalFrames > 0) {
    const progress = frame / totalFrames
    decayMult = Math.exp(-decay * 5 * progress) // 5x multiplier so decay=1 fully decays
  }

  const t = frame * frequency
  const amplitude = intensity * decayMult

  // Use different noise offsets for x, y, and rotation
  const dx = perlinNoise2D(t, 0, seed) * amplitude * 5
  const dy = perlinNoise2D(0, t, seed + 100) * amplitude * 5
  const rotation = perlinNoise2D(t * 0.7, t * 0.3, seed + 200) * amplitude * 2

  return { dx, dy, rotation }
}

// ── Depth of Field ───────────────────────────────────────────────────

/**
 * Calculate DOF blur amount for a layer at a given depth.
 *
 * Uses a simplified circle-of-confusion model where blur increases
 * with distance from the focus plane.
 *
 * @param layerDepth - Depth/z-index of the layer (0 = front, higher = further)
 * @param focusDepth - Depth of the focus plane
 * @param aperture - Aperture size (0-1). 0 = everything sharp, 1 = maximum blur
 * @returns Blur amount in pixels (for CSS filter: blur(Npx))
 */
export function getDOFBlur(
  layerDepth: number,
  focusDepth: number,
  aperture: number,
): number {
  if (aperture <= 0) return 0

  const distance = Math.abs(layerDepth - focusDepth)
  // Blur scales with aperture and distance from focus plane
  // Max blur of 12px at aperture=1 and distance=10
  return distance * aperture * 1.2
}

// ── Camera Presets ───────────────────────────────────────────────────

export interface CameraPresetConfig {
  id: string
  name: string
  description: string
  category: 'movement' | 'shake' | 'cinematic'
  buildKeyframes: (totalFrames: number) => CameraKeyframe[]
  /** Optional shake parameters applied alongside keyframes */
  shake?: {
    intensity: number
    frequency: number
    decay: number
  }
}

/**
 * Advanced camera presets that complement the basic presets in useCameraStore.
 * These provide more cinematic movements and effects.
 */
export const ADVANCED_CAMERA_PRESETS: CameraPresetConfig[] = [
  {
    id: 'dolly-zoom',
    name: 'Dolly Zoom',
    description: 'Zoom in while pulling back — vertigo effect',
    category: 'cinematic',
    buildKeyframes: (totalFrames) => {
      // Dolly zoom: zoom in while compensating with pan to create
      // the classic Hitchcock vertigo effect
      const mid = Math.floor(totalFrames * 0.5)
      return [
        { frame: 0, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'ease-in' },
        { frame: mid, zoom: 1.6, panX: 0, panY: -8, rotation: 0, easing: 'ease-out' },
        { frame: totalFrames - 1, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'linear' },
      ]
    },
  },
  {
    id: 'camera-shake',
    name: 'Shake',
    description: 'Handheld camera shake with decay',
    category: 'shake',
    buildKeyframes: (totalFrames) => {
      // Shake preset uses minimal keyframes — the actual shake comes from
      // the perlin noise system, not keyframes
      return [
        { frame: 0, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'linear' },
        { frame: totalFrames - 1, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'linear' },
      ]
    },
    shake: {
      intensity: 0.4,
      frequency: 0.15,
      decay: 0.3,
    },
  },
  {
    id: 'whip-pan',
    name: 'Whip Pan',
    description: 'Fast horizontal sweep with motion blur feel',
    category: 'cinematic',
    buildKeyframes: (totalFrames) => {
      const rampUp = Math.floor(totalFrames * 0.3)
      const whipStart = Math.floor(totalFrames * 0.4)
      const whipEnd = Math.floor(totalFrames * 0.55)
      const settle = Math.floor(totalFrames * 0.7)
      return [
        { frame: 0, zoom: 1.1, panX: -20, panY: 0, rotation: 0, easing: 'ease-in' },
        { frame: rampUp, zoom: 1.1, panX: -15, panY: 0, rotation: -1, easing: 'ease-in' },
        { frame: whipStart, zoom: 1.05, panX: -5, panY: 0, rotation: 0, easing: 'linear' },
        { frame: whipEnd, zoom: 1.05, panX: 15, panY: 0, rotation: 0, easing: 'ease-out' },
        { frame: settle, zoom: 1.1, panX: 20, panY: 0, rotation: 1, easing: 'ease-in-out' },
        { frame: totalFrames - 1, zoom: 1.1, panX: 20, panY: 0, rotation: 0, easing: 'linear' },
      ]
    },
  },
  {
    id: 'breathing',
    name: 'Breathing',
    description: 'Subtle rhythmic zoom oscillation',
    category: 'movement',
    buildKeyframes: (totalFrames) => {
      // Create a gentle breathing rhythm: zoom in and out slowly
      const cycleLength = Math.max(30, Math.floor(totalFrames / 3))
      const keyframes: CameraKeyframe[] = []
      let frame = 0
      let cycle = 0

      while (frame < totalFrames) {
        // Inhale (zoom in slightly)
        keyframes.push({
          frame,
          zoom: 1,
          panX: 0,
          panY: cycle % 2 === 0 ? -0.5 : 0.5,
          rotation: 0,
          easing: 'ease-in-out',
        })

        const half = Math.min(frame + Math.floor(cycleLength / 2), totalFrames - 1)
        if (half > frame) {
          // Exhale (zoom out)
          keyframes.push({
            frame: half,
            zoom: 1.06,
            panX: 0,
            panY: cycle % 2 === 0 ? 0.5 : -0.5,
            rotation: 0,
            easing: 'ease-in-out',
          })
        }

        frame += cycleLength
        cycle++
      }

      // Ensure we end at the last frame
      if (keyframes.length > 0 && keyframes[keyframes.length - 1].frame !== totalFrames - 1) {
        keyframes.push({
          frame: totalFrames - 1,
          zoom: 1,
          panX: 0,
          panY: 0,
          rotation: 0,
          easing: 'linear',
        })
      }

      return keyframes
    },
  },
  {
    id: 'dramatic-orbit',
    name: 'Dramatic Orbit',
    description: 'Slow rotation with zoom for cinematic emphasis',
    category: 'cinematic',
    buildKeyframes: (totalFrames) => {
      const q1 = Math.floor(totalFrames * 0.25)
      const q2 = Math.floor(totalFrames * 0.5)
      const q3 = Math.floor(totalFrames * 0.75)
      return [
        { frame: 0, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'ease-in-out' },
        { frame: q1, zoom: 1.15, panX: 5, panY: -3, rotation: 2, easing: 'ease-in-out' },
        { frame: q2, zoom: 1.25, panX: 0, panY: -5, rotation: 0, easing: 'ease-in-out' },
        { frame: q3, zoom: 1.15, panX: -5, panY: -3, rotation: -2, easing: 'ease-in-out' },
        { frame: totalFrames - 1, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'linear' },
      ]
    },
  },
  {
    id: 'rack-focus',
    name: 'Rack Focus',
    description: 'Quick zoom shift to change focal point',
    category: 'cinematic',
    buildKeyframes: (totalFrames) => {
      const holdStart = Math.floor(totalFrames * 0.35)
      const shiftMid = Math.floor(totalFrames * 0.45)
      const shiftEnd = Math.floor(totalFrames * 0.55)
      return [
        { frame: 0, zoom: 1.2, panX: -10, panY: 0, rotation: 0, easing: 'ease-in-out' },
        { frame: holdStart, zoom: 1.2, panX: -10, panY: 0, rotation: 0, easing: 'ease-in' },
        { frame: shiftMid, zoom: 1.05, panX: 0, panY: 0, rotation: 0, easing: 'ease-out' },
        { frame: shiftEnd, zoom: 1.2, panX: 10, panY: 0, rotation: 0, easing: 'ease-in-out' },
        { frame: totalFrames - 1, zoom: 1.2, panX: 10, panY: 0, rotation: 0, easing: 'linear' },
      ]
    },
  },
]
