/**
 * WaveformCanvas — Canvas component for rendering audio waveform visualization.
 *
 * Accepts an AudioBuffer or blob URL, decodes audio, renders waveform as
 * vertical amplitude bars. Supports zoom, scroll, and click-to-seek.
 * Highlights beat positions with colored markers overlaid on the waveform.
 */

import { useRef, useEffect, useState, useCallback } from 'react'

interface WaveformCanvasProps {
  /** Pre-decoded AudioBuffer */
  audioBuffer?: AudioBuffer | null
  /** Blob URL — will be decoded if audioBuffer is not provided */
  audioUrl?: string | null
  /** Beat positions in seconds to overlay as markers */
  beats?: number[]
  /** Current playback position in seconds (for playhead) */
  currentTime?: number
  /** Total duration in seconds */
  duration?: number
  /** Width of the canvas in pixels */
  width?: number
  /** Height of the canvas in pixels */
  height?: number
  /** Called when user clicks on the waveform (time in seconds) */
  onSeek?: (time: number) => void
  /** CSS class name */
  className?: string
}

interface WaveformData {
  /** Per-pixel min amplitude */
  mins: Float32Array
  /** Per-pixel max amplitude */
  maxs: Float32Array
  duration: number
}

function computeWaveformData(buffer: AudioBuffer, pixelWidth: number): WaveformData {
  const channelData = buffer.getChannelData(0)
  const samplesPerPixel = Math.max(1, Math.floor(channelData.length / pixelWidth))
  const mins = new Float32Array(pixelWidth)
  const maxs = new Float32Array(pixelWidth)

  for (let i = 0; i < pixelWidth; i++) {
    const start = i * samplesPerPixel
    const end = Math.min(start + samplesPerPixel, channelData.length)
    let min = 1
    let max = -1
    for (let j = start; j < end; j++) {
      const sample = channelData[j]
      if (sample < min) min = sample
      if (sample > max) max = sample
    }
    mins[i] = min
    maxs[i] = max
  }

  return { mins, maxs, duration: buffer.duration }
}

export function WaveformCanvas({
  audioBuffer,
  audioUrl,
  beats = [],
  currentTime = 0,
  duration: _durationProp,
  width = 400,
  height = 80,
  onSeek,
  className,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null)
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null)

  const buffer = audioBuffer ?? decodedBuffer

  // Decode audio from URL if no buffer provided
  useEffect(() => {
    if (audioBuffer) {
      setDecodedBuffer(null)
      return
    }
    if (!audioUrl) {
      setDecodedBuffer(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(audioUrl)
        const arrayBuffer = await response.arrayBuffer()
        const ctx = new AudioContext()
        const decoded = await ctx.decodeAudioData(arrayBuffer)
        await ctx.close()
        if (!cancelled) setDecodedBuffer(decoded)
      } catch (err) {
        console.warn('[WaveformCanvas] Failed to decode audio:', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [audioUrl, audioBuffer])

  // Compute waveform data when buffer or width changes
  useEffect(() => {
    if (!buffer) {
      setWaveformData(null)
      return
    }
    const data = computeWaveformData(buffer, width)
    setWaveformData(data)
  }, [buffer, width])

  // Render the waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { mins, maxs, duration } = waveformData
    const centerY = height / 2

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 0, width, height)

    // Waveform bars
    ctx.fillStyle = 'rgba(236, 72, 153, 0.6)' // pink-500
    for (let i = 0; i < mins.length; i++) {
      const minVal = mins[i]
      const maxVal = maxs[i]
      const y1 = centerY + minVal * centerY
      const y2 = centerY + maxVal * centerY
      ctx.fillRect(i, Math.min(y1, y2), 1, Math.abs(y2 - y1) || 1)
    }

    // Beat markers
    if (beats.length > 0 && duration > 0) {
      for (let b = 0; b < beats.length; b++) {
        const beatTime = beats[b]
        const x = (beatTime / duration) * width
        const isDownbeat = b % 4 === 0
        ctx.strokeStyle = isDownbeat
          ? 'rgba(236, 72, 153, 0.8)'
          : 'rgba(236, 72, 153, 0.4)'
        ctx.lineWidth = isDownbeat ? 2 : 1
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
    }

    // Playhead
    if (duration > 0 && currentTime > 0) {
      const playheadX = (currentTime / duration) * width
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
    }
  }, [waveformData, beats, currentTime, width, height])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSeek || !waveformData) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = (x / width) * waveformData.duration
      onSeek(Math.max(0, Math.min(time, waveformData.duration)))
    },
    [onSeek, waveformData, width]
  )

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className={`rounded-lg cursor-pointer ${className ?? ''}`}
      style={{ width, height }}
    />
  )
}
