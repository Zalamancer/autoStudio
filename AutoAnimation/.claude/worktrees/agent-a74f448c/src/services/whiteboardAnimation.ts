/**
 * Whiteboard Animation Mode Service
 *
 * Provides SVG stroke-dashoffset reveal animation for whiteboard-style drawing
 * effects. Lines, shapes, and text appear to be "drawn" by an invisible pen,
 * with an optional animated hand/pen overlay that follows the drawing path.
 *
 * Key techniques:
 * - SVG stroke-dasharray + stroke-dashoffset for progressive path reveal
 * - Hand overlay sprite that follows the current draw position
 * - Frame-based animation for timeline integration
 * - Chalk/marker texture via SVG feTurbulence filters
 * - Handwriting-style cursive glyphs for natural text
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WhiteboardStroke {
  id: string
  /** SVG path `d` string for this stroke (used for freehand/shape strokes) */
  path: string
  /** Stroke color */
  color: string
  /** Stroke width in pixels */
  strokeWidth: number
  /** Frame when this stroke starts drawing */
  startFrame: number
  /** Frame when this stroke finishes drawing */
  endFrame: number
  /** Optional fill color (applied after stroke completes) */
  fill?: string
  /** Easing for the draw animation */
  /** Easing for the draw animation */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'ease-in-cubic' | 'ease-out-cubic' | 'ease-in-out-cubic' | 'ease-out-back' | 'ease-in-expo' | 'ease-out-expo' | 'custom'
  /** Custom cubic bezier control points [x1, y1, x2, y2] for easing='custom' */
  easingBezier?: [number, number, number, number]
  /** If set, renders as SVG <text> with stroke-dashoffset drawing animation */
  textContent?: string
  /** Font family for text strokes */
  fontFamily?: string
  /** Font size in pixels for text strokes */
  fontSize?: number
  /** X position for text strokes */
  textX?: number
  /** Y position for text strokes */
  textY?: number
  /** Font weight for text strokes */
  fontWeight?: string
  /** If true, this stroke acts as an eraser (renders in background color to "cut" through strokes below) */
  isEraser?: boolean
  /** Raw input points (stored so pen style changes can re-generate the path) */
  rawPoints?: Array<{ x: number; y: number }>
  /** Per-stroke pen style overrides */
  penStyle?: {
    size: number
    thinning: number
    smoothing: number
    streamline: number
    simulatePressure: boolean
    taperStart: number
    taperEnd: number
  }
}

/** Customizable properties for the drafting background overlay */
export interface DraftingConfig {
  /** Line color for all grid/arc/label elements */
  lineColor: string
  /** Background color of the drafting area */
  bgColor: string
  /** Overall line thickness multiplier (1 = default) */
  thicknessScale: number
  /** Overall opacity of all overlay elements (0-1) */
  opacity: number
  /** Grid density: number of minor divisions between major lines */
  gridDensity: number
  /** Whether to show the fine grid lines */
  showGrid: boolean
  /** Whether to show scale ruler marks and numbers */
  showScales: boolean
  /** Whether to show radial arcs from bottom center */
  showRadialCurves: boolean
  /** Whether to show the polar grid */
  showPolarGrid: boolean
  /** Whether to show concentric circle clusters */
  showConcentricCircles: boolean
  /** Whether to show test circles */
  showTestCircles: boolean
  /** Whether to show radiating lines */
  showRadiatingLines: boolean
  /** Whether to show the large arc */
  showLargeArc: boolean
  /** Whether to show labels/numbers on grids and arcs */
  showLabels: boolean
  /** Background gradient mode */
  gradientMode: 'none' | 'radial' | 'linear-top' | 'linear-left' | 'vignette'
  /** Gradient secondary color (mixed with bgColor) */
  gradientColor: string
  /** Margin size as fraction (0-0.1) */
  margin: number
}

export function createDefaultDraftingConfig(): DraftingConfig {
  return {
    lineColor: '#ffffff',
    bgColor: '#0f2e7a',
    thicknessScale: 1,
    opacity: 1,
    gridDensity: 5,
    showGrid: true,
    showScales: true,
    showRadialCurves: true,
    showPolarGrid: true,
    showConcentricCircles: true,
    showTestCircles: true,
    showRadiatingLines: true,
    showLargeArc: true,
    showLabels: true,
    gradientMode: 'none',
    gradientColor: '#061845',
    margin: 0.02,
  }
}

/** A single control exposed by a code background via addControl() */
export type BackgroundCodeControl =
  | { id: string; type: 'slider'; label: string; min: number; max: number; value: number; step?: number }
  | { id: string; type: 'color'; label: string; value: string }
  | { id: string; type: 'toggle'; label: string; value: boolean }
  | { id: string; type: 'text'; label: string; value: string }
  | { id: string; type: 'dropdown'; label: string; value: string; options: string[] }

export interface WhiteboardConfig {
  /** All strokes to be drawn in order */
  strokes: WhiteboardStroke[]
  /** Background color (default: transparent) */
  backgroundColor: string
  /** Background style identifier for special overlays like cutting-mat */
  backgroundStyle?: string
  /** Background type: 'preset' | 'image' | 'video' | 'code' */
  backgroundType: 'preset' | 'image' | 'video' | 'code'
  /** Data URL for uploaded image backgrounds */
  backgroundImageUrl?: string
  /** Data URL or blob URL for uploaded video backgrounds */
  backgroundVideoUrl?: string
  /** User-pasted JS code for code-based backgrounds */
  backgroundCode?: string
  /** Auto-generated controls from addControl() calls in backgroundCode */
  backgroundCodeControls?: BackgroundCodeControl[]
  /** CSS gradient string for gradient backgrounds */
  backgroundGradient?: string
  /** Whether to show a hand/pen overlay */
  showHand: boolean
  /** Hand overlay type */
  handType: 'pen' | 'marker' | 'chalk' | 'none'
  /** Hand overlay scale */
  handScale: number
  /** Drawing line cap style */
  lineCap: 'round' | 'butt' | 'square'
  /** Drawing line join style */
  lineJoin: 'round' | 'bevel' | 'miter'
  /** Drafting background configuration */
  draftingConfig?: DraftingConfig
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface WhiteboardFrameState {
  /** SVG markup for the current frame */
  svgMarkup: string
  /** Hand overlay position (null if hand is hidden or no active stroke) */
  handPosition: { x: number; y: number; angle: number } | null
  /** Progress of the current stroke (0-1) */
  currentStrokeProgress: number
  /** Index of the currently drawing stroke (-1 if none) */
  activeStrokeIndex: number
}

// ---------------------------------------------------------------------------
// Path length estimation
// ---------------------------------------------------------------------------

export function estimatePathLength(pathD: string): number {
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.style.visibility = 'hidden'

  const path = document.createElementNS(svgNS, 'path')
  path.setAttribute('d', pathD)
  svg.appendChild(path)
  document.body.appendChild(svg)

  const length = path.getTotalLength()
  document.body.removeChild(svg)

  return length
}

export function getPointAtFraction(
  pathD: string,
  fraction: number
): { x: number; y: number; angle: number } {
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.style.visibility = 'hidden'

  const path = document.createElementNS(svgNS, 'path')
  path.setAttribute('d', pathD)
  svg.appendChild(path)
  document.body.appendChild(svg)

  const totalLength = path.getTotalLength()
  const distance = totalLength * Math.max(0, Math.min(1, fraction))
  const point = path.getPointAtLength(distance)

  const delta = 0.5
  const pointBefore = path.getPointAtLength(Math.max(0, distance - delta))
  const pointAfter = path.getPointAtLength(Math.min(totalLength, distance + delta))
  const angle = Math.atan2(pointAfter.y - pointBefore.y, pointAfter.x - pointBefore.x) * (180 / Math.PI)

  document.body.removeChild(svg)

  return { x: point.x, y: point.y, angle }
}

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

/**
 * Evaluate a cubic bezier curve at parameter t using De Casteljau's algorithm.
 * Control points: (0,0), (x1,y1), (x2,y2), (1,1)
 */
function cubicBezierEasing(t: number, x1: number, y1: number, x2: number, y2: number): number {
  // Binary search for the t parameter that gives x = input t
  let lo = 0, hi = 1
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    const u = 1 - mid
    const xAtMid = 3 * u * u * mid * x1 + 3 * u * mid * mid * x2 + mid * mid * mid
    if (xAtMid < t) lo = mid
    else hi = mid
  }
  const s = (lo + hi) / 2
  const u = 1 - s
  return 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s
}

