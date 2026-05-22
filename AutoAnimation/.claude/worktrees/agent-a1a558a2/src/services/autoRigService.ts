import type { BoneSkeleton } from '@/types/rig'
import { withCreditGate } from './creditGate'

/**
 * Downscale a data URL image if it exceeds maxDimension on either axis.
 * Returns { dataUrl, width, height, scale } where scale is the ratio applied.
 * If no downscaling is needed, returns the original with scale=1.
 */
async function downscaleIfNeeded(
  imageDataUrl: string,
  originalWidth: number,
  originalHeight: number,
  maxDimension: number = 1024
): Promise<{ dataUrl: string; width: number; height: number; scale: number }> {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { dataUrl: imageDataUrl, width: originalWidth, height: originalHeight, scale: 1 }
  }

  const scale = Math.min(maxDimension / originalWidth, maxDimension / originalHeight)
  const newW = Math.round(originalWidth * scale)
  const newH = Math.round(originalHeight * scale)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = newW
      canvas.height = newH
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }
      ctx.drawImage(img, 0, 0, newW, newH)
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: newW, height: newH, scale })
    }
    img.onerror = () => reject(new Error('Failed to load image for downscaling'))
    img.src = imageDataUrl
  })
}

/**
 * Call the server auto-rig endpoint to detect skeleton joints from a character image.
 * Uses Gemini 2.0 Flash vision to analyze the image and return joint positions.
 *
 * Large images are downscaled before sending (Vertex AI works better with ≤1024px images
 * and the request body stays under size limits). Joint coordinates are scaled back up.
 */
export async function autoRigImage(
  imageDataUrl: string,
  imageWidth: number,
  imageHeight: number
): Promise<BoneSkeleton> {
  return withCreditGate('auto-rig-2d', async () => {
    const apiBase = import.meta.env.VITE_API_URL || ''

    // Downscale large images to keep request size manageable and improve AI accuracy
    const { dataUrl: sendUrl, width: sendW, height: sendH, scale } =
      await downscaleIfNeeded(imageDataUrl, imageWidth, imageHeight, 1024)

    let response: Response
    try {
      response = await fetch(`${apiBase}/api/auto-rig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImage: sendUrl,
          imageWidth: sendW,
          imageHeight: sendH,
        }),
      })
    } catch {
      // Network-level error (CORS, connection refused, timeout, body too large)
      throw new Error(
        `Failed to fetch. Make sure the backend server is running: cd server && npm run dev`
      )
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(err.error || `Auto-rig failed with status ${response.status}`)
    }

    const data = await response.json()
    const skeleton = data.skeleton as BoneSkeleton

    // If we downscaled, map joint coordinates back to original image space
    if (scale < 1) {
      const invScale = 1 / scale
      for (const joint of skeleton.joints) {
        joint.restPosition.x = Math.round(joint.restPosition.x * invScale)
        joint.restPosition.y = Math.round(joint.restPosition.y * invScale)
      }
    }

    return skeleton
  })
}
