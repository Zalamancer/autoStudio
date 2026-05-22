/**
 * Art Curve Generator — Swirling Gradient
 *
 * Generates a single shiny gradient curve that starts outside the canvas
 * and swirls inward. The tube has a 3D-like specular highlight (brighter
 * center, darker edges) combined with a head-to-tail color gradient.
 */

import type { ArtCurve, ArtCurveStyle } from '@/types/artCurves'
import { hexToRgb, rgbToHex } from '@/utils/color'

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────

function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Color helpers ─────────────────────────────────────────────────────────

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

/** Brighten a hex color (for specular highlight) */
function brighten(hex: string, factor = 0.5): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor)
}

/** Darken a hex color (for edge shading) */
function darken(hex: string, factor = 0.35): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor))
}

// ── Bezier helpers ───────────────────────────────────────────────────────

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

function cubicBezierPoint(
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
): [number, number] {
  return [cubicBezier(t, p0[0], p1[0], p2[0], p3[0]), cubicBezier(t, p0[1], p1[1], p2[1], p3[1])]
}

function cubicBezierTangent(
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
): [number, number] {
  const mt = 1 - t
  const dx = 3 * mt * mt * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
  const dy = 3 * mt * mt * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
  return [dx, dy]
}

/** Quadratic width interpolation: (1-t)^2 * start + 2(1-t)t * mid + t^2 * end */
export function widthAtT(t: number, start: number, mid: number, end: number): number {
  const mt = 1 - t
  return mt * mt * start + 2 * mt * t * mid + t * t * end
}

/** Convert a polyline into cubic bezier segments via Catmull-Rom interpolation */
function catmullRomToBezier(
  points: [number, number][],
  tension = 0.3,
): [[number, number], [number, number], [number, number], [number, number]][] {
  if (points.length < 2) return []

  const segments: [[number, number], [number, number], [number, number], [number, number]][] = []
  const padded = [points[0], ...points, points[points.length - 1]]

  for (let i = 0; i < padded.length - 3; i++) {
    const p0 = padded[i]
    const p1 = padded[i + 1]
    const p2 = padded[i + 2]
    const p3 = padded[i + 3]

    const cp1: [number, number] = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension]
    const cp2: [number, number] = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension]

    segments.push([p1, cp1, cp2, p2])
  }

  return segments
}

// ── Spine sampler ─────────────────────────────────────────────────────────

interface SpineSample {
  x: number
  y: number
  nx: number // perpendicular normal x
  ny: number // perpendicular normal y
  t: number // global t (0→1)
}

function sampleSpine(points: [number, number, number][], numSamples = 64): SpineSample[] {
  const pts2d = points.map(([x, y]) => [x, y] as [number, number])
  const segments = catmullRomToBezier(pts2d)
  if (segments.length === 0) return []

  const samples: SpineSample[] = []
  const totalSegments = segments.length
  const samplesPerSeg = Math.max(4, Math.ceil(numSamples / totalSegments))

  for (let seg = 0; seg < totalSegments; seg++) {
    const [p0, p1, p2, p3] = segments[seg]
    const steps = seg === totalSegments - 1 ? samplesPerSeg : samplesPerSeg - 1

    for (let i = 0; i <= steps; i++) {
      const localT = i / samplesPerSeg
      const globalT = (seg + localT) / totalSegments

      const [px, py] = cubicBezierPoint(localT, p0, p1, p2, p3)
      const [tx, ty] = cubicBezierTangent(localT, p0, p1, p2, p3)

      const len = Math.sqrt(tx * tx + ty * ty) || 1
      const nx = -ty / len
      const ny = tx / len

      samples.push({ x: px, y: py, nx, ny, t: globalT })
    }
  }

  return samples
}

// ── Shiny tube SVG builder ───────────────────────────────────────────────
//
// Each segment is rendered as 3 stacked quads:
//   1. Dark edge (full width) — bottom layer
//   2. Mid-tone body (80% width) — gradient base color
//   3. Bright specular highlight (30% width, centered) — top layer
//
// This creates a cylindrical/shiny tube appearance.

const NUM_SAMPLES = 80

function buildQuad(s0: SpineSample, s1: SpineSample, widthFraction: number, curve: ArtCurve): string {
  const w0 = (widthAtT(s0.t, curve.widthStart, curve.widthMid, curve.widthEnd) / 2) * widthFraction
  const w1 = (widthAtT(s1.t, curve.widthStart, curve.widthMid, curve.widthEnd) / 2) * widthFraction

  const l0x = s0.x + s0.nx * w0
  const l0y = s0.y + s0.ny * w0
  const r0x = s0.x - s0.nx * w0
  const r0y = s0.y - s0.ny * w0
  const l1x = s1.x + s1.nx * w1
  const l1y = s1.y + s1.ny * w1
  const r1x = s1.x - s1.nx * w1
  const r1y = s1.y - s1.ny * w1

  return `M${l0x.toFixed(1)},${l0y.toFixed(1)} L${l1x.toFixed(1)},${l1y.toFixed(1)} L${r1x.toFixed(1)},${r1y.toFixed(1)} L${r0x.toFixed(1)},${r0y.toFixed(1)}Z`
}

