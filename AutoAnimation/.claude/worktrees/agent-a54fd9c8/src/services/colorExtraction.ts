/**
 * Color extraction (median cut) and pixel-level recoloring for raster images.
 *
 * Two public functions:
 *   extractDominantColors – returns the N most dominant colors in an image
 *   applyColorMap         – recolors an image by shifting matched pixels in HSL
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedColor {
  hex: string
  pixelCount: number
  percentage: number // 0-100
}

export type ColorMap = Record<string, string> // originalHex → replacementHex

// ─── Helpers: RGB ↔ HSL ─────────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
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
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')
}

// Weighted RGB distance (approximates perceptual difference)
function colorDistanceSq(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db
}

// ─── Median Cut ─────────────────────────────────────────────────────────────

interface Pixel { r: number; g: number; b: number }

interface Bucket {
  pixels: Pixel[]
}

function getChannelRange(pixels: Pixel[], channel: 'r' | 'g' | 'b'): number {
  let min = 255, max = 0
  for (const p of pixels) {
    if (p[channel] < min) min = p[channel]
    if (p[channel] > max) max = p[channel]
  }
  return max - min
}

function widestChannel(pixels: Pixel[]): 'r' | 'g' | 'b' {
  const rr = getChannelRange(pixels, 'r')
  const gr = getChannelRange(pixels, 'g')
  const br = getChannelRange(pixels, 'b')
  if (rr >= gr && rr >= br) return 'r'
  if (gr >= rr && gr >= br) return 'g'
  return 'b'
}

function medianCut(pixels: Pixel[], count: number): Pixel[] {
  if (pixels.length === 0) return []

  const buckets: Bucket[] = [{ pixels }]

  while (buckets.length < count) {
    // Find the bucket with the most pixels (and at least 2 pixels to split)
    let bestIdx = -1
    let bestSize = 0
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].pixels.length > bestSize && buckets[i].pixels.length >= 2) {
        bestSize = buckets[i].pixels.length
        bestIdx = i
      }
    }
    if (bestIdx === -1) break // nothing left to split

    const bucket = buckets[bestIdx]
    const ch = widestChannel(bucket.pixels)
    bucket.pixels.sort((a, b) => a[ch] - b[ch])
    const mid = Math.floor(bucket.pixels.length / 2)

    buckets.splice(bestIdx, 1, { pixels: bucket.pixels.slice(0, mid) }, { pixels: bucket.pixels.slice(mid) })
  }

  // Average each bucket
  return buckets.map((b) => {
    let r = 0, g = 0, bl = 0
    for (const p of b.pixels) { r += p.r; g += p.g; bl += p.b }
    const n = b.pixels.length
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(bl / n) }
  })
}

// ─── Image Loading Utility ──────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Only set crossOrigin for non-blob URLs — blob URLs are always same-origin
    // and setting crossOrigin on them can cause load failures in some browsers
    if (!url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url.slice(0, 60)}`))
    img.src = url
  })
}

// ─── Public: Extract Dominant Colors ────────────────────────────────────────

const MAX_SAMPLE_SIZE = 256

export async function extractDominantColors(imageUrl: string, count = 8): Promise<ExtractedColor[]> {
  const img = await loadImage(imageUrl)

  // Downsample for speed
  let sw = img.naturalWidth, sh = img.naturalHeight
  if (sw > MAX_SAMPLE_SIZE || sh > MAX_SAMPLE_SIZE) {
    const ratio = Math.min(MAX_SAMPLE_SIZE / sw, MAX_SAMPLE_SIZE / sh)
    sw = Math.round(sw * ratio)
    sh = Math.round(sh * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, sw, sh)

  const { data } = ctx.getImageData(0, 0, sw, sh)

  const pixels: Pixel[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue // skip transparent
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }

  if (pixels.length === 0) return []

  const clusters = medianCut(pixels, count)

  // Count pixels belonging to each cluster
  const counts = new Array(clusters.length).fill(0)
  for (const p of pixels) {
    let bestIdx = 0, bestDist = Infinity
    for (let c = 0; c < clusters.length; c++) {
      const d = colorDistanceSq(p.r, p.g, p.b, clusters[c].r, clusters[c].g, clusters[c].b)
      if (d < bestDist) { bestDist = d; bestIdx = c }
    }
    counts[bestIdx]++
  }

  const total = pixels.length
  const results: ExtractedColor[] = clusters.map((c, i) => ({
    hex: rgbToHex(c.r, c.g, c.b),
    pixelCount: counts[i],
    percentage: Math.round((counts[i] / total) * 1000) / 10, // one decimal
  }))

  // Sort by dominance
  results.sort((a, b) => b.pixelCount - a.pixelCount)

  return results
}

// ─── Public: Apply Color Map (Recolor) ──────────────────────────────────────

const COLOR_MATCH_THRESHOLD_SQ = 50 * 50 // weighted distance squared

export async function applyColorMap(imageUrl: string, colorMap: ColorMap): Promise<Blob> {
  const entries = Object.entries(colorMap)
  if (entries.length === 0) throw new Error('Empty colorMap')

  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  // Pre-compute HSL deltas for each mapping
  const mappings = entries.map(([origHex, newHex]) => {
    const [or, og, ob] = hexToRgb(origHex)
    const [nr, ng, nb] = hexToRgb(newHex)
    const [oh, os, ol] = rgbToHsl(or, og, ob)
    const [nh, ns, nl] = rgbToHsl(nr, ng, nb)
    return {
      or, og, ob,
      dh: nh - oh,
      ds: ns - os,
      dl: nl - ol,
    }
  })

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue // skip transparent

    const r = data[i], g = data[i + 1], b = data[i + 2]

    // Find closest mapping within threshold
    let bestIdx = -1, bestDist = COLOR_MATCH_THRESHOLD_SQ
    for (let m = 0; m < mappings.length; m++) {
      const d = colorDistanceSq(r, g, b, mappings[m].or, mappings[m].og, mappings[m].ob)
      if (d < bestDist) { bestDist = d; bestIdx = m }
    }

    if (bestIdx === -1) continue

    const { dh, ds, dl } = mappings[bestIdx]

    // Shift in HSL space to preserve shading
    const [ph, ps, pl] = rgbToHsl(r, g, b)
    let nh = ph + dh
    if (nh < 0) nh += 1
    if (nh > 1) nh -= 1
    const ns = Math.max(0, Math.min(1, ps + ds))
    const nl = Math.max(0, Math.min(1, pl + dl))
    const [nr, ng, nb] = hslToRgb(nh, ns, nl)

    data[i] = nr
    data[i + 1] = ng
    data[i + 2] = nb
    // alpha unchanged
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create recolored blob'))
    }, 'image/png')
  })
}
