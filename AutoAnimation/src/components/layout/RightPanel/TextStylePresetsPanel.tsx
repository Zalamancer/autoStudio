/**
 * TextStylePresetsPanel — style preset picker for text overlays.
 */
import { useState } from 'react'
import { Paintbrush } from 'lucide-react'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import type { FontFamily, FontWeight, TextCase, TextOverlay } from '@/stores/useTextOverlayStore'
import { cn } from '@/lib/utils'
import { NEON_GLOW_PRESETS } from '@/data/neonGlowPresets'
import { GRADIENT_TEXT_PRESETS } from '@/data/gradientTextPresets'
import { TEXT_3D_STYLE_PRESETS } from '@/data/text3DStylePresets'
import { CINEMATIC_TEXT_PRESETS } from '@/services/cinematicTextPresets'
import { COMIC_TEXT_STYLE_PRESETS } from '@/data/comicTextStylePresets'
import { GAMING_TEXT_PRESETS } from '@/data/gamingTextPresets'
import { ELEMENTAL_TEXT_PRESETS } from '@/data/elementalTextPresets'
import { HIGHLIGHTED_TEXT_PRESETS } from '@/data/highlightedTextPresets'

type StyleCategory = 'all' | 'neon' | 'gradient' | '3d' | 'cinematic' | 'comic' | 'gaming' | 'elemental' | 'highlighted'

const STYLE_CATEGORIES: { id: StyleCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'neon', label: 'Neon' },
  { id: 'gradient', label: 'Gradient' },
  { id: '3d', label: '3D Depth' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'comic', label: 'Comic' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'elemental', label: 'Elemental' },
  { id: 'highlighted', label: 'Highlighted' },
]

interface UnifiedStylePreset {
  id: string
  name: string
  category: StyleCategory
  color: string
  previewColors: [string, string]
  apply: () => Partial<TextOverlay>
}

const ALL_STYLE_PRESETS: UnifiedStylePreset[] = [
  ...NEON_GLOW_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: 'neon' as StyleCategory, color: p.color, previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily, fontWeight: p.fontWeight, color: p.color, textShadow: p.textShadow, webkitTextStroke: p.WebkitTextStroke, letterSpacing: p.letterSpacing, shadow: false, textStylePreset: p.id }),
  })),
  ...GRADIENT_TEXT_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: 'gradient' as StyleCategory, color: '#ffffff',
    previewColors: [p.style.textShadow ? '#ffffff' : '#ffffff', p.style.background.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#888888'] as [string, string],
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily as FontFamily, fontWeight: p.fontWeight as FontWeight, color: '#ffffff', textShadow: p.style.textShadow, webkitTextStroke: p.style.WebkitTextStroke, shadow: false, textStylePreset: p.id }),
  })),
  ...TEXT_3D_STYLE_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: '3d' as StyleCategory, color: p.color,
    previewColors: [p.color, p.textShadow.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#333333'] as [string, string],
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily as FontFamily, fontWeight: p.fontWeight as FontWeight, color: p.color, textShadow: p.textShadow, webkitTextStroke: p.WebkitTextStroke, shadow: false, textStylePreset: p.id }),
  })),
  ...CINEMATIC_TEXT_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: 'cinematic' as StyleCategory, color: p.color,
    previewColors: [p.color, p.textShadow.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#000000'] as [string, string],
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily, fontWeight: p.fontWeight, color: p.color, letterSpacing: p.letterSpacing, textCase: p.textCase, fontSize: p.suggestedFontSize, textShadow: p.textShadow, webkitTextStroke: p.webkitTextStroke, shadow: false, textStylePreset: p.id }),
  })),
  ...COMIC_TEXT_STYLE_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: 'comic' as StyleCategory, color: p.color, previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily, fontWeight: p.fontWeight, color: p.color, textShadow: p.textShadow, webkitTextStroke: p.WebkitTextStroke, letterSpacing: p.letterSpacing, shadow: false, textStylePreset: p.id }),
  })),
  ...GAMING_TEXT_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: 'gaming' as StyleCategory, color: p.color, previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily, fontWeight: p.fontWeight, color: p.color, textShadow: p.textShadow, webkitTextStroke: p.WebkitTextStroke, letterSpacing: p.letterSpacing, shadow: false, textStylePreset: p.id }),
  })),
  ...ELEMENTAL_TEXT_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: 'elemental' as StyleCategory, color: p.color, previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily, fontWeight: p.fontWeight, color: p.color, textShadow: p.textShadow, webkitTextStroke: p.webkitTextStroke, letterSpacing: p.letterSpacing, textCase: p.textCase as TextCase, shadow: false, textStylePreset: p.id }),
  })),
  ...HIGHLIGHTED_TEXT_PRESETS.map((p) => ({
    id: p.id, name: p.name, category: 'highlighted' as StyleCategory, color: p.color, previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({ fontFamily: p.fontFamily, fontWeight: p.fontWeight, color: p.color, background: true, backgroundColor: p.backgroundColor, backgroundOpacity: p.backgroundOpacity, backgroundPaddingX: p.backgroundPaddingX, backgroundPaddingY: p.backgroundPaddingY, backgroundBorderRadius: p.backgroundBorderRadius, backgroundBorder: p.backgroundBorder, textShadow: p.textShadow, webkitTextStroke: p.webkitTextStroke, letterSpacing: p.letterSpacing, textCase: p.textCase as TextCase, shadow: false, textStylePreset: p.id }),
  })),
]

