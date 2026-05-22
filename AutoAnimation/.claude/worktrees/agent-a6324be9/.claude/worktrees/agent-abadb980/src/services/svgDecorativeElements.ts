/**
 * SVG Decorative Elements Generator
 *
 * Produces procedural decorative SVG elements:
 * - Borders and frames
 * - Dividers and separators
 * - Corner flourishes
 * - Badges and ribbons
 * - Particle overlays (confetti, sparkles, snow)
 *
 * All elements use {{colorName}} placeholders for theming.
 * No AI API calls — pure procedural generation.
 */

import type { SVGObjectDefinition, SVGObjectKeyframe } from '@/types/svgObjects'

// ── Types ──

export type DecorativeType =
  | 'border-simple'
  | 'border-double'
  | 'border-dashed'
  | 'border-ornate'
  | 'divider-line'
  | 'divider-dots'
  | 'divider-wave'
  | 'divider-diamond'
  | 'corner-flourish'
  | 'corner-bracket'
  | 'badge-circle'
  | 'badge-ribbon'
  | 'badge-shield'
  | 'badge-star'
  | 'particles-confetti'
  | 'particles-sparkle'
  | 'particles-snow'
  | 'particles-bubbles'
  | 'underline-brush'
  | 'underline-zigzag'

export interface DecorativeRequest {
  type: DecorativeType
  width?: number
  height?: number
  /** For dividers/underlines: y position as fraction (0-1) of height */
  position?: number
  /** For badges: label text */
  label?: string
  colors?: string[]
  /** Seed for procedural randomness */
  seed?: number
  /** Animate the element */
  animated?: boolean
}

export interface DecorativeResult {
  objects: SVGObjectDefinition[]
  width: number
  height: number
}

// ── Main API ──

export function generateDecorative(request: DecorativeRequest): DecorativeResult {
  const width = request.width || 800
  const height = request.height || 600
  const colors = request.colors || ['#6366f1', '#ec4899']
  const seed = request.seed || 42
  const ctx = { ...request, width, height, colors, seed }

  switch (request.type) {
    // Borders
    case 'border-simple': return _borderSimple(ctx)
    case 'border-double': return _borderDouble(ctx)
    case 'border-dashed': return _borderDashed(ctx)
    case 'border-ornate': return _borderOrnate(ctx)
    // Dividers
    case 'divider-line': return _dividerLine(ctx)
    case 'divider-dots': return _dividerDots(ctx)
    case 'divider-wave': return _dividerWave(ctx)
    case 'divider-diamond': return _dividerDiamond(ctx)
    // Corners
    case 'corner-flourish': return _cornerFlourish(ctx)
    case 'corner-bracket': return _cornerBracket(ctx)
    // Badges
    case 'badge-circle': return _badgeCircle(ctx)
    case 'badge-ribbon': return _badgeRibbon(ctx)
    case 'badge-shield': return _badgeShield(ctx)
    case 'badge-star': return _badgeStar(ctx)
    // Particles
    case 'particles-confetti': return _particlesConfetti(ctx)
    case 'particles-sparkle': return _particlesSparkle(ctx)
    case 'particles-snow': return _particlesSnow(ctx)
    case 'particles-bubbles': return _particlesBubbles(ctx)
    // Underlines
    case 'underline-brush': return _underlineBrush(ctx)
    case 'underline-zigzag': return _underlineZigzag(ctx)
    default: return _borderSimple(ctx)
  }
}

// ── Borders ──

type Ctx = DecorativeRequest & { width: number; height: number; colors: string[]; seed: number }

function _borderSimple(ctx: Ctx): DecorativeResult {
  const { width, height, colors } = ctx
  const inset = 15
  return _wrap('border_simple', width, height, {
    defaultColors: { borderColor: colors[0] },
    svgMarkup: `<g><rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="8" fill="none" stroke="{{borderColor}}" stroke-width="2"/></g>`,
  })
}

function _borderDouble(ctx: Ctx): DecorativeResult {
  const { width, height, colors } = ctx
  return _wrap('border_double', width, height, {
    defaultColors: { outer: colors[0], inner: colors[1] || colors[0] },
    svgMarkup: `<g><rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="6" fill="none" stroke="{{outer}}" stroke-width="2"/><rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="4" fill="none" stroke="{{inner}}" stroke-width="1"/></g>`,
  })
}

function _borderDashed(ctx: Ctx): DecorativeResult {
  const { width, height, colors } = ctx
  return _wrap('border_dashed', width, height, {
    defaultColors: { borderColor: colors[0] },
    svgMarkup: `<g><rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="6" fill="none" stroke="{{borderColor}}" stroke-width="2" stroke-dasharray="8,6"/></g>`,
  })
}

