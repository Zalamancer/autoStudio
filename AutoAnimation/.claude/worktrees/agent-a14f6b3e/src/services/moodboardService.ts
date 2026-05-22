import type { MoodboardConfig, MoodboardItem } from '@/types/faceSwap'
import { extractStyleFromReference } from './stealPipeline'

export function createMoodboard(): MoodboardConfig {
  return {
    items: [],
    extractedTheme: {
      colorPalette: [],
      mood: '',
      style: '',
      typography: '',
      keywords: [],
    },
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function extractDominantColors(imageData: ImageData, count: number): string[] {
  const buckets: Map<string, number> = new Map()
  const data = imageData.data
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32
    const g = Math.round(data[i + 1] / 32) * 32
    const b = Math.round(data[i + 2] / 32) * 32
    const key = `${r},${g},${b}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    })
}

function inferMood(brightness: number, saturation: number, warmth: number): string {
  if (brightness > 0.6 && saturation > 0.5) return 'energetic'
  if (brightness > 0.6 && saturation < 0.3) return 'ethereal'
  if (brightness < 0.3 && saturation > 0.4) return 'dramatic'
  if (brightness < 0.3 && saturation < 0.2) return 'moody'
  if (warmth > 0.3) return 'warm'
  if (warmth < -0.2) return 'cool'
  return 'balanced'
}

export async function addImageToMoodboard(
  moodboard: MoodboardConfig,
  imageUrl: string
): Promise<MoodboardConfig> {
  const img = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, 128, 128)
  const imageData = ctx.getImageData(0, 0, 128, 128)

  const dominantColors = extractDominantColors(imageData, 4)
  const data = imageData.data
  let totalR = 0, totalG = 0, totalB = 0
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i]; totalG += data[i + 1]; totalB += data[i + 2]
  }
  const pc = data.length / 4
  const brightness = (totalR + totalG + totalB) / (pc * 3 * 255)
  const warmth = (totalR - totalB) / (totalR + totalB + 1)
  const mood = inferMood(brightness, 0.5, warmth)

  const item: MoodboardItem = {
    id: `mb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    imageUrl,
    tags: [],
    dominantColors,
    mood,
    addedAt: Date.now(),
  }

  return {
    ...moodboard,
    items: [...moodboard.items, item],
  }
}

export async function extractThemeFromMoodboard(
  moodboard: MoodboardConfig
): Promise<MoodboardConfig> {
  if (moodboard.items.length === 0) return moodboard

  // Aggregate colors from all items
  const allColors = moodboard.items.flatMap((item) => item.dominantColors)
  const colorCounts: Map<string, number> = new Map()
  for (const c of allColors) {
    colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1)
  }
  const topColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c]) => c)

  // Aggregate moods
  const moodCounts: Map<string, number> = new Map()
  for (const item of moodboard.items) {
    moodCounts.set(item.mood, (moodCounts.get(item.mood) ?? 0) + 1)
  }
  const dominantMood = Array.from(moodCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'balanced'

  // Analyze first image for detailed style
  let style = 'modern'
  if (moodboard.items.length > 0) {
    try {
      const profile = await extractStyleFromReference(moodboard.items[0].imageUrl)
      if (profile.grain > 0.3) style = 'vintage'
      else if (profile.saturation > 0.6) style = 'vivid'
      else if (profile.saturation < 0.2) style = 'minimalist'
      else if (profile.contrast > 0.4) style = 'cinematic'
    } catch {
      // Keep default
    }
  }

  // Infer typography from mood/style
  let typography = 'sans-serif'
  if (style === 'vintage') typography = 'serif'
  else if (dominantMood === 'dramatic') typography = 'display'
  else if (dominantMood === 'ethereal') typography = 'handwritten'

  // Extract keywords from moods and tags
  const keywords = Array.from(new Set([
    dominantMood,
    style,
    ...moodboard.items.flatMap((i) => i.tags),
  ])).filter(Boolean)

  return {
    ...moodboard,
    extractedTheme: {
      colorPalette: topColors,
      mood: dominantMood,
      style,
      typography,
      keywords,
    },
  }
}

export function applyMoodboardTheme(theme: MoodboardConfig['extractedTheme']): void {
  // Apply theme to brand kit / style stores
  const { useBrandKitStore } = require('@/stores/useBrandKitStore')
  const brandKit = useBrandKitStore.getState()
  if (typeof brandKit.setColors === 'function' && theme.colorPalette.length > 0) {
    brandKit.setColors(theme.colorPalette)
  }
}
