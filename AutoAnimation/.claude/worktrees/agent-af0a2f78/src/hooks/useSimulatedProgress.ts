import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Simulated progress bar that:
 *  - Starts fast (0 → 60% in ~2s)
 *  - Slows down (60 → 85% over ~4s)
 *  - Creeps slowly (85 → 95% over ~8s)
 *  - Holds at 95% until `complete()` is called
 *  - On complete: snaps to 100% then fades after a short delay
 *
 * Use this for operations where real progress isn't available or is too sparse.
 */
export interface SimulatedProgress {
  /** Current simulated progress 0-100 */
  value: number
  /** Whether the bar is actively running (including the "done" phase) */
  isActive: boolean
  /** Whether the operation completed (briefly true for the done animation) */
  isDone: boolean
  /** Start the simulated progress animation */
  start: () => void
  /** Signal that the real operation finished — plays done animation */
  complete: () => void
  /** Reset / cancel everything */
  reset: () => void
}

export function useSimulatedProgress(): SimulatedProgress {
  const [value, setValue] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef(0)
  const generationRef = useRef(0)

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    generationRef.current++
    setValue(0)
    setIsActive(false)
    setIsDone(false)
  }, [stop])

  const start = useCallback(() => {
    reset()
    const gen = ++generationRef.current
    setIsActive(true)
    setIsDone(false)
    startTimeRef.current = performance.now()

    const tick = () => {
      if (generationRef.current !== gen) return

      const elapsed = (performance.now() - startTimeRef.current) / 1000 // seconds

      // Eased curve: fast start, slow finish
      // Phase 1: 0-60% in first 2s (fast)
      // Phase 2: 60-85% from 2-6s (medium)
      // Phase 3: 85-95% from 6-14s (slow crawl)
      let simulated: number
      if (elapsed < 2) {
        // Fast phase: 0 → 60%
        simulated = (elapsed / 2) * 60
      } else if (elapsed < 6) {
        // Medium phase: 60 → 85%
        simulated = 60 + ((elapsed - 2) / 4) * 25
      } else {
        // Slow crawl: 85 → 95% (asymptotic)
        const extra = 1 - Math.exp(-(elapsed - 6) / 8)
        simulated = 85 + extra * 10
      }

      setValue(Math.min(simulated, 95))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [reset])

  const complete = useCallback(() => {
    stop()
    const gen = generationRef.current
    setValue(100)
    setIsDone(true)

    // After a brief "done" display, deactivate
    setTimeout(() => {
      if (generationRef.current !== gen) return
      setIsActive(false)
      setIsDone(false)
      setValue(0)
    }, 800)
  }, [stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { value, isActive, isDone, start, complete, reset }
}
