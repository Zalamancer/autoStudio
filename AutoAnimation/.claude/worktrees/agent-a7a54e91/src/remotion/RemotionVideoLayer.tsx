import { useFrame, useComposition, VideoTrack } from '@/engine'
import type { VideoLayerData } from './types'

interface RemotionVideoLayerProps {
  videos: VideoLayerData[]
  canvasWidth: number
  canvasHeight: number
}

export const RemotionVideoLayer = ({ videos, canvasWidth, canvasHeight }: RemotionVideoLayerProps) => {
  const { durationInFrames } = useComposition()
  const frame = useFrame()

  const visibleVideos = videos.filter(v => {
    if (!v.visible || !v.sourceUrl) return false
    const start = v.startFrame ?? 0
    const end = v.endFrame ?? durationInFrames
    return frame >= start && frame < end
  })
  if (visibleVideos.length === 0) return null

  return (
    <>
      {visibleVideos.map(video => (
        <div
          key={video.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: canvasWidth,
            height: canvasHeight,
            zIndex: video.zIndex,
            opacity: video.opacity,
            transform: `translate(${video.position.x}px, ${video.position.y}px) scale(${video.scale})${video.rotation ? ` rotate(${video.rotation}deg)` : ''}`,
            transformOrigin: 'top left',
            overflow: 'hidden',
          }}
        >
          <VideoTrack
            src={video.sourceUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            muted
          />
        </div>
      ))}
    </>
  )
}
