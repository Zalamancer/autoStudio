import type { StyleProfile } from '@/types/media'
import { useStyleStore } from '@/stores/useStyleStore'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
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

function extractDominantColors(imageData: ImageData, count: number): string[] {
  const buckets: Map<string, number> = new Map()
  const data = imageData.data

  for (let i = 0; i < data.length; i += 16) {
    // sample every 4th pixel
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

export async function extractStyleFromReference(imageUrl: string): Promise<StyleProfile> {
  const img = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  const size = 256 // downsample for analysis
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, size, size)
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data

  // Analyze average properties
  let totalBrightness = 0
  let totalSaturation = 0
  const brightnesses: number[] = []

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    const [_h, s, l] = rgbToHsl(r, g, b)
    const brightness = l
    totalBrightness += brightness
    totalSaturation += s
    brightnesses.push(brightness)
  }

  const pixelCount = data.length / 4
  const avgBrightness = totalBrightness / pixelCount
  const avgSaturation = totalSaturation / pixelCount

  // Contrast: standard deviation of brightness
  const meanB = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length
  const variance = brightnesses.reduce((sum, b) => sum + (b - meanB) ** 2, 0) / brightnesses.length
  const contrast = Math.sqrt(variance)

  // Grain: local variance in small patches
  let grainSum = 0
  for (let y = 1; y < size - 1; y += 2) {
    for (let x = 1; x < size - 1; x += 2) {
      const idx = (y * size + x) * 4
      const c = data[idx]
      const n = data[((y - 1) * size + x) * 4]
      const s2 = data[((y + 1) * size + x) * 4]
      grainSum += Math.abs(c - n) + Math.abs(c - s2)
    }
  }
  const grain = Math.min(1, grainSum / (pixelCount * 50))

  // Vignette: compare edge brightness to center brightness
  const centerBrightness = brightnesses[Math.floor(brightnesses.length / 2)] ?? avgBrightness
  const edgeSamples = [
    brightnesses[0],
    brightnesses[size - 1],
    brightnesses[(size - 1) * size],
    brightnesses[size * size - 1],
  ].filter(Boolean)
  const edgeAvg = edgeSamples.reduce((a, b) => a + b, 0) / edgeSamples.length
  const vignetting = Math.max(0, Math.min(1, (centerBrightness - edgeAvg) * 3))

  // Warmth: ratio of red to blue
  let totalR = 0,
    totalB2 = 0
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i]
    totalB2 += data[i + 2]
  }
  const warmth = Math.max(-1, Math.min(1, (totalR - totalB2) / (totalR + totalB2 + 1)))

  // Color palette
  const colorPalette = extractDominantColors(imageData, 6)

  // Mood inference
  let mood = 'neutral'
  if (avgBrightness > 0.6 && avgSaturation > 0.4) mood = 'vibrant'
  else if (avgBrightness < 0.3) mood = 'dark'
  else if (avgSaturation < 0.2) mood = 'muted'
  else if (warmth > 0.3) mood = 'warm'
  else if (warmth < -0.2) mood = 'cool'

  return {
    colorPalette,
    contrast,
    saturation: avgSaturation,
    brightness: avgBrightness,
    grain,
    vignetting,
    warmth,
    mood,
  }
}

export function applyStyleToProject(styleProfile: StyleProfile): void {
  const styleStore = useStyleStore.getState()

  // Build a CSS filter string from the extracted style profile
  const filterParts: string[] = []
  if (styleProfile.contrast !== undefined) filterParts.push(`contrast(${styleProfile.contrast + 1})`)
  if (styleProfile.saturation !== undefined) filterParts.push(`saturate(${styleProfile.saturation + 1})`)
  if (styleProfile.brightness !== undefined) filterParts.push(`brightness(${styleProfile.brightness + 1})`)
  if (styleProfile.warmth > 0.2) filterParts.push(`sepia(${Math.min(styleProfile.warmth * 0.3, 0.3)})`)

  if (filterParts.length > 0) {
    styleStore.setCustomFilter(filterParts.join(' '))
    styleStore.setEnabled(true)
  }
}
