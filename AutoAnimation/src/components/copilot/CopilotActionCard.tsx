import type { CopilotMessageAction } from '@/types/copilot'
import { Check, AlertTriangle, Loader2, Ban } from 'lucide-react'

interface Props {
  action: CopilotMessageAction
  onConfirm: () => void
  onReject: () => void
}

export function CopilotActionCard({ action, onConfirm, onReject }: Props) {
  const isDangerous = action.safety === 'dangerous'
  const isPending = action.status === 'pending'
  const isExecuted = action.status === 'executed'
  const isError = action.status === 'error'
  const isRejected = action.status === 'rejected'

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        isDangerous
          ? 'border-red-500/30 bg-red-500/5'
          : isExecuted
            ? 'border-green-500/20 bg-green-500/5'
            : isError
              ? 'border-red-500/20 bg-red-500/5'
              : isRejected
                ? 'border-zinc-700 bg-zinc-800/50 opacity-50'
                : 'border-white/10 bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Status icon */}
        <div className="shrink-0">
          {isExecuted && <Check size={13} className="text-green-400" />}
          {isError && <AlertTriangle size={13} className="text-red-400" />}
          {isRejected && <Ban size={13} className="text-zinc-500" />}
          {isPending && action.safety === 'auto' && <Loader2 size={13} className="text-blue-400 animate-spin" />}
          {isPending && action.safety !== 'auto' && (
            <div className={`w-2 h-2 rounded-full ${isDangerous ? 'bg-red-400' : 'bg-amber-400'}`} />
          )}
        </div>

        {/* Description */}
        <span className={`flex-1 ${isRejected ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
          {action.description}
        </span>

        {/* Action buttons for pending confirm/dangerous actions */}
        {isPending && action.safety !== 'auto' && (
          <div className="shrink-0 flex items-center gap-1">
            <button
              onClick={onConfirm}
              className="px-2 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white text-[10px] font-medium transition-colors"
            >
              Apply
            </button>
            <button
              onClick={onReject}
              className="px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[10px] font-medium transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {isError && action.error && (
        <div className="mt-1 text-[10px] text-red-400">{action.error}</div>
      )}

      {/* Dangerous warning */}
      {isDangerous && isPending && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-400">
          <AlertTriangle size={10} />
          This action may be destructive
        </div>
      )}
    </div>
  )
}
