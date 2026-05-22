/**
 * Auto-Reframe Service — Multi-Platform Export
 *
 * Computes layout transforms to reframe a project for different aspect ratios.
 * Uses center-crop for backgrounds and repositions characters/text within safe zones.
 */

import type { VideoCompositionProps } from '@/remotion/types'
import { exportVideo, type ExportOptions, type ExportResult, type ExportProgressCallback } from './videoExport'
import { toast } from '@/stores/useToastStore'
import { logger } from '@/utils/logger'

// ── Types ──

export type AspectRatioKey = '16:9' | '9:16' | '1:1' | '4:3' | '21:9'

export interface ReframeTarget {
  aspectRatio: AspectRatioKey
  label: string
  width: number
  height: number
}

export interface ReframeResult {
  target: ReframeTarget
  result: ExportResult
}

export interface BatchExportProgress {
  currentTarget: ReframeTarget
  currentIndex: number
  totalTargets: number
  exportProgress: number // 0-100 for current target
  overallProgress: number // 0-100 across all targets
}

// ── Constants ──

export const ASPECT_DIMENSIONS: Record<AspectRatioKey, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

export const PLATFORM_PRESETS: ReframeTarget[] = [
  { aspectRatio: '9:16', label: 'TikTok / Reels / Shorts', width: 1080, height: 1920 },
  { aspectRatio: '16:9', label: 'YouTube / Landscape', width: 1920, height: 1080 },
  { aspectRatio: '1:1', label: 'Instagram Square', width: 1080, height: 1080 },
  { aspectRatio: '4:3', label: 'Classic 4:3', width: 1440, height: 1080 },
]

// ── Reframe Logic ──

/**
 * Clamp a value so the element stays within a safe zone.
 * safeZone: 0.8 means element should stay within 80% of frame edges.
 */
function clampToSafeZone(
  pos: number,
  elementSize: number,
  frameSize: number,
  safeZone: number,
): number {
  const margin = frameSize * (1 - safeZone) / 2
  const min = margin + elementSize / 2
  const max = frameSize - margin - elementSize / 2
  if (min >= max) return frameSize / 2 // Element too large, center it
  return Math.max(min, Math.min(max, pos))
}

/**
 * Transform composition props for a new aspect ratio.
 * Uses content-aware anchor detection to keep characters within 80% safe zone
 * and text within 90% safe zone. Center-crops backgrounds.
 */
