/**
 * Motion Transfer Panel
 *
 * UI for extracting poses from a reference video and retargeting them
 * to character rigs. Upload a video, extract poses, preview, and apply.
 */

import React, { useCallback, useRef } from 'react'
import {
  Upload, Play, Square, Loader2, Check, RefreshCw,
  Film, ArrowRight, AlertTriangle,
} from 'lucide-react'
import { useMotionTransferStore } from '@/stores/useMotionTransferStore'
import { extractPosesFromVideo, applyMotionToRig } from '@/services/motionTransferService'
import { PanelSlider, PanelButtonGroup, PanelSection } from '@/components/ui/panel-controls'

export function MotionTransferPanel() {
  const {
    settings,
    status,
    progress,
    result,
    sourceFileName,
    sourceDuration,
    previewUrl,
    targetRigType,
    targetRigId,
    error,
    updateSettings,
    setProgress,
    setResult,
    setSourceFile,
    setAbortController,
    setTargetRig,
    setError,
    cancelExtraction,
    reset,
  } = useMotionTransferStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate it's a video file
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    const previewUrl = URL.createObjectURL(file)

    // Get video duration
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      setSourceFile(file.name, video.duration, previewUrl)
      video.src = ''
    }
    video.onerror = () => {
      setError('Failed to load video')
      URL.revokeObjectURL(previewUrl)
    }
    video.src = previewUrl

    // Store file reference for later extraction
    ;((window as unknown) as Record<string, unknown>).__motionTransferFile = file
  }, [setSourceFile, setError])

  const handleExtract = useCallback(async () => {
    const file = ((window as unknown) as Record<string, unknown>).__motionTransferFile as File | undefined
    if (!file) {
      setError('No video file loaded')
      return
    }

    const controller = new AbortController()
    setAbortController(controller)
    setError(null)

    try {
      const extractResult = await extractPosesFromVideo(
        file,
        settings,
        (p) => setProgress(p),
        controller.signal,
      )
      setResult(extractResult)
    } catch (err) {
      if ((err as Error).message !== 'Motion transfer cancelled') {
        setError(err instanceof Error ? err.message : 'Extraction failed')
      }
    } finally {
      setAbortController(null)
    }
  }, [settings, setProgress, setResult, setAbortController, setError])

  const handleApplyToRig = useCallback(() => {
    if (!result) return

    setError(null)
    setProgress({
      status: 'writing-keyframes',
      currentFrame: 0,
      totalFrames: result.totalFrames,
      percentage: 0,
    })

    try {
      applyMotionToRig(
        result,
        targetRigType,
        targetRigId || 'primary',
        settings,
        undefined,
        (p) => setProgress(p),
      )

      setProgress({
        status: 'complete',
        currentFrame: result.totalFrames,
        totalFrames: result.totalFrames,
        percentage: 100,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply motion to rig')
    }
  }, [result, targetRigType, targetRigId, settings, setError, setProgress])

  const isExtracting = status === 'extracting' || status === 'loading-video' || status === 'smoothing'
  const isWritingKeyframes = status === 'writing-keyframes'

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Film className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-medium text-white">Motion Transfer</h3>
      </div>

      <p className="text-xs text-zinc-400">
        Upload a reference video and extract body movements to drive character animations.
        Uses MediaPipe Pose for 33-landmark body tracking.
      </p>

      {/* File Upload */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!sourceFileName ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-700 rounded-lg hover:border-zinc-600 text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-xs">Upload Reference Video</span>
          </button>
        ) : (
          <div className="space-y-2">
            {/* Video preview */}
            {previewUrl && (
              <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain"
                  muted
                />
              </div>
            )}

            {/* File info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate flex-1">{sourceFileName}</span>
              <span className="text-zinc-500 ml-2">
                {sourceDuration ? `${sourceDuration.toFixed(1)}s` : ''}
              </span>
              <button
                onClick={() => {
                  reset()
                  delete ((window as unknown) as Record<string, unknown>).__motionTransferFile
                }}
                className="ml-2 text-zinc-500 hover:text-zinc-400"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      {sourceFileName && (
        <PanelSection title="Extraction Settings">
          <PanelSlider
            label="FPS"
            value={settings.extractionFps}
            onChange={(v) => updateSettings({ extractionFps: Math.round(v) })}
            min={10}
            max={60}
            step={1}
            compact
          />

          <PanelSlider
            label="Smoothing"
            value={settings.smoothing}
            onChange={(v) => updateSettings({ smoothing: v })}
            min={0}
            max={0.8}
            step={0.01}
            precision={2}
            compact
          />

          <PanelButtonGroup
            label="Target Rig"
            options={[
              { value: '2d', label: '2D Rig' },
              { value: '3d', label: '3D Rig' },
            ]}
            value={targetRigType}
            onChange={(v) => setTargetRig(v as '2d' | '3d', targetRigId)}
          />
        </PanelSection>
      )}

      {/* Extract / Cancel buttons */}
      {sourceFileName && (
        <div className="flex gap-2">
          {!isExtracting ? (
            <button
              onClick={handleExtract}
              disabled={!!result}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded disabled:opacity-50 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Extract Poses
            </button>
          ) : (
            <button
              onClick={cancelExtraction}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {isExtracting && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>
              {progress.status === 'loading-video' && 'Loading video...'}
              {progress.status === 'extracting' && `Extracting frame ${progress.currentFrame}/${progress.totalFrames}`}
              {progress.status === 'smoothing' && 'Smoothing poses...'}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="border border-green-800/40 bg-green-950/20 rounded-lg p-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Check className="w-3.5 h-3.5" />
            <span className="font-medium">Extraction Complete</span>
          </div>
          <div className="text-[10px] text-zinc-500 space-y-0.5">
            <p>Frames: {result.totalFrames}</p>
            <p>Duration: {result.sourceDuration.toFixed(1)}s</p>
            <p>FPS: {result.sourceFps}</p>
          </div>
          <button
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded mt-2 transition-colors disabled:opacity-50"
            onClick={handleApplyToRig}
            disabled={isWritingKeyframes}
          >
            {isWritingKeyframes ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ArrowRight className="w-3 h-3" />
            )}
            {isWritingKeyframes ? 'Applying...' : `Apply to ${targetRigType.toUpperCase()} Rig`}
          </button>

          {isWritingKeyframes && (
            <div className="space-y-1 mt-1">
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                Writing keyframe {progress.currentFrame}/{progress.totalFrames}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-950/30 rounded px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
