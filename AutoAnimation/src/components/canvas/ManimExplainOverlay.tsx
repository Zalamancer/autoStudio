import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { X, Send, Lightbulb, Loader2, Play } from 'lucide-react'
import { useManimExplainStore } from '@/stores/useManimExplainStore'
import { askExplainQuestion } from '@/services/manim/explainService'
import { cn } from '@/lib/utils'

export const ManimExplainOverlay = memo(function ManimExplainOverlay() {
  const {
    isExplainOpen,
    currentContext,
    chatHistory,
    isLoading,
    knowledgeGraph,
    closeExplain,
    addUserMessage,
    addAssistantMessage,
    setLoading,
  } = useManimExplainStore()

  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory.length])

  const handleSend = useCallback(async () => {
    const question = input.trim()
    if (!question || !currentContext) return

    setInput('')
    addUserMessage(question)
    setLoading(true)

    try {
      const response = await askExplainQuestion(question, currentContext, knowledgeGraph)
      addAssistantMessage(response.text, response.supplementaryVideoUrl)
    } catch {
      addAssistantMessage('Sorry, I encountered an error generating an explanation. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [input, currentContext, knowledgeGraph, addUserMessage, addAssistantMessage, setLoading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleSuggestedQuestion = useCallback((question: string) => {
    setInput(question)
  }, [])

  if (!isExplainOpen || !currentContext) return null

  return (
    <div className="absolute inset-y-0 right-0 w-[360px] z-40 bg-zinc-900/95 backdrop-blur-sm border-l border-zinc-700/50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-400" />
          <span className="text-sm font-medium text-zinc-200">Pause &amp; Explain</span>
        </div>
        <button
          onClick={closeExplain}
          className="p-1 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Context Summary */}
      <div className="px-4 py-3 border-b border-zinc-700/30 bg-zinc-800/30">
        <p className="text-xs text-zinc-400 mb-1">Currently on screen:</p>
        <p className="text-xs text-zinc-300 leading-relaxed">{currentContext.screenSummary}</p>
        {currentContext.visibleFormulas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {currentContext.visibleFormulas.map((f, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded-full border border-violet-500/20"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {chatHistory.length === 0 && currentContext.suggestedQuestions.length > 0 && (
        <div className="px-4 py-3 border-b border-zinc-700/30">
          <p className="text-xs text-zinc-500 mb-2">Suggested questions:</p>
          <div className="flex flex-col gap-1.5">
            {currentContext.suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedQuestion(q)}
                className="text-left text-xs text-zinc-300 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed',
              msg.role === 'user'
                ? 'ml-auto bg-violet-600/20 text-violet-100 border border-violet-500/20'
                : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/30',
            )}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>
            {msg.supplementaryVideoUrl && (
              <div className="mt-2 rounded-md overflow-hidden bg-zinc-900 border border-zinc-700/30">
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-zinc-400">
                  <Play size={10} />
                  Supplementary visualization
                </div>
                <video src={msg.supplementaryVideoUrl} controls className="w-full" playsInline />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 size={12} className="animate-spin" />
            Generating explanation...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-700/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about what's on screen..."
            className="flex-1 bg-zinc-800 text-zinc-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
})
