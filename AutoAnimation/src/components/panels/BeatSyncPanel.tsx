/**
 * Beat Sync Panel — Audio beat detection, camera sync, and per-object beat sync controls.
 * Cinema-standard layout: animated 2-tab bar (Beats / Objects), search, filter toggle.
 */

import { useState, useMemo, useEffect } from 'react'
import { Music, Loader2, Camera, Trash2, Zap, X, Hand, Magnet, Search, SlidersHorizontal, Drum } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { useCameraStore } from '@/stores/useCameraStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useUnifiedTimelineStore } from '@/stores/useUnifiedTimelineStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useTimelineStore } from '@/stores'
import { clipSourceToKeyframableType, beatsToFrames, snapAllToBeats } from '@/services/beatSync'
import { useTapTempo } from '@/hooks/useTapTempo'
import { WaveformCanvas } from '@/components/panels/WaveformCanvas'
import type { BeatSyncEffect, KeyframableObjectType } from '@/types/keyframes'
import type { ClipSourceType } from '@/types/unifiedTimeline'
import { PanelToggle } from '@/components/ui/panel-controls/PanelToggle'
import { PanelSlider } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'

/* ── Tab definitions ───────────────────────────────────────────────────── */

const TABS = [
  { id: 'beats', label: 'Beats', icon: Music },
  { id: 'objects', label: 'Objects', icon: Drum },
] as const
type TabId = (typeof TABS)[number]['id']

/* ── Constant data ─────────────────────────────────────────────────────── */

const EFFECTS: { value: BeatSyncEffect; label: string }[] = [
  { value: 'scale-pulse', label: 'Scale Pulse' },
  { value: 'opacity-flash', label: 'Opacity Flash' },
  { value: 'bounce', label: 'Bounce' },
]

const SUBDIVISIONS: { value: 1 | 2 | 4; label: string }[] = [
  { value: 1, label: 'Every beat' },
  { value: 2, label: 'Every 2nd' },
  { value: 4, label: 'Every 4th' },
]

/* ── Panel component ───────────────────────────────────────────────────── */

