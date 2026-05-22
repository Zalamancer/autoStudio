import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Loader2,
  Radio,
  Volume2,
  AlertCircle,
  Settings2,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LiveAvatarSession,
  createLiveAvatarSession,
  type LiveAvatarStatus,
  type ConversationTurn,
  type LiveAvatarConfig,
} from '@/services/liveAvatar'

const STATUS_LABELS: Record<LiveAvatarStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  listening: 'Listening...',
  'agent-speaking': 'Agent Speaking',
  error: 'Error',
}

const STATUS_COLORS: Record<LiveAvatarStatus, string> = {
  disconnected: 'text-zinc-500',
  connecting: 'text-yellow-400',
  connected: 'text-green-400',
  listening: 'text-blue-400',
  'agent-speaking': 'text-purple-400',
  error: 'text-red-400',
}

export function LiveAvatarPanel() {
  const [status, setStatus] = useState<LiveAvatarStatus>('disconnected')
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [error, setError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [micMuted, setMicMuted] = useState(false)

  // Config state
  const [agentId, setAgentId] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [firstMessage, setFirstMessage] = useState('Hello! How can I help you today?')
  const [systemPrompt, setSystemPrompt] = useState('')

  const sessionRef = useRef<LiveAvatarSession | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

  const handleConnect = useCallback(async () => {
    if (!agentId.trim()) {
      setError('Please enter an ElevenLabs Agent ID')
      return
    }

    setError(null)
    setTurns([])

    const config: LiveAvatarConfig = {
      agentId: agentId.trim(),
      ...(voiceId.trim() && { voiceId: voiceId.trim() }),
      ...(firstMessage.trim() && { firstMessage: firstMessage.trim() }),
      ...(systemPrompt.trim() && { systemPrompt: systemPrompt.trim() }),
    }

    const session = createLiveAvatarSession(config)
    sessionRef.current = session

    session.on('status-change', setStatus)
    session.on('turn', (turn) => {
      setTurns((prev) => [...prev, turn])
    })
    session.on('error', (msg) => {
      setError(msg)
    })

    await session.connect()
  }, [agentId, voiceId, firstMessage, systemPrompt])

  const handleDisconnect = useCallback(() => {
    sessionRef.current?.disconnect()
    sessionRef.current = null
  }, [])

  const handleSendText = useCallback(() => {
    if (!textInput.trim() || !sessionRef.current) return
    sessionRef.current.sendTextMessage(textInput.trim())
    setTextInput('')
  }, [textInput])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendText()
      }
    },
    [handleSendText],
  )

  const toggleMic = useCallback(() => {
    const next = !micMuted
    setMicMuted(next)
    sessionRef.current?.setMicMuted(next)
  }, [micMuted])

  const isConnected = status !== 'disconnected' && status !== 'error'
  const isConnecting = status === 'connecting'
  const isActive = status === 'connected' || status === 'listening' || status === 'agent-speaking'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-purple-400" />
          <span className="text-xs font-medium text-zinc-200">Live Avatar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('text-[10px]', STATUS_COLORS[status])}>
            {STATUS_LABELS[status]}
          </span>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
          >
            <Settings2 size={12} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-3 py-2 border-b border-white/5 space-y-2 bg-zinc-900/50">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Agent ID *
            </label>
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="ElevenLabs Agent ID"
              className="w-full mt-0.5 px-2 py-1.5 rounded bg-zinc-800 border border-white/5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Voice ID (optional)
            </label>
            <input
              type="text"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="Override agent's default voice"
              className="w-full mt-0.5 px-2 py-1.5 rounded bg-zinc-800 border border-white/5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
              First Message
            </label>
            <input
              type="text"
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              placeholder="Agent's opening message"
              className="w-full mt-0.5 px-2 py-1.5 rounded bg-zinc-800 border border-white/5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
              System Prompt (optional)
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Override agent's system prompt"
              rows={2}
              className="w-full mt-0.5 px-2 py-1.5 rounded bg-zinc-800 border border-white/5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
              disabled={isConnected}
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <span className="text-[10px] text-red-300 line-clamp-2">{error}</span>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {turns.length === 0 && !isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Radio size={32} className="text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500">
              Connect to start a live conversation
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              Your character will lip-sync in real-time
            </p>
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={cn('flex', turn.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                turn.role === 'user'
                  ? 'bg-purple-500/20 text-purple-100 border border-purple-500/20'
                  : 'bg-zinc-800/60 text-zinc-200 border border-white/5',
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {turn.role === 'user' ? (
                  <User size={10} className="text-purple-400" />
                ) : (
                  <Volume2 size={10} className="text-green-400" />
                )}
                <span className="text-[9px] text-zinc-500 uppercase">
                  {turn.role === 'user' ? 'You' : 'Agent'}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{turn.text}</p>
            </div>
          </div>
        ))}

        {status === 'agent-speaking' && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/60 border border-white/5 rounded-2xl px-3 py-2">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse [animation-delay:0.3s]" />
                </div>
                <span className="text-[10px] text-zinc-500">Speaking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Controls */}
      <div className="border-t border-white/5">
        {/* Text input (when connected) */}
        {isActive && (
          <div className="px-3 py-2 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-white/5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleSendText}
              disabled={!textInput.trim()}
              className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={12} />
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-3 py-2 flex items-center justify-center gap-3">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-300 border border-green-500/20 hover:bg-green-500/30 text-xs font-medium disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Phone size={14} />
              )}
              {isConnecting ? 'Connecting...' : 'Start Conversation'}
            </button>
          ) : (
            <>
              <button
                onClick={toggleMic}
                className={cn(
                  'p-2.5 rounded-full border',
                  micMuted
                    ? 'bg-red-500/20 text-red-300 border-red-500/20'
                    : 'bg-zinc-800 text-zinc-300 border-white/5 hover:bg-zinc-700',
                )}
              >
                {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                onClick={handleDisconnect}
                className="p-2.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/20 hover:bg-red-500/30"
              >
                <PhoneOff size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
