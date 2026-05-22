import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'

const TIPS = [
  'Analyzing your script structure...',
  'Selecting the best template...',
  'Planning character emotions...',
  'Crafting dialogue timing...',
  'Choosing visual elements...',
  'Designing text overlays...',
]

export function PlanningSpinner() {
  const [tipIndex, setTipIndex] = useState(0)
  const reset = useOrchestratorStore((s) => s.reset)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-panel-bg/80 border border-panel-border/40 rounded-xl p-6 flex flex-col items-center gap-4 animate-fade-in-up">
      {/* Bouncing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-thinking-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-sm font-medium text-white">AI is crafting your clip...</p>
        <p
          className="text-xs text-gray-500 transition-opacity duration-300 h-4"
          key={tipIndex}
        >
          {TIPS[tipIndex]}
        </p>
      </div>

      <button
        onClick={reset}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-colors"
      >
        <X size={10} />
        Cancel
      </button>
    </div>
  )
}
