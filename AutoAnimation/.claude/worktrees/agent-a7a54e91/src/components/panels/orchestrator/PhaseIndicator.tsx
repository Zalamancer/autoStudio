import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PHASE_STEPS, getPhaseIndex } from './constants'
import type { OrchestratorPhase } from '@/types/orchestrator'

interface PhaseIndicatorProps {
  phase: OrchestratorPhase
}

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const activeIndex = getPhaseIndex(phase)

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {PHASE_STEPS.map((step, i) => {
        const isComplete = i < activeIndex
        const isActive = i === activeIndex
        const isFuture = i > activeIndex

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Dot */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300',
                  isComplete && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                  isActive && 'bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-phase-pulse',
                  isFuture && 'bg-[#2a2a2a] text-gray-600 border border-[#3a3a3a]',
                )}
              >
                {isComplete ? <Check size={12} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[9px] font-medium transition-colors',
                  isComplete && 'text-emerald-400',
                  isActive && 'text-amber-400',
                  isFuture && 'text-gray-600',
                )}
              >
                {step}
              </span>
            </div>

            {/* Connecting line */}
            {i < PHASE_STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1.5 mt-[-14px]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    i < activeIndex ? 'bg-emerald-500/40' : 'bg-[#3a3a3a]/50',
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
