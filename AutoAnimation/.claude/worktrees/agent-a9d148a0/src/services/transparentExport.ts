/**
 * Transparent Video Export — alpha-channel export paths.
 *
 * Supports:
 * - VP9 WebM with alpha (Chrome 94+, hardware-accelerated)
 * - PNG image sequence bundled into a ZIP (universal compatibility)
 * - ProRes 4444 via FFmpeg WASM (optional, lazy-loaded)
 */

import type { VideoCompositionProps } from '@/remotion/types'
import { renderFrame, type RenderContext } from './canvas2dRenderer'
import type { ExportProgressCallback } from './videoExport'

// ── Feature Detection ──

/**
 * Check if VP9 with alpha is supported by the current browser's WebCodecs.
 * Returns false on Safari and browsers without VideoEncoder.
 */
export function isVP9AlphaSupported(): boolean {
  if (typeof VideoEncoder === 'undefined') return false
  // Safari does not support VP9 encoding
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  if (isSafari) return false
  return true
}

// ── VP9 WebM Alpha Export ──

interface TransparentExportOpts {
  width: number
  height: number
  fps: number
  totalFrames: number
  startFrame: number
  quality: number
}

/**
 * Export a transparent VP9 WebM video using WebCodecs with alpha channel.
 */
export async function exportWebMAlpha(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  renderCtx: RenderContext,
  opts: TransparentExportOpts,
  onProgress: ExportProgressCallback,
  signal?: AbortSignal,
): Promise<{ url: string; size: number }> {
  const { width, height, fps, totalFrames, startFrame, quality } = opts

  const { Muxer, ArrayBufferTarget } = await import('webm-muxer')
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'V_VP9', width, height, alpha: true },
  })

  const bitrate = Math.min(
    Math.round(width * height * fps * quality * 0.15),
    50_000_000,
  )

  let encoderError: Error | null = null
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e))
    },
  })

  videoEncoder.configure({
    codec: 'vp09.00.10.08',
    width,
    height,
    bitrate,
    bitrateMode: 'variable',
    alpha: 'keep',
  })

  const scaleX = width / props.width
  const scaleY = height / props.height
  const needsScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001

  const renderStart = Date.now()

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
      if (encoderError) throw encoderError

      // Clear canvas for transparency
      ctx.clearRect(0, 0, width, height)

      if (needsScale) {
        ctx.save()
        ctx.scale(scaleX, scaleY)
      }
      await renderFrame(ctx, props, startFrame + i, renderCtx, { alpha: true })
      if (needsScale) {
        ctx.restore()
      }

      const frame = new VideoFrame(canvas, {
        timestamp: (i * 1_000_000) / fps,
        duration: 1_000_000 / fps,
        alpha: 'keep',
      })

      const keyFrame = i % (fps * 2) === 0
      videoEncoder.encode(frame, { keyFrame })
      frame.close()

      // Backpressure
      if (videoEncoder.encodeQueueSize > 8) {
        await new Promise<void>((resolve) => {
          const check = () => {
            if (signal?.aborted || videoEncoder.encodeQueueSize <= 4) resolve()
            else setTimeout(check, 1)
          }
          check()
        })
      }

      if (i % 10 === 0 || i === totalFrames - 1) {
        const elapsed = (Date.now() - renderStart) / 1000
        const framesPerSecond = (i + 1) / Math.max(elapsed, 0.01)
        const remaining = (totalFrames - i - 1) / Math.max(framesPerSecond, 0.1)

        onProgress({
          status: 'rendering',
          currentFrame: i + 1,
          totalFrames,
          percentage: Math.round(((i + 1) / totalFrames) * 100),
          estimatedTimeRemaining: Math.round(remaining),
        })
      }

      if (i % 60 === 0) {
        await new Promise((r) => setTimeout(r, 0))
      }
    }

    await videoEncoder.flush()
  } finally {
    try { videoEncoder.close() } catch { /* already closed */ }
  }

  muxer.finalize()
  const blob = new Blob([muxer.target.buffer], { type: 'video/webm' })
  const url = URL.createObjectURL(blob)

  onProgress({
    status: 'complete',
    currentFrame: totalFrames,
    totalFrames,
    percentage: 100,
    estimatedTimeRemaining: 0,
    outputUrl: url,
    outputSize: blob.size,
  })

  return { url, size: blob.size }
}

// ── PNG Sequence Export ──

/**
 * Export frames as a PNG image sequence bundled into a ZIP file.
 */
