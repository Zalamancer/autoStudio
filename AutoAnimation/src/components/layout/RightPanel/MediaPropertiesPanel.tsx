import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Image,
  Trash2,
  RotateCcw,
  Loader2,
  Eraser,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Languages,
  Check,
  Download,
  X,
  Play,
  Pause,
  Scissors,
} from 'lucide-react'
import { useMediaStore } from '@/stores/useMediaStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { useImageRecolor } from '@/hooks/useImageRecolor'
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval'
import { recordPropertyChange } from '@/hooks/usePropertyRecorder'
import { removeBackgroundRecraft, vectorizeImage, isRecraftAvailable } from '@/services/recraft'
import { useShallow } from 'zustand/react/shallow'
import { useSmartCutStore } from '@/stores/useSmartCutStore'
import { useDubbingStore } from '@/stores/useDubbingStore'
import { DUBBING_LANGUAGES } from '@/services/dubbing'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores'
import type { WordTimestamp } from '@/services/silenceDetection'
import { cn } from '@/lib/utils'
import { ColorPicker } from '@/components/ui'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { BlendModeSelector } from '@/components/ui/BlendModeSelector'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'
import { BLUR_PRESETS } from '@/services/effects/blurEffect'

export function MediaPropertiesPanel({ activeTab = 'all' }: { activeTab?: string }) {
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const updateCanvasItem = useMediaStore((s) => s.updateCanvasItem)
  const removeFromCanvas = useMediaStore((s) => s.removeFromCanvas)
  const liveTransform = useLiveTransformStore((s) => s.active)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  const { extractedColors, colorMap, isExtracting, isRecoloring, setColor, resetColor, resetAllColors, displayUrl } =
    useImageRecolor(selectedCanvasItemId)

  const {
    isProcessing: isBgRemoving,
    progress: bgProgress,
    error: bgError,
    removeBackground: removeBg,
  } = useBackgroundRemoval()

  const [recraftAvailable, setRecraftAvailable] = useState(false)
  const [isRecraftBgRemoving, setIsRecraftBgRemoving] = useState(false)
  const [recraftBgError, setRecraftBgError] = useState<string | null>(null)
  const [isVectorizing, setIsVectorizing] = useState(false)
  const [vectorizeError, setVectorizeError] = useState<string | null>(null)

  useEffect(() => {
    isRecraftAvailable().then(setRecraftAvailable)
  }, [])

  const item = canvasItems.find((c) => c.id === selectedCanvasItemId)
  const asset = item ? assets.find((a) => a.id === item.assetId) : null
  const isAudio = asset?.category === 'audio'

  const isLiveActive = liveTransform?.type === 'media' && liveTransform?.id === item?.id
  const displayValues = useMemo(() => {
    if (!item) return null
    if (isLiveActive && liveTransform) {
      return {
        x: liveTransform.x,
        y: liveTransform.y,
        rotation: liveTransform.rotation,
        scale: liveTransform.scale,
        opacity: item.opacity,
        zIndex: item.zIndex,
      }
    }
    return {
      x: item.position.x,
      y: item.position.y,
      rotation: item.rotation,
      scale: item.scale,
      opacity: item.opacity,
      zIndex: item.zIndex,
    }
  }, [item, isLiveActive, liveTransform])

  const showAll = activeTab === 'all'
  const showTransform = showAll || activeTab === 'transform'
  const showEffects = showAll || activeTab === 'effects'
  const showTiming = showAll || activeTab === 'timing'

  if (!item || !asset || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No media selected</p>
        <p className="text-xs mt-1">Click a media item on the canvas to edit its properties</p>
      </div>
    )
  }

  // ── Audio panel ──
  if (isAudio) {
    const handleAudioPreviewToggle = () => {
      if (isPreviewPlaying && previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
        setIsPreviewPlaying(false)
      } else {
        const audio = new Audio(asset.url)
        audio.volume = item.muted ? 0 : item.volume
        audio.onended = () => {
          previewAudioRef.current = null
          setIsPreviewPlaying(false)
        }
        audio.play().catch(() => {})
        previewAudioRef.current = audio
        setIsPreviewPlaying(true)
      }
    }

    return (
      <div className="flex flex-col h-full overflow-y-auto">
        {/* ── Audio Controls ── */}
        {showTransform && (
          <div className="p-4 border-b border-white/5">
            <PanelSlider
              label="Volume"
              value={Math.round(item.volume * 100)}
              onChange={(v) => {
                const val = Math.min(1, Math.max(0, v / 100))
                updateCanvasItem(item.id, { volume: val })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'volume', val, item.volume)
              }}
              min={0}
              max={100}
              step={1}
              precision={0}
              suffix="%"
            />
            <PanelSlider
              label="Fade In"
              value={item.fadeInFrames}
              onChange={(v) => {
                const val = Math.max(0, Math.round(v))
                updateCanvasItem(item.id, { fadeInFrames: val })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'fadeInFrames', val, item.fadeInFrames)
              }}
              min={0}
              max={300}
              step={1}
              precision={0}
              suffix="f"
            />
            <PanelSlider
              label="Fade Out"
              value={item.fadeOutFrames}
              onChange={(v) => {
                const val = Math.max(0, Math.round(v))
                updateCanvasItem(item.id, { fadeOutFrames: val })
                recordPropertyChange(
                  { objectType: 'media', objectId: item.id },
                  'fadeOutFrames',
                  val,
                  item.fadeOutFrames,
                )
              }}
              min={0}
              max={300}
              step={1}
              precision={0}
              suffix="f"
            />

            {/* Loop */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-gray-400 text-sm shrink-0 w-20">Loop</span>
              <div className="flex-1">
                <button
                  onClick={() => updateCanvasItem(item.id, { loop: !item.loop })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    item.loop
                      ? 'bg-accent/10 text-accent'
                      : 'bg-panel-surface text-gray-500 hover:bg-panel-surface-hover',
                  )}
                >
                  {item.loop ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Mute */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-gray-400 text-sm shrink-0 w-20">Mute</span>
              <div className="flex-1">
                <button
                  onClick={() => updateCanvasItem(item.id, { muted: !item.muted })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    item.muted
                      ? 'bg-accent/10 text-accent'
                      : 'bg-panel-surface text-gray-500 hover:bg-panel-surface-hover',
                  )}
                >
                  {item.muted ? 'Muted' : 'Unmuted'}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-gray-400 text-sm shrink-0 w-20">Preview</span>
              <div className="flex-1">
                <button
                  onClick={handleAudioPreviewToggle}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    isPreviewPlaying
                      ? 'bg-accent/10 text-accent'
                      : 'bg-panel-surface text-gray-500 hover:bg-panel-surface-hover',
                  )}
                >
                  {isPreviewPlaying ? 'Stop' : 'Play'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Time Range ── */}
        {showTiming && (
          <div className="p-4 border-b border-white/5">
            <PanelSlider
              label="Start"
              value={item.startFrame}
              onChange={(v) => {
                const val = Math.max(0, Math.round(v))
                updateCanvasItem(item.id, { startFrame: val })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'startFrame', val, item.startFrame)
              }}
              min={0}
              max={item.endFrame - 1}
              step={1}
              precision={0}
              suffix="f"
            />
            <PanelSlider
              label="End"
              value={item.endFrame}
              onChange={(v) => {
                const val = Math.max(item.startFrame + 1, Math.round(v))
                updateCanvasItem(item.id, { endFrame: val })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'endFrame', val, item.endFrame)
              }}
              min={item.startFrame + 1}
              max={9999}
              step={1}
              precision={0}
              suffix="f"
            />

            {/* Visible */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-gray-400 text-sm shrink-0 w-20">Visible</span>
              <div className="flex-1">
                <button
                  onClick={() => updateCanvasItem(item.id, { visible: !item.visible })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    item.visible
                      ? 'bg-accent/10 text-accent'
                      : 'bg-panel-surface text-gray-500 hover:bg-panel-surface-hover',
                  )}
                >
                  {item.visible ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Smart Cut ── */}
        {showEffects && <SmartCutSection audioUrl={asset.url} />}

        {/* ── Dubbing ── */}
        {showEffects && <DubbingSection assetUrl={asset.url} />}

        {/* ── Remove — sticky bottom ── */}
        <div className="mt-auto p-4 border-t border-white/5">
          <button
            onClick={() => removeFromCanvas(item.id)}
            className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      </div>
    )
  }

  // ── Visual media panel (images/video) ──
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Transform ── */}
      {showTransform && (
        <div className="p-4 border-b border-white/5">
          <PanelSlider
            label="X"
            value={Math.round(displayValues.x)}
            onChange={(v) => {
              updateCanvasItem(item.id, { position: { ...item.position, x: v } })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'position.x', v, item.position.x)
            }}
            min={-2000}
            max={2000}
            step={1}
            precision={0}
            suffix="px"
          />
          <PanelSlider
            label="Y"
            value={Math.round(displayValues.y)}
            onChange={(v) => {
              updateCanvasItem(item.id, { position: { ...item.position, y: v } })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'position.y', v, item.position.y)
            }}
            min={-2000}
            max={2000}
            step={1}
            precision={0}
            suffix="px"
          />
          <PanelSlider
            label="Scale"
            value={Math.round(displayValues.scale * 100)}
            onChange={(v) => {
              updateCanvasItem(item.id, { scale: Math.min(3, Math.max(0.01, v / 100)) })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'scale', v / 100, item.scale)
            }}
            min={1}
            max={300}
            step={1}
            suffix="%"
            precision={0}
          />
          <PanelSlider
            label="Rotation"
            value={Math.round(displayValues.rotation)}
            onChange={(v) => {
              updateCanvasItem(item.id, { rotation: Math.round(v) })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'rotation', v, item.rotation)
            }}
            min={-360}
            max={360}
            step={1}
            suffix="°"
            precision={0}
          />
          <PanelSlider
            label="Opacity"
            value={Math.round(displayValues.opacity * 100)}
            onChange={(v) => {
              const val = Math.max(0, Math.min(100, v)) / 100
              updateCanvasItem(item.id, { opacity: val })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'opacity', val, item.opacity)
            }}
            min={0}
            max={100}
            step={1}
            suffix="%"
            precision={0}
          />
          <PanelSlider
            label="Z-Index"
            value={displayValues.zIndex}
            onChange={(v) => {
              const val = Math.round(v)
              updateCanvasItem(item.id, { zIndex: val })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'zIndex', val, item.zIndex)
            }}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />

          {/* Visible */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-gray-400 text-sm shrink-0 w-20">Visible</span>
            <div className="flex-1">
              <button
                onClick={() => updateCanvasItem(item.id, { visible: !item.visible })}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                  item.visible
                    ? 'bg-accent/10 text-accent'
                    : 'bg-panel-surface text-gray-500 hover:bg-panel-surface-hover',
                )}
              >
                {item.visible ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Effects ── */}
      {showEffects && (
        <CollapsibleSection title="Effects" count={2}>
          <div className="space-y-2.5">
            <BlendModeSelector
              value={(item.blendMode || 'source-over') as BlendMode}
              onChange={(mode) => updateCanvasItem(item.id, { blendMode: mode })}
            />
            <PanelSlider
              label="Blur"
              value={item.blur ?? 0}
              onChange={(v) => updateCanvasItem(item.id, { blur: Math.max(0, v) })}
              min={0}
              max={50}
              step={0.5}
              suffix="px"
              precision={1}
            />
            <PanelSelect
              value={item.blurType ?? 'gaussian'}
              onChange={(v) => updateCanvasItem(item.id, { blurType: v as BlurType })}
              options={[
                { value: 'gaussian', label: 'Gaussian' },
                { value: 'motion', label: 'Motion' },
                { value: 'tilt-shift', label: 'Tilt-Shift' },
              ]}
              fullWidth
            />
            {item.blurType === 'motion' && (
              <PanelSlider
                label="Angle"
                value={item.motionBlurAngle ?? 0}
                onChange={(v) => updateCanvasItem(item.id, { motionBlurAngle: v })}
                min={0}
                max={360}
                step={1}
                suffix="°"
              />
            )}
            {(item.blur ?? 0) > 0 && (
              <PanelSelect
                value=""
                onChange={(v) => {
                  const preset = BLUR_PRESETS.find((p) => p.label === v)
                  if (preset) {
                    updateCanvasItem(item.id, {
                      blur: preset.blur,
                      blurType: preset.type as BlurType,
                      motionBlurAngle: preset.angle ?? 0,
                    })
                  }
                }}
                options={[
                  { value: '', label: 'Apply Preset...' },
                  ...BLUR_PRESETS.map((p) => ({ value: p.label, label: p.label })),
                ]}
                fullWidth
              />
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Colors (images only) ── */}
      {showEffects && asset.category === 'images' && (
        <CollapsibleSection title="Colors" count={extractedColors?.length}>
          {isExtracting && <p className="text-[10px] text-zinc-500 text-center">Analyzing colors...</p>}
          {!isExtracting && extractedColors && extractedColors.length === 0 && (
            <p className="text-[10px] text-zinc-500 text-center">No colors detected</p>
          )}
          {extractedColors &&
            extractedColors.map((ec, i) => {
              const currentHex = colorMap[ec.hex] || ec.hex
              const isModified = colorMap[ec.hex] !== undefined
              return (
                <div key={`${ec.hex}-${i}`} className="flex items-center gap-2">
                  <ColorPicker color={currentHex} onChange={(c) => setColor(ec.hex, c)} />
                  <span className={cn('text-xs flex-1 truncate', isModified ? 'text-zinc-200' : 'text-zinc-400')}>
                    Color {i + 1}
                  </span>
                  <span className="text-[10px] text-zinc-600">{ec.percentage}%</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{currentHex}</span>
                  {isModified && (
                    <button
                      onClick={() => resetColor(ec.hex)}
                      className="p-0.5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
                      title={`Reset to ${ec.hex}`}
                    >
                      <RotateCcw size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          {extractedColors && Object.keys(colorMap).length > 0 && (
            <button
              onClick={resetAllColors}
              className="w-full py-1.5 rounded-lg text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
            >
              Reset All Colors
            </button>
          )}
          {isRecoloring && (
            <div className="flex items-center justify-center gap-2 py-1">
              <Loader2 size={10} className="animate-spin text-accent" />
              <span className="text-[10px] text-zinc-500">Recoloring...</span>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ── Background (images only) ── */}
      {showEffects && asset.category === 'images' && (
        <CollapsibleSection title="Background" defaultExpanded={false}>
          <div className="flex items-center gap-1.5">
            <button
              onClick={async () => {
                if (!asset || !item) return
                const newAssetId = await removeBg(asset.id)
                if (newAssetId) {
                  updateCanvasItem(item.id, { assetId: newAssetId })
                }
              }}
              disabled={isBgRemoving || isRecraftBgRemoving}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-colors',
                isBgRemoving
                  ? 'bg-violet-600/20 text-violet-300 cursor-wait'
                  : 'bg-violet-600/10 text-violet-400 hover:bg-violet-600/20',
              )}
            >
              {isBgRemoving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  {bgProgress?.phase === 'downloading'
                    ? 'Downloading...'
                    : `${Math.round((bgProgress?.progress || 0) * 100)}%`}
                </>
              ) : (
                <>
                  <Eraser size={12} />
                  Free
                </>
              )}
            </button>
            {recraftAvailable && (
              <button
                onClick={async () => {
                  if (!asset || !item) return
                  setIsRecraftBgRemoving(true)
                  setRecraftBgError(null)
                  try {
                    const res = await fetch(asset.url)
                    const blob = await res.blob()
                    const resultBlob = await removeBackgroundRecraft(blob)
                    const resultUrl = URL.createObjectURL(resultBlob)
                    const newId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
                    const baseName = asset.name.replace(/\.[^.]+$/, '')
                    useMediaStore.getState().addAsset(
                      {
                        id: newId,
                        name: `${baseName} (no-bg).png`,
                        url: resultUrl,
                        type: 'image/png',
                        size: resultBlob.size,
                        category: 'images',
                        width: asset.width,
                        height: asset.height,
                        addedAt: Date.now(),
                      },
                      resultBlob,
                    )
                    updateCanvasItem(item.id, { assetId: newId })
                  } catch (err) {
                    setRecraftBgError(err instanceof Error ? err.message : 'Quality bg removal failed')
                  } finally {
                    setIsRecraftBgRemoving(false)
                  }
                }}
                disabled={isBgRemoving || isRecraftBgRemoving}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-colors',
                  isRecraftBgRemoving
                    ? 'bg-cyan-600/20 text-cyan-300 cursor-wait'
                    : 'bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600/20',
                )}
              >
                {isRecraftBgRemoving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Eraser size={12} />
                    Quality
                    <span className="text-[9px] text-cyan-500/70">5cr</span>
                  </>
                )}
              </button>
            )}
          </div>
          {isBgRemoving && bgProgress && (
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${Math.round(bgProgress.progress * 100)}%` }}
              />
            </div>
          )}
          {bgError && <p className="text-[10px] text-red-400">{bgError}</p>}
          {recraftBgError && <p className="text-[10px] text-red-400">{recraftBgError}</p>}
          <p className="text-[10px] text-zinc-600">Creates a new transparent PNG in your media library.</p>
        </CollapsibleSection>
      )}

      {/* ── Vectorize (images + recraft) ── */}
      {showEffects && asset.category === 'images' && recraftAvailable && (
        <CollapsibleSection title="Vectorize" defaultExpanded={false}>
          <button
            onClick={async () => {
              if (!asset || !item) return
              setIsVectorizing(true)
              setVectorizeError(null)
              try {
                const res = await fetch(asset.url)
                const blob = await res.blob()
                const reader = new FileReader()
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  reader.onloadend = () => resolve(reader.result as string)
                  reader.onerror = () => reject(new Error('Failed to read image'))
                  reader.readAsDataURL(blob)
                })
                const svgDataUrl = await vectorizeImage(dataUrl)
                const svgParts = svgDataUrl.split(',')
                const svgMime = svgParts[0].match(/:(.*?);/)?.[1] || 'image/svg+xml'
                const svgBstr = atob(svgParts[1])
                const svgU8 = new Uint8Array(svgBstr.length)
                for (let i = 0; i < svgBstr.length; i++) svgU8[i] = svgBstr.charCodeAt(i)
                const svgBlob = new Blob([svgU8], { type: svgMime })
                const svgUrl = URL.createObjectURL(svgBlob)
                const newId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
                const baseName = asset.name.replace(/\.[^.]+$/, '')
                useMediaStore.getState().addAsset(
                  {
                    id: newId,
                    name: `${baseName} (SVG).svg`,
                    url: svgUrl,
                    type: 'image/svg+xml',
                    size: svgBlob.size,
                    category: 'images',
                    width: asset.width,
                    height: asset.height,
                    addedAt: Date.now(),
                  },
                  svgBlob,
                )
                updateCanvasItem(item.id, { assetId: newId })
              } catch (err) {
                setVectorizeError(err instanceof Error ? err.message : 'Vectorization failed')
              } finally {
                setIsVectorizing(false)
              }
            }}
            disabled={isVectorizing}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-colors',
              isVectorizing
                ? 'bg-emerald-600/20 text-emerald-300 cursor-wait'
                : 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20',
            )}
          >
            {isVectorizing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Vectorizing...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                Vectorize to SVG
                <span className="text-[9px] text-emerald-500/70">5cr</span>
              </>
            )}
          </button>
          {vectorizeError && <p className="text-[10px] text-red-400">{vectorizeError}</p>}
          <p className="text-[10px] text-zinc-600">Converts to scalable SVG via Recraft.ai.</p>
        </CollapsibleSection>
      )}

      {/* ── Time Range ── */}
      {showTiming && (
        <div className="p-4 border-b border-white/5">
          <PanelSlider
            label="Start"
            value={item.startFrame}
            onChange={(v) => {
              const val = Math.max(0, Math.round(v))
              updateCanvasItem(item.id, { startFrame: val })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'startFrame', val, item.startFrame)
            }}
            min={0}
            max={item.endFrame - 1}
            step={1}
            precision={0}
            suffix="f"
          />
          <PanelSlider
            label="End"
            value={item.endFrame}
            onChange={(v) => {
              const val = Math.max(item.startFrame + 1, Math.round(v))
              updateCanvasItem(item.id, { endFrame: val })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'endFrame', val, item.endFrame)
            }}
            min={item.startFrame + 1}
            max={9999}
            step={1}
            precision={0}
            suffix="f"
          />
        </div>
      )}

      {/* ── Remove — sticky bottom ── */}
      <div className="mt-auto p-4 border-t border-white/5">
        <button
          onClick={() => removeFromCanvas(item.id)}
          className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible Section — matches MotionGraphicPropertiesPanel ConfigGroup
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  count,
  children,
  defaultExpanded = true,
}: {
  title: string
  count?: number
  children: React.ReactNode
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-white/5">
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] cursor-pointer transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500" />
        )}
        <span className="text-xs font-medium text-gray-200">{title}</span>
        {count !== undefined && <span className="text-[10px] text-zinc-600 ml-auto">{count}</span>}
      </div>
      {expanded && <div className="px-4 py-2.5 space-y-2.5">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Smart Cut Section
// ---------------------------------------------------------------------------

function SmartCutSection({ audioUrl }: { audioUrl: string }) {
  const [expanded, setExpanded] = useState(false)

  const {
    regions,
    isAnalyzing,
    hasAnalyzed,
    filterMode,
    analyzeAudio,
    toggleRegion,
    setFilterMode,
    applySmartCut,
    reset,
  } = useSmartCutStore(
    useShallow((s) => ({
      regions: s.regions,
      isAnalyzing: s.isAnalyzing,
      hasAnalyzed: s.hasAnalyzed,
      filterMode: s.filterMode,
      analyzeAudio: s.analyzeAudio,
      toggleRegion: s.toggleRegion,
      setFilterMode: s.setFilterMode,
      applySmartCut: s.applySmartCut,
      reset: s.reset,
    })),
  )

  const generatedVoices = useVoiceStore((s) => s.generatedVoices)

  const handleAnalyze = async () => {
    const voice = generatedVoices[0]
    const words: WordTimestamp[] = []
    if (voice?.wordTimeline) {
      for (const w of voice.wordTimeline) {
        words.push({ word: w.word, start: w.startTime, end: w.endTime })
      }
    }

    let audioBlob: Blob | null = null
    const url = voice?.audioUrl || audioUrl
    if (url) {
      try {
        const resp = await fetch(url)
        audioBlob = await resp.blob()
      } catch {
        // fetch failed
      }
    }

    if (audioBlob) {
      await analyzeAudio(audioBlob, words)
    }
  }

  const filteredRegions = regions.filter((r) => {
    if (filterMode === 'silence') return r.type === 'silence'
    if (filterMode === 'fillers') return r.type === 'filler'
    return true
  })

  const enabledCount = filteredRegions.filter((r) => r.enabled).length
  const totalDuration = filteredRegions.filter((r) => r.enabled).reduce((sum, r) => sum + (r.endTime - r.startTime), 0)

  return (
    <div className="border-b border-white/5">
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] cursor-pointer transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500" />
        )}
        <span className="text-xs font-medium text-gray-200">Smart Cut</span>
        {hasAnalyzed && <span className="text-[10px] text-zinc-600 ml-auto">{regions.length}</span>}
      </div>

      {expanded && (
        <div className="px-4 py-2.5 space-y-2.5">
          {/* Not analyzed */}
          {!hasAnalyzed && !isAnalyzing && (
            <div className="text-center space-y-2">
              <p className="text-[10px] text-zinc-500">Detect silences & filler words</p>
              <button
                onClick={handleAnalyze}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all"
              >
                Analyze
              </button>
            </div>
          )}

          {/* Analyzing */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={12} className="animate-spin text-red-400" />
              <span className="text-[11px] text-zinc-400">Analyzing...</span>
            </div>
          )}

          {/* Results */}
          {hasAnalyzed && !isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">
                  {regions.length} regions · {totalDuration.toFixed(1)}s selected
                </span>
                <button onClick={reset} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                  <Trash2 size={10} />
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex gap-1">
                {(['all', 'silence', 'fillers'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={cn(
                      'flex-1 py-1 rounded-md text-[10px] font-medium transition-all border',
                      filterMode === mode
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : 'bg-black/20 text-zinc-500 border-white/5 hover:border-red-500/20',
                    )}
                  >
                    {mode === 'all' ? 'All' : mode === 'silence' ? 'Silence' : 'Fillers'}
                  </button>
                ))}
              </div>

              {/* Region list */}
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {filteredRegions.length === 0 ? (
                  <p className="text-center text-[10px] text-zinc-600 py-2">No regions</p>
                ) : (
                  filteredRegions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => toggleRegion(region.id)}
                      className={cn(
                        'w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-all',
                        region.enabled ? 'bg-red-500/10 text-zinc-300' : 'bg-transparent text-zinc-600',
                      )}
                    >
                      {region.enabled ? (
                        <CheckSquare size={10} className="text-red-400 shrink-0" />
                      ) : (
                        <Square size={10} className="text-zinc-600 shrink-0" />
                      )}
                      <span
                        className={cn(
                          'px-1 rounded text-[8px] font-medium uppercase',
                          region.type === 'silence' ? 'bg-zinc-700 text-zinc-400' : 'bg-orange-500/20 text-orange-400',
                        )}
                      >
                        {region.type === 'silence' ? 'S' : 'F'}
                      </span>
                      {region.word && <span className="text-orange-300 truncate">"{region.word}"</span>}
                      <span className="ml-auto text-zinc-600 shrink-0 tabular-nums">
                        {(region.endTime - region.startTime).toFixed(1)}s
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Apply button */}
              <button
                onClick={applySmartCut}
                disabled={enabledCount === 0}
                className={cn(
                  'w-full py-1.5 rounded-lg text-[10px] font-medium transition-all',
                  enabledCount > 0
                    ? 'bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5',
                )}
              >
                Remove {enabledCount} region{enabledCount !== 1 ? 's' : ''} ({totalDuration.toFixed(1)}s)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dubbing Section
// ---------------------------------------------------------------------------

function DubbingSection({ assetUrl }: { assetUrl: string }) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const previewRef = useRef<HTMLAudioElement | null>(null)
  const [playingLang, setPlayingLang] = useState<string | null>(null)

  const {
    sourceLanguage,
    targetLanguages,
    isProcessing,
    statusText,
    error,
    results,
    progress,
    setSourceLanguage,
    toggleTargetLanguage,
    startDubbing,
    startDubbingBatch,
    clearResults,
  } = useDubbingStore(
    useShallow((s) => ({
      sourceLanguage: s.sourceLanguage,
      targetLanguages: s.targetLanguages,
      isProcessing: s.isProcessing,
      statusText: s.statusText,
      error: s.error,
      results: s.results,
      progress: s.progress,
      setSourceLanguage: s.setSourceLanguage,
      toggleTargetLanguage: s.toggleTargetLanguage,
      startDubbing: s.startDubbing,
      startDubbingBatch: s.startDubbingBatch,
      clearResults: s.clearResults,
    })),
  )

  const fps = useTimelineStore((s) => s.fps)
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)

  const audioClips = useMemo(() => {
    return canvasItems.filter((ci) => {
      const a = assets.find((as) => as.id === ci.assetId)
      return a?.category === 'audio'
    })
  }, [canvasItems, assets])

  const filteredLanguages = DUBBING_LANGUAGES.filter(
    (lang) =>
      lang.code !== sourceLanguage &&
      (lang.label.toLowerCase().includes(search.toLowerCase()) ||
        lang.code.toLowerCase().includes(search.toLowerCase())),
  )

  const handleDubThisClip = async () => {
    try {
      const resp = await fetch(assetUrl)
      const blob = await resp.blob()
      await startDubbing(blob, fps)
    } catch {
      // fetch error handled by store
    }
  }

  const handleDubAll = async () => {
    const clips: { id: string; blob: Blob }[] = []
    for (const ci of audioClips) {
      const a = assets.find((as) => as.id === ci.assetId)
      if (!a) continue
      try {
        const resp = await fetch(a.url)
        const blob = await resp.blob()
        clips.push({ id: ci.id, blob })
      } catch {
        // skip failed fetches
      }
    }
    await startDubbingBatch(clips, fps)
  }

  const handlePreview = (audioUrl: string, lang: string) => {
    if (previewRef.current) {
      previewRef.current.pause()
    }
    if (playingLang === lang) {
      setPlayingLang(null)
      return
    }
    const audio = new Audio(audioUrl)
    previewRef.current = audio
    setPlayingLang(lang)
    audio.onended = () => setPlayingLang(null)
    audio.play()
  }

  const handleDownloadAll = () => {
    for (const result of results) {
      const link = document.createElement('a')
      link.href = result.audioUrl
      link.download = `dubbed-${result.language}.mp3`
      link.click()
    }
  }

  return (
    <div className="border-b border-white/5">
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] cursor-pointer transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500" />
        )}
        <span className="text-xs font-medium text-gray-200">Dubbing</span>
        {results.length > 0 && <span className="text-[10px] text-zinc-600 ml-auto">{results.length}</span>}
      </div>

      {expanded && (
        <div className="px-4 py-2.5 space-y-2.5">
          {/* Source language */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Source</label>
            <PanelSelect
              value={sourceLanguage}
              onChange={setSourceLanguage}
              options={DUBBING_LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label }))}
              fullWidth
            />
          </div>

          {/* Target languages */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Target ({targetLanguages.length})</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full bg-panel-surface border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent/50 focus:outline-none placeholder:text-zinc-600"
            />
            <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-y-auto pr-0.5 mt-1.5">
              {filteredLanguages.map((lang) => {
                const selected = targetLanguages.includes(lang.code)
                return (
                  <button
                    key={lang.code}
                    onClick={() => toggleTargetLanguage(lang.code)}
                    className={cn(
                      'flex items-center gap-1 py-1 px-1.5 rounded text-[10px] font-medium transition-all',
                      selected
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-panel-surface text-zinc-500 border border-white/5 hover:border-accent/20',
                    )}
                  >
                    {selected && <Check size={8} />}
                    {lang.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px]">
              <span className="flex-1">{error}</span>
              <button onClick={clearResults} className="text-red-400 hover:text-red-200">
                <X size={10} />
              </button>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                <Loader2 size={10} className="animate-spin text-accent" />
                {statusText}
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isProcessing && (
            <div className="flex gap-1.5">
              <button
                onClick={handleDubThisClip}
                disabled={targetLanguages.length === 0}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                  targetLanguages.length === 0
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5'
                    : 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30',
                )}
              >
                Dub This Clip
              </button>
              {audioClips.length > 1 && (
                <button
                  onClick={handleDubAll}
                  disabled={targetLanguages.length === 0}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                    targetLanguages.length === 0
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5'
                      : 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30',
                  )}
                >
                  Dub All ({audioClips.length} clips)
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-gray-400 text-sm block">Results</label>
              {results.map((result) => (
                <div
                  key={result.language}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-panel-surface border border-white/5"
                >
                  <div className="flex items-center gap-1.5">
                    <Check size={10} className="text-accent" />
                    <span className="text-[10px] text-zinc-300">{result.languageLabel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(result.audioUrl, result.language)}
                      className={cn(
                        'p-1 rounded transition-colors',
                        playingLang === result.language
                          ? 'bg-accent/20 text-accent'
                          : 'bg-white/5 text-zinc-400 hover:text-white',
                      )}
                    >
                      <Play size={10} fill={playingLang === result.language ? 'currentColor' : 'none'} />
                    </button>
                    <a
                      href={result.audioUrl}
                      download={`dubbed-${result.language}.mp3`}
                      className="p-1 rounded bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Download size={10} />
                    </a>
                  </div>
                </div>
              ))}
              <button
                onClick={handleDownloadAll}
                className="w-full py-1.5 rounded-lg text-[10px] font-medium bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30 transition-colors"
              >
                <Download size={10} className="inline mr-1" />
                Download All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
