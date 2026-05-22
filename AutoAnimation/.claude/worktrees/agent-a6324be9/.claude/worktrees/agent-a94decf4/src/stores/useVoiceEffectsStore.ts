/**
 * Voice Effects Store — per-dialogue-line and per-character voice effect state.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { VoiceEffectType } from '@/types/voiceEffects'
import { applyVoiceEffect, previewEffect } from '@/services/voiceEffects'
import { logger } from '@/utils/logger'

interface VoiceEffectsState {
  /** Effect per dialogue line ID */
  lineEffects: Record<string, VoiceEffectType>
  /** Default effect per character ID (applied to all their lines) */
  characterEffects: Record<string, VoiceEffectType>
  /** Processing state */
  isProcessing: boolean
  /** Currently previewing */
  previewContext: AudioContext | null

  // Actions
  setLineEffect: (lineId: string, effect: VoiceEffectType | null) => void
  setCharacterEffect: (characterId: string, effect: VoiceEffectType | null) => void
  getEffectForLine: (lineId: string, characterId: string) => VoiceEffectType | null
  processAudio: (audioBlob: Blob, effect: VoiceEffectType) => Promise<Blob>
  startPreview: (audioUrl: string, effect: VoiceEffectType) => Promise<void>
  stopPreview: () => void
  reset: () => void
}

export const useVoiceEffectsStore = create<VoiceEffectsState>()(
  immer((set, get) => ({
    lineEffects: {},
    characterEffects: {},
    isProcessing: false,
    previewContext: null,

    setLineEffect: (lineId, effect) => {
      set((s) => {
        if (effect) {
          s.lineEffects[lineId] = effect
        } else {
          delete s.lineEffects[lineId]
        }
      })
    },

    setCharacterEffect: (characterId, effect) => {
      set((s) => {
        if (effect) {
          s.characterEffects[characterId] = effect
        } else {
          delete s.characterEffects[characterId]
        }
      })
    },

    getEffectForLine: (lineId, characterId) => {
      const { lineEffects, characterEffects } = get()
      // Line-level effect takes precedence
      return lineEffects[lineId] ?? characterEffects[characterId] ?? null
    },

    processAudio: async (audioBlob, effect) => {
      set((s) => { s.isProcessing = true })
      try {
        const processed = await applyVoiceEffect(audioBlob, effect)
        return processed
      } finally {
        set((s) => { s.isProcessing = false })
      }
    },

    startPreview: async (audioUrl, effect) => {
      // Stop existing preview
      get().stopPreview()
      try {
        const ctx = await previewEffect(audioUrl, effect)
        set((s) => { s.previewContext = ctx as unknown as AudioContext })
      } catch (err) {
        logger.warn('[VoiceEffects] Preview failed:', err)
      }
    },

    stopPreview: () => {
      const { previewContext } = get()
      if (previewContext) {
        try {
          previewContext.close()
        } catch {
          // Already closed
        }
        set((s) => { s.previewContext = null })
      }
    },

    reset: () => {
      get().stopPreview()
      set((s) => {
        s.lineEffects = {}
        s.characterEffects = {}
        s.isProcessing = false
      })
    },
  })),
)