export async function exportPNGSequence(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  renderCtx: RenderContext,
  opts: TransparentExportOpts,
  onProgress: ExportProgressCallback,
  signal?: AbortSignal,
): Promise<{ url: string; size: number }> {
  const { width, height, totalFrames, startFrame } = opts

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  const scaleX = width / props.width
  const scaleY = height / props.height
  const needsScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001

  const renderStart = Date.now()
  const padLength = String(totalFrames).length

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

    ctx.clearRect(0, 0, width, height)

    if (needsScale) {
      ctx.save()
      ctx.scale(scaleX, scaleY)
    }
    await renderFrame(ctx, props, startFrame + i, renderCtx, { alpha: true })
    if (needsScale) {
      ctx.restore()
    }

    // Capture the frame as PNG
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })

    const frameNum = String(i + 1).padStart(padLength, '0')
    zip.file(`frame_${frameNum}.png`, blob)

    if (i % 10 === 0 || i === totalFrames - 1) {
      const elapsed = (Date.now() - renderStart) / 1000
      const framesPerSecond = (i + 1) / Math.max(elapsed, 0.01)
      const remaining = (totalFrames - i - 1) / Math.max(framesPerSecond, 0.1)

      onProgress({
        status: 'rendering',
        currentFrame: i + 1,
        totalFrames,
        percentage: Math.round(((i + 1) / totalFrames) * 100),
        estimatedTimeRemaining: Math.round(remaining),
      })
    }

    if (i % 30 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  onProgress({
    status: 'encoding',
    currentFrame: totalFrames,
    totalFrames,
    percentage: 99,
    estimatedTimeRemaining: 2,
  })

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)

  onProgress({
    status: 'complete',
    currentFrame: totalFrames,
    totalFrames,
    percentage: 100,
    estimatedTimeRemaining: 0,
    outputUrl: url,
    outputSize: zipBlob.size,
  })

  return { url, size: zipBlob.size }
}

/**
 * Export as ProRes 4444 via FFmpeg WASM (lazy-loaded).
 */
export async function exportProRes4444(
  _canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  renderCtx: RenderContext,
  opts: TransparentExportOpts,
  onProgress: ExportProgressCallback,
  signal?: AbortSignal,
): Promise<{ url: string; size: number }> {
  const { width, height, fps, totalFrames, startFrame } = opts

  const { loadFFmpeg } = await import('./ffmpegLoader')
  const ffmpeg = await loadFFmpeg((progress) => {
    onProgress({
      status: 'preparing',
      currentFrame: 0,
      totalFrames,
      percentage: Math.round(progress * 10), // 0-10% for loading
      estimatedTimeRemaining: 0,
    })
  })

  const scaleX = width / props.width
  const scaleY = height / props.height
  const needsScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001

  const renderStart = Date.now()
  const padLength = String(totalFrames).length

  // Render all frames as raw RGBA and write to FFmpeg FS
  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

    ctx.clearRect(0, 0, width, height)

    if (needsScale) {
      ctx.save()
      ctx.scale(scaleX, scaleY)
    }
    await renderFrame(ctx, props, startFrame + i, renderCtx, { alpha: true })
    if (needsScale) {
      ctx.restore()
    }

    // Get raw pixel data
    const imageData = ctx.getImageData(0, 0, width, height)
    const frameNum = String(i + 1).padStart(padLength, '0')
    await ffmpeg.writeFile(`frame_${frameNum}.rgba`, imageData.data)

    if (i % 10 === 0 || i === totalFrames - 1) {
      const elapsed = (Date.now() - renderStart) / 1000
      const framesPerSecond = (i + 1) / Math.max(elapsed, 0.01)
      const remaining = (totalFrames - i - 1) / Math.max(framesPerSecond, 0.1)

      onProgress({
        status: 'rendering',
        currentFrame: i + 1,
        totalFrames,
        percentage: 10 + Math.round(((i + 1) / totalFrames) * 70),
        estimatedTimeRemaining: Math.round(remaining),
      })
    }

    if (i % 60 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  onProgress({
    status: 'encoding',
    currentFrame: totalFrames,
    totalFrames,
    percentage: 85,
    estimatedTimeRemaining: 10,
  })

  // Encode with FFmpeg
  const padNum = padLength
  await ffmpeg.exec([
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', `${width}x${height}`,
    '-r', String(fps),
    '-i', `frame_%0${padNum}d.rgba`,
    '-c:v', 'prores_ks',
    '-profile:v', '4',
    '-pix_fmt', 'yuva444p10le',
    '-y', 'output.mov',
  ])

  const outputData = await ffmpeg.readFile('output.mov')
  const blob = new Blob([outputData], { type: 'video/quicktime' })
  const url = URL.createObjectURL(blob)

  onProgress({
    status: 'complete',
    currentFrame: totalFrames,
    totalFrames,
    percentage: 100,
    estimatedTimeRemaining: 0,
    outputUrl: url,
    outputSize: blob.size,
  })

  return { url, size: blob.size }
}
