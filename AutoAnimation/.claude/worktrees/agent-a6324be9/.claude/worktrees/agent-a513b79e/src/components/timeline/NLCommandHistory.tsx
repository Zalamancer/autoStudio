/**
 * NLCommandHistory — Dropdown showing the last 20 NL commands with results.
 */

import { memo } from 'react'
import { Undo2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useNLEditStore, type NLCommand } from '@/stores/useNLEditStore'

interface NLCommandHistoryProps {
  onClose: () => void
  onRerun: (text: string) => void
}

export const NLCommandHistory = memo(function NLCommandHistory({ onClose, onRerun }: NLCommandHistoryProps) {
  const commandHistory = useNLEditStore((s) => s.commandHistory)
  const undoLastCommand = useNLEditStore((s) => s.undoLastCommand)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const StatusIcon = ({ result }: { result: NLCommand['result'] }) => {
    switch (result) {
      case 'success':
        return <CheckCircle size={10} className="text-green-400" />
      case 'failed':
        return <XCircle size={10} className="text-red-400" />
      case 'pending':
        return <Clock size={10} className="text-zinc-500" />
    }
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 max-h-64 overflow-y-auto bg-zinc-900 border border-white/10 rounded-b-lg shadow-xl">
      {commandHistory.length === 0 ? (
        <div className="p-4 text-center text-[10px] text-zinc-500">
          No commands yet
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {commandHistory.slice().reverse().map((cmd) => (
            <div
              key={cmd.id}
              className="flex items-start gap-2 px-3 py-2 hover:bg-zinc-800/50 transition-colors"
            >
              <StatusIcon result={cmd.result} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-zinc-300 truncate">{cmd.text}</p>
                {cmd.explanation && (
                  <p className="text-[9px] text-zinc-600 truncate mt-0.5">{cmd.explanation}</p>
                )}
              </div>
              <span className="text-[9px] text-zinc-600 shrink-0">{formatTime(cmd.timestamp)}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onRerun(cmd.text)}
                  className="text-[9px] text-zinc-500 hover:text-indigo-400 transition-colors"
                  title="Re-run"
                >
                  Re-run
                </button>
                {cmd.result === 'success' && (
                  <button
                    onClick={undoLastCommand}
                    className="text-zinc-500 hover:text-amber-400 transition-colors"
                    title="Undo"
                  >
                    <Undo2 size={10} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onClose}
        className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 py-1.5 border-t border-white/5 transition-colors"
      >
        Close
      </button>
    </div>
  )
})
