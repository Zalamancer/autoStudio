import { memo, useCallback, useMemo } from 'react'
import { useMediaStore, type CanvasMediaItem, type MediaAsset } from '@/stores/useMediaStore'
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

/** Memo'd row that creates stable callbacks from its own item id. */
const MediaRow = memo(function MediaRow({
  item,
  asset,
  colors,
  isSelected,
  pixelsPerFrame,
  totalFrames,
}: {
  item: CanvasMediaItem
  asset: MediaAsset
  colors: TimelineRowColors
  isSelected: boolean
  pixelsPerFrame: number
  totalFrames: number
}) {
  const setSelectedCanvasItemId = useMediaStore((s) => s.setSelectedCanvasItemId)
  const setCanvasItemTimeRange = useMediaStore((s) => s.setCanvasItemTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const label = useMemo(() => {
    const prefix = asset.category === 'video' ? '🎬 ' : asset.category === 'audio' ? '🔊 ' : ''
    return `${prefix}${asset.name}`
  }, [asset.category, asset.name])

  const handleClick = useCallback(() => {
    setSelectedCanvasItemId(item.id)
    setRightPanelTab('media-properties')
  }, [item.id, setSelectedCanvasItemId, setRightPanelTab])

  const handleTimeRangeChange = useCallback(
    (sf: number, ef: number) => setCanvasItemTimeRange(item.id, sf, ef),
    [item.id, setCanvasItemTimeRange],
  )

  return (
    <DraggableTimelineRow
      label={label}
      colors={colors}
      startFrame={item.startFrame ?? 0}
      endFrame={item.endFrame ?? totalFrames}
      isSelected={isSelected}
      isVisible={item.visible}
      pixelsPerFrame={pixelsPerFrame}
      totalFrames={totalFrames}
      onClick={handleClick}
      onTimeRangeChange={handleTimeRangeChange}
    />
  )
})

export const MediaTrack = memo(function MediaTrack({ pixelsPerFrame }: MediaTrackProps) {
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  // Filter to items whose asset still exists and compute colors
  const itemsWithMeta = useMemo(() => {
    let imgIdx = 0
    return canvasItems
      .map((item) => {
        const asset = assets.find((a) => a.id === item.assetId)
        if (!asset) return null
        let colors: TimelineRowColors
        if (asset.category === 'video') {
          colors = VIDEO_COLORS
        } else if (asset.category === 'audio') {
          colors = AUDIO_COLORS
        } else {
          colors = IMAGE_COLORS[imgIdx % IMAGE_COLORS.length]
          imgIdx++
        }
        return { item, asset, colors }
      })
      .filter(Boolean) as { item: CanvasMediaItem; asset: MediaAsset; colors: TimelineRowColors }[]
  }, [canvasItems, assets])

  if (itemsWithMeta.length === 0) return null

  return (
    <>
      {itemsWithMeta.map(({ item, asset, colors }) => (
        <MediaRow
          key={item.id}
          item={item}
          asset={asset}
          colors={colors}
          isSelected={selectedCanvasItemId === item.id}
          pixelsPerFrame={pixelsPerFrame}
          totalFrames={totalFrames}
        />
      ))}
    </>
  )
})
