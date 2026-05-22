import { useState, useCallback } from 'react'
import { Sparkles, X, Layers } from 'lucide-react'
import { SettingsSection } from '@/components/panels/orchestrator/SettingsSection'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useMarketplaceStore } from '@/stores/useMarketplaceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import type { OrchestratorSettings, OrchestratorAspectRatio } from '@/types/orchestrator'

const DEFAULT_SETTINGS: OrchestratorSettings = {
  aspectRatio: '9:16' as OrchestratorAspectRatio,
  durationSeconds: 0,
  fps: 0,
  useGoogleSearch: false,
  generateMusic: true,
  generateSVGAnimations: true,
  generateSVGAssets: true,
  useStockMedia: true,
  useSoundEffects: true,
  selectedCharacterIds: [],
  selected3DCharacterIds: [],
  includeCanvasItems: true,
  selectedHTMLTemplateIds: [],
  selectedCaptionIds: [],
  selectedCollageIds: [],
  selectedAIAnimationIds: [],
  selectedAnimationIds: [],
  selectedAudioIds: [],
  useSmartDefaults: true,
}

interface BatchCreatePanelProps {
  onClose: () => void
}

export function BatchCreatePanel({ onClose }: BatchCreatePanelProps) {
  const [promptsText, setPromptsText] = useState('')
  const [settings, setSettings] = useState<OrchestratorSettings>({ ...DEFAULT_SETTINGS })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState<{ created: number; failed: number; total: number; failedClips: { prompt: string; error: string }[] } | null>(null)

  const { addBatchClips, generateAllPending, clips: _clips } = useDashboardStore()

  // Library data for settings dropdowns
  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)
  const marketplaceItems = useMarketplaceStore((s) => s.items)
  const animationLibrary = useAnimationStore((s) => s.library)
  const mediaAssets = useMediaStore((s) => s.assets)
  const audioAssets = mediaAssets.filter((a) => a.category === 'audio')

  const updateSettings = useCallback((updates: Partial<OrchestratorSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  // Parse prompts: one per line, skip empty lines
  const prompts = promptsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const handleCreateAndPlan = useCallback(async () => {
    if (prompts.length === 0) return

    setIsGenerating(true)
    setError(null)
    setBatchResult(null)

    let clipIds: string[] = []
    try {
      // Create all clips with shared settings
      clipIds = addBatchClips(prompts, settings)
      const total = clipIds.length

      // Fire off plan generation for all of them (uses Promise.allSettled internally)
      await generateAllPending()

      // Check per-clip results from the store
      const currentClips = useDashboardStore.getState().clips
      let failed = 0
      let created = 0
      const failedClips: { prompt: string; error: string }[] = []
      for (const id of clipIds) {
        const clip = currentClips.find((c) => c.id === id)
        if (clip?.phase === 'error' || clip?.error) {
          failed++
          failedClips.push({
            prompt: clip?.prompt ?? '(unknown)',
            error: clip?.error ?? 'Plan generation failed',
          })
        } else {
          created++
        }
      }

      if (failed === 0) {
        // All succeeded — close the panel
        onClose()
      } else {
        // Partial failure — show granular feedback
        setBatchResult({ created, failed, total, failedClips })
        if (created === 0) {
          setError('All clips failed to generate plans.')
        }
      }
    } catch (err) {
      console.error('[BatchCreatePanel] Error:', err)
      // Even on exception, try to report per-clip status from the store
      const currentClips = useDashboardStore.getState().clips
      let failed = 0
      let created = 0
      const failedClips: { prompt: string; error: string }[] = []
      for (const id of clipIds) {
        const clip = currentClips.find((c) => c.id === id)
        if (!clip || clip.phase === 'error' || clip.error) {
          failed++
          failedClips.push({
            prompt: clip?.prompt ?? '(unknown)',
            error: clip?.error ?? 'Clip creation interrupted',
          })
        } else {
          created++
        }
      }
      if (created > 0 || failed > 0) {
        setBatchResult({ created, failed, total: clipIds.length, failedClips })
      } else {
        setError(err instanceof Error ? err.message : 'Batch creation failed. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }, [prompts, settings, addBatchClips, generateAllPending, onClose])

  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-[#141414]">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber-400" />
          <h3 className="text-sm font-medium text-white">Batch Generate</h3>
          {prompts.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {prompts.length} clip{prompts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Prompts textarea */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">
            Enter one prompt per line
          </label>
          <textarea
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
            placeholder={`Explain quantum computing in 60 seconds\nTop 5 AI tools for productivity\nThe history of the internet explained`}
            rows={6}
            className="w-full rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 resize-y"
          />
        </div>

        {/* Shared settings */}
        <div>
          <p className="text-xs text-gray-500 mb-2">
            These settings apply to all clips
          </p>
          <SettingsSection
            settings={settings}
            updateSettings={updateSettings}
            savedCharacters={savedCharacters}
            saved3DCharacters={saved3DCharacters}
            marketplaceItems={marketplaceItems}
            animationLibrary={animationLibrary}
            audioAssets={audioAssets}
          />
        </div>

        {/* Batch result feedback */}
        {batchResult && batchResult.failed > 0 && (
          <div className={`p-3 rounded-lg text-xs space-y-2 ${
            batchResult.created > 0
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
              : 'bg-red-500/10 border border-red-500/20 text-red-300'
          }`}>
            <p>
              {batchResult.created}/{batchResult.total} clips created successfully, {batchResult.failed} failed.
            </p>
            {batchResult.failedClips.length > 0 && (
              <ul className="space-y-1 text-red-400">
                {batchResult.failedClips.map((fc, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="shrink-0">-</span>
                    <span>
                      <span className="text-zinc-300">&quot;{fc.prompt.length > 50 ? fc.prompt.slice(0, 50) + '...' : fc.prompt}&quot;</span>
                      {' '}{fc.error}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Error message */}
        {error && !batchResult && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleCreateAndPlan}
          disabled={prompts.length === 0 || isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-medium text-sm transition-colors"
        >
          {isGenerating ? (
            <>
              <Sparkles size={16} className="animate-pulse" />
              Creating {prompts.length} clips...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Create & Plan {prompts.length > 0 ? `${prompts.length} Clips` : 'Clips'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
