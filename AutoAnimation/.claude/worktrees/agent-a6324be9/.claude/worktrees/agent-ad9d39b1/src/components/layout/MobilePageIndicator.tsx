import { cn } from '@/lib/utils'

const PAGE_LABELS = ['Menu', 'Tools', 'Canvas', 'Properties']

interface MobilePageIndicatorProps {
  activePage: number
  onPageSelect: (page: number) => void
}

export function MobilePageIndicator({ activePage, onPageSelect }: MobilePageIndicatorProps) {
  return (
    <div className="shrink-0 flex items-center justify-center gap-6 py-2 bg-zinc-950 border-t border-white/5">
      {PAGE_LABELS.map((label, i) => (
        <button
          key={label}
          onClick={() => onPageSelect(i)}
          className="flex flex-col items-center gap-0.5"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-200',
              i === activePage ? 'bg-green-500 scale-125' : 'bg-zinc-600'
            )}
          />
          <span
            className={cn(
              'text-[9px] transition-colors duration-200',
              i === activePage ? 'text-green-400' : 'text-zinc-600'
            )}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
