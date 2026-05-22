import { useState, useCallback, useMemo } from 'react'
import {
  Paintbrush,
  Pencil,
  Grid3X3,
  RotateCcw,
  Stamp,
  Sparkles,
  Palette,
  Zap,
  MonitorOff,
  Tv,
  PenLine,
  Circle,
  Box,
  Droplets,
  Shapes,
} from 'lucide-react'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { BoilingLineSection } from './BoilingLineSection'
import { PixelArtEffectSection } from './PixelArtEffectSection'
import { StyleEffectSection } from './effects/StyleEffectSection'
import {
  STYLE_EFFECT_REGISTRY,
  type StyleEffectType,
  type ActiveStyleEffect,
  getEffectDefaults,
} from '@/types/styleEffects'

// Icon map for the registry
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Grid3X3,
  Stamp,
  Sparkles,
  Palette,
  Zap,
  MonitorOff,
  Tv,
  PenLine,
  Circle,
  Box,
  Droplets,
  Shapes,
}

export function StylePanel() {
  const [selectedPanel, setSelectedPanel] = useState<'boiling-line' | StyleEffectType | null>(null)
  const activeDialogueChar = useMultiCharacterStore((s) => {
    const id = s.activeCharacterId
    return id ? s.characters.find((c) => c.id === id) : null
  })
  const updateDialogueCharacter = useMultiCharacterStore((s) => s.updateDialogueCharacter)

  const activeEffect = activeDialogueChar?.activeStyleEffect
  const activeType = activeEffect?.type ?? (activeDialogueChar?.pixelArt?.enabled ? ('pixel-art' as const) : null)

  const handleReset = useCallback(() => {
    if (!activeDialogueChar) return
    updateDialogueCharacter(activeDialogueChar.id, {
      boilingLine: undefined,
      pixelArt: undefined,
      activeStyleEffect: undefined,
    })
    setSelectedPanel(null)
  }, [activeDialogueChar, updateDialogueCharacter])

  const handleSelectEffect = useCallback(
    (type: StyleEffectType) => {
      if (!activeDialogueChar) return

      if (type === activeType) {
        // Toggle off
        updateDialogueCharacter(activeDialogueChar.id, {
          pixelArt: undefined,
          activeStyleEffect: undefined,
        })
        setSelectedPanel(null)
        return
      }

      // Disable other Canvas 2D effects (mutual exclusivity)
      if (type === 'pixel-art') {
        updateDialogueCharacter(activeDialogueChar.id, {
          pixelArt: { enabled: true, pixelSize: 8, colorLevels: 8, outline: true },
          activeStyleEffect: undefined,
        })
      } else {
        const defaults = getEffectDefaults(type)
        updateDialogueCharacter(activeDialogueChar.id, {
          pixelArt: undefined,
          activeStyleEffect: { type, settings: { ...defaults, enabled: true } },
        })
      }
      setSelectedPanel(type)
    },
    [activeDialogueChar, activeType, updateDialogueCharacter],
  )

  const handleUpdateStyleEffect = useCallback(
    (effect: ActiveStyleEffect | undefined) => {
      if (!activeDialogueChar) return
      updateDialogueCharacter(activeDialogueChar.id, { activeStyleEffect: effect })
    },
    [activeDialogueChar, updateDialogueCharacter],
  )

  // Group registry by category (must be before early return to satisfy hooks rules)
  const categories = useMemo(() => {
    const cats: Record<string, typeof STYLE_EFFECT_REGISTRY> = {}
    for (const entry of STYLE_EFFECT_REGISTRY) {
      if (!cats[entry.category]) cats[entry.category] = []
      cats[entry.category].push(entry)
    }
    return cats
  }, [])

  if (!activeDialogueChar) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <Paintbrush className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No character selected</p>
        <p className="text-xs mt-1">Select a character on the canvas to edit its style</p>
      </div>
    )
  }

  const hasAnyEffect =
    activeDialogueChar.boilingLine?.enabled || activeDialogueChar.pixelArt?.enabled || activeEffect?.settings?.enabled

  const CATEGORY_LABELS: Record<string, string> = {
    basic: 'Basic',
    artistic: 'Artistic',
    retro: 'Retro',
    advanced: 'Advanced',
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-3 pt-2 pb-2 border-b border-white/5 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-300 flex-1">Style Effects</span>
        {hasAnyEffect && (
          <button
            onClick={handleReset}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Reset all effects"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* Boiling Line (SVG filter — always available, stacks with Canvas 2D effects) */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => setSelectedPanel(selectedPanel === 'boiling-line' ? null : 'boiling-line')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeDialogueChar.boilingLine?.enabled
              ? 'bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/30'
              : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white border border-transparent'
          }`}
        >
          <Pencil size={14} />
          <span>Boiling Line</span>
          {activeDialogueChar.boilingLine?.enabled && (
            <span className="ml-auto text-[10px] bg-[#4a7eff]/20 text-[#4a7eff] px-1.5 py-0.5 rounded">ON</span>
          )}
        </button>
      </div>

      {selectedPanel === 'boiling-line' && (
        <BoilingLineSection
          settings={activeDialogueChar.boilingLine}
          onChange={(settings) => updateDialogueCharacter(activeDialogueChar.id, { boilingLine: settings })}
        />
      )}

      {/* Canvas 2D Effects Grid (mutually exclusive) */}
      <div className="px-3 pt-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Canvas Effects</span>
      </div>

      {Object.entries(categories).map(([cat, entries]) => (
        <div key={cat} className="px-3 pt-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">{CATEGORY_LABELS[cat] || cat}</span>
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {entries.map((entry) => {
              const Icon = ICON_MAP[entry.icon] || Paintbrush
              const isActive = activeType === entry.type
              return (
                <button
                  key={entry.type}
                  onClick={() => handleSelectEffect(entry.type)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[11px] transition-colors ${
                    isActive
                      ? 'bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/30'
                      : 'bg-[#2a2a2a] text-gray-500 hover:bg-[#3a3a3a] hover:text-gray-300 border border-transparent'
                  }`}
                  title={entry.label}
                >
                  <Icon size={16} />
                  <span className="truncate w-full text-center">{entry.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Settings panel for selected effect */}
      {activeType && selectedPanel !== 'boiling-line' && (
        <div className="mt-2 border-t border-white/5">
          {activeType === 'pixel-art' ? (
            <PixelArtEffectSection
              settings={activeDialogueChar.pixelArt}
              onChange={(settings) => updateDialogueCharacter(activeDialogueChar.id, { pixelArt: settings })}
            />
          ) : activeEffect ? (
            <StyleEffectSection effect={activeEffect} onChange={handleUpdateStyleEffect} />
          ) : null}
        </div>
      )}
    </div>
  )
}
