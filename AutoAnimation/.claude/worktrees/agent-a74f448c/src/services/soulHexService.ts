import type { SoulHexPalette } from '@/types/faceSwap'

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function inferMood(h: number, s: number, l: number): string {
  if (s < 0.15) return l > 0.7 ? 'clean' : 'somber'
  if (h < 30 || h > 330) return 'passionate'
  if (h >= 30 && h < 70) return 'warm'
  if (h >= 70 && h < 150) return 'natural'
  if (h >= 150 && h < 210) return 'calm'
  if (h >= 210 && h < 270) return 'professional'
  if (h >= 270 && h < 330) return 'creative'
  return 'balanced'
}

export function generateHarmony(
  baseColor: string,
  type: SoulHexPalette['harmony']
): SoulHexPalette {
  const [h, s, l] = hexToHsl(baseColor)

  let secondary: string
  let accent: string

  switch (type) {
    case 'complementary':
      secondary = hslToHex(h + 180, s, l)
      accent = hslToHex(h + 180, s * 0.8, l * 0.9)
      break
    case 'analogous':
      secondary = hslToHex(h + 30, s, l)
      accent = hslToHex(h - 30, s, l)
      break
    case 'triadic':
      secondary = hslToHex(h + 120, s, l)
      accent = hslToHex(h + 240, s, l)
      break
    case 'split-complementary':
      secondary = hslToHex(h + 150, s, l)
      accent = hslToHex(h + 210, s, l)
      break
    default:
      secondary = hslToHex(h + 180, s, l)
      accent = hslToHex(h + 90, s, l)
  }

  const background = l > 0.5
    ? hslToHex(h, s * 0.1, 0.95)
    : hslToHex(h, s * 0.15, 0.08)

  const text = l > 0.5
    ? hslToHex(h, s * 0.2, 0.1)
    : hslToHex(h, s * 0.1, 0.95)

  return {
    primary: baseColor,
    secondary,
    accent,
    background,
    text,
    mood: inferMood(h, s, l),
    harmony: type,
  }
}

export async function extractPalette(imageUrl: string): Promise<SoulHexPalette> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = imageUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, 64, 64)
  const data = ctx.getImageData(0, 0, 64, 64).data

  // Cluster colors into buckets
  const buckets: Map<string, { r: number; g: number; b: number; count: number }> = new Map()
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / 32) * 32
    const g = Math.round(data[i + 1] / 32) * 32
    const b = Math.round(data[i + 2] / 32) * 32
    const key = `${r},${g},${b}`
    const existing = buckets.get(key)
    if (existing) {
      existing.count++
    } else {
      buckets.set(key, { r, g, b, count: 1 })
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count)
  const toHex = (c: { r: number; g: number; b: number }) =>
    `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`

  const primary = sorted[0] ? toHex(sorted[0]) : '#4a90d9'
  return generateHarmony(primary, 'complementary')
}

export function applyPaletteToProject(palette: SoulHexPalette): void {
  const { useBrandKitStore } = require('@/stores/useBrandKitStore')
  const brandKit = useBrandKitStore.getState()
  if (typeof brandKit.setColors === 'function') {
    brandKit.setColors([
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.background,
      palette.text,
    ])
  }
}
