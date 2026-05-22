import { useCallback, useMemo } from 'react'
import { useDashboardStore, getCompositionSnapshot } from '@/stores/useDashboardStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useMarketplaceStore, builtinTemplateIds } from '@/stores/useMarketplaceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { PhaseIndicator } from '@/components/panels/orchestrator/PhaseIndicator'
import { PromptPhase } from '@/components/panels/orchestrator/PromptPhase'
import { PlanningSpinner } from '@/components/panels/orchestrator/PlanningSpinner'
import { PlanReviewPhase } from '@/components/panels/orchestrator/PlanReviewPhase'
import { ExecutionPhase } from '@/components/panels/orchestrator/ExecutionPhase'
import { ClipDoneActions } from './ClipDoneActions'
import type { ClipPlan } from '@/types/orchestrator'
import type { VideoCompositionProps } from '@/remotion/types'

interface DashboardOrchestratorPanelProps {
  clipId: string
  onPlay: (recordingId: string, compositionSnapshot?: VideoCompositionProps | null) => void
  onShare: (recordingId: string) => void
  onInsights: (recordingId: string) => void
}

export function DashboardOrchestratorPanel({ clipId, onPlay, onShare, onInsights }: DashboardOrchestratorPanelProps) {
  const clip = useDashboardStore((s) => s.clips.find((c) => c.id === clipId))
  const {
    setClipPrompt,
    updateClipSettings,
    generateClipPlanAction,
    resetClip,
    queueClipForExecution,
    retryClipFromStep,
    skipClipStep,
  } = useDashboardStore()

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)
  const allMarketplaceItems = useMarketplaceStore((s) => s.items)
  const marketplaceItems = useMemo(
    () => allMarketplaceItems.filter((i) => i.published || !builtinTemplateIds.has(i.id)),
    [allMarketplaceItems],
  )
  const animationLibrary = useAnimationStore((s) => s.library)
  const mediaAssets = useMediaStore((s) => s.assets)
  const audioAssets = useMemo(() => mediaAssets.filter((a) => a.category === 'audio'), [mediaAssets])
  const availableVoices = useVoiceStore((s) => s.availableVoices)

  const handleSetPrompt = useCallback(
    (prompt: string) => setClipPrompt(clipId, prompt),
    [clipId, setClipPrompt],
  )

  const handleUpdateSettings = useCallback(
    (updates: Parameters<typeof updateClipSettings>[1]) =>
      updateClipSettings(clipId, updates),
    [clipId, updateClipSettings],
  )

  const handleGeneratePlan = useCallback(async () => {
    try {
      await generateClipPlanAction(clipId)
    } catch (err) {
      console.error('[DashboardOrchestrator] generatePlan threw:', err)
    }
  }, [clipId, generateClipPlanAction])

  const handleExecute = useCallback(
    (modifiedPlan?: ClipPlan) => {
      if (modifiedPlan) {
        // Update the clip's plan before queuing
        useDashboardStore.setState((state) => {
          const clip = state.clips.find((c) => c.id === clipId)
          if (clip) clip.plan = modifiedPlan
        })
      }
      queueClipForExecution(clipId)
    },
    [clipId, queueClipForExecution],
  )

  const handleRetry = useCallback(
    (index: number) => retryClipFromStep(clipId, index),
    [clipId, retryClipFromStep],
  )

  const handleSkip = useCallback(
    (index: number) => skipClipStep(clipId, index),
    [clipId, skipClipStep],
  )

  const handleReset = useCallback(() => resetClip(clipId), [clipId, resetClip])

  if (!clip) return null

  return (
    <div className="space-y-3">
      <PhaseIndicator phase={clip.phase} />

      {/* Error Alert (when returning to prompt phase after failure) */}
      {clip.phase === 'error' && !clip.plan && clip.error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          <p className="font-medium mb-0.5">Plan generation failed</p>
          <p className="text-red-400/80">{clip.error}</p>
        </div>
      )}

      {/* Prompt Phase */}
      {(clip.phase === 'idle' || clip.phase === 'error') && !clip.plan && (
        <PromptPhase
          prompt={clip.prompt}
          isRunning={clip.isRunning}
          settings={clip.settings}
          savedCharacters={savedCharacters}
          saved3DCharacters={saved3DCharacters}
          setPrompt={handleSetPrompt}
          updateSettings={handleUpdateSettings}
          onGeneratePlan={handleGeneratePlan}
          marketplaceItems={marketplaceItems}
          animationLibrary={animationLibrary}
          audioAssets={audioAssets}
        />
      )}

      {/* Planning Phase */}
      {clip.phase === 'planning' && <PlanningSpinner />}

      {/* Review Phase */}
      {clip.phase === 'reviewing' && clip.plan && (
        <PlanReviewPhase
          plan={clip.plan}
          cost={clip.cost}
          isRunning={clip.isRunning}
          savedCharacters={savedCharacters}
          saved3DCharacters={saved3DCharacters}
          availableVoices={availableVoices}
          onRegenerate={handleGeneratePlan}
          onExecute={handleExecute}
          onReset={handleReset}
        />
      )}

      {/* Execution / Done / Error (with plan) */}
      {(clip.phase === 'executing' || clip.phase === 'done' || (clip.phase === 'error' && clip.plan)) && (
        <ExecutionPhase
          phase={clip.phase}
          steps={clip.steps}
          error={clip.error}
          isRunning={clip.isRunning}
          cost={clip.cost}
          isSaving={clip.isSaving}
          saveError={clip.saveError}
          savedProjectId={clip.savedProjectId}
          royaltyResult={clip.royaltyResult}
          onRetry={handleRetry}
          onSkip={handleSkip}
          onReset={handleReset}
          /* onSaveRetry not supported from dashboard */
        />
      )}

      {/* Post-completion: watch, download, publish, insights */}
      {(clip.phase === 'done' || clip.isExporting || clip.exportError) && (
        <ClipDoneActions
          compositionSnapshot={getCompositionSnapshot(clipId)}
          recordingId={clip.recordingId}
          isExporting={clip.isExporting}
          exportError={clip.exportError}
          exportProgress={clip.exportProgress}
          onPlay={onPlay}
          onShare={onShare}
          onInsights={onInsights}
        />
      )}
    </div>
  )
}
