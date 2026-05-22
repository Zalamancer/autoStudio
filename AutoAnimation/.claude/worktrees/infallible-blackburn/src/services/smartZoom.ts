/**
 * Smart Zoom Service — Generates camera zoom keyframes from transcript data.
 *
 * Combines rule-based heuristics with optional AI analysis to detect
 * emphasis points and generate appropriate camera movements.
 */

import type { WhisperWord, WhisperSegment } from '@/services/whisperTranscript'
import type { CameraKeyframe } from '@/stores/useCameraStore'
import type { ZoomPoint, SmartZoomConfig, ZoomStyle } from '@/types/smartZoom'
import { detectAllHeuristic } from '@/services/smartZoomHeuristics'
import { detectEmphasisWithAI } from '@/services/smartZoomAI'

export class SmartZoomService {
  /**
   * Analyze transcript for zoom points (heuristic + optional AI).
   */
  async analyzeForZoom(
    segments: WhisperSegment[],
    words: WhisperWord[],
    config: SmartZoomConfig,
    fps: number,
  ): Promise<ZoomPoint[]> {
    // Rule-based detection
    let points = detectAllHeuristic(segments, words, config, fps)

    // Optional AI-based detection
    if (config.useAI) {
      try {
        const fullText = segments.map((s) => s.text).join(' ')
        const aiPoints = await detectEmphasisWithAI(fullText, words, fps)

        // Merge AI points with heuristic points, deduplicate
        const merged = [...points, ...aiPoints]
        points = deduplicateNearby(merged, fps)

        // Re-enforce max 1 zoom per 2 seconds after merging
        points = enforceMinSpacing(points, fps * 2)

        // Re-filter by frequency
        points = filterByFrequency(points, config.frequency)
      } catch (err) {
        console.warn('[SmartZoom] AI emphasis detection failed, using heuristics only:', err)
      }
    }

    return points
  }

  /**
   * Generate camera keyframes from zoom points.
   */
  generateCameraKeyframes(
    zoomPoints: ZoomPoint[],
    config: SmartZoomConfig,
    fps: number,
    totalFrames: number,
  ): CameraKeyframe[] {
    const keyframes: CameraKeyframe[] = []

    // Ensure we start at base state
    if (zoomPoints.length > 0 && zoomPoints[0].frame > 0) {
      keyframes.push({
        frame: 0,
        zoom: 1,
        panX: 0,
        panY: 0,
        rotation: 0,
        easing: 'linear',
        tag: 'smart-zoom',
      })
    }

    for (const point of zoomPoints) {
      const style = config.triggerStyleOverrides?.[point.type] ?? config.style
      const actualZoom = 1 + (config.maxZoom - 1) * point.intensity * config.intensity

      // Generate subtle pan offset for visual interest
      const panOffset = (Math.random() - 0.5) * 6 // +-3%

      const kfs = this.generateStyleKeyframes(
        point.frame,
        actualZoom,
        panOffset,
        style,
        fps,
        totalFrames,
      )
      keyframes.push(...kfs)
    }

    // Sort and deduplicate
    keyframes.sort((a, b) => a.frame - b.frame)
    return this.deduplicateKeyframes(keyframes)
  }

