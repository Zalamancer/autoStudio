import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import type { UnifiedClip } from '@/types/unifiedTimeline'
import type { BeatSyncEffect, CanvasObjectRef } from '@/types/keyframes'
import { clipSourceToKeyframableType } from '@/services/beatSync'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'

const EFFECTS: { value: BeatSyncEffect; label: string }[] = [
  { value: 'scale-pulse', label: 'Scale Pulse' },
  { value: 'opacity-flash', label: 'Opacity Flash' },
  { value: 'bounce', label: 'Bounce' },
]

const SUBDIVISIONS: { value: 1 | 2 | 4; label: string }[] = [
  { value: 1, label: 'Every beat' },
  { value: 2, label: 'Every 2nd beat' },
  { value: 4, label: 'Every 4th beat' },
]

function clipToObjectRef(clip: UnifiedClip): CanvasObjectRef | null {
  const objectType = clipSourceToKeyframableType(clip.sourceType)
  if (!objectType) return null
  return { objectType, objectId: clip.sourceId }
}

interface BeatSyncPopoverProps {
  clips: UnifiedClip[]
  x: number
  y: number
  onClose: () => void
}

export function BeatSyncPopover({ clips, x, y, onClose }: BeatSyncPopoverProps) {
  const objectConfigs = useBeatSyncStore((s) => s.objectConfigs)
  const applyObjectBeatSync = useBeatSyncStore((s) => s.applyObjectBeatSync)
  const clearObjectBeatSync = useBeatSyncStore((s) => s.clearObjectBeatSync)
  const fps = usePlaybackStore((s) => s.fps)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Derive valid object refs
  const objectRefs = clips
    .map((c) => ({ clip: c, ref: clipToObjectRef(c) }))
    .filter((e): e is { clip: UnifiedClip; ref: CanvasObjectRef } => e.ref !== null)

  // Pre-fill from existing config (use first clip's config if exists)
  const firstKey = objectRefs.length > 0
    ? `${objectRefs[0].ref.objectType}:${objectRefs[0].ref.objectId}`
    : null
  const existing = firstKey ? objectConfigs[firstKey] : undefined

  const [effect, setEffect] = useState<BeatSyncEffect>(existing?.effect ?? 'scale-pulse')
  const [subdivision, setSubdivision] = useState<1 | 2 | 4>(existing?.subdivision ?? 1)
  const [offset, setOffset] = useState(existing?.offset ?? 0)
  const [intensity, setIntensity] = useState(existing?.intensity ?? 0.75)

  // Close on Escape or outside click
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  // Reset offset when subdivision changes
  useEffect(() => {
    if (offset >= subdivision) setOffset(0)
  }, [subdivision, offset])

  const handleApply = useCallback(() => {
    const configs = objectRefs.map(({ ref }) => ({
      objectRef: ref,
      effect,
      subdivision,
      offset,
      intensity,
    }))

    const clipRanges: Record<string, { startFrame: number; endFrame: number }> = {}
    for (const { clip, ref } of objectRefs) {
      clipRanges[`${ref.objectType}:${ref.objectId}`] = {
        startFrame: clip.startFrame,
        endFrame: clip.endFrame,
      }
    }

    applyObjectBeatSync(configs, fps, clipRanges)
    onClose()
  }, [objectRefs, effect, subdivision, offset, intensity, fps, applyObjectBeatSync, onClose])

  const handleClear = useCallback(() => {
    clearObjectBeatSync(objectRefs.map((o) => o.ref))
    onClose()
  }, [objectRefs, clearObjectBeatSync, onClose])

  if (objectRefs.length === 0) return null

  const offsetOptions = Array.from({ length: subdivision }, (_, i) => i)

  return (
    <div
      ref={popoverRef}
      className="fixed z-[200] bg-zinc-800 border border-zinc-600 rounded-lg shadow-2xl p-3 w-[240px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-zinc-200">Sync to Beats</span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Effect */}
      <PanelSelect
        label="Effect"
        value={effect}
        onChange={(v) => setEffect(v as BeatSyncEffect)}
        options={EFFECTS}
        fullWidth
      />

      {/* Subdivision */}
      <PanelSelect
        label="Every"
        value={String(subdivision)}
        onChange={(v) => setSubdivision(Number(v) as 1 | 2 | 4)}
        options={SUBDIVISIONS.map((s) => ({ value: String(s.value), label: s.label }))}
        fullWidth
      />

      {/* Offset */}
      {subdivision > 1 && (
        <PanelSelect
          label="Offset"
          value={String(offset)}
          onChange={(v) => setOffset(Number(v))}
          options={offsetOptions.map((o) => ({ value: String(o), label: String(o) }))}
          fullWidth
        />
      )}

      {/* Intensity */}
      <div className="mb-3">
        <PanelSlider
          label="Intensity"
          value={intensity}
          onChange={setIntensity}
          min={0}
          max={1}
          step={0.05}
          precision={0}
          compact
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2">
        <button
          onClick={handleClear}
          className="px-3 py-1 text-[10px] rounded bg-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1 text-[10px] rounded bg-pink-600 text-white hover:bg-pink-500 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
