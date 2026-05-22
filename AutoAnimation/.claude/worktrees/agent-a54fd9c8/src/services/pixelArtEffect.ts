/**
 * Pixel art post-processing effect engine.
 *
 * Transforms images into a retro pixelated style using Canvas 2D
 * downscale/upscale with nearest-neighbor interpolation. Zero external
 * dependencies. Includes an LRU cache so RAF loops only do Map lookups.
 */

import type { PixelArtEffectSettings } from '@/types/pixelArtEffect'

// ---------------------------------------------------------------------------
// LRU cache (200 entries, keyed by hash of src + settings)
// ---------------------------------------------------------------------------

const MAX_CACHE = 200

interface CacheEntry {
  dataUrl: string
  lastUsed: number
}

const cache = new Map<string, CacheEntry>()

/** In-flight pixelation promises (prevents duplicate work for the same key). */
const inflight = new Map<string, Promise<string>>()

function cacheKey(src: string, s: PixelArtEffectSettings): string {
  return `${src}|${s.pixelSize}|${s.colorLevels}|${s.outline ? 1 : 0}`
}

function evictIfNeeded() {
  if (cache.size <= MAX_CACHE) return
  // Drop the least-recently-used entry
  let oldest = Infinity
  let oldestKey = ''
  for (const [k, v] of cache) {
    if (v.lastUsed < oldest) {
      oldest = v.lastUsed
      oldestKey = k
    }
  }
  if (oldestKey) cache.delete(oldestKey)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Synchronous cache lookup — returns null on cache miss. */
export function getPixelatedFromCache(
  src: string,
  settings: PixelArtEffectSettings,
): string | null {
  const key = cacheKey(src, settings)
  const entry = cache.get(key)
  if (entry) {
    entry.lastUsed = performance.now()
    return entry.dataUrl
  }
  return null
}

/** Invalidate the entire cache (call when settings change). */
export function clearPixelArtCache(): void {
  cache.clear()
  inflight.clear()
}

/**
 * Pixelate a single image source. Returns a data URL.
 * Results are cached for subsequent sync lookups.
 */
export async function pixelateImageSrc(
  src: string,
  settings: PixelArtEffectSettings,
): Promise<string> {
  // Check cache first
  const key = cacheKey(src, settings)
  const cached = cache.get(key)
  if (cached) {
    cached.lastUsed = performance.now()
    return cached.dataUrl
  }

  // De-duplicate in-flight requests
  const existing = inflight.get(key)
  if (existing) return existing

  const promise = _pixelate(src, settings).then((dataUrl) => {
    evictIfNeeded()
    cache.set(key, { dataUrl, lastUsed: performance.now() })
    inflight.delete(key)
    return dataUrl
  }).catch((err) => {
    inflight.delete(key)
    throw err
  })

  inflight.set(key, promise)
  return promise
}

/**
 * Batch pre-cache multiple image sources (e.g. all character sprites).
 * Fire-and-forget; errors are silently ignored.
 */
export async function preCachePixelArt(
  sources: string[],
  settings: PixelArtEffectSettings,
): Promise<void> {
  await Promise.allSettled(
    sources.filter(Boolean).map((src) => pixelateImageSrc(src, settings)),
  )
}

/**
 * Pixelate a canvas element in-place (for rigged mode / WebGL canvases).
 * Reads the source canvas, applies downscale/upscale + posterize + outline,
 * and draws the result onto the provided output 2D canvas.
 * The output canvas should be positioned on top of the source to overlay it.
 *
 * Returns true if pixelation was applied, false if skipped.
 */
export function pixelateCanvasToOverlay(
  sourceCanvas: HTMLCanvasElement,
  outputCanvas: HTMLCanvasElement,
  settings: PixelArtEffectSettings,
): boolean {
  const { pixelSize, colorLevels, outline } = settings
  const w = sourceCanvas.width
  const h = sourceCanvas.height
  if (w === 0 || h === 0) return false

  // Match output canvas size
  if (outputCanvas.width !== w) outputCanvas.width = w
  if (outputCanvas.height !== h) outputCanvas.height = h

  // Downscale
  const sw = Math.max(1, Math.round(w / pixelSize))
  const sh = Math.max(1, Math.round(h / pixelSize))

  if (!_sharedSmallCanvas) _sharedSmallCanvas = document.createElement('canvas')
  const smallCanvas = _sharedSmallCanvas
  if (smallCanvas.width !== sw) smallCanvas.width = sw
  if (smallCanvas.height !== sh) smallCanvas.height = sh
  const sCtx = smallCanvas.getContext('2d')!
  sCtx.clearRect(0, 0, sw, sh)
  sCtx.imageSmoothingEnabled = true
  sCtx.imageSmoothingQuality = 'medium'
  sCtx.drawImage(sourceCanvas, 0, 0, sw, sh)

  // Posterize on small canvas
  if (colorLevels >= 2) {
    const imageData = sCtx.getImageData(0, 0, sw, sh)
    const data = imageData.data
    const step = 255 / (colorLevels - 1)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue
      data[i] = Math.round(data[i] / step) * step
      data[i + 1] = Math.round(data[i + 1] / step) * step
      data[i + 2] = Math.round(data[i + 2] / step) * step
    }
    sCtx.putImageData(imageData, 0, 0)
  }

  // Upscale with nearest-neighbor onto output canvas
  const oCtx = outputCanvas.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.imageSmoothingEnabled = false
  oCtx.drawImage(smallCanvas, 0, 0, w, h)

  // Outline pass
  if (outline) {
    const imageData = oCtx.getImageData(0, 0, w, h)
    const data = imageData.data
    const copy = new Uint8ClampedArray(data)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        if (copy[idx + 3] === 0) continue
        const neighbors = [
          ((y - 1) * w + x) * 4,
          ((y + 1) * w + x) * 4,
          (y * w + x - 1) * 4,
          (y * w + x + 1) * 4,
        ]
        let isEdge = false
        for (const ni of neighbors) {
          if (copy[ni + 3] === 0) { isEdge = true; break }
          const dr = Math.abs(copy[idx] - copy[ni])
          const dg = Math.abs(copy[idx + 1] - copy[ni + 1])
          const db = Math.abs(copy[idx + 2] - copy[ni + 2])
          if (dr + dg + db > 30) { isEdge = true; break }
        }
        if (isEdge) {
          data[idx] = Math.max(0, copy[idx] - 80)
          data[idx + 1] = Math.max(0, copy[idx + 1] - 80)
          data[idx + 2] = Math.max(0, copy[idx + 2] - 80)
        }
      }
    }
    oCtx.putImageData(imageData, 0, 0)
  }

  return true
}

