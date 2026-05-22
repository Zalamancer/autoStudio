/**
 * Client-side background removal using @imgly/background-removal.
 * Runs an ONNX model entirely in the browser. First use downloads ~30MB model (cached afterward).
 *
 * Two modes:
 * - 'local' (default): Client-side ONNX model + alpha mask refinement for smoother edges
 * - 'api': Server-side rembg for higher quality results (free, self-hosted)
 */

// Lazy-loaded: @imgly/background-removal pulls in onnxruntime-web (~800 KB).
// Dynamic import defers this cost until local background removal is actually used.
type Config = import('@imgly/background-removal').Config

export interface BgRemovalProgress {
  /** 'downloading' while fetching the ONNX model, 'processing' while running inference, 'post-processing' while refining alpha, 'uploading' while sending to API */
  phase: 'downloading' | 'processing' | 'post-processing' | 'uploading'
  /** 0-1 progress within the current phase */
  progress: number
}

export type BgRemovalProgressCallback = (p: BgRemovalProgress) => void

// ── Alpha Mask Refinement ──

/**
 * Refine the alpha channel of a background-removed image to smooth jagged edges.
 * Uses a multi-pass box blur (Gaussian approximation) with resolution-scaled radius,
 * followed by a soft threshold ramp to clean up noise.
 */
async function refineAlphaMask(blob: Blob): Promise<Blob> {
  const imageBitmap = await createImageBitmap(blob)
  const { width, height } = imageBitmap

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(imageBitmap, 0, 0)
  imageBitmap.close()

  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData

  // Extract alpha channel into a separate buffer for blurring
  const alphaLen = width * height
  const alpha = new Uint8ClampedArray(alphaLen)
  for (let i = 0; i < alphaLen; i++) {
    alpha[i] = data[i * 4 + 3]
  }

  // Resolution-scaled blur radius: ~1px for 1K, 2-3px for 4K, 5px for 8K
  const maxDim = Math.max(width, height)
  const radius = Math.max(1, Math.round(maxDim / 1500))

  // 3-pass box blur (approximates Gaussian)
  boxBlurAlpha(alpha, width, height, radius)
  boxBlurAlpha(alpha, width, height, radius)
  boxBlurAlpha(alpha, width, height, radius)

  // Soft threshold ramp: alpha < 10 → 0, alpha > 245 → 255, linear between
  const LOW = 10
  const HIGH = 245
  const RANGE = HIGH - LOW
  for (let i = 0; i < alphaLen; i++) {
    const a = alpha[i]
    if (a < LOW) {
      alpha[i] = 0
    } else if (a > HIGH) {
      alpha[i] = 255
    } else {
      alpha[i] = Math.round(((a - LOW) / RANGE) * 255)
    }
  }

  // Write refined alpha back to image data
  for (let i = 0; i < alphaLen; i++) {
    data[i * 4 + 3] = alpha[i]
  }

  ctx.putImageData(imageData, 0, 0)

  const resultBlob = await canvas.convertToBlob({ type: 'image/png' })
  return resultBlob
}

/**
 * Single-pass horizontal+vertical box blur on an alpha buffer.
 */
function boxBlurAlpha(alpha: Uint8ClampedArray, w: number, h: number, r: number): void {
  const temp = new Uint8ClampedArray(alpha.length)
  const diameter = r * 2 + 1

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    let sum = 0
    const rowOffset = y * w

    // Initialize sum for the first pixel (handle left edge)
    for (let x = -r; x <= r; x++) {
      sum += alpha[rowOffset + Math.max(0, Math.min(x, w - 1))]
    }
    temp[rowOffset] = Math.round(sum / diameter)

    // Slide window across the row
    for (let x = 1; x < w; x++) {
      const addIdx = Math.min(x + r, w - 1)
      const removeIdx = Math.max(x - r - 1, 0)
      sum += alpha[rowOffset + addIdx] - alpha[rowOffset + removeIdx]
      temp[rowOffset + x] = Math.round(sum / diameter)
    }
  }

  // Vertical pass
  for (let x = 0; x < w; x++) {
    let sum = 0

    // Initialize sum for the first pixel (handle top edge)
    for (let y = -r; y <= r; y++) {
      sum += temp[Math.max(0, Math.min(y, h - 1)) * w + x]
    }
    alpha[x] = Math.round(sum / diameter)

    // Slide window down the column
    for (let y = 1; y < h; y++) {
      const addIdx = Math.min(y + r, h - 1)
      const removeIdx = Math.max(y - r - 1, 0)
      sum += temp[addIdx * w + x] - temp[removeIdx * w + x]
      alpha[y * w + x] = Math.round(sum / diameter)
    }
  }
}

