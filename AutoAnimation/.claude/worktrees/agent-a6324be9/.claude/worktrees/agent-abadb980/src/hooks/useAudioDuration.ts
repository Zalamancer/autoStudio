/**
 * useAudioDuration — Hook that decodes an audio File and returns its duration.
 *
 * Uses AudioContext.decodeAudioData() for accurate duration.
 * Caches results by file reference.
 */

import { useState, useEffect, useRef } from 'react'

interface AudioDurationResult {
  duration: number
  isLoading: boolean
  error: string | null
}

const durationCache = new WeakMap<File, number>()

export function useAudioDuration(file: File | null): AudioDurationResult {
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(false)

  useEffect(() => {
    if (!file) {
      setDuration(0)
      setIsLoading(false)
      setError(null)
      return
    }

    // Check cache
    const cached = durationCache.get(file)
    if (cached !== undefined) {
      setDuration(cached)
      setIsLoading(false)
      setError(null)
      return
    }

    abortRef.current = false
    setIsLoading(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer
        const ctx = new AudioContext()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        await ctx.close()

        if (!abortRef.current) {
          const dur = audioBuffer.duration
          durationCache.set(file, dur)
          setDuration(dur)
          setIsLoading(false)
        }
      } catch (err) {
        if (!abortRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to decode audio')
          setIsLoading(false)
        }
      }
    }
    reader.onerror = () => {
      if (!abortRef.current) {
        setError('Failed to read file')
        setIsLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)

    return () => {
      abortRef.current = true
    }
  }, [file])

  return { duration, isLoading, error }
}
