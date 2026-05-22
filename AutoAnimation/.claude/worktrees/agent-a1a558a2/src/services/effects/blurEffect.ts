import type { BlurType } from '@/types/blurEffect'

/** Gaussian blur -- uses native ctx.filter (GPU-accelerated) */
export function applyGaussianBlur(ctx: CanvasRenderingContext2D, blurPx: number): void {
  ctx.filter = `blur(${blurPx}px)`
}

/** Motion blur -- renders element multiple times at angular offsets with decreasing opacity */
export function applyMotionBlur(
  sourceCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  blurPx: number,
  angleDeg: number,
  samples: number = 8,
): void {
  const radians = (angleDeg * Math.PI) / 180
  const dx = Math.cos(radians) * blurPx
  const dy = Math.sin(radians) * blurPx

  for (let i = 0; i < samples; i++) {
    const t = (i / (samples - 1)) - 0.5 // -0.5 to +0.5
    const alpha = 1 / samples
    targetCtx.globalAlpha = alpha
    targetCtx.drawImage(
      sourceCanvas,
      t * dx, t * dy,
    )
  }
  targetCtx.globalAlpha = 1
}

/** Tilt-shift -- sharp center band, blurred top and bottom */
export function applyTiltShift(
  sourceCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  blurPx: number,
  focusY: number,      // 0-1, center of sharp band
  focusBand: number,   // 0-1, height of sharp band
): void {
  // Draw blurred version first (full canvas)
  targetCtx.filter = `blur(${blurPx}px)`
  targetCtx.drawImage(sourceCanvas, 0, 0)
  targetCtx.filter = 'none'

  // Clip and draw sharp center band
  const h = sourceCanvas.height
  const bandTop = h * (focusY - focusBand / 2)
  const bandHeight = h * focusBand

  targetCtx.save()
  targetCtx.beginPath()
  targetCtx.rect(0, bandTop, sourceCanvas.width, bandHeight)
  targetCtx.clip()
  targetCtx.drawImage(sourceCanvas, 0, 0)
  targetCtx.restore()
}

export interface BlurPreset {
  label: string
  type: BlurType
  blur: number
  angle?: number
  focusY?: number
  focusBand?: number
}

export const BLUR_PRESETS: BlurPreset[] = [
  { label: 'Soft Focus', type: 'gaussian', blur: 3 },
  { label: 'Heavy Blur', type: 'gaussian', blur: 12 },
  { label: 'Speed Blur', type: 'motion', blur: 15, angle: 0 },
  { label: 'Diagonal Motion', type: 'motion', blur: 10, angle: 45 },
  { label: 'Tilt-Shift', type: 'tilt-shift', blur: 8, focusY: 0.5, focusBand: 0.3 },
  { label: 'Top Blur', type: 'tilt-shift', blur: 6, focusY: 0.7, focusBand: 0.4 },
]
