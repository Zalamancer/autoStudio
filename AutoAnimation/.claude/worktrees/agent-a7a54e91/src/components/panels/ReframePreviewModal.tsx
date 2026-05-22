/**
 * ReframePreviewModal — Side-by-side preview of reframed compositions
 * before batch export. Shows original vs each target platform layout.
 */

import { useState, useMemo, useCallback } from 'react'
import { X, Check, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompositionPlayer } from '@/engine'
import { VideoComposition } from '@/remotion/VideoComposition'
import type { VideoCompositionProps } from '@/remotion/types'
import {
  PLATFORM_PRESETS,
  ASPECT_DIMENSIONS,
  reframeComposition,
  exportAllFormats,
  downloadAllResults,
  type ReframeTarget as _ReframeTarget,
  type AspectRatioKey,
  type BatchExportProgress,
} from '@/services/autoReframe'
import { formatFileSize } from '@/services/videoExport'

const PLATFORM_ICONS: Record<string, string> = {
  '9:16': '📱',
  '16:9': '🖥️',
  '1:1': '⬜',
  '4:3': '📺',
}

interface ReframePreviewModalProps {
  compositionProps: VideoCompositionProps
  sourceAspectRatio: AspectRatioKey
  fps: number
  durationInFrames: number
  format: 'webm' | 'mp4'
  quality: number
  onClose: () => void
}

export function ReframePreviewModal({
  compositionProps,
  sourceAspectRatio,
  fps,
  durationInFrames,
  format,
  quality,
  onClose,
}: ReframePreviewModalProps) {
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(() => {
    // Pre-select all platforms except the source
    const set = new Set<string>()
    for (const p of PLATFORM_PRESETS) {
      if (p.aspectRatio !== sourceAspectRatio) set.add(p.aspectRatio)
    }
    return set
  })
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<BatchExportProgress | null>(null)

  const sourceDims = ASPECT_DIMENSIONS[sourceAspectRatio]

  // Build reframed previews for each platform
  const previews = useMemo(() => {
    return PLATFORM_PRESETS.map((preset) => {
      const isSource = preset.aspectRatio === sourceAspectRatio
      const reframed = isSource
        ? compositionProps
        : reframeComposition(
            compositionProps,
            sourceDims.width,
            sourceDims.height,
            preset.width,
            preset.height,
          )
      return { preset, reframed, isSource }
    })
  }, [compositionProps, sourceAspectRatio, sourceDims])

  const toggleTarget = useCallback((aspectRatio: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev)
      if (next.has(aspectRatio)) {
        next.delete(aspectRatio)
      } else {
        next.add(aspectRatio)
      }
      return next
    })
  }, [])

  const handleExport = useCallback(async () => {
    const targets = PLATFORM_PRESETS.filter((p) => selectedTargets.has(p.aspectRatio))
    if (targets.length === 0) return

    setIsExporting(true)
    try {
      const results = await exportAllFormats(
        compositionProps,
        sourceAspectRatio,
        targets,
        { fps, durationInFrames, format, quality },
        setProgress,
      )
      downloadAllResults(results)
      onClose()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Batch export failed:', err)
      }
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }, [compositionProps, sourceAspectRatio, selectedTargets, fps, durationInFrames, format, quality, onClose])

  // Estimate file sizes
  const estimatedSizePerSecond = quality >= 0.8 ? 500_000 : quality >= 0.5 ? 300_000 : 150_000
  const durationSec = durationInFrames / fps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Multi-Platform Reframe Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Preview Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {previews.map(({ preset, reframed, isSource }) => {
              const selected = isSource || selectedTargets.has(preset.aspectRatio)
              // Scale preview to fit in grid cell
              const previewScale = 0.15
              const previewW = Math.round(preset.width * previewScale)
              const previewH = Math.round(preset.height * previewScale)
              const estimatedSize = formatFileSize(Math.round(durationSec * estimatedSizePerSecond * (preset.width * preset.height) / (1920 * 1080)))

              return (
                <button
                  key={preset.aspectRatio}
                  onClick={() => !isSource && toggleTarget(preset.aspectRatio)}
                  disabled={isSource}
                  className={cn(
                    'relative rounded-lg border-2 p-3 transition-all text-left',
                    isSource
                      ? 'border-emerald-500/50 bg-emerald-500/5 cursor-default'
                      : selected
                        ? 'border-blue-500 bg-blue-500/5 hover:bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20',
                  )}
                >
                  {/* Selection indicator */}
                  <div className="absolute top-2 right-2">
                    {(isSource || selected) && (
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center',
                        isSource ? 'bg-emerald-500' : 'bg-blue-500',
                      )}>
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mb-2">
                    <span className="text-xs font-medium text-white">
                      {PLATFORM_ICONS[preset.aspectRatio] || ''} {preset.label}
                    </span>
                    {isSource && (
                      <span className="ml-1.5 text-[10px] text-emerald-400 font-medium">Original</span>
                    )}
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {preset.width}x{preset.height} &middot; ~{estimatedSize}
                    </div>
                  </div>

                  {/* Mini preview */}
                  <div
                    className="mx-auto bg-black rounded overflow-hidden"
                    style={{ width: previewW, height: previewH }}
                  >
                    <CompositionPlayer
                      component={VideoComposition}
                      inputProps={{ ...reframed, width: preset.width, height: preset.height }}
                      durationInFrames={durationInFrames}
                      compositionWidth={preset.width}
                      compositionHeight={preset.height}
                      fps={fps}
                      style={{ width: previewW, height: previewH }}
                      controls={false}
                      autoPlay={false}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
          <span className="text-xs text-gray-400">
            {selectedTargets.size + 1} platform{selectedTargets.size > 0 ? 's' : ''} selected (incl. original)
          </span>
          <div className="flex items-center gap-2">
            {isExporting && progress && (
              <span className="text-xs text-blue-300">
                {progress.currentTarget.label} ({progress.currentIndex + 1}/{progress.totalTargets}) — {Math.round(progress.overallProgress)}%
              </span>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedTargets.size === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={12} />
                  Export All ({selectedTargets.size + 1})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
