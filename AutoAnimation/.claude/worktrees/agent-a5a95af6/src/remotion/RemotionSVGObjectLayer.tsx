import { useFrame } from '@/engine'
import type { SVGCompositionExportData } from './types'

interface RemotionSVGObjectLayerProps {
  svgComposition: SVGCompositionExportData
  canvasWidth: number
  canvasHeight: number
}

// ---------------------------------------------------------------------------
// Inline interpolation (mirrors svgComposer.ts logic)
// ---------------------------------------------------------------------------

interface ResolvedTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function applyEasing(t: number, easing?: string): number {
  switch (easing) {
    case 'ease-in':
      return t * t
    case 'ease-out':
      return 1 - (1 - t) * (1 - t)
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    default:
      return t
  }
}

function interpolateKeyframes(
  keyframes: SVGCompositionExportData['objects'][0]['keyframes'],
  t: number,
): ResolvedTransform {
  const def: ResolvedTransform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }
  if (keyframes.length === 0) return def

  t = Math.max(0, Math.min(1, t))

  if (keyframes.length === 1) {
    const kf = keyframes[0]
    return {
      x: kf.x ?? 0,
      y: kf.y ?? 0,
      rotation: kf.rotation ?? 0,
      scaleX: kf.scaleX ?? 1,
      scaleY: kf.scaleY ?? 1,
      opacity: kf.opacity ?? 1,
    }
  }

  let before = keyframes[0]
  let after = keyframes[keyframes.length - 1]

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      before = keyframes[i]
      after = keyframes[i + 1]
      break
    }
  }

  if (t <= before.time) {
    return {
      x: before.x ?? 0,
      y: before.y ?? 0,
      rotation: before.rotation ?? 0,
      scaleX: before.scaleX ?? 1,
      scaleY: before.scaleY ?? 1,
      opacity: before.opacity ?? 1,
    }
  }

  if (t >= after.time) {
    return {
      x: after.x ?? 0,
      y: after.y ?? 0,
      rotation: after.rotation ?? 0,
      scaleX: after.scaleX ?? 1,
      scaleY: after.scaleY ?? 1,
      opacity: after.opacity ?? 1,
    }
  }

  const range = after.time - before.time
  const rawT = range > 0 ? (t - before.time) / range : 0
  const easedT = applyEasing(rawT, before.easing)

  return {
    x: lerp(before.x ?? 0, after.x ?? 0, easedT),
    y: lerp(before.y ?? 0, after.y ?? 0, easedT),
    rotation: lerp(before.rotation ?? 0, after.rotation ?? 0, easedT),
    scaleX: lerp(before.scaleX ?? 1, after.scaleX ?? 1, easedT),
    scaleY: lerp(before.scaleY ?? 1, after.scaleY ?? 1, easedT),
    opacity: lerp(before.opacity ?? 1, after.opacity ?? 1, easedT),
  }
}

function resolveColors(svgMarkup: string, colors: Record<string, string>): string {
  return svgMarkup.replace(/\{\{(\w+)\}\}/g, (_, key) => colors[key] || '#ff00ff')
}

function buildSVGString(
  comp: SVGCompositionExportData,
  currentFrame: number,
): string {
  const { width, height, background, objects } = comp

  const sorted = [...objects]
    .filter((obj) => obj.visible && currentFrame >= obj.startFrame && currentFrame <= obj.endFrame)
    .sort((a, b) => a.zIndex - b.zIndex)

  const groups = sorted.map((obj) => {
    const resolvedMarkup = resolveColors(obj.svgMarkup, obj.colors)

    const objRange = obj.endFrame - obj.startFrame
    const objT = objRange > 0
      ? Math.max(0, Math.min(1, (currentFrame - obj.startFrame) / objRange))
      : 0

    const transform = interpolateKeyframes(obj.keyframes, objT)
    const finalOpacity = transform.opacity * obj.opacity

    const parts: string[] = []
    if (transform.x !== 0 || transform.y !== 0) {
      parts.push(`translate(${transform.x.toFixed(1)}, ${transform.y.toFixed(1)})`)
    }
    if (transform.rotation !== 0) {
      parts.push(`rotate(${transform.rotation.toFixed(1)})`)
    }
    if (transform.scaleX !== 1 || transform.scaleY !== 1) {
      parts.push(`scale(${transform.scaleX.toFixed(3)}, ${transform.scaleY.toFixed(3)})`)
    }
    const transformAttr = parts.length > 0 ? ` transform="${parts.join(' ')}"` : ''
    const opacityAttr = finalOpacity < 1 ? ` opacity="${finalOpacity.toFixed(3)}"` : ''

    return `<g${transformAttr}${opacityAttr}>${resolvedMarkup}</g>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="${background}"/>
${groups.join('\n')}
</svg>`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RemotionSVGObjectLayer({
  svgComposition,
  canvasWidth,
  canvasHeight,
}: RemotionSVGObjectLayerProps) {
  const frame = useFrame()

  const svgString = buildSVGString(svgComposition, frame)
  const encoded = encodeURIComponent(svgString)
  const dataUri = `data:image/svg+xml;charset=utf-8,${encoded}`

  const scaleX = canvasWidth / svgComposition.width
  const scaleY = canvasHeight / svgComposition.height
  const scale = Math.min(scaleX, scaleY)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 6.5,
      }}
    >
      <img
        src={dataUri}
        style={{
          width: svgComposition.width * scale,
          height: svgComposition.height * scale,
          imageRendering: 'auto',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
