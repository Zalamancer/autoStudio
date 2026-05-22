/**
 * SVG Infographic / Data Visualization Generator
 *
 * Generates custom SVG data visualizations from structured data.
 * Produces pure SVG markup with {{colorName}} placeholders for theming.
 * All charts are animated via keyframe system (no CSS/SMIL animation).
 *
 * Supported chart types:
 * - Bar chart (horizontal/vertical)
 * - Pie/donut chart
 * - Line chart with area fill
 * - Stat counter (big number display)
 * - Progress bar
 * - Comparison (side-by-side)
 * - Funnel
 * - Radar/spider chart
 * - Timeline (horizontal)
 */

import type { SVGObjectDefinition, SVGObjectKeyframe } from '@/types/svgObjects'

// ── Types ──

export type ChartType =
  | 'bar'
  | 'bar-horizontal'
  | 'pie'
  | 'donut'
  | 'line'
  | 'stat-counter'
  | 'progress'
  | 'comparison'
  | 'funnel'
  | 'radar'
  | 'timeline'

export interface DataPoint {
  label: string
  value: number
  color?: string
}

export interface InfographicRequest {
  type: ChartType
  title?: string
  data: DataPoint[]
  width?: number
  height?: number
  /** Color palette — auto-assigned to data points without explicit colors */
  palette?: string[]
  /** Show value labels */
  showValues?: boolean
  /** Show legend */
  showLegend?: boolean
  /** Unit suffix for values (e.g. '%', 'M', 'k') */
  unit?: string
  /** Animate entrance (objects start at 0 scale and grow in) */
  animateEntrance?: boolean
}

export interface InfographicResult {
  objects: SVGObjectDefinition[]
  background: string
  width: number
  height: number
}

// ── Default palettes ──

const DEFAULT_PALETTE = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#ef4444', '#84cc16',
]

const DARK_BG = '#111827'
const LIGHT_TEXT = '#f3f4f6'
const MUTED_TEXT = '#9ca3af'

// ── Main entry ──

export function generateInfographic(request: InfographicRequest): InfographicResult {
  const width = request.width || 800
  const height = request.height || 600
  const palette = request.palette || DEFAULT_PALETTE

  // Assign colors to data points
  const data = request.data.map((d, i) => ({
    ...d,
    color: d.color || palette[i % palette.length],
  }))

  const req = { ...request, data, width, height, palette }

  switch (request.type) {
    case 'bar':
      return _generateBarChart(req, false)
    case 'bar-horizontal':
      return _generateBarChart(req, true)
    case 'pie':
      return _generatePieChart(req, false)
    case 'donut':
      return _generatePieChart(req, true)
    case 'line':
      return _generateLineChart(req)
    case 'stat-counter':
      return _generateStatCounter(req)
    case 'progress':
      return _generateProgressBar(req)
    case 'comparison':
      return _generateComparison(req)
    case 'funnel':
      return _generateFunnel(req)
    case 'radar':
      return _generateRadar(req)
    case 'timeline':
      return _generateTimeline(req)
    default:
      return _generateBarChart(req, false)
  }
}

// ── Chart generators ──

type NormalizedReq = Omit<InfographicRequest, 'width' | 'height' | 'data'> & {
  width: number
  height: number
  data: (DataPoint & { color: string })[]
}

