/**
 * useAudioReactivePlayback — Hook for real-time audio analysis during playback.
 *
 * Creates and manages a Web Audio AnalyserNode during live playback.
 * Connects to the active audio source (music track blob URL).
 * On each animation frame, reads frequency data and feeds it to the engine.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { getAudioReactiveEngine } from '@/services/audioReactiveEngine'

interface AudioReactivePlaybackResult {
  /** Whether the analyser is connected to an audio source */
  isConnected: boolean
  /** Current frequency spectrum data (for visualization) */
  spectrum: Uint8Array | null
  /** Connect to an audio source URL */
  connect: (audioUrl: string) => void
  /** Disconnect from the current audio source */
  disconnect: () => void
}

export function useAudioReactivePlayback(): AudioReactivePlaybackResult {
  const [isConnected, setIsConnected] = useState(false)
  const [spectrum, setSpectrum] = useState<Uint8Array | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number>(0)
  const frequencyDataRef = useRef<Uint8Array | null>(null)

  const updateLoop = useCallback(() => {
    const analyser = analyserRef.current
    const ctx = audioContextRef.current
    if (!analyser || !ctx) return

    if (!frequencyDataRef.current) {
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount)
    }

    const data = frequencyDataRef.current
    analyser.getByteFrequencyData(data)

    // Feed to engine for real-time processing
    const engine = getAudioReactiveEngine()
    engine.getValuesFromRealtime(data, ctx.sampleRate, analyser.fftSize, 30)

    // Update spectrum for visualization (create a copy)
    setSpectrum(new Uint8Array(data))

    rafRef.current = requestAnimationFrame(updateLoop)
  }, [])

  const connect = useCallback((audioUrl: string) => {
    // Clean up any existing connection
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (sourceRef.current) {
      try { sourceRef.current.disconnect() } catch { /* ignore */ }
    }

    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current

      // Create analyser
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      // Create audio element and connect
      const audio = new Audio(audioUrl)
      audio.crossOrigin = 'anonymous'
      audioElementRef.current = audio

      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      sourceRef.current = source

      setIsConnected(true)

      // Start analysis loop
      rafRef.current = requestAnimationFrame(updateLoop)
    } catch (err) {
      console.error('[useAudioReactivePlayback] Failed to connect:', err)
      setIsConnected(false)
    }
  }, [updateLoop])

  const disconnect = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    if (sourceRef.current) {
      try { sourceRef.current.disconnect() } catch { /* ignore */ }
      sourceRef.current = null
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    analyserRef.current = null
    frequencyDataRef.current = null
    setIsConnected(false)
    setSpectrum(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { isConnected, spectrum, connect, disconnect }
}