/** Shared small canvas for pixelateCanvasToOverlay (avoids per-frame allocation). */
let _sharedSmallCanvas: HTMLCanvasElement | null = null

// ---------------------------------------------------------------------------
// Core pixelation engine
// ---------------------------------------------------------------------------

/** Image element cache so we don't reload the same src repeatedly. */
const imgCache = new Map<string, HTMLImageElement>()

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imgCache.get(src)
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached)
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgCache.set(src, img)
      // Evict old entries if image cache grows too large
      if (imgCache.size > 500) {
        const iter = imgCache.keys()
        imgCache.delete(iter.next().value!)
      }
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}`))
    img.src = src
  })
}

async function _pixelate(src: string, settings: PixelArtEffectSettings): Promise<string> {
  const img = await loadImage(src)
  const { pixelSize, colorLevels, outline } = settings
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  // Small canvas (downscaled)
  const sw = Math.max(1, Math.round(w / pixelSize))
  const sh = Math.max(1, Math.round(h / pixelSize))

  const smallCanvas = document.createElement('canvas')
  smallCanvas.width = sw
  smallCanvas.height = sh
  const sCtx = smallCanvas.getContext('2d')!
  sCtx.imageSmoothingEnabled = true
  sCtx.imageSmoothingQuality = 'medium'
  sCtx.drawImage(img, 0, 0, sw, sh)

  // Posterize on small canvas (modifying fewer pixels)
  if (colorLevels >= 2) {
    const imageData = sCtx.getImageData(0, 0, sw, sh)
    const data = imageData.data
    const step = 255 / (colorLevels - 1)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue // skip fully transparent
      data[i] = Math.round(data[i] / step) * step     // R
      data[i + 1] = Math.round(data[i + 1] / step) * step // G
      data[i + 2] = Math.round(data[i + 2] / step) * step // B
    }
    sCtx.putImageData(imageData, 0, 0)
  }

  // Full-size canvas (nearest-neighbor upscale)
  const fullCanvas = document.createElement('canvas')
  fullCanvas.width = w
  fullCanvas.height = h
  const fCtx = fullCanvas.getContext('2d')!
  fCtx.imageSmoothingEnabled = false
  fCtx.drawImage(smallCanvas, 0, 0, w, h)

  // Outline pass: detect color block boundaries and darken edge pixels
  if (outline) {
    const imageData = fCtx.getImageData(0, 0, w, h)
    const data = imageData.data
    // Work on a copy to avoid reading modified values
    const copy = new Uint8ClampedArray(data)

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        if (copy[idx + 3] === 0) continue // skip transparent

        // Check 4-connected neighbors for color difference
        const neighbors = [
          ((y - 1) * w + x) * 4, // up
          ((y + 1) * w + x) * 4, // down
          (y * w + x - 1) * 4,   // left
          (y * w + x + 1) * 4,   // right
        ]

        let isEdge = false
        for (const ni of neighbors) {
          // Edge if neighbor is transparent or different color
          if (copy[ni + 3] === 0) {
            isEdge = true
            break
          }
          const dr = Math.abs(copy[idx] - copy[ni])
          const dg = Math.abs(copy[idx + 1] - copy[ni + 1])
          const db = Math.abs(copy[idx + 2] - copy[ni + 2])
          if (dr + dg + db > 30) {
            isEdge = true
            break
          }
        }

        if (isEdge) {
          // Darken the pixel for an outline effect
          data[idx] = Math.max(0, copy[idx] - 80)
          data[idx + 1] = Math.max(0, copy[idx + 1] - 80)
          data[idx + 2] = Math.max(0, copy[idx + 2] - 80)
        }
      }
    }

    fCtx.putImageData(imageData, 0, 0)
  }

  return fullCanvas.toDataURL('image/png')
}
