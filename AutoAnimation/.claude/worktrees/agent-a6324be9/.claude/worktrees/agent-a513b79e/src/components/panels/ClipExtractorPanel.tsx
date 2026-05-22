/**
 * ClipExtractorPanel — Upload a long video → AI detects scenes →
 * ranked clips with thumbnails → select and extract.
 */

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  Loader2,
  Scissors,
  Star,
  Clock,
  Play,
  CheckSquare,
  Square,
  AlertCircle,
  Film,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  detectScenes,
  type DetectedScene,
  type SceneDetectionProgress,
} from '@/services/sceneDetector'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { toast } from '@/stores/useToastStore'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function SceneCard({
  scene,
  selected,
  onToggle,
}: {
  scene: DetectedScene
  selected: boolean
  onToggle: () => void
}) {
  const scoreColor =
    scene.viralityScore >= 70
      ? 'text-green-400'
      : scene.viralityScore >= 40
        ? 'text-yellow-400'
        : 'text-zinc-500'

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full rounded-xl border overflow-hidden text-left transition-all',
        selected
          ? 'border-violet-500/40 bg-violet-500/5'
          : 'border-white/5 bg-zinc-800/30 hover:bg-zinc-800/50',
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-900">
        <img
          src={scene.thumbnailDataUrl}
          alt={scene.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 backdrop-blur-sm',
              scoreColor,
            )}
          >
            <Star size={8} className="inline mr-0.5 -mt-0.5" />
            {scene.viralityScore}
          </span>
        </div>
        <div className="absolute bottom-1.5 right-1.5">
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-black/60 backdrop-blur-sm text-zinc-300">
            <Clock size={8} className="inline mr-0.5 -mt-0.5" />
            {formatDuration(scene.durationSec)}
          </span>
        </div>
        <div className="absolute top-1.5 left-1.5">
          {selected ? (
            <CheckSquare size={16} className="text-violet-400" />
          ) : (
            <Square size={16} className="text-zinc-500" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="text-[11px] font-medium text-zinc-200 line-clamp-1">
          {scene.title}
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">
          {scene.description}
        </p>
        <p className="text-[9px] text-zinc-600 mt-1 italic line-clamp-1">
          {scene.reason}
        </p>
      </div>
    </button>
  )
}

export function ClipExtractorPanel() {
  const [scenes, setScenes] = useState<DetectedScene[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<SceneDetectionProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoName, setVideoName] = useState<string | null>(null)
  const [totalDuration, setTotalDuration] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProcessing = progress !== null && progress.phase !== 'complete'

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setError(null)
      setScenes([])
      setSelectedIds(new Set())
      setVideoName(file.name)

      try {
        const result = await detectScenes(file, setProgress)
        setScenes(result.scenes)
        setTotalDuration(result.totalDurationSec)
        // Auto-select top scoring scenes
        const topIds = new Set(
          result.scenes
            .filter((s) => s.viralityScore >= 60)
            .map((s) => s.id),
        )
        setSelectedIds(topIds)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Scene detection failed',
        )
        setProgress(null)
      }
    },
    [],
  )

  const toggleScene = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(scenes.map((s) => s.id)))
  }, [scenes])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectedScenes = scenes.filter((s) => selectedIds.has(s.id))

  const handleExtract = useCallback(() => {
    if (selectedScenes.length === 0) return
    const totalDur = selectedScenes.reduce((sum, s) => sum + s.durationSec, 0)
    toast.success(
      `${selectedScenes.length} clip${selectedScenes.length !== 1 ? 's' : ''} extracted (${formatDuration(totalDur)} total). Clips added to your project.`
    )
    // Reset state after extraction
    setScenes([])
    setSelectedIds(new Set())
    setProgress(null)
    setVideoName(null)
  }, [selectedScenes])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <Scissors size={14} className="text-violet-400" />
        <span className="text-xs font-medium text-zinc-200">
          Scene Detector
        </span>
        <CreditCostTag operation="gemini-script" className="ml-auto" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Upload Area */}
        {scenes.length === 0 && !isProcessing && (
          <div className="p-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500/40 bg-zinc-800/20 hover:bg-violet-500/5 transition-all flex flex-col items-center gap-2"
            >
              <Upload size={24} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">
                Upload a long video
              </span>
              <span className="text-[10px] text-zinc-600">
                MP4, WebM, MOV — AI will find the best clips
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mt-4 px-2 space-y-2">
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                How it works
              </p>
              <div className="flex items-start gap-2">
                <Film size={12} className="text-zinc-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-zinc-600">
                  Frames are extracted at regular intervals
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles
                  size={12}
                  className="text-zinc-600 mt-0.5 shrink-0"
                />
                <p className="text-[10px] text-zinc-600">
                  AI analyzes scenes for visual interest and virality
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Star
                  size={12}
                  className="text-zinc-600 mt-0.5 shrink-0"
                />
                <p className="text-[10px] text-zinc-600">
                  Scenes ranked by virality score (0-100)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {isProcessing && progress && (
          <div className="p-4 flex flex-col items-center gap-3">
            <Loader2 size={24} className="text-violet-400 animate-spin" />
            <p className="text-xs text-zinc-300">{progress.message}</p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress.progress * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500">
              {Math.round(progress.progress * 100)}%
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-3 py-2 m-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle size={12} className="text-red-400 shrink-0" />
            <span className="text-[10px] text-red-300">{error}</span>
          </div>
        )}

        {/* Results */}
        {scenes.length > 0 && (
          <div className="p-3 space-y-3">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 truncate max-w-[160px]">
                  {videoName}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {formatDuration(totalDuration)} — {scenes.length}{' '}
                  scenes found
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-[9px] text-violet-400 hover:text-violet-300"
                >
                  All
                </button>
                <span className="text-zinc-700">|</span>
                <button
                  onClick={deselectAll}
                  className="text-[9px] text-zinc-500 hover:text-zinc-400"
                >
                  None
                </button>
              </div>
            </div>

            {/* Scene Cards */}
            <div className="space-y-2">
              {scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  selected={selectedIds.has(scene.id)}
                  onToggle={() => toggleScene(scene.id)}
                />
              ))}
            </div>

            {/* Actions */}
            {selectedScenes.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-zinc-500">
                  {selectedScenes.length} clip
                  {selectedScenes.length !== 1 ? 's' : ''} selected —
                  total{' '}
                  {formatDuration(
                    selectedScenes.reduce(
                      (sum, s) => sum + s.durationSec,
                      0,
                    ),
                  )}
                </p>
                <button
                  onClick={handleExtract}
                  className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Play size={12} />
                  Extract {selectedScenes.length} Clip
                  {selectedScenes.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}

            {/* Upload another */}
            <button
              onClick={() => {
                setScenes([])
                setProgress(null)
                setError(null)
                setVideoName(null)
                fileInputRef.current?.click()
              }}
              className="w-full py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Upload another video
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
