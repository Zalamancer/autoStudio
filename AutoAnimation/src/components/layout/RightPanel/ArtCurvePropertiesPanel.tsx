import { useMemo } from 'react'
import { Palette, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { ColorPicker } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useArtCurveStore } from '@/stores/useArtCurveStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { cn } from '@/lib/utils'

const ART_CURVE_STYLE_LABELS: Record<string, string> = {
  swirl: 'Swirl',
}

export function ArtCurvePropertiesPanel() {
  const selectedId = useArtCurveStore((s) => s.selectedCompositionId)
  const compositions = useArtCurveStore((s) => s.compositions)
  const updateComposition = useArtCurveStore((s) => s.updateComposition)
  const removeComposition = useArtCurveStore((s) => s.removeComposition)
  const setSelectedId = useArtCurveStore((s) => s.setSelectedCompositionId)

  const liveTransform = useLiveTransformStore((s) => s.active)

  const comp = compositions.find((c) => c.id === selectedId)

  // Use live transform values when actively manipulating
  const isLiveActive = liveTransform?.type === 'shape' && liveTransform?.id === comp?.id
  const displayValues = useMemo(() => {
    if (!comp) return null
    if (isLiveActive && liveTransform) {
      return {
        x: liveTransform.x,
        y: liveTransform.y,
        rotation: liveTransform.rotation,
        scale: liveTransform.scale ?? comp.scale,
        opacity: comp.opacity,
        zIndex: comp.zIndex,
      }
    }
    return {
      x: comp.position.x,
      y: comp.position.y,
      rotation: comp.rotation,
      scale: comp.scale,
      opacity: comp.opacity,
      zIndex: comp.zIndex,
    }
  }, [comp, isLiveActive, liveTransform])

  if (!comp || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Palette size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No art curve selected</p>
        <p className="text-[10px] mt-1">Click an art curve on the canvas to edit its properties</p>
      </div>
    )
  }

  const handleReset = () => {
    updateComposition(comp.id, {
      position: { x: 100, y: 100 },
      rotation: 0,
      opacity: 1,
      scale: 1,
      zIndex: 6,
    })
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Preview swatch */}
        <div className="w-14 h-14 bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-700/50 flex items-center justify-center">
          <div className="flex gap-0.5">
            {comp.palette.slice(0, 4).map((c, i) => (
              <div key={i} className="w-3 h-8 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 truncate">{comp.name}</p>
          <p className="text-[10px] text-zinc-500">{ART_CURVE_STYLE_LABELS[comp.style] || comp.style}</p>
          <p className="text-[10px] text-zinc-600">{comp.curves.length} curves</p>
        </div>
      </div>

      {/* Transform Section */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', isLiveActive ? 'bg-green-400 animate-pulse' : 'bg-amber-400')} />
            <span className="text-sm text-zinc-300">Transform</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateComposition(comp.id, { visible: !comp.visible })}
              className={cn(
                'p-1 rounded transition-colors',
                comp.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
              )}
              title={comp.visible ? 'Hide' : 'Show'}
            >
              {comp.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={handleReset}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset transform"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <div className={cn('p-3 space-y-3 bg-zinc-900/30', !comp.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <PanelSlider
            label="X"
            value={displayValues.x}
            onChange={(v) => updateComposition(comp.id, { position: { ...comp.position, x: v } })}
            min={-5000}
            max={5000}
            step={1}
            precision={1}
            compact
          />
          <PanelSlider
            label="Y"
            value={displayValues.y}
            onChange={(v) => updateComposition(comp.id, { position: { ...comp.position, y: v } })}
            min={-5000}
            max={5000}
            step={1}
            precision={1}
            compact
          />

          {/* Scale */}
          <PanelSlider
            label="Scale"
            value={displayValues.scale * 100}
            onChange={(v) => updateComposition(comp.id, { scale: Math.max(0.1, v / 100) })}
            min={10}
            max={500}
            step={5}
            suffix="%"
          />

          {/* Rotation */}
          <PanelSlider
            label="Rotation"
            value={displayValues.rotation}
            onChange={(v) => updateComposition(comp.id, { rotation: v })}
            min={-180}
            max={180}
            step={1}
            suffix="°"
          />

          {/* Opacity */}
          <PanelSlider
            label="Opacity"
            value={displayValues.opacity * 100}
            onChange={(v) => updateComposition(comp.id, { opacity: Math.min(1, Math.max(0, v / 100)) })}
            min={0}
            max={100}
            step={1}
            suffix="%"
          />

          {/* Z-Index */}
          <PanelSlider
            label="Z-Index"
            value={displayValues.zIndex}
            onChange={(v) => updateComposition(comp.id, { zIndex: Math.round(v) })}
            min={-100}
            max={100}
            step={1}
          />
        </div>
      </div>

      {/* Background Section */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Palette size={12} className="text-zinc-400" />
            <span className="text-xs text-zinc-300">Background</span>
          </div>
        </div>

        <div className="p-3 space-y-3 bg-zinc-900/30">
          {/* Transparent Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Transparent</span>
            <button
              onClick={() => updateComposition(comp.id, { bgTransparent: !comp.bgTransparent })}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors',
                comp.bgTransparent ? 'bg-accent' : 'bg-zinc-700'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  comp.bgTransparent ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* BG Color */}
          {!comp.bgTransparent && (
            <div className="flex items-center gap-2">
              <ColorPicker color={comp.bgColor} onChange={(c) => updateComposition(comp.id, { bgColor: c })} />
              <span className="text-xs text-zinc-400 flex-1">Color</span>
              <span className="text-[10px] text-zinc-500 font-mono">{comp.bgColor}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            removeComposition(comp.id)
            setSelectedId(null)
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
          title="Remove art curve"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>

      {/* Other Compositions Quick Select */}
      {compositions.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-zinc-700/50">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Art Curves</span>
          {compositions
            .filter((c) => c.id !== comp.id)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full text-left px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors flex items-center justify-between"
              >
                <span className="truncate">{c.name}</span>
                <span className="text-[10px] text-zinc-600">{ART_CURVE_STYLE_LABELS[c.style] || c.style}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
