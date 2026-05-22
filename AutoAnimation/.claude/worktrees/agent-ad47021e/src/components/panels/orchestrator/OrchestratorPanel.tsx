import { useCallback, useEffect, useMemo } from 'react'
import { Clapperboard } from 'lucide-react'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useMarketplaceStore, builtinTemplateIds } from '@/stores/useMarketplaceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { PhaseIndicator } from './PhaseIndicator'
import { PromptPhase } from './PromptPhase'
import { PlanningSpinner } from './PlanningSpinner'
import { PlanReviewPhase } from './PlanReviewPhase'
import { ExecutionPhase } from './ExecutionPhase'
import { VariantComparisonPhase } from './VariantComparisonPhase'
import type { ClipPlan } from '@/types/orchestrator'

export function OrchestratorPanel() {
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
    settings,
    variations,
    executedVariants,
    isGeneratingVariations,
    selectedVariantIndex,
    setPrompt,
    updateSettings,
    initSettingsFromCanvas,
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

  // Library data for settings dropdowns
  const allMarketplaceItems = useMarketplaceStore((s) => s.items)
  const marketplaceItems = useMemo(
    () => allMarketplaceItems.filter((i) => i.published || !builtinTemplateIds.has(i.id)),
    [allMarketplaceItems],
  )
  const animationLibrary = useAnimationStore((s) => s.library)
  const mediaAssets = useMediaStore((s) => s.assets)
  const audioAssets = mediaAssets.filter((a) => a.category === 'audio')

  // Initialize settings from current canvas aspect ratio on mount
  useEffect(() => {
    initSettingsFromCanvas()
  }, [initSettingsFromCanvas])

  const handleGeneratePlan = useCallback(async () => {
    try {
      await generatePlan()
    } catch (err) {
      console.error('[OrchestratorPanel] generatePlan threw:', err)
    }
  }, [generatePlan])

  const handleExecute = useCallback(
    async (modifiedPlan?: ClipPlan) => {
      try {
        // If plan was modified in review phase, update store before executing
        if (modifiedPlan) {
          useOrchestratorStore.setState({ plan: modifiedPlan })
        }
        await executePlan()
      } catch (err) {
        console.error('[OrchestratorPanel] executePlan threw:', err)
      }
    },
    [executePlan],
  )

  const handleRetry = useCallback(
    async (index: number) => {
      try {
        await retryFromStep(index)
      } catch (err) {
        console.error('[OrchestratorPanel] retryFromStep threw:', err)
      }
    },
    [retryFromStep],
  )

  return (
    <PanelLayout icon={Clapperboard} title="AI Director" iconClassName="text-amber-400">
      {/* Phase Indicator */}
      <PhaseIndicator phase={phase} />

      {/* ── Error Alert (when returning to prompt phase after failure) ── */}
      {phase === 'error' && !plan && error && (
        <div className="mx-3 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          <p className="font-medium mb-0.5">Plan generation failed</p>
          <p className="text-red-400/80">{error}</p>
        </div>
      )}

      {/* ── Prompt Phase ── */}
      {(phase === 'idle' || phase === 'error') && !plan && (
        <PromptPhase
          prompt={prompt}
          isRunning={isRunning}
          settings={settings}
          savedCharacters={savedCharacters}
          saved3DCharacters={saved3DCharacters}
          setPrompt={setPrompt}
          updateSettings={updateSettings}
          onGeneratePlan={handleGeneratePlan}
          marketplaceItems={marketplaceItems}
          animationLibrary={animationLibrary}
          audioAssets={audioAssets}
        />
      )}

      {/* ── Planning Phase ── */}
      {phase === 'planning' && <PlanningSpinner />}

      {/* ── Review Phase ── */}
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

      {/* ── Comparing Phase ── */}
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

      {/* ── Execution / Done / Error (with plan) ── */}
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
    </PanelLayout>
  )
}
