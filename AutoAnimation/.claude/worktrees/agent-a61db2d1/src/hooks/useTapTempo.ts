/**
 * useTapTempo — Hook for tap-tempo BPM entry.
 *
 * Records timestamps of taps, computes average interval, converts to BPM.
 * Resets after 2 seconds of inactivity.
 */

import { useState, useRef, useCallback } from 'react'

interface TapTempoResult {
  bpm: number | null
  tapCount: number
  tap: () => void
  reset: () => void
}

export function useTapTempo(): TapTempoResult {
  const [bpm, setBpm] = useState<number | null>(null)
  const [tapCount, setTapCount] = useState(0)
  const tapsRef = useRef<number[]>([])
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    tapsRef.current = []
    setTapCount(0)
    setBpm(null)
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }, [])

  const tap = useCallback(() => {
    const now = performance.now()

    // Reset inactivity timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }
    resetTimerRef.current = setTimeout(() => {
      reset()
    }, 2000)

    tapsRef.current.push(now)
    setTapCount(tapsRef.current.length)

    // Need at least 2 taps to compute BPM
    if (tapsRef.current.length >= 2) {
      const taps = tapsRef.current
      const intervals: number[] = []
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1])
      }

      // Average interval in milliseconds
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      // Convert to BPM: 60000ms / avgInterval
      const computedBpm = Math.round(60000 / avgInterval)
      // Clamp to reasonable range
      setBpm(Math.max(30, Math.min(300, computedBpm)))
    }
  }, [reset])

  return { bpm, tapCount, tap, reset }
}