function applyWhiteboardEasing(t: number, easing?: WhiteboardStroke['easing'], bezier?: [number, number, number, number]): number {
  if (t <= 0) return 0
  if (t >= 1) return 1

  switch (easing) {
    case 'ease-in':
      return t * t
    case 'ease-out':
      return 1 - (1 - t) * (1 - t)
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
    case 'ease-in-cubic':
      return t * t * t
    case 'ease-out-cubic':
      return 1 - Math.pow(1 - t, 3)
    case 'ease-in-out-cubic':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    case 'ease-out-back': {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    }
    case 'ease-in-expo':
      return Math.pow(2, 10 * t - 10)
    case 'ease-out-expo':
      return 1 - Math.pow(2, -10 * t)
    case 'custom':
      if (bezier) return cubicBezierEasing(t, bezier[0], bezier[1], bezier[2], bezier[3])
      return t
    case 'linear':
    default:
      return t
  }
}

// ---------------------------------------------------------------------------
// SVG filter defs for chalk/marker texture
// ---------------------------------------------------------------------------

function getChalkFilterDefs(): string {
  return `<defs>
    <filter id="wb-chalk" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="5" result="grain"/>
      <feColorMatrix in="grain" type="saturate" values="0" result="grayGrain"/>
      <feComposite in="displaced" in2="grayGrain" operator="in" result="textured"/>
      <feGaussianBlur in="textured" stdDeviation="0.3" result="softened"/>
      <feMerge>
        <feMergeNode in="softened"/>
        <feMergeNode in="displaced"/>
      </feMerge>
    </filter>
    <filter id="wb-marker" x="-2%" y="-2%" width="104%" height="104%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="wb-pen" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="1" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`
}

function getFilterAttr(handType: WhiteboardConfig['handType']): string {
  switch (handType) {
    case 'chalk': return ' filter="url(#wb-chalk)"'
    case 'marker': return ' filter="url(#wb-marker)"'
    case 'pen': return ' filter="url(#wb-pen)"'
    default: return ''
  }
}

// ---------------------------------------------------------------------------
// Frame rendering
// ---------------------------------------------------------------------------

export function computeWhiteboardFrame(
  config: WhiteboardConfig,
  frame: number,
  canvasWidth: number,
  canvasHeight: number
): WhiteboardFrameState {
  const pathElements: string[] = []
  let handPosition: WhiteboardFrameState['handPosition'] = null
  let currentStrokeProgress = 0
  let activeStrokeIndex = -1
  const filterAttr = getFilterAttr(config.handType)

  for (let i = 0; i < config.strokes.length; i++) {
    const stroke = config.strokes[i]

    if (frame < stroke.startFrame) {
      continue
    }

    const totalFrames = stroke.endFrame - stroke.startFrame
    const elapsed = frame - stroke.startFrame
    const isText = !!stroke.textContent

    if (elapsed >= totalFrames) {
      // Stroke is complete
      if (isText) {
        // Completed text: show filled
        const escaped = escapeXml(stroke.textContent!)
        const ff = stroke.fontFamily ?? 'Permanent Marker'
        const fs = stroke.fontSize ?? 56
        const fw = stroke.fontWeight ?? 'bold'
        const tx = stroke.textX ?? canvasWidth / 2
        const ty = stroke.textY ?? canvasHeight / 2
        pathElements.push(
          `<text x="${tx}" y="${ty}" font-family="${ff}" font-size="${fs}" font-weight="${fw}" ` +
          `fill="${stroke.color}" text-anchor="middle" dominant-baseline="central"` +
          `${filterAttr} opacity="0.92">${escaped}</text>`
        )
      } else {
        const fillAttr = stroke.fill ? ` fill="${stroke.fill}"` : ' fill="none"'
        // Eraser strokes render with background color to "paint over" strokes below
        const strokeColor = stroke.isEraser ? (config.backgroundColor || '#000000') : stroke.color
        pathElements.push(
          `<path d="${stroke.path}" stroke="${strokeColor}" stroke-width="${stroke.strokeWidth}" ` +
          `stroke-linecap="round" stroke-linejoin="round"${fillAttr}` +
          `${stroke.isEraser ? '' : filterAttr} opacity="${stroke.isEraser ? '1' : '0.92'}"/>`
        )
      }
    } else {
      // Stroke in progress
      const rawProgress = totalFrames > 0 ? elapsed / totalFrames : 1
      const progress = applyWhiteboardEasing(rawProgress, stroke.easing, stroke.easingBezier)
      currentStrokeProgress = progress
      activeStrokeIndex = i

      // Use real path length for accurate dasharray (text strokes keep the estimate)
      const pathLength = isText ? 50000 : getPathLength(stroke.path)
      const dashOffset = pathLength * (1 - progress)

      if (isText) {
        // Drawing text: use stroke-dashoffset on SVG <text>
        const escaped = escapeXml(stroke.textContent!)
        const ff = stroke.fontFamily ?? 'Permanent Marker'
        const fs = stroke.fontSize ?? 56
        const fw = stroke.fontWeight ?? 'bold'
        const sw = stroke.strokeWidth || Math.max(1, fs * 0.04)
        const tx = stroke.textX ?? canvasWidth / 2
        const ty = stroke.textY ?? canvasHeight / 2
        pathElements.push(
          `<text x="${tx}" y="${ty}" font-family="${ff}" font-size="${fs}" font-weight="${fw}" ` +
          `fill="none" stroke="${stroke.color}" stroke-width="${sw}" ` +
          `stroke-linecap="${config.lineCap}" stroke-linejoin="${config.lineJoin}" ` +
          `stroke-dasharray="${pathLength}" stroke-dashoffset="${dashOffset.toFixed(2)}" ` +
          `text-anchor="middle" dominant-baseline="central"` +
          `${filterAttr} opacity="0.92">${escaped}</text>`
        )
      } else {
        const strokeColor = stroke.isEraser ? (config.backgroundColor || '#000000') : stroke.color
        pathElements.push(
          `<path d="${stroke.path}" stroke="${strokeColor}" stroke-width="${stroke.strokeWidth}" ` +
          `stroke-linecap="round" stroke-linejoin="round" fill="none" ` +
          `stroke-dasharray="${pathLength}" stroke-dashoffset="${dashOffset.toFixed(2)}"` +
          `${stroke.isEraser ? '' : filterAttr} opacity="${stroke.isEraser ? '1' : '0.92'}"/>`
        )
      }

      if (config.showHand && config.handType !== 'none') {
        if (!isText) {
          handPosition = approximateDrawPosition(stroke.path, progress)
        } else {
          // Approximate hand position for text: move across text width
          const fs = stroke.fontSize ?? 56
          const textWidth = (stroke.textContent?.length ?? 1) * fs * 0.5
          const tx = stroke.textX ?? canvasWidth / 2
          const ty = stroke.textY ?? canvasHeight / 2
          const startX = tx - textWidth / 2
          handPosition = { x: startX + textWidth * progress, y: ty, angle: 0 }
        }
      }
    }
  }

  // Background is rendered by WhiteboardBackground component — strokes SVG is transparent
  const svgMarkup = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">`,
    getChalkFilterDefs(),
    ...pathElements,
    '</svg>',
  ].filter(Boolean).join('\n')

  return {
    svgMarkup,
    handPosition,
    currentStrokeProgress,
    activeStrokeIndex,
  }
}

