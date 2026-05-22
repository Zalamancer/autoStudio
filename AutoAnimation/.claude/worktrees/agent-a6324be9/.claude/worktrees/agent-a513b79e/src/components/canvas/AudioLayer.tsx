import { useRef, useEffect, useCallback, memo } from 'react'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTimelineStore } from '@/stores'

/**
 * AudioLayer manages playback of audio media items added to the canvas.
 * It renders hidden <audio> elements synced with the timeline.
 *
 * Uses a requestAnimationFrame loop for smooth sync instead of
 * per-frame React re-renders which cause micro-pauses.
 */
export const AudioLayer = memo(function AudioLayer() {
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)

  const audioItems = canvasItems.filter((item) => {
    const asset = assets.find((a) => a.id === item.assetId)
    return asset && asset.category === 'audio' && item.visible
  })

  if (audioItems.length === 0) return null

  return (
    <>
      {audioItems.map((item) => {
        const asset = assets.find((a) => a.id === item.assetId)!
        return (
          <AudioElement
            key={item.id}
            url={asset.url}
            startFrame={item.startFrame}
            endFrame={item.endFrame}
          />
        )
      })}
    </>
  )
})

interface AudioElementProps {
  url: string
  startFrame: number
  endFrame: number
}

/**
 * Individual audio element that syncs with the timeline using a rAF loop
 * instead of React effects on currentFrame. This prevents micro-pauses
 * caused by constant re-renders and effect re-fires.
 */
function AudioElement({ url, startFrame, endFrame }: AudioElementProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const wasPlayingRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const syncLoop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      rafRef.current = requestAnimationFrame(syncLoop)
      return
    }

    const { currentFrame, isPlaying, fps } = useTimelineStore.getState()
    const inRange = currentFrame >= startFrame && currentFrame < endFrame

    if (isPlaying && inRange) {
      const desiredTime = (currentFrame - startFrame) / fps

      if (!wasPlayingRef.current) {
        // Just started playing — seek to correct position and play
        audio.currentTime = desiredTime
        audio.play().catch(() => {})
        wasPlayingRef.current = true
      } else {
        // Already playing — only seek if drift is significant (> 0.3s)
        // Use a larger threshold than before to avoid micro-pauses
        const drift = Math.abs(audio.currentTime - desiredTime)
        if (drift > 0.3) {
          audio.currentTime = desiredTime
        }
      }
    } else {
      if (wasPlayingRef.current) {
        audio.pause()
        wasPlayingRef.current = false
      }

      // If not playing but in range, keep position synced for when play starts
      if (inRange) {
        const { fps } = useTimelineStore.getState()
        const desiredTime = (currentFrame - startFrame) / fps
        if (Math.abs(audio.currentTime - desiredTime) > 0.5) {
          audio.currentTime = desiredTime
        }
      }
    }

    rafRef.current = requestAnimationFrame(syncLoop)
  }, [startFrame, endFrame])

  // Start sync loop on mount, clean up on unmount
  useEffect(() => {
    rafRef.current = requestAnimationFrame(syncLoop)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
      wasPlayingRef.current = false
    }
  }, [syncLoop])

  // Guard against empty/invalid src which causes browser to re-download the page
  if (!url) return null

  return <audio ref={audioRef} src={url} preload="auto" />
}
