import { Loader2, Eraser, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CharacterPartTab } from '@/stores/useCharacterConfigStore'

export function SpriteRemoveBgButton({
  tab,
  count,
  isProcessing,
  currentIndex,
  totalCount,
  error,
  recraftAvailable,
  onRemove,
}: {
  tab: CharacterPartTab
  count: number
  isProcessing: boolean
  currentIndex: number
  totalCount: number
  error: string | null
  recraftAvailable?: boolean
  onRemove: (tab: CharacterPartTab, mode?: 'free' | 'quality') => Promise<void>
}) {
  return (
    <div className="space-y-1.5">
      {/* Free bg removal (local ONNX model) */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onRemove(tab, 'free')}
          disabled={isProcessing}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-sm transition-colors',
            isProcessing
              ? 'bg-[#2a2a2a] text-zinc-500 cursor-wait'
              : 'bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 border border-[#4a7eff]/30'
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Removing... {currentIndex}/{totalCount}</span>
            </>
          ) : (
            <>
              <Eraser size={14} />
              <span>Remove BG ({count})</span>
            </>
          )}
        </button>

        {/* Quality mode via Recraft (5cr per sprite) */}
        {recraftAvailable && !isProcessing && (
          <button
            onClick={() => onRemove(tab, 'quality')}
            disabled={isProcessing}
            className={cn(
              'flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg text-sm transition-colors',
              'bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 border border-[#4a7eff]/30'
            )}
            title="HD background removal via Recraft (5 credits per sprite)"
          >
            <Sparkles size={14} />
            <span>HD (5cr)</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isProcessing && totalCount > 0 && (
        <div className="w-full h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4a7eff] transition-all duration-300"
            style={{ width: `${(currentIndex / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {error && !isProcessing && (
        <p className="text-[10px] text-red-400">{error}</p>
      )}

    </div>
  )
}