/**
 * Sample a cubic bezier curve into line segments for accurate length measurement.
 */
function sampleCubicBezier(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  steps: number = 8
): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
    pts.push({ x, y })
  }
  return pts
}

/**
 * Sample a quadratic bezier curve into line segments.
 */
function sampleQuadBezier(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  steps: number = 6
): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    const x = u * u * x0 + 2 * u * t * x1 + t * t * x2
    const y = u * u * y0 + 2 * u * t * y1 + t * t * y2
    pts.push({ x, y })
  }
  return pts
}

/**
 * Flatten an SVG path into densely sampled points and compute total length.
 * Used for both hand position tracking and dasharray length calculation.
 */
function flattenPath(pathD: string): { points: Array<{ x: number; y: number }>; totalLength: number } {
  const commands = pathD.match(/[MLCQSTAZmlcqstaz][^MLCQSTAZmlcqstaz]*/gi) || []
  const points: Array<{ x: number; y: number }> = []

  let cx = 0, cy = 0

  for (const cmd of commands) {
    const type = cmd.charAt(0)
    const nums = cmd.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number)

    switch (type.toUpperCase()) {
      case 'M':
        cx = nums[0]; cy = nums[1]
        points.push({ x: cx, y: cy })
        break
      case 'L':
        cx = nums[0]; cy = nums[1]
        points.push({ x: cx, y: cy })
        break
      case 'C': {
        const sampled = sampleCubicBezier(cx, cy, nums[0], nums[1], nums[2], nums[3], nums[4], nums[5])
        points.push(...sampled)
        cx = nums[4]; cy = nums[5]
        break
      }
      case 'Q': {
        const sampled = sampleQuadBezier(cx, cy, nums[0], nums[1], nums[2], nums[3])
        points.push(...sampled)
        cx = nums[2]; cy = nums[3]
        break
      }
      case 'Z':
        break
    }
  }

  let totalLength = 0
  for (let i = 1; i < points.length; i++) {
    totalLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }

  return { points, totalLength }
}

// Cache flattened paths to avoid recomputing every frame
const _flattenCache = new Map<string, { points: Array<{ x: number; y: number }>; totalLength: number }>()

function getFlattenedPath(pathD: string) {
  let cached = _flattenCache.get(pathD)
  if (!cached) {
    cached = flattenPath(pathD)
    _flattenCache.set(pathD, cached)
    // Keep cache bounded
    if (_flattenCache.size > 200) {
      const first = _flattenCache.keys().next().value
      if (first) _flattenCache.delete(first)
    }
  }
  return cached
}

function approximateDrawPosition(
  pathD: string,
  progress: number
): { x: number; y: number; angle: number } {
  const { points, totalLength } = getFlattenedPath(pathD)

  if (points.length === 0) return { x: 0, y: 0, angle: 0 }
  if (points.length === 1) return { x: points[0].x, y: points[0].y, angle: 0 }

  const targetLength = totalLength * progress
  let accumulated = 0

  for (let i = 1; i < points.length; i++) {
    const segLen = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    if (accumulated + segLen >= targetLength) {
      const segProgress = segLen > 0 ? (targetLength - accumulated) / segLen : 0
      const x = points[i - 1].x + (points[i].x - points[i - 1].x) * segProgress
      const y = points[i - 1].y + (points[i].y - points[i - 1].y) * segProgress
      const angle = Math.atan2(
        points[i].y - points[i - 1].y,
        points[i].x - points[i - 1].x
      ) * (180 / Math.PI)
      return { x, y, angle }
    }
    accumulated += segLen
  }

  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x) * (180 / Math.PI)
  return { x: last.x, y: last.y, angle }
}

/** Get the computed total length of a path for accurate stroke-dasharray */
function getPathLength(pathD: string): number {
  return getFlattenedPath(pathD).totalLength
}

// ---------------------------------------------------------------------------
// SVG hand overlays
// ---------------------------------------------------------------------------

export function getHandOverlaySVG(
  handType: WhiteboardConfig['handType'],
  position: { x: number; y: number; angle: number },
  scale: number = 1
): string {
  if (handType === 'none' || !position) return ''

  const size = 40 * scale
  const { x, y } = position

  const offsetX = -5 * scale
  const offsetY = -size + 5 * scale

  // Fixed angle — hand stays upright regardless of stroke direction
  const fixedAngle = 30

  switch (handType) {
    case 'pen':
      return `<g transform="translate(${x + offsetX}, ${y + offsetY}) rotate(${fixedAngle}, ${size / 2}, ${size})">
        <path d="M${size * 0.5} ${size * 0.05} L${size * 0.65} ${size * 0.7} L${size * 0.5} ${size} L${size * 0.35} ${size * 0.7} Z"
          fill="#333" stroke="#222" stroke-width="1"/>
        <path d="M${size * 0.45} ${size * 0.85} L${size * 0.5} ${size} L${size * 0.55} ${size * 0.85}"
          fill="#c0c0c0" stroke="none"/>
      </g>`

    case 'marker':
      return `<g transform="translate(${x + offsetX}, ${y + offsetY}) rotate(${fixedAngle}, ${size / 2}, ${size})">
        <rect x="${size * 0.35}" y="${size * 0.05}" width="${size * 0.3}" height="${size * 0.7}" rx="3"
          fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
        <rect x="${size * 0.4}" y="${size * 0.7}" width="${size * 0.2}" height="${size * 0.3}" rx="2"
          fill="#888" stroke="#666" stroke-width="0.5"/>
      </g>`

    case 'chalk':
      return `<g transform="translate(${x + offsetX}, ${y + offsetY}) rotate(${fixedAngle}, ${size / 2}, ${size})">
        <rect x="${size * 0.35}" y="${size * 0.1}" width="${size * 0.3}" height="${size * 0.85}" rx="4"
          fill="#f5f5dc" stroke="#d4c89a" stroke-width="1"/>
      </g>`

    default:
      return ''
  }
}

// ---------------------------------------------------------------------------
// Cutting mat SVG overlay for export
// ---------------------------------------------------------------------------

