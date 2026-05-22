/**
 * Orchestrator step: generate-thumbnail
 *
 * Captures the most visually interesting frame from the composition,
 * overlays bold text in brand colors, and stores the result as
 * a thumbnail URL on the project / dashboard clip.
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { ExecutionContext } from '../constants'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { logger } from '@/utils/logger'

/**
 * Draw a bold text overlay on the thumbnail canvas for click-through appeal.
 */
function drawThumbnailText(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  brandColors?: string[],
): void {
  if (!text) return

  const primaryColor = brandColors?.[0] || '#FFFFFF'

  // Text styling
  const fontSize = Math.round(width * 0.06)
  ctx.font = `900 ${fontSize}px "Inter", "Helvetica Neue", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Measure and truncate text if needed
  const maxWidth = width * 0.85
  let displayText = text
  while (ctx.measureText(displayText).width > maxWidth && displayText.length > 10) {
    displayText = displayText.slice(0, -4) + '...'
  }

  const textX = width / 2
  const textY = height * 0.85

  // Draw text shadow/outline for readability
  ctx.strokeStyle = 'rgba(0,0,0,0.9)'
  ctx.lineWidth = fontSize * 0.15
  ctx.lineJoin = 'round'
  ctx.strokeText(displayText, textX, textY)

  // Draw text fill
  ctx.fillStyle = primaryColor
  ctx.fillText(displayText, textX, textY)
}

export async function executeGenerateThumbnail(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  try {
    const { totalFrames, fps } = ctx
    if (totalFrames <= 0) {
      logger.warn('[Orchestrator:thumbnail] No frames to analyze, skipping')
      return
    }

    const width = 1280
    const height = plan.canvas.aspectRatio === '9:16' ? 2275
      : plan.canvas.aspectRatio === '1:1' ? 1280
      : plan.canvas.aspectRatio === '4:3' ? 960
      : 720 // 16:9 default

    // Create offscreen canvas for thumbnail generation
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) {
      logger.warn('[Orchestrator:thumbnail] Could not create canvas context')
      return
    }

    const bestFrame = Math.floor(totalFrames * 0.3)

    // Seek the timeline to the best frame so the live canvas shows it
    const bestTime = bestFrame / fps
    usePlaybackStore.getState().seek(bestTime)
    // Allow a brief tick for the canvas to render the seeked frame
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Capture the live editor canvas via html2canvas
    const exportDiv = document.querySelector('[data-export-canvas]') as HTMLElement | null
    let sourceCanvas: HTMLCanvasElement | null = null

    if (exportDiv) {
      try {
        const html2canvas = (await import('html2canvas')).default
        sourceCanvas = await html2canvas(exportDiv, {
          width: exportDiv.offsetWidth,
          height: exportDiv.offsetHeight,
          scale: Math.max(1, width / exportDiv.offsetWidth),
          backgroundColor: '#18181b',
          useCORS: true,
          allowTaint: true,
          logging: false,
        })
      } catch (err) {
        logger.warn('[Orchestrator:thumbnail] html2canvas capture failed:', err)
      }
    }

    if (sourceCanvas && sourceCanvas.width > 0) {
      canvasCtx.drawImage(sourceCanvas, 0, 0, width, height)
    } else {
      // Fallback: solid dark background
      const bgColor = ctx.settings?.brandContext?.primaryColors?.[0] || '#18181b'
      canvasCtx.fillStyle = bgColor
      canvasCtx.fillRect(0, 0, width, height)
    }

    // Determine text for the thumbnail
    const thumbnailText =
      ctx.settings?.brandContext?.tagline ||
      plan.textOverlays.find((t) => t.preset === 'title')?.content ||
      plan.dialogue[0]?.script?.replace(/\[.*?\]/g, '').trim().split('.')[0] ||
      ''

    drawThumbnailText(
      canvasCtx,
      thumbnailText,
      width,
      height,
      ctx.settings?.brandContext?.primaryColors,
    )

    // Convert to blob and create URL
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    )

    if (blob) {
      const thumbnailUrl = URL.createObjectURL(blob)
      // Store on context for dashboard pickup
      ;(ctx as ExecutionContext & { thumbnailUrl?: string }).thumbnailUrl = thumbnailUrl
      logger.log(
        `[Orchestrator:thumbnail] Generated thumbnail (${width}x${height}) from frame ${bestFrame}/${totalFrames} ` +
        `(${(bestFrame / fps).toFixed(1)}s)`,
      )
    }
  } catch (err) {
    logger.error('[Orchestrator:thumbnail] Failed to generate thumbnail:', err)
    // Non-fatal — don't throw
  }
}
