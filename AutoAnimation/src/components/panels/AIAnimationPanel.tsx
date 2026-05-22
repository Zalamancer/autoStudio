import { useCallback, useState } from 'react'
import {
  Wand2,
  Download,
  Plus,
  AlertCircle,
  Clock,
  Film,
  RotateCcw,
  Bookmark,
  Layers,
  Palette,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { useAIAnimationStore } from '@/stores/useAIAnimationStore'
import { useEditorStore } from '@/stores'
import { useTimelineStore } from '@/stores'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useMarketplaceStore } from '@/stores/useMarketplaceStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { getDownloadUrl } from '@/services/aiAnimation'
import { saveMediaBlob } from '@/services/mediaDB'
import { generateSVGObjects } from '@/services/svgObjectAnimation'
import type { RightPanelTab } from '@/types'

const FPS_OPTIONS = [24, 30, 60]

const RESOLUTION_OPTIONS = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: '480p', width: 854, height: 480 },
]

export function AIAnimationPanel() {
  const {
    prompt,
    fps,
    durationSeconds,
    width,
    height,
    phase,
    progress,
    message,
    videoUrl,
    error,
    isGenerating,
    generations,
    setPrompt,
    setFps,
    setDurationSeconds,
    setWidth,
    setHeight,
    startGeneration,
    reset,
    activeJobId,
  } = useAIAnimationStore()

  const addClip = useTimelineStore((s) => s.addClip)
  const timelineFps = useTimelineStore((s) => s.fps)
  const addVideo = useVideoLayerStore((s) => s.addVideo)
  const addMarketplaceItem = useMarketplaceStore((s) => s.addItem)

  // SVG object (editable) generation
  const svgObjectComposition = useSVGObjectStore((s) => s.composition)
  const isSVGGenerating = useSVGObjectStore((s) => s.isGenerating)
  const svgObjectError = useSVGObjectStore((s) => s.error)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const currentRes = RESOLUTION_OPTIONS.find((r) => r.width === width && r.height === height) || RESOLUTION_OPTIONS[0]

  const handleGenerate = useCallback(async () => {
    await startGeneration()
  }, [startGeneration])

  const handleDownload = useCallback(() => {
    if (!activeJobId) return
    const url = getDownloadUrl(activeJobId) + '?download=true'
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-animation-${activeJobId}.mp4`
    a.click()
  }, [activeJobId])

  const handleImportToTimeline = useCallback(() => {
    if (!activeJobId || !videoUrl) return

    const totalFrames = Math.round(durationSeconds * timelineFps)

    // Add clip to timeline
    addClip('video-1', {
      id: `ai-anim-${activeJobId}`,
      trackId: 'video-1',
      startFrame: 0,
      endFrame: totalFrames,
      sourceId: videoUrl,
      sourceInPoint: 0,
      sourceOutPoint: totalFrames,
      name: `AI Animation`,
      color: '#8b5cf6',
    })

    // Also add to canvas video layer so it renders
    addVideo({
      id: `canvas-video-${activeJobId}`,
      sourceUrl: videoUrl,
      name: 'AI Animation',
      prompt,
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 3,
      visible: true,
      loop: false,
      durationSeconds,
      fps,
      width,
      height,
    })
  }, [activeJobId, videoUrl, durationSeconds, timelineFps, addClip, addVideo, prompt, fps, width, height])

  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false)

  const handleSaveToMarketplace = useCallback(async () => {
    if (!activeJobId || !videoUrl) return

    const itemId = `marketplace-ai-${activeJobId}`

    try {
      setIsSavingToLibrary(true)

      // Fetch the video blob from the (temporary) server URL
      const response = await fetch(videoUrl)
      if (!response.ok) throw new Error('Failed to fetch video')
      const blob = await response.blob()

      // Persist blob to IndexedDB so it survives page reload
      await saveMediaBlob(itemId, blob)

      // Create a blob URL for immediate use
      const blobUrl = URL.createObjectURL(blob)

      addMarketplaceItem({
        id: itemId,
        title: prompt.slice(0, 50) || 'AI Animation',
        description: `${durationSeconds}s at ${fps}fps - ${width}x${height}`,
        category: 'ai-animations',
        videoUrl: blobUrl,
        prompt,
        durationSeconds,
        fps,
        width,
        height,
        createdAt: Date.now(),
      })
    } catch (err) {
      console.error('Failed to save to library:', err)
    } finally {
      setIsSavingToLibrary(false)
    }
  }, [activeJobId, videoUrl, prompt, durationSeconds, fps, width, height, addMarketplaceItem])

  const handleResolutionChange = useCallback(
    (resLabel: string) => {
      const res = RESOLUTION_OPTIONS.find((r) => r.label === resLabel)
      if (res) {
        setWidth(res.width)
        setHeight(res.height)
      }
    },
    [setWidth, setHeight],
  )

  const handleGenerateEditable = useCallback(async () => {
    if (!prompt.trim() || isSVGGenerating) return

    const store = useSVGObjectStore.getState()
    store.setGenerating(true)
    store.setError(null)

    // SVG keyframes are 0-1 normalized — they stretch to fill whatever
    // timeline duration is set. We use the timeline's total frames for
    // the default start/end range of each object.
    const { totalFrames: timelineTotalFrames } = useTimelineStore.getState()

    try {
      const response = await generateSVGObjects({
        prompt,
        width,
        height,
      })

      // Build composition from server response (declarative keyframe format)
      const composition = {
        id: `svg-comp-${Date.now()}`,
        prompt,
        background: response.background,
        width: response.width,
        height: response.height,
        objects: response.objects.map((obj, i) => ({
          id: `svg-obj-${Date.now()}-${i}`,
          name: obj.name,
          zIndex: obj.zIndex,
          visible: true,
          colors: { ...obj.defaultColors },
          defaultColors: obj.defaultColors,
          svgMarkup: obj.svgMarkup,
          keyframes: obj.keyframes || [{ time: 0 }],
          startFrame: 0,
          endFrame: timelineTotalFrames,
          opacity: 1,
        })),
      }

      store.setComposition(composition)
      store.setGenerating(false)

      // Auto-switch right panel to SVG object properties
      setRightPanelTab('svg-object-properties' as RightPanelTab)
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to generate editable SVG')
      store.setGenerating(false)
    }
  }, [prompt, width, height, isSVGGenerating, setRightPanelTab])

  const [showMp4Settings, setShowMp4Settings] = useState(false)

  const generateFooter = (
    <button
      onClick={handleGenerateEditable}
      disabled={isGenerating || isSVGGenerating || !prompt.trim()}
      className={cn(
        'w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
        isGenerating || isSVGGenerating || !prompt.trim()
          ? 'bg-panel-surface-hover text-gray-400 cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white',
      )}
    >
      {isSVGGenerating ? (
        <>
          <LoadingSpinner size={16} />
          Generating...
        </>
      ) : (
        <>
          <Layers size={16} />
          Generate Editable
          <CreditCostTag operation="ai-video" />
        </>
      )}
    </button>
  )

  return (
    <PanelLayout icon={Wand2} title="AI Animation" iconClassName="text-accent" footer={generateFooter}>
      {/* Prompt */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Describe your animation</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A sunrise over mountains with clouds drifting by..."
          className="w-full h-24 bg-panel-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-accent"
          disabled={isGenerating || isSVGGenerating}
        />
      </div>

      <p className="text-[10px] text-gray-500">
        Creates scalable SVG objects with editable colors and keyframe animation. Adapts to any resolution or timeline
        duration.
      </p>

      {/* SVG Object Generation - Loading */}
      {isSVGGenerating && (
        <div className="bg-panel-bg rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <LoadingSpinner size={14} />
            <span className="text-xs text-gray-300">Generating editable objects...</span>
          </div>
          <p className="text-xs text-gray-500">
            Claude is decomposing your animation into individual objects with editable colors.
          </p>
        </div>
      )}

      {/* SVG Object Error */}
      {svgObjectError && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-red-300">{svgObjectError}</p>
            <button
              onClick={() => useSVGObjectStore.getState().setError(null)}
              className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* SVG Object Composition Ready */}
      {svgObjectComposition && !isSVGGenerating && (
        <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-emerald-400" />
            <h4 className="text-xs font-medium text-emerald-300">Editable Composition</h4>
          </div>

          {/* Object List */}
          <div className="space-y-1">
            {svgObjectComposition.objects.map((obj) => (
              <button
                key={obj.id}
                onClick={() => {
                  useSVGObjectStore.getState().selectObject(obj.id)
                  setRightPanelTab('svg-object-properties' as RightPanelTab)
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-panel-bg/50 hover:bg-panel-surface transition-colors text-left"
              >
                <Palette size={10} className="text-emerald-400/70 flex-shrink-0" />
                <span className="text-xs text-gray-300 truncate">{obj.name}</span>
                <span className="text-[10px] text-gray-600 ml-auto">{Object.keys(obj.colors).length} colors</span>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-gray-500">
            {svgObjectComposition.objects.length} objects &middot; Click to edit colors in the right panel
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* MP4 Export — collapsible section */}
      <button
        onClick={() => setShowMp4Settings(!showMp4Settings)}
        className="w-full flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors"
      >
        {showMp4Settings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Film size={14} />
        MP4 Export (Server Rendered)
      </button>

      {showMp4Settings && (
        <div className="space-y-3 pl-1">
          {/* Settings */}
          <div className="grid grid-cols-3 gap-2">
            {/* Duration */}
            <div>
              <PanelSlider
                label="Duration"
                value={durationSeconds}
                onChange={(v) => setDurationSeconds(v)}
                min={5}
                max={60}
                step={5}
                suffix="s"
                compact
              />
            </div>

            {/* FPS */}
            <PanelSelect
              label="FPS"
              value={String(fps)}
              onChange={(v) => setFps(Number(v))}
              options={FPS_OPTIONS.map((f) => ({ value: String(f), label: `${f} fps` }))}
              fullWidth
            />

            {/* Resolution */}
            <PanelSelect
              label="Resolution"
              value={currentRes.label}
              onChange={handleResolutionChange}
              options={RESOLUTION_OPTIONS.map((r) => ({ value: r.label, label: r.label }))}
              fullWidth
            />
          </div>

          {/* Frame count info */}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Film size={12} />
            {fps * durationSeconds} total frames ({durationSeconds}s at {fps}fps)
          </div>

          {/* Generate MP4 button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isSVGGenerating || !prompt.trim()}
            className={cn(
              'w-full py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              isGenerating || isSVGGenerating || !prompt.trim()
                ? 'bg-panel-surface-hover text-gray-400 cursor-not-allowed'
                : 'bg-accent hover:bg-[#5a8aff] text-white',
            )}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size={14} />
                Generating...
              </>
            ) : (
              <>
                <Film size={14} />
                Generate MP4
              </>
            )}
          </button>

          {/* Progress */}
          {isGenerating && phase && (
            <div className="bg-panel-bg rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300 capitalize">{phase}</span>
                <span className="text-xs text-gray-400">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-panel-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{message}</p>
            </div>
          )}

          {/* MP4 Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-red-300">{error}</p>
                <button
                  onClick={reset}
                  className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {videoUrl && !isGenerating && (
            <div className="bg-panel-bg rounded-lg p-3 space-y-3">
              <h4 className="text-xs font-medium text-gray-300">Animation Ready</h4>

              {/* Video Preview */}
              <video src={videoUrl} controls loop className="w-full rounded border border-panel-border" />

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  className="py-2 rounded bg-panel-surface-hover hover:bg-panel-surface-hover text-xs text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={handleImportToTimeline}
                  className="py-2 rounded bg-accent hover:bg-[#5a8aff] text-xs text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  To Timeline
                </button>
              </div>
              <button
                onClick={handleSaveToMarketplace}
                disabled={isSavingToLibrary}
                className={cn(
                  'w-full py-2 rounded text-xs text-white flex items-center justify-center gap-1.5 transition-colors',
                  isSavingToLibrary ? 'bg-amber-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500',
                )}
              >
                {isSavingToLibrary ? (
                  <>
                    <LoadingSpinner size={14} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Bookmark size={14} />
                    Save to Library
                  </>
                )}
              </button>
            </div>
          )}

          {/* History */}
          {generations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                <Clock size={12} />
                Recent Generations
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {generations.map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => {
                      window.open(gen.downloadUrl + '?download=true', '_blank')
                    }}
                    className="w-full text-left bg-panel-bg hover:bg-panel-surface rounded p-2 transition-colors"
                  >
                    <p className="text-xs text-gray-300 truncate">{gen.prompt}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {gen.durationSeconds}s @ {gen.fps}fps &middot; {new Date(gen.createdAt).toLocaleTimeString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  )
}
