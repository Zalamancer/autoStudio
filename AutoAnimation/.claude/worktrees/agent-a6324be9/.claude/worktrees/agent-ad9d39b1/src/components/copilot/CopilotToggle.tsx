import { useCopilotStore } from '@/stores/useCopilotStore'
import { Bot } from 'lucide-react'

export function CopilotToggle() {
  const toggle = useCopilotStore((s) => s.toggle)
  const isOpen = useCopilotStore((s) => s.isOpen)
  const phase = useCopilotStore((s) => s.phase)

  if (isOpen) return null

  return (
    <button
      onClick={toggle}
      className="fixed bottom-20 right-4 z-30 w-11 h-11 rounded-full bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
      title="Open AI Copilot (Cmd+K)"
    >
      <Bot size={20} />
      {phase === 'thinking' && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
      )}
    </button>
  )
}