export function generateCuttingMatSvgOverlay(w: number, h: number): string {
  const lines: string[] = []
  const stroke = 'rgba(255,255,255,0.18)'
  const strokeFine = 'rgba(255,255,255,0.08)'
  const rulerW = Math.round(w * 0.04)
  const rulerH = Math.round(h * 0.04)

  // Fine grid (small squares)
  const cellSmall = Math.round(w / 25)
  for (let x = rulerW; x <= w - rulerW; x += cellSmall) {
    lines.push(`<line x1="${x}" y1="${rulerH}" x2="${x}" y2="${h - rulerH}" stroke="${strokeFine}" stroke-width="0.5"/>`)
  }
  for (let y = rulerH; y <= h - rulerH; y += cellSmall) {
    lines.push(`<line x1="${rulerW}" y1="${y}" x2="${w - rulerW}" y2="${y}" stroke="${strokeFine}" stroke-width="0.5"/>`)
  }

  // Major grid
  const cellMajor = cellSmall * 5
  for (let x = rulerW; x <= w - rulerW; x += cellMajor) {
    lines.push(`<line x1="${x}" y1="${rulerH}" x2="${x}" y2="${h - rulerH}" stroke="${stroke}" stroke-width="1"/>`)
  }
  for (let y = rulerH; y <= h - rulerH; y += cellMajor) {
    lines.push(`<line x1="${rulerW}" y1="${y}" x2="${w - rulerW}" y2="${y}" stroke="${stroke}" stroke-width="1"/>`)
  }

  // Ruler borders
  lines.push(`<rect x="0" y="0" width="${w}" height="${rulerH}" fill="rgba(0,0,0,0.25)"/>`)
  lines.push(`<rect x="0" y="${h - rulerH}" width="${w}" height="${rulerH}" fill="rgba(0,0,0,0.25)"/>`)
  lines.push(`<rect x="0" y="0" width="${rulerW}" height="${h}" fill="rgba(0,0,0,0.25)"/>`)
  lines.push(`<rect x="${w - rulerW}" y="0" width="${rulerW}" height="${h}" fill="rgba(0,0,0,0.25)"/>`)

  // 45° and 60° angle lines
  const cx = w / 2, cy = h / 2
  const diag = Math.hypot(w, h)
  lines.push(`<line x1="${cx - diag}" y1="${cy + diag}" x2="${cx + diag}" y2="${cy - diag}" stroke="${stroke}" stroke-width="0.8"/>`)
  lines.push(`<line x1="${cx - diag}" y1="${cy - diag}" x2="${cx + diag}" y2="${cy + diag}" stroke="${stroke}" stroke-width="0.8"/>`)
  const tan60 = Math.tan(Math.PI / 3)
  lines.push(`<line x1="${cx - diag}" y1="${cy + diag * tan60}" x2="${cx + diag}" y2="${cy - diag * tan60}" stroke="${stroke}" stroke-width="0.8"/>`)
  lines.push(`<line x1="${cx - diag}" y1="${cy - diag * tan60}" x2="${cx + diag}" y2="${cy + diag * tan60}" stroke="${stroke}" stroke-width="0.8"/>`)

  return `<g>${lines.join('')}</g>`
}

// ---------------------------------------------------------------------------
// Drafting / technical drawing background overlay
// ---------------------------------------------------------------------------

