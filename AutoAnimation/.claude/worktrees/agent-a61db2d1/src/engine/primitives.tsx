import React, { useRef, useEffect } from 'react'
import { useFrame, useComposition } from './CompositionContext'

/** Replaces Remotion's AbsoluteFill */
export const Fill = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ style, ...props }, ref) => (
  <div
    ref={ref}
    style={{ position: 'absolute', inset: 0, ...style }}
    {...props}
  />
))
Fill.displayName = 'Fill'

/** Replaces Remotion's Sequence — only renders children within frame range */
export function Clip({
  from = 0,
  durationInFrames,
  children,
}: {
  from?: number
  durationInFrames: number
  children: React.ReactNode
}) {
  const frame = useFrame()
  if (frame < from || frame >= from + durationInFrames) return null
  return <>{children}</>
}

/** HTML5 <audio> synced to frame context. Replaces Remotion's Audio. */
export function AudioTrack({
  src,
  volume = 1,
}: {
  src: string
  volume?: number
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { frame, fps } = useComposition()

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.volume = Math.max(0, Math.min(1, volume))
  }, [volume])

  useEffect(() => {
    const el = audioRef.current
    if (!el || !el.duration) return
    const targetTime = frame / fps
    // Only seek if drift exceeds half a frame
    if (Math.abs(el.currentTime - targetTime) > 0.5 / fps) {
      el.currentTime = targetTime
    }
  }, [frame, fps])

  return <audio ref={audioRef} src={src} preload="auto" />
}

/** HTML5 <video> synced to frame context. Replaces Remotion's OffthreadVideo. */
export function VideoTrack({
  src,
  style,
  muted = false,
}: {
  src: string
  style?: React.CSSProperties
  muted?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { frame, fps } = useComposition()

  useEffect(() => {
    const el = videoRef.current
    if (!el || !el.duration) return
    const targetTime = frame / fps
    if (Math.abs(el.currentTime - targetTime) > 0.5 / fps) {
      el.currentTime = targetTime
    }
  }, [frame, fps])

  return (
    <video
      ref={videoRef}
      src={src}
      muted={muted}
      preload="auto"
      playsInline
      style={style}
    />
  )
}
