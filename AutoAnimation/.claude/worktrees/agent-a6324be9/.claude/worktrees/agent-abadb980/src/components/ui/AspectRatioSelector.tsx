import { cn } from '@/lib/utils'
import type { AspectRatio } from '@/types'

interface AspectRatioSelectorProps {
  value: AspectRatio
  onChange: (ratio: AspectRatio) => void
  className?: string
}

const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '21:9']

export function AspectRatioSelector({
  value,
  onChange,
  className,
}: AspectRatioSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-zinc-800/50 rounded-full', className)}>
      {aspectRatios.map((ratio) => {
        const isActive = value === ratio

        return (
          <button
            key={ratio}
            type="button"
            onClick={() => onChange(ratio)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-green-500/50',
              isActive
                ? 'bg-green-500 text-white'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
            )}
          >
            {ratio}
          </button>
        )
      })}
    </div>
  )
}