export function generateDraftingSvgOverlay(w: number, h: number, cfg?: DraftingConfig): string {
  const dc = cfg ?? createDefaultDraftingConfig()
  const lines: string[] = []
  const C = dc.lineColor
  const ts = dc.thicknessScale
  const THIN = 0.18 * ts, MED = 0.32 * ts, THICK = 0.5 * ts
  const MG = w * dc.margin

  // Compute grid dimensions in internal units
  const aspect = w / h
  const base = 200
  let gw: number, gh: number
  if (aspect >= 1) { gh = base; gw = Math.ceil((base * aspect) / 10) * 10 }
  else { gw = base; gh = Math.ceil((base / aspect) / 10) * 10 }

  const totalW = gw + MG * 2, totalH = gh + MG * 2
  const sx = w / totalW, sy = h / totalH

  // Background gradient
  if (dc.gradientMode !== 'none') {
    const defId = 'draftingGrad'
    if (dc.gradientMode === 'radial') {
      lines.push(`<defs><radialGradient id="${defId}" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${dc.bgColor}"/><stop offset="100%" stop-color="${dc.gradientColor}"/></radialGradient></defs>`)
    } else if (dc.gradientMode === 'vignette') {
      lines.push(`<defs><radialGradient id="${defId}" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="${dc.bgColor}"/><stop offset="100%" stop-color="${dc.gradientColor}" stop-opacity="0.8"/></radialGradient></defs>`)
    } else if (dc.gradientMode === 'linear-top') {
      lines.push(`<defs><linearGradient id="${defId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${dc.gradientColor}"/><stop offset="100%" stop-color="${dc.bgColor}"/></linearGradient></defs>`)
    } else if (dc.gradientMode === 'linear-left') {
      lines.push(`<defs><linearGradient id="${defId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${dc.gradientColor}"/><stop offset="100%" stop-color="${dc.bgColor}"/></linearGradient></defs>`)
    }
    lines.push(`<rect width="${w}" height="${h}" fill="url(#${defId})"/>`)
  }

  // Wrap everything in a scaled group with overall opacity
  lines.push(`<g transform="scale(${sx},${sy}) translate(${MG},${MG})" opacity="${dc.opacity}">`)

  // Fine grid
  if (dc.showGrid) {
    const minorStep = 10 / dc.gridDensity
    for (let x = 0; x <= gw; x += minorStep) {
      const major = Math.abs(x % 10) < 0.01
      lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${gh}" stroke="${C}" stroke-width="${major ? 0.25 * ts : THIN}" opacity="${major ? 0.4 : 0.14}"/>`)
    }
    for (let y = 0; y <= gh; y += minorStep) {
      const major = Math.abs(y % 10) < 0.01
      lines.push(`<line x1="0" y1="${y}" x2="${gw}" y2="${y}" stroke="${C}" stroke-width="${major ? 0.25 * ts : THIN}" opacity="${major ? 0.4 : 0.14}"/>`)
    }
  }

  // Scale marks and labels
  if (dc.showScales) {
    const fs = 2.4
    for (let x = 0; x <= gw; x += 10) {
      const big = x % 50 === 0
      const tl = big ? 3 : 1.5
      lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${-tl}" stroke="${C}" stroke-width="${big ? THICK : MED}" opacity="0.85"/>`)
      lines.push(`<line x1="${x}" y1="${gh}" x2="${x}" y2="${gh + tl}" stroke="${C}" stroke-width="${big ? THICK : MED}" opacity="0.85"/>`)
      if (dc.showLabels && x % 20 === 0) {
        lines.push(`<text x="${x}" y="${-3.5}" fill="${C}" font-size="${fs}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" opacity="0.9">${x}</text>`)
        lines.push(`<text x="${x}" y="${gh + 3.5 + fs}" fill="${C}" font-size="${fs}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" opacity="0.9">${x}</text>`)
      }
    }
    for (let y = 0; y <= gh; y += 10) {
      const big = y % 50 === 0
      const tl = big ? 3 : 1.5
      lines.push(`<line x1="0" y1="${y}" x2="${-tl}" y2="${y}" stroke="${C}" stroke-width="${big ? THICK : MED}" opacity="0.85"/>`)
      lines.push(`<line x1="${gw}" y1="${y}" x2="${gw + tl}" y2="${y}" stroke="${C}" stroke-width="${big ? THICK : MED}" opacity="0.85"/>`)
      if (dc.showLabels && y % 20 === 0) {
        lines.push(`<text x="${-3.5}" y="${y + 0.8}" fill="${C}" font-size="${fs}" text-anchor="end" font-family="Helvetica,Arial,sans-serif" opacity="0.9">${y}</text>`)
        lines.push(`<text x="${gw + 3.5}" y="${y + 0.8}" fill="${C}" font-size="${fs}" text-anchor="start" font-family="Helvetica,Arial,sans-serif" opacity="0.9">${y}</text>`)
      }
    }
  }

  // Border
  lines.push(`<rect x="0" y="0" width="${gw}" height="${gh}" fill="none" stroke="${C}" stroke-width="${THICK}" opacity="0.9"/>`)

  // Radial curves from bottom center
  if (dc.showRadialCurves) {
    const cx = gw * 0.5, cy = gh
    const radii = [60, 80, 100, 120, 150, 200, 300, 500, 750]
    const labeledRadii = new Set([60, 80, 100, 120, 150, 200, 300])
    for (const R of radii) {
      const halfW = Math.min(R * 0.92, gw * 0.44)
      const dy = Math.sqrt(Math.max(0, R * R - halfW * halfW))
      if (cy - dy < gh * 0.35) continue
      lines.push(`<path d="M ${cx - halfW} ${cy} A ${R} ${R} 0 0 1 ${cx + halfW} ${cy}" fill="none" stroke="${C}" stroke-width="${MED}" opacity="0.55"/>`)
      if (dc.showLabels && labeledRadii.has(R)) {
        const lr = Math.min(halfW * 0.55, R * 0.35)
        const ly = cy - Math.sqrt(Math.max(1, R * R - lr * lr))
        lines.push(`<text x="${cx + lr + 2}" y="${Math.max(ly + 1, gh * 0.5)}" fill="${C}" font-size="2.8" font-family="Helvetica,Arial,sans-serif" font-weight="400" opacity="0.8">R${R}</text>`)
      }
    }
  }

  // Polar grid (upper-left area)
  if (dc.showPolarGrid) {
    const pcx = gw * 0.2, pcy = gh * 0.36
    const maxR = Math.min(gw, gh) * 0.23
    const step = maxR / 11
    for (let i = 1; i <= 11; i++) {
      const r = i * step
      lines.push(`<circle cx="${pcx}" cy="${pcy}" r="${r}" fill="none" stroke="${C}" stroke-width="${i % 5 === 0 ? MED : THIN}" opacity="0.5"/>`)
      if (dc.showLabels && (i % 2 === 0 || i === 11)) {
        lines.push(`<text x="${pcx + r + 1.5}" y="${pcy + 1}" fill="${C}" font-size="2.1" font-family="Helvetica,Arial,sans-serif" opacity="0.6">${i * 10}</text>`)
      }
    }
    for (let a = 0; a < 360; a += 20) {
      const rad = (a * Math.PI) / 180
      const outerR = 11 * step
      lines.push(`<line x1="${pcx}" y1="${pcy}" x2="${pcx + outerR * Math.cos(rad)}" y2="${pcy - outerR * Math.sin(rad)}" stroke="${C}" stroke-width="${THIN}" opacity="0.4"/>`)
      if (dc.showLabels && a % 40 === 0) {
        const lr = outerR + 4
        lines.push(`<text x="${pcx + lr * Math.cos(rad)}" y="${pcy - lr * Math.sin(rad) + 1}" fill="${C}" font-size="2" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" opacity="0.55">${a}°</text>`)
      }
    }
  }

  // Concentric cluster (right area)
  if (dc.showConcentricCircles) {
    const ccx = gw * 0.72, ccy = gh * 0.37
    const ccMaxR = Math.min(gw, gh) * 0.12
    const ccStep = ccMaxR / 11
    for (let i = 1; i <= 11; i++) {
      const r = i * ccStep
      lines.push(`<circle cx="${ccx}" cy="${ccy}" r="${r}" fill="none" stroke="${C}" stroke-width="${MED}" opacity="0.5"/>`)
      if (dc.showLabels && (i % 2 === 0 || i === 1)) {
        lines.push(`<text x="${ccx + r + 1.2}" y="${ccy + 1}" fill="${C}" font-size="2" font-family="Helvetica,Arial,sans-serif" opacity="0.55">${i * 2}</text>`)
      }
    }
    lines.push(`<line x1="${ccx - 3.5}" y1="${ccy}" x2="${ccx + 3.5}" y2="${ccy}" stroke="${C}" stroke-width="${MED}" opacity="0.65"/>`)
    lines.push(`<line x1="${ccx}" y1="${ccy - 3.5}" x2="${ccx}" y2="${ccy + 3.5}" stroke="${C}" stroke-width="${MED}" opacity="0.65"/>`)
  }

  // Test circles (bottom-right area)
  if (dc.showTestCircles) {
    const tcStartX = gw * 0.6, tcStartY = gh * 0.6
    const sp = Math.min(12, gw * 0.034)
    const tcR = sp * 0.38
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 5; i++) {
        const tcx2 = tcStartX + i * sp
        const tcy2 = tcStartY + row * (sp + 8)
        const cr = tcR - i * 0.22
        const label = row === 0 ? i + 6 : i + 1
        lines.push(`<circle cx="${tcx2}" cy="${tcy2}" r="${cr}" fill="none" stroke="${C}" stroke-width="${MED}" opacity="0.5"/>`)
        lines.push(`<line x1="${tcx2 - cr + 0.5}" y1="${tcy2}" x2="${tcx2 + cr - 0.5}" y2="${tcy2}" stroke="${C}" stroke-width="${THIN}" opacity="0.35"/>`)
        lines.push(`<line x1="${tcx2}" y1="${tcy2 - cr + 0.5}" x2="${tcx2}" y2="${tcy2 + cr - 0.5}" stroke="${C}" stroke-width="${THIN}" opacity="0.35"/>`)
        if (dc.showLabels) {
          lines.push(`<text x="${tcx2}" y="${tcy2 + cr + 3.5}" fill="${C}" font-size="2.1" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" opacity="0.65">${label}</text>`)
        }
      }
    }
  }

  // Radiating lines (from left edge)
  if (dc.showRadiatingLines) {
    const rlox = 0, rloy = gh * 0.65
    const rlAngles = [-15, -5, 6]
    const rlLen = gw * 0.5
    for (const ang of rlAngles) {
      const rad = (ang * Math.PI) / 180
      lines.push(`<line x1="${rlox}" y1="${rloy}" x2="${rlox + rlLen * Math.cos(rad)}" y2="${rloy + rlLen * Math.sin(rad)}" stroke="${C}" stroke-width="${MED}" opacity="0.5"/>`)
    }
    lines.push(`<circle cx="${rlox}" cy="${rloy}" r="1" fill="${C}" opacity="0.75"/>`)
  }

  // Large arc (lower-left area)
  if (dc.showLargeArc) {
    const lacx = gw * 0.22, lacy = gh * 0.85
    const laR = Math.min(gw, gh) * 0.2
    const laSa = -90, laEa = -15
    for (let d = 0; d <= 70; d += 10) {
      const a = (laSa + (d / 70) * (laEa - laSa)) * Math.PI / 180
      lines.push(`<line x1="${lacx + laR * Math.cos(a)}" y1="${lacy + laR * Math.sin(a)}" x2="${lacx + (laR + 2.5) * Math.cos(a)}" y2="${lacy + (laR + 2.5) * Math.sin(a)}" stroke="${C}" stroke-width="${MED}" opacity="0.65"/>`)
      if (dc.showLabels) {
        lines.push(`<text x="${lacx + (laR + 6) * Math.cos(a)}" y="${lacy + (laR + 6) * Math.sin(a) + 0.8}" fill="${C}" font-size="2" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" opacity="0.65">${d}</text>`)
      }
    }
    const laSar = laSa * Math.PI / 180, laEar = laEa * Math.PI / 180
    lines.push(`<path d="M ${lacx + laR * Math.cos(laSar)} ${lacy + laR * Math.sin(laSar)} A ${laR} ${laR} 0 0 1 ${lacx + laR * Math.cos(laEar)} ${lacy + laR * Math.sin(laEar)}" fill="none" stroke="${C}" stroke-width="${MED}" opacity="0.5"/>`)
  }

  lines.push('</g>') // close scaled group

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Utility: create default whiteboard config
// ---------------------------------------------------------------------------

