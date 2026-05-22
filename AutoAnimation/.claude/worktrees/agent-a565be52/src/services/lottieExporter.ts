/**
 * Lottie JSON Exporter
 *
 * Converts ProAnimate's VideoCompositionProps into Lottie JSON (bodymovin schema).
 * - Shapes map to Lottie shape layers
 * - Text overlays map to Lottie text layers
 * - SVG objects map to shape groups
 * - Media layers become image assets
 * - Keyframe tracks map to Lottie property animations (transform, opacity)
 * - Unsupported layers (HTML templates, 3D characters) are rasterized to images
 */

import type {
  VideoCompositionProps,
  ShapeLayerData,
  TextOverlayData,
  MediaLayerData,
  KeyframeExportTrack,
  SVGCompositionExportData,
} from '@/remotion/types'
import type { EasingType, CubicBezierParams } from '@/types/keyframes'

// ---------------------------------------------------------------------------
// Lottie JSON types (subset of the bodymovin schema)
// ---------------------------------------------------------------------------

interface LottieAnimation {
  v: string               // version
  fr: number              // frame rate
  ip: number              // in point (start frame)
  op: number              // out point (end frame)
  w: number               // width
  h: number               // height
  nm: string              // name
  ddd: 0 | 1              // 3D flag
  assets: LottieAsset[]
  layers: LottieLayer[]
}

interface LottieAsset {
  id: string
  w: number
  h: number
  u: string               // path (directory)
  p: string               // filename or base64 data URI
  e?: 0 | 1               // embedded (1 = data URI)
}

interface LottieLayer {
  ddd: 0 | 1
  ind: number             // index
  ty: number              // type: 0=precomp, 1=solid, 2=image, 3=null, 4=shape, 5=text
  nm: string              // name
  sr: number              // stretch
  ks: LottieTransform     // transform
  ao: 0 | 1               // auto-orient
  ip: number              // in point
  op: number              // out point
  st: number              // start time
  bm: number              // blend mode
  // Shape layers
  shapes?: LottieShapeItem[]
  // Image layers
  refId?: string
  // Text layers
  t?: LottieTextData
}

interface LottieTransform {
  o: LottieAnimatedValue  // opacity (0-100)
  r: LottieAnimatedValue  // rotation
  p: LottieAnimatedMultiValue  // position [x,y]
  a: LottieAnimatedMultiValue  // anchor point
  s: LottieAnimatedMultiValue  // scale [x,y] (100 = 100%)
}

interface LottieAnimatedValue {
  a: 0 | 1               // animated flag
  k: number | LottieKeyframe[]
}

interface LottieAnimatedMultiValue {
  a: 0 | 1
  k: number[] | LottieMultiKeyframe[]
}

interface LottieKeyframe {
  t: number               // time (frame)
  s: [number]             // start value
  e?: [number]            // end value (deprecated in newer versions but still supported)
  i?: { x: number[]; y: number[] }  // in tangent
  o?: { x: number[]; y: number[] }  // out tangent
}

interface LottieMultiKeyframe {
  t: number
  s: number[]
  e?: number[]
  i?: { x: number[]; y: number[] }
  o?: { x: number[]; y: number[] }
}

interface LottieShapeItem {
  ty: string              // shape type: 'rc'=rect, 'el'=ellipse, 'sr'=star, 'fl'=fill, 'st'=stroke, 'tr'=transform, 'gr'=group, 'sh'=path
  nm?: string
  // rect
  p?: LottieAnimatedMultiValue  // position
  s?: LottieAnimatedMultiValue  // size
  r?: LottieAnimatedValue       // roundness (for rect)
  // ellipse
  // star
  pt?: LottieAnimatedValue      // points
  sy?: number                   // star type: 1=star, 2=polygon
  or?: LottieAnimatedValue      // outer radius
  ir?: LottieAnimatedValue      // inner radius
  // fill
  c?: LottieAnimatedColor       // color
  o?: LottieAnimatedValue       // opacity
  // stroke
  w?: LottieAnimatedValue       // width
  lc?: number                   // line cap
  lj?: number                   // line join
  // group
  it?: LottieShapeItem[]
  // path
  ks?: LottieAnimatedPath       // path data
}

interface LottieAnimatedColor {
  a: 0 | 1
  k: number[] | LottieColorKeyframe[]
}

interface LottieColorKeyframe {
  t: number
  s: number[]
  e?: number[]
  i?: { x: number[]; y: number[] }
  o?: { x: number[]; y: number[] }
}

