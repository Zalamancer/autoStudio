/**
 * Voice Effects Panel — Grid of 12 audio effects with preview and apply.
 */

import { useState, useCallback } from 'react'
import {
  Waves,
  Repeat,
  ArrowUp,
  ArrowDown,
  Radio,
  Megaphone,
  Wind,
  Volume2,
  Bot,
  Squirrel,
  Mountain,
  Phone,
  Play,
  Square,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceEffectsStore } from '@/stores/useVoiceEffectsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { EFFECT_PRESETS } from '@/services/voiceEffects'
import type { VoiceEffectType } from '@/types/voiceEffects'
import { PanelSection } from '@/components/ui/panel-controls'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Waves,
  Repeat,
  ArrowUp,
  ArrowDown,
  Radio,
  Megaphone,
  Wind,
  Volume2,
  Bot,
  Squirrel,
  Mountain,
  Phone,
}

type ApplyMode = 'line' | 'character'

export function VoiceEffectsPanel() {
  const [applyMode, setApplyMode] = useState<ApplyMode>('character')
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [previewingEffect, setPreviewingEffect] = useState<VoiceEffectType | null>(null)
  const [noAudioWarning, setNoAudioWarning] = useState(false)

  const {
    lineEffects,
    characterEffects,
    isProcessing,
    previewContext,
    setLineEffect,
    setCharacterEffect,
    startPreview,
    stopPreview,
  } = useVoiceEffectsStore()

  const characters = useMultiCharacterStore((s) => s.characters)
  const lines = useMultiCharacterStore((s) => s.dialogueLines)
  const [selectedCharId, setSelectedCharId] = useState<string | null>(
    characters[0]?.id ?? null,
  )

  const activeEffect = applyMode === 'character' && selectedCharId
    ? characterEffects[selectedCharId] ?? null
    : applyMode === 'line' && selectedLineId
      ? lineEffects[selectedLineId] ?? null
      : null

  const handleSelectEffect = useCallback((effect: VoiceEffectType) => {
    if (applyMode === 'character' && selectedCharId) {
      // Toggle off if already selected
      const current = characterEffects[selectedCharId]
      setCharacterEffect(selectedCharId, current === effect ? null : effect)
    } else if (applyMode === 'line' && selectedLineId) {
      const current = lineEffects[selectedLineId]
      setLineEffect(selectedLineId, current === effect ? null : effect)
    }
  }, [applyMode, selectedCharId, selectedLineId, characterEffects, lineEffects, setCharacterEffect, setLineEffect])

  const handlePreview = useCallback(async (effect: VoiceEffectType) => {
    if (previewContext) {
      stopPreview()
      setPreviewingEffect(null)
      return
    }

    // Find an audio URL to preview with
    const voiceStore = useMultiCharacterStore.getState()
    const firstLine = voiceStore.dialogueLines[0]
    if (!firstLine?.audioUrl) {
      setNoAudioWarning(true)
      setTimeout(() => setNoAudioWarning(false), 3000)
      return
    }

    setPreviewingEffect(effect)
    await startPreview(firstLine.audioUrl, effect)
    setPreviewingEffect(null)
  }, [previewContext, stopPreview, startPreview])

  return (
    <PanelSection title="Voice Effects" defaultOpen>
      {/* Apply Mode Toggle */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setApplyMode('character')}
          className={cn(
            'flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors',
            applyMode === 'character'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10',
          )}
        >
          Per Character
        </button>
        <button
          onClick={() => setApplyMode('line')}
          className={cn(
            'flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors',
            applyMode === 'line'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10',
          )}
        >
          Per Line
        </button>
      </div>

      {/* Target Selector */}
      {applyMode === 'character' && characters.length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedCharId(char.id)}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] transition-colors',
                selectedCharId === char.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10',
              )}
            >
              {char.name}
              {characterEffects[char.id] && (
                <span className="ml-1 text-amber-400">{characterEffects[char.id]}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {applyMode === 'line' && lines.length > 0 && (
        <div className="max-h-24 overflow-y-auto mb-3 space-y-1">
          {lines.slice(0, 10).map((line) => (
            <button
              key={line.id}
              onClick={() => setSelectedLineId(line.id)}
              className={cn(
                'w-full text-left px-2 py-1 rounded text-[10px] truncate transition-colors',
                selectedLineId === line.id
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10',
              )}
            >
              {line.script?.slice(0, 50) || 'Empty line'}
              {lineEffects[line.id] && (
                <span className="ml-1 text-amber-400">[{lineEffects[line.id]}]</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Effect Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {EFFECT_PRESETS.map((preset) => {
          const Icon = ICON_MAP[preset.icon] || Waves
          const isActive = activeEffect === preset.id
          const isPreviewing = previewingEffect === preset.id

          return (
            <div key={preset.id} className="relative group">
              <button
                onClick={() => handleSelectEffect(preset.id)}
                disabled={isProcessing}
                className={cn(
                  'w-full flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all',
                  isActive
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200',
                  isProcessing && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Icon size={16} />
                <span className="text-[9px] font-medium leading-tight">{preset.label}</span>
              </button>

              {/* Preview button */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePreview(preset.id) }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-blue-400"
                title="Preview"
              >
                {isPreviewing ? (
                  <Square size={6} className="text-blue-400" />
                ) : (
                  <Play size={6} className="text-white ml-px" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {noAudioWarning && (
        <div className="mt-2 px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 text-center">
          Generate audio in the Voices panel first to preview effects.
        </div>
      )}

      {isProcessing && (
        <LoadingSpinner size={10} label="Processing audio..." />
      )}

      {activeEffect && (
        <div className="mt-2 text-[9px] text-gray-500 text-center">
          Active: <span className="text-purple-300 font-medium">{activeEffect}</span>
          {' '}&middot;{' '}
          <button
            onClick={() => {
              if (applyMode === 'character' && selectedCharId) setCharacterEffect(selectedCharId, null)
              if (applyMode === 'line' && selectedLineId) setLineEffect(selectedLineId, null)
            }}
            className="text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}
    </PanelSection>
  )
}