/** Number of wave groups for animation */
const WAVE_GROUPS = 12

function buildSnakeSVG(curve: ArtCurve, idPrefix: string, animated: boolean, curveIndex: number): string {
  const samples = sampleSpine(curve.points, NUM_SAMPLES)
  if (samples.length < 2) return ''

  const opacity = curve.opacity < 1 ? ` opacity="${curve.opacity}"` : ''
  const filter = curve.glow ? ` filter="url(#glow-${idPrefix})"` : ''

  const renderSegments = (startIdx: number, endIdx: number): string => {
    const parts: string[] = []
    for (let i = startIdx; i < endIdx && i < samples.length - 1; i++) {
      const s0 = samples[i]
      const s1 = samples[i + 1]
      const midT = (s0.t + s1.t) / 2
      const baseColor = lerpColor(curve.color, curve.colorEnd, midT)
      const edgeColor = darken(baseColor, 0.4)
      const highlightColor = brighten(baseColor, 0.6)

      // Layer 1: dark edge (full width)
      const dEdge = buildQuad(s0, s1, 1.0, curve)
      parts.push(`<path d="${dEdge}" fill="${edgeColor}" stroke="none"/>`)

      // Layer 2: base color body (80% width)
      const dBody = buildQuad(s0, s1, 0.8, curve)
      parts.push(`<path d="${dBody}" fill="${baseColor}" stroke="none"/>`)

      // Layer 3: specular highlight (30% width, brighter)
      const dHighlight = buildQuad(s0, s1, 0.3, curve)
      parts.push(`<path d="${dHighlight}" fill="${highlightColor}" stroke="none" opacity="0.7"/>`)
    }

    // Head cap
    if (startIdx === 0) {
      const head = samples[0]
      const headW = widthAtT(0, curve.widthStart, curve.widthMid, curve.widthEnd) / 2
      if (headW > 1) {
        const headHighlight = brighten(curve.color, 0.5)
        parts.push(
          `<circle cx="${head.x.toFixed(1)}" cy="${head.y.toFixed(1)}" r="${headW.toFixed(1)}" fill="${curve.color}"/>`,
        )
        parts.push(
          `<circle cx="${head.x.toFixed(1)}" cy="${head.y.toFixed(1)}" r="${(headW * 0.4).toFixed(1)}" fill="${headHighlight}" opacity="0.6"/>`,
        )
      }
    }

    // Tail cap
    if (endIdx >= samples.length - 1) {
      const tail = samples[samples.length - 1]
      const tailW = widthAtT(1, curve.widthStart, curve.widthMid, curve.widthEnd) / 2
      if (tailW > 0.5) {
        parts.push(
          `<circle cx="${tail.x.toFixed(1)}" cy="${tail.y.toFixed(1)}" r="${tailW.toFixed(1)}" fill="${curve.colorEnd}"/>`,
        )
      }
    }

    return parts.join('')
  }

  if (!animated) {
    return `<g${opacity}${filter}>${renderSegments(0, samples.length - 1)}</g>`
  }

  // ── Animated: split into wave groups for slithering ──
  const totalQuads = samples.length - 1
  const segsPerGroup = Math.ceil(totalQuads / WAVE_GROUPS)
  const groupParts: string[] = []

  for (let g = 0; g < WAVE_GROUPS; g++) {
    const startIdx = g * segsPerGroup
    const endIdx = Math.min(startIdx + segsPerGroup, totalQuads)
    if (startIdx >= totalQuads) break

    const delay = (g * 0.1).toFixed(2)
    const dur = (2.5 + curveIndex * 0.4).toFixed(2)

    groupParts.push(
      `<g class="wg-${idPrefix}" style="animation: slither-${idPrefix}-${g} ${dur}s ease-in-out infinite ${delay}s">${renderSegments(startIdx, endIdx)}</g>`,
    )
  }

  return `<g${opacity}${filter}>${groupParts.join('')}</g>`
}

/**
 * Generate CSS @keyframes for each wave group.
 * Each group oscillates perpendicular to its local curve direction.
 */
function buildWaveKeyframes(curves: ArtCurve[]): string {
  const rules: string[] = []

  curves.forEach((curve, ci) => {
    const idPrefix = `c${ci}`
    const samples = sampleSpine(curve.points, NUM_SAMPLES)
    if (samples.length < 2) return

    const totalQuads = samples.length - 1
    const segsPerGroup = Math.ceil(totalQuads / WAVE_GROUPS)

    for (let g = 0; g < WAVE_GROUPS; g++) {
      const startIdx = g * segsPerGroup
      const endIdx = Math.min(startIdx + segsPerGroup, totalQuads)
      if (startIdx >= totalQuads) break

      const midIdx = Math.min(Math.floor((startIdx + endIdx) / 2), samples.length - 1)
      const midSample = samples[midIdx]
      const groupT = midSample.t
      const ampEnvelope = Math.sin(groupT * Math.PI)
      const amp = 3 + ampEnvelope * 5
      const dx = (midSample.nx * amp).toFixed(2)
      const dy = (midSample.ny * amp).toFixed(2)

      rules.push(`@keyframes slither-${idPrefix}-${g} {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(${dx}px, ${dy}px); }
}`)
    }
  })

  return rules.join('\n')
}

