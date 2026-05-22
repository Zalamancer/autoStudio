/**
 * Path animation system — elements following curved paths.
 *
 * Supports:
 * - Cubic bezier paths (4 control points)
 * - Quadratic bezier paths (3 control points)
 * - Catmull-Rom splines (smooth through all points)
 * - Circular/elliptical arcs
 * - Figure-eight / lemniscate
 * - Custom SVG-like paths
 *
 * Returns position + tangent angle at any progress t in [0, 1].
 */

// ── Types ─────────────────────────────────────────────────────────────

export interface Point2D {
  x: number
  y: number
}

export interface PathResult {
  /** Position on the path */
  x: number
  y: number
  /** Tangent angle in degrees (for auto-rotation) */
  angle: number
  /** Progress along the path (0..1) */
  progress: number
}

export type PathType =
  | 'linear'
  | 'quadratic-bezier'
  | 'cubic-bezier'
  | 'catmull-rom'
  | 'arc'
  | 'ellipse'
  | 'figure-eight'
  | 'spiral'

export interface PathConfig {
  type: PathType
  /** Control points — meaning varies by path type */
  points: Point2D[]
  /** Whether to auto-rotate element to follow path tangent */
  autoRotate?: boolean
  /** Additional rotation offset in degrees */
  rotationOffset?: number
  /** For arc/ellipse: radii */
  radiusX?: number
  radiusY?: number
  /** For arc: start/end angle in degrees */
  startAngle?: number
  endAngle?: number
  /** For spiral: number of turns */
  turns?: number
  /** Whether path is closed (loops back to start) */
  closed?: boolean
}

// ── Core Path Evaluation ──────────────────────────────────────────────

/**
 * Evaluate position and tangent on a path at progress t (0..1).
 */
export function evaluatePath(t: number, config: PathConfig): PathResult {
  const clampedT = Math.max(0, Math.min(1, t))

  switch (config.type) {
    case 'linear':
      return linearPath(clampedT, config.points)
    case 'quadratic-bezier':
      return quadraticBezierPath(clampedT, config.points)
    case 'cubic-bezier':
      return cubicBezierPath(clampedT, config.points)
    case 'catmull-rom':
      return catmullRomPath(clampedT, config.points, config.closed ?? false)
    case 'arc':
      return arcPath(clampedT, config)
    case 'ellipse':
      return ellipsePath(clampedT, config)
    case 'figure-eight':
      return figureEightPath(clampedT, config)
    case 'spiral':
      return spiralPath(clampedT, config)
    default:
      return { x: 0, y: 0, angle: 0, progress: clampedT }
  }
}

/**
 * Evaluate path at a specific frame.
 */
export function evaluatePathAtFrame(
  frame: number,
  startFrame: number,
  durationFrames: number,
  config: PathConfig,
): PathResult {
  const t = durationFrames > 0 ? (frame - startFrame) / durationFrames : 0
  return evaluatePath(t, config)
}

// ── Path Implementations ──────────────────────────────────────────────

/** Linear interpolation through multiple points */
function linearPath(t: number, points: Point2D[]): PathResult {
  if (points.length < 2) {
    const p = points[0] ?? { x: 0, y: 0 }
    return { x: p.x, y: p.y, angle: 0, progress: t }
  }

  const segments = points.length - 1
  const segmentT = t * segments
  const segIdx = Math.min(Math.floor(segmentT), segments - 1)
  const localT = segmentT - segIdx

  const p0 = points[segIdx]
  const p1 = points[segIdx + 1]

  const x = p0.x + (p1.x - p0.x) * localT
  const y = p0.y + (p1.y - p0.y) * localT
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI)

  return { x, y, angle, progress: t }
}

/** Quadratic bezier (3 points: start, control, end) */
function quadraticBezierPath(t: number, points: Point2D[]): PathResult {
  const p0 = points[0] ?? { x: 0, y: 0 }
  const p1 = points[1] ?? { x: 0, y: 0 }
  const p2 = points[2] ?? { x: 0, y: 0 }

  const mt = 1 - t
  const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x
  const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y

  // Tangent (derivative)
  const dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
  const dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return { x, y, angle, progress: t }
}

