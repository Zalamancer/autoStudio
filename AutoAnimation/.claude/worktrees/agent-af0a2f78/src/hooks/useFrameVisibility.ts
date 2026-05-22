import { useEffect, type RefObject } from 'react'
import { useTimelineStore } from '@/stores'

/**
 * Zero-re-render frame-range visibility toggle.
 *
 * Uses a requestAnimationFrame loop to check the current frame against
 * [startFrame, endFrame) and toggles `display: none` on the referenced
 * DOM element. This avoids React re-renders entirely — the component
 * stays mounted and only its CSS display property changes.
 *
 * Pattern inspired by AudioLayer's RAF-based sync loop.
 */
export function useFrameVisibility(
  ref: RefObject<HTMLElement | null>,
  startFrame: number,
  endFrame: number
) {
  useEffect(() => {
    let rafId: number
    let wasVisible = true // assume visible initially

    const check = () => {
      const frame = useTimelineStore.getState().currentFrame
      const visible = frame >= startFrame && frame < endFrame
      if (visible !== wasVisible && ref.current) {
        ref.current.style.display = visible ? '' : 'none'
        wasVisible = visible
      }
      rafId = requestAnimationFrame(check)
    }

    rafId = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafId)
  }, [ref, startFrame, endFrame])
}
