import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useEditorStore } from '@/stores/useEditorStore'

/**
 * Thumbnail dimensions by aspect ratio.
 * Keeps proportions correct while staying small for storage.
 */
const thumbnailDimensions: Record<string, { width: number; height: number }> = {
  '16:9': { width: 320, height: 180 },
  '9:16': { width: 180, height: 320 },
  '1:1': { width: 256, height: 256 },
  '4:3': { width: 320, height: 240 },
  '21:9': { width: 320, height: 137 },
}

/**
 * Load an image from a data URL or src string.
 * Returns null if loading fails.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Generate a thumbnail for the current project state by compositing
 * the character sprites (body, head, hair, viseme) onto a small canvas.
 *
 * This approach reads directly from Zustand stores so it works without
 * needing a reference to any DOM element.
 *
 * @returns Base64 PNG data URL of the thumbnail, or null if no sprites are available
 */
export async function generateProjectThumbnail(): Promise<string | null> {
  const characterConfig = useCharacterConfigStore.getState()
  const characterParts = useCharacterPartsStore.getState()
  const editor = useEditorStore.getState()

  const aspectRatio = editor.aspectRatio || '16:9'
  const dims = thumbnailDimensions[aspectRatio] || thumbnailDimensions['16:9']

  // Collect the first available sprite for each visible layer
  // Layer order: body -> shirt -> pants -> shoes -> eye -> eyebrow -> viseme -> hair (back to front)
  const layers: Array<{ src: string; partKey: string }> = []
  const layerOrder: Array<'body' | 'shirt' | 'pants' | 'shoes' | 'eye' | 'eyebrow' | 'viseme' | 'hair'> = ['body', 'shirt', 'pants', 'shoes', 'eye', 'eyebrow', 'viseme', 'hair']

  for (const partKey of layerOrder) {
    const part = characterParts.parts[partKey]
    if (!part || !part.visible) continue

    const sprites = characterConfig.savedImages[partKey]
    if (!sprites || sprites.length === 0) continue

    // Use the selected sprite index, or fall back to index 0
    const idx = part.selectedSpriteIndex >= 0 && part.selectedSpriteIndex < sprites.length
      ? part.selectedSpriteIndex
      : 0
    const src = sprites[idx]
    if (src) {
      layers.push({ src, partKey })
    }
  }

  // If no layers have sprites, return null (nothing to thumbnail)
  if (layers.length === 0) {
    return null
  }

  // Create an offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = dims.width
  canvas.height = dims.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Fill background with dark color
  ctx.fillStyle = '#18181b' // zinc-900
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Load and draw each layer
  for (const layer of layers) {
    const img = await loadImage(layer.src)
    if (!img) continue

    const part = characterParts.parts[layer.partKey]
    if (!part) continue

    // Calculate scale factor from original canvas to thumbnail
    // Original canvas is 1920x1080 (or whatever the aspect ratio dictates)
    const originalWidth = aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : aspectRatio === '4:3' ? 1440 : aspectRatio === '21:9' ? 2560 : 1920
    const originalHeight = aspectRatio === '9:16' ? 1920 : 1080
    const scaleX = dims.width / originalWidth
    const scaleY = dims.height / originalHeight

    ctx.save()

    // Apply transforms scaled down to thumbnail size
    const tx = part.position.x * scaleX
    const ty = part.position.y * scaleY

    ctx.translate(tx + (dims.width / 2), ty + (dims.height / 2))
    ctx.rotate((part.rotation * Math.PI) / 180)
    ctx.scale(part.scale.x, part.scale.y)

    // Draw image centered
    const drawWidth = img.width * scaleX
    const drawHeight = img.height * scaleY
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

    ctx.restore()
  }

  return canvas.toDataURL('image/png', 0.8)
}

/**
 * Alternative: capture thumbnail from a DOM element (the video canvas).
 * Uses the foreignObject SVG trick to render DOM content to canvas.
 *
 * @param element - The DOM element to capture (e.g., the video canvas div)
 * @param width - Target thumbnail width
 * @param height - Target thumbnail height
 * @returns Base64 PNG data URL, or null on failure
 */
export async function captureCanvasThumbnail(
  element: HTMLElement,
  width?: number,
  height?: number
): Promise<string | null> {
  try {
    const editor = useEditorStore.getState()
    const aspectRatio = editor.aspectRatio || '16:9'
    const dims = thumbnailDimensions[aspectRatio] || thumbnailDimensions['16:9']

    const targetWidth = width || dims.width
    const targetHeight = height || dims.height

    // Try to find a canvas element inside the container
    const canvasEl = element.querySelector('canvas')
    if (canvasEl) {
      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = targetWidth
      thumbCanvas.height = targetHeight
      const ctx = thumbCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(canvasEl, 0, 0, targetWidth, targetHeight)
        return thumbCanvas.toDataURL('image/png', 0.8)
      }
    }

    // Fallback to the sprite-based approach
    return generateProjectThumbnail()
  } catch {
    // If DOM capture fails, fall back to sprite-based approach
    return generateProjectThumbnail()
  }
}
