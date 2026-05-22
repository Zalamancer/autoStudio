// ── Pen Tool / Custom Vector Path Types ──

export interface AnchorPoint {
  /** Unique identifier */
  id: string
  /** Position on canvas (world-space) */
  x: number
  y: number
  /** Control handle for the incoming curve (relative to anchor) */
  handleIn: { x: number; y: number } | null
  /** Control handle for the outgoing curve (relative to anchor) */
  handleOut: { x: number; y: number } | null
  /** Whether this is a smooth (auto-linked handles) or corner node */
  type: 'smooth' | 'corner'
}

export interface VectorPath {
  id: string
  name: string
  /** Ordered list of anchor points */
  anchors: AnchorPoint[]
  /** Whether the path is closed (loop) */
  closed: boolean
  /** Stroke color */
  stroke: string
  /** Stroke width */
  strokeWidth: number
  /** Fill color (only for closed paths, empty string = no fill) */
  fill: string
  /** Opacity 0-1 */
  opacity: number
  /** Position offset on canvas */
  position: { x: number; y: number }
  /** Rotation in degrees */
  rotation: number
  /** Scale multiplier */
  scale: { x: number; y: number }
  /** Z-index for layer ordering */
  zIndex: number
  /** Visibility */
  visible: boolean
  /** Frame range */
  startFrame: number
  endFrame: number
  /** Stroke line cap */
  lineCap: 'butt' | 'round' | 'square'
  /** Stroke line join */
  lineJoin: 'miter' | 'round' | 'bevel'
  /** Stroke dash array (empty = solid) */
  dashArray: number[]
}

/**
 * Convert a VectorPath's anchors into an SVG path `d` attribute string.
 */
export function anchorsToSVGPath(anchors: AnchorPoint[], closed: boolean): string {
  if (anchors.length === 0) return ''
  if (anchors.length === 1) {
    const p = anchors[0]
    return `M ${p.x} ${p.y}`
  }

  const parts: string[] = []
  const first = anchors[0]
  parts.push(`M ${first.x} ${first.y}`)

  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1]
    const curr = anchors[i]

    const hasHandleOut = prev.handleOut && (prev.handleOut.x !== 0 || prev.handleOut.y !== 0)
    const hasHandleIn = curr.handleIn && (curr.handleIn.x !== 0 || curr.handleIn.y !== 0)

    if (hasHandleOut || hasHandleIn) {
      // Cubic bezier curve
      const cp1x = prev.x + (prev.handleOut?.x || 0)
      const cp1y = prev.y + (prev.handleOut?.y || 0)
      const cp2x = curr.x + (curr.handleIn?.x || 0)
      const cp2y = curr.y + (curr.handleIn?.y || 0)
      parts.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`)
    } else {
      // Straight line
      parts.push(`L ${curr.x} ${curr.y}`)
    }
  }

  if (closed && anchors.length > 2) {
    const last = anchors[anchors.length - 1]
    const hasHandleOut = last.handleOut && (last.handleOut.x !== 0 || last.handleOut.y !== 0)
    const hasHandleIn = first.handleIn && (first.handleIn.x !== 0 || first.handleIn.y !== 0)

    if (hasHandleOut || hasHandleIn) {
      const cp1x = last.x + (last.handleOut?.x || 0)
      const cp1y = last.y + (last.handleOut?.y || 0)
      const cp2x = first.x + (first.handleIn?.x || 0)
      const cp2y = first.y + (first.handleIn?.y || 0)
      parts.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y}`)
    }
    parts.push('Z')
  }

  return parts.join(' ')
}

/**
 * Create a new anchor point with a unique ID.
 */
export function createAnchor(
  x: number,
  y: number,
  type: 'smooth' | 'corner' = 'corner'
): AnchorPoint {
  return {
    id: `anchor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x,
    y,
    handleIn: null,
    handleOut: null,
    type,
  }
}
