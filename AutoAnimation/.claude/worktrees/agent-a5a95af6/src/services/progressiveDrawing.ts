/**
 * Progressive Drawing Engine
 *
 * Walks along SVG paths point-by-point and renders using perfect-freehand
 * for realistic pen/chalk/marker strokes. Each frame advances the pen
 * position, accumulating drawn segments like a real drawing app.
 *
 * This is NOT stroke-dashoffset. The canvas is drawn to incrementally
 * at 60fps, producing a visible pen-tip-following-path effect.
 */

import { svgPathProperties as SVGPathProperties } from 'svg-path-properties'
import getStroke from 'perfect-freehand'

// ---------------------------------------------------------------------------
// Pen style presets
// ---------------------------------------------------------------------------

export interface PenStyle {
  /** Base stroke size in pixels */
  size: number
  /** Thinning: -1 to 1 (negative = thicker at pressure, positive = thinner) */
  thinning: number
  /** Smoothing: 0 to 1 */
  smoothing: number
  /** Streamline: 0 to 1 */
  streamline: number
  /** Whether to simulate pressure from velocity/curvature */
  simulatePressure: boolean
  /** Start taper length in pixels */
  taperStart: number
  /** End taper length in pixels */
  taperEnd: number
  /** Cap style for start */
  capStart: boolean
  /** Cap style for end */
  capEnd: boolean
}

export type PenTexture = 'none' | 'chalk' | 'grain'

export const PEN_PRESETS: Record<string, PenStyle & { texture?: PenTexture }> = {
  pen: {
    size: 4,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
    taperStart: 0,
    taperEnd: 20,
    capStart: true,
    capEnd: true,
  },
  marker: {
    size: 8,
    thinning: 0.1,
    smoothing: 0.6,
    streamline: 0.3,
    simulatePressure: false,
    taperStart: 0,
    taperEnd: 0,
    capStart: true,
    capEnd: true,
  },
  chalk: {
    size: 6,
    thinning: 0.3,
    smoothing: 0.4,
    streamline: 0.4,
    simulatePressure: true,
    taperStart: 5,
    taperEnd: 15,
    capStart: true,
    capEnd: true,
  },
  brush: {
    size: 12,
    thinning: 0.6,
    smoothing: 0.8,
    streamline: 0.5,
    simulatePressure: true,
    taperStart: 40,
    taperEnd: 20,
    capStart: true,
    capEnd: true,
  },
  glow: {
    size: 10,
    thinning: 0.7,
    smoothing: 0.7,
    streamline: 0.6,
    simulatePressure: true,
    taperStart: 30,
    taperEnd: 30,
    capStart: true,
    capEnd: true,
  },
  fine: {
    size: 2,
    thinning: 0.3,
    smoothing: 0.3,
    streamline: 0.7,
    simulatePressure: true,
    taperStart: 0,
    taperEnd: 10,
    capStart: true,
    capEnd: true,
  },
}

// ---------------------------------------------------------------------------
// Path sampling — walk along a path and collect points
// ---------------------------------------------------------------------------

export interface PathPoint {
  x: number
  y: number
  /** Tangent angle in radians at this point */
  angle: number
  /** Distance along the path (0 to totalLength) */
  distance: number
}

/**
 * Sample points along an SVG path at regular intervals.
 */
export function samplePath(pathD: string, stepSize: number = 2): PathPoint[] {
  const props = new SVGPathProperties(pathD)
  const totalLength = props.getTotalLength()
  if (totalLength < 1) return []

  const points: PathPoint[] = []
  for (let d = 0; d <= totalLength; d += stepSize) {
    const pt = props.getPointAtLength(d)
    const tan = props.getTangentAtLength(d)
    points.push({
      x: pt.x,
      y: pt.y,
      angle: Math.atan2(tan.y, tan.x),
      distance: d,
    })
  }

  // Ensure the last point is included
  const lastPt = props.getPointAtLength(totalLength)
  const lastTan = props.getTangentAtLength(totalLength)
  if (points.length === 0 || points[points.length - 1].distance < totalLength - 0.5) {
    points.push({ x: lastPt.x, y: lastPt.y, angle: Math.atan2(lastTan.y, lastTan.x), distance: totalLength })
  }

  return points
}

/**
 * Get the total length of an SVG path.
 */