/** Cubic bezier (4 points: start, cp1, cp2, end) */
function cubicBezierPath(t: number, points: Point2D[]): PathResult {
  const p0 = points[0] ?? { x: 0, y: 0 }
  const p1 = points[1] ?? { x: 0, y: 0 }
  const p2 = points[2] ?? { x: 0, y: 0 }
  const p3 = points[3] ?? { x: 0, y: 0 }

  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t

  const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x
  const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y

  // Tangent
  const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x)
  const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return { x, y, angle, progress: t }
}

/** Catmull-Rom spline — smooth curve through all points */
function catmullRomPath(t: number, points: Point2D[], closed: boolean): PathResult {
  if (points.length < 2) {
    const p = points[0] ?? { x: 0, y: 0 }
    return { x: p.x, y: p.y, angle: 0, progress: t }
  }

  const n = closed ? points.length : points.length - 1
  const segmentT = t * n
  const segIdx = Math.min(Math.floor(segmentT), n - 1)
  const localT = segmentT - segIdx

  // Get 4 surrounding points (with wrapping for closed paths)
  const getPoint = (i: number) => {
    if (closed) {
      return points[((i % points.length) + points.length) % points.length]
    }
    return points[Math.max(0, Math.min(i, points.length - 1))]
  }

  const p0 = getPoint(segIdx - 1)
  const p1 = getPoint(segIdx)
  const p2 = getPoint(segIdx + 1)
  const p3 = getPoint(segIdx + 2)

  // Catmull-Rom interpolation
  const tt = localT
  const tt2 = tt * tt
  const tt3 = tt2 * tt

  const x = 0.5 * (
    (2 * p1.x) +
    (-p0.x + p2.x) * tt +
    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt2 +
    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tt3
  )
  const y = 0.5 * (
    (2 * p1.y) +
    (-p0.y + p2.y) * tt +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tt3
  )

  // Tangent (derivative of Catmull-Rom)
  const dx = 0.5 * (
    (-p0.x + p2.x) +
    (4 * p0.x - 10 * p1.x + 8 * p2.x - 2 * p3.x) * tt +
    (-3 * p0.x + 9 * p1.x - 9 * p2.x + 3 * p3.x) * tt2
  )
  const dy = 0.5 * (
    (-p0.y + p2.y) +
    (4 * p0.y - 10 * p1.y + 8 * p2.y - 2 * p3.y) * tt +
    (-3 * p0.y + 9 * p1.y - 9 * p2.y + 3 * p3.y) * tt2
  )
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return { x, y, angle, progress: t }
}

/** Circular arc */
function arcPath(t: number, config: PathConfig): PathResult {
  const cx = config.points[0]?.x ?? 0
  const cy = config.points[0]?.y ?? 0
  const r = config.radiusX ?? 100
  const startAngle = ((config.startAngle ?? 0) * Math.PI) / 180
  const endAngle = ((config.endAngle ?? 360) * Math.PI) / 180

  const currentAngle = startAngle + (endAngle - startAngle) * t
  const x = cx + Math.cos(currentAngle) * r
  const y = cy + Math.sin(currentAngle) * r
  const tangentAngle = (currentAngle + Math.PI / 2) * (180 / Math.PI)

  return { x, y, angle: tangentAngle, progress: t }
}

/** Elliptical path */
function ellipsePath(t: number, config: PathConfig): PathResult {
  const cx = config.points[0]?.x ?? 0
  const cy = config.points[0]?.y ?? 0
  const rx = config.radiusX ?? 100
  const ry = config.radiusY ?? 60

  const angle = t * Math.PI * 2
  const x = cx + Math.cos(angle) * rx
  const y = cy + Math.sin(angle) * ry

  // Tangent of ellipse
  const dx = -Math.sin(angle) * rx
  const dy = Math.cos(angle) * ry
  const tangentAngle = Math.atan2(dy, dx) * (180 / Math.PI)

  return { x, y, angle: tangentAngle, progress: t }
}

