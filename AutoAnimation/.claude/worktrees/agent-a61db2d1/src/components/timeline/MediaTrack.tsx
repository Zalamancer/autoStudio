import { useMediaStore } from '@/stores/useMediaStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'

interface MediaTrackProps {
  pixelsPerFrame: number
}

const IMAGE_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(34, 197, 94, 0.30)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.6)' },
  { bg: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  { bg: 'rgba(168, 85, 247, 0.30)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },
  { bg: 'rgba(245, 158, 11, 0.30)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },
]

const VIDEO_COLORS: TimelineRowColors = {
  bg: 'rgba(99, 102, 241, 0.30)',
  text: '#818cf8',
  border: 'rgba(99, 102, 241, 0.6)',
}

const AUDIO_COLORS: TimelineRowColors = {
  bg: 'rgba(251, 146, 60, 0.30)',
  text: '#fb923c',
  border: 'rgba(251, 146, 60, 0.6)',
}

export function MediaTrack({ pixelsPerFrame }: MediaTrackProps) {
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)
  const setSelectedCanvasItemId = useMediaStore((s) => s.setSelectedCanvasItemId)
  const setCanvasItemTimeRange = useMediaStore((s) => s.setCanvasItemTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  // Filter to items whose asset still exists
  const validItems = canvasItems.filter((item) => {
    const asset = assets.find((a) => a.id === item.assetId)
    return !!asset
  })

  if (validItems.length === 0) return null

  const handleItemClick = (itemId: string) => {
    setSelectedCanvasItemId(itemId)
    setRightPanelTab('media-properties')
  }

  let imageIndex = 0

  return (
    <>
      {validItems.map((item) => {
        const asset = assets.find((a) => a.id === item.assetId)!
        let colors: TimelineRowColors
        if (asset.category === 'video') {
          colors = VIDEO_COLORS
        } else if (asset.category === 'audio') {
          colors = AUDIO_COLORS
        } else {
          colors = IMAGE_COLORS[imageIndex % IMAGE_COLORS.length]
          imageIndex++
        }

        const prefix = asset.category === 'video' ? '🎬 ' : asset.category === 'audio' ? '🔊 ' : ''

        return (
          <DraggableTimelineRow
            key={item.id}
            label={`${prefix}${asset.name}`}
            colors={colors}
            startFrame={item.startFrame ?? 0}
            endFrame={item.endFrame ?? totalFrames}
            isSelected={selectedCanvasItemId === item.id}
            isVisible={item.visible}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => handleItemClick(item.id)}
            onTimeRangeChange={(sf, ef) => setCanvasItemTimeRange(item.id, sf, ef)}
          />
        )
      })}
    </>
  )
}
