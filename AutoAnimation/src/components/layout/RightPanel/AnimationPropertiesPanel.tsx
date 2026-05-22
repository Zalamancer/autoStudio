import { Sparkles, Trash2 } from 'lucide-react'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { recordPropertyChange } from '@/hooks/usePropertyRecorder'
import { cn } from '@/lib/utils'
import { BlendModeSelector } from '@/components/ui/BlendModeSelector'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'
import { BLUR_PRESETS } from '@/services/effects/blurEffect'

export function AnimationPropertiesPanel() {
  const selectedActiveId = useAnimationStore((s) => s.selectedActiveId)
  const activeAnimations = useAnimationStore((s) => s.activeAnimations)
  const library = useAnimationStore((s) => s.library)
  const updateActiveAnimation = useAnimationStore((s) => s.updateActiveAnimation)
  const removeFromCanvas = useAnimationStore((s) => s.removeFromCanvas)
  const setSelectedActiveId = useAnimationStore((s) => s.setSelectedActiveId)

  const anim = activeAnimations.find((a) => a.id === selectedActiveId)
  const libraryItem = anim ? library.find((l) => l.id === anim.animationId) : null

  if (!anim) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No animation selected</p>
        <p className="text-[10px] mt-1">Click an animation on the canvas or timeline</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-sm font-medium text-zinc-200 truncate">{libraryItem?.name || 'Animation'}</span>
          <span className="text-[10px] text-zinc-600 ml-auto">{libraryItem?.category}</span>
        </div>
      </div>

      {/* Playback */}
      <div className="p-4 border-b border-white/5 space-y-2">
        <h2 className="text-white text-base font-semibold mb-2">Playback</h2>
        <PanelSlider label="Speed" value={anim.speed} onChange={(v) => updateActiveAnimation(anim.id, { speed: Math.max(0.1, v) })} min={0.1} max={5} step={0.1} precision={1} suffix="×" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 w-14 shrink-0">Loop</span>
          <button
            onClick={() => updateActiveAnimation(anim.id, { loop: !anim.loop })}
            className={cn(
              'relative w-10 h-6 rounded-full transition-colors',
              anim.loop ? 'bg-accent' : 'bg-panel-surface-hover'
            )}
          >
            <span className={cn(
              'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
              anim.loop && 'translate-x-4'
            )} />
          </button>
        </div>
      </div>

      {/* Transform */}
      <div className="p-4 border-b border-white/5 space-y-2">
        <h2 className="text-white text-base font-semibold mb-2">Transform</h2>

        <PanelSlider label="X" value={anim.position.x} onChange={(v) => {
          updateActiveAnimation(anim.id, { position: { ...anim.position, x: v } })
          recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'position.x', v, anim.position.x)
        }} min={-5000} max={5000} step={1} compact />
        <PanelSlider label="Y" value={anim.position.y} onChange={(v) => {
          updateActiveAnimation(anim.id, { position: { ...anim.position, y: v } })
          recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'position.y', v, anim.position.y)
        }} min={-5000} max={5000} step={1} compact />

        <PanelSlider label="Scale" value={anim.scale * 100} onChange={(v) => {
          const val = Math.max(0.05, v / 100)
          updateActiveAnimation(anim.id, { scale: val })
          recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'scale', val, anim.scale)
        }} min={5} max={500} step={1} suffix="%" />

        <PanelSlider label="Opacity" value={anim.opacity * 100} onChange={(v) => {
          const val = Math.min(1, Math.max(0, v / 100))
          updateActiveAnimation(anim.id, { opacity: val })
          recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'opacity', val, anim.opacity)
        }} min={0} max={100} step={1} suffix="%" />

        <PanelSlider label="Z-Index" value={anim.zIndex} onChange={(v) => {
          const val = Math.round(v)
          updateActiveAnimation(anim.id, { zIndex: val })
          recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'zIndex', val, anim.zIndex)
        }} min={-100} max={100} step={1} />

        {/* Blend Mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 w-14 shrink-0">Blend</span>
          <div className="flex-1">
            <BlendModeSelector
              value={(anim.blendMode ?? 'source-over') as BlendMode}
              onChange={(mode) => updateActiveAnimation(anim.id, { blendMode: mode })}
              className="w-full bg-panel-surface text-white text-xs px-2 py-1.5 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Blur */}
        <PanelSlider label="Blur" value={anim.blur ?? 0} onChange={(v) => updateActiveAnimation(anim.id, { blur: Math.max(0, v) })} min={0} max={50} step={0.5} precision={1} suffix="px" />
        {(anim.blur ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 w-14 shrink-0">Type</span>
            <div className="flex-1 flex gap-1">
              <PanelSelect
                value={anim.blurType ?? 'gaussian'}
                onChange={(v) => updateActiveAnimation(anim.id, { blurType: v as BlurType })}
                options={[
                  { value: 'gaussian', label: 'Gaussian' },
                  { value: 'motion', label: 'Motion' },
                  { value: 'tilt-shift', label: 'Tilt-Shift' },
                ]}
              />
              <PanelSelect
                value=""
                onChange={(v) => {
                  const preset = BLUR_PRESETS.find((p) => p.label === v)
                  if (preset) {
                    updateActiveAnimation(anim.id, {
                      blur: preset.blur,
                      blurType: preset.type as BlurType,
                      motionBlurAngle: preset.angle ?? 0,
                    })
                  }
                }}
                options={[
                  { value: '', label: 'Preset' },
                  ...BLUR_PRESETS.map((p) => ({ value: p.label, label: p.label })),
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        <button onClick={() => { removeFromCanvas(anim.id); setSelectedActiveId(null) }} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/10 text-red-400 text-sm rounded-lg hover:bg-red-600/20 transition-colors">
          <Trash2 size={14} /> Remove from Canvas
        </button>

        {/* Other Animations */}
        {activeAnimations.length > 1 && (
          <div className="space-y-1 pt-3 mt-3 border-t border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Animations</span>
            {activeAnimations.filter((a) => a.id !== anim.id).map((a) => {
              const item = library.find((l) => l.id === a.animationId)
              return (
                <button key={a.id} onClick={() => setSelectedActiveId(a.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-panel-surface hover:bg-[#333] transition-colors text-left">
                  <Sparkles size={10} className="text-cyan-400 flex-shrink-0" />
                  <span className="text-xs text-zinc-300 truncate">{item?.name || 'Animation'}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
