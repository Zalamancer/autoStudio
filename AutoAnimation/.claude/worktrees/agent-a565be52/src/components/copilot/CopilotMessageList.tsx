import { useRef, useEffect } from 'react'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { CopilotMessage } from './CopilotMessage'
import { Loader2, Bot } from 'lucide-react'

export function CopilotMessageList() {
  const messages = useCopilotStore((s) => s.messages)
  const phase = useCopilotStore((s) => s.phase)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, phase])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
          <Bot size={20} className="text-green-400" />
        </div>
        <h3 className="text-sm font-medium text-zinc-200 mb-1">AI Copilot</h3>
        <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[220px]">
          Ask me to modify your project, add elements, or answer questions about your canvas.
        </p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="py-2 space-y-1">
        {messages.map((msg) => (
          <CopilotMessage key={msg.id} message={msg} />
        ))}

        {/* Thinking indicator */}
        {phase === 'thinking' && (
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-green-500/10 flex items-center justify-center">
              <Loader2 size={11} className="text-green-400 animate-spin" />
            </div>
            <span className="text-xs text-zinc-500">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  )
}