function _borderOrnate(ctx: Ctx): DecorativeResult {
  const { width, height, colors } = ctx
  const inset = 20
  const cornerSize = 30

  // Ornate corners with small decorative elements
  const corners = [
    // Top-left
    `<path d="M${inset},${inset + cornerSize} L${inset},${inset} L${inset + cornerSize},${inset}" fill="none" stroke="{{accent}}" stroke-width="2"/>`,
    `<circle cx="${inset}" cy="${inset}" r="3" fill="{{accent}}"/>`,
    // Top-right
    `<path d="M${width - inset - cornerSize},${inset} L${width - inset},${inset} L${width - inset},${inset + cornerSize}" fill="none" stroke="{{accent}}" stroke-width="2"/>`,
    `<circle cx="${width - inset}" cy="${inset}" r="3" fill="{{accent}}"/>`,
    // Bottom-left
    `<path d="M${inset},${height - inset - cornerSize} L${inset},${height - inset} L${inset + cornerSize},${height - inset}" fill="none" stroke="{{accent}}" stroke-width="2"/>`,
    `<circle cx="${inset}" cy="${height - inset}" r="3" fill="{{accent}}"/>`,
    // Bottom-right
    `<path d="M${width - inset - cornerSize},${height - inset} L${width - inset},${height - inset} L${width - inset},${height - inset - cornerSize}" fill="none" stroke="{{accent}}" stroke-width="2"/>`,
    `<circle cx="${width - inset}" cy="${height - inset}" r="3" fill="{{accent}}"/>`,
  ].join('')

  // Connecting lines
  const lines = `<line x1="${inset + cornerSize}" y1="${inset}" x2="${width - inset - cornerSize}" y2="${inset}" stroke="{{lineColor}}" stroke-width="0.5" stroke-dasharray="4,4"/><line x1="${inset + cornerSize}" y1="${height - inset}" x2="${width - inset - cornerSize}" y2="${height - inset}" stroke="{{lineColor}}" stroke-width="0.5" stroke-dasharray="4,4"/><line x1="${inset}" y1="${inset + cornerSize}" x2="${inset}" y2="${height - inset - cornerSize}" stroke="{{lineColor}}" stroke-width="0.5" stroke-dasharray="4,4"/><line x1="${width - inset}" y1="${inset + cornerSize}" x2="${width - inset}" y2="${height - inset - cornerSize}" stroke="{{lineColor}}" stroke-width="0.5" stroke-dasharray="4,4"/>`

  return _wrap('border_ornate', width, height, {
    defaultColors: { accent: colors[0], lineColor: colors[1] || '#4b5563' },
    svgMarkup: `<g>${corners}${lines}</g>`,
  })
}

// ── Dividers ──

function _dividerLine(ctx: Ctx): DecorativeResult {
  const { width, height, colors, position } = ctx
  const y = (position || 0.5) * height
  const margin = width * 0.1

  return _wrap('divider_line', width, height, {
    defaultColors: { lineColor: colors[0] },
    svgMarkup: `<g><line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="{{lineColor}}" stroke-width="1.5"/><circle cx="${width / 2}" cy="${y}" r="3" fill="{{lineColor}}"/></g>`,
  })
}

function _dividerDots(ctx: Ctx): DecorativeResult {
  const { width, height, colors, position } = ctx
  const y = (position || 0.5) * height
  const dotCount = 15
  const margin = width * 0.15
  const spacing = (width - margin * 2) / (dotCount - 1)

  const dots = Array.from({ length: dotCount }, (_, i) => {
    const x = margin + i * spacing
    const r = i === Math.floor(dotCount / 2) ? 4 : 2
    return `<circle cx="${x.toFixed(1)}" cy="${y}" r="${r}" fill="{{dotColor}}"/>`
  }).join('')

  return _wrap('divider_dots', width, height, {
    defaultColors: { dotColor: colors[0] },
    svgMarkup: `<g>${dots}</g>`,
  })
}