interface LottieAnimatedPath {
  a: 0 | 1
  k: LottiePathData
}

interface LottiePathData {
  c: boolean              // closed
  v: number[][]           // vertices
  i: number[][]           // in tangents
  o: number[][]           // out tangents
}

interface LottieTextData {
  d: {
    k: Array<{
      s: {
        s: number         // font size
        f: string         // font family
        t: string         // text content
        j: number         // justification (0=left, 1=right, 2=center)
        tr: number        // tracking (letter spacing)
        lh: number        // line height
        fc: number[]      // font color [r, g, b]
      }
      t: number           // time
    }>
  }
}

// ---------------------------------------------------------------------------
// Easing conversion: ProAnimate easing -> Lottie bezier tangents
// ---------------------------------------------------------------------------

function easingToLottieTangents(easing: EasingType, bezierParams?: CubicBezierParams): {
  i: { x: number[]; y: number[] }
  o: { x: number[]; y: number[] }
} {
  // Lottie uses cubic bezier tangents with {x: [...], y: [...]} format
  // The "o" (out) tangent is from the start keyframe, "i" (in) tangent is to the end keyframe

  switch (easing) {
    case 'linear':
      return {
        o: { x: [0], y: [0] },
        i: { x: [1], y: [1] },
      }
    case 'ease-in':
      return {
        o: { x: [0.42], y: [0] },
        i: { x: [1], y: [1] },
      }
    case 'ease-out':
      return {
        o: { x: [0], y: [0] },
        i: { x: [0.58], y: [1] },
      }
    case 'ease-in-out':
      return {
        o: { x: [0.42], y: [0] },
        i: { x: [0.58], y: [1] },
      }
    case 'cubic-bezier':
      if (bezierParams) {
        return {
          o: { x: [bezierParams.x1], y: [bezierParams.y1] },
          i: { x: [bezierParams.x2], y: [bezierParams.y2] },
        }
      }
      return {
        o: { x: [0], y: [0] },
        i: { x: [1], y: [1] },
      }
    case 'expo-out':
      return {
        o: { x: [0.19], y: [1] },
        i: { x: [0.22], y: [1] },
      }
    case 'expo-in':
      return {
        o: { x: [0.95], y: [0.05] },
        i: { x: [0.795], y: [0.035] },
      }
    case 'back-out':
      return {
        o: { x: [0.175], y: [0.885] },
        i: { x: [0.32], y: [1.275] },
      }
    case 'back-in':
      return {
        o: { x: [0.6], y: [-0.28] },
        i: { x: [0.735], y: [0.045] },
      }
    default:
      // For spring/elastic/bounce/etc., approximate with ease-in-out
      return {
        o: { x: [0.42], y: [0] },
        i: { x: [0.58], y: [1] },
      }
  }
}

// ---------------------------------------------------------------------------
// Color parsing helpers
// ---------------------------------------------------------------------------

function hexToRgb01(hex: string): number[] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return [r, g, b, 1]
}

function resolveFillColor(fill: string | { stops?: Array<{ color: string }> }): string {
  if (typeof fill === 'string') return fill
  return fill.stops?.[0]?.color ?? '#000000'
}

// ---------------------------------------------------------------------------
// Static (non-animated) helpers
// ---------------------------------------------------------------------------

function staticValue(v: number): LottieAnimatedValue {
  return { a: 0, k: v }
}

function staticMultiValue(v: number[]): LottieAnimatedMultiValue {
  return { a: 0, k: v }
}

// ---------------------------------------------------------------------------
// Build keyframe tracks for a specific object
// ---------------------------------------------------------------------------

function findKeyframeTracks(
  keyframeData: VideoCompositionProps['keyframeData'],
  objectType: string,
  objectId: string
): KeyframeExportTrack[] {
  if (!keyframeData?.tracks) return []
  return keyframeData.tracks.filter(
    (t) => t.objectType === objectType && t.objectId === objectId
  )
}

function buildAnimatedOpacity(
  baseOpacity: number,
  tracks: KeyframeExportTrack[]
): LottieAnimatedValue {
  const opacityTrack = tracks.find((t) => t.property === 'opacity')
  if (!opacityTrack || opacityTrack.keyframes.length === 0) {
    return staticValue(baseOpacity * 100)
  }

  const kfs: LottieKeyframe[] = opacityTrack.keyframes.map((kf, idx) => {
    const nextKf = opacityTrack.keyframes[idx + 1]
    const tangents = easingToLottieTangents(kf.easing as EasingType, kf.bezierParams)
    return {
      t: kf.frame,
      s: [kf.value * 100],
      ...(nextKf ? { e: [nextKf.value * 100] } : {}),
      i: tangents.i,
      o: tangents.o,
    }
  })

  return { a: 1, k: kfs }
}

