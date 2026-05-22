import type { VideoFaceSwapConfig } from '@/types/faceSwap'

interface VideoFaceSwapResult {
  frameUrls: string[]
  progress: number
}

function extractFramesFromVideo(
  video: HTMLVideoElement,
  frameSkip: number
): Promise<HTMLCanvasElement[]> {
  return new Promise((resolve) => {
    const frames: HTMLCanvasElement[] = []
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!
    const fps = 30
    const totalFrames = Math.ceil(video.duration * fps)
    let frameIndex = 0

    function captureFrame() {
      if (frameIndex >= totalFrames) {
        resolve(frames)
        return
      }
      const time = frameIndex / fps
      video.currentTime = time
      video.onseeked = () => {
        if (frameIndex % frameSkip === 0) {
          const frameCanvas = document.createElement('canvas')
          frameCanvas.width = video.videoWidth
          frameCanvas.height = video.videoHeight
          const frameCtx = frameCanvas.getContext('2d')!
          frameCtx.drawImage(video, 0, 0)
          frames.push(frameCanvas)
        }
        frameIndex++
        captureFrame()
      }
    }
    captureFrame()
  })
}

function detectFaceInFrame(canvas: HTMLCanvasElement): {
  x: number; y: number; width: number; height: number
} | null {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { width, height, data } = imageData
  let minX = width, minY = height, maxX = 0, maxY = 0
  let count = 0

  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
        count++
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (count < 50) return null
  const pad = Math.max(maxX - minX, maxY - minY) * 0.15
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    width: Math.min(width, maxX - minX + pad * 2),
    height: Math.min(height, maxY - minY + pad * 2),
  }
}

function smoothPositions(
  positions: Array<{ x: number; y: number; width: number; height: number } | null>,
  smoothing: number
): Array<{ x: number; y: number; width: number; height: number } | null> {
  const result = [...positions]
  const alpha = 1 - smoothing

  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1]
    const curr = result[i]
    if (prev && curr) {
      result[i] = {
        x: prev.x * (1 - alpha) + curr.x * alpha,
        y: prev.y * (1 - alpha) + curr.y * alpha,
        width: prev.width * (1 - alpha) + curr.width * alpha,
        height: prev.height * (1 - alpha) + curr.height * alpha,
      }
    }
  }
  return result
}

export async function swapVideoFace(
  config: VideoFaceSwapConfig,
  onProgress?: (progress: number) => void
): Promise<VideoFaceSwapResult> {
  // Load source face
  const sourceImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = config.sourceFaceUrl
  })

  // Load target video
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.src = config.targetVideoUrl
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve()
  })

  // Extract frames
  const frames = await extractFramesFromVideo(video, config.frameSkip)

  // Detect faces in all frames
  const rawPositions = frames.map((frame) => detectFaceInFrame(frame))

  // Smooth tracking
  const smoothed = smoothPositions(rawPositions, config.trackingSmoothing)

  // Composite face onto each frame
  const frameUrls: string[] = []
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const pos = smoothed[i]
    if (pos) {
      const ctx = frame.getContext('2d')!
      ctx.globalAlpha = 0.85
      ctx.drawImage(sourceImg, pos.x, pos.y, pos.width, pos.height)
      ctx.globalAlpha = 1
    }
    frameUrls.push(frame.toDataURL('image/png'))
    onProgress?.((i + 1) / frames.length)
  }

  return { frameUrls, progress: 1 }
}