function _dividerWave(ctx: Ctx): DecorativeResult {
  const { width, height, colors, position } = ctx
  const y = (position || 0.5) * height
  const margin = width * 0.08
  const amp = 8
  const freq = 6
  const segW = (width - margin * 2) / freq

  let d = `M${margin},${y}`
  for (let i = 0; i < freq; i++) {
    const x1 = margin + i * segW + segW * 0.5
    const cy1 = i % 2 === 0 ? y - amp : y + amp
    const x2 = margin + (i + 1) * segW
    d += ` Q${x1.toFixed(1)},${cy1.toFixed(1)} ${x2.toFixed(1)},${y}`
  }

  return _wrap('divider_wave', width, height, {
    defaultColors: { waveColor: colors[0] },
    svgMarkup: `<g><path d="${d}" fill="none" stroke="{{waveColor}}" stroke-width="2" stroke-linecap="round"/></g>`,
  })
}

function _dividerDiamond(ctx: Ctx): DecorativeResult {
  const { width, height, colors, position } = ctx
  const y = (position || 0.5) * height
  const margin = width * 0.1
  const cx = width / 2
  const dSize = 6

  return _wrap('divider_diamond', width, height, {
    defaultColors: { lineColor: colors[0], diamond: colors[1] || colors[0] },
    svgMarkup: `<g><line x1="${margin}" y1="${y}" x2="${cx - 15}" y2="${y}" stroke="{{lineColor}}" stroke-width="1"/><polygon points="${cx},${y - dSize} ${cx + dSize},${y} ${cx},${y + dSize} ${cx - dSize},${y}" fill="{{diamond}}"/><line x1="${cx + 15}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="{{lineColor}}" stroke-width="1"/></g>`,
  })
}

// ── Corners ──

function _cornerFlourish(ctx: Ctx): DecorativeResult {
  const { width, height, colors } = ctx
  const s = 50 // flourish size

  const flourish = (ox: number, oy: number, fx: number, fy: number) => {
    return `<path d="M${ox},${oy + fy * s} Q${ox},${oy} ${ox + fx * s},${oy}" fill="none" stroke="{{flourishColor}}" stroke-width="2" stroke-linecap="round"/><path d="M${ox},${oy + fy * s * 0.6} Q${ox + fx * 8},${oy + fy * 8} ${ox + fx * s * 0.6},${oy}" fill="none" stroke="{{flourishColor}}" stroke-width="1.5" stroke-linecap="round"/>`
  }

  const markup = [
    flourish(20, 20, 1, 1),
    flourish(width - 20, 20, -1, 1),
    flourish(20, height - 20, 1, -1),
    flourish(width - 20, height - 20, -1, -1),
  ].join('')

  return _wrap('corner_flourish', width, height, {
    defaultColors: { flourishColor: colors[0] },
    svgMarkup: `<g>${markup}</g>`,
  })
}

function _cornerBracket(ctx: Ctx): DecorativeResult {
  const { width, height, colors } = ctx
  const len = 40
  const inset = 15

  const corners = [
    `<path d="M${inset},${inset + len} L${inset},${inset} L${inset + len},${inset}" fill="none" stroke="{{bracketColor}}" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M${width - inset - len},${inset} L${width - inset},${inset} L${width - inset},${inset + len}" fill="none" stroke="{{bracketColor}}" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M${inset},${height - inset - len} L${inset},${height - inset} L${inset + len},${height - inset}" fill="none" stroke="{{bracketColor}}" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M${width - inset - len},${height - inset} L${width - inset},${height - inset} L${width - inset},${height - inset - len}" fill="none" stroke="{{bracketColor}}" stroke-width="3" stroke-linecap="round"/>`,
  ].join('')

  return _wrap('corner_bracket', width, height, {
    defaultColors: { bracketColor: colors[0] },
    svgMarkup: `<g>${corners}</g>`,
  })
}

// ── Badges ──

