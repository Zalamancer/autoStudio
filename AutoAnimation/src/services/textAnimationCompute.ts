/**
 * Thin wrapper around textAnimationPresets.computeTextAnimation that lazy-loads
 * the 1300-line preset array on first call.  Canvas components import this instead
 * of the full preset file so the preset data is kept out of the main chunk.
 */
import type { TextAnimationStyle } from './textAnimationPresets'

export type { TextAnimationStyle }

let _compute:
  | ((
      presetId: string,
      currentFrame: number,
      startFrame: number,
      endFrame: number,
      fps: number,
    ) => TextAnimationStyle | undefined)
  | null = null

let _loading: Promise<void> | null = null

function ensureLoaded(): void {
  if (_compute) return
  if (!_loading) {
    _loading = import('./textAnimationPresets').then((m) => {
      _compute = m.computeTextAnimation
    })
  }
}

/**
 * Compute text animation styles for a given frame.
 * Returns `undefined` until the preset module has finished lazy-loading
 * (typically resolves within a single frame).
 */
export function computeTextAnimation(
  presetId: string,
  currentFrame: number,
  startFrame: number,
  endFrame: number,
  fps: number,
): TextAnimationStyle | undefined {
  ensureLoaded()
  if (!_compute) return undefined // not loaded yet — invisible for 1 frame
  return _compute(presetId, currentFrame, startFrame, endFrame, fps)
}
