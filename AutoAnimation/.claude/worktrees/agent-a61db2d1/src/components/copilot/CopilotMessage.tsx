import type { CopilotChatMessage } from '@/types/copilot'
import { CopilotActionCard } from './CopilotActionCard'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { Bot, User, AlertCircle } from 'lucide-react'

interface Props {
  message: CopilotChatMessage
}

export function CopilotMessage({ message }: Props) {
  const confirmAction = useCopilotStore((s) => s.confirmAction)
  const rejectAction = useCopilotStore((s) => s.rejectAction)
  const confirmAllPending = useCopilotStore((s) => s.confirmAllPending)

  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const hasPendingActions = message.actions?.some((a) => a.status === 'pending' && a.safety !== 'auto')

  return (
    <div className={`px-3 py-2 ${isUser ? '' : ''}`}>
      {/* Role indicator + message */}
      <div className="flex items-start gap-2">
        <div className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
          isUser ? 'bg-blue-500/10 text-blue-400' :
          isSystem ? 'bg-red-500/10 text-red-400' :
          'bg-green-500/10 text-green-400'
        }`}>
          {isUser ? <User size={11} /> :
           isSystem ? <AlertCircle size={11} /> :
           <Bot size={11} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs leading-relaxed ${
            isSystem ? 'text-red-400' : 'text-zinc-300'
          }`}>
            {message.content}
          </div>

          {/* Action cards */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {message.actions.map((action, index) => (
                <CopilotActionCard
                  key={index}
                  action={action}
                  onConfirm={() => confirmAction(message.id, index)}
                  onReject={() => rejectAction(message.id, index)}
                />
              ))}

              {/* Batch confirm button */}
              {hasPendingActions && (
                <button
                  onClick={() => confirmAllPending(message.id)}
                  className="w-full px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[11px] font-medium transition-colors"
                >
                  Apply All
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
