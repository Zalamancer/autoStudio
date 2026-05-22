/**
 * SVG Text Effects Generator
 *
 * Produces SVG markup with special text treatments:
 * - Text along curved paths
 * - Gradient text fills
 * - Outlined / stroked text
 * - Text masks (text as clipping mask over an image/gradient)
 * - Drop shadow text
 * - Animated text reveals
 *
 * All outputs use {{colorName}} placeholders for theming.
 */

import type { SVGObjectDefinition, SVGObjectKeyframe } from '@/types/svgObjects'

// ── Types ──

export type TextEffectType =
  | 'gradient'
  | 'outline'
  | 'shadow'
  | 'path-arc'
  | 'path-wave'
  | 'path-circle'
  | 'mask-gradient'
  | 'stacked'
  | 'glitch'
  | 'neon-glow'

export interface TextEffectRequest {
  text: string
  effect: TextEffectType
  width?: number
  height?: number
  fontSize?: number
  fontFamily?: string
  /** Color palette for the effect */
  colors?: string[]
  /** Animate entrance */
  animated?: boolean
}

export interface TextEffectResult {
  objects: SVGObjectDefinition[]
  width: number
  height: number
}

// ── Main API ──

export function generateTextEffect(request: TextEffectRequest): TextEffectResult {
  const width = request.width || 600
  const height = request.height || 200
  const fontSize = request.fontSize || 48
  const fontFamily = request.fontFamily || 'system-ui, sans-serif'
  const colors = request.colors || ['#6366f1', '#ec4899', '#f59e0b']

  const ctx = { ...request, width, height, fontSize, fontFamily, colors }

  switch (request.effect) {
    case 'gradient':
      return _gradientText(ctx)
    case 'outline':
      return _outlineText(ctx)
    case 'shadow':
      return _shadowText(ctx)
    case 'path-arc':
      return _pathText(ctx, 'arc')
    case 'path-wave':
      return _pathText(ctx, 'wave')
    case 'path-circle':
      return _pathText(ctx, 'circle')
    case 'mask-gradient':
      return _maskGradientText(ctx)
    case 'stacked':
      return _stackedText(ctx)
    case 'glitch':
      return _glitchText(ctx)
    case 'neon-glow':
      return _neonGlowText(ctx)
    default:
      return _gradientText(ctx)
  }
}

// ── Effect implementations ──

type Ctx = TextEffectRequest & { width: number; height: number; fontSize: number; fontFamily: string; colors: string[] }

function _gradientText(ctx: Ctx): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors, animated } = ctx
  const id = `tg-${_uid()}`
  const stops = colors.map((c, i) => {
    const offset = colors.length === 1 ? 50 : (i / (colors.length - 1)) * 100
    return `<stop offset="${offset}%" stop-color="${c}"/>`
  }).join('')

  const keyframes: SVGObjectKeyframe[] = animated
    ? [{ time: 0, opacity: 0, y: 10 }, { time: 0.3, opacity: 1, y: 0, easing: 'ease-out' }, { time: 1 }]
    : [{ time: 0 }]

  return {
    objects: [{
      name: 'gradient_text',
      zIndex: 0,
      defaultColors: Object.fromEntries(colors.map((c, i) => [`color${i}`, c])),
      svgMarkup: `<g><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">${stops}</linearGradient></defs><text x="${width / 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="url(#${id})" font-size="${fontSize}" font-family="${fontFamily}" font-weight="800">${_escapeXml(text)}</text></g>`,
      keyframes,
    }],
    width,
    height,
  }
}

function _outlineText(ctx: Ctx): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors, animated } = ctx
  const strokeColor = colors[0] || '#ffffff'

  const keyframes: SVGObjectKeyframe[] = animated
    ? [{ time: 0, opacity: 0 }, { time: 0.2, opacity: 1, easing: 'ease-out' }, { time: 1 }]
    : [{ time: 0 }]

  return {
    objects: [{
      name: 'outline_text',
      zIndex: 0,
      defaultColors: { stroke: strokeColor, fill: 'transparent' },
      svgMarkup: `<g><text x="${width / 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="none" stroke="{{stroke}}" stroke-width="2" font-size="${fontSize}" font-family="${fontFamily}" font-weight="800">${_escapeXml(text)}</text></g>`,
      keyframes,
    }],
    width,
    height,
  }
}

