/**
 * Text-to-SVG-Path Service
 *
 * Uses opentype.js to convert text + any font into SVG path data.
 * Each character becomes a separate path for per-character drawing animation.
 * Works with .woff, .otf, .ttf fonts.
 */

import opentype from 'opentype.js'

// ---------------------------------------------------------------------------
// Font cache — avoid re-loading the same font file
// ---------------------------------------------------------------------------

const fontCache = new Map<string, opentype.Font>()

/**
 * Load a font from a URL (with caching).
 */
export async function loadFont(fontUrl: string): Promise<opentype.Font> {
  const cached = fontCache.get(fontUrl)
  if (cached) return cached

  const font = await opentype.load(fontUrl)
  fontCache.set(fontUrl, font)
  return font
}

/**
 * Load a font from an ArrayBuffer (e.g. from a local file).
 */
export function loadFontFromBuffer(buffer: ArrayBuffer, cacheKey?: string): opentype.Font {
  const font = opentype.parse(buffer)
  if (cacheKey) fontCache.set(cacheKey, font)
  return font
}

// ---------------------------------------------------------------------------
// Text → SVG path conversion
// ---------------------------------------------------------------------------

export interface CharPathData {
  /** The character */
  char: string
  /** SVG path `d` attribute */
  pathData: string
  /** Bounding box of this character */
  x: number
  y: number
  width: number
  height: number
}

/**
 * Convert a string of text to individual SVG path data per character.
 *
 * @param text   The text to convert
 * @param font   An opentype.Font instance
 * @param x      X origin
 * @param y      Y baseline position
 * @param fontSize  Font size in pixels
 * @returns Array of per-character path data
 */
export function textToCharPaths(
  text: string,
  font: opentype.Font,
  x: number,
  y: number,
  fontSize: number,
): CharPathData[] {
  const results: CharPathData[] = []
  const scale = fontSize / font.unitsPerEm
  let cursorX = x

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const glyph = font.charToGlyph(char)

    if (!glyph || char === ' ') {
      // Space — advance cursor but no path
      const spaceWidth = (glyph?.advanceWidth ?? font.unitsPerEm * 0.25) * scale
      cursorX += spaceWidth
      continue
    }

    const path = glyph.getPath(cursorX, y, fontSize)
    const pathData = path.toPathData(2)

    if (pathData && pathData !== 'M0 0' && pathData.length > 3) {
      const bb = path.getBoundingBox()
      results.push({
        char,
        pathData,
        x: bb.x1,
        y: bb.y1,
        width: bb.x2 - bb.x1,
        height: bb.y2 - bb.y1,
      })
    }

    cursorX += (glyph.advanceWidth ?? 0) * scale
  }

  return results
}

/**
 * Convert text to a single combined SVG path.
 */
export function textToSinglePath(
  text: string,
  font: opentype.Font,
  x: number,
  y: number,
  fontSize: number,
): string {
  const path = font.getPath(text, x, y, fontSize)
  return path.toPathData(2)
}

/**
 * Get the total advance width of text in pixels.
 */
export function measureTextWidth(
  text: string,
  font: opentype.Font,
  fontSize: number,
): number {
  const scale = fontSize / font.unitsPerEm
  let width = 0
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i])
    if (glyph) {
      width += (glyph.advanceWidth ?? 0) * scale
    }
  }
  return width
}

// ---------------------------------------------------------------------------
// Google Fonts URL helpers
// ---------------------------------------------------------------------------

/**
 * Build a direct Google Fonts TTF URL for a given family + weight.
 * Google Fonts serves TTF by default when you request from the CSS API.
 */
export function googleFontUrl(family: string, weight: number = 400): string {
  const encoded = family.replace(/\s+/g, '+')
  return `https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s+/g, '')}/v1/${encoded}-${weightToStyle(weight)}.ttf`
}

function weightToStyle(weight: number): string {
  if (weight <= 300) return 'Light'
  if (weight <= 400) return 'Regular'
  if (weight <= 500) return 'Medium'
  if (weight <= 600) return 'SemiBold'
  if (weight <= 700) return 'Bold'
  return 'ExtraBold'
}

/**
 * Bundled font URLs that are known to work.
 * Google Fonts API2 direct .ttf links.
 */
export const BUNDLED_FONTS: Record<string, string> = {
  'Permanent Marker': 'https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQMWimMp004HaqIfrT5nlk.ttf',
  'Caveat': 'https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9eIWpYQ.ttf',
  'Patrick Hand': 'https://fonts.gstatic.com/s/patrickhand/v23/LDI1apSQOAYtSuYWp8ZhfYeMWcjKm7sp8g.ttf',
  'Indie Flower': 'https://fonts.gstatic.com/s/indieflower/v21/m8JVjfNVeKWVnh3QMuKkFcZlbkGG1dKEDw.ttf',
  'Shadows Into Light': 'https://fonts.gstatic.com/s/shadowsintolight/v19/UqyNK9UOIntux_czAvDQx_ZcHqZXBNQDcsr4xzSMYA.ttf',
  'Gloria Hallelujah': 'https://fonts.gstatic.com/s/gloriahallelujah/v21/LYjYdHv3kUk9BMV96EIswT9DIbW-MLSy3TKEvkCF.ttf',
  'Architects Daughter': 'https://fonts.gstatic.com/s/architectsdaughter/v18/KtkxAKiDZI_td1Lkx62xHZHDtgO_Y-bvfY5q4szgE-Q.ttf',
  'Kalam': 'https://fonts.gstatic.com/s/kalam/v16/YA9dr0Wd4kDdMuhWMibDszkB.ttf',
  'Handlee': 'https://fonts.gstatic.com/s/handlee/v18/-F6xfjBsISg9aMakDmr6oilJ3ik.ttf',
  'Coming Soon': 'https://fonts.gstatic.com/s/comingsoon/v19/qWcuB6mzpYL7AJ2VfdQR1u-SUjjzsykh.ttf',
}
