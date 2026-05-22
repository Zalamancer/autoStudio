import { useRef, useEffect, useCallback, memo } from 'react'
import { useVideoLayerStore, type CanvasVideo } from '@/stores/useVideoLayerStore'
import { useEditorStore } from '@/stores'
import { useTimelineStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'

interface VideoLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function VideoLayer({ canvasWidth, canvasHeight }: VideoLayerProps) {
  const videos = useVideoLayerStore((s) => s.videos)
  const selectedVideoId = useVideoLayerStore((s) => s.selectedVideoId)
  const setSelectedVideoId = useVideoLayerStore((s) => s.setSelectedVideoId)
  const updateVideo = useVideoLayerStore((s) => s.updateVideo)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const visibleVideos = videos.filter((v) => v.visible)

  if (visibleVideos.length === 0) return null

  return (
    <>
      {visibleVideos.map((video) => (
        <VideoElement
          key={video.id}
          video={video}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          isSelected={selectedVideoId === video.id}
          onSelect={() => {
            setSelectedVideoId(video.id)
            setRightPanelTab('video-properties')
          }}
          onUpdate={(updates) => updateVideo(video.id, updates)}
        />
      ))}
    </>
  )
}

interface VideoElementProps {
  video: CanvasVideo
  canvasWidth: number
  canvasHeight: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<CanvasVideo>) => void
}

const VideoElement = memo(function VideoElement({
  video,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onUpdate,
}: VideoElementProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)

  // Force-display the first frame once video data is loaded
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const showFirstFrame = () => {
      const state = useTimelineStore.getState()
      const desiredTime = state.currentFrame / state.fps
      el.currentTime = desiredTime || 0.001
    }
    el.addEventListener('loadeddata', showFirstFrame, { once: true })
    return () => el.removeEventListener('loadeddata', showFirstFrame)
  }, [video.sourceUrl])

  // Sync video currentTime with timeline frame via RAF (only when playing)
  useEffect(() => {
    if (!isPlaying) return

    let rafId: number
    let lastFrame = -1

    const sync = () => {
      const state = useTimelineStore.getState()
      if (!state.isPlaying) return
      if (state.currentFrame !== lastFrame && videoRef.current) {
        lastFrame = state.currentFrame
        const desiredTime = state.currentFrame / state.fps
        if (Math.abs(videoRef.current.currentTime - desiredTime) > 0.1) {
          videoRef.current.currentTime = desiredTime
        }
      }
      rafId = requestAnimationFrame(sync)
    }

    rafId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying])

  // Sync frame on scrub while paused
  useEffect(() => {
    if (isPlaying || !videoRef.current) return
    const desiredTime = currentFrame / fps
    if (Math.abs(videoRef.current.currentTime - desiredTime) > 0.05) {
      videoRef.current.currentTime = desiredTime
    }
  }, [isPlaying, currentFrame, fps])

  // Sync play/pause with timeline
  useEffect(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying])

  const displayWidth = canvasWidth * video.scale
  const displayHeight = canvasHeight * video.scale

  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      setLiveTransform({
        type: 'video',
        id: video.id,
        x: values.left,
        y: values.top,
        rotation: Math.round(values.rotation),
        scale: values.width / canvasWidth,
      })
    },
    [video.id, canvasWidth, setLiveTransform]
  )

  const handleTransformEnd = useCallback(
    (_state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || video.position.x
      const finalTop = parseFloat(el.style.top) || video.position.y
      const finalWidth = el.offsetWidth
      const newScale = finalWidth / canvasWidth

      onUpdate({
        position: { x: finalLeft, y: finalTop },
        scale: newScale,
        rotation: Math.round(_state.rotate),
      })
    },
    [video.position.x, video.position.y, canvasWidth, onUpdate, clearLiveTransform]
  )

  const style: React.CSSProperties = {
    position: 'absolute',
    left: video.position.x,
    top: video.position.y,
    width: displayWidth,
    height: displayHeight,
    opacity: video.opacity,
    zIndex: video.zIndex,
    cursor: 'pointer',
  }

  if (video.rotation !== 0) {
    style.transform = `rotate(${video.rotation}deg)`
  }

  return (
    <>
      <div
        ref={targetRef}
        style={style}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <video
          ref={videoRef}
          src={video.sourceUrl}
          muted
          loop={video.loop}
          playsInline
          preload="auto"
          className="pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio={true}
          color="#818cf8"
        />
      )}
    </>
  )
})
