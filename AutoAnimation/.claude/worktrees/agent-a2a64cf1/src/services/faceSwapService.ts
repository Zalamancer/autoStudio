import type { FaceSwapConfig } from '@/types/faceSwap'

interface FaceRegion {
  x: number
  y: number
  width: number
  height: number
}

function detectFaceRegion(imageData: ImageData): FaceRegion | null {
  // Placeholder face detection - uses skin tone heuristic
  // In production, replace with ML model (e.g., MediaPipe Face Detection)
  const { width, height, data } = imageData
  let minX = width, minY = height, maxX = 0, maxY = 0
  let skinPixels = 0

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      // Simple skin tone detection
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && r - b > 15) {
        skinPixels++
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (skinPixels < 100) return null

  const padding = Math.max((maxX - minX), (maxY - minY)) * 0.2
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(width, maxX - minX + padding * 2),
    height: Math.min(height, maxY - minY + padding * 2),
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export async function swapFace(config: FaceSwapConfig): Promise<string> {
  const [sourceImg, targetImg] = await Promise.all([
    loadImage(config.sourceImageUrl),
    loadImage(config.targetImageUrl),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = targetImg.width
  canvas.height = targetImg.height
  const ctx = canvas.getContext('2d')!

  // Draw target as base
  ctx.drawImage(targetImg, 0, 0)
  const targetData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const targetFace = detectFaceRegion(targetData)

  // Get source face region
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = sourceImg.width
  srcCanvas.height = sourceImg.height
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(sourceImg, 0, 0)
  const sourceData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height)
  const sourceFace = detectFaceRegion(sourceData)

  if (!targetFace || !sourceFace) {
    throw new Error('Could not detect face in one or both images')
  }

  // Draw source face onto target position with blending
  ctx.globalAlpha = config.blendStrength
  ctx.drawImage(
    sourceImg,
    sourceFace.x, sourceFace.y, sourceFace.width, sourceFace.height,
    targetFace.x, targetFace.y, targetFace.width, targetFace.height
  )
  ctx.globalAlpha = 1

  // Apply lighting preservation via luminance matching
  if (config.preserveLighting) {
    const resultData = ctx.getImageData(
      targetFace.x, targetFace.y, targetFace.width, targetFace.height
    )
    const origData = new ImageData(
      new Uint8ClampedArray(targetData.data.buffer.slice(0)),
      targetData.width, targetData.height
    )
    for (let i = 0; i < resultData.data.length; i += 4) {
      const ox = (targetFace.x + (i / 4) % targetFace.width) | 0
      const oy = (targetFace.y + ((i / 4) / targetFace.width) | 0) | 0
      const oi = (oy * canvas.width + ox) * 4
      const origLum = (origData.data[oi] * 0.299 + origData.data[oi + 1] * 0.587 + origData.data[oi + 2] * 0.114)
      const newLum = (resultData.data[i] * 0.299 + resultData.data[i + 1] * 0.587 + resultData.data[i + 2] * 0.114)
      if (newLum > 0) {
        const ratio = origLum / newLum
        const blend = 0.5
        const factor = 1 + (ratio - 1) * blend
        resultData.data[i] = Math.min(255, resultData.data[i] * factor)
        resultData.data[i + 1] = Math.min(255, resultData.data[i + 1] * factor)
        resultData.data[i + 2] = Math.min(255, resultData.data[i + 2] * factor)
      }
    }
    ctx.putImageData(resultData, targetFace.x, targetFace.y)
  }

  // Enhance sharpness if requested
  if (config.enhanceResult) {
    ctx.filter = 'contrast(1.05) saturate(1.05)'
    ctx.drawImage(canvas, 0, 0)
    ctx.filter = 'none'
  }

  return canvas.toDataURL('image/png')
}
