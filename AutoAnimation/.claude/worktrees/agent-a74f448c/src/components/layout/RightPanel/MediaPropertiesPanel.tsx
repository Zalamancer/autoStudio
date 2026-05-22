import { useState, useEffect, useMemo, useRef } from 'react'
import { Image, Trash2, RotateCcw, Palette, Loader2, Copy, Eye, EyeOff, Eraser, Sparkles, Volume2, VolumeX, Music, Play, Pause, Repeat, Film, Scissors, ChevronDown, ChevronRight, CheckSquare, Square, Languages, Check, Download, X } from 'lucide-react'
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
import { PanelSlider } from '@/components/ui/panel-controls'
import { BlendModeSelector } from '@/components/ui/BlendModeSelector'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'
import { BLUR_PRESETS } from '@/services/effects/blurEffect'
import { PanelSelect } from '@/components/ui/panel-controls'

export function MediaPropertiesPanel() {
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const updateCanvasItem = useMediaStore((s) => s.updateCanvasItem)
  const removeFromCanvas = useMediaStore((s) => s.removeFromCanvas)
  const duplicateCanvasItem = useMediaStore((s) => s.duplicateCanvasItem)
  // Subscribe to live transform for real-time updates during canvas manipulation
  const liveTransform = useLiveTransformStore((s) => s.active)
  // Inline audio preview
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  // Color extraction and recoloring
  const {
    extractedColors,
    colorMap,
    isExtracting,
    isRecoloring,
    setColor,
    resetColor,
    resetAllColors,
    displayUrl,
  } = useImageRecolor(selectedCanvasItemId)

  // Background removal
  const { isProcessing: isBgRemoving, progress: bgProgress, error: bgError, removeBackground: removeBg } = useBackgroundRemoval()

  // Recraft availability + state
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

  // Use live transform values when actively manipulating this item
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

  if (!item || !asset || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Image size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No media selected</p>
        <p className="text-[10px] mt-1">Click a media item on the canvas to edit its properties</p>
      </div>
    )
  }

  // ── Audio-specific panel ──
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

    const handleResetAudio = () => {
      updateCanvasItem(item.id, {
        volume: 1,
        fadeInFrames: 0,
        fadeOutFrames: 0,
        muted: false,
        loop: false,
      })
    }

    return (
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleAudioPreviewToggle}
            className="w-14 h-14 bg-zinc-800 rounded-lg shrink-0 border border-zinc-700/50 flex items-center justify-center hover:bg-zinc-700/50 transition-colors group"
            title={isPreviewPlaying ? 'Stop preview' : 'Preview audio'}
          >
            {isPreviewPlaying ? (
              <Pause size={24} className="text-blue-400" />
            ) : (
              <>
                <Music size={24} className="text-blue-400 group-hover:hidden" />
                <Play size={24} className="text-blue-400 hidden group-hover:block" />
              </>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 truncate">{asset.name}</p>
            <p className="text-[10px] text-zinc-500">
              {asset.duration ? `${asset.duration.toFixed(1)}s` : ''}{asset.duration && asset.type ? ' · ' : ''}{asset.type}
            </p>
          </div>
        </div>

        {/* Audio Section */}
        <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <Volume2 size={12} className="text-blue-400" />
              <span className="text-sm text-zinc-300">Audio</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetAudio}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Reset audio settings"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => {
                  updateCanvasItem(item.id, { muted: !item.muted })
                }}
                className={cn(
                  'p-1 rounded transition-colors',
                  item.muted
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
                title={item.muted ? 'Unmute' : 'Mute'}
              >
                {item.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          </div>

          <div className={cn('p-3 space-y-3 bg-zinc-900/30', item.muted && 'opacity-50')}>
            {/* Volume Slider */}
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
              suffix="%"
            />

            {/* Fade In */}
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
              suffix="f"
            />

            {/* Fade Out */}
            <PanelSlider
              label="Fade Out"
              value={item.fadeOutFrames}
              onChange={(v) => {
                const val = Math.max(0, Math.round(v))
                updateCanvasItem(item.id, { fadeOutFrames: val })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'fadeOutFrames', val, item.fadeOutFrames)
              }}
              min={0}
              max={300}
              step={1}
              suffix="f"
            />

            {/* Loop Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Loop</span>
              <button
                onClick={() => updateCanvasItem(item.id, { loop: !item.loop })}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
                  item.loop
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                )}
                title={item.loop ? 'Disable loop' : 'Enable loop'}
              >
                <Repeat size={12} />
                {item.loop ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Timing Section */}
        <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <Film size={12} className="text-zinc-400" />
              <span className="text-sm text-zinc-300">Timing</span>
            </div>
            <button
              onClick={() => updateCanvasItem(item.id, { visible: !item.visible })}
              className={cn(
                'p-1 rounded transition-colors',
                item.visible
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-400'
              )}
              title={item.visible ? 'Hide' : 'Show'}
            >
              {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
          <div className="p-3 space-y-3 bg-zinc-900/30">
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
              suffix="f"
              compact
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
              suffix="f"
              compact
            />
          </div>
        </div>

        {/* Smart Cut Section */}
        <SmartCutSection audioUrl={asset.url} />

        {/* Dubbing Section */}
        <DubbingSection assetUrl={asset.url} />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => duplicateCanvasItem(item.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            title="Duplicate audio item"
          >
            <Copy size={12} />
            Duplicate
          </button>
          <button
            onClick={() => removeFromCanvas(item.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
            title="Remove from canvas"
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      </div>
    )
  }

  // ── Visual media panel (images/video) ──
  const handleReset = () => {
    updateCanvasItem(item.id, {
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
    })
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header + Preview */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-700/50 relative">
          <img
            src={displayUrl || asset.url}
            alt={asset.name}
            className="w-full h-full object-contain"
          />
          {isRecoloring && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-blue-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 truncate">{asset.name}</p>
          <p className="text-[10px] text-zinc-500">
            {asset.width && asset.height ? `${asset.width} × ${asset.height}` : asset.type}
          </p>
        </div>
      </div>

      {/* Transform Section */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        {/* Transform Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', isLiveActive ? 'bg-green-400 animate-pulse' : 'bg-blue-400')} />
            <span className="text-sm text-zinc-300">Transform</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Visibility Toggle */}
            <button
              onClick={() => updateCanvasItem(item.id, { visible: !item.visible })}
              className={cn(
                'p-1 rounded transition-colors',
                item.visible
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-400'
              )}
              title={item.visible ? 'Hide' : 'Show'}
            >
              {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset transform"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Transform Controls */}
        <div className={cn('p-3 space-y-3 bg-zinc-900/30', !item.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <PanelSlider
            label="X"
            value={displayValues.x}
            onChange={(v) => {
              updateCanvasItem(item.id, { position: { ...item.position, x: v } })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'position.x', v, item.position.x)
            }}
            min={-5000}
            max={5000}
            step={1}
            precision={1}
            compact
          />
          <PanelSlider
            label="Y"
            value={displayValues.y}
            onChange={(v) => {
              updateCanvasItem(item.id, { position: { ...item.position, y: v } })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'position.y', v, item.position.y)
            }}
            min={-5000}
            max={5000}
            step={1}
            precision={1}
            compact
          />

          {/* Rotation */}
          <PanelSlider
            label="Rotation"
            value={displayValues.rotation}
            onChange={(v) => {
              updateCanvasItem(item.id, { rotation: v })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'rotation', v, item.rotation)
            }}
            min={-180}
            max={180}
            step={1}
            suffix="°"
          />

          {/* Scale */}
          <PanelSlider
            label="Scale"
            value={displayValues.scale * 100}
            onChange={(v) => {
              updateCanvasItem(item.id, { scale: v / 100 })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'scale', v / 100, item.scale)
            }}
            min={5}
            max={500}
            step={1}
            suffix="%"
          />

          {/* Opacity */}
          <PanelSlider
            label="Opacity"
            value={displayValues.opacity * 100}
            onChange={(v) => {
              const val = Math.min(1, Math.max(0, v / 100))
              updateCanvasItem(item.id, { opacity: val })
              recordPropertyChange({ objectType: 'media', objectId: item.id }, 'opacity', val, item.opacity)
            }}
            min={0}
            max={100}
            step={1}
            suffix="%"
          />

          {/* Z-Index */}
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
          />

          {/* Blend Mode */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Blend Mode</span>
            <BlendModeSelector
              value={(item.blendMode || 'source-over') as BlendMode}
              onChange={(mode) => updateCanvasItem(item.id, { blendMode: mode })}
            />
          </div>

          {/* Blur */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Blur</span>
            <PanelSlider
              label="Amount"
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
        </div>
      </div>

      {/* Colors Section */}
      {asset.category === 'images' && (
        <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-zinc-400" />
              <span className="text-xs text-zinc-300">Colors</span>
              {isExtracting && <Loader2 size={10} className="animate-spin text-zinc-500" />}
            </div>
            {extractedColors && Object.keys(colorMap).length > 0 && (
              <button
                onClick={resetAllColors}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Reset all colors to original"
              >
                <RotateCcw size={10} />
              </button>
            )}
          </div>

          <div className="p-3 space-y-2.5 bg-zinc-900/30">
            {isExtracting && (
              <p className="text-[10px] text-zinc-500 text-center">Analyzing colors...</p>
            )}
            {!isExtracting && extractedColors && extractedColors.length === 0 && (
              <p className="text-[10px] text-zinc-500 text-center">No colors detected</p>
            )}
            {extractedColors && extractedColors.map((ec, i) => {
              const currentHex = colorMap[ec.hex] || ec.hex
              const isModified = colorMap[ec.hex] !== undefined
              return (
                <div key={`${ec.hex}-${i}`} className="flex items-center gap-2">
                  <ColorPicker color={currentHex} onChange={(c) => setColor(ec.hex, c)} />
                  {/* Label */}
                  <span className={cn(
                    'text-xs flex-1 truncate',
                    isModified ? 'text-zinc-200' : 'text-zinc-400'
                  )}>
                    Color {i + 1}
                  </span>
                  {/* Percentage */}
                  <span className="text-[10px] text-zinc-600">{ec.percentage}%</span>
                  {/* Hex value */}
                  <span className="text-[10px] text-zinc-500 font-mono">{currentHex}</span>
                  {/* Reset single */}
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
          </div>
        </div>
      )}

      {/* Background Removal Section */}
      {asset.category === 'images' && (
        <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <Eraser size={12} className="text-violet-400" />
              <span className="text-xs text-zinc-300">Background</span>
            </div>
          </div>
          <div className="p-3 space-y-2.5 bg-zinc-900/30">
            <div className="flex items-center gap-1.5">
              {/* Free bg removal */}
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
                    : 'bg-violet-600/10 text-violet-400 hover:bg-violet-600/20'
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

              {/* Quality bg removal (Recraft) */}
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
                      useMediaStore.getState().addAsset({
                        id: newId,
                        name: `${baseName} (no-bg).png`,
                        url: resultUrl,
                        type: 'image/png',
                        size: resultBlob.size,
                        category: 'images',
                        width: asset.width,
                        height: asset.height,
                        addedAt: Date.now(),
                      }, resultBlob)
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
                      : 'bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600/20'
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
            {bgError && (
              <p className="text-[10px] text-red-400">{bgError}</p>
            )}
            {recraftBgError && (
              <p className="text-[10px] text-red-400">{recraftBgError}</p>
            )}
            <p className="text-[10px] text-zinc-600">
              Creates a new transparent PNG in your media library.
            </p>
          </div>
        </div>
      )}

      {/* Vectorize to SVG */}
      {asset.category === 'images' && recraftAvailable && (
        <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-emerald-400" />
              <span className="text-xs text-zinc-300">Vectorize</span>
            </div>
          </div>
          <div className="p-3 space-y-2.5 bg-zinc-900/30">
            <button
              onClick={async () => {
                if (!asset || !item) return
                setIsVectorizing(true)
                setVectorizeError(null)
                try {
                  // Fetch the image as a data URL for vectorization
                  const res = await fetch(asset.url)
                  const blob = await res.blob()
                  const reader = new FileReader()
                  const dataUrl = await new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.onerror = () => reject(new Error('Failed to read image'))
                    reader.readAsDataURL(blob)
                  })
                  const svgDataUrl = await vectorizeImage(dataUrl)
                  // Convert SVG data URL to blob for storage
                  const svgParts = svgDataUrl.split(',')
                  const svgMime = svgParts[0].match(/:(.*?);/)?.[1] || 'image/svg+xml'
                  const svgBstr = atob(svgParts[1])
                  const svgU8 = new Uint8Array(svgBstr.length)
                  for (let i = 0; i < svgBstr.length; i++) svgU8[i] = svgBstr.charCodeAt(i)
                  const svgBlob = new Blob([svgU8], { type: svgMime })
                  const svgUrl = URL.createObjectURL(svgBlob)
                  const newId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
                  const baseName = asset.name.replace(/\.[^.]+$/, '')
                  useMediaStore.getState().addAsset({
                    id: newId,
                    name: `${baseName} (SVG).svg`,
                    url: svgUrl,
                    type: 'image/svg+xml',
                    size: svgBlob.size,
                    category: 'images',
                    width: asset.width,
                    height: asset.height,
                    addedAt: Date.now(),
                  }, svgBlob)
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
                  : 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20'
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
            {vectorizeError && (
              <p className="text-[10px] text-red-400">{vectorizeError}</p>
            )}
            <p className="text-[10px] text-zinc-600">
              Converts to scalable SVG via Recraft.ai.
            </p>
          </div>
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={() => removeFromCanvas(item.id)}
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
        title="Remove from canvas"
      >
        <Trash2 size={12} />
        Remove from Canvas
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Smart Cut Section — collapsible accordion for silence/filler detection
// ---------------------------------------------------------------------------

function SmartCutSection({ audioUrl }: { audioUrl: string }) {
  const [open, setOpen] = useState(false)

  const {
    regions, isAnalyzing, hasAnalyzed, filterMode,
    analyzeAudio, toggleRegion, setFilterMode, applySmartCut, reset,
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
    // Try generated voice alignment first
    const voice = generatedVoices[0]
    const words: WordTimestamp[] = []
    if (voice?.wordTimeline) {
      for (const w of voice.wordTimeline) {
        words.push({ word: w.word, start: w.startTime, end: w.endTime })
      }
    }

    // Get audio blob
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

  // Filter regions by mode
  const filteredRegions = regions.filter((r) => {
    if (filterMode === 'silence') return r.type === 'silence'
    if (filterMode === 'fillers') return r.type === 'filler'
    return true
  })

  const enabledCount = filteredRegions.filter((r) => r.enabled).length
  const totalDuration = filteredRegions
    .filter((r) => r.enabled)
    .reduce((sum, r) => sum + (r.endTime - r.startTime), 0)

  return (
    <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
      >
        {open ? <ChevronDown size={12} className="text-zinc-500" /> : <ChevronRight size={12} className="text-zinc-500" />}
        <Scissors size={12} className="text-red-400" />
        <span className="text-xs text-zinc-300 font-medium">Smart Cut</span>
        {hasAnalyzed && (
          <span className="ml-auto text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
            {regions.length} regions
          </span>
        )}
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-zinc-900/30">
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
              {/* Summary */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">{regions.length} regions · {totalDuration.toFixed(1)}s selected</span>
                <button
                  onClick={reset}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
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

              {/* Region list (compact) */}
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
                        region.enabled
                          ? 'bg-red-500/10 text-zinc-300'
                          : 'bg-transparent text-zinc-600',
                      )}
                    >
                      {region.enabled ? (
                        <CheckSquare size={10} className="text-red-400 shrink-0" />
                      ) : (
                        <Square size={10} className="text-zinc-600 shrink-0" />
                      )}
                      <span className={cn(
                        'px-1 rounded text-[8px] font-medium uppercase',
                        region.type === 'silence' ? 'bg-zinc-700 text-zinc-400' : 'bg-orange-500/20 text-orange-400',
                      )}>
                        {region.type === 'silence' ? 'S' : 'F'}
                      </span>
                      {region.word && (
                        <span className="text-orange-300 truncate">"{region.word}"</span>
                      )}
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
// Dubbing Section — collapsible accordion for multi-language dubbing
// ---------------------------------------------------------------------------

function DubbingSection({ assetUrl }: { assetUrl: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const previewRef = useRef<HTMLAudioElement | null>(null)
  const [playingLang, setPlayingLang] = useState<string | null>(null)

  const {
    sourceLanguage, targetLanguages, isProcessing, statusText,
    error, results, progress,
    setSourceLanguage, toggleTargetLanguage, startDubbing, startDubbingBatch, clearResults,
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

  // Collect all audio canvas items
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
    <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
      >
        {open ? <ChevronDown size={12} className="text-zinc-500" /> : <ChevronRight size={12} className="text-zinc-500" />}
        <Languages size={12} className="text-emerald-400" />
        <span className="text-xs text-zinc-300 font-medium">Dubbing</span>
        {results.length > 0 && (
          <span className="ml-auto text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
            {results.length} languages
          </span>
        )}
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-zinc-900/30">
          {/* Source language */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Source</span>
            <PanelSelect
              value={sourceLanguage}
              onChange={setSourceLanguage}
              options={DUBBING_LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label }))}
              fullWidth
            />
          </div>

          {/* Target languages */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Target ({targetLanguages.length})
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:border-emerald-500/50 focus:outline-none placeholder:text-zinc-600"
            />
            <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-y-auto pr-0.5">
              {filteredLanguages.map((lang) => {
                const selected = targetLanguages.includes(lang.code)
                return (
                  <button
                    key={lang.code}
                    onClick={() => toggleTargetLanguage(lang.code)}
                    className={cn(
                      'flex items-center gap-1 py-1 px-1.5 rounded text-[10px] font-medium transition-all',
                      selected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-black/20 text-zinc-500 border border-white/5 hover:border-emerald-500/20',
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
                <Loader2 size={10} className="animate-spin text-emerald-400" />
                {statusText}
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
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
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30',
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
                      : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30',
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
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Results</span>
              {results.map((result) => (
                <div
                  key={result.language}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 border border-white/5"
                >
                  <div className="flex items-center gap-1.5">
                    <Check size={10} className="text-emerald-400" />
                    <span className="text-[10px] text-zinc-300">{result.languageLabel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(result.audioUrl, result.language)}
                      className={cn(
                        'p-1 rounded transition-colors',
                        playingLang === result.language
                          ? 'bg-emerald-500/20 text-emerald-400'
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
                className="w-full py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
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
