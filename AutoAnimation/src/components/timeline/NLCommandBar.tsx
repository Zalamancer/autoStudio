/**
 * NLCommandBar — Natural language command input for timeline editing.
 *
 * Text field with submit button, processing spinner, and preview panel.
 */

import { useState, useCallback, memo } from 'react'
import { Send, Loader2, Check, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNLEditStore } from '@/stores/useNLEditStore'

interface NLCommandBarProps {
  onClose: () => void
}

export const NLCommandBar = memo(function NLCommandBar({ onClose }: NLCommandBarProps) {
  const [input, setInput] = useState('')
  const isProcessing = useNLEditStore((s) => s.isProcessing)
  const pendingCommand = useNLEditStore((s) => s.pendingCommand)
  const lastError = useNLEditStore((s) => s.lastError)
  const submitCommand = useNLEditStore((s) => s.submitCommand)
  const applyPending = useNLEditStore((s) => s.applyPending)
  const cancelPending = useNLEditStore((s) => s.cancelPending)

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isProcessing) return
    submitCommand(input.trim())
  }, [input, isProcessing, submitCommand])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === 'Escape') {
        if (pendingCommand) {
          cancelPending()
        } else {
          onClose()
        }
      }
    },
    [handleSubmit, pendingCommand, cancelPending, onClose],
  )

  const handleApply = useCallback(() => {
    applyPending()
    setInput('')
  }, [applyPending])

  return (
    <div className="bg-zinc-900/90 backdrop-blur-sm border-b border-white/5">
      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Sparkles size={14} className="text-indigo-400 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type a command: "zoom in on the word amazing", "make intro faster"...'
          className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          autoFocus
          disabled={isProcessing}
        />
        {isProcessing ? (
          <Loader2 size={14} className="text-indigo-400 animate-spin shrink-0" />
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={cn(
              'p-1 rounded transition-colors shrink-0',
              input.trim() ? 'text-indigo-400 hover:text-indigo-300' : 'text-zinc-700',
            )}
          >
            <Send size={14} />
          </button>
        )}
        <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* Preview panel */}
      {pendingCommand && (
        <div className="px-3 py-2 border-t border-white/5 bg-zinc-800/50">
          <div className="text-[10px] text-zinc-500 mb-1">Preview:</div>
          <p className="text-[11px] text-zinc-300">
            {pendingCommand.explanation || `Will execute ${pendingCommand.actions.length} action(s)`}
          </p>
          {pendingCommand.confidence < 0.7 && (
            <p className="text-[10px] text-amber-500 mt-1">Low confidence. Please review carefully.</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleApply}
              className="flex items-center gap-1 text-[10px] text-white bg-indigo-600 hover:bg-indigo-500 rounded px-2 py-1 transition-colors"
            >
              <Check size={10} /> Apply
            </button>
            <button
              onClick={cancelPending}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-300 rounded px-2 py-1 transition-colors"
            >
              <X size={10} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {lastError && !pendingCommand && (
        <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-red-400">{lastError}</div>
      )}
    </div>
  )
})