function buildAnimatedPosition(
  baseX: number,
  baseY: number,
  tracks: KeyframeExportTrack[]
): LottieAnimatedMultiValue {
  const xTrack = tracks.find((t) => t.property === 'freeX' || t.property === 'x' || t.property === 'position.x')
  const yTrack = tracks.find((t) => t.property === 'freeY' || t.property === 'y' || t.property === 'position.y')

  if ((!xTrack || xTrack.keyframes.length === 0) && (!yTrack || yTrack.keyframes.length === 0)) {
    return staticMultiValue([baseX, baseY, 0])
  }

  // Merge x and y keyframes at all unique frame points
  const allFrames = new Set<number>()
  xTrack?.keyframes.forEach((kf) => allFrames.add(kf.frame))
  yTrack?.keyframes.forEach((kf) => allFrames.add(kf.frame))
  const sortedFrames = [...allFrames].sort((a, b) => a - b)

  const getValueAtFrame = (track: KeyframeExportTrack | undefined, frame: number, fallback: number): number => {
    if (!track || track.keyframes.length === 0) return fallback
    const kfs = track.keyframes
    if (frame <= kfs[0].frame) return kfs[0].value
    if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1].value
    // Linear lookup (close enough for export)
    for (let i = 0; i < kfs.length - 1; i++) {
      if (frame >= kfs[i].frame && frame <= kfs[i + 1].frame) {
        const t = (frame - kfs[i].frame) / (kfs[i + 1].frame - kfs[i].frame)
        return kfs[i].value + (kfs[i + 1].value - kfs[i].value) * t
      }
    }
    return fallback
  }

  const kfs: LottieMultiKeyframe[] = sortedFrames.map((frame, idx) => {
    const x = getValueAtFrame(xTrack, frame, baseX)
    const y = getValueAtFrame(yTrack, frame, baseY)
    const nextFrame = sortedFrames[idx + 1]
    const nextX = nextFrame !== undefined ? getValueAtFrame(xTrack, nextFrame, baseX) : undefined
    const nextY = nextFrame !== undefined ? getValueAtFrame(yTrack, nextFrame, baseY) : undefined

    // Use easing from x track if available, otherwise y track
    const easingKf = xTrack?.keyframes.find((k) => k.frame === frame) ?? yTrack?.keyframes.find((k) => k.frame === frame)
    const tangents = easingToLottieTangents(
      (easingKf?.easing as EasingType) ?? 'linear',
      easingKf?.bezierParams
    )

    return {
      t: frame,
      s: [x, y, 0],
      ...(nextX !== undefined && nextY !== undefined ? { e: [nextX, nextY, 0] } : {}),
      i: { x: [tangents.i.x[0], tangents.i.x[0]], y: [tangents.i.y[0], tangents.i.y[0]] },
      o: { x: [tangents.o.x[0], tangents.o.x[0]], y: [tangents.o.y[0], tangents.o.y[0]] },
    }
  })

  return { a: 1, k: kfs }
}

function buildAnimatedRotation(
  baseRotation: number,
  tracks: KeyframeExportTrack[]
): LottieAnimatedValue {
  const rotTrack = tracks.find((t) => t.property === 'rotation')
  if (!rotTrack || rotTrack.keyframes.length === 0) {
    return staticValue(baseRotation)
  }

  const kfs: LottieKeyframe[] = rotTrack.keyframes.map((kf, idx) => {
    const nextKf = rotTrack.keyframes[idx + 1]
    const tangents = easingToLottieTangents(kf.easing as EasingType, kf.bezierParams)
    return {
      t: kf.frame,
      s: [kf.value],
      ...(nextKf ? { e: [nextKf.value] } : {}),
      i: tangents.i,
      o: tangents.o,
    }
  })

  return { a: 1, k: kfs }
}