// ── API Mode (rembg server) ──

let _apiAvailableCache: boolean | null = null
let _apiAvailableCacheTime = 0

/**
 * Check if the rembg server is alive and healthy.
 * Positive results are cached permanently; negative results expire after 30s
 * so that starting the rembg server picks up automatically.
 */
export async function isBgRemovalApiAvailable(): Promise<boolean> {
  // Only use cache if it was a positive result, or if negative result is fresh (< 30s)
  if (_apiAvailableCache === true) return true
  if (_apiAvailableCache === false && Date.now() - _apiAvailableCacheTime < 30_000) return false

  try {
    const res = await fetch('/api/bg-remove/status')
    if (!res.ok) {
      _apiAvailableCache = false
      _apiAvailableCacheTime = Date.now()
      return false
    }
    const data = await res.json()
    _apiAvailableCache = data.configured === true
    _apiAvailableCacheTime = Date.now()
    return _apiAvailableCache
  } catch {
    _apiAvailableCache = false
    _apiAvailableCacheTime = Date.now()
    return false
  }
}

/**
 * Remove background via the server-side rembg server.
 * Returns a PNG blob with transparent background.
 */
async function removeImageBackgroundAPI(inputBlob: Blob, onProgress?: BgRemovalProgressCallback): Promise<Blob> {
  onProgress?.({ phase: 'uploading', progress: 0.1 })

  // Convert blob to base64
  const arrayBuffer = await inputBlob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const imageBase64 = `data:${inputBlob.type || 'image/png'};base64,${btoa(binary)}`

  onProgress?.({ phase: 'uploading', progress: 0.3 })

  const res = await fetch('/api/bg-remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, size: 'full' }),
  })

  onProgress?.({ phase: 'uploading', progress: 0.8 })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'API request failed' }))
    throw new Error(errData.error || `rembg server error: ${res.status}`)
  }

  const data = await res.json()

  // Convert base64 result back to blob
  const resultBinary = atob(data.image)
  const resultBytes = new Uint8Array(resultBinary.length)
  for (let i = 0; i < resultBinary.length; i++) {
    resultBytes[i] = resultBinary.charCodeAt(i)
  }
  const resultBlob = new Blob([resultBytes], { type: data.mimeType || 'image/png' })

  onProgress?.({ phase: 'uploading', progress: 1 })

  return resultBlob
}

// ── Main Entry Point ──

/**
 * Remove background from an image blob.
 * Returns a PNG blob with transparent background.
 *
 * @param mode - 'local' for client-side ONNX model, 'api' for server-side rembg (both free)
 */
export async function removeImageBackground(
  inputBlob: Blob,
  onProgress?: BgRemovalProgressCallback,
  mode: 'local' | 'api' = 'local',
): Promise<Blob> {
  // API mode
  if (mode === 'api') {
    const available = await isBgRemovalApiAvailable()
    if (!available) {
      throw new Error('HD background removal is not available — rembg server may not be running.')
    }
    return await removeImageBackgroundAPI(inputBlob, onProgress)
  }

  // Local mode — lazy-load @imgly/background-removal (includes onnxruntime-web)
  const { removeBackground } = await import('@imgly/background-removal')

  const config: Config = {
    progress: (key: string, current: number, total: number) => {
      if (!onProgress) return
      const phase: BgRemovalProgress['phase'] = key.startsWith('fetch') ? 'downloading' : 'processing'
      const progress = total > 0 ? current / total : 0
      onProgress({ phase, progress })
    },
    output: {
      format: 'image/png' as const,
      quality: 1,
    },
  }

  const resultBlob = await removeBackground(inputBlob, config)

  // Post-processing: refine alpha mask for smoother edges on high-res images
  onProgress?.({ phase: 'post-processing', progress: 0.5 })
  const refinedBlob = await refineAlphaMask(resultBlob)
  onProgress?.({ phase: 'post-processing', progress: 1 })

  return refinedBlob
}
