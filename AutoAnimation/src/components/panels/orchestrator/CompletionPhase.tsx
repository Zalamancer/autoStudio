import { useState, useCallback } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Cloud,
  CloudOff,
  Save,
  MoreHorizontal,
  Bug,
  Coins,
  ShieldCheck,
} from 'lucide-react'
import {
  useTimelineStore,
  useMultiCharacterStore,
  useVoiceStore,
  useTextOverlayStore,
  useShapeStore,
  useAnimationStore,
  useHTMLTemplateLayerStore,
} from '@/stores'
import { useMediaStore } from '@/stores/useMediaStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { ABComparisonPanel } from '@/components/panels/ABComparisonPanel'

interface CompletionPhaseProps {
  isSaving: boolean
  saveError: string | null
  savedProjectId: string | null
  onSaveRetry?: () => void
  royaltyResult?: { royalty_pool: number; creator_count: number } | null
}

export function CompletionPhase({
  isSaving,
  saveError,
  savedProjectId,
  onSaveRetry,
  royaltyResult,
}: CompletionPhaseProps) {
  const [showDebugMenu, setShowDebugMenu] = useState(false)
  const [debugCopied, setDebugCopied] = useState(false)

  const handleCopyDebugData = useCallback(() => {
    const timeline = useTimelineStore.getState()
    const dialogue = useMultiCharacterStore.getState()
    const voice = useVoiceStore.getState()
    const text = useTextOverlayStore.getState()
    const shapes = useShapeStore.getState()
    const animations = useAnimationStore.getState()
    const htmlTemplates = useHTMLTemplateLayerStore.getState()
    const media = useMediaStore.getState()
    const svg = useSVGObjectStore.getState()
    const orchestrator = useOrchestratorStore.getState()

    const debugData = {
      timeline: {
        fps: timeline.fps,
        totalFrames: timeline.totalFrames,
        totalSeconds: +(timeline.totalFrames / timeline.fps).toFixed(2),
        currentFrame: timeline.currentFrame,
        trackCount: timeline.tracks.length,
        tracks: timeline.tracks.map((t) => ({
          id: t.id,
          name: t.name,
          clipCount: t.clips.length,
          clips: t.clips.map((c) => ({
            id: c.id,
            name: c.name,
            startFrame: c.startFrame,
            endFrame: c.endFrame,
          })),
        })),
      },
      dialogueLines: dialogue.dialogueLines.map((l) => ({
        id: l.id,
        characterId: l.characterId,
        startFrame: l.startFrame,
        endFrame: l.endFrame,
        script: l.script?.slice(0, 50),
      })),
      generatedVoices: voice.generatedVoices.map((v) => ({
        id: v.id,
        voiceName: v.voiceName,
        audioDuration: v.audioDuration,
        audioDurationFrames: Math.ceil(v.audioDuration * timeline.fps),
      })),
      textOverlays: text.overlays.map((o) => ({
        id: o.id,
        content: o.content?.slice(0, 30),
        startFrame: o.startFrame,
        endFrame: o.endFrame,
      })),
      shapes: shapes.shapes.map((s) => ({
        id: s.id,
        startFrame: s.startFrame,
        endFrame: s.endFrame,
      })),
      htmlTemplates: htmlTemplates.templates.map((t) => ({
        id: t.id,
        name: t.name,
        startFrame: t.startFrame,
        endFrame: t.endFrame,
      })),
      activeAnimations: animations.activeAnimations.map((a) => ({
        id: a.id,
        animationId: a.animationId,
        endFrame: (a as unknown as Record<string, unknown>).endFrame,
      })),
      svgObjects: (svg.composition?.objects ?? []).map((o) => ({
        id: o.id,
        endFrame: (o as unknown as Record<string, unknown>).endFrame,
      })),
      mediaCanvasItems: media.canvasItems.map((m) => ({
        id: m.id,
        startFrame: m.startFrame,
        endFrame: m.endFrame,
      })),
      orchestratorPlan: orchestrator.plan
        ? {
            canvas: orchestrator.plan.canvas,
            htmlTemplatesCount: orchestrator.plan.htmlTemplates?.length ?? 0,
            htmlTemplates: orchestrator.plan.htmlTemplates,
            dialogueCount: orchestrator.plan.dialogue.length,
            characterCount: orchestrator.plan.characters.length,
          }
        : null,
      computedMaxEndFrame: Math.max(
        ...dialogue.dialogueLines.map((l) => l.endFrame || 0),
        ...text.overlays.map((o) => o.endFrame || 0),
        ...shapes.shapes.map((s) => s.endFrame || 0),
        ...htmlTemplates.templates.map((t) => t.endFrame || 0),
        ...media.canvasItems.map((m) => m.endFrame || 0),
        0,
      ),
    }

    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2))
    setDebugCopied(true)
    setShowDebugMenu(false)
    setTimeout(() => setDebugCopied(false), 2000)
  }, [])

  const executedVariants = useOrchestratorStore((s) => s.executedVariants ?? [])
  const qaReport = useOrchestratorStore((s) => s.qaReport)

  // Determine icon based on QA results
  const hasQAIssues = qaReport && (!qaReport.passed || qaReport.blockers > 0)
  const qaColor = !qaReport
    ? 'text-emerald-400'
    : qaReport.passed
      ? 'text-emerald-400'
      : qaReport.blockers > 0
        ? 'text-red-400'
        : 'text-amber-400'

  return (
    <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-4 text-center space-y-3 animate-fade-in-up">
      {/* Success icon with pop animation */}
      <div className="flex items-center justify-between">
        <div className="w-6" />
        <div className="animate-success-pop">
          {hasQAIssues ? (
            <AlertTriangle size={28} className={qaColor} />
          ) : (
            <CheckCircle2 size={28} className="text-emerald-400" />
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDebugMenu(!showDebugMenu)}
            className="p-1 rounded hover:bg-emerald-800/30 text-gray-500 hover:text-gray-300 transition-colors"
            title="Debug options"
          >
            <MoreHorizontal size={14} />
          </button>
          {showDebugMenu && (
            <div className="absolute right-0 top-full mt-1 bg-panel-surface border border-panel-border rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
              <button
                onClick={handleCopyDebugData}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-panel-surface-hover transition-colors text-left"
              >
                <Bug size={12} className="text-amber-400" />
                Copy Timeline Debug Data
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-emerald-300 font-medium">{debugCopied ? 'Copied to clipboard!' : 'Clip Ready!'}</p>
      <p className="text-xs text-gray-400">
        Your clip has been assembled. Use the timeline and canvas to review and fine-tune.
      </p>

      {/* Save Status */}
      <div className="pt-1 border-t border-emerald-800/30">
        {isSaving && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400">
            <Loader2 size={12} className="animate-spin" />
            Saving to cloud...
          </div>
        )}
        {!isSaving && savedProjectId && !saveError && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400">
            <Cloud size={12} />
            Saved to cloud
          </div>
        )}
        {!isSaving && saveError && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400">
              <CloudOff size={12} />
              {saveError}
            </div>
            {onSaveRetry ? (
              <button
                onClick={onSaveRetry}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <Save size={11} />
                Retry Save
              </button>
            ) : (
              <p className="text-[10px] text-zinc-600 text-center">Save not available from dashboard</p>
            )}
          </div>
        )}
      </div>

      {/* Royalty Distribution */}
      {royaltyResult && royaltyResult.creator_count > 0 && (
        <div className="pt-1 border-t border-emerald-800/30">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300">
            <Coins size={12} className="text-amber-400" />
            {royaltyResult.creator_count} marketplace creator{royaltyResult.creator_count !== 1 ? 's' : ''} received
            bonus credits ({royaltyResult.royalty_pool} total)
          </div>
        </div>
      )}

      {/* Quality Gate Report */}
      {qaReport && (
        <div className="pt-2 border-t border-emerald-800/30 text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldCheck size={12} className={qaColor} />
            <span className="text-xs font-medium text-gray-300">
              Quality: {qaReport.grade} ({qaReport.overallScore}/100)
            </span>
            {!qaReport.passed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400">Below threshold</span>
            )}
          </div>
          {(qaReport.blockers > 0 || qaReport.warnings > 0) && (
            <div className="flex gap-3 mb-1.5 text-[10px]">
              {qaReport.blockers > 0 && (
                <span className="text-red-400">
                  {qaReport.blockers} blocker{qaReport.blockers !== 1 ? 's' : ''}
                </span>
              )}
              {qaReport.warnings > 0 && (
                <span className="text-amber-400">
                  {qaReport.warnings} warning{qaReport.warnings !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          {qaReport.improvements.length > 0 && (
            <div className="space-y-1">
              {qaReport.improvements.slice(0, 3).map((imp, i) => (
                <div key={i} className="text-[10px] text-gray-500 flex gap-1.5">
                  <span className="text-amber-500/60 shrink-0">+{imp.estimatedImpact}pts</span>
                  <span className="truncate">{imp.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* A/B Comparison (shown when multiple variants were executed) */}
      {executedVariants.length > 1 && <ABComparisonSection />}
    </div>
  )
}

/** Sub-component that renders the A/B comparison panel when variants exist. */
function ABComparisonSection() {
  return (
    <div className="pt-2 border-t border-emerald-800/30">
      <ABComparisonPanel />
    </div>
  )
}
