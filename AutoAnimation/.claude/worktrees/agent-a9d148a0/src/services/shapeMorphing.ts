/**
 * Shape Morphing Service
 *
 * SVG path interpolation between shapes using a flubber-like algorithm.
 * Converts basic shape types (rectangle, circle, triangle, star) into SVG path
 * strings and interpolates between them for smooth morphing transitions.
 *
 * The algorithm:
 * 1. Convert shape definitions to SVG path `d` strings
 * 2. Resample both paths to the same number of points
 * 3. Interpolate point-by-point between the two paths at a given `t` (0..1)
 */

import type { ShapeType } from '@/types/shapes'

// ---------------------------------------------------------------------------
// Shape to SVG path conversion
// ---------------------------------------------------------------------------

interface Point {
  x: number
  y: number
}

/**
 * Generate an SVG path string for a basic shape.
 */
export function shapeToPath(
  type: ShapeType,
  width: number,
  height: number,
  options?: {
    borderRadius?: number
    points?: number       // star points
    innerRadius?: number  // star inner radius ratio 0-1
  }
): string {
  switch (type) {
    case 'rectangle':
      return rectanglePath(width, height, options?.borderRadius ?? 0)
    case 'circle':
      return ellipsePath(width, height)
    case 'triangle':
      return trianglePath(width, height)
    case 'star':
      return starPath(width, height, options?.points ?? 5, options?.innerRadius ?? 0.4)
    default:
      return rectanglePath(width, height, 0)
  }
}

function rectanglePath(w: number, h: number, r: number): string {
  r = Math.min(r, Math.min(w, h) / 2)
  if (r <= 0) {
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`
  }
  return [
    `M ${r} 0`,
    `L ${w - r} 0`,
    `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `L ${r} ${h}`,
    `Q 0 ${h} 0 ${h - r}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    'Z',
  ].join(' ')
}

function ellipsePath(w: number, h: number): string {
  const cx = w / 2
  const cy = h / 2
  const rx = w / 2
  const ry = h / 2
  // Approximate ellipse with 4 cubic bezier arcs (kappa = 0.5522847498)
  const k = 0.5522847498
  const kx = rx * k
  const ky = ry * k

  return [
    `M ${cx} ${cy - ry}`,
    `C ${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}`,
    `C ${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}`,
    `C ${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}`,
    `C ${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}`,
    'Z',
  ].join(' ')
}

function trianglePath(w: number, h: number): string {
  return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`
}

function starPath(w: number, h: number, numPoints: number, innerRadiusRatio: number): string {
  const cx = w / 2
  const cy = h / 2
  const outerR = Math.min(w, h) / 2
  const innerR = outerR * innerRadiusRatio
  const pts: string[] = []

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI * i) / numPoints - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
  }
  pts.push('Z')

  return pts.join(' ')
}

// ---------------------------------------------------------------------------
// Path parsing and resampling
// ---------------------------------------------------------------------------

/**
 * Parse an SVG path `d` string into an array of points.
 * Supports M, L, Q, C, and Z commands.
 */
export function parsePath(d: string): Point[] {
  const points: Point[] = []
  const commands = d.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/gi) || []

  let currentX = 0
  let currentY = 0

  for (const cmd of commands) {
    const type = cmd.charAt(0)
    const nums = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)

    switch (type.toUpperCase()) {
      case 'M':
        currentX = nums[0]
        currentY = nums[1]
        points.push({ x: currentX, y: currentY })
        break
      case 'L':
        currentX = nums[0]
        currentY = nums[1]
        points.push({ x: currentX, y: currentY })
        break
      case 'Q': {
        // Quadratic bezier: sample intermediate points
        const qx1 = nums[0], qy1 = nums[1]
        const qx2 = nums[2], qy2 = nums[3]
        for (let t = 0.25; t <= 1; t += 0.25) {
          const x = (1 - t) * (1 - t) * currentX + 2 * (1 - t) * t * qx1 + t * t * qx2
          const y = (1 - t) * (1 - t) * currentY + 2 * (1 - t) * t * qy1 + t * t * qy2
          points.push({ x, y })
        }
        currentX = qx2
        currentY = qy2
        break
      }
      case 'C': {
        // Cubic bezier: sample intermediate points
        const cx1 = nums[0], cy1 = nums[1]
        const cx2 = nums[2], cy2 = nums[3]
        const cx3 = nums[4], cy3 = nums[5]
        for (let t = 0.2; t <= 1; t += 0.2) {
          const u = 1 - t
          const x = u * u * u * currentX + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * cx3
          const y = u * u * u * currentY + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * cy3
          points.push({ x, y })
        }
        currentX = cx3
        currentY = cy3
        break
      }
      case 'Z':
        // Close path - already handled by the implicit return to start
        break
    }
  }

  return points
}

/**
 * Resample a path's points to a target count using linear interpolation.
 * This ensures both paths have the same number of points for morphing.
 */
