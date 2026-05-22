import { useFrame } from '@/engine'
import type { MediaLayerData, KeyframeExportData } from './types'
import { useRemotionKeyframeValues } from './useRemotionKeyframes'

interface RemotionMediaLayerProps {
  mediaItems: MediaLayerData[]
  canvasWidth: number
  canvasHeight: number
  keyframeData?: KeyframeExportData
}

export const RemotionMediaLayer = ({ mediaItems, canvasWidth, canvasHeight, keyframeData }: RemotionMediaLayerProps) => {
  const frame = useFrame()
  const visibleItems = mediaItems.filter(item =>
    item.visible && item.imageUrl &&
    frame >= item.startFrame && frame < item.endFrame
  )
  if (visibleItems.length === 0) return null

  return (
    <>
      {visibleItems.map(item => (
        <RemotionMediaItem
          key={item.id}
          item={item}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          keyframeData={keyframeData}
        />
      ))}
    </>
  )
}

function RemotionMediaItem({
  item,
  canvasWidth,
  canvasHeight,
  keyframeData,
}: {
  item: MediaLayerData
  canvasWidth: number
  canvasHeight: number
  keyframeData?: KeyframeExportData
}) {
  const kfValues = useRemotionKeyframeValues(keyframeData, 'media', item.id)

  const x = (kfValues['position.x'] as number) ?? item.position.x
  const y = (kfValues['position.y'] as number) ?? item.position.y
  const scale = (kfValues['scale'] as number) ?? item.scale
  const opacity = (kfValues['opacity'] as number) ?? item.opacity
  const rotation = (kfValues['rotation'] as number) ?? item.rotation

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: canvasWidth * scale,
        height: canvasHeight * scale,
        opacity,
        zIndex: item.zIndex,
        cursor: 'default',
        transformOrigin: 'top left',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <img
        src={item.imageUrl}
        crossOrigin="anonymous"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
