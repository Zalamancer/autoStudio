import { useCopilotStore } from '@/stores/useCopilotStore'
import { CopilotMessageList } from './CopilotMessageList'
import { CopilotInput } from './CopilotInput'
import { CopilotSuggestions } from './CopilotSuggestions'
import { Trash2, Bot } from 'lucide-react'

/**
 * CopilotDrawer — renders inside the right panel area when copilot is open.
 * No fixed positioning — it fills whatever container it's placed in.
 */
export function CopilotDrawer() {
  const clearHistory = useCopilotStore((s) => s.clearHistory)
  const messageCount = useCopilotStore((s) => s.messages.length)
  const phase = useCopilotStore((s) => s.phase)

  return (
    <div className="flex flex-col h-full">
      {/* Compact header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-zinc-700/50">
        <Bot size={13} className="text-green-400" />
        <span className="text-xs font-medium text-zinc-300 flex-1">Copilot</span>
        {phase === 'thinking' && (
          <span className="text-[10px] text-amber-400 animate-pulse">thinking...</span>
        )}
        {messageCount > 0 && (
          <button
            onClick={clearHistory}
            className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear history"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Message list */}
      <CopilotMessageList />

      {/* Suggestions */}
      <CopilotSuggestions />

      {/* Input */}
      <CopilotInput />
    </div>
  )
}
