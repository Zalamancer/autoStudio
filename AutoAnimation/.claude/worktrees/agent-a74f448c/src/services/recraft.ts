/**
 * Recraft.ai frontend service — image vectorization and background removal.
 *
 * Calls the server proxy at /api/recraft/*.
 * Both operations are credit-gated (5 credits each).
 */

import { withCreditGate } from './creditGate'
import { blobToDataUrl, dataUrlToBlob } from '../utils/blobUtils'

const apiBase = import.meta.env.VITE_API_URL || ''

// ── Availability check (cached) ──

let _availableCache: boolean | null = null
let _availableCacheTime = 0

/**
 * Check if Recraft API is configured on the server.
 * Positive results cached permanently; negative results expire after 30s.
 */
export async function isRecraftAvailable(): Promise<boolean> {
  if (_availableCache === true) return true
  if (_availableCache === false && Date.now() - _availableCacheTime < 30_000) return false

  try {
    const res = await fetch(`${apiBase}/api/recraft/status`)
    if (!res.ok) {
      _availableCache = false
      _availableCacheTime = Date.now()
      return false
    }
    const data = await res.json()
    _availableCache = data.configured === true
    _availableCacheTime = Date.now()
    return _availableCache
  } catch {
    _availableCache = false
    _availableCacheTime = Date.now()
    return false
  }
}

// ── Image size limit ──

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // Recraft API limit: 5MB
const MAX_IMAGE_PIXELS = 16_777_216     // Recraft API limit: 16MP
const MAX_IMAGE_DIMENSION = 4096        // Recraft API limit: max side length

/**
 * Downscale a base64 data URL image if it exceeds API limits.
 * Checks both file size (5MB) and resolution (16MP, max 4096px per side).
 */
async function ensureUnderSizeLimit(base64DataUrl: string): Promise<string> {
  // Load image to check resolution
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Failed to load image for downscaling'))
    el.src = base64DataUrl
  })

  const { naturalWidth: w, naturalHeight: h } = img
  const pixels = w * h
  const exceedsDimension = w > MAX_IMAGE_DIMENSION || h > MAX_IMAGE_DIMENSION
  const exceedsPixels = pixels > MAX_IMAGE_PIXELS

  // Estimate raw byte size from base64 length
  const commaIdx = base64DataUrl.indexOf(',')
  const b64Length = base64DataUrl.length - commaIdx - 1
  const rawBytes = Math.ceil(b64Length * 3 / 4)
  const exceedsBytes = rawBytes > MAX_IMAGE_BYTES

  if (!exceedsDimension && !exceedsPixels && !exceedsBytes) return base64DataUrl

  // Calculate initial scale to fit within resolution limits
  let scale = 1
  if (exceedsDimension) {
    scale = Math.min(MAX_IMAGE_DIMENSION / w, MAX_IMAGE_DIMENSION / h, scale)
  }
  if (exceedsPixels) {
    scale = Math.min(Math.sqrt(MAX_IMAGE_PIXELS / pixels), scale)
  }

  // Downscale, then keep reducing if file size still too large
  for (let attempt = 0; attempt < 5; attempt++) {
    const sw = Math.round(w * scale)
    const sh = Math.round(h * scale)
    const canvas = new OffscreenCanvas(sw, sh)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, sw, sh)
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    if (blob.size <= MAX_IMAGE_BYTES) {
      return await blobToDataUrl(blob)
    }
    scale *= 0.75
  }

  // Last resort: return smallest attempt
  const sw = Math.round(w * scale)
  const sh = Math.round(h * scale)
  const canvas = new OffscreenCanvas(sw, sh)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, sw, sh)
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  return await blobToDataUrl(blob)
}

// ── Vectorize ──

/**
 * Convert a raster image to SVG via Recraft.ai vectorization.
 * Automatically downscales if the image exceeds the 5MB API limit.
 * @param base64DataUrl - Image as data:image/...;base64,... string
 * @returns SVG as a data:image/svg+xml;base64,... data URL
 */
export async function vectorizeImage(base64DataUrl: string): Promise<string> {
  return withCreditGate('recraft-vectorize', async () => {
    const safeDataUrl = await ensureUnderSizeLimit(base64DataUrl)

    const res = await fetch(`${apiBase}/api/recraft/vectorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: safeDataUrl }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Vectorization failed' }))
      throw new Error(errData.error || `Recraft vectorize error: ${res.status}`)
    }

    const data = await res.json()
    const svgString: string = data.svg

    // Convert SVG string to a data URL
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
    return svgDataUrl
  })
}

// ── Rasterize SVG ──

/**
 * Rasterize an SVG blob to PNG so raster-only APIs can consume it.
 */
async function rasterizeSvgBlob(svgBlob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Failed to load SVG for rasterization'))
      el.src = url
    })
    // Use natural size, clamped to a reasonable max for API upload
    const w = Math.min(img.naturalWidth || 1024, 4096)
    const h = Math.min(img.naturalHeight || 1024, 4096)
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    return await canvas.convertToBlob({ type: 'image/png' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ── Background Removal ──

/**
 * Remove background from an image via Recraft.ai.
 * Automatically rasterizes SVG input to PNG before sending.
 * @param blob - Input image blob (PNG, JPG, or SVG)
 * @returns PNG blob with transparent background
 */
export async function removeBackgroundRecraft(blob: Blob): Promise<Blob> {
  return withCreditGate('recraft-bg-remove', async () => {
    // Recraft only accepts raster formats — rasterize SVG first
    const inputBlob = blob.type.includes('svg') ? await rasterizeSvgBlob(blob) : blob
    const dataUrl = await ensureUnderSizeLimit(await blobToDataUrl(inputBlob))

    const res = await fetch(`${apiBase}/api/recraft/remove-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Background removal failed' }))
      throw new Error(errData.error || `Recraft remove-background error: ${res.status}`)
    }

    const data = await res.json()
    return dataUrlToBlob(data.image)
  })
}
