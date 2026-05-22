/**
 * SVG-native rigging service.
 *
 * Works with SVG elements directly (paths, groups, rects, etc.) rather than
 * rasterising to a triangle mesh. Each meaningful SVG element gets bone weights
 * and is transformed imperatively via `setAttribute('transform', ...)`.
 */

import type {
  BoneSkeleton,
  BonePose,
  SkinWeight,
  SVGElementBinding,
  SVGElementSkinning,
} from '@/types/rig'
import {
  computeJointWorldPositions,
  getBoneSegment,
  type JointWorldState,
} from './forwardKinematics'

// ── SVG Parsing ──────────────────────────────────────────────────────

/** Decode a `data:image/svg+xml;base64,…` URL to a raw SVG XML string. */
export function decodeSvgDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/svg\+xml;base64,(.+)$/)
  if (!match) {
    // Maybe it's a plain data URL (not base64) or already raw XML
    const plainMatch = dataUrl.match(/^data:image\/svg\+xml,(.+)$/)
    if (plainMatch) return decodeURIComponent(plainMatch[1])
    // Assume it's already raw SVG XML
    return dataUrl
  }
  return atob(match[1])
}

/** Information about a single parsed SVG element. */
export interface ParsedSVGElement {
  /** Stable ID assigned to the element (injected into the SVG DOM) */
  elementId: string
  /** Original SVG tag name */
  tagName: string
  /** User-friendly label (from id/class attribute or auto-generated) */
  label: string
  /** Bounding box center X in SVG user coordinates (approximate) */
  centerX: number
  /** Bounding box center Y in SVG user coordinates (approximate) */
  centerY: number
}

export interface ParsedSVGResult {
  /** SVG XML string with stable IDs injected */
  svgSource: string
  /** Extracted meaningful elements */
  elements: ParsedSVGElement[]
  /** Width from the SVG viewBox or width attribute */
  svgWidth: number
  /** Height from the SVG viewBox or height attribute */
  svgHeight: number
}

/** Tags we skip when collecting meaningful elements. */
const SKIP_TAGS = new Set([
  'svg',
  'defs',
  'style',
  'title',
  'desc',
  'metadata',
  'clipPath',
  'mask',
  'filter',
  'linearGradient',
  'radialGradient',
  'pattern',
  'symbol',
  'use',         // <use> references another element — don't double-bind
  'stop',
  'feGaussianBlur',
  'feOffset',
  'feMerge',
  'feMergeNode',
  'feFlood',
  'feComposite',
  'feBlend',
  'feColorMatrix',
])

/** Tags that are always "meaningful" shape elements. */
const SHAPE_TAGS = new Set([
  'path',
  'rect',
  'circle',
  'ellipse',
  'polygon',
  'polyline',
  'line',
  'text',
  'image',
])

/**
 * Parse an SVG XML string, assign stable IDs to meaningful elements, and
 * return the annotated SVG source along with element metadata.
 *
 * "Meaningful" = shape elements (path, rect, circle, …) and <g> groups
 * that aren't purely structural (defs, clipPath, etc.).
 *
 * NOTE: This runs in the browser so we can use DOMParser. Bbox centers are
 * estimated from attribute parsing (not getBBox) — real pivots should be
 * computed after mounting in the renderer.
 */
export function parseSvgElements(svgXml: string): ParsedSVGResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgXml, 'image/svg+xml')
  const svgRoot = doc.documentElement

  // Dimensions from viewBox or width/height attributes
  let svgWidth = 0
  let svgHeight = 0
  const viewBox = svgRoot.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number)
    if (parts.length >= 4) {
      svgWidth = parts[2]
      svgHeight = parts[3]
    }
  }
  if (!svgWidth) svgWidth = parseFloat(svgRoot.getAttribute('width') || '0')
  if (!svgHeight) svgHeight = parseFloat(svgRoot.getAttribute('height') || '0')

  const elements: ParsedSVGElement[] = []
  let counter = 0

  function walk(node: Element, depth: number) {
    const tag = node.tagName.toLowerCase()
    if (SKIP_TAGS.has(tag)) return

    const isShape = SHAPE_TAGS.has(tag)
    const isGroup = tag === 'g'

    if (isShape || isGroup) {
      // Assign stable ID if missing
      let elId = node.getAttribute('id') || ''
      if (!elId) {
        elId = `svg-el-${counter++}`
        node.setAttribute('id', elId)
      } else {
        // Ensure uniqueness
        if (elements.some((e) => e.elementId === elId)) {
          elId = `${elId}-${counter++}`
          node.setAttribute('id', elId)
        }
      }

      // Build label from id, class, or tag+index
      const className = node.getAttribute('class') || ''
      const label =
        node.getAttribute('id') ||
        (className ? `${tag}.${className.split(' ')[0]}` : `${tag} #${counter}`)

      // Estimate center from attributes (rough — real bbox comes from DOM later)
      const { cx, cy } = estimateCenter(node, tag, svgWidth, svgHeight)

      elements.push({
        elementId: elId,
        tagName: tag,
        label,
        centerX: cx,
        centerY: cy,
      })
    }

    // Recurse into children (even for groups — we want nested shapes too)
    for (let i = 0; i < node.children.length; i++) {
      walk(node.children[i], depth + 1)
    }
  }

  walk(svgRoot, 0)

  // Serialize back to string (with injected IDs)
  const serializer = new XMLSerializer()
  const svgSource = serializer.serializeToString(svgRoot)

  return { svgSource, elements, svgWidth, svgHeight }
}

