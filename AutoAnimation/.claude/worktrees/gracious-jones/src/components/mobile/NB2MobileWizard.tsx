/**
 * NB2MobileWizard — Full-screen mobile wizard for AI character generation.
 *
 * Replaces the 3-page carousel when the character generator overlay is active on mobile.
 * 3 steps: Describe → Generate → Review & Save.
 */

import { useState } from 'react'
import { ArrowLeft, ChevronRight, User, Wand2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNB2Store, useNB2DerivedState } from '@/stores/useNB2Store'
import { NB2MobileStep1 } from './NB2MobileStep1'
import { NB2MobileStep2 } from './NB2MobileStep2'
import { NB2MobileStep3 } from './NB2MobileStep3'

const STEPS = [
  { id: 'describe', label: 'Describe', icon: User },
  { id: 'generate', label: 'Generate', icon: Wand2 },
  { id: 'review', label: 'Review & Save', icon: Eye },
] as const

interface NB2MobileWizardProps {
  onClose: () => void
}

export function NB2MobileWizard({ onClose }: NB2MobileWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const characterName = useNB2Store((s) => s.characterName)
  const prompt = useNB2Store((s) => s.prompt)
  const isRunning = useNB2Store((s) => s.isRunning)
  const steps = useNB2Store((s) => s.steps)

  const { completedCount } = useNB2DerivedState()

  const hasAnyResult = steps.some((s) => s.status === 'complete' && s.result)
  const canGoNext = currentStep === 0
    ? characterName.trim() !== '' && prompt.trim() !== ''
    : currentStep === 1
      ? hasAnyResult
      : false

  const handleBack = () => {
    if (currentStep === 0) {
      if (isRunning) {
        useNB2Store.getState().cancel()
      }
      onClose()
    } else {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  const StepIcon = STEPS[currentStep].icon

  return (
    <div
      className="w-screen flex flex-col bg-zinc-950 text-zinc-100"
      style={{ height: '100dvh' }}
    >
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <button
          onClick={handleBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <StepIcon size={16} className="text-[#4a7eff] shrink-0" />
          <span className="text-sm font-medium truncate">{STEPS[currentStep].label}</span>
        </div>
        <span className="text-[11px] text-gray-500 shrink-0">{currentStep + 1}/{STEPS.length}</span>
      </div>

      {/* Step progress bar */}
      <div className="shrink-0 flex gap-1 px-4 py-2">
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => {
              // Allow tapping on completed/accessible steps
              if (i === 0) setCurrentStep(0)
              else if (i === 1 && (characterName.trim() && prompt.trim())) setCurrentStep(1)
              else if (i === 2 && hasAnyResult) setCurrentStep(2)
            }}
            className={cn(
              'flex-1 h-1 rounded-full transition-all duration-300',
              i < currentStep
                ? 'bg-[#4a7eff]'
                : i === currentStep
                  ? 'bg-[#4a7eff]/60'
                  : 'bg-[#3a3a3a]',
            )}
          />
        ))}
      </div>

      {/* Generating indicator (visible on non-generate steps) */}
      {isRunning && currentStep !== 1 && (
        <div className="shrink-0 px-4 py-1.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] text-blue-400">Generating... ({completedCount}/8)</span>
          <button
            onClick={() => setCurrentStep(1)}
            className="ml-auto text-[10px] text-blue-400 underline"
          >
            View progress
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {currentStep === 0 && <NB2MobileStep1 />}
        {currentStep === 1 && <NB2MobileStep2 />}
        {currentStep === 2 && <NB2MobileStep3 />}
      </div>

      {/* Bottom navigation */}
      <div className="shrink-0 px-4 py-3 border-t border-white/5 flex gap-3">
        <button
          onClick={handleBack}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.03] border border-white/[0.06] transition-colors"
        >
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </button>
        {currentStep < STEPS.length - 1 && (
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors',
              canGoNext
                ? 'bg-[#4a7eff]/20 border border-[#4a7eff]/40 text-[#4a7eff]'
                : 'bg-[#1e1e1e] border border-[#3a3a3a] text-gray-600 cursor-not-allowed',
            )}
          >
            {currentStep === 0 ? 'Next: Settings' : 'Next: Review'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