  /**
   * Generate keyframes for a single zoom point based on style.
   */
  private generateStyleKeyframes(
    frame: number,
    targetZoom: number,
    panX: number,
    style: ZoomStyle,
    fps: number,
    totalFrames: number,
  ): CameraKeyframe[] {
    const kfs: CameraKeyframe[] = []

    switch (style) {
      case 'smooth': {
        // Ease-in-out zoom over ~500ms, hold ~330ms, return over ~660ms
        const zoomInFrames = Math.round(fps * 0.5)
        const holdFrames = Math.round(fps * 0.33)
        const returnFrames = Math.round(fps * 0.66)

        // Pre-zoom base
        const preFrame = Math.max(0, frame - 2)
        kfs.push({
          frame: preFrame,
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'ease-in-out',
          tag: 'smart-zoom',
        })

        // Peak zoom
        const peakFrame = Math.min(frame + zoomInFrames, totalFrames - 1)
        kfs.push({
          frame: peakFrame,
          zoom: targetZoom, panX, panY: 0, rotation: 0,
          easing: 'ease-in-out',
          tag: 'smart-zoom',
        })

        // Return to base
        const returnFrame = Math.min(peakFrame + holdFrames + returnFrames, totalFrames - 1)
        kfs.push({
          frame: returnFrame,
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'ease-in-out',
          tag: 'smart-zoom',
        })
        break
      }

      case 'crash': {
        // Instant jump (1 frame), hold ~170ms, ease-out return over ~500ms
        const holdFrames = Math.round(fps * 0.17)
        const returnFrames = Math.round(fps * 0.5)

        // Pre-zoom base
        kfs.push({
          frame: Math.max(0, frame - 1),
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'linear',
          tag: 'smart-zoom',
        })

        // Instant peak
        kfs.push({
          frame,
          zoom: targetZoom, panX, panY: 0, rotation: 0,
          easing: 'ease-out',
          tag: 'smart-zoom',
        })

        // Return
        const returnFrame = Math.min(frame + holdFrames + returnFrames, totalFrames - 1)
        kfs.push({
          frame: returnFrame,
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'ease-in-out',
          tag: 'smart-zoom',
        })
        break
      }

      case 'expo': {
        // Fast accelerating zoom over ~330ms, hold ~170ms, ease-out return over ~660ms
        const zoomInFrames = Math.round(fps * 0.33)
        const holdFrames = Math.round(fps * 0.17)
        const returnFrames = Math.round(fps * 0.66)

        kfs.push({
          frame: Math.max(0, frame - 2),
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'ease-in',
          tag: 'smart-zoom',
        })

        const peakFrame = Math.min(frame + zoomInFrames, totalFrames - 1)
        kfs.push({
          frame: peakFrame,
          zoom: targetZoom, panX, panY: 0, rotation: 0,
          easing: 'ease-out',
          tag: 'smart-zoom',
        })

        const returnFrame = Math.min(peakFrame + holdFrames + returnFrames, totalFrames - 1)
        kfs.push({
          frame: returnFrame,
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'ease-in-out',
          tag: 'smart-zoom',
        })
        break
      }

      case 'linear': {
        // Linear zoom over ~660ms, hold ~330ms, linear return over ~660ms
        const zoomInFrames = Math.round(fps * 0.66)
        const holdFrames = Math.round(fps * 0.33)
        const returnFrames = Math.round(fps * 0.66)

        kfs.push({
          frame: Math.max(0, frame - 2),
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'linear',
          tag: 'smart-zoom',
        })

        const peakFrame = Math.min(frame + zoomInFrames, totalFrames - 1)
        kfs.push({
          frame: peakFrame,
          zoom: targetZoom, panX, panY: 0, rotation: 0,
          easing: 'linear',
          tag: 'smart-zoom',
        })

        const returnFrame = Math.min(peakFrame + holdFrames + returnFrames, totalFrames - 1)
        kfs.push({
          frame: returnFrame,
          zoom: 1, panX: 0, panY: 0, rotation: 0,
          easing: 'linear',
          tag: 'smart-zoom',
        })
        break
      }
    }

    return kfs
  }

  /**
   * Remove duplicate keyframes at the same frame.
   */
  private deduplicateKeyframes(keyframes: CameraKeyframe[]): CameraKeyframe[] {
    const result: CameraKeyframe[] = []
    let lastFrame = -1

    for (const kf of keyframes) {
      if (kf.frame !== lastFrame) {
        result.push(kf)
        lastFrame = kf.frame
      }
    }

    return result
  }
}

// ── Helpers (shared with heuristics) ──────────────────────────────────

function deduplicateNearby(points: ZoomPoint[], fps: number): ZoomPoint[] {
  if (points.length === 0) return []
  const sorted = [...points].sort((a, b) => a.frame - b.frame)
  const result: ZoomPoint[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1]
    if (sorted[i].frame - last.frame < fps) {
      if (sorted[i].intensity > last.intensity) {
        result[result.length - 1] = sorted[i]
      }
    } else {
      result.push(sorted[i])
    }
  }
  return result
}

function enforceMinSpacing(points: ZoomPoint[], minFrameGap: number): ZoomPoint[] {
  if (points.length === 0) return []
  const sorted = [...points].sort((a, b) => b.intensity - a.intensity)
  const kept: ZoomPoint[] = []

  for (const point of sorted) {
    const tooClose = kept.some((k) => Math.abs(k.frame - point.frame) < minFrameGap)
    if (!tooClose) kept.push(point)
  }

  return kept.sort((a, b) => a.frame - b.frame)
}

function filterByFrequency(
  points: ZoomPoint[],
  frequency: 'conservative' | 'moderate' | 'aggressive',
): ZoomPoint[] {
  const ratios: Record<string, number> = { conservative: 0.2, moderate: 0.5, aggressive: 0.8 }
  const keepRatio = ratios[frequency] || 0.5
  const sorted = [...points].sort((a, b) => b.intensity - a.intensity)
  const keepCount = Math.max(1, Math.ceil(sorted.length * keepRatio))
  return sorted.slice(0, keepCount).sort((a, b) => a.frame - b.frame)
}

// Singleton
let _instance: SmartZoomService | null = null
export function getSmartZoomService(): SmartZoomService {
  if (!_instance) _instance = new SmartZoomService()
  return _instance
}
