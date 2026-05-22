/**
 * Color harmony engine for generating cohesive palettes.
 * Uses HSL color space for perceptually meaningful transformations.
 * Supports multiple harmony strategies used by professional motion designers.
 */

// ── HSL ↔ Hex conversions ──

export interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  /** Additional colors for data viz, charts, etc */
  extras: string[]
}

export type HarmonyStrategy =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'monochromatic'

export type PaletteMood =
  | 'vibrant'
  | 'muted'
  | 'dark'
  | 'light'
  | 'neon'
  | 'pastel'
  | 'corporate'
  | 'warm'
  | 'cool'

function hexToHsl(hex: string): HSL {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  if (s === 0) {
    const v = Math.round(l * 255)
    return `#${v.toString(16).padStart(2, '0').repeat(3)}`
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
  const g = Math.round(hue2rgb(p, q, h) * 255)
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function adjustHsl(base: HSL, hDelta: number, sDelta: number, lDelta: number): HSL {
  return {
    h: ((base.h + hDelta) % 360 + 360) % 360,
    s: Math.max(0, Math.min(100, base.s + sDelta)),
    l: Math.max(0, Math.min(100, base.l + lDelta)),
  }
}

// ── Harmony generators ──

function getHarmonyHues(baseHue: number, strategy: HarmonyStrategy): number[] {
  switch (strategy) {
    case 'complementary':
      return [baseHue, (baseHue + 180) % 360]
    case 'analogous':
      return [baseHue, (baseHue + 30) % 360, (baseHue + 330) % 360]
    case 'triadic':
      return [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360]
    case 'split-complementary':
      return [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360]
    case 'tetradic':
      return [baseHue, (baseHue + 90) % 360, (baseHue + 180) % 360, (baseHue + 270) % 360]
    case 'monochromatic':
      return [baseHue, baseHue, baseHue]
    default:
      return [baseHue]
  }
}

function moodAdjust(hsl: HSL, mood: PaletteMood): HSL {
  switch (mood) {
    case 'vibrant':
      return adjustHsl(hsl, 0, 20, 0)
    case 'muted':
      return adjustHsl(hsl, 0, -25, 0)
    case 'dark':
      return adjustHsl(hsl, 0, 0, -20)
    case 'light':
      return adjustHsl(hsl, 0, -10, 20)
    case 'neon':
      return adjustHsl(hsl, 0, 40, 10)
    case 'pastel':
      return adjustHsl(hsl, 0, -30, 25)
    case 'corporate':
      return adjustHsl(hsl, 0, -15, -5)
    case 'warm':
      return adjustHsl(hsl, hsl.h > 200 ? -40 : 0, 5, 0)
    case 'cool':
      return adjustHsl(hsl, hsl.h < 180 ? 40 : 0, 5, 0)
    default:
      return hsl
  }
}

// ── Public API ──

export function generatePalette(
  baseColor: string,
  strategy: HarmonyStrategy = 'complementary',
  mood: PaletteMood = 'vibrant',
): ColorPalette {
  const baseHsl = hexToHsl(baseColor)
  const hues = getHarmonyHues(baseHsl.h, strategy)

  const primary = moodAdjust({ h: hues[0], s: baseHsl.s, l: baseHsl.l }, mood)
  const secondary = moodAdjust(
    { h: hues[1] ?? hues[0], s: Math.max(20, baseHsl.s - 10), l: baseHsl.l + 5 },
    mood,
  )
  const accent = moodAdjust(
    { h: hues[2] ?? (hues[1] ?? hues[0]) + 30, s: Math.min(100, baseHsl.s + 15), l: baseHsl.l },
    mood,
  )

  // Derive background and surface from primary
  const isDark = mood === 'dark' || mood === 'neon' || mood === 'vibrant'
  const background: HSL = isDark
    ? { h: primary.h, s: Math.max(5, primary.s - 40), l: Math.min(15, primary.l - 30) }
    : { h: primary.h, s: Math.max(5, primary.s - 50), l: Math.min(97, primary.l + 40) }

  const surface: HSL = isDark
    ? adjustHsl(background, 0, 5, 8)
    : adjustHsl(background, 0, -5, -5)

  const text: HSL = isDark
    ? { h: primary.h, s: 5, l: 95 }
    : { h: primary.h, s: 10, l: 10 }

  const textSecondary: HSL = isDark
    ? { h: primary.h, s: 5, l: 65 }
    : { h: primary.h, s: 8, l: 45 }

  // Generate extras for data visualization
  const extras: string[] = []
  const extraCount = strategy === 'tetradic' ? 6 : 5
  for (let i = 0; i < extraCount; i++) {
    const hue = (primary.h + (i * 360) / extraCount) % 360
    extras.push(hslToHex(moodAdjust({ h: hue, s: primary.s, l: primary.l }, mood)))
  }

  return {
    primary: hslToHex(primary),
    secondary: hslToHex(secondary),
    accent: hslToHex(accent),
    background: hslToHex(background),
    surface: hslToHex(surface),
    text: hslToHex(text),
    textSecondary: hslToHex(textSecondary),
    extras,
  }
}

/**
 * Generate a palette from mood/emotion keywords.
 * Maps common emotions to base hues and appropriate strategies.
 */
export function paletteFromMood(
  emotionOrKeyword: string,
  darkMode = true,
): ColorPalette {
  const keyword = emotionOrKeyword.toLowerCase()

  // Map keywords to base hues
  const hueMap: Record<string, number> = {
    // Emotions
    joy: 45, happiness: 50, excited: 35, love: 350, passion: 0,
    anger: 5, rage: 355, calm: 200, peaceful: 180, serene: 190,
    sad: 220, melancholy: 235, fear: 270, mystery: 280,
    surprise: 55, energy: 30, power: 15,
    // Themes
    nature: 120, forest: 140, ocean: 200, sky: 210, sunset: 25,
    fire: 15, ice: 195, earth: 35, space: 260, cyber: 175,
    luxury: 45, corporate: 215, technology: 205, health: 145,
    creative: 290, fun: 320, professional: 220, elegant: 0,
  }

  // Map to strategy
  const strategyMap: Record<string, HarmonyStrategy> = {
    calm: 'analogous', peaceful: 'analogous', serene: 'analogous',
    energy: 'complementary', power: 'complementary', passion: 'complementary',
    luxury: 'monochromatic', elegant: 'monochromatic', corporate: 'monochromatic',
    creative: 'triadic', fun: 'triadic',
    nature: 'split-complementary', space: 'split-complementary',
  }

  const moodMap: Record<string, PaletteMood> = {
    luxury: 'dark', elegant: 'dark', mystery: 'dark', space: 'dark',
    calm: 'muted', peaceful: 'muted', serene: 'muted',
    energy: 'vibrant', passion: 'vibrant', fire: 'vibrant',
    cyber: 'neon', technology: 'neon',
    fun: 'pastel', joy: 'pastel', happiness: 'pastel',
    corporate: 'corporate', professional: 'corporate',
  }

  const baseHue = hueMap[keyword] ?? Math.abs(hashString(keyword)) % 360
  const strategy = strategyMap[keyword] ?? 'complementary'
  const mood = moodMap[keyword] ?? (darkMode ? 'dark' : 'light')

  const baseColor = hslToHex({ h: baseHue, s: 70, l: 55 })
  return generatePalette(baseColor, strategy, mood)
}

/**
 * Generate a CSS gradient string from palette colors.
 */
export function paletteGradient(
  palette: ColorPalette,
  angle = 135,
  type: 'linear' | 'radial' = 'linear',
): string {
  if (type === 'radial') {
    return `radial-gradient(ellipse at 30% 30%, ${palette.surface}, ${palette.background})`
  }
  return `linear-gradient(${angle}deg, ${palette.background}, ${palette.surface})`
}

// Simple string hash for deterministic hue from unknown keywords
function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  return hash
}

export { hexToHsl, hslToHex }