/** Figure-eight (lemniscate of Bernoulli) */
function figureEightPath(t: number, config: PathConfig): PathResult {
  const cx = config.points[0]?.x ?? 0
  const cy = config.points[0]?.y ?? 0
  const rx = config.radiusX ?? 100
  const ry = config.radiusY ?? 50

  const angle = t * Math.PI * 2
  const sinA = Math.sin(angle)
  const cosA = Math.cos(angle)
  const denom = 1 + sinA * sinA

  const x = cx + (rx * cosA) / denom
  const y = cy + (ry * sinA * cosA) / denom

  // Approximate tangent via finite difference
  const dt = 0.001
  const angle2 = (t + dt) * Math.PI * 2
  const sinA2 = Math.sin(angle2)
  const cosA2 = Math.cos(angle2)
  const denom2 = 1 + sinA2 * sinA2
  const x2 = cx + (rx * cosA2) / denom2
  const y2 = cy + (ry * sinA2 * cosA2) / denom2
  const tangentAngle = Math.atan2(y2 - y, x2 - x) * (180 / Math.PI)

  return { x, y, angle: tangentAngle, progress: t }
}

/** Spiral (Archimedean) */
function spiralPath(t: number, config: PathConfig): PathResult {
  const cx = config.points[0]?.x ?? 0
  const cy = config.points[0]?.y ?? 0
  const maxRadius = config.radiusX ?? 100
  const turns = config.turns ?? 3

  const angle = t * Math.PI * 2 * turns
  const radius = maxRadius * t
  const x = cx + Math.cos(angle) * radius
  const y = cy + Math.sin(angle) * radius

  // Approximate tangent
  const dt = 0.001
  const t2 = Math.min(1, t + dt)
  const angle2 = t2 * Math.PI * 2 * turns
  const radius2 = maxRadius * t2
  const x2 = cx + Math.cos(angle2) * radius2
  const y2 = cy + Math.sin(angle2) * radius2
  const tangentAngle = Math.atan2(y2 - y, x2 - x) * (180 / Math.PI)

  return { x, y, angle: tangentAngle, progress: t }
}

// ── Path Presets ───────────────────────────────────────────────────────

/**
 * Pre-built path configurations for common animation motions.
 * Coordinates are in canvas-relative pixels; caller should offset as needed.
 */
export const PathPresets = {
  /** Gentle S-curve from left to right */
  sCurve: (width: number, height: number): PathConfig => ({
    type: 'cubic-bezier',
    points: [
      { x: 0, y: height * 0.5 },
      { x: width * 0.33, y: height * 0.2 },
      { x: width * 0.66, y: height * 0.8 },
      { x: width, y: height * 0.5 },
    ],
  }),

  /** Circular orbit around center */
  orbit: (cx: number, cy: number, radius: number): PathConfig => ({
    type: 'ellipse',
    points: [{ x: cx, y: cy }],
    radiusX: radius,
    radiusY: radius,
  }),

  /** Bouncing arc from point A to point B */
  bouncingArc: (from: Point2D, to: Point2D): PathConfig => {
    const midX = (from.x + to.x) / 2
    const peakY = Math.min(from.y, to.y) - Math.abs(to.x - from.x) * 0.4
    return {
      type: 'quadratic-bezier',
      points: [from, { x: midX, y: peakY }, to],
    }
  },

  /** Figure-eight loop */
  figureEight: (cx: number, cy: number, size: number): PathConfig => ({
    type: 'figure-eight',
    points: [{ x: cx, y: cy }],
    radiusX: size,
    radiusY: size * 0.5,
  }),

  /** Expanding spiral */
  spiral: (cx: number, cy: number, size: number, turns = 3): PathConfig => ({
    type: 'spiral',
    points: [{ x: cx, y: cy }],
    radiusX: size,
    turns,
  }),

  /** Zigzag path across screen */
  zigzag: (width: number, height: number, segments = 5): PathConfig => {
    const points: Point2D[] = []
    for (let i = 0; i <= segments; i++) {
      points.push({
        x: (i / segments) * width,
        y: i % 2 === 0 ? height * 0.3 : height * 0.7,
      })
    }
    return { type: 'linear', points }
  },

  /** Smooth wave path */
  wave: (width: number, height: number, waves = 3): PathConfig => {
    const points: Point2D[] = []
    const numPoints = waves * 4 + 1
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: (i / (numPoints - 1)) * width,
        y: height * 0.5 + Math.sin((i / (numPoints - 1)) * Math.PI * 2 * waves) * height * 0.2,
      })
    }
    return { type: 'catmull-rom', points }
  },
} as const

