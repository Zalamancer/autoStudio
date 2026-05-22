import { useState, useCallback, useRef } from 'react'
import { Sparkles, X, Layers, Wand2, Image as ImageIcon } from 'lucide-react'
import { SettingsSection } from '@/components/panels/orchestrator/SettingsSection'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useMarketplaceStore } from '@/stores/useMarketplaceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import type { OrchestratorSettings, OrchestratorAspectRatio } from '@/types/orchestrator'
import { generatePromptsFromTopic } from '@/services/promptIdeator'

const DEFAULT_SETTINGS: OrchestratorSettings = {
  aspectRatio: '9:16' as OrchestratorAspectRatio,
  durationSeconds: 0,
  fps: 0,
  useGoogleSearch: false,
  generateMusic: true,
  generateSVGAnimations: true,
  generateSVGAssets: true,
  generateStockAssets: true,
  useStockMedia: true,
  useSoundEffects: true,
  imageHeavyMode: false,
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

// Stock-only fast mode preset — applied directly to `settings` when the toggle is on so the
// SettingsSection UI reflects the forced values (duration dropdown shows 30s, Library mode is
// highlighted, Advanced toggles flip, Options go dark except Google Search, etc.).
//   Canvas:   30s @ 24fps
//   Assets:   Library mode; music/SVG/AI/stock-asset gen off, stock images + image-heavy (~40 cuts) on
//   Audio:    Sound effects on; preferStockAudio nudges planner + setupSoundEffects to Freesound
//   Options:  only Google Search on; auto-camera/smart-defaults/canvas items/variants off
function applyStockOnlyPreset(base: OrchestratorSettings): OrchestratorSettings {
  return {
    ...base,
    durationSeconds: 30,
    fps: 24,
    assetMode: 'library',
    generateMusic: false,
    generateSVGAnimations: false,
    generateSVGAssets: false,
    generateStockAssets: false,
    useStockMedia: true,
    imageHeavyMode: true,
    useSoundEffects: true,
    preferStockAudio: true,
    useGoogleSearch: true,
    useAutoCamera: false,
    useSmartDefaults: false,
    variantCount: 1,
    includeCanvasItems: false,
    selectedCharacterIds: [],
    selected3DCharacterIds: [],
    selectedCharacterIdentityIds: [],
    selectedHTMLTemplateIds: [],
    selectedCaptionIds: [],
    selectedCollageIds: [],
    selectedAIAnimationIds: [],
    selectedAnimationIds: [],
    selectedAudioIds: [],
  }
}

interface BatchCreatePanelProps {
  onClose: () => void
}

export function BatchCreatePanel({ onClose }: BatchCreatePanelProps) {
  const [promptsText, setPromptsText] = useState('')
  // Stock-only mode is on by default, so initial settings are the preset — not DEFAULT_SETTINGS.
  const [settings, setSettings] = useState<OrchestratorSettings>(() => applyStockOnlyPreset(DEFAULT_SETTINGS))
  const [autoExecute, setAutoExecute] = useState(true)
  const [stockOnlyFastMode, setStockOnlyFastMode] = useState(true)
  // Snapshot of the user's pre-stock-mode settings so we can restore on untoggle.
  const preStockSettingsRef = useRef<OrchestratorSettings>({ ...DEFAULT_SETTINGS })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Brainstorm state — turn one topic into N prompts via Gemini
  const [topic, setTopic] = useState('')
  const [ideaCount, setIdeaCount] = useState(20)
  const [tone, setTone] = useState('')
  const [isBrainstorming, setIsBrainstorming] = useState(false)
  const [brainstormError, setBrainstormError] = useState<string | null>(null)
  const [brainstormReplace, setBrainstormReplace] = useState(true)
  const [batchResult, setBatchResult] = useState<{
    created: number
    failed: number
    total: number
    failedClips: { prompt: string; error: string }[]
  } | null>(null)

  const { addBatchClips, generateAllPending, executeAllReviewed, clips: _clips } = useDashboardStore()

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

  // Toggle stock-only fast mode: snapshot the current settings, then apply (or restore) the preset so
  // the SettingsSection UI visibly reflects the change.
  const toggleStockOnlyFastMode = useCallback((next: boolean) => {
    setStockOnlyFastMode(next)
    setSettings((prev) => {
      if (next) {
        preStockSettingsRef.current = prev
        return applyStockOnlyPreset(prev)
      }
      return preStockSettingsRef.current
    })
  }, [])

  // Parse prompts: one per line, skip empty lines
  const prompts = promptsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const handleBrainstorm = useCallback(async () => {
    if (!topic.trim()) return
    setIsBrainstorming(true)
    setBrainstormError(null)
    try {
      const { prompts: newPrompts } = await generatePromptsFromTopic({
        topic,
        count: ideaCount,
        durationSeconds: settings.durationSeconds || 60,
        aspectRatio: settings.aspectRatio,
        tone: tone.trim() || undefined,
      })
      if (newPrompts.length === 0) {
        setBrainstormError('No ideas returned. Try a more specific topic.')
        return
      }
      const joined = newPrompts.join('\n')
      setPromptsText((prev) => (brainstormReplace || !prev.trim() ? joined : `${prev.trimEnd()}\n${joined}`))
    } catch (err) {
      setBrainstormError(err instanceof Error ? err.message : 'Failed to brainstorm ideas.')
    } finally {
      setIsBrainstorming(false)
    }
  }, [topic, ideaCount, tone, settings.durationSeconds, settings.aspectRatio, brainstormReplace])

  const handleCreateAndPlan = useCallback(async () => {
    if (prompts.length === 0) return

    setIsGenerating(true)
    setError(null)
    setBatchResult(null)

    let clipIds: string[] = []
    try {
      // Create all clips with shared settings — preset is already baked into `settings` when
      // stock-only fast mode is on (see toggleStockOnlyFastMode).
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
        // All plans succeeded — optionally fire the execution queue, then close.
        if (autoExecute) executeAllReviewed()
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
  }, [prompts, settings, autoExecute, addBatchClips, generateAllPending, executeAllReviewed, onClose])

  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-surface bg-[#141414]">
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
          className="p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-panel-surface transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Brainstorm from a single topic */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Wand2 size={14} className="text-purple-400" />
            <span className="text-xs font-medium text-purple-200">Brainstorm from a topic</span>
            <span className="text-[10px] text-purple-400/70">AI fills the prompts list for you</span>
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='e.g. "personal finance for Gen Z" or "weird animal facts"'
            className="w-full rounded-md bg-panel-surface border border-panel-border px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-[11px] text-gray-400">
              Count
              <input
                type="number"
                min={1}
                max={50}
                value={ideaCount}
                onChange={(e) => setIdeaCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="w-14 rounded-md bg-panel-surface border border-panel-border px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50"
              />
            </label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="tone (optional) — e.g. funny, controversial, educational"
              className="flex-1 min-w-[160px] rounded-md bg-panel-surface border border-panel-border px-3 py-1 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
            />
            <label className="flex items-center gap-1.5 text-[11px] text-gray-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={brainstormReplace}
                onChange={(e) => setBrainstormReplace(e.target.checked)}
                className="h-3 w-3 rounded border-panel-border bg-panel-surface text-purple-500"
              />
              Replace existing
            </label>
            <button
              onClick={handleBrainstorm}
              disabled={!topic.trim() || isBrainstorming}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-purple-200 text-xs font-medium border border-purple-500/30 transition-colors"
            >
              <Wand2 size={12} className={isBrainstorming ? 'animate-pulse' : ''} />
              {isBrainstorming ? 'Brainstorming…' : `Generate ${ideaCount} ideas`}
            </button>
          </div>
          {brainstormError && <p className="text-[11px] text-red-400 leading-snug">{brainstormError}</p>}
        </div>

        {/* Prompts textarea */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Enter one prompt per line</label>
          <textarea
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
            placeholder={`Explain quantum computing in 60 seconds\nTop 5 AI tools for productivity\nThe history of the internet explained`}
            rows={6}
            className="w-full rounded-lg bg-panel-surface border border-panel-border px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 resize-y"
          />
        </div>

        {/* Shared settings */}
        <div>
          <p className="text-xs text-gray-500 mb-2">
            These settings apply to all clips
            {stockOnlyFastMode && (
              <span className="ml-1.5 text-emerald-400/80">
                — character, template, and animation selections are ignored while stock-only mode is on.
              </span>
            )}
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
          <div
            className={`p-3 rounded-lg text-xs space-y-2 ${
              batchResult.created > 0
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}
          >
            <p>
              {batchResult.created}/{batchResult.total} clips created successfully, {batchResult.failed} failed.
            </p>
            {batchResult.failedClips.length > 0 && (
              <ul className="space-y-1 text-red-400">
                {batchResult.failedClips.map((fc, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="shrink-0">-</span>
                    <span>
                      <span className="text-zinc-300">
                        &quot;{fc.prompt.length > 50 ? fc.prompt.slice(0, 50) + '...' : fc.prompt}&quot;
                      </span>{' '}
                      {fc.error}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Error message */}
        {error && !batchResult && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">{error}</div>
        )}

        {/* Stock-only fast mode toggle — forces the image-heavy narration pipeline */}
        <label
          className={`flex items-start gap-2 rounded-lg border p-3 text-xs select-none cursor-pointer transition-colors ${
            stockOnlyFastMode
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-panel-border bg-panel-surface/40 hover:border-panel-border/80'
          }`}
        >
          <input
            type="checkbox"
            checked={stockOnlyFastMode}
            onChange={(e) => toggleStockOnlyFastMode(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-panel-border bg-panel-surface text-emerald-500 focus:ring-emerald-500/40"
          />
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 text-emerald-200 font-medium">
              <ImageIcon size={12} />
              Stock-only fast mode
            </div>
            <p className="text-[11px] text-gray-400 leading-snug">
              Stock images only — back-to-back cuts with varied transitions (instant, slide, fade, zoom, ken-burns). No
              characters, HTML templates, motion graphics, or AI-generated SVGs.
            </p>
          </div>
        </label>

        {/* Auto-execute toggle — runs every clip end-to-end after planning */}
        <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-panel-border bg-panel-surface text-amber-500 focus:ring-amber-500/40"
          />
          Auto-execute each clip after planning (mass-produce mode)
        </label>

        {/* Action button */}
        <button
          onClick={handleCreateAndPlan}
          disabled={prompts.length === 0 || isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-medium text-sm transition-colors"
        >
          {isGenerating ? (
            <>
              <Sparkles size={16} className="animate-pulse" />
              {autoExecute ? `Producing ${prompts.length} clips...` : `Creating ${prompts.length} clips...`}
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {autoExecute
                ? `Mass-Produce ${prompts.length > 0 ? prompts.length : ''} Clips`
                : `Create & Plan ${prompts.length > 0 ? `${prompts.length} Clips` : 'Clips'}`}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
