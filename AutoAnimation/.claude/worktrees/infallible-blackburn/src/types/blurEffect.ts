export type BlurType = 'gaussian' | 'motion' | 'tilt-shift'

export interface BlurConfig {
  type: BlurType
  amount: number        // pixels, 0 = off
  angle?: number        // degrees, for motion blur
  focusY?: number       // 0-1, for tilt-shift
  focusBand?: number    // 0-1, for tilt-shift
}
