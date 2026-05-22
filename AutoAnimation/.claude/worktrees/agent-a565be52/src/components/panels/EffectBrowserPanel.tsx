import { useState, useMemo, useCallback } from 'react'
import { Wand, Search, Sparkles, Palette, Film, Settings, Flame, Leaf, RefreshCw, Zap, ScanFace, PartyPopper, ArrowRightLeft, Clapperboard, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEffectCategories, getEffectsByCategory, searchEffects } from '@/services/effectCategoryRegistry'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { getEffectDefaults, type StyleEffectType } from '@/types/styleEffects'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  basic: <Square size={13} />,
  artistic: <Palette size={13} />,
  retro: <Film size={13} />,
  advanced: <Settings size={13} />,
  elemental: <Flame size={13} />,
  supernatural: <Sparkles size={13} />,
  nature: <Leaf size={13} />,
  transformation: <RefreshCw size={13} />,
  action: <Zap size={13} />,
  distortion: <Zap size={13} />,
  facial: <ScanFace size={13} />,
  novelty: <PartyPopper size={13} />,
  transition: <ArrowRightLeft size={13} />,
  cinema: <Clapperboard size={13} />,
}

export function EffectBrowserPanel() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const setActiveStyleEffect = useCharacterPartsStore(s => s.setActiveStyleEffect)

  const categories = useMemo(() => getEffectCategories(), [])

  const effects = useMemo(() => {
    if (query.trim()) return searchEffects(query)
    if (selectedCategory) return getEffectsByCategory(selectedCategory)
    return []
  }, [query, selectedCategory])

  const handleApplyEffect = useCallback((effectType: StyleEffectType) => {
    setActiveStyleEffect({ type: effectType, settings: getEffectDefaults(effectType) })
  }, [setActiveStyleEffect])

  const showAll = !selectedCategory && !query.trim()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Wand size={16} className="text-green-400" />
          <span className="text-sm font-medium text-zinc-200">Effect Browser</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search effects..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/5 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-green-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-3 py-2 border-b border-white/5 overflow-x-auto">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap',
              !selectedCategory
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300'
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap',
                selectedCategory === cat.id
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300'
              )}
            >
              {CATEGORY_ICONS[cat.id]}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Effects Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {showAll ? (
          <div className="space-y-3">
            {categories.map(cat => {
              const catEffects = getEffectsByCategory(cat.id)
              if (catEffects.length === 0) return null
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-1.5 mb-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {CATEGORY_ICONS[cat.id]}
                    {cat.label}
                    <span className="text-zinc-600 ml-1">({catEffects.length})</span>
                  </button>
                  <div className="grid grid-cols-2 gap-1.5">
                    {catEffects.slice(0, 4).map(effect => (
                      <EffectCard key={effect.type} effect={effect} onApply={handleApplyEffect} />
                    ))}
                  </div>
                  {catEffects.length > 4 && (
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className="mt-1 text-[10px] text-green-500 hover:text-green-400 transition-colors"
                    >
                      +{catEffects.length - 4} more
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : effects.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            {effects.map(effect => (
              <EffectCard key={effect.type} effect={effect} onApply={handleApplyEffect} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
            <Sparkles size={24} className="mb-2" />
            <span className="text-[12px]">No effects found</span>
          </div>
        )}
      </div>
    </div>
  )
}

function EffectCard({ effect, onApply }: { effect: { type: StyleEffectType; label: string; icon: string; category: string; presets: { label: string }[] }; onApply: (type: StyleEffectType) => void }) {
  return (
    <button
      onClick={() => onApply(effect.type)}
      className="flex flex-col items-start gap-1 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-transparent hover:border-green-500/20 transition-all text-left group"
    >
      <div className="text-[12px] font-medium text-zinc-300 group-hover:text-white transition-colors truncate w-full">
        {effect.label}
      </div>
      <div className="text-[10px] text-zinc-600">
        {effect.presets.length} presets
      </div>
    </button>
  )
}