export function createDefaultWhiteboardConfig(): WhiteboardConfig {
  return {
    strokes: [],
    backgroundColor: 'transparent',
    backgroundStyle: 'blank',
    backgroundType: 'preset',
    showHand: true,
    handType: 'chalk',
    handScale: 1,
    lineCap: 'round',
    lineJoin: 'round',
  }
}

// ---------------------------------------------------------------------------
// Handwriting-style cursive letter glyphs (single-stroke, 0-1 unit box)
// These use cubic bezier curves (C) for organic flowing letterforms.
// ---------------------------------------------------------------------------

const LETTER_GLYPHS: Record<string, string> = {
  // Cursive uppercase with natural flowing curves
  A: 'M0.05 0.95 Q0.15 0.5 0.5 0.05 Q0.85 0.5 0.95 0.95 M0.2 0.6 Q0.5 0.55 0.8 0.6',
  B: 'M0.1 0.95 L0.1 0.05 Q0.1 0.05 0.6 0.05 Q0.95 0.08 0.9 0.28 Q0.85 0.48 0.55 0.48 L0.1 0.48 Q0.1 0.48 0.6 0.5 Q1.0 0.55 0.9 0.75 Q0.8 0.95 0.5 0.95 L0.1 0.95',
  C: 'M0.9 0.2 Q0.7 0.0 0.4 0.05 Q0.05 0.1 0.05 0.5 Q0.05 0.9 0.4 0.95 Q0.7 1.0 0.9 0.8',
  D: 'M0.1 0.95 L0.1 0.05 Q0.1 0.05 0.45 0.05 Q0.95 0.1 0.95 0.5 Q0.95 0.9 0.45 0.95 L0.1 0.95',
  E: 'M0.85 0.05 Q0.45 0.05 0.1 0.05 L0.1 0.48 L0.7 0.48 M0.1 0.48 L0.1 0.95 Q0.5 0.95 0.85 0.95',
  F: 'M0.85 0.05 Q0.45 0.05 0.1 0.05 L0.1 0.48 L0.65 0.48 M0.1 0.48 L0.1 0.95',
  G: 'M0.9 0.2 Q0.7 0.0 0.4 0.05 Q0.05 0.1 0.05 0.5 Q0.05 0.9 0.4 0.95 Q0.7 1.0 0.9 0.8 L0.9 0.5 L0.6 0.5',
  H: 'M0.1 0.05 L0.1 0.95 M0.1 0.48 Q0.5 0.45 0.9 0.48 M0.9 0.05 L0.9 0.95',
  I: 'M0.3 0.05 L0.7 0.05 M0.5 0.05 L0.5 0.95 M0.3 0.95 L0.7 0.95',
  J: 'M0.3 0.05 L0.7 0.05 M0.6 0.05 L0.6 0.75 Q0.6 0.98 0.35 0.95 Q0.15 0.9 0.15 0.75',
  K: 'M0.1 0.05 L0.1 0.95 M0.9 0.05 Q0.5 0.3 0.15 0.48 M0.35 0.4 Q0.6 0.65 0.9 0.95',
  L: 'M0.1 0.05 L0.1 0.95 Q0.5 0.95 0.85 0.95',
  M: 'M0.05 0.95 L0.05 0.08 Q0.15 0.05 0.25 0.08 L0.5 0.55 L0.75 0.08 Q0.85 0.05 0.95 0.08 L0.95 0.95',
  N: 'M0.1 0.95 L0.1 0.08 Q0.15 0.05 0.2 0.08 L0.85 0.9 Q0.9 0.95 0.9 0.9 L0.9 0.05',
  O: 'M0.5 0.05 Q0.95 0.05 0.95 0.5 Q0.95 0.95 0.5 0.95 Q0.05 0.95 0.05 0.5 Q0.05 0.05 0.5 0.05',
  P: 'M0.1 0.95 L0.1 0.05 Q0.1 0.05 0.6 0.05 Q0.95 0.08 0.95 0.28 Q0.95 0.5 0.6 0.5 L0.1 0.5',
  Q: 'M0.5 0.05 Q0.95 0.05 0.95 0.5 Q0.95 0.95 0.5 0.95 Q0.05 0.95 0.05 0.5 Q0.05 0.05 0.5 0.05 M0.65 0.75 Q0.8 0.88 0.95 0.98',
  R: 'M0.1 0.95 L0.1 0.05 Q0.1 0.05 0.6 0.05 Q0.95 0.08 0.95 0.28 Q0.95 0.5 0.6 0.5 L0.1 0.5 M0.55 0.5 Q0.75 0.7 0.92 0.95',
  S: 'M0.85 0.15 Q0.7 0.0 0.45 0.05 Q0.1 0.1 0.1 0.28 Q0.1 0.48 0.5 0.5 Q0.9 0.52 0.9 0.72 Q0.9 0.92 0.55 0.95 Q0.3 1.0 0.15 0.85',
  T: 'M0.05 0.05 Q0.5 0.03 0.95 0.05 M0.5 0.05 L0.5 0.95',
  U: 'M0.1 0.05 L0.1 0.7 Q0.1 0.98 0.5 0.95 Q0.9 0.92 0.9 0.7 L0.9 0.05',
  V: 'M0.05 0.05 Q0.25 0.5 0.5 0.95 Q0.75 0.5 0.95 0.05',
  W: 'M0.0 0.05 Q0.1 0.6 0.25 0.95 Q0.35 0.5 0.5 0.3 Q0.65 0.6 0.75 0.95 Q0.85 0.5 0.95 0.05',
  X: 'M0.1 0.05 Q0.5 0.45 0.9 0.95 M0.9 0.05 Q0.5 0.45 0.1 0.95',
  Y: 'M0.1 0.05 Q0.3 0.3 0.5 0.5 Q0.7 0.3 0.9 0.05 M0.5 0.5 L0.5 0.95',
  Z: 'M0.1 0.05 Q0.5 0.05 0.9 0.05 Q0.5 0.5 0.1 0.95 Q0.5 0.95 0.9 0.95',
  // Lowercase - more organic/flowing
  a: 'M0.8 0.35 Q0.7 0.25 0.5 0.25 Q0.15 0.28 0.15 0.6 Q0.15 0.92 0.5 0.95 Q0.75 0.95 0.85 0.8 L0.85 0.28 L0.85 0.95',
  b: 'M0.15 0.0 L0.15 0.95 M0.15 0.4 Q0.15 0.25 0.5 0.25 Q0.85 0.28 0.85 0.6 Q0.85 0.92 0.5 0.95 Q0.2 0.95 0.15 0.75',
  c: 'M0.8 0.35 Q0.6 0.25 0.45 0.25 Q0.15 0.3 0.15 0.6 Q0.15 0.9 0.45 0.95 Q0.6 0.95 0.8 0.85',
  d: 'M0.85 0.0 L0.85 0.95 M0.85 0.4 Q0.85 0.25 0.5 0.25 Q0.15 0.28 0.15 0.6 Q0.15 0.92 0.5 0.95 Q0.8 0.95 0.85 0.75',
  e: 'M0.15 0.58 L0.85 0.55 Q0.85 0.25 0.5 0.25 Q0.15 0.28 0.15 0.6 Q0.15 0.92 0.5 0.95 Q0.7 0.95 0.85 0.82',
  f: 'M0.75 0.1 Q0.55 0.0 0.4 0.1 Q0.3 0.2 0.3 0.35 L0.3 0.95 M0.15 0.38 L0.55 0.38',
  g: 'M0.85 0.3 Q0.7 0.25 0.5 0.25 Q0.15 0.28 0.15 0.55 Q0.15 0.82 0.5 0.85 Q0.8 0.85 0.85 0.65 L0.85 0.25 L0.85 1.05 Q0.8 1.2 0.45 1.15 Q0.2 1.1 0.15 0.95',
  h: 'M0.15 0.0 L0.15 0.95 M0.15 0.45 Q0.2 0.25 0.55 0.25 Q0.85 0.28 0.85 0.5 L0.85 0.95',
  i: 'M0.5 0.12 L0.5 0.15 M0.5 0.3 L0.5 0.95',
  j: 'M0.55 0.12 L0.55 0.15 M0.55 0.3 L0.55 1.05 Q0.5 1.2 0.3 1.15',
  k: 'M0.15 0.0 L0.15 0.95 M0.75 0.3 Q0.45 0.5 0.2 0.58 M0.4 0.52 Q0.6 0.7 0.8 0.95',
  l: 'M0.45 0.05 L0.45 0.9 Q0.45 0.95 0.55 0.95',
  m: 'M0.05 0.95 L0.05 0.3 M0.05 0.42 Q0.1 0.25 0.3 0.28 Q0.45 0.3 0.48 0.45 L0.48 0.95 M0.48 0.42 Q0.55 0.25 0.72 0.28 Q0.9 0.3 0.92 0.45 L0.92 0.95',
  n: 'M0.15 0.95 L0.15 0.3 M0.15 0.45 Q0.2 0.25 0.55 0.25 Q0.85 0.28 0.85 0.5 L0.85 0.95',
  o: 'M0.5 0.25 Q0.85 0.28 0.85 0.6 Q0.85 0.92 0.5 0.95 Q0.15 0.92 0.15 0.6 Q0.15 0.28 0.5 0.25',
  p: 'M0.15 0.3 L0.15 1.2 M0.15 0.4 Q0.15 0.25 0.5 0.25 Q0.85 0.28 0.85 0.6 Q0.85 0.92 0.5 0.95 Q0.2 0.95 0.15 0.75',
  q: 'M0.85 0.3 L0.85 1.2 M0.85 0.4 Q0.85 0.25 0.5 0.25 Q0.15 0.28 0.15 0.6 Q0.15 0.92 0.5 0.95 Q0.8 0.95 0.85 0.75',
  r: 'M0.2 0.95 L0.2 0.3 M0.2 0.5 Q0.25 0.28 0.55 0.25 Q0.75 0.25 0.85 0.35',
  s: 'M0.75 0.32 Q0.6 0.25 0.45 0.25 Q0.2 0.28 0.2 0.42 Q0.2 0.55 0.5 0.58 Q0.8 0.62 0.8 0.78 Q0.8 0.95 0.5 0.95 Q0.35 0.95 0.2 0.85',
  t: 'M0.4 0.1 L0.4 0.85 Q0.42 0.95 0.6 0.95 M0.2 0.32 L0.65 0.32',
  u: 'M0.15 0.3 L0.15 0.72 Q0.15 0.95 0.5 0.95 Q0.8 0.92 0.85 0.72 L0.85 0.3 L0.85 0.95',
  v: 'M0.1 0.3 Q0.3 0.7 0.5 0.95 Q0.7 0.7 0.9 0.3',
  w: 'M0.05 0.3 Q0.12 0.7 0.25 0.95 Q0.35 0.6 0.48 0.4 Q0.6 0.7 0.72 0.95 Q0.82 0.6 0.95 0.3',
  x: 'M0.15 0.3 Q0.5 0.6 0.85 0.95 M0.85 0.3 Q0.5 0.6 0.15 0.95',
  y: 'M0.15 0.3 Q0.3 0.6 0.5 0.85 M0.85 0.3 L0.5 0.85 Q0.35 1.1 0.2 1.15',
  z: 'M0.15 0.3 L0.85 0.3 Q0.5 0.6 0.15 0.95 L0.85 0.95',
  // Numbers
  '0': 'M0.5 0.05 Q0.95 0.08 0.95 0.5 Q0.95 0.92 0.5 0.95 Q0.05 0.92 0.05 0.5 Q0.05 0.08 0.5 0.05',
  '1': 'M0.25 0.2 Q0.4 0.08 0.5 0.05 L0.5 0.95 M0.25 0.95 L0.75 0.95',
  '2': 'M0.15 0.2 Q0.35 0.0 0.6 0.05 Q0.9 0.1 0.85 0.35 Q0.8 0.55 0.1 0.95 L0.9 0.95',
  '3': 'M0.15 0.1 Q0.5 0.0 0.75 0.1 Q0.95 0.22 0.7 0.45 Q0.5 0.5 0.55 0.5 Q0.95 0.55 0.85 0.78 Q0.7 0.98 0.4 0.95 Q0.2 0.92 0.15 0.82',
  '4': 'M0.7 0.95 L0.7 0.05 L0.05 0.65 L0.95 0.65',
  '5': 'M0.85 0.05 L0.15 0.05 L0.1 0.45 Q0.4 0.35 0.7 0.45 Q0.95 0.55 0.85 0.78 Q0.7 0.98 0.4 0.95 Q0.2 0.92 0.15 0.82',
  '6': 'M0.75 0.1 Q0.4 0.0 0.2 0.3 Q0.05 0.55 0.1 0.7 Q0.15 0.95 0.5 0.95 Q0.85 0.92 0.85 0.7 Q0.85 0.48 0.5 0.45 Q0.15 0.48 0.1 0.7',
  '7': 'M0.1 0.05 L0.9 0.05 Q0.6 0.5 0.35 0.95',
  '8': 'M0.5 0.05 Q0.15 0.08 0.15 0.25 Q0.15 0.45 0.5 0.48 Q0.85 0.45 0.85 0.25 Q0.85 0.08 0.5 0.05 M0.5 0.48 Q0.1 0.52 0.1 0.72 Q0.1 0.95 0.5 0.95 Q0.9 0.95 0.9 0.72 Q0.9 0.52 0.5 0.48',
  '9': 'M0.25 0.9 Q0.6 1.0 0.8 0.7 Q0.95 0.45 0.9 0.3 Q0.85 0.05 0.5 0.05 Q0.15 0.08 0.15 0.3 Q0.15 0.52 0.5 0.55 Q0.85 0.52 0.9 0.3',
  // Punctuation
  '.': 'M0.45 0.88 Q0.5 0.85 0.55 0.88 Q0.55 0.95 0.45 0.95 Q0.42 0.92 0.45 0.88',
  ',': 'M0.5 0.85 Q0.52 0.92 0.48 0.98 Q0.42 1.08 0.35 1.1',
  '!': 'M0.5 0.05 Q0.48 0.35 0.5 0.65 M0.48 0.85 Q0.52 0.85 0.52 0.92 Q0.48 0.95 0.48 0.88',
  '?': 'M0.2 0.15 Q0.45 0.0 0.7 0.1 Q0.9 0.2 0.75 0.4 Q0.6 0.52 0.5 0.6 L0.5 0.65 M0.48 0.85 Q0.52 0.85 0.52 0.92 Q0.48 0.95 0.48 0.88',
  '-': 'M0.2 0.5 Q0.5 0.48 0.8 0.5',
  '\'': 'M0.45 0.05 Q0.48 0.15 0.45 0.22',
  '"': 'M0.35 0.05 Q0.38 0.15 0.35 0.22 M0.55 0.05 Q0.58 0.15 0.55 0.22',
  ':': 'M0.48 0.35 Q0.52 0.35 0.52 0.42 Q0.48 0.42 0.48 0.35 M0.48 0.78 Q0.52 0.78 0.52 0.85 Q0.48 0.85 0.48 0.78',
  ' ': '',
}