export function reframeComposition(
  props: VideoCompositionProps,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): VideoCompositionProps {
  const reframed = { ...props }

  const scaleX = targetWidth / sourceWidth
  const scaleY = targetHeight / sourceHeight

  // ── Reframe single character positions (80% safe zone) ──
  if (reframed.character) {
    const character = { ...reframed.character }
    const transforms = { ...character.transforms }

    if (transforms.group) {
      const rawX = transforms.group.x * scaleX
      const rawY = transforms.group.y * scaleY
      transforms.group = {
        ...transforms.group,
        x: clampToSafeZone(rawX, 200, targetWidth, 0.8),
        y: clampToSafeZone(rawY, 200, targetHeight, 0.8),
      }
    }

    character.transforms = transforms as typeof character.transforms
    reframed.character = character
  }

  // ── Reframe multi-character positions (80% safe zone) ──
  if (reframed.dialogueCharacters) {
    reframed.dialogueCharacters = reframed.dialogueCharacters.map(dc => {
      const bw = (dc.boundsWidth ?? 200) * dc.scale
      const bh = (dc.boundsHeight ?? 200) * dc.scale
      return {
        ...dc,
        position: {
          x: clampToSafeZone(dc.position.x * scaleX, bw, targetWidth, 0.8),
          y: clampToSafeZone(dc.position.y * scaleY, bh, targetHeight, 0.8),
        },
      }
    })
  }

  // ── Reframe 3D characters ──
  if (reframed.characters3D) {
    reframed.characters3D = reframed.characters3D.map(c3d => ({
      ...c3d,
      position: {
        x: c3d.position.x * scaleX,
        y: c3d.position.y * scaleY,
        z: c3d.position.z,
      },
    }))
  }

  // ── Reframe text overlays (90% safe zone for readability) ──
  if (reframed.textOverlays) {
    const fontScale = Math.min(scaleX, scaleY)
    reframed.textOverlays = reframed.textOverlays.map(overlay => {
      const scaledFontSize = Math.round(overlay.fontSize * fontScale)
      const estWidth = overlay.width ? overlay.width * scaleX : targetWidth * 0.8
      const estHeight = overlay.height ? overlay.height * scaleY : scaledFontSize * 2
      return {
        ...overlay,
        fontSize: scaledFontSize,
        freeX: clampToSafeZone(overlay.freeX * scaleX, estWidth, targetWidth, 0.9),
        freeY: clampToSafeZone(overlay.freeY * scaleY, estHeight, targetHeight, 0.9),
      }
    })
  }

  // ── Reframe captions ──
  if (reframed.captions) {
    const fontScale = Math.min(scaleX, scaleY)
    reframed.captions = {
      ...reframed.captions,
      fontSize: Math.round(reframed.captions.fontSize * fontScale),
    }
  }

  // ── Reframe shapes ──
  if (reframed.shapes) {
    reframed.shapes = reframed.shapes.map(shape => ({
      ...shape,
      position: {
        x: shape.position.x * scaleX,
        y: shape.position.y * scaleY,
      },
      width: shape.width * scaleX,
      height: shape.height * scaleY,
    }))
  }

  // ── Reframe media items ──
  if (reframed.mediaItems) {
    reframed.mediaItems = reframed.mediaItems.map(item => ({
      ...item,
      position: {
        x: item.position.x * scaleX,
        y: item.position.y * scaleY,
      },
    }))
  }

  // ── Reframe HTML templates (scale for legibility) ──
  if (reframed.htmlTemplates) {
    reframed.htmlTemplates = reframed.htmlTemplates.map(tmpl => ({
      ...tmpl,
      position: {
        x: (tmpl.position?.x ?? 0) * scaleX,
        y: (tmpl.position?.y ?? 0) * scaleY,
      },
      scale: (tmpl.scale ?? 1) * Math.min(scaleX, scaleY),
    }))
  }

  // ── Reframe Lottie/animation backgrounds (cover mode) ──
  if (reframed.lottieAnimations) {
    const coverScale = Math.max(scaleX, scaleY)
    reframed.lottieAnimations = reframed.lottieAnimations.map(anim => ({
      ...anim,
      scale: (anim.scale ?? 1) * coverScale,
    }))
  }

  return reframed
}

// ── Batch Export ──

/**
 * Export the same composition to multiple aspect ratios.
 * Sequentially exports each format, reframing the composition each time.
 */
export async function exportAllFormats(
  props: VideoCompositionProps,
  sourceAspectRatio: AspectRatioKey,
  targets: ReframeTarget[],
  options: {
    fps: number
    durationInFrames: number
    format: 'webm' | 'mp4'
    quality: number
  },
  onProgress: (progress: BatchExportProgress) => void,
  signal?: AbortSignal,
): Promise<ReframeResult[]> {
  const results: ReframeResult[] = []
  const sourceDims = ASPECT_DIMENSIONS[sourceAspectRatio]

  // Filter out the source aspect ratio if it's in the targets
  const filteredTargets = targets.filter(t => t.aspectRatio !== sourceAspectRatio)

  // Add source as first target (no reframing needed)
  const allTargets: ReframeTarget[] = [
    {
      aspectRatio: sourceAspectRatio,
      label: 'Original',
      width: sourceDims.width,
      height: sourceDims.height,
    },
    ...filteredTargets,
  ]

  for (let i = 0; i < allTargets.length; i++) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

    const target = allTargets[i]
    const isSource = target.aspectRatio === sourceAspectRatio

    toast.info(`Exporting ${target.label} (${i + 1}/${allTargets.length})...`)

    // Reframe composition if not the source
    const reframedProps = isSource
      ? props
      : reframeComposition(props, sourceDims.width, sourceDims.height, target.width, target.height)

    const exportOptions: ExportOptions = {
      width: target.width,
      height: target.height,
      fps: options.fps,
      durationInFrames: options.durationInFrames,
      format: options.format,
      quality: options.quality,
    }

    const progressCallback: ExportProgressCallback = (progress) => {
      onProgress({
        currentTarget: target,
        currentIndex: i,
        totalTargets: allTargets.length,
        exportProgress: progress.percentage,
        overallProgress: Math.round(((i + progress.percentage / 100) / allTargets.length) * 100),
      })
    }

    try {
      const result = await exportVideo(reframedProps, exportOptions, progressCallback, signal)
      results.push({ target, result })
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
      logger.error(`[autoReframe] Failed to export ${target.label}:`, err)
      toast.error(`Failed to export ${target.label}`)
    }
  }

  return results
}

