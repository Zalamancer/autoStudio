/**
 * NB2MobileStep2 — "Generate" step for mobile AI character wizard.
 *
 * Contains: resolution, aspect ratio, auto/step toggle, generate button,
 * pipeline progress with inline mini-preview.
 */

import {
  Wand2, Loader2, X, AlertCircle,
  CheckCircle, Circle, RotateCw, ChevronDown, Play, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { useNB2Store, useNB2DerivedState } from '@/stores/useNB2Store'
import type { NB2StepStatus } from '@/types/nanoBanana2'

const RESOLUTION_OPTIONS: { label: string; value: '512' | '1024' | '2048' | '4096' }[] = [
  { label: '0.5K', value: '512' },
  { label: '1K', value: '1024' },
  { label: '2K', value: '2048' },
  { label: '4K', value: '4096' },
]

const ASPECT_RATIO_OPTIONS: { label: string; value: '1:1' | '3:2' | '2:3' | '3:4' | '4:3' | '9:16' | '16:9' }[] = [
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
]

const StepIcon = ({ status }: { status: NB2StepStatus['status'] }) => {
  switch (status) {
    case 'complete':
      return <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
    case 'generating':
      return <Loader2 size={14} className="text-blue-400 animate-spin flex-shrink-0" />
    case 'error':
      return <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
    default:
      return <Circle size={14} className="text-gray-600 flex-shrink-0" />
  }
}

export function NB2MobileStep2() {
  const prompt = useNB2Store((s) => s.prompt)
  const characterName = useNB2Store((s) => s.characterName)
  const resolution = useNB2Store((s) => s.resolution)
  const aspectRatio = useNB2Store((s) => s.aspectRatio)
  const autoMode = useNB2Store((s) => s.autoMode)
  const steps = useNB2Store((s) => s.steps)
  const isRunning = useNB2Store((s) => s.isRunning)
  const regeneratingStep = useNB2Store((s) => s.regeneratingStep)
  const expandedStep = useNB2Store((s) => s.expandedStep)
  const error = useNB2Store((s) => s.error)
  const result = useNB2Store((s) => s.result)
  const selectedStepId = useNB2Store((s) => s.selectedStepId)
  const editingPromptStep = useNB2Store((s) => s.editingPromptStep)

  const setResolution = useNB2Store((s) => s.setResolution)
  const setAspectRatio = useNB2Store((s) => s.setAspectRatio)
  const setAutoMode = useNB2Store((s) => s.setAutoMode)
  const setSelectedStepId = useNB2Store((s) => s.setSelectedStepId)
  const setExpandedStep = useNB2Store((s) => s.setExpandedStep)
  const setEditingPromptStep = useNB2Store((s) => s.setEditingPromptStep)
  const generate = useNB2Store((s) => s.generate)
  const continueStep = useNB2Store((s) => s.continueStep)
  const regenerateStepAction = useNB2Store((s) => s.regenerateStep)
  const cancel = useNB2Store((s) => s.cancel)

  const {
    completedCount, hasError, isComplete,
    nextPendingStepId, stepByStepInProgress,
  } = useNB2DerivedState()

  // Find latest completed step for mini-preview
  const latestCompleted = [...steps].reverse().find((s) => s.status === 'complete' && s.result)

  return (
    <div className="space-y-4">
      {/* Resolution */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Resolution</label>
        <div className="flex gap-2">
          {RESOLUTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setResolution(opt.value)}
              disabled={isRunning}
              className={cn(
                'flex-1 py-2 rounded-xl text-center transition-all border text-xs font-medium',
                resolution === opt.value
                  ? 'bg-[#4a7eff]/15 border-[#4a7eff]/30 text-[#4a7eff]'
                  : 'bg-[#1e1e1e] border-[#3a3a3a] text-zinc-500',
                isRunning && 'opacity-40 cursor-not-allowed',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Aspect Ratio</label>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_RATIO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAspectRatio(opt.value)}
              disabled={isRunning}
              className={cn(
                'px-3 py-1.5 rounded-lg text-center transition-all border text-xs font-medium',
                aspectRatio === opt.value
                  ? 'bg-[#4a7eff]/15 border-[#4a7eff]/30 text-[#4a7eff]'
                  : 'bg-[#1e1e1e] border-[#3a3a3a] text-zinc-500',
                isRunning && 'opacity-40 cursor-not-allowed',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto / Step-by-step toggle */}
      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-gray-400 font-medium">
          {autoMode ? 'Auto-generate all steps' : 'Step-by-step (manual)'}
        </span>
        <button
          onClick={() => setAutoMode(!autoMode)}
          disabled={isRunning || regeneratingStep !== null}
          className={cn(
            'relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0',
            autoMode ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]',
            (isRunning || regeneratingStep !== null) && 'opacity-40 cursor-not-allowed',
          )}
        >
          <div className={cn(
            'absolute top-[3px] w-[16px] h-[16px] rounded-full bg-white transition-transform',
            autoMode ? 'translate-x-[21px]' : 'translate-x-[3px]',
          )} />
        </button>
      </div>

      {/* Generate Button */}
      {!stepByStepInProgress && (
        <button
          onClick={isRunning ? cancel : generate}
          disabled={!prompt.trim() || (!isRunning && !characterName.trim())}
          className={cn(
            'w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors',
            isRunning
              ? 'bg-red-500/20 border border-red-500/40 text-red-400'
              : 'bg-[#4a7eff]/20 border border-[#4a7eff]/40 text-[#4a7eff] disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {isRunning ? (
            <><X size={14} /> Cancel</>
          ) : autoMode ? (
            <><Wand2 size={14} /> Generate All <CreditCostTag operation="nb2-generate" className="ml-1" /> <span className="text-[9px] text-gray-500">x8</span></>
          ) : (
            <><Wand2 size={14} /> Start Generation <CreditCostTag operation="nb2-generate" className="ml-1" /></>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Pipeline Progress */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">Pipeline</p>
            <p className="text-[11px] text-gray-600">{completedCount}/8</p>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', hasError ? 'bg-red-500' : 'bg-[#4a7eff]')}
              style={{ width: `${(completedCount / 8) * 100}%` }}
            />
          </div>

          {/* Step list */}
          <div className="space-y-1">
            {steps.map((step, i) => {
              const isExpanded = expandedStep === step.id
              const isSelected = selectedStepId === step.id
              const canRegenerate = (step.status === 'complete' || step.status === 'error') && !isRunning && !regeneratingStep
              const isRegenerating = regeneratingStep === step.id
              const conceptMissing = i > 0 && !result?.concept

              return (
                <div
                  key={step.id}
                  className={cn(
                    'rounded-xl border transition-colors',
                    isSelected ? 'ring-1 ring-[#4a7eff]/40' : '',
                    step.status === 'generating' || isRegenerating
                      ? 'border-blue-500/20 bg-blue-500/5'
                      : step.status === 'error'
                        ? 'border-red-500/20 bg-red-500/5'
                        : step.id === nextPendingStepId
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-[#3a3a3a]/50 bg-[#1e1e1e]/50',
                  )}
                  onClick={() => step.result && setSelectedStepId(step.id)}
                >
                  <div className="flex items-center gap-2 py-2 px-3 text-xs">
                    <StepIcon status={isRegenerating ? 'generating' : step.status} />
                    <span className="text-gray-500 w-3 text-right">{i + 1}.</span>
                    <span className={cn(
                      'flex-1 truncate',
                      step.status === 'complete' ? 'text-gray-400' : 'text-gray-500',
                      (step.status === 'generating' || isRegenerating) && 'text-blue-400',
                      step.status === 'error' && !isRegenerating && 'text-red-400',
                    )}>
                      {step.label}
                    </span>

                    {step.status === 'complete' && step.result && (
                      <img src={step.result} alt={step.label} className="w-6 h-6 rounded border border-[#3a3a3a] object-cover flex-shrink-0" />
                    )}

                    {step.status === 'error' && !isRegenerating && step.error && (
                      <span className="text-[9px] text-red-500 truncate max-w-[60px]" title={step.error}>{step.error}</span>
                    )}

                    {canRegenerate && !conceptMissing && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPromptStep(editingPromptStep === step.id ? null : step.id) }}
                          className={cn(
                            'p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0',
                            editingPromptStep === step.id ? 'text-[#4a7eff]' : 'text-gray-500',
                          )}
                        >
                          <FileText size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateStepAction(step.id) }}
                          className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-[#4a7eff] transition-colors flex-shrink-0"
                        >
                          <RotateCw size={12} />
                        </button>
                      </>
                    )}

                    {step.id === nextPendingStepId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); continueStep(step.id) }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-medium hover:bg-green-500/25 transition-colors flex-shrink-0"
                      >
                        <Play size={10} fill="currentColor" />
                        Go
                      </button>
                    )}

                    {step.prompt && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedStep(isExpanded ? null : step.id) }}
                        className={cn('p-1 rounded-lg hover:bg-white/10 text-gray-500 transition-all flex-shrink-0', isExpanded && 'rotate-180')}
                      >
                        <ChevronDown size={12} />
                      </button>
                    )}
                  </div>

                  {isExpanded && step.prompt && (
                    <div className="px-3 pb-2">
                      <div className="bg-black/30 rounded-lg p-2 max-h-[100px] overflow-y-auto">
                        <pre className="font-mono text-[10px] text-gray-400 whitespace-pre-wrap break-words leading-relaxed">{step.prompt}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inline mini-preview of latest completed step */}
      {latestCompleted?.result && (
        <div className="rounded-xl border border-[#3a3a3a] bg-[#1e1e1e] overflow-hidden">
          <div className="px-3 py-1.5 border-b border-[#3a3a3a]/50 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Latest: {latestCompleted.label}</span>
            <span className="text-[10px] text-gray-600">Swipe to Review for full view</span>
          </div>
          <div className="flex items-center justify-center p-3 bg-black/20">
            <img
              src={latestCompleted.result}
              alt={latestCompleted.label}
              className="max-h-[150px] max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Retry */}
      {!isRunning && hasError && !isComplete && (
        <button
          onClick={generate}
          className="w-full py-2.5 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCw size={14} /> Retry Pipeline
        </button>
      )}
    </div>
  )
}
