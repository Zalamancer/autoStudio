import { useMemo } from 'react'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { getCopilotSuggestions } from '@/services/copilot/suggestions'

export function CopilotSuggestions() {
  const sendMessage = useCopilotStore((s) => s.sendMessage)
  const messageCount = useCopilotStore((s) => s.messages.length)
  const phase = useCopilotStore((s) => s.phase)

  // Regenerate suggestions when message count changes
  const suggestions = useMemo(() => getCopilotSuggestions(), [messageCount])

  if (phase === 'thinking' || phase === 'executing') return null
  if (suggestions.length === 0) return null

  return (
    <div className="shrink-0 px-3 pb-1.5">
      <div className="flex flex-wrap gap-1">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => sendMessage(s.prompt)}
            className="px-2.5 py-1 rounded-full bg-zinc-800 border border-white/5 text-[10px] text-zinc-400 hover:text-zinc-200 hover:border-green-500/30 hover:bg-green-500/5 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