/**
 * Rough center estimate from SVG element attributes.
 * Real pivots should be computed via `getBBox()` after DOM mount.
 */
function estimateCenter(
  node: Element,
  tag: string,
  _svgW: number,
  _svgH: number
): { cx: number; cy: number } {
  const attr = (name: string) => parseFloat(node.getAttribute(name) || '0')

  switch (tag) {
    case 'circle':
      return { cx: attr('cx'), cy: attr('cy') }
    case 'ellipse':
      return { cx: attr('cx'), cy: attr('cy') }
    case 'rect':
      return { cx: attr('x') + attr('width') / 2, cy: attr('y') + attr('height') / 2 }
    case 'line':
      return { cx: (attr('x1') + attr('x2')) / 2, cy: (attr('y1') + attr('y2')) / 2 }
    case 'image':
      return { cx: attr('x') + attr('width') / 2, cy: attr('y') + attr('height') / 2 }
    default:
      // For path, polygon, polyline, text, g — we can't easily compute a center
      // from attributes alone. Return (0,0); the renderer will update via getBBox.
      return { cx: 0, cy: 0 }
  }
}

// ── Auto Weight Computation ──────────────────────────────────────────

/**
 * Auto-compute skinning weights for SVG elements based on their center's
 * distance to bone segments.  Mirrors the logic in meshDeformer's
 * `computeSkinningWeights` but operates on element centers instead of
 * mesh vertices.
 */
export function computeElementSkinningWeights(
  elements: ParsedSVGElement[],
  skeleton: BoneSkeleton,
  svgWidth: number,
  svgHeight: number,
  influenceRadius?: number
): SVGElementSkinning {
  // Default influence radius scales with SVG size
  if (influenceRadius === undefined) {
    const diag = Math.sqrt(svgWidth ** 2 + svgHeight ** 2)
    influenceRadius = Math.max(80, diag * 0.2)
  }

  // Build rest-pose world positions
  const restPose: BonePose = {}
  for (const joint of skeleton.joints) {
    restPose[joint.id] = { dx: 0, dy: 0, rotation: 0 }
  }
  const worldPositions = computeJointWorldPositions(skeleton, restPose, restPose)

  // Build bone segments
  const segments: { jointId: string; sx: number; sy: number; ex: number; ey: number }[] = []
  for (const joint of skeleton.joints) {
    const seg = getBoneSegment(joint.id, skeleton, worldPositions)
    if (seg) {
      segments.push({
        jointId: joint.id,
        sx: seg.startX,
        sy: seg.startY,
        ex: seg.endX,
        ey: seg.endY,
      })
    }
  }
  const rootWorld = worldPositions[skeleton.rootJointId]

  const bindings: SVGElementSkinning = []

  for (const el of elements) {
    const px = el.centerX
    const py = el.centerY

    // Distance to each bone segment
    const dists: { jointId: string; dist: number }[] = []
    for (const seg of segments) {
      const dist = pointToSegmentDistance(px, py, seg.sx, seg.sy, seg.ex, seg.ey)
      dists.push({ jointId: seg.jointId, dist })
    }
    // Root joint as point
    if (rootWorld && !dists.some((d) => d.jointId === skeleton.rootJointId)) {
      const dx = px - rootWorld.worldX
      const dy = py - rootWorld.worldY
      dists.push({ jointId: skeleton.rootJointId, dist: Math.sqrt(dx * dx + dy * dy) })
    }

    // Top 4 closest bones
    dists.sort((a, b) => a.dist - b.dist)
    const top = dists.slice(0, 4)

    // Cubic falloff (matches bonerigging core for consistent weight distribution)
    const weights: SkinWeight[] = []
    let total = 0
    for (const t of top) {
      const norm = Math.max(0, 1 - t.dist / influenceRadius!)
      const w = norm * norm * norm
      if (w > 0.001) {
        weights.push({ jointId: t.jointId, weight: w })
        total += w
      }
    }
    // Smooth fallback: use extended radius to avoid hard 100% snap
    if (total === 0 && top.length > 0) {
      const extRadius = influenceRadius! * 2.5
      for (const t of top) {
        const norm = Math.max(0, 1 - t.dist / extRadius)
        const w = norm * norm
        if (w > 0.0001) {
          weights.push({ jointId: t.jointId, weight: w })
          total += w
        }
      }
    }
    if (total > 0) {
      for (const sw of weights) sw.weight /= total
    } else if (top.length > 0) {
      weights.push({ jointId: top[0].jointId, weight: 1 })
    }

    bindings.push({
      elementId: el.elementId,
      tagName: el.tagName,
      label: el.label,
      weights,
      pivotX: px,
      pivotY: py,
    })
  }

  return bindings
}

