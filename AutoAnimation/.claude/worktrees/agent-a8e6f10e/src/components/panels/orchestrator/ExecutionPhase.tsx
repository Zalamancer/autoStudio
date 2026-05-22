import {
  Circle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STEP_ICONS, STEP_LABELS } from './constants'
import { CostBreakdown } from './CostBreakdown'
import { CompletionPhase } from './CompletionPhase'
import type {
  OrchestratorStep,
  OrchestratorPhase,
  StepStatus,
  StepType,
  OrchestrationCost,
} from '@/types/orchestrator'

/** Logical sections for quick regeneration */
const SECTIONS: { id: string; label: string; startStep: StepType }[] = [
  { id: 'dialogue', label: 'Voices & Dialogue', startStep: 'generate-voices' },
  { id: 'visuals', label: 'Visuals & Templates', startStep: 'setup-text-overlays' },
  { id: 'music', label: 'Music & Audio', startStep: 'generate-music' },
  { id: 'media', label: 'Stock Media', startStep: 'setup-stock-media' },
]

interface ExecutionPhaseProps {
  phase: OrchestratorPhase
  steps: OrchestratorStep[]
  error: string | null
  isRunning: boolean
  cost: OrchestrationCost
  isSaving: boolean
  saveError: string | null
  savedProjectId: string | null
  royaltyResult?: { royalty_pool: number; creator_count: number } | null
  onRetry: (index: number) => void
  onSkip: (index: number) => void
  onReset: () => void
  onSaveRetry?: () => void
}

export function ExecutionPhase({
  phase,
  steps,
  error,
  isRunning,
  cost,
  isSaving,
  saveError,
  savedProjectId,
  royaltyResult,
  onRetry,
  onSkip,
  onReset,
  onSaveRetry,
}: ExecutionPhaseProps) {
  const completedSteps = steps.filter((s) => s.status === 'done' || s.status === 'skipped').length
  const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0

  // SVG progress ring params
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const ringColor =
    phase === 'error'
      ? 'stroke-red-500'
      : phase === 'done'
        ? 'stroke-emerald-500'
        : 'stroke-amber-500'

  const ringTrackColor =
    phase === 'error'
      ? 'stroke-red-900/30'
      : phase === 'done'
        ? 'stroke-emerald-900/30'
        : 'stroke-white/10'

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Progress Ring */}
      <div className="flex justify-center">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            {/* Track */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth="4"
              className={ringTrackColor}
            />
            {/* Progress */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className={cn(ringColor, 'transition-all duration-500')}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                'text-lg font-bold',
                phase === 'error'
                  ? 'text-red-400'
                  : phase === 'done'
                    ? 'text-emerald-400'
                    : 'text-amber-400',
              )}
            >
              {progressPercent}%
            </span>
            <span className="text-[9px] text-gray-500">
              {phase === 'done' ? 'Complete' : phase === 'error' ? 'Error' : 'Executing'}
            </span>
          </div>
        </div>
      </div>

      {/* Step Cards */}
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[step.type] || Circle
          const label = STEP_LABELS[step.type] || step.type

          return (
            <div
              key={step.type}
              className={cn(
                'group flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300',
                step.status === 'running' &&
                  'bg-violet-900/15 border-violet-500/20 animate-step-pulse',
                step.status === 'done' && 'bg-emerald-900/10 border-emerald-800/20',
                step.status === 'error' && 'bg-red-900/10 border-red-800/20',
                step.status === 'pending' && 'bg-[#1e1e1e]/30 border-white/5/30',
                step.status === 'skipped' && 'bg-[#1e1e1e]/20 border-white/5/20 opacity-50',
              )}
            >
              {/* Status icon */}
              <StepStatusIcon status={step.status} />

              {/* Step icon + text */}
              <Icon size={12} className="text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{label}</p>
                {step.detail && (
                  <p className="text-[10px] text-gray-500 truncate">{step.detail}</p>
                )}
                {step.error && (
                  <p className="text-[10px] text-red-400 truncate">{step.error}</p>
                )}
              </div>

              {/* Retry + Skip buttons (on error) */}
              {step.status === 'error' && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onRetry(i)}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 transition-colors"
                  >
                    <RefreshCw size={10} />
                    Retry
                  </button>
                  <button
                    onClick={() => onSkip(i)}
                    className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-0.5 transition-colors"
                  >
                    <SkipForward size={10} />
                    Skip
                  </button>
                </div>
              )}

              {/* Regenerate button (on completed steps, when execution is done) */}
              {step.status === 'done' && phase === 'done' && !isRunning && (
                <button
                  onClick={() => onRetry(i)}
                  className="text-[10px] text-zinc-500 hover:text-violet-400 flex items-center gap-0.5 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title={`Re-run from "${label}" onwards`}
                >
                  <RefreshCw size={9} />
                  Redo
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Token Cost */}
      {cost.entries.length > 0 && <CostBreakdown cost={cost} />}

      {/* Section Regeneration — Quick Actions */}
      {phase === 'done' && !isRunning && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
            Regenerate Section
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {SECTIONS.map((section) => {
              const stepIndex = steps.findIndex((s) => s.type === section.startStep)
              if (stepIndex < 0) return null
              return (
                <button
                  key={section.id}
                  onClick={() => onRetry(stepIndex)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-zinc-800/40 border border-white/5 text-[10px] text-zinc-400 hover:text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/20 transition-all"
                >
                  <RefreshCw size={10} />
                  {section.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Completion */}
      {phase === 'done' && (
        <CompletionPhase
          isSaving={isSaving}
          saveError={saveError}
          savedProjectId={savedProjectId}
          onSaveRetry={onSaveRetry}
          royaltyResult={royaltyResult}
        />
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        disabled={isRunning}
        className={cn(
          'w-full py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
          isRunning
            ? 'bg-[#2a2a2a] text-gray-600 cursor-not-allowed'
            : 'bg-[#3a3a3a] hover:bg-[#3a3a3a] text-gray-300',
        )}
      >
        <RotateCcw size={14} />
        Start Over
      </button>
    </div>
  )
}

// ── Status Icon ──

function StepStatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'pending':
      return <Circle size={14} className="text-gray-600" />
    case 'running':
      return <Loader2 size={14} className="animate-spin text-violet-400" />
    case 'done':
      return <CheckCircle2 size={14} className="text-emerald-400" />
    case 'error':
      return <AlertCircle size={14} className="text-red-400" />
    case 'skipped':
      return <Circle size={14} className="text-gray-700" />
  }
}
