/**
 * AudioReactivePanel — UI panel for configuring audio-reactive visual mappings.
 *
 * Sections:
 * 1. Audio Source selector (music/dialogue/SFX tracks)
 * 2. Mapping list with per-mapping controls
 * 3. Live preview toggle
 * 4. "Bake to Keyframes" button
 * 5. Preset mappings
 */

import { useState, useMemo, useCallback } from 'react'
import { Activity, Plus, Trash2, Wand2, Download } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { PanelSlider, PanelToggle } from '@/components/ui/panel-controls'
import { useAudioReactiveStore } from '@/stores/useAudioReactiveStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTimelineStore } from '@/stores'
import { FREQUENCY_BANDS, FREQUENCY_BAND_LABELS, type FrequencyBand } from '@/services/frequencyBands'
import type { AudioReactiveMapping } from '@/services/audioReactiveEngine'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { cn } from '@/lib/utils'

const REACTIVE_PROPERTIES = [
  { value: 'scale', label: 'Scale' },
  { value: 'opacity', label: 'Opacity' },
  { value: 'rotation', label: 'Rotation' },
  { value: 'position.x', label: 'Position X' },
  { value: 'position.y', label: 'Position Y' },
  { value: 'freeX', label: 'Free X' },
  { value: 'freeY', label: 'Free Y' },
  { value: 'fontSize', label: 'Font Size' },
  { value: 'width', label: 'Width' },
  { value: 'height', label: 'Height' },
]

const PRESETS: { id: 'bass-pulse' | 'treble-sparkle' | 'full-bounce'; label: string; description: string }[] = [
  { id: 'bass-pulse', label: 'Bass Pulse', description: 'Bass -> Scale' },
  { id: 'treble-sparkle', label: 'Treble Sparkle', description: 'Treble -> Opacity' },
  { id: 'full-bounce', label: 'Full Bounce', description: 'Amplitude -> Position Y' },
]

function MappingCard({
  mapping,
  onUpdate,
  onRemove,
  objects,
}: {
  mapping: AudioReactiveMapping
  onUpdate: (updates: Partial<Omit<AudioReactiveMapping, 'id'>>) => void
  onRemove: () => void
  objects: { key: string; label: string; objectType: string; objectId: string }[]
}) {
  const selectedObjKey = `${mapping.targetObjectRef.objectType}:${mapping.targetObjectRef.objectId}`

  return (
    <div className="p-3 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Mapping</span>
        <button
          onClick={onRemove}
          className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Frequency Band */}
      <label className="block">
        <span className="text-[10px] text-zinc-400 block mb-0.5">Frequency Band</span>
        <select
          value={mapping.frequencyBand}
          onChange={(e) => onUpdate({ frequencyBand: e.target.value as FrequencyBand })}
          className="w-full bg-black/20 text-zinc-200 text-[11px] rounded-lg px-2 py-1.5 border border-white/5 outline-none focus:border-green-500/50"
        >
          {FREQUENCY_BANDS.map((band) => (
            <option key={band} value={band}>{FREQUENCY_BAND_LABELS[band]}</option>
          ))}
        </select>
      </label>

      {/* Target Object */}
      <label className="block">
        <span className="text-[10px] text-zinc-400 block mb-0.5">Target Object</span>
        <select
          value={selectedObjKey}
          onChange={(e) => {
            const obj = objects.find((o) => `${o.objectType}:${o.objectId}` === e.target.value)
            if (obj) onUpdate({ targetObjectRef: { objectType: obj.objectType, objectId: obj.objectId } })
          }}
          className="w-full bg-black/20 text-zinc-200 text-[11px] rounded-lg px-2 py-1.5 border border-white/5 outline-none focus:border-green-500/50"
        >
          {objects.map((obj) => (
            <option key={obj.key} value={obj.key}>{obj.label}</option>
          ))}
        </select>
      </label>

      {/* Target Property */}
      <label className="block">
        <span className="text-[10px] text-zinc-400 block mb-0.5">Property</span>
        <select
          value={mapping.targetProperty}
          onChange={(e) => onUpdate({ targetProperty: e.target.value })}
          className="w-full bg-black/20 text-zinc-200 text-[11px] rounded-lg px-2 py-1.5 border border-white/5 outline-none focus:border-green-500/50"
        >
          {REACTIVE_PROPERTIES.map((prop) => (
            <option key={prop.value} value={prop.value}>{prop.label}</option>
          ))}
        </select>
      </label>

      {/* Sensitivity */}
      <PanelSlider
        label="Sensitivity"
        value={mapping.sensitivity}
        onChange={(v) => onUpdate({ sensitivity: v })}
        min={0}
        max={1}
        step={0.05}
        compact
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      {/* Smoothing */}
      <PanelSlider
        label="Smoothing"
        value={mapping.smoothing}
        onChange={(v) => onUpdate({ smoothing: v })}
        min={0}
        max={200}
        step={10}
        compact
        suffix="ms"
      />

      {/* Min/Max Value Range */}
      <div className="grid grid-cols-2 gap-2">
        <PanelSlider
          label="Min"
          inline
          value={mapping.minValue}
          min={-100}
          max={100}
          step={0.1}
          precision={1}
          onChange={(v) => onUpdate({ minValue: v })}
        />
        <PanelSlider
          label="Max"
          inline
          value={mapping.maxValue}
          min={-100}
          max={100}
          step={0.1}
          precision={1}
          onChange={(v) => onUpdate({ maxValue: v })}
        />
      </div>

      {/* Invert Toggle */}
      <PanelToggle
        label="Invert"
        checked={mapping.invert}
        onChange={(v) => onUpdate({ invert: v })}
      />
    </div>
  )
}