function _generateBarChart(req: NormalizedReq, horizontal: boolean): InfographicResult {
  const { width, height, data, title, showValues, unit, animateEntrance } = req
  const margin = { top: title ? 60 : 30, right: 30, bottom: 50, left: horizontal ? 100 : 50 }
  const chartW = width - margin.left - margin.right
  const chartH = height - margin.top - margin.bottom
  const maxVal = Math.max(...data.map((d) => d.value), 1)

  const bars: string[] = []
  const labels: string[] = []
  const colorDefs: Record<string, string> = {}

  if (horizontal) {
    const barHeight = Math.min(40, chartH / data.length - 8)
    const gap = (chartH - barHeight * data.length) / (data.length + 1)

    data.forEach((d, i) => {
      const colorKey = `bar${i}`
      colorDefs[colorKey] = d.color
      const barW = (d.value / maxVal) * chartW
      const y = margin.top + gap + i * (barHeight + gap)

      bars.push(`<rect x="${margin.left}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barHeight}" rx="4" fill="{{${colorKey}}}"/>`)
      labels.push(`<text x="${margin.left - 8}" y="${(y + barHeight / 2 + 5).toFixed(1)}" text-anchor="end" fill="{{textColor}}" font-size="12" font-family="system-ui">${_truncate(d.label, 12)}</text>`)
      if (showValues) {
        labels.push(`<text x="${(margin.left + barW + 8).toFixed(1)}" y="${(y + barHeight / 2 + 5).toFixed(1)}" fill="{{textColor}}" font-size="12" font-family="system-ui">${d.value}${unit || ''}</text>`)
      }
    })
  } else {
    const barWidth = Math.min(60, chartW / data.length - 8)
    const gap = (chartW - barWidth * data.length) / (data.length + 1)

    data.forEach((d, i) => {
      const colorKey = `bar${i}`
      colorDefs[colorKey] = d.color
      const barH = (d.value / maxVal) * chartH
      const x = margin.left + gap + i * (barWidth + gap)
      const y = margin.top + chartH - barH

      bars.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth}" height="${barH.toFixed(1)}" rx="4" fill="{{${colorKey}}}"/>`)
      labels.push(`<text x="${(x + barWidth / 2).toFixed(1)}" y="${(height - margin.bottom + 20).toFixed(1)}" text-anchor="middle" fill="{{mutedText}}" font-size="11" font-family="system-ui">${_truncate(d.label, 8)}</text>`)
      if (showValues) {
        labels.push(`<text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" fill="{{textColor}}" font-size="12" font-family="system-ui" font-weight="600">${d.value}${unit || ''}</text>`)
      }
    })
  }

  const titleMarkup = title
    ? `<text x="${width / 2}" y="35" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  const keyframes: SVGObjectKeyframe[] = animateEntrance
    ? [{ time: 0, scaleY: 0, opacity: 0 }, { time: 0.3, scaleY: 1, opacity: 1, easing: 'ease-out' }, { time: 1 }]
    : [{ time: 0 }]

  return {
    objects: [
      {
        name: 'bar_chart',
        zIndex: 0,
        defaultColors: { ...colorDefs, textColor: LIGHT_TEXT, mutedText: MUTED_TEXT },
        svgMarkup: `<g>${titleMarkup}${bars.join('')}${labels.join('')}</g>`,
        keyframes,
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generatePieChart(req: NormalizedReq, donut: boolean): InfographicResult {
  const { width, height, data, title, showValues, unit, animateEntrance } = req
  const cx = width / 2
  const cy = height / 2 + (title ? 15 : 0)
  const radius = Math.min(width, height) * 0.35
  const innerRadius = donut ? radius * 0.55 : 0
  const total = data.reduce((s, d) => s + d.value, 0)

  const slices: string[] = []
  const labels: string[] = []
  const colorDefs: Record<string, string> = {}
  let angle = -Math.PI / 2

  data.forEach((d, i) => {
    const colorKey = `slice${i}`
    colorDefs[colorKey] = d.color
    const sliceAngle = (d.value / total) * Math.PI * 2

    const x1 = cx + radius * Math.cos(angle)
    const y1 = cy + radius * Math.sin(angle)
    const x2 = cx + radius * Math.cos(angle + sliceAngle)
    const y2 = cy + radius * Math.sin(angle + sliceAngle)
    const largeArc = sliceAngle > Math.PI ? 1 : 0

    if (donut) {
      const ix1 = cx + innerRadius * Math.cos(angle)
      const iy1 = cy + innerRadius * Math.sin(angle)
      const ix2 = cx + innerRadius * Math.cos(angle + sliceAngle)
      const iy2 = cy + innerRadius * Math.sin(angle + sliceAngle)

      slices.push(`<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${radius},${radius} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${ix2.toFixed(1)},${iy2.toFixed(1)} A${innerRadius},${innerRadius} 0 ${largeArc},0 ${ix1.toFixed(1)},${iy1.toFixed(1)} Z" fill="{{${colorKey}}}"/>`)
    } else {
      slices.push(`<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${radius},${radius} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="{{${colorKey}}}"/>`)
    }

    // Label at midpoint of arc
    if (showValues) {
      const midAngle = angle + sliceAngle / 2
      const labelR = donut ? (radius + innerRadius) / 2 : radius * 0.65
      const lx = cx + labelR * Math.cos(midAngle)
      const ly = cy + labelR * Math.sin(midAngle)
      const pct = ((d.value / total) * 100).toFixed(0)
      labels.push(`<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" fill="{{textColor}}" font-size="12" font-family="system-ui" font-weight="600">${pct}${unit || '%'}</text>`)
    }

    angle += sliceAngle
  })

  // Legend
  const legendY = cy + radius + 30
  const legendItems = data.map((d, i) => {
    const lx = width / 2 - (data.length * 70) / 2 + i * 70
    return `<rect x="${lx}" y="${legendY}" width="10" height="10" rx="2" fill="{{slice${i}}}"/><text x="${lx + 14}" y="${legendY + 9}" fill="{{mutedText}}" font-size="10" font-family="system-ui">${_truncate(d.label, 8)}</text>`
  }).join('')

  const titleMarkup = title
    ? `<text x="${width / 2}" y="30" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  const keyframes: SVGObjectKeyframe[] = animateEntrance
    ? [{ time: 0, scaleX: 0, scaleY: 0, opacity: 0 }, { time: 0.4, scaleX: 1, scaleY: 1, opacity: 1, easing: 'ease-out' }, { time: 1 }]
    : [{ time: 0 }]

  return {
    objects: [
      {
        name: donut ? 'donut_chart' : 'pie_chart',
        zIndex: 0,
        defaultColors: { ...colorDefs, textColor: LIGHT_TEXT, mutedText: MUTED_TEXT },
        svgMarkup: `<g>${titleMarkup}${slices.join('')}${labels.join('')}${legendItems}</g>`,
        keyframes,
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generateLineChart(req: NormalizedReq): InfographicResult {
  const { width, height, data, title, showValues, unit, animateEntrance } = req
  const margin = { top: title ? 60 : 30, right: 30, bottom: 50, left: 50 }
  const chartW = width - margin.left - margin.right
  const chartH = height - margin.top - margin.bottom
  const maxVal = Math.max(...data.map((d) => d.value), 1)

  const colorDefs: Record<string, string> = { lineColor: data[0]?.color || '#6366f1', areaColor: data[0]?.color || '#6366f1' }

  // Generate points
  const points = data.map((d, i) => {
    const x = margin.left + (i / Math.max(data.length - 1, 1)) * chartW
    const y = margin.top + chartH - (d.value / maxVal) * chartH
    return { x, y, d }
  })

  // Line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Area fill path
  const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${margin.top + chartH} L${margin.left},${margin.top + chartH} Z`

  const labels = points.map((p) =>
    `<text x="${p.x.toFixed(1)}" y="${(height - margin.bottom + 20).toFixed(1)}" text-anchor="middle" fill="{{mutedText}}" font-size="10" font-family="system-ui">${_truncate(p.d.label, 6)}</text>`
  ).join('')

  const valueLabels = showValues
    ? points.map((p) =>
        `<text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" fill="{{textColor}}" font-size="11" font-family="system-ui">${p.d.value}${unit || ''}</text>`
      ).join('')
    : ''

  const dots = points.map((p) =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="{{lineColor}}" stroke="{{bgColor}}" stroke-width="2"/>`
  ).join('')

  const titleMarkup = title
    ? `<text x="${width / 2}" y="35" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  const keyframes: SVGObjectKeyframe[] = animateEntrance
    ? [{ time: 0, opacity: 0, x: -20 }, { time: 0.3, opacity: 1, x: 0, easing: 'ease-out' }, { time: 1 }]
    : [{ time: 0 }]

  return {
    objects: [
      {
        name: 'line_chart',
        zIndex: 0,
        defaultColors: { ...colorDefs, textColor: LIGHT_TEXT, mutedText: MUTED_TEXT, bgColor: DARK_BG },
        svgMarkup: `<g>${titleMarkup}<path d="${areaPath}" fill="{{areaColor}}" opacity="0.15"/><path d="${linePath}" fill="none" stroke="{{lineColor}}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}${valueLabels}</g>`,
        keyframes,
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generateStatCounter(req: NormalizedReq): InfographicResult {
  const { width, height, data, title, unit } = req
  const colorDefs: Record<string, string> = {}
  const items: string[] = []

  const cols = Math.min(data.length, 4)
  const cellW = width / cols
  const cellH = height / Math.ceil(data.length / cols)

  data.forEach((d, i) => {
    const colorKey = `stat${i}`
    colorDefs[colorKey] = d.color
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = cellW * col + cellW / 2
    const cy = cellH * row + cellH / 2

    items.push(`<text x="${cx.toFixed(1)}" y="${(cy - 5).toFixed(1)}" text-anchor="middle" fill="{{${colorKey}}}" font-size="${Math.min(48, cellW * 0.25).toFixed(0)}" font-family="system-ui" font-weight="800">${d.value}${unit || ''}</text>`)
    items.push(`<text x="${cx.toFixed(1)}" y="${(cy + 25).toFixed(1)}" text-anchor="middle" fill="{{mutedText}}" font-size="14" font-family="system-ui">${d.label}</text>`)
  })

  const titleMarkup = title
    ? `<text x="${width / 2}" y="30" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  return {
    objects: [
      {
        name: 'stat_counter',
        zIndex: 0,
        defaultColors: { ...colorDefs, textColor: LIGHT_TEXT, mutedText: MUTED_TEXT },
        svgMarkup: `<g>${titleMarkup}${items.join('')}</g>`,
        keyframes: [{ time: 0, opacity: 0, scaleY: 0.8 }, { time: 0.3, opacity: 1, scaleY: 1, easing: 'ease-out' }, { time: 1 }],
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generateProgressBar(req: NormalizedReq): InfographicResult {
  const { width, height, data, title, unit } = req
  const colorDefs: Record<string, string> = {}
  const items: string[] = []

  const barHeight = 20
  const gap = 50
  const startY = title ? 70 : 40
  const maxVal = Math.max(...data.map((d) => d.value), 100)
  const barWidth = width * 0.7
  const startX = (width - barWidth) / 2

  data.forEach((d, i) => {
    const colorKey = `prog${i}`
    colorDefs[colorKey] = d.color
    const y = startY + i * gap
    const fillW = (d.value / maxVal) * barWidth

    // Label
    items.push(`<text x="${startX}" y="${y - 8}" fill="{{textColor}}" font-size="13" font-family="system-ui">${d.label}</text>`)
    items.push(`<text x="${startX + barWidth}" y="${y - 8}" text-anchor="end" fill="{{${colorKey}}}" font-size="13" font-family="system-ui" font-weight="600">${d.value}${unit || '%'}</text>`)

    // Background track
    items.push(`<rect x="${startX}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="{{trackColor}}"/>`)

    // Fill bar
    items.push(`<rect x="${startX}" y="${y}" width="${fillW.toFixed(1)}" height="${barHeight}" rx="${barHeight / 2}" fill="{{${colorKey}}}"/>`)
  })

  const titleMarkup = title
    ? `<text x="${width / 2}" y="35" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  return {
    objects: [
      {
        name: 'progress_bars',
        zIndex: 0,
        defaultColors: { ...colorDefs, textColor: LIGHT_TEXT, trackColor: '#374151' },
        svgMarkup: `<g>${titleMarkup}${items.join('')}</g>`,
        keyframes: [{ time: 0, scaleX: 0 }, { time: 0.4, scaleX: 1, easing: 'ease-out' }, { time: 1 }],
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generateComparison(req: NormalizedReq): InfographicResult {
  const { width, height, data, title, unit } = req
  // Take first two data points for comparison
  const left = data[0] || { label: 'A', value: 50, color: '#6366f1' }
  const right = data[1] || { label: 'B', value: 50, color: '#f43f5e' }
  const total = left.value + right.value
  const leftPct = left.value / total
  const midX = width * leftPct

  const titleMarkup = title
    ? `<text x="${width / 2}" y="35" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  const cy = height / 2 + (title ? 10 : 0)

  return {
    objects: [
      {
        name: 'comparison',
        zIndex: 0,
        defaultColors: { leftColor: left.color, rightColor: right.color, textColor: LIGHT_TEXT, mutedText: MUTED_TEXT },
        svgMarkup: `<g>${titleMarkup}<rect x="0" y="${cy - 60}" width="${midX.toFixed(1)}" height="120" fill="{{leftColor}}" opacity="0.2"/><rect x="${midX.toFixed(1)}" y="${cy - 60}" width="${(width - midX).toFixed(1)}" height="120" fill="{{rightColor}}" opacity="0.2"/><line x1="${midX.toFixed(1)}" y1="${cy - 70}" x2="${midX.toFixed(1)}" y2="${cy + 70}" stroke="{{textColor}}" stroke-width="2" stroke-dasharray="4,4"/><text x="${midX / 2}" y="${cy - 15}" text-anchor="middle" fill="{{leftColor}}" font-size="36" font-family="system-ui" font-weight="800">${left.value}${unit || ''}</text><text x="${midX / 2}" y="${cy + 20}" text-anchor="middle" fill="{{mutedText}}" font-size="14" font-family="system-ui">${left.label}</text><text x="${midX + (width - midX) / 2}" y="${cy - 15}" text-anchor="middle" fill="{{rightColor}}" font-size="36" font-family="system-ui" font-weight="800">${right.value}${unit || ''}</text><text x="${midX + (width - midX) / 2}" y="${cy + 20}" text-anchor="middle" fill="{{mutedText}}" font-size="14" font-family="system-ui">${right.label}</text></g>`,
        keyframes: [{ time: 0, opacity: 0 }, { time: 0.3, opacity: 1, easing: 'ease-out' }, { time: 1 }],
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generateFunnel(req: NormalizedReq): InfographicResult {
  const { width, height, data, title, showValues, unit, animateEntrance } = req
  const colorDefs: Record<string, string> = {}
  const items: string[] = []

  const margin = title ? 60 : 30
  const funnelH = height - margin - 30
  const stepH = funnelH / data.length
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const cx = width / 2
  const maxW = width * 0.8

  data.forEach((d, i) => {
    const colorKey = `funnel${i}`
    colorDefs[colorKey] = d.color
    const y = margin + i * stepH
    const topW = (d.value / maxVal) * maxW
    const nextVal = data[i + 1]?.value ?? d.value * 0.5
    const bottomW = (nextVal / maxVal) * maxW

    const x1 = cx - topW / 2
    const x2 = cx + topW / 2
    const x3 = cx + bottomW / 2
    const x4 = cx - bottomW / 2

    items.push(`<path d="M${x1.toFixed(1)},${y.toFixed(1)} L${x2.toFixed(1)},${y.toFixed(1)} L${x3.toFixed(1)},${(y + stepH).toFixed(1)} L${x4.toFixed(1)},${(y + stepH).toFixed(1)} Z" fill="{{${colorKey}}}" opacity="0.85"/>`)
    items.push(`<text x="${cx}" y="${(y + stepH / 2 + 5).toFixed(1)}" text-anchor="middle" fill="{{textColor}}" font-size="13" font-family="system-ui" font-weight="600">${d.label}${showValues ? ` (${d.value}${unit || ''})` : ''}</text>`)
  })

  const titleMarkup = title
    ? `<text x="${cx}" y="35" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  const keyframes: SVGObjectKeyframe[] = animateEntrance
    ? [{ time: 0, scaleY: 0, opacity: 0 }, { time: 0.35, scaleY: 1, opacity: 1, easing: 'ease-out' }, { time: 1 }]
    : [{ time: 0 }]

  return {
    objects: [
      {
        name: 'funnel_chart',
        zIndex: 0,
        defaultColors: { ...colorDefs, textColor: LIGHT_TEXT },
        svgMarkup: `<g>${titleMarkup}${items.join('')}</g>`,
        keyframes,
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generateRadar(req: NormalizedReq): InfographicResult {
  const { width, height, data, title, showValues, unit } = req
  const cx = width / 2
  const cy = height / 2 + (title ? 10 : 0)
  const radius = Math.min(width, height) * 0.35
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const n = data.length

  const gridLines: string[] = []
  const axisLines: string[] = []
  const labels: string[] = []

  // Grid rings
  for (let ring = 1; ring <= 4; ring++) {
    const r = (ring / 4) * radius
    const ringPts = Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
    })
    gridLines.push(`<polygon points="${ringPts.join(' ')}" fill="none" stroke="{{gridColor}}" stroke-width="0.5"/>`)
  }

  // Axes and labels
  data.forEach((d, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const ex = cx + radius * Math.cos(angle)
    const ey = cy + radius * Math.sin(angle)
    axisLines.push(`<line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="{{gridColor}}" stroke-width="0.5"/>`)
    const lx = cx + (radius + 20) * Math.cos(angle)
    const ly = cy + (radius + 20) * Math.sin(angle)
    labels.push(`<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" fill="{{mutedText}}" font-size="11" font-family="system-ui">${_truncate(d.label, 8)}${showValues ? ` ${d.value}${unit || ''}` : ''}</text>`)
  })

  // Data polygon
  const dataPts = data.map((d, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const r = (d.value / maxVal) * radius
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
  })

  const titleMarkup = title
    ? `<text x="${cx}" y="30" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  return {
    objects: [
      {
        name: 'radar_chart',
        zIndex: 0,
        defaultColors: { fillColor: data[0]?.color || '#6366f1', strokeColor: data[0]?.color || '#6366f1', textColor: LIGHT_TEXT, mutedText: MUTED_TEXT, gridColor: '#374151' },
        svgMarkup: `<g>${titleMarkup}${gridLines.join('')}${axisLines.join('')}<polygon points="${dataPts.join(' ')}" fill="{{fillColor}}" opacity="0.25" stroke="{{strokeColor}}" stroke-width="2"/>${labels.join('')}</g>`,
        keyframes: [{ time: 0, scaleX: 0, scaleY: 0, opacity: 0 }, { time: 0.4, scaleX: 1, scaleY: 1, opacity: 1, easing: 'ease-out' }, { time: 1 }],
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

function _generateTimeline(req: NormalizedReq): InfographicResult {
  const { width, height, data, title } = req
  const colorDefs: Record<string, string> = {}
  const items: string[] = []
  const lineY = height / 2 + (title ? 10 : 0)
  const lineStart = 60
  const lineEnd = width - 60
  const lineW = lineEnd - lineStart

  // Main line
  items.push(`<line x1="${lineStart}" y1="${lineY}" x2="${lineEnd}" y2="${lineY}" stroke="{{lineColor}}" stroke-width="2"/>`)

  data.forEach((d, i) => {
    const colorKey = `node${i}`
    colorDefs[colorKey] = d.color
    const x = lineStart + (i / Math.max(data.length - 1, 1)) * lineW
    const above = i % 2 === 0

    // Node
    items.push(`<circle cx="${x.toFixed(1)}" cy="${lineY}" r="8" fill="{{${colorKey}}}" stroke="{{bgColor}}" stroke-width="3"/>`)

    // Connector
    const textY = above ? lineY - 30 : lineY + 40
    items.push(`<line x1="${x.toFixed(1)}" y1="${lineY + (above ? -8 : 8)}" x2="${x.toFixed(1)}" y2="${(textY + (above ? 15 : -25)).toFixed(1)}" stroke="{{${colorKey}}}" stroke-width="1" opacity="0.5"/>`)

    // Label
    items.push(`<text x="${x.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="middle" fill="{{textColor}}" font-size="12" font-family="system-ui" font-weight="600">${d.label}</text>`)
    items.push(`<text x="${x.toFixed(1)}" y="${(textY + 16).toFixed(1)}" text-anchor="middle" fill="{{mutedText}}" font-size="11" font-family="system-ui">${d.value}</text>`)
  })

  const titleMarkup = title
    ? `<text x="${width / 2}" y="30" text-anchor="middle" fill="{{textColor}}" font-size="18" font-family="system-ui" font-weight="700">${title}</text>`
    : ''

  return {
    objects: [
      {
        name: 'timeline_chart',
        zIndex: 0,
        defaultColors: { ...colorDefs, textColor: LIGHT_TEXT, mutedText: MUTED_TEXT, lineColor: '#4b5563', bgColor: DARK_BG },
        svgMarkup: `<g>${titleMarkup}${items.join('')}</g>`,
        keyframes: [{ time: 0, opacity: 0, x: -30 }, { time: 0.3, opacity: 1, x: 0, easing: 'ease-out' }, { time: 1 }],
      },
    ],
    background: 'transparent',
    width,
    height,
  }
}

// ── Utility ──

function _truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s
}