function _shadowText(ctx: Ctx): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors, animated } = ctx
  const textColor = colors[0] || '#ffffff'
  const shadowColor = colors[1] || '#000000'

  const keyframes: SVGObjectKeyframe[] = animated
    ? [{ time: 0, opacity: 0, y: -10 }, { time: 0.3, opacity: 1, y: 0, easing: 'ease-out' }, { time: 1 }]
    : [{ time: 0 }]

  const id = `ts-${_uid()}`

  return {
    objects: [{
      name: 'shadow_text',
      zIndex: 0,
      defaultColors: { textColor, shadowColor },
      svgMarkup: `<g><defs><filter id="${id}"><feDropShadow dx="3" dy="3" stdDeviation="2" flood-color="{{shadowColor}}" flood-opacity="0.5"/></filter></defs><text x="${width / 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="{{textColor}}" filter="url(#${id})" font-size="${fontSize}" font-family="${fontFamily}" font-weight="700">${_escapeXml(text)}</text></g>`,
      keyframes,
    }],
    width,
    height,
  }
}

function _pathText(ctx: Ctx, pathType: 'arc' | 'wave' | 'circle'): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors, animated } = ctx
  const textColor = colors[0] || '#ffffff'
  const id = `tp-${_uid()}`

  let pathD: string
  if (pathType === 'arc') {
    const rx = width * 0.4
    const ry = height * 0.3
    const startX = width / 2 - rx
    const startY = height / 2 + ry * 0.3
    pathD = `M${startX},${startY} A${rx},${ry} 0 0,1 ${width / 2 + rx},${startY}`
  } else if (pathType === 'wave') {
    const y = height / 2
    const amp = height * 0.15
    const segs = 4
    const segW = width / segs
    let d = `M0,${y}`
    for (let i = 0; i < segs; i++) {
      const cp1x = i * segW + segW * 0.5
      const cp1y = i % 2 === 0 ? y - amp : y + amp
      const endX = (i + 1) * segW
      d += ` Q${cp1x},${cp1y} ${endX},${y}`
    }
    pathD = d
  } else {
    // circle
    const r = Math.min(width, height) * 0.35
    const cx = width / 2
    const cy = height / 2
    pathD = `M${cx - r},${cy} A${r},${r} 0 1,1 ${cx + r},${cy} A${r},${r} 0 1,1 ${cx - r},${cy}`
  }

  const keyframes: SVGObjectKeyframe[] = animated
    ? [{ time: 0, opacity: 0 }, { time: 0.4, opacity: 1, easing: 'ease-in-out' }, { time: 1 }]
    : [{ time: 0 }]

  return {
    objects: [{
      name: `path_text_${pathType}`,
      zIndex: 0,
      defaultColors: { textColor },
      svgMarkup: `<g><defs><path id="${id}" d="${pathD}"/></defs><text fill="{{textColor}}" font-size="${fontSize * 0.7}" font-family="${fontFamily}" font-weight="700"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${_escapeXml(text)}</textPath></text></g>`,
      keyframes,
    }],
    width,
    height,
  }
}

function _maskGradientText(ctx: Ctx): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors } = ctx
  const id = `mg-${_uid()}`
  const maskId = `mm-${_uid()}`

  const stops = colors.map((c, i) => {
    const offset = colors.length === 1 ? 50 : (i / (colors.length - 1)) * 100
    return `<stop offset="${offset}%" stop-color="${c}"/>`
  }).join('')

  return {
    objects: [{
      name: 'mask_gradient_text',
      zIndex: 0,
      defaultColors: Object.fromEntries(colors.map((c, i) => [`color${i}`, c])),
      svgMarkup: `<g><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient><mask id="${maskId}"><text x="${width / 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="white" font-size="${fontSize}" font-family="${fontFamily}" font-weight="900">${_escapeXml(text)}</text></mask></defs><rect width="${width}" height="${height}" fill="url(#${id})" mask="url(#${maskId})"/></g>`,
      keyframes: [{ time: 0 }],
    }],
    width,
    height,
  }
}