function _badgeCircle(ctx: Ctx): DecorativeResult {
  const { width, height, colors, label } = ctx
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(width, height) * 0.15
  const text = label || ''

  return _wrap('badge_circle', width, height, {
    defaultColors: { bg: colors[0], text: '#ffffff', ring: colors[1] || colors[0] },
    svgMarkup: `<g><circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="{{ring}}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="{{bg}}"/>${text ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="{{text}}" font-size="${Math.min(16, r * 0.5)}" font-family="system-ui" font-weight="700">${_escapeXml(text)}</text>` : ''}</g>`,
  })
}

function _badgeRibbon(ctx: Ctx): DecorativeResult {
  const { width, height, colors, label } = ctx
  const cx = width / 2
  const cy = height / 2
  const bw = Math.min(width * 0.6, 300)
  const bh = 40
  const tailH = 15

  const text = label || ''

  return _wrap('badge_ribbon', width, height, {
    defaultColors: { ribbon: colors[0], text: '#ffffff', shadow: colors[1] || '#000000' },
    svgMarkup: `<g><polygon points="${cx - bw / 2 - 15},${cy} ${cx - bw / 2},${cy - bh / 2} ${cx + bw / 2},${cy - bh / 2} ${cx + bw / 2 + 15},${cy} ${cx + bw / 2},${cy + bh / 2} ${cx - bw / 2},${cy + bh / 2}" fill="{{ribbon}}"/><polygon points="${cx - bw / 2},${cy + bh / 2} ${cx - bw / 2 + 10},${cy + bh / 2 + tailH} ${cx - bw / 2 + 20},${cy + bh / 2}" fill="{{shadow}}" opacity="0.3"/><polygon points="${cx + bw / 2},${cy + bh / 2} ${cx + bw / 2 - 10},${cy + bh / 2 + tailH} ${cx + bw / 2 - 20},${cy + bh / 2}" fill="{{shadow}}" opacity="0.3"/>${text ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="{{text}}" font-size="16" font-family="system-ui" font-weight="700">${_escapeXml(text)}</text>` : ''}</g>`,
  })
}

function _badgeShield(ctx: Ctx): DecorativeResult {
  const { width, height, colors, label } = ctx
  const cx = width / 2
  const cy = height / 2
  const sw = 60
  const sh = 75
  const text = label || ''

  return _wrap('badge_shield', width, height, {
    defaultColors: { shield: colors[0], text: '#ffffff' },
    svgMarkup: `<g><path d="M${cx},${cy - sh / 2} L${cx + sw / 2},${cy - sh / 2 + 15} L${cx + sw / 2},${cy + 10} Q${cx + sw / 2},${cy + sh / 2} ${cx},${cy + sh / 2} Q${cx - sw / 2},${cy + sh / 2} ${cx - sw / 2},${cy + 10} L${cx - sw / 2},${cy - sh / 2 + 15} Z" fill="{{shield}}"/>${text ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="{{text}}" font-size="14" font-family="system-ui" font-weight="700">${_escapeXml(text)}</text>` : ''}</g>`,
  })
}

function _badgeStar(ctx: Ctx): DecorativeResult {
  const { width, height, colors, label } = ctx
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(width, height) * 0.15
  const points = 5
  const text = label || ''

  const pts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.5
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`)
  }

  return _wrap('badge_star', width, height, {
    defaultColors: { star: colors[0], text: '#ffffff' },
    svgMarkup: `<g><polygon points="${pts.join(' ')}" fill="{{star}}"/>${text ? `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="{{text}}" font-size="12" font-family="system-ui" font-weight="700">${_escapeXml(text)}</text>` : ''}</g>`,
  })
}

// ── Particles ──

function _particlesConfetti(ctx: Ctx): DecorativeResult {
  const { width, height, colors, seed, animated } = ctx
  const rng = _seededRng(seed)
  const count = 40
  const pieces: string[] = []
  const colorDefs: Record<string, string> = {}

  for (let i = 0; i < count; i++) {
    const colorKey = `c${i % 5}`
    colorDefs[colorKey] = colors[i % colors.length] || '#6366f1'
    const x = rng() * width
    const y = rng() * height
    const w = 4 + rng() * 8
    const h = 2 + rng() * 4
    const rot = rng() * 360
    pieces.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="{{${colorKey}}}" opacity="${(0.5 + rng() * 0.5).toFixed(2)}" transform="rotate(${rot.toFixed(0)},${(x + w / 2).toFixed(1)},${(y + h / 2).toFixed(1)})"/>`)
  }

  const keyframes: SVGObjectKeyframe[] = animated
    ? [{ time: 0, y: -20, opacity: 0 }, { time: 0.3, y: 0, opacity: 1, easing: 'ease-out' }, { time: 0.9, opacity: 1 }, { time: 1, opacity: 0, y: 10 }]
    : [{ time: 0 }]

  return {
    objects: [{
      name: 'confetti',
      zIndex: 20,
      defaultColors: colorDefs,
      svgMarkup: `<g>${pieces.join('')}</g>`,
      keyframes,
    }],
    width,
    height,
  }
}

function _particlesSparkle(ctx: Ctx): DecorativeResult {
  const { width, height, colors, seed } = ctx
  const rng = _seededRng(seed)
  const count = 25
  const sparkles: string[] = []

  for (let i = 0; i < count; i++) {
    const x = rng() * width
    const y = rng() * height
    const s = 3 + rng() * 6
    const opacity = 0.3 + rng() * 0.7
    // 4-pointed star
    sparkles.push(`<path d="M${x},${y - s} L${x + s * 0.3},${y} L${x},${y + s} L${x - s * 0.3},${y} Z" fill="{{sparkle}}" opacity="${opacity.toFixed(2)}"/>`)
  }

  return {
    objects: [{
      name: 'sparkles',
      zIndex: 20,
      defaultColors: { sparkle: colors[0] || '#fbbf24' },
      svgMarkup: `<g>${sparkles.join('')}</g>`,
      keyframes: [{ time: 0, opacity: 0.5 }, { time: 0.5, opacity: 1 }, { time: 1, opacity: 0.5 }],
    }],
    width,
    height,
  }
}

function _particlesSnow(ctx: Ctx): DecorativeResult {
  const { width, height, seed } = ctx
  const rng = _seededRng(seed)
  const count = 50
  const flakes: string[] = []

  for (let i = 0; i < count; i++) {
    const x = rng() * width
    const y = rng() * height
    const r = 1 + rng() * 3
    const opacity = 0.3 + rng() * 0.6
    flakes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="{{snow}}" opacity="${opacity.toFixed(2)}"/>`)
  }

  return {
    objects: [{
      name: 'snowflakes',
      zIndex: 20,
      defaultColors: { snow: '#ffffff' },
      svgMarkup: `<g>${flakes.join('')}</g>`,
      keyframes: [{ time: 0, y: -30 }, { time: 1, y: 30 }],
    }],
    width,
    height,
  }
}

