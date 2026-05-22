/**
 * GIF export service using gifenc.
 *
 * Renders composition frames via the existing Canvas2D pipeline and encodes
 * them into an animated GIF. Supports frame-skip, max width cap, and optional
 * dithering for smaller file sizes.
 */

import { GIFEncoder, quantize, applyPalette, prequantize } from 'gifenc'
import type { VideoCompositionProps } from '@/remotion/types'
import {
  renderFrame,
  type RenderContext,
} from './canvas2dRenderer'
import type { ExportProgressCallback } from './videoExport'
import type { GifExportSettings } from '@/types/gifExport'

interface GifExportOpts {
  width: number
  height: number
  fps: number
  totalFrames: number
  startFrame: number
  quality: number
  gifSettings: GifExportSettings
}

/**
 * Export the composition as an animated GIF.
 *
 * Uses gifenc to encode each rendered frame into a GIF with per-frame
 * 256-color palette quantization. Frame-skip reduces the number of encoded
 * frames to keep file size manageable.
 */
export async function exportAsGif(
  _canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  renderCtx: RenderContext,
  opts: GifExportOpts,
  onProgress: ExportProgressCallback,
  signal?: AbortSignal,
): Promise<{ blob: Blob; url: string }> {
  const { width, height, fps, totalFrames, startFrame, gifSettings } = opts
  const { frameSkip, dithering, loop } = gifSettings

  // Compute scale for rendering
  const scaleX = width / props.width
  const scaleY = height / props.height
  const needsScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001

  // Frame duration in milliseconds, adjusted for frame skip
  const frameDurationMs = Math.round((1000 / fps) * frameSkip)

  // Total frames we will actually encode
  const encodedFrameCount = Math.ceil(totalFrames / frameSkip)

  const gif = GIFEncoder()

  onProgress({
    status: 'rendering',
    currentFrame: 0,
    totalFrames: encodedFrameCount,
    percentage: 0,
    estimatedTimeRemaining: encodedFrameCount * 0.05,
  })

  const renderStart = Date.now()
  let encodedIndex = 0

  for (let i = 0; i < totalFrames; i += frameSkip) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

    // Render frame
    if (needsScale) {
      ctx.save()
      ctx.scale(scaleX, scaleY)
    }
    await renderFrame(ctx, props, startFrame + i, renderCtx)
    if (needsScale) {
      ctx.restore()
    }

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height)
    const { data } = imageData

    // Pre-quantize for better dithering when enabled (reduces color space before quantization)
    if (dithering) {
      prequantize(data, { roundRGB: 10, roundAlpha: 10 })
    }

    // Quantize to 256-color palette
    const format = 'rgb444'
    const palette = quantize(data, 256, { format })
    const index = applyPalette(data, palette, format)

    // Write frame to GIF
    gif.writeFrame(index, width, height, {
      palette,
      delay: frameDurationMs,
      repeat: loop ? 0 : -1,
      dispose: 2,
    })

    encodedIndex++

    // Update progress
    if (encodedIndex % 5 === 0 || encodedIndex === encodedFrameCount) {
      const elapsed = (Date.now() - renderStart) / 1000
      const framesPerSecond = encodedIndex / Math.max(elapsed, 0.01)
      const remaining = (encodedFrameCount - encodedIndex) / Math.max(framesPerSecond, 0.1)

      onProgress({
        status: 'rendering',
        currentFrame: encodedIndex,
        totalFrames: encodedFrameCount,
        percentage: Math.round((encodedIndex / encodedFrameCount) * 100),
        estimatedTimeRemaining: Math.round(remaining),
      })
    }

    // Yield to UI thread periodically
    if (encodedIndex % 20 === 0) {
      await new Promise(r => setTimeout(r, 0))
    }
  }

  // Finalize
  gif.finish()

  const blob = new Blob([gif.bytesView()], { type: 'image/gif' })
  const url = URL.createObjectURL(blob)

  onProgress({
    status: 'complete',
    currentFrame: encodedFrameCount,
    totalFrames: encodedFrameCount,
    percentage: 100,
    estimatedTimeRemaining: 0,
    outputUrl: url,
    outputSize: blob.size,
    actualFormat: 'gif',
    didFallback: false,
  })

  return { blob, url }
}
