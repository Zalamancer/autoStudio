/**
 * BeatSyncSection — collapsible beat sync controls for media/text/shape panels.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Activity, ChevronDown, ChevronRight, Loader2, X, Zap } from 'lucide-react'
import { useEditorStore, useTimelineStore } from '@/stores'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useShallow } from 'zustand/react/shallow'
import { PanelSlider } from '@/components/ui/panel-controls'
import type { BeatSyncEffect, KeyframableObjectType } from '@/types/keyframes'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Beat Sync Section — collapsible accordion shown in non-character property panels
// ---------------------------------------------------------------------------

const BEAT_EFFECTS: { value: BeatSyncEffect; label: string }[] = [
  { value: 'scale-pulse', label: 'Scale' },
  { value: 'opacity-flash', label: 'Opacity' },
  { value: 'bounce', label: 'Bounce' },
]

const BEAT_SUBDIVISIONS: { value: 1 | 2 | 4; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
]

export function BeatSyncSection() {
  const [open, setOpen] = useState(false)

  const { analysis, isAnalyzing, error, analyzeAudio, objectConfigs, applyObjectBeatSync, clearObjectBeatSync } =
    useBeatSyncStore(
      useShallow((s) => ({
        analysis: s.analysis,
        isAnalyzing: s.isAnalyzing,
        error: s.error,
        analyzeAudio: s.analyzeAudio,
        objectConfigs: s.objectConfigs,
        applyObjectBeatSync: s.applyObjectBeatSync,
        clearObjectBeatSync: s.clearObjectBeatSync,
      })),
    )

  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)
  const playbackFps = usePlaybackStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  // Resolve selected object from the relevant store based on current rightPanelTab
  const textSelectedId = useTextOverlayStore((s) => s.selectedId)
  const textOverlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const shapeSelectedId = useShapeStore((s) => s.selectedShapeId)
  const shapes = useShapeStore((s) => s.shapes)
  const mediaSelectedId = useMediaStore((s) => s.selectedCanvasItemId)
  const mediaCanvasItems = useMediaStore((s) => s.canvasItems)
  const videoSelectedId = useVideoLayerStore((s) => s.selectedVideoId)

  const resolvedSelection = useMemo((): {
    objectId: string
    objectType: KeyframableObjectType
    startFrame: number
    endFrame: number
  } | null => {
    if (
      (rightPanelTab === 'text-properties' || rightPanelTab === 'text-styles' || rightPanelTab === 'text-animations') &&
      textSelectedId
    ) {
      if (textOverlay)
        return {
          objectId: textSelectedId,
          objectType: 'text',
          startFrame: textOverlay.startFrame ?? 0,
          endFrame: textOverlay.endFrame ?? totalFrames,
        }
    }
    if (rightPanelTab === 'shape-properties' && shapeSelectedId) {
      const shape = shapes.find((s) => s.id === shapeSelectedId)
      if (shape)
        return {
          objectId: shapeSelectedId,
          objectType: 'shape',
          startFrame: shape.startFrame ?? 0,
          endFrame: shape.endFrame ?? totalFrames,
        }
    }
    if (rightPanelTab === 'media-properties' && mediaSelectedId) {
      const item = mediaCanvasItems.find((m) => m.id === mediaSelectedId)
      if (item)
        return {
          objectId: mediaSelectedId,
          objectType: 'media',
          startFrame: item.startFrame ?? 0,
          endFrame: item.endFrame ?? totalFrames,
        }
    }
    if (rightPanelTab === 'video-properties' && videoSelectedId) {
      return { objectId: videoSelectedId, objectType: 'video', startFrame: 0, endFrame: totalFrames }
    }
    return null
  }, [
    rightPanelTab,
    textSelectedId,
    shapeSelectedId,
    mediaSelectedId,
    videoSelectedId,
    textOverlay,
    shapes,
    mediaCanvasItems,
    totalFrames,
  ])

  // Per-object config state
  const existingConfigKey = resolvedSelection ? `${resolvedSelection.objectType}:${resolvedSelection.objectId}` : null
  const existingConfig = existingConfigKey ? objectConfigs[existingConfigKey] : undefined

  const [effect, setEffect] = useState<BeatSyncEffect>(existingConfig?.effect ?? 'scale-pulse')
  const [subdivision, setSubdivision] = useState<1 | 2 | 4>(existingConfig?.subdivision ?? 1)
  const [intensity, setIntensity] = useState(existingConfig?.intensity ?? 0.75)

  useEffect(() => {
    setEffect(existingConfig?.effect ?? 'scale-pulse')
    setSubdivision(existingConfig?.subdivision ?? 1)
    setIntensity(existingConfig?.intensity ?? 0.75)
  }, [existingConfigKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Find first audio asset for quick analyze
  const audioAssets = useMediaStore(
    useShallow((s) => s.assets.filter((a) => a.category === 'audio' || (a.type && a.type.startsWith('audio/')))),
  )

  const handleAnalyze = async () => {
    const first = audioAssets[0]
    if (first) await analyzeAudio(first.url)
  }

  return (
    <div className="mx-4 mb-3 border border-white/5 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-panel-surface hover:bg-panel-surface-hover transition-colors"
      >
        {open ? (
          <ChevronDown size={12} className="text-zinc-500" />
        ) : (
          <ChevronRight size={12} className="text-zinc-500" />
        )}
        <Activity size={12} className="text-accent" />
        <span className="text-xs text-zinc-300 font-medium">Beat Sync</span>
        {analysis && (
          <span className="ml-auto text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
            {analysis.bpm} BPM
          </span>
        )}
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-panel-bg">
          {/* Not analyzed yet */}
          {!analysis && !isAnalyzing && (
            <div className="text-center space-y-2">
              <p className="text-[10px] text-zinc-500">Analyze audio first</p>
              <button
                onClick={handleAnalyze}
                disabled={audioAssets.length === 0}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  audioAssets.length > 0
                    ? 'bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30'
                    : 'bg-panel-surface text-zinc-600 cursor-not-allowed border border-white/5',
                )}
              >
                {audioAssets.length > 0 ? 'Analyze' : 'No audio found'}
              </button>
            </div>
          )}

          {/* Analyzing */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={12} className="animate-spin text-accent" />
              <span className="text-[11px] text-zinc-400">Analyzing...</span>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}

          {/* Analyzed — show controls */}
          {analysis && !isAnalyzing && (
            <>
              {!resolvedSelection ? (
                <p className="text-[10px] text-zinc-500 text-center">Select an object to sync</p>
              ) : (
                <div className="space-y-2.5">
                  {/* Effect pills */}
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Effect</span>
                    <div className="flex gap-1">
                      {BEAT_EFFECTS.map((e) => (
                        <button
                          key={e.value}
                          onClick={() => setEffect(e.value)}
                          className={cn(
                            'flex-1 py-1 rounded-md text-[10px] font-medium transition-all border',
                            effect === e.value
                              ? 'bg-accent/20 text-accent border-accent/30'
                              : 'bg-panel-surface text-zinc-500 border-white/5 hover:border-accent/20',
                          )}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subdivision pills */}
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Every Nth beat</span>
                    <div className="flex gap-1">
                      {BEAT_SUBDIVISIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSubdivision(s.value)}
                          className={cn(
                            'flex-1 py-1 rounded-md text-[10px] font-medium transition-all border',
                            subdivision === s.value
                              ? 'bg-accent/20 text-accent border-accent/30'
                              : 'bg-panel-surface text-zinc-500 border-white/5 hover:border-accent/20',
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity slider */}
                  <PanelSlider
                    label="Intensity"
                    value={intensity}
                    onChange={setIntensity}
                    min={0}
                    max={2}
                    step={0.05}
                    precision={0}
                    compact
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                  />

                  {/* Apply / Clear */}
                  <div className="flex gap-1.5">
                    {existingConfig && (
                      <button
                        onClick={() =>
                          clearObjectBeatSync([
                            { objectType: resolvedSelection.objectType, objectId: resolvedSelection.objectId },
                          ])
                        }
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-panel-surface text-zinc-400 hover:text-zinc-200 border border-white/5 hover:border-accent/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <X size={10} />
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const objectRef = {
                          objectType: resolvedSelection.objectType,
                          objectId: resolvedSelection.objectId,
                        }
                        const config = { objectRef, effect, subdivision, offset: 0, intensity }
                        const clipRanges = {
                          [`${resolvedSelection.objectType}:${resolvedSelection.objectId}`]: {
                            startFrame: resolvedSelection.startFrame,
                            endFrame: resolvedSelection.endFrame,
                          },
                        }
                        applyObjectBeatSync([config], playbackFps, clipRanges)
                      }}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-accent text-white hover:bg-[#5a8aff] transition-all flex items-center justify-center gap-1"
                    >
                      <Zap size={10} />
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