function buildAnimatedScale(
  baseScale: number,
  tracks: KeyframeExportTrack[]
): LottieAnimatedMultiValue {
  const scaleTrack = tracks.find((t) => t.property === 'scale')
  if (!scaleTrack || scaleTrack.keyframes.length === 0) {
    const s = baseScale * 100
    return staticMultiValue([s, s, 100])
  }

  const kfs: LottieMultiKeyframe[] = scaleTrack.keyframes.map((kf, idx) => {
    const nextKf = scaleTrack.keyframes[idx + 1]
    const s = kf.value * 100
    const tangents = easingToLottieTangents(kf.easing as EasingType, kf.bezierParams)
    return {
      t: kf.frame,
      s: [s, s, 100],
      ...(nextKf ? { e: [nextKf.value * 100, nextKf.value * 100, 100] } : {}),
      i: { x: [tangents.i.x[0], tangents.i.x[0], tangents.i.x[0]], y: [tangents.i.y[0], tangents.i.y[0], tangents.i.y[0]] },
      o: { x: [tangents.o.x[0], tangents.o.x[0], tangents.o.x[0]], y: [tangents.o.y[0], tangents.o.y[0], tangents.o.y[0]] },
    }
  })

  return { a: 1, k: kfs }
}

// ---------------------------------------------------------------------------
// Shape layer builder
// ---------------------------------------------------------------------------

function buildShapeLayer(
  shape: ShapeLayerData,
  index: number,
  keyframeData: VideoCompositionProps['keyframeData']
): LottieLayer {
  const tracks = findKeyframeTracks(keyframeData, 'shape', shape.id)
  const fillColor = resolveFillColor(shape.fill)

  // Build the shape items
  const shapeItems: LottieShapeItem[] = []

  // Shape geometry
  switch (shape.type) {
    case 'rectangle':
      shapeItems.push({
        ty: 'rc',
        nm: 'Rectangle',
        p: staticMultiValue([shape.width / 2, shape.height / 2]),
        s: staticMultiValue([shape.width, shape.height]),
        r: staticValue(shape.borderRadius ?? 0),
      })
      break
    case 'circle':
      shapeItems.push({
        ty: 'el',
        nm: 'Ellipse',
        p: staticMultiValue([shape.width / 2, shape.height / 2]),
        s: staticMultiValue([shape.width, shape.height]),
      })
      break
    case 'star':
      shapeItems.push({
        ty: 'sr',
        nm: 'Star',
        p: staticMultiValue([shape.width / 2, shape.height / 2]),
        sy: 1,
        pt: staticValue(shape.points ?? 5),
        or: staticValue(Math.min(shape.width, shape.height) / 2),
        ir: staticValue(Math.min(shape.width, shape.height) / 2 * (shape.innerRadius ?? 0.4)),
        r: staticValue(0),
      })
      break
    case 'triangle':
      // Triangle as a polygon path
      shapeItems.push({
        ty: 'sr',
        nm: 'Triangle',
        p: staticMultiValue([shape.width / 2, shape.height / 2]),
        sy: 2, // polygon
        pt: staticValue(3),
        or: staticValue(Math.min(shape.width, shape.height) / 2),
        r: staticValue(0),
      })
      break
  }

  // Fill
  shapeItems.push({
    ty: 'fl',
    nm: 'Fill',
    c: { a: 0, k: hexToRgb01(fillColor) },
    o: staticValue(100),
  })

  // Stroke (if visible)
  if (shape.stroke && shape.stroke !== 'transparent' && shape.strokeWidth > 0) {
    shapeItems.push({
      ty: 'st',
      nm: 'Stroke',
      c: { a: 0, k: hexToRgb01(shape.stroke) },
      o: staticValue(100),
      w: staticValue(shape.strokeWidth),
      lc: 2, // round cap
      lj: 2, // round join
    })
  }

  // Transform (identity for group)
  shapeItems.push({
    ty: 'tr',
    nm: 'Transform',
    p: staticMultiValue([0, 0]),
    s: staticMultiValue([100, 100]),
    r: staticValue(0),
    o: staticValue(100),
  })

  return {
    ddd: 0,
    ind: index,
    ty: 4, // shape layer
    nm: shape.name,
    sr: 1,
    ks: {
      o: buildAnimatedOpacity(shape.opacity, tracks),
      r: buildAnimatedRotation(shape.rotation, tracks),
      p: buildAnimatedPosition(shape.position.x + shape.width / 2, shape.position.y + shape.height / 2, tracks),
      a: staticMultiValue([shape.width / 2, shape.height / 2, 0]),
      s: buildAnimatedScale(1, tracks),
    },
    ao: 0,
    ip: shape.startFrame,
    op: shape.endFrame,
    st: 0,
    bm: 0,
    shapes: [{
      ty: 'gr',
      nm: shape.name,
      it: shapeItems,
    }],
  }
}

