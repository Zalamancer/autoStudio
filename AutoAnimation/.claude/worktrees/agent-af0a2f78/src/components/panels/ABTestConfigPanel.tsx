/**
 * ABTestConfigPanel — Test configuration UI for A/B testing video variations.
 */

import { useState } from 'react'
import { FlaskConical, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useABTestStore } from '@/stores/useABTestStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import type { VariationField, VariationVariable } from '@/types/orchestrator'

const VARIABLE_OPTIONS: { field: VariationField; label: string; description: string }[] = [
  { field: 'voice', label: 'Voice', description: 'Change character voices' },
  { field: 'musicMood', label: 'Music Mood', description: 'Change background music mood' },
  { field: 'textStyle', label: 'Text Style', description: 'Change fonts and text appearance' },
  { field: 'characterPosition', label: 'Character Position', description: 'Shift character positions' },
  { field: 'template', label: 'Template', description: 'Change motion graphics template' },
  { field: 'aspectRatio', label: 'Aspect Ratio', description: 'Change video dimensions' },
  { field: 'captionStyle', label: 'Caption Style', description: 'Change caption display mode' },
  { field: 'pacing', label: 'Pacing', description: 'Adjust video speed and timing' },
]

export function ABTestConfigPanel() {
  const prompt = useOrchestratorStore((s) => s.prompt)
  const configureTest = useABTestStore((s) => s.configureTest)
  const startTest = useABTestStore((s) => s.startTest)
  const isRunning = useABTestStore((s) => s.isRunning)

  const [selectedFields, setSelectedFields] = useState<Set<VariationField>>(new Set())
  const [strategy, setStrategy] = useState<'isolated' | 'random' | 'guided'>('isolated')
  const [variantCount, setVariantCount] = useState<2 | 3>(2)

  const toggleField = (field: VariationField) => {
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (next.has(field)) {
        next.delete(field)
      } else {
        next.add(field)
      }
      return next
    })
  }

  const handleRunTest = () => {
    const variables: VariationVariable[] = Array.from(selectedFields).map((field) => ({ field }))

    configureTest({
      basePrompt: prompt,
      variables,
      strategy,
      variantCount,
    })

    startTest()
  }

  const estimatedCredits = variantCount * 15 // Rough estimate

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <FlaskConical size={16} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">A/B Test Config</h3>
      </div>

      {/* Variable selection */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Variables to Test</label>
        <div className="grid grid-cols-2 gap-1.5">
          {VARIABLE_OPTIONS.map((opt) => (
            <button
              key={opt.field}
              onClick={() => toggleField(opt.field)}
              className={cn(
                'text-left p-2 rounded-lg border transition-all text-[10px]',
                selectedFields.has(opt.field)
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                  : 'border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-white/10',
              )}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-zinc-600 mt-0.5">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Strategy</label>
        <div className="flex gap-2">
          {(['isolated', 'random', 'guided'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={cn(
                'flex-1 text-[10px] py-1.5 rounded-lg border transition-all capitalize',
                strategy === s
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                  : 'border-white/5 text-zinc-500 hover:text-zinc-300',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Variant count */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Variant Count</label>
        <div className="flex gap-2">
          {([2, 3] as const).map((n) => (
            <button
              key={n}
              onClick={() => setVariantCount(n)}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-lg border transition-all',
                variantCount === n
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                  : 'border-white/5 text-zinc-500 hover:text-zinc-300',
              )}
            >
              {n} variants
            </button>
          ))}
        </div>
      </div>

      {/* Cost estimate */}
      <div className="p-2 bg-zinc-800/30 rounded-lg text-[10px] text-zinc-500">
        Estimated cost: ~{estimatedCredits} credits ({variantCount} variants)
      </div>

      {/* Run button */}
      <button
        onClick={handleRunTest}
        disabled={selectedFields.size === 0 || isRunning}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
          selectedFields.size > 0 && !isRunning
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
        )}
      >
        <Play size={14} />
        {isRunning ? 'Running...' : 'Run A/B Test'}
      </button>
    </div>
  )
}
