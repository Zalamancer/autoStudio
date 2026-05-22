import { useFrame, useComposition } from '@/engine'

interface MotionFrameResult {
  frame: number
  fps: number
  durationInFrames: number
  progress: number
  /** Returns a 0..1 progress value for a sub-range within the total duration */
  range: (startFrame: number, endFrame: number) => number
  /** Returns staggered 0..1 progress for an item in a list */
  stagger: (index: number, total: number, overlap?: number) => number
}

export function useMotionFrame(): MotionFrameResult {
  const frame = useFrame()
  const { fps, durationInFrames } = useComposition()
  const progress = durationInFrames > 0 ? frame / durationInFrames : 0

  const range = (startFrame: number, endFrame: number): number => {
    if (frame < startFrame) return 0
    if (frame >= endFrame) return 1
    return (frame - startFrame) / (endFrame - startFrame)
  }

  const stagger = (index: number, total: number, overlap = 0.3): number => {
    if (total <= 0) return 0
    const slotDuration = 1 / (total * (1 - overlap) + overlap)
    const slotStart = index * slotDuration * (1 - overlap)
    const slotEnd = slotStart + slotDuration
    return Math.max(0, Math.min(1, (progress - slotStart) / (slotEnd - slotStart)))
  }

  return { frame, fps, durationInFrames, progress, range, stagger }
}