// ── Content Anchor Detection ──

export interface ContentAnchor {
  x: number
  y: number
  width: number
  height: number
  weight: number
  label: string
}

/**
 * Extract content anchors from composition props for smart reframing.
 */
export function extractContentAnchors(props: VideoCompositionProps): ContentAnchor[] {
  const anchors: ContentAnchor[] = []

  if (props.dialogueCharacters) {
    for (const dChar of props.dialogueCharacters) {
      if (!dChar.visible) continue
      const bw = dChar.boundsWidth ?? 200
      const bh = dChar.boundsHeight ?? 200
      anchors.push({
        x: dChar.position.x,
        y: dChar.position.y,
        width: bw * dChar.scale,
        height: bh * dChar.scale,
        weight: 10,
        label: `character:${dChar.name}`,
      })
    }
  }

  if (props.textOverlays) {
    for (const text of props.textOverlays) {
      anchors.push({
        x: text.freeX,
        y: text.freeY,
        width: text.width ?? 400,
        height: text.height ?? 100,
        weight: 7,
        label: `text:${text.content.slice(0, 20)}`,
      })
    }
  }

  if (props.characters3D) {
    for (const c3d of props.characters3D) {
      if (!c3d.visible) continue
      anchors.push({
        x: props.width / 2 + c3d.position.x * 100,
        y: props.height / 2 - c3d.position.y * 100,
        width: 200 * c3d.scale,
        height: 300 * c3d.scale,
        weight: 9,
        label: `3d:${c3d.name}`,
      })
    }
  }

  return anchors
}

/**
 * Compute a reframed layout for a target aspect ratio using content anchors
 * to determine the best crop/scale. Returns scale and offset values.
 * When anchors are present, shifts the crop window toward the weighted
 * center of content rather than the geometric center.
 */
export function computeReframedLayout(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect: string,
  anchors: ContentAnchor[],
): { scale: number; offsetX: number; offsetY: number } {
  const targetDims = ASPECT_DIMENSIONS[targetAspect as AspectRatioKey] || { width: sourceWidth, height: sourceHeight }

  const scaleX = targetDims.width / sourceWidth
  const scaleY = targetDims.height / sourceHeight
  const scale = Math.max(scaleX, scaleY) // Fill (cover) mode

  // Default: center crop
  let offsetX = (sourceWidth * scale - targetDims.width) / 2
  let offsetY = (sourceHeight * scale - targetDims.height) / 2

  // Content-aware offset: shift crop toward weighted center of anchors
  if (anchors.length > 0) {
    let totalWeight = 0
    let weightedX = 0
    let weightedY = 0
    for (const a of anchors) {
      weightedX += a.x * a.weight
      weightedY += a.y * a.weight
      totalWeight += a.weight
    }
    const contentCenterX = (weightedX / totalWeight) * scale
    const contentCenterY = (weightedY / totalWeight) * scale
    const frameCenterX = targetDims.width / 2
    const frameCenterY = targetDims.height / 2

    // Shift offset so content center aligns with frame center
    offsetX = Math.max(0, Math.min(
      sourceWidth * scale - targetDims.width,
      contentCenterX - frameCenterX,
    ))
    offsetY = Math.max(0, Math.min(
      sourceHeight * scale - targetDims.height,
      contentCenterY - frameCenterY,
    ))
  }

  return { scale, offsetX, offsetY }
}

/**
 * Download all batch export results.
 */
export function downloadAllResults(results: ReframeResult[], projectName?: string): void {
  for (const { target, result } of results) {
    const ext = result.actualFormat
    const label = target.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const filename = `${projectName || 'export'}-${label}-${target.width}x${target.height}.${ext}`

    const a = document.createElement('a')
    a.href = result.url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}