export function BeatSyncPanel() {
  const {
    analysis,
    showBeatMarkers,
    isAnalyzing,
    error,
    analyzeAudio,
    setShowBeatMarkers,
    clearAnalysis,
    objectConfigs,
    applyObjectBeatSync,
    clearObjectBeatSync,
    sensitivity,
    manualBpm,
    beatGridOffset,
    setSensitivity,
    setManualBpm,
    setBeatGridOffset,
    regenerateBeatGrid,
  } = useBeatSyncStore(
    useShallow((s) => ({
      analysis: s.analysis,
      showBeatMarkers: s.showBeatMarkers,
      isAnalyzing: s.isAnalyzing,
      error: s.error,
      analyzeAudio: s.analyzeAudio,
      setShowBeatMarkers: s.setShowBeatMarkers,
      clearAnalysis: s.clearAnalysis,
      objectConfigs: s.objectConfigs,
      applyObjectBeatSync: s.applyObjectBeatSync,
      clearObjectBeatSync: s.clearObjectBeatSync,
      sensitivity: s.sensitivity,
      manualBpm: s.manualBpm,
      beatGridOffset: s.beatGridOffset,
      setSensitivity: s.setSensitivity,
      setManualBpm: s.setManualBpm,
      setBeatGridOffset: s.setBeatGridOffset,
      regenerateBeatGrid: s.regenerateBeatGrid,
    })),
  )

  const tapTempo = useTapTempo()

  const cameraEnabled = useCameraStore((s) => s.enabled)
  const syncToBeats = useCameraStore((s) => s.syncToBeats)
  const fps = useTimelineStore((s) => s.fps)
  const playbackFps = usePlaybackStore((s) => s.fps)

  const [activeTab, setActiveTab] = useState<TabId>('beats')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // ── Resolve selected object from canvas or unified timeline ──
  const selectedClipId = useUnifiedTimelineStore((s) => s.selectedClipId)
  const videoTracks = useUnifiedTimelineStore((s) => s.videoTracks)
  const audioTracks = useUnifiedTimelineStore((s) => s.audioTracks)

  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const textSelectedId = useTextOverlayStore((s) => s.selectedId)
  const textOverlays = useTextOverlayStore((s) => s.overlays)
  const shapeSelectedId = useShapeStore((s) => s.selectedShapeId)
  const shapes = useShapeStore((s) => s.shapes)
  const mediaSelectedId = useMediaStore((s) => s.selectedCanvasItemId)
  const mediaCanvasItems = useMediaStore((s) => s.canvasItems)
  const videoSelectedId = useVideoLayerStore((s) => s.selectedVideoId)

  const resolvedSelection = useMemo((): {
    objectId: string
    objectType: KeyframableObjectType
    name: string
    startFrame: number
    endFrame: number
  } | null => {
    const allTracks = [...videoTracks, ...audioTracks]

    if (selectedClipId) {
      for (const track of allTracks) {
        const clip = track.clips.find((c) => c.id === selectedClipId)
        if (clip) {
          const kt = clipSourceToKeyframableType(clip.sourceType)
          if (kt)
            return {
              objectId: clip.sourceId,
              objectType: kt,
              name: clip.name,
              startFrame: clip.startFrame,
              endFrame: clip.endFrame,
            }
        }
      }
    }

    const findClipRange = (sourceType: ClipSourceType, sourceId: string) => {
      for (const track of allTracks) {
        const clip = track.clips.find((c) => c.sourceType === sourceType && c.sourceId === sourceId)
        if (clip) return { startFrame: clip.startFrame, endFrame: clip.endFrame }
      }
      return null
    }

    if (textSelectedId) {
      const overlay = textOverlays.find((o) => o.id === textSelectedId)
      if (overlay) {
        const range = findClipRange('text', textSelectedId)
        return {
          objectId: textSelectedId,
          objectType: 'text',
          name: overlay.content?.slice(0, 20) || 'Text',
          startFrame: range?.startFrame ?? overlay.startFrame ?? 0,
          endFrame: range?.endFrame ?? overlay.endFrame ?? totalFrames,
        }
      }
    }

    if (shapeSelectedId) {
      const shape = shapes.find((s) => s.id === shapeSelectedId)
      if (shape) {
        const range = findClipRange('shape', shapeSelectedId)
        return {
          objectId: shapeSelectedId,
          objectType: 'shape',
          name: shape.type ?? 'Shape',
          startFrame: range?.startFrame ?? shape.startFrame ?? 0,
          endFrame: range?.endFrame ?? shape.endFrame ?? totalFrames,
        }
      }
    }

    if (mediaSelectedId) {
      const item = mediaCanvasItems.find((m) => m.id === mediaSelectedId)
      if (item) {
        const range = findClipRange('media', mediaSelectedId)
        return {
          objectId: mediaSelectedId,
          objectType: 'media',
          name: 'Media',
          startFrame: range?.startFrame ?? item.startFrame ?? 0,
          endFrame: range?.endFrame ?? item.endFrame ?? totalFrames,
        }
      }
    }

    if (videoSelectedId) {
      return {
        objectId: videoSelectedId,
        objectType: 'video',
        name: 'Video',
        startFrame: 0,
        endFrame: totalFrames,
      }
    }

    return null
  }, [
    selectedClipId,
    textSelectedId,
    shapeSelectedId,
    mediaSelectedId,
    videoSelectedId,
    videoTracks,
    audioTracks,
    textOverlays,
    shapes,
    mediaCanvasItems,
    totalFrames,
  ])

  // Per-object sync form state
  const existingConfigKey = resolvedSelection ? `${resolvedSelection.objectType}:${resolvedSelection.objectId}` : null
  const existingConfig = existingConfigKey ? objectConfigs[existingConfigKey] : undefined

  const [effect, setEffect] = useState<BeatSyncEffect>(existingConfig?.effect ?? 'scale-pulse')
  const [subdivision, setSubdivision] = useState<1 | 2 | 4>(existingConfig?.subdivision ?? 1)
  const [offset, setOffset] = useState(existingConfig?.offset ?? 0)
  const [intensity, setIntensity] = useState(existingConfig?.intensity ?? 0.75)

  useEffect(() => {
    setEffect(existingConfig?.effect ?? 'scale-pulse')
    setSubdivision(existingConfig?.subdivision ?? 1)
    setOffset(existingConfig?.offset ?? 0)
    setIntensity(existingConfig?.intensity ?? 0.75)
  }, [existingConfigKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Audio assets
  const audioAssets = useMediaStore(
    useShallow((s) => s.assets.filter((a) => a.category === 'audio' || (a.type && a.type.startsWith('audio/')))),
  )

  const q = search.toLowerCase().trim()

  const filteredAudioAssets = useMemo(() => {
    if (!q) return audioAssets
    return audioAssets.filter((a) => a.name.toLowerCase().includes(q))
  }, [audioAssets, q])

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAnalyze = async (audioUrl: string) => {
    await analyzeAudio(audioUrl)
  }

  const handleSyncCamera = () => {
    if (!analysis) return
    syncToBeats(analysis.beats, fps)
  }

  // Whether the filter icon should show a blue dot (beat tuning controls are visible)
  const hasActiveFilter = filtersOpen

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{
                  transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search Bar + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'beats' ? 'Search audio...' : 'Search objects...'}
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
          {activeTab === 'beats' && analysis && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen ? 'bg-accent/20 text-accent' : 'text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface',
              )}
            >
              <SlidersHorizontal size={14} />
              {hasActiveFilter && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Beat Tuning Controls (filter panel) ── */}
      {activeTab === 'beats' && filtersOpen && analysis && (
        <div className="shrink-0 px-3 pb-2 space-y-2">
          <PanelSlider
            label="Sensitivity"
            value={Math.round(sensitivity * 100)}
            onChange={(v) => {
              setSensitivity(v / 100)
              regenerateBeatGrid()
            }}
            min={0}
            max={100}
            step={5}
            suffix="%"
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <PanelSlider
                label="Manual BPM"
                value={manualBpm ?? analysis.bpm}
                onChange={(v) => {
                  setManualBpm(v)
                  regenerateBeatGrid()
                }}
                min={30}
                max={300}
                step={1}
                compact
              />
            </div>
            <button
              onClick={() => {
                tapTempo.tap()
                if (tapTempo.bpm) {
                  setManualBpm(tapTempo.bpm)
                }
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 shrink-0',
                tapTempo.tapCount > 0
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-panel-surface text-zinc-400 border border-white/5 hover:border-accent/30',
              )}
            >
              <Hand size={10} />
              Tap {tapTempo.bpm ? `(${tapTempo.bpm})` : ''}
            </button>
          </div>
          <PanelSlider
            label="Beat Grid Offset"
            value={beatGridOffset}
            onChange={(v) => setBeatGridOffset(v)}
            min={-0.5}
            max={0.5}
            step={0.01}
            precision={2}
            suffix="s"
          />
          <div className="flex items-center justify-between">
            <PanelToggle label="Beat Markers" checked={showBeatMarkers} onChange={setShowBeatMarkers} />
            <button
              onClick={clearAnalysis}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="shrink-0 mx-3 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ────────────────── Beats Tab ────────────────── */}
        {activeTab === 'beats' && (
          <>
            {/* Audio source rows */}
            {filteredAudioAssets.length === 0 && !analysis ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Music size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No audio found</span>
                <span className="text-xs text-gray-600 mt-1">Add audio in the Media panel first</span>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Audio asset rows */}
                {filteredAudioAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleAnalyze(asset.url)}
                    disabled={isAnalyzing}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                      isAnalyzing && 'opacity-50 cursor-not-allowed',
                      'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                    )}
                  >
                    <Music size={14} className="shrink-0 text-accent" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-200 truncate">{asset.name}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">Click to analyze</div>
                    </div>
                    {isAnalyzing ? (
                      <Loader2 size={12} className="animate-spin text-accent shrink-0" />
                    ) : (
                      <span className="text-[9px] text-gray-500 shrink-0">Analyze</span>
                    )}
                  </button>
                ))}

                {/* Waveform + Analysis Results */}
                {analysis && (
                  <>
                    {/* Waveform */}
                    <div className="mt-3 mb-2">
                      <WaveformCanvas
                        audioUrl={useBeatSyncStore.getState().lastAudioUrl}
                        beats={analysis.beats}
                        duration={analysis.duration}
                        width={320}
                        height={64}
                        className="w-full rounded-lg"
                      />
                    </div>

                    {/* Analysis stats row */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      <div className="bg-panel-surface rounded-lg p-2 text-center border border-white/5">
                        <div className="text-sm font-bold text-accent font-mono">{analysis.bpm}</div>
                        <div className="text-[9px] text-gray-500 uppercase">BPM</div>
                      </div>
                      <div className="bg-panel-surface rounded-lg p-2 text-center border border-white/5">
                        <div className="text-sm font-bold text-gray-300 font-mono">{analysis.beats.length}</div>
                        <div className="text-[9px] text-gray-500 uppercase">Beats</div>
                      </div>
                      <div className="bg-panel-surface rounded-lg p-2 text-center border border-white/5">
                        <div className="text-sm font-bold text-gray-300 font-mono">{analysis.onsets.length}</div>
                        <div className="text-[9px] text-gray-500 uppercase">Onsets</div>
                      </div>
                    </div>

                    {/* Quantize row */}
                    <button
                      onClick={async () => {
                        const beatFramesList = beatsToFrames(analysis, playbackFps)
                        const count = await snapAllToBeats(beatFramesList)
                        console.log(`[BeatSync] Snapped ${count} items to beats`)
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                        'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                      )}
                    >
                      <Magnet size={14} className="shrink-0 text-accent" />
                      <div>
                        <div className="text-xs font-medium text-gray-200">Snap All to Beats</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">Quantize text & shape start/end frames</div>
                      </div>
                    </button>

                    {/* Camera sync row */}
                    <button
                      onClick={handleSyncCamera}
                      disabled={!cameraEnabled}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                        !cameraEnabled
                          ? 'bg-panel-surface border-white/5 opacity-50 cursor-not-allowed'
                          : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                      )}
                    >
                      <Camera size={14} className="shrink-0 text-accent" />
                      <div>
                        <div className="text-xs font-medium text-gray-200">Sync Camera to Beats</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">
                          {cameraEnabled ? 'Zoom pulses on each beat' : 'Enable Virtual Camera first'}
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ────────────────── Objects Tab ────────────────── */}
        {activeTab === 'objects' && (
          <>
            {!analysis ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Music size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No analysis yet</span>
                <span className="text-xs text-gray-600 mt-1">Analyze audio in the Beats tab first</span>
              </div>
            ) : !resolvedSelection ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Drum size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No object selected</span>
                <span className="text-xs text-gray-600 mt-1">Select an object on the canvas</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Selected object indicator */}
                <div
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border flex items-center gap-2',
                    existingConfig ? 'bg-accent/10 border-accent/30' : 'bg-panel-surface border-white/5',
                  )}
                >
                  <Music size={14} className="text-accent shrink-0" />
                  <span className="text-xs font-medium text-gray-200 truncate">{resolvedSelection.name}</span>
                  {existingConfig && (
                    <span className="ml-auto text-[8px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
                      synced
                    </span>
                  )}
                </div>

                {/* Effect */}
                <label className="block">
                  <span className="text-[10px] text-zinc-400 block mb-0.5">Effect</span>
                  <select
                    value={effect}
                    onChange={(e) => setEffect(e.target.value as BeatSyncEffect)}
                    className="w-full bg-panel-surface text-zinc-200 text-[11px] rounded-lg px-2 py-1.5 border border-white/5 outline-none focus:border-accent/30"
                  >
                    {EFFECTS.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Subdivision */}
                <label className="block">
                  <span className="text-[10px] text-zinc-400 block mb-0.5">Every</span>
                  <select
                    value={subdivision}
                    onChange={(e) => {
                      const val = Number(e.target.value) as 1 | 2 | 4
                      setSubdivision(val)
                      if (offset >= val) setOffset(0)
                    }}
                    className="w-full bg-panel-surface text-zinc-200 text-[11px] rounded-lg px-2 py-1.5 border border-white/5 outline-none focus:border-accent/30"
                  >
                    {SUBDIVISIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Offset */}
                {subdivision > 1 && (
                  <label className="block">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Offset</span>
                    <select
                      value={offset}
                      onChange={(e) => setOffset(Number(e.target.value))}
                      className="w-full bg-panel-surface text-zinc-200 text-[11px] rounded-lg px-2 py-1.5 border border-white/5 outline-none focus:border-accent/30"
                    >
                      {Array.from({ length: subdivision }, (_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Intensity */}
                <PanelSlider
                  label="Intensity"
                  value={Math.round(intensity * 100)}
                  onChange={(v) => setIntensity(v / 100)}
                  min={0}
                  max={100}
                  step={5}
                  suffix="%"
                />

                {/* Actions */}
                <div className="flex gap-2">
                  {existingConfig && (
                    <button
                      onClick={() => {
                        clearObjectBeatSync([
                          { objectType: resolvedSelection.objectType, objectId: resolvedSelection.objectId },
                        ])
                      }}
                      className="flex-1 py-2 rounded-lg text-[11px] font-medium bg-panel-surface text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-panel-surface-hover transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const objectRef = {
                        objectType: resolvedSelection.objectType,
                        objectId: resolvedSelection.objectId,
                      }
                      const config = { objectRef, effect, subdivision, offset, intensity }
                      const clipRanges = {
                        [`${resolvedSelection.objectType}:${resolvedSelection.objectId}`]: {
                          startFrame: resolvedSelection.startFrame,
                          endFrame: resolvedSelection.endFrame,
                        },
                      }
                      applyObjectBeatSync([config], playbackFps, clipRanges)
                    }}
                    className="flex-1 py-2 rounded-lg text-[11px] font-semibold bg-accent text-white hover:bg-[#5a8aff] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap size={12} />
                    Sync to Beats
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
