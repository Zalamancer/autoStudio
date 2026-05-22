/**
 * TextAnimationsPanel — animation preset picker for text overlays.
 */
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { TEXT_ANIMATION_PRESETS, CATEGORY_INFO, type TextAnimationCategory } from '@/services/textAnimationPresets'
import { cn } from '@/lib/utils'

const SORTED_ANIM_CATEGORIES = Object.entries(CATEGORY_INFO)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([id]) => id as TextAnimationCategory)

export function TextAnimationsPanel() {
  const overlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const [activeCategory, setActiveCategory] = useState<TextAnimationCategory | 'all'>('all')

  if (!overlay) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No text selected</p>
        <p className="text-[10px] mt-1">Select a text overlay to apply animation</p>
      </div>
    )
  }

  const currentPresetId = overlay.animationPreset
  const filteredPresets = activeCategory === 'all' ? TEXT_ANIMATION_PRESETS : TEXT_ANIMATION_PRESETS.filter((p) => p.category === activeCategory)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {currentPresetId && currentPresetId !== 'none' && (
        <div className="mx-4 mt-3 flex items-center justify-between bg-[#4a7eff]/10 border border-[#4a7eff]/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-[#4a7eff]" />
            <span className="text-[11px] text-white font-medium">{TEXT_ANIMATION_PRESETS.find((p) => p.id === currentPresetId)?.name}</span>
          </div>
          <button onClick={() => updateOverlay(overlay.id, { animationPreset: 'none' })} className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5">Remove</button>
        </div>
      )}
      <div className="flex flex-wrap gap-1 p-4 pb-2">
        <button onClick={() => setActiveCategory('all')} className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors', activeCategory === 'all' ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]')}>All</button>
        {SORTED_ANIM_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors', activeCategory === cat ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]')}>
            {CATEGORY_INFO[cat].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-4">
        {filteredPresets.map((preset) => (
          <button key={preset.id} onClick={() => updateOverlay(overlay.id, { animationPreset: preset.id })} className={cn('px-3 py-3 rounded-lg text-[11px] font-medium transition-all text-center leading-tight', currentPresetId === preset.id ? 'bg-[#4a7eff] text-white ring-1 ring-[#4a7eff]/50 shadow-lg shadow-[#4a7eff]/20' : 'bg-[#2a2a2a] text-zinc-400 hover:bg-[#3a3a3a] hover:text-white')} title={`${preset.name} (${CATEGORY_INFO[preset.category]?.label})`}>
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}
