/**
 * TranslationPanel — Translate dialogue to other languages and re-generate voices.
 * 4-step pipeline: translate script → regenerate voices → re-sync lip sync → create variant.
 */

import { useState, useCallback } from 'react'
import {
  Languages,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect } from '@/components/ui/panel-controls'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import {
  translateDialogue,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/services/translationService'
import { getElevenLabsService } from '@/services/elevenlabs'
import { LipSyncProcessor } from '@/services/lipSync'
import { CaptionProcessor } from '@/services/captions'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { logger } from '@/utils/logger'

type TranslationStep = 'idle' | 'translating' | 'regenerating' | 'syncing' | 'done' | 'error'

const STEPS = [
  { key: 'translating', label: 'Translate Script' },
  { key: 'regenerating', label: 'Re-generate Voices' },
  { key: 'syncing', label: 'Re-sync Lip Sync' },
  { key: 'done', label: 'Complete' },
] as const

export function TranslationPanel() {
  const [targetLang, setTargetLang] = useState<LanguageCode>('es')
  const [step, setStep] = useState<TranslationStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [translatedLines, setTranslatedLines] = useState<
    Array<{ characterName: string; originalScript: string; translatedScript: string }>
  >([])

  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const characters = useMultiCharacterStore((s) => s.characters)

  const hasDialogue = dialogueLines.length > 0

  const getStepIndex = (s: TranslationStep): number => {
    switch (s) {
      case 'translating':
        return 0
      case 'regenerating':
        return 1
      case 'syncing':
        return 2
      case 'done':
        return 3
      default:
        return -1
    }
  }

  const handleTranslate = useCallback(async () => {
    if (!hasDialogue) return
    setStep('translating')
    setError(null)
    setTranslatedLines([])

    try {
      // Step 1: Translate scripts
      const lines = dialogueLines.map((line) => {
        const char = characters.find((c) => c.id === line.characterId)
        return {
          characterName: char?.name || 'Narrator',
          script: line.script,
        }
      })

      const results = await translateDialogue(lines, targetLang)
      setTranslatedLines(results)

      // Step 2: Re-generate voices with translated scripts
      setStep('regenerating')
      const fps = useTimelineStore.getState().fps || 30
      const service = getElevenLabsService()
      const updateDialogueLine = useMultiCharacterStore.getState().updateDialogueLine
      const reflowDialogueFrames = useMultiCharacterStore.getState().reflowDialogueFrames

      for (let i = 0; i < results.length; i++) {
        const line = dialogueLines[i]
        if (!line) continue

        const char = characters.find((c) => c.id === line.characterId)
        if (!char?.voiceId) {
          // No voice assigned — just update script text
          updateDialogueLine(line.id, { script: results[i].translatedScript })
          continue
        }

        try {
          // Strip emotion cues for TTS
          const cleanScript = results[i].translatedScript
            .replace(/\[[\w-]+\]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

          if (!cleanScript) {
            updateDialogueLine(line.id, { script: results[i].translatedScript })
            continue
          }

          // Generate new voice with alignment (uses eleven_multilingual_v2)
          const voiceResult = await service.generateWithAlignment(cleanScript, char.voiceId)

          // Process lip sync and word timing
          const lipSyncProcessor = new LipSyncProcessor(fps)
          const captionProcessor = new CaptionProcessor(fps)
          const visemeTimeline = lipSyncProcessor.processAlignment(voiceResult.alignment)
          const wordTimeline = captionProcessor.extractWords(cleanScript, voiceResult.alignment)

          // Update dialogue line with new voice, visemes, and timing
          const durationFrames = Math.ceil(voiceResult.duration * fps)
          const newVoiceId = `voice_translated_${Date.now()}_${i}`
          updateDialogueLine(line.id, {
            script: results[i].translatedScript,
            generatedVoiceId: newVoiceId,
            visemeTimeline,
            wordTimeline,
            endFrame: line.startFrame + durationFrames,
          })

          // Store in voice store for playback (immer-compatible setState)
          useVoiceStore.setState((state) => {
            state.generatedVoices.push({
              id: newVoiceId,
              script: results[i].translatedScript,
              voiceId: char.voiceId ?? '',
              voiceName: char.name,
              audioUrl: voiceResult.audioUrl,
              audioDuration: voiceResult.duration,
              alignment: voiceResult.alignment,
              visemeTimeline,
              wordTimeline,
              createdAt: Date.now(),
            })
          })
        } catch (err) {
          logger.warn(`[TranslationPanel] Voice regeneration failed for line ${i + 1}, updating script only:`, err)
          updateDialogueLine(line.id, { script: results[i].translatedScript })
        }
      }

      // Step 3: Re-sync lip sync — reflow frame positions after duration changes
      setStep('syncing')
      reflowDialogueFrames()
      setStep('done')
    } catch (err) {
      logger.error('[TranslationPanel] Translation failed:', err)
      setError(err instanceof Error ? err.message : 'Translation failed')
      setStep('error')
    }
  }, [hasDialogue, dialogueLines, characters, targetLang])

  const currentStepIndex = getStepIndex(step)

  return (
    <PanelLayout icon={Languages} title="Translation & Dubbing" iconClassName="text-blue-400">
      {/* Language Picker */}
      <div className="space-y-3">
        <PanelSelect
          label="Target Language"
          value={targetLang}
          onChange={(v) => setTargetLang(v as LanguageCode)}
          options={SUPPORTED_LANGUAGES.map((lang) => ({ value: lang.code, label: lang.name }))}
          fullWidth
        />

        {!hasDialogue && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>Add dialogue lines first before translating.</span>
          </div>
        )}

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={!hasDialogue || (step !== 'idle' && step !== 'done' && step !== 'error')}
          className={cn(
            'w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg',
            !hasDialogue || (step !== 'idle' && step !== 'done' && step !== 'error')
              ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-white/5 opacity-50'
              : 'bg-blue-500 text-white hover:bg-blue-400 hover:scale-[1.01] active:scale-[0.99] shadow-blue-500/20',
          )}
        >
          {step !== 'idle' && step !== 'done' && step !== 'error' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages size={18} />
              Translate to {SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name}
            </>
          )}
        </button>
      </div>

      {/* Progress Stepper */}
      {step !== 'idle' && (
        <div className="space-y-2 mt-4">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
            Pipeline Progress
          </span>
          <div className="space-y-1.5">
            {STEPS.map((s, i) => {
              const isActive = currentStepIndex === i
              const isDone = currentStepIndex > i
              const isError = step === 'error' && currentStepIndex === i

              return (
                <div
                  key={s.key}
                  className={cn(
                    'flex items-center gap-2.5 p-2 rounded-xl transition-all',
                    isActive && 'bg-blue-500/10 border border-blue-500/20',
                    isDone && 'opacity-60',
                    isError && 'bg-red-500/10 border border-red-500/20',
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : isActive ? (
                      <Loader2 size={16} className="animate-spin text-blue-400" />
                    ) : isError ? (
                      <AlertCircle size={16} className="text-red-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs',
                      isActive ? 'text-blue-300 font-medium' : isDone ? 'text-zinc-500' : 'text-zinc-600',
                    )}
                  >
                    {s.label}
                  </span>
                  {isDone && i < STEPS.length - 1 && (
                    <ArrowRight size={10} className="text-zinc-600 ml-auto" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Translation Preview */}
      {translatedLines.length > 0 && (
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
            Translation Preview
          </span>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {translatedLines.map((line, i) => (
              <div key={i} className="bg-black/20 rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Play size={8} className="text-blue-400" />
                  <span className="text-[10px] font-medium text-zinc-300">
                    {line.characterName}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-1 italic">
                  {line.originalScript}
                </p>
                <p className="text-xs text-zinc-200 mt-0.5">{line.translatedScript}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done Message */}
      {step === 'done' && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>Translation applied. Preview the clip to verify lip sync accuracy.</span>
        </div>
      )}

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}
