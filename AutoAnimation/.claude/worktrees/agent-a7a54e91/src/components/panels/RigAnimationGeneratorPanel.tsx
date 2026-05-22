import { useState, useCallback, useRef } from 'react'
import { Wand2, Loader2, Play, Trash2, Repeat, AlertCircle } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'
import { useRigStore } from '@/stores/useRigStore'
import { useEngineContext } from '@bonerigging/editor'
import {
  generateRigAnimation,
  toBoneRiggingAnimation,
  type RigAnimationResult,
} from '@/services/rigAnimationGenerator'
import { CreditCostTag } from '@/components/credits/CreditCostTag'

interface GeneratedEntry {
  id: string
  result: RigAnimationResult
  /** Index in the bonerigging AnimationManager.animations array */
  animIndex: number
}

const DURATION_OPTIONS = [
  { label: '0.5s', value: 0.5 },
  { label: '1s', value: 1 },
  { label: '2s', value: 2 },
  { label: '3s', value: 3 },
]

export function RigAnimationGeneratorPanel() {
  const activeRigId = useRigStore((s) => s.activeRigId)
  const rigs = useRigStore((s) => s.rigs)

  const engine = useEngineContext()

  // Track how many animations existed before our first generation,
  // so we can compute correct indices after import.
  const nextAnimIndexRef = useRef<number | null>(null)

  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(1)
  const [loop, setLoop] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<GeneratedEntry[]>([])

  const rig = activeRigId ? rigs[activeRigId] : null

  const handleGenerate = useCallback(async () => {
    if (!rig || !activeRigId || !prompt.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await generateRigAnimation({
        prompt: prompt.trim(),
        skeleton: rig.skeleton,
        imageWidth: rig.imageWidth,
        imageHeight: rig.imageHeight,
        durationSeconds: duration,
        loop,
      })

      // Convert to bonerigging Animation format and inject into the engine
      const brAnim = toBoneRiggingAnimation(result, engine.fps || 24)
      engine.handleAnimImport(JSON.stringify([brAnim]))

      // Compute the index: import appends to the end
      // We track indices via a counter since we can't directly access animManagerRef
      if (nextAnimIndexRef.current === null) {
        // First generation: count existing animations from serialized data
        let existingCount = 0
        if (rig.boneriggingSerializedData) {
          try {
            const parsed = JSON.parse(rig.boneriggingSerializedData)
            existingCount = (parsed.animations ?? []).length
          } catch { /* ignore */ }
        }
        nextAnimIndexRef.current = existingCount
      }

      const animIndex = nextAnimIndexRef.current
      nextAnimIndexRef.current = animIndex + 1

      setGenerated((prev) => [
        ...prev,
        { id: `gen_${Date.now()}`, result, animIndex },
      ])
      setPrompt('')
    } catch (err: any) {
      setError(err.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }, [rig, activeRigId, prompt, duration, loop, engine])

  const handleDelete = useCallback(
    (entry: GeneratedEntry) => {
      engine.handleAnimDeleteAnimation(entry.animIndex)
      setGenerated((prev) => {
        const filtered = prev.filter((g) => g.id !== entry.id)
        // Adjust indices for entries that came after the deleted one
        return filtered.map((g) =>
          g.animIndex > entry.animIndex
            ? { ...g, animIndex: g.animIndex - 1 }
            : g,
        )
      })
      if (nextAnimIndexRef.current !== null) {
        nextAnimIndexRef.current = nextAnimIndexRef.current - 1
      }
    },
    [engine],
  )

  const handlePlay = useCallback(
    (entry: GeneratedEntry) => {
      // Load the animation by index (selects it), then start playback
      engine.handleAnimLoadAnimation(entry.animIndex)
      engine.handleAnimPlay()
    },
    [engine],
  )

  if (!rig) {
    return (
      <div className="px-3 py-2 text-xs text-zinc-500">
        No rig selected. Place bones first.
      </div>
    )
  }

  if (rig.skeleton.joints.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-zinc-500">
        Add bones to the skeleton before generating animations.
      </div>
    )
  }

  return (
    <div className="px-3 py-2 space-y-2">
      {/* Prompt input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading && prompt.trim()) handleGenerate()
          }}
          placeholder="e.g. wave hand, idle breathing..."
          disabled={loading}
          className="flex-1 px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Duration */}
        <PanelSelect
          value={String(duration)}
          onChange={(v) => setDuration(Number(v))}
          options={DURATION_OPTIONS.map((opt) => ({
            value: String(opt.value),
            label: opt.label,
          }))}
        />

        {/* Loop toggle */}
        <button
          onClick={() => setLoop(!loop)}
          disabled={loading}
          className={`flex items-center gap-1 px-1.5 py-1 text-[10px] rounded border transition-colors ${
            loop
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
              : 'border-zinc-700 bg-zinc-800 text-zinc-500'
          } disabled:opacity-50`}
        >
          <Repeat size={10} />
          Loop
        </button>

        <div className="flex-1" />

        {/* Credit tag */}
        <CreditCostTag operation="gemini-rig-animation" />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Wand2 size={10} />
          )}
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-1.5 p-2 rounded bg-red-500/10 border border-red-500/20">
          <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-[10px] text-red-400 leading-tight">{error}</span>
        </div>
      )}

      {/* Generated animations list */}
      {generated.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
            Generated
          </span>
          {generated.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-1.5 p-1.5 rounded bg-zinc-800/50 border border-zinc-700/50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-zinc-300 truncate">
                  {entry.result.name}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                  <span>{entry.result.durationSeconds}s</span>
                  {entry.result.loop && (
                    <span className="flex items-center gap-0.5">
                      <Repeat size={8} /> loop
                    </span>
                  )}
                  <span>{entry.result.keyframes.length} kf</span>
                </div>
              </div>

              <button
                onClick={() => handlePlay(entry)}
                className="p-1 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-green-400 transition-colors"
                title="Select & play"
              >
                <Play size={12} />
              </button>
              <button
                onClick={() => handleDelete(entry)}
                className="p-1 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
