import { useState, useRef, useEffect } from 'react'
import { MessageSquareText, Send, Loader2, Trash2, CheckCircle2, XCircle, Zap, TrendingUp, Heart, Monitor, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useAIEditStore } from '@/stores/useAIEditStore'
import type { ChatMessage } from '@/stores/useAIEditStore'
import { useAgentWorkflowStore } from '@/stores/useAgentWorkflowStore'
import { hasGeminiService } from '@/services/gemini'
import type { WorkflowId } from '@/services/agentWorkflows'

const SUGGESTIONS = [
  'Make the narrator sound angry',
  'Change the title text to "Welcome!"',
  'Add a subtitle that says "Subscribe"',
  'Switch to 9:16 portrait mode',
]

const WORKFLOWS: { id: WorkflowId; label: string; icon: typeof TrendingUp; color: string }[] = [
  { id: 'optimize-virality', label: 'Virality', icon: TrendingUp, color: 'text-orange-400' },
  { id: 'enhance-engagement', label: 'Engage', icon: Heart, color: 'text-pink-400' },
  { id: 'platform-optimize', label: 'Platform', icon: Monitor, color: 'text-blue-400' },
  { id: 'add-production-value', label: 'Polish', icon: Sparkles, color: 'text-yellow-400' },
]

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed',
          isUser
            ? 'bg-green-500/20 text-green-100 border border-green-500/20'
            : 'bg-zinc-800/60 text-zinc-200 border border-white/5',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
            {message.actions.map((action, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[10px]"
              >
                {action.success ? (
                  <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                ) : (
                  <XCircle size={11} className="text-red-400 shrink-0" />
                )}
                <span className={action.success ? 'text-zinc-400' : 'text-red-400'}>
                  {action.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function AIEditPanel() {
  const { messages, isProcessing, sendMessage, clearHistory } = useAIEditStore(
    useShallow((s) => ({
      messages: s.messages,
      isProcessing: s.isProcessing,
      sendMessage: s.sendMessage,
      clearHistory: s.clearHistory,
    })),
  )

  const { activeWorkflowId, steps: workflowSteps, isRunning: isWorkflowRunning, summary: workflowSummary, startWorkflow } = useAgentWorkflowStore(
    useShallow((s) => ({
      activeWorkflowId: s.activeWorkflowId,
      steps: s.steps,
      isRunning: s.isRunning,
      summary: s.summary,
      startWorkflow: s.startWorkflow,
    })),
  )

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const hasGemini = hasGeminiService()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isProcessing])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isProcessing) return

    setInput('')
    await sendMessage(text)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!hasGemini) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-none flex items-center min-h-[49px] px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <MessageSquareText size={16} className="text-green-400" />
            <h3 className="text-sm font-semibold text-white">AI Edit</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <MessageSquareText size={32} className="mx-auto text-zinc-600" />
            <p className="text-sm text-zinc-400">Gemini API key required</p>
            <p className="text-xs text-zinc-600">
              Set VITE_GEMINI_API_KEY or configure the server proxy to use AI editing.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none flex items-center justify-between min-h-[49px] px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquareText size={16} className="text-green-400" />
          <h3 className="text-sm font-semibold text-white">AI Edit</h3>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Agent Workflows */}
      <div className="flex-none px-3 py-2 border-b border-white/5">
        <p className="text-[10px] text-zinc-500 mb-1.5 uppercase tracking-wider font-medium">Agent Workflows</p>
        <div className="grid grid-cols-4 gap-1.5">
          {WORKFLOWS.map((wf) => {
            const Icon = wf.icon
            const isActive = activeWorkflowId === wf.id && isWorkflowRunning
            return (
              <button
                key={wf.id}
                onClick={() => startWorkflow(wf.id)}
                disabled={isWorkflowRunning || isProcessing}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] transition-all border',
                  isActive
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : isWorkflowRunning || isProcessing
                      ? 'bg-zinc-800/30 border-white/5 text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40 hover:border-white/10',
                )}
              >
                {isActive ? <Loader2 size={14} className="animate-spin text-green-400" /> : <Icon size={14} className={wf.color} />}
                <span>{wf.label}</span>
              </button>
            )
          })}
        </div>

        {/* Workflow step progress */}
        {workflowSteps.length > 0 && (
          <div className="mt-2 space-y-1">
            {workflowSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-1.5 text-[10px]">
                {step.status === 'running' ? (
                  <Loader2 size={10} className="animate-spin text-green-400 shrink-0" />
                ) : step.status === 'completed' ? (
                  <CheckCircle2 size={10} className="text-green-400 shrink-0" />
                ) : step.status === 'failed' ? (
                  <XCircle size={10} className="text-red-400 shrink-0" />
                ) : step.status === 'skipped' ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 shrink-0" />
                )}
                <span className={cn(
                  step.status === 'running' ? 'text-green-300' :
                  step.status === 'completed' ? 'text-zinc-400' :
                  step.status === 'failed' ? 'text-red-400' :
                  'text-zinc-600',
                )}>
                  {step.label}
                </span>
                {step.result && (
                  <span className="text-zinc-600 truncate ml-auto max-w-[120px]" title={step.result}>
                    {step.result}
                  </span>
                )}
              </div>
            ))}
            {workflowSummary && (
              <p className="text-[10px] text-green-400/70 mt-1 italic">{workflowSummary}</p>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Zap size={20} className="text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-300">Edit with natural language</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[240px]">
                Describe changes to your project and I'll apply them. Try one of these:
              </p>
            </div>
            <div className="space-y-1.5 w-full">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-zinc-800/40 border border-white/5 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40 hover:border-white/10 transition-all"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/60 border border-white/5 rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-green-400" />
                  <span className="text-xs text-zinc-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-none p-3 border-t border-white/5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to change..."
            rows={1}
            className="flex-1 bg-zinc-800/50 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-zinc-200 resize-none focus:border-green-500/50 focus:outline-none placeholder:text-zinc-600 transition-colors shadow-inner max-h-24 overflow-y-auto"
            style={{ minHeight: '38px' }}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-200 shrink-0',
              !input.trim() || isProcessing
                ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-white/5'
                : 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20',
            )}
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