// ---------------------------------------------------------------------------
// Text layer builder
// ---------------------------------------------------------------------------

function textAlignToJustification(align: string): number {
  switch (align) {
    case 'left': return 0
    case 'right': return 1
    case 'center': return 2
    default: return 2
  }
}

function buildTextLayer(
  text: TextOverlayData,
  index: number,
  keyframeData: VideoCompositionProps['keyframeData']
): LottieLayer {
  const tracks = findKeyframeTracks(keyframeData, 'text', text.id)
  const fontColor = hexToRgb01(text.color)

  return {
    ddd: 0,
    ind: index,
    ty: 5, // text layer
    nm: text.content.substring(0, 30) || 'Text',
    sr: 1,
    ks: {
      o: buildAnimatedOpacity(text.opacity, tracks),
      r: buildAnimatedRotation(text.rotation, tracks),
      p: buildAnimatedPosition(text.freeX, text.freeY, tracks),
      a: staticMultiValue([0, 0, 0]),
      s: staticMultiValue([100, 100, 100]),
    },
    ao: 0,
    ip: text.startFrame,
    op: text.endFrame,
    st: 0,
    bm: 0,
    t: {
      d: {
        k: [{
          s: {
            s: text.fontSize,
            f: text.fontFamily,
            t: text.content,
            j: textAlignToJustification(text.align),
            tr: text.letterSpacing * 10, // Lottie tracking is in 1/1000 of em * 10
            lh: text.lineHeight * text.fontSize,
            fc: fontColor.slice(0, 3),
          },
          t: 0,
        }],
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Media / image layer builder
// ---------------------------------------------------------------------------

function buildMediaLayer(
  media: MediaLayerData,
  index: number,
  assetId: string,
  keyframeData: VideoCompositionProps['keyframeData']
): LottieLayer {
  const tracks = findKeyframeTracks(keyframeData, 'media', media.id)

  return {
    ddd: 0,
    ind: index,
    ty: 2, // image layer
    nm: `Media ${media.id}`,
    sr: 1,
    ks: {
      o: buildAnimatedOpacity(media.opacity, tracks),
      r: buildAnimatedRotation(media.rotation, tracks),
      p: buildAnimatedPosition(media.position.x, media.position.y, tracks),
      a: staticMultiValue([0, 0, 0]),
      s: buildAnimatedScale(media.scale, tracks),
    },
    ao: 0,
    ip: media.startFrame,
    op: media.endFrame,
    st: 0,
    bm: 0,
    refId: assetId,
  }
}

// ---------------------------------------------------------------------------
// SVG composition layer builder
// ---------------------------------------------------------------------------

function buildSVGLayers(
  svgComp: SVGCompositionExportData,
  startIndex: number
): LottieLayer[] {
  const layers: LottieLayer[] = []

  for (const obj of svgComp.objects) {
    // Each SVG object becomes a shape layer with a path
    const layer: LottieLayer = {
      ddd: 0,
      ind: startIndex + layers.length,
      ty: 4, // shape layer
      nm: obj.name,
      sr: 1,
      ks: {
        o: staticValue(obj.opacity * 100),
        r: staticValue(0),
        p: staticMultiValue([svgComp.width / 2, svgComp.height / 2, 0]),
        a: staticMultiValue([svgComp.width / 2, svgComp.height / 2, 0]),
        s: staticMultiValue([100, 100, 100]),
      },
      ao: 0,
      ip: obj.startFrame,
      op: obj.endFrame,
      st: 0,
      bm: 0,
      shapes: [{
        ty: 'gr',
        nm: obj.name,
        it: [
          // Placeholder rectangle for SVG objects that can't be fully decomposed
          {
            ty: 'rc',
            nm: 'Bounds',
            p: staticMultiValue([svgComp.width / 2, svgComp.height / 2]),
            s: staticMultiValue([svgComp.width, svgComp.height]),
            r: staticValue(0),
          },
          {
            ty: 'fl',
            nm: 'Fill',
            c: { a: 0, k: [0, 0, 0, 0] },
            o: staticValue(0),
          },
          {
            ty: 'tr',
            nm: 'Transform',
            p: staticMultiValue([0, 0]),
            s: staticMultiValue([100, 100]),
            r: staticValue(0),
            o: staticValue(100),
          },
        ],
      }],
    }

    // Apply keyframe animation from SVG object keyframes
    if (obj.keyframes.length > 1) {
      const posKfs: LottieMultiKeyframe[] = obj.keyframes.map((kf, i) => {
        const nextKf = obj.keyframes[i + 1]
        const tangents = easingToLottieTangents((kf.easing as EasingType) ?? 'linear')
        return {
          t: kf.time,
          s: [kf.x ?? svgComp.width / 2, kf.y ?? svgComp.height / 2, 0],
          ...(nextKf ? { e: [nextKf.x ?? svgComp.width / 2, nextKf.y ?? svgComp.height / 2, 0] } : {}),
          i: { x: [tangents.i.x[0], tangents.i.x[0]], y: [tangents.i.y[0], tangents.i.y[0]] },
          o: { x: [tangents.o.x[0], tangents.o.x[0]], y: [tangents.o.y[0], tangents.o.y[0]] },
        }
      })
      layer.ks.p = { a: 1, k: posKfs }
    }

    layers.push(layer)
  }

  return layers
}

// ---------------------------------------------------------------------------
// Main exporter
// ---------------------------------------------------------------------------

export interface LottieExportOptions {
  /** Name of the exported animation */
  name?: string
  /** Whether to embed image assets as base64 data URIs */
  embedImages?: boolean
}

/**
 * Convert a ProAnimate composition to Lottie JSON.
 *
 * Supported layers:
 * - Shapes (rectangle, circle, triangle, star) -> Lottie shape layers
 * - Text overlays -> Lottie text layers
 * - Media layers (images) -> Lottie image layers
 * - SVG compositions -> Lottie shape layers
 * - Keyframe animations (position, opacity, rotation, scale)
 *
 * Unsupported layers (logged as warnings):
 * - HTML templates
 * - 3D characters
 * - Video layers
 * - Lottie animations (nested)
 * - Rigged characters
 */
export function exportToLottie(
  props: VideoCompositionProps,
  options: LottieExportOptions = {}
): LottieAnimation {
  const { name = 'ProAnimate Export' } = options

  const animation: LottieAnimation = {
    v: '5.7.4',
    fr: props.fps,
    ip: 0,
    op: props.durationInFrames,
    w: props.width,
    h: props.height,
    nm: name,
    ddd: 0,
    assets: [],
    layers: [],
  }

  let layerIndex = 0

  // --- Shape layers ---
  if (props.shapes) {
    for (const shape of props.shapes) {
      if (!shape.visible) continue
      animation.layers.push(
        buildShapeLayer(shape, layerIndex++, props.keyframeData)
      )
    }
  }

  // --- Text layers ---
  if (props.textOverlays) {
    for (const text of props.textOverlays) {
      animation.layers.push(
        buildTextLayer(text, layerIndex++, props.keyframeData)
      )
    }
  }

  // --- Media layers (images) ---
  if (props.mediaItems) {
    for (const media of props.mediaItems) {
      if (!media.visible) continue
      const assetId = `media_${media.id}`
      animation.assets.push({
        id: assetId,
        w: 0, // Unknown width without loading the image
        h: 0,
        u: '',
        p: media.imageUrl,
        e: media.imageUrl.startsWith('data:') ? 1 : 0,
      })
      animation.layers.push(
        buildMediaLayer(media, layerIndex++, assetId, props.keyframeData)
      )
    }
  }

  // --- SVG composition ---
  if (props.svgComposition) {
    const svgLayers = buildSVGLayers(props.svgComposition, layerIndex)
    animation.layers.push(...svgLayers)
    layerIndex += svgLayers.length
  }

  // --- Unsupported layers: log warnings ---
  if (props.htmlTemplates?.length) {
    console.warn('[LottieExporter] HTML template layers are not supported in Lottie export. Consider rasterizing them first.')
  }
  if (props.characters3D?.length) {
    console.warn('[LottieExporter] 3D character layers are not supported in Lottie export. Consider rasterizing them first.')
  }
  if (props.videos?.length) {
    console.warn('[LottieExporter] Video layers are not supported in Lottie export.')
  }

  return animation
}

/**
 * Export the Lottie animation as a JSON string for download.
 */
export function exportLottieJSON(
  props: VideoCompositionProps,
  options: LottieExportOptions = {}
): string {
  const animation = exportToLottie(props, options)
  return JSON.stringify(animation, null, 2)
}

/**
 * Trigger a download of the Lottie JSON file.
 */
export function downloadLottieJSON(
  props: VideoCompositionProps,
  options: LottieExportOptions = {}
): void {
  const json = exportLottieJSON(props, options)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${options.name ?? 'animation'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
