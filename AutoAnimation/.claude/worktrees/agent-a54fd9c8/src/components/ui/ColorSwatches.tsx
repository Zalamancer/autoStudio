import { Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ColorPicker } from './ColorPicker'
import type { ExtractedColor, ColorMap } from '@/services/colorExtraction'

interface ColorSwatchesProps {
  extractedColors: ExtractedColor[] | null
  colorMap: ColorMap
  isExtracting: boolean
  isRecoloring: boolean
  onColorChange: (originalHex: string, newHex: string) => void
  onColorReset: (originalHex: string) => void
  onResetAll: () => void
  /** Compact mode for small spaces (default false) */
  compact?: boolean
}

export function ColorSwatches({
  extractedColors,
  colorMap,
  isExtracting,
  isRecoloring,
  onColorChange,
  onColorReset,
  onResetAll,
  compact = false,
}: ColorSwatchesProps) {
  if (isExtracting) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Loader2 size={12} className="animate-spin" />
        Extracting colors...
      </div>
    )
  }

  if (!extractedColors || extractedColors.length === 0) {
    return null
  }

  const hasAnyMapping = Object.keys(colorMap).length > 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={cn('text-zinc-500 uppercase tracking-wide', compact ? 'text-[10px]' : 'text-xs')}>
          Colors {isRecoloring && <Loader2 size={10} className="inline animate-spin ml-1" />}
        </span>
        {hasAnyMapping && (
          <button
            onClick={onResetAll}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5"
          >
            <RotateCcw size={8} />
            Reset
          </button>
        )}
      </div>

      <div className={cn('flex flex-wrap', compact ? 'gap-1' : 'gap-1.5')}>
        {extractedColors.map((color, i) => {
          const mapped = colorMap[color.hex]
          const displayColor = mapped || color.hex
          const isModified = !!mapped

          return (
            <div
              key={`${color.hex}-${i}`}
              className="relative group"
              title={`${color.hex} (${color.percentage}%)${isModified ? ` → ${mapped}` : ''}`}
            >
              <ColorPicker
                color={displayColor}
                onChange={(c) => onColorChange(color.hex, c)}
                className={cn(
                  compact ? '!w-5 !h-5' : '!w-6 !h-6',
                  isModified && 'ring-1 ring-green-500/30 !border-green-500'
                )}
              />
              {isModified && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onColorReset(color.hex)
                  }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  <RotateCcw size={6} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