function _particlesBubbles(ctx: Ctx): DecorativeResult {
  const { width, height, colors, seed } = ctx
  const rng = _seededRng(seed)
  const count = 20
  const bubbles: string[] = []

  for (let i = 0; i < count; i++) {
    const x = rng() * width
    const y = height * 0.3 + rng() * height * 0.7
    const r = 5 + rng() * 20
    const opacity = 0.1 + rng() * 0.3
    bubbles.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="{{bubble}}" stroke-width="1" opacity="${opacity.toFixed(2)}"/>`)
  }

  return {
    objects: [{
      name: 'bubbles',
      zIndex: 20,
      defaultColors: { bubble: colors[0] || '#60a5fa' },
      svgMarkup: `<g>${bubbles.join('')}</g>`,
      keyframes: [{ time: 0, y: 0 }, { time: 1, y: -40 }],
    }],
    width,
    height,
  }
}

// ── Underlines ──

function _underlineBrush(ctx: Ctx): DecorativeResult {
  const { width, height, colors, position, seed } = ctx
  const y = (position || 0.7) * height
  const rng = _seededRng(seed)
  const startX = width * 0.15
  const endX = width * 0.85

  // Irregular brush stroke path
  let d = `M${startX},${y}`
  const steps = 20
  const stepW = (endX - startX) / steps

  for (let i = 1; i <= steps; i++) {
    const x = startX + i * stepW
    const yOff = (rng() - 0.5) * 4
    d += ` L${x.toFixed(1)},${(y + yOff).toFixed(1)}`
  }

  return _wrap('underline_brush', width, height, {
    defaultColors: { brushColor: colors[0] },
    svgMarkup: `<g><path d="${d}" fill="none" stroke="{{brushColor}}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  })
}

function _underlineZigzag(ctx: Ctx): DecorativeResult {
  const { width, height, colors, position } = ctx
  const y = (position || 0.7) * height
  const startX = width * 0.15
  const endX = width * 0.85
  const zigH = 5
  const zigW = 10
  const steps = Math.floor((endX - startX) / zigW)

  let d = `M${startX},${y}`
  for (let i = 0; i < steps; i++) {
    const x = startX + (i + 1) * zigW
    const yDir = i % 2 === 0 ? y - zigH : y + zigH
    d += ` L${x.toFixed(1)},${yDir.toFixed(1)}`
  }

  return _wrap('underline_zigzag', width, height, {
    defaultColors: { zigColor: colors[0] },
    svgMarkup: `<g><path d="${d}" fill="none" stroke="{{zigColor}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  })
}

// ── Helpers ──

function _wrap(
  name: string,
  width: number,
  height: number,
  obj: Pick<SVGObjectDefinition, 'defaultColors' | 'svgMarkup'>,
  keyframes?: SVGObjectKeyframe[],
): DecorativeResult {
  return {
    objects: [{
      name,
      zIndex: 15,
      defaultColors: obj.defaultColors,
      svgMarkup: obj.svgMarkup,
      keyframes: keyframes || [{ time: 0 }],
    }],
    width,
    height,
  }
}

function _seededRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function _escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
