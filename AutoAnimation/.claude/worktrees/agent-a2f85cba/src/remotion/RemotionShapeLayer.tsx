import { useFrame } from '@/engine'
import { useRemotionKeyframeValues } from './useRemotionKeyframes'
import type { ShapeLayerData, KeyframeExportData } from './types'
import type { GradientFill } from '@/types/gradient'

function resolveFillString(fill: string | GradientFill | undefined): string | undefined {
  if (!fill) return undefined
  if (typeof fill === 'string') return fill
  return fill.stops?.[0]?.color ?? '#000000'
}

interface RemotionShapeLayerProps {
  shapes: ShapeLayerData[]
  keyframeData?: KeyframeExportData
}

export function RemotionShapeLayer({ shapes, keyframeData }: RemotionShapeLayerProps) {
  const frame = useFrame()

  return (
    <>
      {shapes.map((shape) => {
        if (!shape.visible) return null
        if (frame < shape.startFrame || frame >= shape.endFrame) return null

        return (
          <RemotionShapeItem
            key={shape.id}
            shape={shape}
            keyframeData={keyframeData}
          />
        )
      })}
    </>
  )
}

function RemotionShapeItem({
  shape,
  keyframeData,
}: {
  shape: ShapeLayerData
  keyframeData?: KeyframeExportData
}) {
  const kfValues = useRemotionKeyframeValues(keyframeData, 'shape', shape.id)

  const effectiveX = kfValues.x ?? shape.position.x
  const effectiveY = kfValues.y ?? shape.position.y
  const effectiveWidth = kfValues.width ?? shape.width
  const effectiveHeight = kfValues.height ?? shape.height
  const effectiveOpacity = kfValues.opacity ?? shape.opacity
  const effectiveRotation = kfValues.rotation ?? shape.rotation
  const effectiveZIndex = kfValues.zIndex != null ? Math.round(kfValues.zIndex) : shape.zIndex
  const effectiveStrokeWidth = kfValues.strokeWidth ?? shape.strokeWidth
  const effectiveBorderRadius = kfValues.borderRadius ?? (shape.borderRadius ?? 0)
  const effectiveInnerRadius = kfValues.innerRadius ?? (shape.innerRadius ?? 0.4)

  const style: React.CSSProperties = {
    position: 'absolute',
    left: effectiveX,
    top: effectiveY,
    width: effectiveWidth,
    height: effectiveHeight,
    opacity: effectiveOpacity,
    zIndex: effectiveZIndex,
  }

  if (effectiveRotation !== 0) {
    style.transform = `rotate(${effectiveRotation}deg)`
  }

  return (
    <div style={style}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <RemotionShapeSVG
          shape={shape}
          width={effectiveWidth}
          height={effectiveHeight}
          strokeWidth={effectiveStrokeWidth}
          borderRadius={effectiveBorderRadius}
          innerRadius={effectiveInnerRadius}
        />
      </svg>
    </div>
  )
}

function RemotionShapeSVG({
  shape,
  width,
  height,
  strokeWidth,
  borderRadius,
  innerRadius,
}: {
  shape: ShapeLayerData
  width: number
  height: number
  strokeWidth: number
  borderRadius: number
  innerRadius: number
}) {
  const { fill: rawFill, stroke, type } = shape
  const fill = resolveFillString(rawFill)

  switch (type) {
    case 'rectangle':
      return (
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={borderRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'circle':
      return (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={(width - strokeWidth) / 2}
          ry={(height - strokeWidth) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'triangle': {
      const inset = strokeWidth / 2
      const points = `${width / 2},${inset} ${width - inset},${height - inset} ${inset},${height - inset}`
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )
    }

    case 'star': {
      const cx = width / 2
      const cy = height / 2
      const outerR = Math.min(width, height) / 2 - strokeWidth / 2
      const innerR = outerR * innerRadius
      const numPoints = shape.points ?? 5
      const pts: string[] = []

      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (Math.PI * i) / numPoints - Math.PI / 2
        const r = i % 2 === 0 ? outerR : innerR
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
      }

      return (
        <polygon
          points={pts.join(' ')}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )
    }

    default:
      return null
  }
}