/**
 * Scale a glyph path (defined in 0-1 unit space) to actual canvas coordinates.
 */
function scaleGlyphPath(
  glyphD: string,
  offsetX: number,
  offsetY: number,
  w: number,
  h: number,
): string {
  const tokens = glyphD.match(/[MLCQSTAZmlcqstaz]|[-+]?\d*\.?\d+/g) || []
  const out: string[] = []
  let i = 0
  const cmdArgCount: Record<string, number> = {
    M: 2, L: 2, C: 6, Q: 4, S: 4, T: 2, Z: 0,
  }

  while (i < tokens.length) {
    const token = tokens[i]
    if (/^[A-Za-z]$/.test(token)) {
      out.push(token)
      const cmd = token.toUpperCase()
      if (cmd === 'Z') { i++; continue }
      const count = cmdArgCount[cmd] ?? 0
      for (let j = 0; j < count; j++) {
        i++
        const val = parseFloat(tokens[i] ?? '0')
        if (j % 2 === 0) {
          out.push(String(Math.round((offsetX + val * w) * 100) / 100))
        } else {
          out.push(String(Math.round((offsetY + val * h) * 100) / 100))
        }
      }
      i++
    } else {
      i++
    }
  }

  return out.join(' ')
}

/**
 * Convert text to an SVG path string using handwriting-style glyphs.
 */