export function resamplePoints(points: Point[], targetCount: number): Point[] {
  if (points.length === 0) return []
  if (points.length === targetCount) return [...points]
  if (points.length === 1) {
    return Array(targetCount).fill(null).map(() => ({ ...points[0] }))
  }

  // Calculate total path length
  const distances: number[] = [0]
  let totalLength = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    totalLength += Math.sqrt(dx * dx + dy * dy)
    distances.push(totalLength)
  }

  if (totalLength === 0) {
    return Array(targetCount).fill(null).map(() => ({ ...points[0] }))
  }

  // Resample at equal intervals
  const result: Point[] = []
  for (let i = 0; i < targetCount; i++) {
    const targetDist = (i / (targetCount - 1)) * totalLength

    // Find the segment containing this distance
    let segIdx = 0
    for (let j = 1; j < distances.length; j++) {
      if (distances[j] >= targetDist) {
        segIdx = j - 1
        break
      }
      segIdx = j - 1
    }

    const segLen = distances[segIdx + 1] - distances[segIdx]
    const t = segLen > 0 ? (targetDist - distances[segIdx]) / segLen : 0

    result.push({
      x: points[segIdx].x + (points[segIdx + 1].x - points[segIdx].x) * t,
      y: points[segIdx].y + (points[segIdx + 1].y - points[segIdx].y) * t,
    })
  }

  return result
}

// ---------------------------------------------------------------------------
// Path interpolation (morphing)
// ---------------------------------------------------------------------------

/**
 * Interpolate between two SVG path `d` strings at parameter `t` (0..1).
 * Returns a new SVG path `d` string.
 *
 * Both paths are resampled to the same number of points so that
 * they can be interpolated point-by-point.
 *
 * @param pathA - Source SVG path `d` string (t=0)
 * @param pathB - Target SVG path `d` string (t=1)
 * @param t - Interpolation parameter (0 = pathA, 1 = pathB)
 * @param numPoints - Number of points to resample to (default: 64)
 */
export function interpolatePaths(
  pathA: string,
  pathB: string,
  t: number,
  numPoints: number = 64
): string {
  if (t <= 0) return pathA
  if (t >= 1) return pathB

  const pointsA = resamplePoints(parsePath(pathA), numPoints)
  const pointsB = resamplePoints(parsePath(pathB), numPoints)

  if (pointsA.length === 0 || pointsB.length === 0) return pathA

  // Interpolate each point
  const interpolated: Point[] = pointsA.map((pA, i) => {
    const pB = pointsB[i]
    return {
      x: pA.x + (pB.x - pA.x) * t,
      y: pA.y + (pB.y - pA.y) * t,
    }
  })

  // Build path from interpolated points
  if (interpolated.length === 0) return pathA

  const parts = [`M ${interpolated[0].x.toFixed(2)} ${interpolated[0].y.toFixed(2)}`]
  for (let i = 1; i < interpolated.length; i++) {
    parts.push(`L ${interpolated[i].x.toFixed(2)} ${interpolated[i].y.toFixed(2)}`)
  }
  parts.push('Z')

  return parts.join(' ')
}

/**
 * Create a morph interpolator function that caches the resampled points.
 * More efficient when interpolating the same pair of paths multiple times.
 *
 * @param pathA - Source SVG path `d` string
 * @param pathB - Target SVG path `d` string
 * @param numPoints - Number of resampling points
 * @returns A function (t: number) => string that returns the interpolated path
 */
export function createMorphInterpolator(
  pathA: string,
  pathB: string,
  numPoints: number = 64
): (t: number) => string {
  const pointsA = resamplePoints(parsePath(pathA), numPoints)
  const pointsB = resamplePoints(parsePath(pathB), numPoints)

  return (t: number): string => {
    if (t <= 0) return pathA
    if (t >= 1) return pathB

    if (pointsA.length === 0 || pointsB.length === 0) return pathA

    const parts = []
    for (let i = 0; i < pointsA.length; i++) {
      const x = pointsA[i].x + (pointsB[i].x - pointsA[i].x) * t
      const y = pointsA[i].y + (pointsB[i].y - pointsA[i].y) * t
      parts.push(i === 0
        ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
        : `L ${x.toFixed(2)} ${y.toFixed(2)}`)
    }
    parts.push('Z')

    return parts.join(' ')
  }
}

/**
 * Create a morph interpolator between two ProAnimate shape types.
 * Convenience wrapper that converts shape types to paths first.
 */
export function createShapeMorphInterpolator(
  sourceType: ShapeType,
  targetType: ShapeType,
  width: number,
  height: number,
  sourceOptions?: { borderRadius?: number; points?: number; innerRadius?: number },
  targetOptions?: { borderRadius?: number; points?: number; innerRadius?: number },
  numPoints: number = 64
): (t: number) => string {
  const pathA = shapeToPath(sourceType, width, height, sourceOptions)
  const pathB = shapeToPath(targetType, width, height, targetOptions)
  return createMorphInterpolator(pathA, pathB, numPoints)
}