export function TextStylePresetsPanel() {
  const overlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const [activeCategory, setActiveCategory] = useState<StyleCategory>('all')

  if (!overlay) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Paintbrush size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No text selected</p>
        <p className="text-[10px] mt-1">Select a text overlay to apply styles</p>
      </div>
    )
  }

  const currentPresetId = overlay.textStylePreset
  const filteredPresets = activeCategory === 'all' ? ALL_STYLE_PRESETS : ALL_STYLE_PRESETS.filter((p) => p.category === activeCategory)

  const handleApplyPreset = (preset: UnifiedStylePreset) => {
    const updates = preset.apply()
    if (preset.category !== 'highlighted' && overlay.background) updates.background = false
    updateOverlay(overlay.id, updates)
  }

  const handleClearStyle = () => {
    updateOverlay(overlay.id, {
      textShadow: undefined, webkitTextStroke: undefined, textStylePreset: undefined,
      shadow: false, background: false, backgroundColor: undefined, backgroundBorder: undefined,
      backgroundBorderRadius: undefined, backgroundPaddingX: undefined, backgroundPaddingY: undefined,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {currentPresetId && (
        <div className="mx-4 mt-3 flex items-center justify-between bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Paintbrush size={12} className="text-accent" />
            <span className="text-[11px] text-white font-medium">{ALL_STYLE_PRESETS.find((p) => p.id === currentPresetId)?.name ?? currentPresetId}</span>
          </div>
          <button onClick={handleClearStyle} className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5">Clear</button>
        </div>
      )}
      <div className="flex flex-wrap gap-1 p-4 pb-2">
        {STYLE_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors', activeCategory === cat.id ? 'bg-accent text-white' : 'bg-panel-surface text-zinc-400 hover:text-white hover:bg-panel-surface-hover')}>
            {cat.label}
          </button>
        ))}
      </div>
      <div className="px-4 pb-2"><span className="text-[10px] text-zinc-500">{filteredPresets.length} styles</span></div>
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-4">
        {filteredPresets.map((preset) => (
          <button key={preset.id} onClick={() => handleApplyPreset(preset)} className={cn('relative px-3 py-3 rounded-lg text-[11px] font-medium transition-all text-center leading-tight overflow-hidden', currentPresetId === preset.id ? 'ring-2 ring-accent shadow-lg shadow-accent/20' : 'hover:ring-1 hover:ring-white/20')} style={{ backgroundColor: '#1a1a1a' }} title={preset.name}>
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
              <div className="flex-1" style={{ backgroundColor: preset.previewColors[0] }} />
              <div className="flex-1" style={{ backgroundColor: preset.previewColors[1] }} />
            </div>
            <span className="block mt-1 truncate" style={{ color: preset.previewColors[0] }}>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
