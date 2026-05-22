/**
 * AI Director — Left Panel Component
 *
 * Renders all orchestrator phases (prompt, planning, review, execution, done)
 * in the left panel. Settings live in the right panel (AIDirectorSettingsPanel).
 *
 * Auto-switches the right panel to 'ai-director-settings' on mount.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { Sparkles, Loader2, ChevronRight, Monitor, Users, Boxes, SlidersHorizontal, Globe } from 'lucide-react'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useEditorStore } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useMarketplaceStore, builtinTemplateIds } from '@/stores/useMarketplaceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { PromptPhaseContent } from './PromptPhaseContent'
import { PlanningSpinner } from './PlanningSpinner'
import { PlanReviewPhase } from './PlanReviewPhase'
import { ExecutionPhase } from './ExecutionPhase'
import { VariantComparisonPhase } from './VariantComparisonPhase'
import { PHASE_STEPS, getPhaseIndex } from './constants'
import type { ClipPlan } from '@/types/orchestrator'

// Settings sections shown as rows in the left panel
const SETTINGS_SECTIONS = [
  { id: 'canvas', label: 'Canvas', description: 'Aspect ratio, duration, FPS', icon: Monitor },
  { id: 'characters', label: 'Characters', description: '2D, 3D & identity selection', icon: Users },
  { id: 'assets', label: 'Assets', description: 'Generation mode & library', icon: Boxes },
  { id: 'options', label: 'Options', description: 'Camera, search, smart defaults', icon: SlidersHorizontal },
  { id: 'platform', label: 'Platform', description: 'Target platform & format', icon: Globe },
] as const

export type { SettingsSectionId } from '@/stores/useOrchestratorStore'

export function AIDirectorPanel() {
  const {
    prompt,
    phase,
    plan,
    steps,
    error,
    isRunning,
    isSaving,
    saveError,
    savedProjectId,
    royaltyResult,
    cost,
    variations,
    executedVariants,
    isGeneratingVariations,
    selectedVariantIndex,
    setPrompt,
    generatePlan,
    executePlan,
    generateVariations,
    executeAllVariants,
    selectVariant,
    applyVariant,
    retryFromStep,
    skipStep,
    saveClip,
    reset,
  } = useOrchestratorStore()

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)
  const availableVoices = useVoiceStore((s) => s.availableVoices)
  const allMarketplaceItems = useMarketplaceStore((s) => s.items)
  const marketplaceItems = useMemo(
    () => allMarketplaceItems.filter((i) => i.published || !builtinTemplateIds.has(i.id)),
    [allMarketplaceItems],
  )
  const animationLibrary = useAnimationStore((s) => s.library)
  const mediaAssets = useMediaStore((s) => s.assets)
  const audioAssets = mediaAssets.filter((a) => a.category === 'audio')

  // Auto-switch right panel to settings when this panel mounts
  useEffect(() => {
    useEditorStore.getState().setRightPanelTab('ai-director-settings')
  }, [])

  // Initialize orchestrator settings from canvas
  useEffect(() => {
    useOrchestratorStore.getState().initSettingsFromCanvas()
  }, [])

  const handleGeneratePlan = useCallback(async () => {
    try {
      await generatePlan()
    } catch (err) {
      console.error('[AIDirectorPanel] generatePlan threw:', err)
    }
  }, [generatePlan])

  const handleExecute = useCallback(
    async (modifiedPlan?: ClipPlan) => {
      if (modifiedPlan) {
        useOrchestratorStore.setState({ plan: modifiedPlan })
      }
      try {
        await executePlan()
      } catch (err) {
        console.error('[AIDirectorPanel] executePlan threw:', err)
      }
    },
    [executePlan],
  )

  const handleRetry = useCallback(
    async (index: number) => {
      try {
        await retryFromStep(index)
      } catch (err) {
        console.error('[AIDirectorPanel] retryFromStep threw:', err)
      }
    },
    [retryFromStep],
  )

  const activeIndex = getPhaseIndex(phase)
  const showPlanButton = (phase === 'idle' || phase === 'error') && !plan

  // Show 3 steps at a time: previous (left), current (center), next (right)
  const prevStep = activeIndex > 0 ? PHASE_STEPS[activeIndex - 1] : null
  const currStep = PHASE_STEPS[activeIndex] ?? PHASE_STEPS[PHASE_STEPS.length - 1]
  const nextStep = activeIndex < PHASE_STEPS.length - 1 ? PHASE_STEPS[activeIndex + 1] : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Phase Steps — 3 visible with connecting lines ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-b border-white/5">
        {/* Previous step */}
        <div className="flex-1 flex items-center justify-start">
          {prevStep && <span className="text-[10px] font-medium text-emerald-400">{prevStep}</span>}
        </div>

        {/* Line: prev → current */}
        <div className="w-8 h-[2px] rounded-full bg-gradient-to-r from-emerald-500/40 to-amber-500/40 mx-1" />

        {/* Current step */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25">
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-amber-400">{currStep}</span>
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Line: current → next */}
        <div className="w-8 h-[2px] rounded-full bg-gradient-to-r from-amber-500/40 to-zinc-700/40 mx-1" />

        {/* Next step */}
        <div className="flex-1 flex items-center justify-end">
          {nextStep && <span className="text-[10px] font-medium text-zinc-600">{nextStep}</span>}
        </div>
      </div>

      {/* ── Phase Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {/* Error */}
        {phase === 'error' && !plan && error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 mb-3">
            <p className="font-medium mb-0.5">Plan generation failed</p>
            <p className="text-red-400/80">{error}</p>
          </div>
        )}

        {/* Prompt + Settings Rows */}
        {(phase === 'idle' || phase === 'error') && !plan && (
          <>
            <PromptPhaseContent
              prompt={prompt}
              isRunning={isRunning}
              setPrompt={setPrompt}
              onGeneratePlan={handleGeneratePlan}
              marketplaceItems={marketplaceItems}
              animationLibrary={animationLibrary}
              audioAssets={audioAssets}
            />

            {/* ── Settings section rows (click to show in right panel) ── */}
            <div className="mt-4 space-y-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider px-1">Settings</span>
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    useOrchestratorStore.getState().setActiveSettingsSection(section.id)
                    useEditorStore.getState().setRightPanelTab('ai-director-settings')
                  }}
                  className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.06] group"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-green-400 group-hover:bg-green-500/10 transition-colors">
                    <section.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {section.label}
                    </div>
                    <div className="text-[11px] leading-relaxed text-zinc-500 mt-0.5">{section.description}</div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors"
                  />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Planning spinner */}
        {phase === 'planning' && <PlanningSpinner />}

        {/* Review */}
        {phase === 'reviewing' && plan && (
          <PlanReviewPhase
            plan={plan}
            cost={cost}
            isRunning={isRunning}
            savedCharacters={savedCharacters}
            saved3DCharacters={saved3DCharacters}
            availableVoices={availableVoices}
            onRegenerate={handleGeneratePlan}
            onExecute={handleExecute}
            onGenerateVariants={generateVariations}
            isGeneratingVariations={isGeneratingVariations}
            onReset={reset}
          />
        )}

        {/* Comparing */}
        {phase === 'comparing' && plan && (
          <VariantComparisonPhase
            originalPlan={plan}
            variations={variations}
            executedVariants={executedVariants}
            selectedVariantIndex={selectedVariantIndex}
            isRunning={isRunning}
            isGeneratingVariations={isGeneratingVariations}
            onSelectVariant={selectVariant}
            onApplyVariant={applyVariant}
            onExecuteAll={executeAllVariants}
            onBack={() => useOrchestratorStore.setState({ phase: 'reviewing', variations: [], executedVariants: [] })}
            onReset={reset}
          />
        )}

        {/* Execution / Done */}
        {(phase === 'executing' || phase === 'done' || (phase === 'error' && plan)) && (
          <ExecutionPhase
            phase={phase}
            steps={steps}
            error={error}
            isRunning={isRunning}
            cost={cost}
            isSaving={isSaving}
            saveError={saveError}
            savedProjectId={savedProjectId}
            royaltyResult={royaltyResult}
            onRetry={handleRetry}
            onSkip={skipStep}
            onReset={reset}
            onSaveRetry={() => saveClip()}
          />
        )}
      </div>

      {/* ── Bottom-fixed action button ── */}
      {showPlanButton && (
        <div className="shrink-0 border-t border-white/5 px-3 py-3 bg-zinc-900/80 backdrop-blur-sm">
          <button
            onClick={handleGeneratePlan}
            disabled={isRunning || !prompt.trim()}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              isRunning || !prompt.trim()
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/10'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Planning...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Plan Clip
                <CreditCostTag operation="orchestrator-plan" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
