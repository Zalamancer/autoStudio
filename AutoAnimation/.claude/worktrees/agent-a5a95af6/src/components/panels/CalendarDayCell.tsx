/**
 * CalendarDayCell — Individual day cell in the content calendar.
 * Shows date number, scheduled clip pills (colored by platform), and drag targets.
 */

import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AutoPublishExecution } from '@/types/autoPublish'
import type { CalendarDragData } from '@/hooks/useCalendarDragDrop'
import type { PostingTimeSlot } from '@/services/postingTimeHeuristics'

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500/80',
  youtube: 'bg-red-500/80',
  instagram: 'bg-purple-500/80',
  x: 'bg-sky-500/80',
  facebook: 'bg-blue-500/80',
}

const PLATFORM_DOT_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-400',
  youtube: 'bg-red-400',
  instagram: 'bg-purple-400',
  x: 'bg-sky-400',
  facebook: 'bg-blue-400',
}

interface CalendarDayCellProps {
  date: Date
  isToday: boolean
  isCurrentMonth: boolean
  executions: AutoPublishExecution[]
  optimalTimes: PostingTimeSlot[]
  isDropTarget: boolean
  onDragOver: (e: React.DragEvent, dateStr: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, dateStr: string) => CalendarDragData | null
  onDragStart: (e: React.DragEvent, data: CalendarDragData) => void
  onDragEnd: () => void
  onAddClick?: (date: Date) => void
}

export function CalendarDayCell({
  date,
  isToday,
  isCurrentMonth,
  executions,
  optimalTimes,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onAddClick,
}: CalendarDayCellProps) {
  const dateStr = date.toISOString().split('T')[0]
  const dayNum = date.getDate()

  const handleDragOver = useCallback(
    (e: React.DragEvent) => onDragOver(e, dateStr),
    [onDragOver, dateStr],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => onDrop(e, dateStr),
    [onDrop, dateStr],
  )

  // Determine best optimal time for this day
  const bestTime = optimalTimes.length > 0
    ? optimalTimes.reduce((a, b) => (a.score > b.score ? a : b))
    : null

  return (
    <div
      className={cn(
        'relative min-h-[5.5rem] border border-white/[0.04] p-1.5 transition-all group',
        isCurrentMonth ? 'bg-[#1a1a1a] hover:bg-[#1e1e1e]' : 'bg-[#131313]',
        isDropTarget && 'bg-[#4a7eff]/10 border-[#4a7eff]/30 shadow-inner',
        isToday && 'border-[#4a7eff]/40 bg-[#4a7eff]/[0.04]',
      )}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      {/* Date number + optimal time */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors',
            isToday && 'bg-[#4a7eff] text-white shadow-sm shadow-[#4a7eff]/30',
            !isToday && isCurrentMonth && 'text-zinc-300',
            !isToday && !isCurrentMonth && 'text-zinc-600',
          )}
        >
          {dayNum}
        </span>

        {/* Optimal posting time indicator */}
        {bestTime && isCurrentMonth && (
          <span className="text-[9px] text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded" title={`Best: ${bestTime.label}`}>
            {bestTime.label}
          </span>
        )}
      </div>

      {/* Execution pills */}
      <div className="space-y-1">
        {executions.slice(0, 3).map((exec) => (
          <div
            key={exec.id}
            draggable
            onDragStart={(e) =>
              onDragStart(e, { id: exec.id, sourceDate: dateStr })
            }
            onDragEnd={onDragEnd}
            className={cn(
              'flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium cursor-grab active:cursor-grabbing truncate transition-colors',
              exec.status === 'done'
                ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : exec.status === 'error'
                  ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                  : 'bg-[#4a7eff]/15 text-[#4a7eff] hover:bg-[#4a7eff]/25',
            )}
          >
            {/* Platform dots */}
            {exec.publishedPostIds.length > 0 && (
              <div className="flex gap-0.5 shrink-0">
                {exec.publishedPostIds.slice(0, 3).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      PLATFORM_DOT_COLORS[Object.keys(PLATFORM_DOT_COLORS)[i % 5]],
                    )}
                  />
                ))}
              </div>
            )}
            <span className="truncate">
              {exec.prompt?.slice(0, 20) || exec.status}
            </span>
          </div>
        ))}

        {executions.length > 3 && (
          <p className="text-[9px] text-zinc-500 px-1.5 font-medium">
            +{executions.length - 3} more
          </p>
        )}
      </div>

      {/* Add button (on hover) */}
      {isCurrentMonth && (
        <button
          onClick={() => onAddClick?.(date)}
          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-[#4a7eff]/15 text-zinc-500 hover:text-[#4a7eff]"
          title="Add scheduled post"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  )
}

export { PLATFORM_COLORS }
