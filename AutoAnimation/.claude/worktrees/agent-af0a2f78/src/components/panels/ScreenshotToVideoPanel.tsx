/**
 * ScreenshotToVideoPanel — UI for uploading screenshots and generating
 * narrated walkthrough videos.
 *
 * Workflow: Upload -> Analyze -> Review Script -> Generate Video
 */

import React, { useCallback, useRef } from 'react'
import { useScreenshotToVideoStore, type S2VPhase } from '@/stores/useScreenshotToVideoStore'
import {
  analyzeAllScreenshots,
  buildClipPlanFromScreenshots,
  fileToScreenshotAsset,
} from '@/services/screenshotToVideo'
import {
  Upload,
  Play,
  Trash2,
  GripVertical,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Monitor,
  X,
} from 'lucide-react'
import type { ScreenshotAsset } from '@/types/screenshotToVideo'

const PHASE_LABELS: Record<S2VPhase, string> = {
  upload: 'Upload Screenshots',
  analyzing: 'Analyzing...',
  review: 'Review & Edit',
  generating: 'Generating Video...',
  done: 'Complete',
  error: 'Error',
}

export function ScreenshotToVideoPanel() {
  const phase = useScreenshotToVideoStore((s) => s.phase)
  const error = useScreenshotToVideoStore((s) => s.error)
  const progress = useScreenshotToVideoStore((s) => s.progress)
  const screenshots = useScreenshotToVideoStore((s) => s.screenshots)
  const reset = useScreenshotToVideoStore((s) => s.reset)

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-purple-400" />
          <span className="font-medium">Screenshot to Video</span>
        </div>
        {screenshots.length > 0 && (
          <button
            onClick={reset}
            className="text-[10px] text-white/40 hover:text-white/60"
          >
            Reset
          </button>
        )}
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10">
        {(['upload', 'analyzing', 'review', 'generating', 'done'] as S2VPhase[]).map((p, i) => (
          <React.Fragment key={p}>
            <div
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                p === phase
                  ? 'bg-purple-600 text-white'
                  : phase === 'done' || getPhaseOrder(phase) > getPhaseOrder(p)
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-white/5 text-white/30'
              }`}
            >
              {PHASE_LABELS[p]}
            </div>
            {i < 4 && <ChevronRight size={10} className="text-white/20" />}
          </React.Fragment>
        ))}
      </div>

      {/* Progress bar */}
      {(phase === 'analyzing' || phase === 'generating') && (
        <div className="px-3 py-1">
          <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-3 mt-2 flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded text-xs">
          <AlertCircle size={14} />
          <span className="flex-1">{error}</span>
          <button onClick={() => useScreenshotToVideoStore.getState().setError(null)}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Phase content */}
      <div className="flex-1 overflow-y-auto">
        {phase === 'upload' && <UploadPhase />}
        {phase === 'analyzing' && <AnalyzingPhase />}
        {phase === 'review' && <ReviewPhase />}
        {phase === 'generating' && <GeneratingPhase />}
        {phase === 'done' && <DonePhase />}
      </div>
    </div>
  )
}

function getPhaseOrder(phase: S2VPhase): number {
  const order: Record<S2VPhase, number> = {
    upload: 0,
    analyzing: 1,
    review: 2,
    generating: 3,
    done: 4,
    error: -1,
  }
  return order[phase] ?? -1
}

// ── Upload Phase ──

function UploadPhase() {
  const screenshots = useScreenshotToVideoStore((s) => s.screenshots)
  const addScreenshot = useScreenshotToVideoStore((s) => s.addScreenshot)
  const removeScreenshot = useScreenshotToVideoStore((s) => s.removeScreenshot)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        try {
          const asset = await fileToScreenshotAsset(file)
          addScreenshot(asset)
        } catch (err) {
          console.warn('Failed to process screenshot:', err)
        }
      }
    },
    [addScreenshot]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  return (
    <div className="p-3 space-y-3">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-purple-400/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={24} className="mx-auto text-white/30 mb-2" />
        <div className="text-xs text-white/40">
          Drop screenshots here or click to browse
        </div>
        <div className="text-[10px] text-white/20 mt-1">
          PNG, JPG, WebP — multiple files supported
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Screenshot list */}
      {screenshots.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-white/40 uppercase tracking-wider">
            Screenshots ({screenshots.length})
          </div>
          {screenshots.map((ss, i) => (
            <ScreenshotItem
              key={ss.id}
              screenshot={ss}
              index={i}
              onRemove={() => removeScreenshot(ss.id)}
            />
          ))}
        </div>
      )}

      {/* Analyze button */}
      {screenshots.length > 0 && (
        <button
          onClick={analyzeAllScreenshots}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 rounded-lg text-white font-medium hover:bg-purple-500"
        >
          <Play size={14} />
          Analyze {screenshots.length} Screenshot{screenshots.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}

function ScreenshotItem({
  screenshot,
  index,
  onRemove,
}: {
  screenshot: ScreenshotAsset
  index: number
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded hover:bg-white/8">
      <GripVertical size={12} className="text-white/20 cursor-grab" />
      <img
        src={screenshot.url}
        alt={screenshot.name}
        className="w-12 h-8 object-cover rounded border border-white/10"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs truncate">{screenshot.name}</div>
        <div className="text-[10px] text-white/30">
          {screenshot.width} x {screenshot.height}
        </div>
      </div>
      <span className="text-[10px] text-white/30">#{index + 1}</span>
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-white/10 rounded text-white/30 hover:text-red-400"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

// ── Analyzing Phase ──

function AnalyzingPhase() {
  const screenshots = useScreenshotToVideoStore((s) => s.screenshots)
  const analyses = useScreenshotToVideoStore((s) => s.analyses)

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-center gap-2 py-4">
        <Loader2 size={20} className="animate-spin text-purple-400" />
        <span className="text-white/60">Analyzing screenshots with AI...</span>
      </div>
      {screenshots.map((ss) => (
        <div key={ss.id} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded">
          <img
            src={ss.url}
            alt={ss.name}
            className="w-8 h-6 object-cover rounded"
          />
          <span className="flex-1 text-xs truncate">{ss.name}</span>
          {analyses[ss.id] ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Loader2 size={14} className="animate-spin text-white/30" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Review Phase ──

function ReviewPhase() {
  const screenshots = useScreenshotToVideoStore((s) => s.screenshots)
  const analyses = useScreenshotToVideoStore((s) => s.analyses)
  const fullScript = useScreenshotToVideoStore((s) => s.fullScript)
  const setFullScript = useScreenshotToVideoStore((s) => s.setFullScript)
  const config = useScreenshotToVideoStore((s) => s.config)
  const updateConfig = useScreenshotToVideoStore((s) => s.updateConfig)

  const handleGenerate = useCallback(() => {
    const plan = buildClipPlanFromScreenshots()
    // Store the plan for the orchestrator to execute
    useScreenshotToVideoStore.getState().setPhase('done')
    // Plan is returned but needs to be passed to orchestrator externally
    console.log('[S2V] Generated ClipPlan:', plan)
  }, [])

  return (
    <div className="p-3 space-y-3">
      {/* Narration script */}
      <div>
        <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">
          Narration Script
        </label>
        <textarea
          value={fullScript}
          onChange={(e) => setFullScript(e.target.value)}
          className="w-full h-32 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:border-purple-500"
          placeholder="AI-generated narration script..."
        />
      </div>

      {/* Config */}
      <div className="space-y-2">
        <label className="text-[10px] text-white/40 uppercase tracking-wider block">
          Settings
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 w-20">Style</span>
          <select
            value={config.narrationStyle}
            onChange={(e) => updateConfig({ narrationStyle: e.target.value as typeof config.narrationStyle })}
            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="tutorial">Tutorial</option>
            <option value="energetic">Energetic</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 w-20">Aspect</span>
          <select
            value={config.aspectRatio}
            onChange={(e) => updateConfig({ aspectRatio: e.target.value as typeof config.aspectRatio })}
            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
          >
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Portrait</option>
            <option value="1:1">1:1 Square</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showHighlights}
            onChange={(e) => updateConfig({ showHighlights: e.target.checked })}
            className="rounded"
          />
          Show highlight boxes
        </label>

        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showPointer}
            onChange={(e) => updateConfig({ showPointer: e.target.checked })}
            className="rounded"
          />
          Show animated pointer
        </label>
      </div>

      {/* Per-screenshot review */}
      <div className="space-y-2">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">
          Per-Screenshot Analysis
        </span>
        {screenshots.map((ss) => {
          const analysis = analyses[ss.id]
          if (!analysis) return null
          return (
            <div key={ss.id} className="bg-white/5 rounded p-2 space-y-1">
              <div className="flex items-center gap-2">
                <img src={ss.url} alt={ss.name} className="w-16 h-10 object-cover rounded" />
                <div className="flex-1">
                  <div className="text-xs font-medium">{ss.name}</div>
                  <div className="text-[10px] text-white/40">{analysis.contentType}</div>
                </div>
              </div>
              <div className="text-[10px] text-white/50">{analysis.description}</div>
              <div className="text-[10px] text-white/30">
                {analysis.annotations.length} annotations | {analysis.suggestedDuration}s
              </div>
            </div>
          )
        })}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 rounded-lg text-white font-medium hover:bg-purple-500"
      >
        <Play size={14} />
        Generate Video
      </button>
    </div>
  )
}

// ── Generating Phase ──

function GeneratingPhase() {
  const progress = useScreenshotToVideoStore((s) => s.progress)
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <Loader2 size={24} className="animate-spin text-purple-400" />
      <span className="text-white/60 text-xs">Generating video... {progress}%</span>
    </div>
  )
}

// ── Done Phase ──

function DonePhase() {
  const reset = useScreenshotToVideoStore((s) => s.reset)
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <Check size={24} className="text-green-400" />
      <span className="text-white/60 text-xs">Video plan generated successfully!</span>
      <span className="text-[10px] text-white/30">
        Use the AI Director to execute the plan.
      </span>
      <button
        onClick={reset}
        className="px-4 py-1.5 bg-white/10 rounded text-xs hover:bg-white/20"
      >
        Start Over
      </button>
    </div>
  )
}

export default ScreenshotToVideoPanel
