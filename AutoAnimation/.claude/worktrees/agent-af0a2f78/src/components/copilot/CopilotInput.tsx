import { useState, useCallback, useRef, useEffect } from 'react'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { SendHorizontal, Loader2 } from 'lucide-react'

export function CopilotInput() {
  const [text, setText] = useState('')
  const sendMessage = useCopilotStore((s) => s.sendMessage)
  const phase = useCopilotStore((s) => s.phase)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isThinking = phase === 'thinking' || phase === 'executing'

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isThinking) return
    sendMessage(trimmed)
    setText('')
  }, [text, isThinking, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="shrink-0 border-t border-white/5 px-3 py-2.5">
      <div className="flex items-end gap-2 bg-zinc-800/80 border border-white/10 rounded-xl px-3 py-2 focus-within:border-green-500/40 transition-colors">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isThinking ? 'Thinking...' : 'Ask the copilot...'}
          disabled={isThinking}
          rows={1}
          className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none min-h-[20px] max-h-[80px] disabled:opacity-50"
          style={{ lineHeight: '20px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isThinking}
          className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isThinking ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <SendHorizontal size={14} />
          )}
        </button>
      </div>
      <div className="text-[10px] text-zinc-600 mt-1 text-center">
        Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