export function getPathLength(pathD: string): number {
  try {
    const props = new SVGPathProperties(pathD)
    return props.getTotalLength()
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// Progressive drawing — render accumulated points to canvas
// ---------------------------------------------------------------------------

/**
 * Given a set of accumulated points (up to the current draw progress),
 * generate a perfect-freehand stroke outline and return the SVG path data
 * for the filled polygon.
 */
export function getStrokeOutlinePath(
  points: Array<[number, number]>,
  penStyle: PenStyle,
): string {
  if (points.length < 2) return ''

  const outlinePoints = getStroke(points, {
    size: penStyle.size,
    thinning: penStyle.thinning,
    smoothing: penStyle.smoothing,
    streamline: penStyle.streamline,
    simulatePressure: penStyle.simulatePressure,
    start: {
      taper: penStyle.taperStart,
      cap: penStyle.capStart,
    },
    end: {
      taper: penStyle.taperEnd,
      cap: penStyle.capEnd,
    },
  })

  if (outlinePoints.length < 2) return ''

  // Convert outline points to SVG path
  const [first, ...rest] = outlinePoints
  let d = `M ${first[0].toFixed(1)} ${first[1].toFixed(1)}`

  // Use quadratic curves through midpoints for smooth outline
  for (let i = 0; i < rest.length - 1; i++) {
    const cp = rest[i]
    const next = rest[i + 1]
    const mx = (cp[0] + next[0]) / 2
    const my = (cp[1] + next[1]) / 2
    d += ` Q ${cp[0].toFixed(1)} ${cp[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }

  // Close the path
  const last = rest[rest.length - 1]
  if (last) {
    d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`
  }
  d += ' Z'

  return d
}

/**
 * Generate chalk-texture SVG elements (scattered dots with varying opacity)
 * along the stroke points. This creates the grainy, dusty look of real chalk.
 *
 * Uses a seeded pseudo-random to ensure consistent texture per stroke
 * (doesn't flicker between frames).
 */
export function generateChalkTextureDots(
  points: Array<[number, number]>,
  color: string,
  size: number,
  seed: number = 0,
): string[] {
  const dots: string[] = []
  // Scale sampling density inversely with size — larger strokes need more dots
  const step = Math.max(1, size * 0.15)
  let rng = seed

  const random = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return (rng % 1000) / 1000
  }

  // Scale all parameters with size — larger values = bigger spread, dots, count
  const spread = size * 1.8
  const minDotR = Math.max(0.4, size * 0.08)
  const maxDotR = Math.max(1.5, size * 0.35)
  // More dots for larger strokes to fill the area
  const baseDotCount = Math.max(5, Math.round(size * 1.2))

  for (let i = 0; i < points.length; i += Math.max(1, Math.floor(step))) {
    const [px, py] = points[i]

    const dotCount = baseDotCount + Math.floor(random() * Math.max(2, size * 0.4))
    for (let d = 0; d < dotCount; d++) {
      const ox = (random() - 0.5) * spread
      const oy = (random() - 0.5) * spread
      const r = minDotR + random() * (maxDotR - minDotR)
      const opacity = 0.12 + random() * 0.38
      dots.push(
        `<circle cx="${(px + ox).toFixed(1)}" cy="${(py + oy).toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`
      )
    }
  }

  return dots
}

// ---------------------------------------------------------------------------
// Frame-based drawing state for a text item
// ---------------------------------------------------------------------------

export interface DrawingFrameResult {
  /** SVG path data for the drawn portion (filled polygon from perfect-freehand) */
  drawnPaths: string[]
  /** SVG markup for chalk texture dots */
  textureDots: string[]
  /** Current pen tip position (null if drawing is complete or not started) */
  penTip: { x: number; y: number; angle: number } | null
  /** Overall progress 0-1 */
  progress: number
}

/**
 * Compute the drawing state for a single frame.
 *
 * @param charPaths  Array of SVG path `d` strings (one per character)
 * @param currentFrame  Current timeline frame
 * @param startFrame  Frame when drawing starts
 * @param framesPerChar  How many frames to spend drawing each character
 * @param penStyle  The pen style to use
 * @param sampledPaths  Pre-sampled path points (optional, computed if not provided)
 */
export function computeDrawingFrame(
  charPaths: string[],
  currentFrame: number,
  startFrame: number,
  framesPerChar: number,
  penStyle: PenStyle,
  sampledPaths?: PathPoint[][],
  texture?: PenTexture,
  color?: string,
): DrawingFrameResult {
  const drawnPaths: string[] = []
  const textureDots: string[] = []
  let penTip: DrawingFrameResult['penTip'] = null

  // Pre-sample all paths if not provided
  const allSampled = sampledPaths ?? charPaths.map((p) => samplePath(p, Math.max(1, penStyle.size * 0.5)))

  const gapFrames = Math.max(1, Math.round(framesPerChar * 0.1))
  let charStart = startFrame
  const totalChars = charPaths.length
  let completedChars = 0

  for (let i = 0; i < allSampled.length; i++) {
    const points = allSampled[i]
    if (points.length === 0) {
      charStart += framesPerChar + gapFrames
      continue
    }

    const elapsed = currentFrame - charStart

    if (elapsed < 0) {
      // Not started yet
      charStart += framesPerChar + gapFrames
      continue
    }

    const progress = Math.min(1, elapsed / Math.max(1, framesPerChar))

    // How many sampled points to include
    const pointCount = Math.max(1, Math.round(progress * points.length))
    const visiblePoints = points.slice(0, pointCount)

    // Convert to [x, y] pairs for perfect-freehand
    const inputPoints: Array<[number, number]> = visiblePoints.map((p) => [p.x, p.y])

    // Generate the filled stroke outline
    const strokePath = getStrokeOutlinePath(inputPoints, penStyle)
    if (strokePath) {
      drawnPaths.push(strokePath)
    }

    // Generate chalk/grain texture dots
    if (texture === 'chalk' && color && inputPoints.length > 1) {
      // Scale texture with both pen size and point density
      // For large text, points are spread further apart so we need bigger/more dots
      const avgSpacing = inputPoints.length > 1
        ? Math.hypot(inputPoints[inputPoints.length - 1][0] - inputPoints[0][0], inputPoints[inputPoints.length - 1][1] - inputPoints[0][1]) / inputPoints.length
        : 1
      const textureSize = Math.max(penStyle.size, avgSpacing * 0.8)
      const dots = generateChalkTextureDots(inputPoints, color, textureSize, i * 12345)
      textureDots.push(...dots)
    }

    // Set pen tip to current drawing position
    if (progress < 1 && visiblePoints.length > 0) {
      const tip = visiblePoints[visiblePoints.length - 1]
      penTip = { x: tip.x, y: tip.y, angle: tip.angle }
    }

    if (progress >= 1) completedChars++
    charStart += framesPerChar + gapFrames
  }

  const overallProgress = totalChars > 0 ? completedChars / totalChars : 1

  return { drawnPaths, textureDots, penTip, progress: overallProgress }
}