function _stackedText(ctx: Ctx): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors } = ctx
  const layers: string[] = []
  const colorDefs: Record<string, string> = {}

  // Create 3 offset layers
  const offsets = [
    { dx: -3, dy: -3 },
    { dx: 3, dy: 3 },
    { dx: 0, dy: 0 },
  ]

  offsets.forEach((off, i) => {
    const colorKey = `layer${i}`
    colorDefs[colorKey] = colors[i] || colors[0] || '#ffffff'
    const opacity = i < offsets.length - 1 ? 0.5 : 1
    layers.push(`<text x="${width / 2 + off.dx}" y="${height / 2 + fontSize * 0.35 + off.dy}" text-anchor="middle" fill="{{${colorKey}}}" opacity="${opacity}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="900">${_escapeXml(text)}</text>`)
  })

  return {
    objects: [{
      name: 'stacked_text',
      zIndex: 0,
      defaultColors: colorDefs,
      svgMarkup: `<g>${layers.join('')}</g>`,
      keyframes: [{ time: 0 }],
    }],
    width,
    height,
  }
}

function _glitchText(ctx: Ctx): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors } = ctx
  const colorDefs: Record<string, string> = {
    main: colors[0] || '#ffffff',
    glitch1: colors[1] || '#00ffff',
    glitch2: colors[2] || '#ff00ff',
  }

  return {
    objects: [{
      name: 'glitch_text',
      zIndex: 0,
      defaultColors: colorDefs,
      svgMarkup: `<g><text x="${width / 2 - 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="{{glitch1}}" opacity="0.7" font-size="${fontSize}" font-family="${fontFamily}" font-weight="900">${_escapeXml(text)}</text><text x="${width / 2 + 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="{{glitch2}}" opacity="0.7" font-size="${fontSize}" font-family="${fontFamily}" font-weight="900">${_escapeXml(text)}</text><text x="${width / 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="{{main}}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="900">${_escapeXml(text)}</text></g>`,
      keyframes: [
        { time: 0, x: 0 },
        { time: 0.1, x: 2 },
        { time: 0.15, x: -1 },
        { time: 0.2, x: 0 },
        { time: 0.5, x: 0 },
        { time: 0.55, x: -2 },
        { time: 0.6, x: 1 },
        { time: 0.65, x: 0 },
        { time: 1, x: 0 },
      ],
    }],
    width,
    height,
  }
}

function _neonGlowText(ctx: Ctx): TextEffectResult {
  const { text, width, height, fontSize, fontFamily, colors } = ctx
  const glowColor = colors[0] || '#00ff88'
  const id = `ng-${_uid()}`

  return {
    objects: [{
      name: 'neon_glow_text',
      zIndex: 0,
      defaultColors: { glow: glowColor },
      svgMarkup: `<g><defs><filter id="${id}"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1"/><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2"/><feMerge><feMergeNode in="blur2"/><feMergeNode in="blur1"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><text x="${width / 2}" y="${height / 2 + fontSize * 0.35}" text-anchor="middle" fill="{{glow}}" filter="url(#${id})" font-size="${fontSize}" font-family="${fontFamily}" font-weight="800">${_escapeXml(text)}</text></g>`,
      keyframes: [
        { time: 0, opacity: 0.7 },
        { time: 0.5, opacity: 1 },
        { time: 1, opacity: 0.7 },
      ],
    }],
    width,
    height,
  }
}

// ── Utilities ──

let _uidCounter = 0
function _uid(): string {
  return `${Date.now().toString(36)}-${(++_uidCounter).toString(36)}`
}

function _escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