// ── Arc-Length Utilities ───────────────────────────────────────────────

/**
 * Get the total length of a path by sampling at N points and summing segment distances.
 */
export function getPathLength(config: PathConfig, samples = 100): number {
  let length = 0
  let prev = evaluatePath(0, config)
  for (let i = 1; i <= samples; i++) {
    const t = i / samples
    const curr = evaluatePath(t, config)
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    length += Math.sqrt(dx * dx + dy * dy)
    prev = curr
  }
  return length
}

/**
 * Evaluate the path at arc-length-uniform t.
 * Maps a uniform t (0..1) to arc-length-parameterized t before calling evaluatePath().
 * This produces constant-speed motion along the path.
 */
export function evaluatePathArcLength(
  t: number,
  config: PathConfig,
  samples = 100,
): PathResult {
  // Build cumulative arc-length lookup table
  const lengths: number[] = [0]
  let prev = evaluatePath(0, config)
  for (let i = 1; i <= samples; i++) {
    const st = i / samples
    const curr = evaluatePath(st, config)
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy))
    prev = curr
  }

  const totalLength = lengths[samples]
  if (totalLength === 0) return evaluatePath(0, config)

  const targetLength = Math.max(0, Math.min(1, t)) * totalLength

  // Binary search for the sample index
  let lo = 0
  let hi = samples
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (lengths[mid] < targetLength) lo = mid + 1
    else hi = mid
  }

  const segIdx = Math.max(0, lo - 1)
  const segLen = lengths[segIdx + 1] - lengths[segIdx]
  const frac = segLen > 0 ? (targetLength - lengths[segIdx]) / segLen : 0
  const uniformT = (segIdx + frac) / samples

  return evaluatePath(uniformT, config)
}

/**
 * Convert any PathConfig to an SVG <path d="..."> string for rendering.
 * For cubic-bezier, this maps directly to SVG C command.
 * For other types, sample the path and output L segments.
 */
export function pathToSVGPath(config: PathConfig, samples = 80): string {
  const pts = config.points

  // Direct SVG mapping for cubic bezier
  if (config.type === 'cubic-bezier' && pts.length >= 4) {
    return `M ${pts[0].x} ${pts[0].y} C ${pts[1].x} ${pts[1].y} ${pts[2].x} ${pts[2].y} ${pts[3].x} ${pts[3].y}`
  }

  // Direct SVG mapping for quadratic bezier
  if (config.type === 'quadratic-bezier' && pts.length >= 3) {
    return `M ${pts[0].x} ${pts[0].y} Q ${pts[1].x} ${pts[1].y} ${pts[2].x} ${pts[2].y}`
  }

  // Direct SVG mapping for linear
  if (config.type === 'linear' && pts.length >= 2) {
    const parts = [`M ${pts[0].x} ${pts[0].y}`]
    for (let i = 1; i < pts.length; i++) {
      parts.push(`L ${pts[i].x} ${pts[i].y}`)
    }
    return parts.join(' ')
  }

  // For all other types, sample the path
  const segments: string[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const result = evaluatePath(t, config)
    if (i === 0) {
      segments.push(`M ${result.x.toFixed(2)} ${result.y.toFixed(2)}`)
    } else {
      segments.push(`L ${result.x.toFixed(2)} ${result.y.toFixed(2)}`)
    }
  }

  if (config.closed) {
    segments.push('Z')
  }

  return segments.join(' ')
}