export function AudioReactivePanel() {
  const { mappings, isActive, previewMode, addMapping, updateMapping, removeMapping, setActive, setPreviewMode, bakeToKeyframes, applyPreset } =
    useAudioReactiveStore(
      useShallow((s) => ({
        mappings: s.mappings,
        isActive: s.isActive,
        previewMode: s.previewMode,
        addMapping: s.addMapping,
        updateMapping: s.updateMapping,
        removeMapping: s.removeMapping,
        setActive: s.setActive,
        setPreviewMode: s.setPreviewMode,
        bakeToKeyframes: s.bakeToKeyframes,
        applyPreset: s.applyPreset,
      }))
    )

  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const [isBaking, setIsBaking] = useState(false)
  const [bakeResult, setBakeResult] = useState<number | null>(null)

  // Collect all keyframable objects for the target selector
  const textOverlays = useTextOverlayStore((s) => s.overlays)
  const shapes = useShapeStore((s) => s.shapes)
  const mediaItems = useMediaStore((s) => s.canvasItems)

  const targetObjects = useMemo(() => {
    const objects: { key: string; label: string; objectType: string; objectId: string }[] = []

    for (const overlay of textOverlays) {
      objects.push({
        key: `text:${overlay.id}`,
        label: `Text: ${overlay.content?.slice(0, 20) || 'Untitled'}`,
        objectType: 'text',
        objectId: overlay.id,
      })
    }

    for (const shape of shapes) {
      objects.push({
        key: `shape:${shape.id}`,
        label: `Shape: ${shape.type || 'Unknown'}`,
        objectType: 'shape',
        objectId: shape.id,
      })
    }

    for (const item of mediaItems) {
      objects.push({
        key: `media:${item.id}`,
        label: `Media: ${item.id.slice(0, 12)}`,
        objectType: 'media',
        objectId: item.id,
      })
    }

    return objects
  }, [textOverlays, shapes, mediaItems])

  const handleAddMapping = useCallback(() => {
    const firstObj = targetObjects[0]
    if (!firstObj) return

    addMapping({
      audioSource: 'music',
      frequencyBand: 'bass',
      targetObjectRef: { objectType: firstObj.objectType, objectId: firstObj.objectId },
      targetProperty: 'scale',
      sensitivity: 0.7,
      smoothing: 50,
      minValue: 0,
      maxValue: 0.15,
      invert: false,
    })
  }, [addMapping, targetObjects])

  const handleBake = useCallback(async () => {
    setIsBaking(true)
    setBakeResult(null)

    try {
      // Try to get audio from media store
      const mediaStore = useMediaStore.getState()
      const audioAsset = mediaStore.assets.find((a) => a.category === 'audio' || a.type?.startsWith('audio/'))
      if (!audioAsset) {
        console.warn('[AudioReactive] No audio asset found for baking')
        setIsBaking(false)
        return
      }

      const response = await fetch(audioAsset.url)
      const arrayBuffer = await response.arrayBuffer()
      const ctx = new AudioContext()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      await ctx.close()

      const count = await bakeToKeyframes(fps, totalFrames, audioBuffer)
      setBakeResult(count)
    } catch (err) {
      console.error('[AudioReactive] Bake failed:', err)
    } finally {
      setIsBaking(false)
    }
  }, [bakeToKeyframes, fps, totalFrames])

  return (
    <PanelLayout icon={Activity} title="Audio Reactive" iconClassName="text-green-400">
      {/* Active Toggle */}
      <PanelToggle
        label="Audio Reactive"
        checked={isActive}
        onChange={setActive}
      />

      {/* Preview Mode */}
      <PanelToggle
        label="Live Preview"
        checked={previewMode}
        onChange={setPreviewMode}
        description="during playback"
      />

      {/* Preset Mappings */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase">Presets</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                const firstObj = targetObjects[0]
                if (firstObj) {
                  applyPreset(preset.id, { objectType: firstObj.objectType, objectId: firstObj.objectId })
                }
              }}
              disabled={targetObjects.length === 0}
              className="p-2 bg-black/20 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors text-center disabled:opacity-50"
            >
              <Wand2 size={12} className="mx-auto text-green-400 mb-1" />
              <div className="text-[9px] text-zinc-300">{preset.label}</div>
              <div className="text-[8px] text-zinc-600">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mappings List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase">Mappings</h4>
          <button
            onClick={handleAddMapping}
            disabled={targetObjects.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            <Plus size={10} />
            Add
          </button>
        </div>

        {mappings.length === 0 ? (
          <p className="text-[10px] text-zinc-600 text-center py-4">
            {targetObjects.length === 0
              ? 'Add objects to the canvas first, then create mappings.'
              : 'No mappings yet. Add one or use a preset.'}
          </p>
        ) : (
          <div className="space-y-2">
            {mappings.map((mapping) => (
              <MappingCard
                key={mapping.id}
                mapping={mapping}
                onUpdate={(updates) => updateMapping(mapping.id, updates)}
                onRemove={() => removeMapping(mapping.id)}
                objects={targetObjects}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bake to Keyframes */}
      {mappings.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={handleBake}
            disabled={isBaking}
            className={cn(
              'w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200',
              isBaking
                ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 shadow-lg'
            )}
          >
            <Download size={14} />
            {isBaking ? 'Baking...' : 'Bake to Keyframes'}
          </button>

          {bakeResult !== null && (
            <p className="text-[10px] text-green-400 text-center">
              Baked {bakeResult.toLocaleString()} keyframes (tagged &apos;audio-reactive&apos;)
            </p>
          )}
        </div>
      )}

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}