// ── Per-Frame Transform Application ──────────────────────────────────

const DEG_TO_RAD = Math.PI / 180

/**
 * Compute the SVG `transform` attribute string for a single element binding.
 *
 * Uses Linear Blend Skinning:
 *   1. For each bone weight, compute the bone's world-space delta (position + rotation)
 *   2. Blend the position deltas and rotation deltas by weight
 *   3. Build a single `translate(…) rotate(…)` transform around the element's pivot
 */
export function computeElementTransform(
  binding: SVGElementBinding,
  restWorld: Record<string, JointWorldState>,
  curWorld: Record<string, JointWorldState>
): string {
  let blendedDx = 0
  let blendedDy = 0
  let blendedRot = 0

  for (const sw of binding.weights) {
    const rw = restWorld[sw.jointId]
    const cw = curWorld[sw.jointId]
    if (!rw || !cw) continue

    // Position delta of the joint
    const jdx = cw.worldX - rw.worldX
    const jdy = cw.worldY - rw.worldY
    // Rotation delta of the joint
    const jrot = cw.worldRotation - rw.worldRotation

    blendedDx += jdx * sw.weight
    blendedDy += jdy * sw.weight
    blendedRot += jrot * sw.weight
  }

  // If no movement, skip transform entirely (reduces DOM ops)
  if (
    Math.abs(blendedDx) < 0.01 &&
    Math.abs(blendedDy) < 0.01 &&
    Math.abs(blendedRot) < 0.01
  ) {
    return ''
  }

  const px = binding.pivotX
  const py = binding.pivotY

  // First translate to put the pivot at origin, rotate, translate back, then apply positional offset.
  // SVG transforms are applied right-to-left, so we list them left-to-right in application order:
  //   1. translate(blendedDx, blendedDy)          — move with bones
  //   2. translate(px, py) rotate(rot) translate(-px, -py)  — rotate around pivot
  //
  // Combined: translate(px+blendedDx, py+blendedDy) rotate(blendedRot) translate(-px, -py)

  return `translate(${px + blendedDx},${py + blendedDy}) rotate(${blendedRot}) translate(${-px},${-py})`
}

/**
 * Batch per-frame update: compute world positions once, then transform every element.
 *
 * @param elementRefs  Map of elementId → live SVGElement reference
 * @param bindings     Per-element skinning weights
 * @param skeleton     Bone skeleton
 * @param restPose     Rest pose
 * @param currentPose  Current (animated) pose
 */
export function applySvgElementTransforms(
  elementRefs: Map<string, SVGElement>,
  bindings: SVGElementSkinning,
  skeleton: BoneSkeleton,
  restPose: BonePose,
  currentPose: BonePose
): void {
  const restWorld = computeJointWorldPositions(skeleton, restPose, restPose)
  const curWorld = computeJointWorldPositions(skeleton, restPose, currentPose)

  for (const binding of bindings) {
    const el = elementRefs.get(binding.elementId)
    if (!el) continue

    const transform = computeElementTransform(binding, restWorld, curWorld)
    if (transform) {
      el.setAttribute('transform', transform)
    } else {
      el.removeAttribute('transform')
    }
  }
}

/**
 * Read live `getBBox()` for each bound element and update pivot points.
 * Must be called after the SVG is mounted in the DOM.
 *
 * Returns a new array of bindings with updated pivotX/pivotY, or null
 * if no elements were found.
 */
export function computeElementPivots(
  elementRefs: Map<string, SVGElement>,
  bindings: SVGElementSkinning
): SVGElementSkinning | null {
  let anyUpdated = false
  const updated: SVGElementSkinning = bindings.map((b) => {
    const el = elementRefs.get(b.elementId)
    if (!el || typeof (el as SVGGraphicsElement).getBBox !== 'function') return b

    try {
      const bbox = (el as SVGGraphicsElement).getBBox()
      const cx = bbox.x + bbox.width / 2
      const cy = bbox.y + bbox.height / 2
      // Only update if meaningfully different
      if (Math.abs(cx - b.pivotX) > 0.5 || Math.abs(cy - b.pivotY) > 0.5) {
        anyUpdated = true
        return { ...b, pivotX: cx, pivotY: cy }
      }
    } catch {
      // getBBox can throw for hidden elements
    }
    return b
  })

  return anyUpdated ? updated : null
}

// ── Utilities ────────────────────────────────────────────────────────

/** Distance from point (px, py) to line segment (sx, sy)→(ex, ey). */
function pointToSegmentDistance(
  px: number, py: number,
  sx: number, sy: number,
  ex: number, ey: number
): number {
  const dx = ex - sx
  const dy = ey - sy
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    const ddx = px - sx
    const ddy = py - sy
    return Math.sqrt(ddx * ddx + ddy * ddy)
  }
  let t = ((px - sx) * dx + (py - sy) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const closestX = sx + t * dx
  const closestY = sy + t * dy
  const ddx = px - closestX
  const ddy = py - closestY
  return Math.sqrt(ddx * ddx + ddy * ddy)
}

// Suppress unused import warning — DEG_TO_RAD is used in computeElementTransform
void DEG_TO_RAD
