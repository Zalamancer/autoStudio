import { lazy, Suspense } from 'react'
import { Clapperboard, Loader2, Sparkles } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { PHASE_STEPS, getPhaseIndex } from '@/components/panels/orchestrator/constants'

const OrchestratorPanel = lazy(() =>
  import('@/components/panels/orchestrator/OrchestratorPanel').then((m) => ({ default: m.OrchestratorPanel })),
)

function HeaderContent() {
  const phase = useOrchestratorStore((s) => s.phase)
  const prompt = useOrchestratorStore((s) => s.prompt)
  const isRunning = useOrchestratorStore((s) => s.isRunning)
  const generatePlan = useOrchestratorStore((s) => s.generatePlan)
  const plan = useOrchestratorStore((s) => s.plan)
  const activeIndex = getPhaseIndex(phase)

  const showPlanButton = (phase === 'idle' || phase === 'error') && !plan

  return (
    <>
      {/* Phase Steps — centered in header */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
        {PHASE_STEPS.map((step, i) => {
          const isComplete = i < activeIndex
          const isActive = i === activeIndex
          const isFuture = i > activeIndex
          return (
            <div key={step} className="flex items-center">
              {/* Active step gets pill with dashes */}
              {isActive ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25">
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-amber-400">{step}</span>
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                </div>
              ) : (
                <span className={`text-[11px] font-medium px-1.5 ${isComplete ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {step}
                </span>
              )}
              {/* Dot separator */}
              {i < PHASE_STEPS.length - 1 && (
                <span
                  className={`w-1 h-1 rounded-full mx-1 ${
                    i < activeIndex ? 'bg-emerald-500/50' : isFuture ? 'bg-zinc-700' : 'bg-zinc-600'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Plan Clip Button */}
      {showPlanButton && (
        <button
          onClick={() => generatePlan()}
          disabled={isRunning || !prompt.trim()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isRunning || !prompt.trim()
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Planning...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Plan Clip
              <CreditCostTag operation="orchestrator-plan" />
            </>
          )}
        </button>
      )}
    </>
  )
}

export default function AIDirectorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="AI Director" icon={Clapperboard} onClose={onClose} headerRight={<HeaderContent />}>
      <div className="h-full p-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          }
        >
          <OrchestratorPanel />
        </Suspense>
      </div>
    </CanvasOverlay>
  )
}
