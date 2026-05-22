import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect } from '@/components/ui/panel-controls'
import { useGenerationStore } from '@/stores/useGenerationStore'

const PROMPT_MODE_OPTIONS = [
  { value: 'reference', label: 'Reference' },
  { value: 'direction', label: 'Direction' },
  { value: 'freeform', label: 'Freeform' },
]

const VISUAL_DENSITY_OPTIONS = [
  { value: 'sparse', label: 'Sparse' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'dense', label: 'Dense' },
]

const ANIMATION_SPEED_OPTIONS = [
  { value: 'snappy', label: 'Snappy' },
  { value: 'standard', label: 'Standard' },
  { value: 'cinematic', label: 'Cinematic' },
]

const TEXT_ROLE_OPTIONS = [
  { value: 'text-is-effect', label: 'Text IS effect' },
  { value: 'text-in-scene', label: 'Text IN scene' },
]

const TEXT_COUNT_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'multi-block', label: 'Multi-block (v2)' },
]

const CONCEPT_META: Record<string, { label: string; placeholder: string }> = {
  reference: { label: 'Reference (be specific)', placeholder: 'airport departure board' },
  direction: { label: 'Direction (aesthetic)', placeholder: 'minimal industrial' },
  freeform: { label: 'Vibe (loose)', placeholder: 'assembly' },
}

export function GenerateTab() {
  const config = useGenerationStore((s) => s.config)
  const generating = useGenerationStore((s) => s.generating)
  const lastResults = useGenerationStore((s) => s.lastResults)
  const error = useGenerationStore((s) => s.error)
  const setConfig = useGenerationStore((s) => s.setConfig)
  const generate = useGenerationStore((s) => s.generate)

  const meta = CONCEPT_META[config.promptMode] ?? CONCEPT_META.direction

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Concept input — top */}
        <div className="mb-3">
          <label className="text-gray-400 text-[11px] font-medium block mb-1">{meta.label}</label>
          <input
            value={config.concept}
            onChange={(e) => setConfig('concept', e.target.value)}
            placeholder={meta.placeholder}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
          />
        </div>

        {/* All dropdowns stacked */}
        <PanelSelect
          label="Prompt Mode"
          options={PROMPT_MODE_OPTIONS}
          value={config.promptMode}
          onChange={(v) => setConfig('promptMode', v as typeof config.promptMode)}
        />
        <PanelSelect
          label="Visual Density"
          options={VISUAL_DENSITY_OPTIONS}
          value={config.visualDensity}
          onChange={(v) => setConfig('visualDensity', v as typeof config.visualDensity)}
        />
        <PanelSelect
          label="Animation Speed"
          options={ANIMATION_SPEED_OPTIONS}
          value={config.animationSpeed}
          onChange={(v) => setConfig('animationSpeed', v as typeof config.animationSpeed)}
        />
        <PanelSelect
          label="Text Role"
          options={TEXT_ROLE_OPTIONS}
          value={config.textRole}
          onChange={(v) => setConfig('textRole', v as typeof config.textRole)}
        />
        <PanelSelect
          label="Text Count"
          options={TEXT_COUNT_OPTIONS}
          value={config.textCount}
          onChange={(v) => setConfig('textCount', v as typeof config.textCount)}
        />

        {/* Error display */}
        {error && <div className="px-3 py-2 mt-2 rounded-lg bg-red-500/10 text-red-400 text-xs">{error}</div>}

        {/* Results list */}
        {lastResults.length > 0 && (
          <div className="space-y-1 mt-3">
            <div className="text-xs text-zinc-400 font-medium">Generated templates</div>
            {lastResults.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] text-xs"
              >
                <span className="text-zinc-300 truncate">{r.id}</span>
                {r.predictedScore != null && (
                  <span className="text-zinc-500 shrink-0 ml-2">score {r.predictedScore.toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed footer */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={generate}
          disabled={generating || !config.concept.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
            generating || !config.concept.trim()
              ? 'bg-[#4a7eff]/30 text-white/40 cursor-not-allowed'
              : 'bg-[#4a7eff] text-white hover:bg-[#5a8eff]',
          )}
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating... ~2-3 min
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate 5 templates
            </>
          )}
        </button>
      </div>
    </>
  )
}
