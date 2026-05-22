/**
 * Watermark Renderer — shared logic for rendering brand watermarks
 * on both the live canvas preview and the export renderer.
 *
 * Handles position calculation, opacity, scaling relative to canvas
 * dimensions, and caching the watermark image.
 */

import type { BrandKit } from '@/types/brandKit'

// Cache for the watermark image to avoid re-loading each frame
let cachedWatermarkUrl: string | null = null
let cachedWatermarkImage: HTMLImageElement | null = null

/**
 * Pre-load the watermark image and cache it.
 * Returns the loaded HTMLImageElement or null if loading fails.
 */
export async function preloadWatermark(url: string): Promise<HTMLImageElement | null> {
  if (cachedWatermarkUrl === url && cachedWatermarkImage) {
    return cachedWatermarkImage
  }

  try {
    const img = new Image()
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load watermark'))
      img.src = url
    })
    cachedWatermarkUrl = url
    cachedWatermarkImage = img
    return img
  } catch {
    console.warn('[watermarkRenderer] Failed to load watermark image')
    return null
  }
}

/**
 * Clear the watermark cache (e.g. when the brand kit changes).
 */
export function clearWatermarkCache(): void {
  cachedWatermarkUrl = null
  cachedWatermarkImage = null
}

export interface WatermarkConfig {
  url: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  opacity: number
}

/**
 * Extract watermark config from an active brand kit.
 * Returns null if the brand kit has no watermark.
 */
export function getWatermarkConfig(kit: BrandKit | null): WatermarkConfig | null {
  if (!kit?.watermarkUrl) return null
  return {
    url: kit.watermarkUrl,
    position: kit.watermarkPosition || 'bottom-right',
    opacity: kit.watermarkOpacity ?? 0.5,
  }
}

/**
 * Render a watermark onto a Canvas2D context.
 * The watermark is scaled to ~10% of the canvas width and placed at the
 * configured position with a margin.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  config: WatermarkConfig,
): void {
  const maxWatermarkWidth = canvasWidth * 0.1
  const scale = Math.min(maxWatermarkWidth / img.width, 1)
  const w = img.width * scale
  const h = img.height * scale
  const margin = canvasWidth * 0.02

  let x: number
  let y: number

  switch (config.position) {
    case 'top-left':
      x = margin
      y = margin
      break
    case 'top-right':
      x = canvasWidth - w - margin
      y = margin
      break
    case 'bottom-left':
      x = margin
      y = canvasHeight - h - margin
      break
    case 'bottom-right':
    default:
      x = canvasWidth - w - margin
      y = canvasHeight - h - margin
      break
  }

  ctx.save()
  ctx.globalAlpha = config.opacity
  ctx.drawImage(img, x, y, w, h)
  ctx.restore()
}
