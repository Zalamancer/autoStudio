import { useFrame } from '@/engine'
import { buildVariableWidthSVG } from '@/services/artCurveGenerator'
import type { ArtCurveComposition } from '@/types/artCurves'

interface RemotionArtCurveLayerProps {
  compositions: ArtCurveComposition[]
}

export function RemotionArtCurveLayer({ compositions }: RemotionArtCurveLayerProps) {
  const frame = useFrame()

  return (
    <>
      {compositions.map((comp) => {
        if (!comp.visible) return null
        if (frame < comp.startFrame || frame >= comp.endFrame) return null

        const displayWidth = 800 * comp.scale
        const displayHeight = 600 * comp.scale

        const svgContent = buildVariableWidthSVG(comp.curves, 800, 600, false)

        const style: React.CSSProperties = {
          position: 'absolute',
          left: comp.position.x,
          top: comp.position.y,
          width: displayWidth,
          height: displayHeight,
          opacity: comp.opacity,
          zIndex: comp.zIndex,
          backgroundColor: comp.bgTransparent ? 'transparent' : comp.bgColor,
          borderRadius: comp.bgTransparent ? undefined : 8,
        }

        if (comp.rotation !== 0) {
          style.transform = `rotate(${comp.rotation}deg)`
        }

        return (
          <div
            key={comp.id}
            style={style}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )
      })}
    </>
  )
}