export function textToPath(
  text: string,
  x: number,
  y: number,
  fontSize: number,
): string {
  const charWidth = fontSize * 0.65
  const parts: string[] = []
  let cursorX = x
  const topY = y - fontSize

  for (const char of text) {
    // Try exact char first, then uppercase
    const glyph = LETTER_GLYPHS[char] ?? LETTER_GLYPHS[char.toUpperCase()]
    if (glyph === undefined) {
      cursorX += charWidth * 0.4
      continue
    }
    if (glyph === '') {
      cursorX += charWidth * 0.4
      continue
    }

    parts.push(scaleGlyphPath(glyph, cursorX, topY, charWidth, fontSize))
    cursorX += charWidth
  }

  return parts.join(' ')
}

/**
 * Create text strokes for the whiteboard — one stroke per character
 * so each letter draws sequentially with natural pacing.
 */
export function createTextStrokes(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  startFrame: number,
  framesPerChar: number,
  color: string = '#ffffff',
  strokeWidth?: number
): WhiteboardStroke[] {
  const charWidth = fontSize * 0.65
  const sw = strokeWidth ?? Math.max(2, fontSize * 0.05)
  const strokes: WhiteboardStroke[] = []
  let cursorX = x
  const topY = y - fontSize
  let currentFrame = startFrame

  for (const char of text) {
    const glyph = LETTER_GLYPHS[char] ?? LETTER_GLYPHS[char.toUpperCase()]
    if (glyph === undefined) {
      cursorX += charWidth * 0.4
      currentFrame += Math.max(1, Math.round(framesPerChar * 0.3))
      continue
    }
    if (glyph === '') {
      // Space — small pause
      cursorX += charWidth * 0.4
      currentFrame += Math.max(1, Math.round(framesPerChar * 0.4))
      continue
    }

    const path = scaleGlyphPath(glyph, cursorX, topY, charWidth, fontSize)
    strokes.push({
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      path,
      color,
      strokeWidth: sw,
      startFrame: currentFrame,
      endFrame: currentFrame + framesPerChar,
      easing: 'ease-out',
    })

    cursorX += charWidth
    currentFrame += framesPerChar + Math.max(1, Math.round(framesPerChar * 0.15))
  }

  return strokes
}

/**
 * Legacy single-stroke text creation (kept for backward compat).
 * For natural handwriting animation, use createTextStrokes() instead.
 */
export function createTextStroke(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  startFrame: number,
  endFrame: number,
  color: string = '#ffffff',
  strokeWidth?: number
): WhiteboardStroke {
  const path = textToPath(text, x, y, fontSize)

  return {
    id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    path,
    color,
    strokeWidth: strokeWidth ?? Math.max(2, fontSize * 0.05),
    startFrame,
    endFrame,
    easing: 'ease-in-out',
  }
}

/**
 * Create a freehand-style stroke from an array of points.
 */
export function createFreehandStroke(
  points: Array<{ x: number; y: number }>,
  startFrame: number,
  endFrame: number,
  color: string = '#ffffff',
  strokeWidth: number = 3
): WhiteboardStroke {
  const path = pointsToSvgPath(points)

  return {
    id: `freehand-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    path,
    color,
    strokeWidth,
    startFrame,
    endFrame,
    easing: 'linear',
    rawPoints: points.map((p) => ({ x: p.x, y: p.y })),
  }
}

/** Convert an array of points to a smooth SVG path using quadratic curves */
export function pointsToSvgPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return 'M 0 0'
  if (points.length < 3) {
    const parts = [`M ${points[0].x} ${points[0].y}`]
    for (let i = 1; i < points.length; i++) {
      parts.push(`L ${points[i].x} ${points[i].y}`)
    }
    return parts.join(' ')
  }
  const parts = [`M ${points[0].x} ${points[0].y}`]
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    parts.push(`Q ${points[i].x} ${points[i].y} ${midX} ${midY}`)
  }
  const last = points[points.length - 1]
  parts.push(`L ${last.x} ${last.y}`)
  return parts.join(' ')
}

/** Re-generate a stroke's SVG path from its stored raw points (after pen style changes) */
export function regenerateStrokePath(stroke: WhiteboardStroke): string {
  if (!stroke.rawPoints || stroke.rawPoints.length < 2) return stroke.path
  return pointsToSvgPath(stroke.rawPoints)
}

/**
 * Create a text stroke that uses SVG <text> with stroke-dashoffset animation.
 * Works with any installed font — the text outline is progressively drawn.
 */
export function createFontTextStroke(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  startFrame: number,
  endFrame: number,
  color: string = '#ffffff',
  fontFamily: string = 'Permanent Marker',
  fontWeight: string = 'bold',
  strokeWidth?: number,
): WhiteboardStroke {
  return {
    id: `fonttext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    path: '', // not used for text strokes
    color,
    strokeWidth: strokeWidth ?? Math.max(1, fontSize * 0.04),
    startFrame,
    endFrame,
    easing: 'ease-out',
    textContent: text,
    fontFamily,
    fontSize,
    textX: x,
    textY: y,
    fontWeight,
  }
}
