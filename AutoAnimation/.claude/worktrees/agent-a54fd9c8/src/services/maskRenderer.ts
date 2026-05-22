import type { MaskDefinition } from '@/stores/useMaskStore'
import type { KeyframeExportData } from '@/remotion/types'
import type { PropertyKeyframe, EasingType } from '@/types/keyframes'
import { interpolatePropertyKeyframes } from './interpolation'
import { evaluatePath } from '@/engine/path'

type KeyframeIndex = Map<string, PropertyKeyframe[]>

/**
 * Read an animated mask value from keyframe data.
 */
function getMaskKeyframeValue(
  keyframeData: KeyframeExportData | undefined,
  maskId: string,
  property: string,
  frame: number,
  kfIndex?: KeyframeIndex,
): number | undefined {
  // Fast path: use pre-indexed map
  if (kfIndex) {
    const key = `mask:${maskId}:${property}`
    const kfs = kfIndex.get(key)
    if (!kfs || kfs.length === 0) return undefined
    return interpolatePropertyKeyframes(kfs, frame, property === 'rotation')
  }

  // Fallback: linear scan
  if (!keyframeData) return undefined

  const track = keyframeData.tracks.find(
    t => t.objectType === 'mask' && t.objectId === maskId && t.property === property
  )
  if (!track || track.keyframes.length === 0) return undefined

  const kfs: PropertyKeyframe[] = track.keyframes.map((kf, i) => ({
    id: `${i}`,
    frame: kf.frame,
    value: kf.value,
    easing: (kf.easing || 'linear') as EasingType,
    bezierParams: kf.bezierParams,
  }))

  return interpolatePropertyKeyframes(kfs, frame, property === 'rotation')
}

/**
 * Build a Path2D for a vector mask at the current frame.
 * Reads animated properties from keyframe data.
 */
export function buildMaskPath(
  mask: MaskDefinition,
  frame: number,
  kfIndex?: KeyframeIndex,
  keyframeData?: KeyframeExportData,
): Path2D {
  const x = getMaskKeyframeValue(keyframeData, mask.id, 'position.x', frame, kfIndex) ?? mask.position.x
  const y = getMaskKeyframeValue(keyframeData, mask.id, 'position.y', frame, kfIndex) ?? mask.position.y
  const w = getMaskKeyframeValue(keyframeData, mask.id, 'width', frame, kfIndex) ?? mask.width
  const h = getMaskKeyframeValue(keyframeData, mask.id, 'height', frame, kfIndex) ?? mask.height
  const rotation = getMaskKeyframeValue(keyframeData, mask.id, 'rotation', frame, kfIndex) ?? mask.rotation

  const path = new Path2D()

  switch (mask.type) {
    case 'rectangle': {
      if (rotation !== 0) {
        // For rotated rectangles, compute rotated corners
        const cx = x + w / 2
        const cy = y + h / 2
        const rad = (rotation * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const hw = w / 2
        const hh = h / 2
        const corners = [
          [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]
        ]
        corners.forEach(([lx, ly], i) => {
          const rx = cx + lx * cos - ly * sin
          const ry = cy + lx * sin + ly * cos
          if (i === 0) path.moveTo(rx, ry)
          else path.lineTo(rx, ry)
        })
        path.closePath()
      } else {
        path.rect(x, y, w, h)
      }
      break
    }
    case 'ellipse':
      path.ellipse(
        x + w / 2,
        y + h / 2,
        w / 2,
        h / 2,
        (rotation * Math.PI) / 180,
        0,
        Math.PI * 2
      )
      break
    case 'path':
      if (mask.pathConfig) {
        const samples = 100
        for (let i = 0; i <= samples; i++) {
          const t = i / samples
          const pt = evaluatePath(t, mask.pathConfig)
          if (i === 0) path.moveTo(pt.x, pt.y)
          else path.lineTo(pt.x, pt.y)
        }
        path.closePath()
      }
      break
  }

  return path
}

/**
 * Apply a vector mask to the canvas context.
 * Call before drawing the masked layer, and ctx.restore() after.
 */
export function applyVectorMask(
  ctx: CanvasRenderingContext2D,
  mask: MaskDefinition,
  frame: number,
  kfIndex?: KeyframeIndex,
  keyframeData?: KeyframeExportData,
): void {
  const path = buildMaskPath(mask, frame, kfIndex, keyframeData)

  if (mask.feather > 0) {
    ctx.filter = `blur(${mask.feather}px)`
  }

  if (mask.inverted) {
    // Inverted: clip to everything OUTSIDE the path
    const invertedPath = new Path2D()
    invertedPath.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
    invertedPath.addPath(path)
    ctx.clip(invertedPath, 'evenodd')
  } else {
    ctx.clip(path)
  }
}

/**
 * Apply an alpha mask using compositing.
 * Renders the target to an offscreen canvas, composites with the mask,
 * then draws result onto the main canvas.
 */
export function applyAlphaMask(
  mainCtx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  drawTarget: (ctx: CanvasRenderingContext2D) => void,
  inverted: boolean,
): void {
  const w = mainCtx.canvas.width
  const h = mainCtx.canvas.height

  // Draw target to temp canvas
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCtx = tempCanvas.getContext('2d')!
  drawTarget(tempCtx)

  // Apply mask via compositing
  tempCtx.globalCompositeOperation = inverted ? 'destination-out' : 'destination-in'
  tempCtx.drawImage(maskCanvas, 0, 0)
  tempCtx.globalCompositeOperation = 'source-over'

  // Composite result onto main canvas
  mainCtx.drawImage(tempCanvas, 0, 0)
}