// ── Public SVG builder ───────────────────────────────────────────────────

export function buildVariableWidthSVG(curves: ArtCurve[], width = 800, height = 600, animated = false): string {
  const hasGlow = curves.some((c) => c.glow)

  const defs: string[] = []

  if (hasGlow) {
    curves.forEach((curve, i) => {
      if (!curve.glow) return
      const glowColor = brighten(curve.color, 0.5)
      defs.push(`<filter id="glow-c${i}" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
  <feFlood flood-color="${glowColor}" flood-opacity="0.5" result="color"/>
  <feComposite in="color" in2="blur" operator="in" result="glow"/>
  <feMerge>
    <feMergeNode in="glow"/>
    <feMergeNode in="glow"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>`)
    })
  }

  const svgParts = curves.map((curve, i) => buildSnakeSVG(curve, `c${i}`, animated, i))

  const animStyles = animated ? `<style>${buildWaveKeyframes(curves)}</style>` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
  ${defs.length > 0 ? `<defs>${defs.join('\n')}</defs>` : ''}
  ${animStyles}
  ${svgParts.join('\n  ')}
</svg>`
}

// ── Swirl generator ─────────────────────────────────────────────────────
//
// Creates curves that start outside the canvas and spiral inward.
// An Archimedean spiral: r(θ) = a + b·θ  (decreasing from outer to inner)
// The origin can be offset to any edge/corner outside the canvas.

export interface ArtCurveGenOptions {
  style: ArtCurveStyle
  width: number
  height: number
  palette: string[]
  complexity: number
  seed: number
  animated: boolean
  widthStart: number
  widthMid: number
  widthEnd: number
}

export function generateArtCurves(opts: ArtCurveGenOptions): ArtCurve[] {
  return genSwirl(opts)
}

function genSwirl(opts: ArtCurveGenOptions): ArtCurve[] {
  const rand = mulberry32(opts.seed)
  const { width: W, height: H } = opts
  const cx = W / 2
  const cy = H / 2
  const count = Math.max(1, Math.floor(1 + opts.complexity * 0.4))
  const curves: ArtCurve[] = []

  for (let c = 0; c < count; c++) {
    // Pick a random entry edge (0=top, 1=right, 2=bottom, 3=left)
    const edge = Math.floor(rand() * 4)
    // Starting point well outside the canvas
    let startX: number, startY: number
    const overshoot = 120 + rand() * 80 // how far outside
    switch (edge) {
      case 0:
        startX = rand() * W
        startY = -overshoot
        break
      case 1:
        startX = W + overshoot
        startY = rand() * H
        break
      case 2:
        startX = rand() * W
        startY = H + overshoot
        break
      default:
        startX = -overshoot
        startY = rand() * H
        break
    }

    // Spiral parameters
    const totalRevolutions = 1.5 + rand() * 2.0 + opts.complexity * 0.15
    const totalAngle = totalRevolutions * Math.PI * 2
    const numPts = 20 + Math.floor(opts.complexity * 3)
    // Direction: clockwise or counter-clockwise
    const dir = rand() > 0.5 ? 1 : -1
    // Starting angle from center to the entry point
    const startAngle = Math.atan2(startY - cy, startX - cx)
    // Starting radius (distance from center to entry point)
    const startRadius = Math.sqrt((startX - cx) ** 2 + (startY - cy) ** 2)
    // End radius — somewhere near center with some randomness
    const endRadius = 15 + rand() * 60

    const points: [number, number, number][] = []
    for (let j = 0; j < numPts; j++) {
      const t = j / (numPts - 1)
      // Ease-in radius shrink — starts slow (wide arc outside), then tightens
      const easedT = t * t
      const radius = startRadius + (endRadius - startRadius) * easedT
      const angle = startAngle + dir * totalAngle * t
      const wobble = Math.sin(t * Math.PI * 6 + rand() * 4) * (8 + rand() * 12) * (1 - t)
      const x = cx + Math.cos(angle) * (radius + wobble)
      const y = cy + Math.sin(angle) * (radius + wobble)
      points.push([x, y, 0])
    }

    // Pick gradient colors from palette
    const headIdx = c % opts.palette.length
    const tailIdx = (headIdx + 1 + Math.floor(rand() * Math.max(1, opts.palette.length - 1))) % opts.palette.length
    const color = opts.palette[headIdx]
    const colorEnd = opts.palette[tailIdx]

    curves.push({
      id: `swirl-${c}`,
      points,
      widthStart: opts.widthStart * (1.2 + rand() * 0.4),
      widthMid: opts.widthMid * (1.0 + rand() * 0.5),
      widthEnd: opts.widthEnd * (0.2 + rand() * 0.3),
      color,
      colorEnd,
      opacity: 0.85 + rand() * 0.15,
      glow: true,
    })
  }

  return curves
}
