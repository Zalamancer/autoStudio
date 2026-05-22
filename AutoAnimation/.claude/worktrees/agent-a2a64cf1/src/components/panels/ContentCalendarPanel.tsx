/**
 * ContentCalendarPanel — Visual month/week calendar for scheduled posts.
 * CSS Grid layout, drag-and-drop rescheduling, optimal posting time markers.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  LayoutGrid,
  Rows3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAutoPublishStore } from '@/stores/useAutoPublishStore'
import { useShallow } from 'zustand/react/shallow'
import { useCalendarDragDrop } from '@/hooks/useCalendarDragDrop'
import { getOptimalPostingTimes } from '@/services/postingTimeHeuristics'
import { CalendarDayCell } from './CalendarDayCell'
import type { AutoPublishExecution } from '@/types/autoPublish'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Get all days to render for a month grid (includes leading/trailing days). */
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  const days: Date[] = []

  // Leading days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  // Trailing days to fill complete last row
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))
  }

  return days
}

/** Get 7 days starting from a given date's week start (Sunday). */
function getWeekDays(date: Date): Date[] {
  const dow = date.getDay()
  const start = new Date(date)
  start.setDate(start.getDate() - dow)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function ContentCalendarPanel() {
  const { executions, schedules, rescheduleExecution, createSchedule, calendarView, setCalendarView } =
    useAutoPublishStore(
      useShallow((s) => ({
        executions: s.executions,
        schedules: s.schedules,
        rescheduleExecution: s.rescheduleExecution,
        createSchedule: s.createSchedule,
        calendarView: s.calendarView,
        setCalendarView: s.setCalendarView,
      })),
    )

  const [currentDate, setCurrentDate] = useState(new Date())
  const today = useMemo(() => new Date(), [])

  const {
    dropTargetDate,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useCalendarDragDrop()

  // Get the primary platform from schedules for posting time hints
  const primaryPlatform = schedules.length > 0 ? schedules[0].platforms[0] : 'tiktok'

  // Handle "+" button click on a calendar day cell
  const handleAddPost = useCallback((date: Date) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    createSchedule({
      topicPrompt: '',
      platforms: [primaryPlatform],
      frequency: 'daily',
      cronExpression: `0 12 ${date.getDate()} ${date.getMonth() + 1} *`,
      timezone: tz,
      orchestratorSettings: {},
      isActive: false,
    })
  }, [createSchedule, primaryPlatform])

  // Build execution map by date
  const executionsByDate = useMemo(() => {
    const map = new Map<string, AutoPublishExecution[]>()
    for (const exec of executions) {
      const key = exec.startedAt.split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(exec)
    }
    return map
  }, [executions])

  // Grid days
  const days = useMemo(() => {
    if (calendarView === 'week') {
      return getWeekDays(currentDate)
    }
    return getMonthGrid(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate, calendarView])

  // Navigation
  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  const goPrev = useCallback(() => {
    setCurrentDate((d) => {
      const next = new Date(d)
      if (calendarView === 'week') {
        next.setDate(next.getDate() - 7)
      } else {
        next.setMonth(next.getMonth() - 1)
      }
      return next
    })
  }, [calendarView])

  const goNext = useCallback(() => {
    setCurrentDate((d) => {
      const next = new Date(d)
      if (calendarView === 'week') {
        next.setDate(next.getDate() + 7)
      } else {
        next.setMonth(next.getMonth() + 1)
      }
      return next
    })
  }, [calendarView])

  // Handle drop → reschedule
  const onDrop = useCallback(
    (e: React.DragEvent, targetDate: string) => {
      const data = handleDrop(e, targetDate)
      if (data) {
        rescheduleExecution(data.id, targetDate)
      }
      return data
    },
    [handleDrop, rescheduleExecution],
  )

  // Title
  const title =
    calendarView === 'week'
      ? (() => {
          const start = days[0]
          const end = days[6]
          if (start.getMonth() === end.getMonth()) {
            return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
          }
          return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.toLocaleDateString('en-US', { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`
        })()
      : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goNext}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold text-white ml-2">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#4a7eff] bg-[#4a7eff]/10 hover:bg-[#4a7eff]/20 border border-[#4a7eff]/15 transition-colors"
          >
            Today
          </button>

          {/* View Toggle */}
          <div className="flex bg-[#1e1e1e] rounded-lg p-0.5 border border-white/[0.04]">
            <button
              onClick={() => setCalendarView('week')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                calendarView === 'week'
                  ? 'bg-[#4a7eff]/15 text-[#4a7eff] shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
              title="Week view"
            >
              <Rows3 size={14} />
            </button>
            <button
              onClick={() => setCalendarView('month')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                calendarView === 'month'
                  ? 'bg-[#4a7eff]/15 text-[#4a7eff] shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
              title="Month view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[11px] font-semibold text-zinc-500 text-center py-2 uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className={cn(
          'grid grid-cols-7 flex-1 overflow-y-auto',
          calendarView === 'week' && 'auto-rows-fr',
        )}
      >
        {days.map((day) => {
          const dateKey = toDateKey(day)
          const dayExecs = executionsByDate.get(dateKey) || []
          const optimalTimes = getOptimalPostingTimes(primaryPlatform, day.getDay())

          return (
            <CalendarDayCell
              key={dateKey}
              date={day}
              isToday={isSameDay(day, today)}
              isCurrentMonth={day.getMonth() === currentDate.getMonth()}
              executions={dayExecs}
              optimalTimes={optimalTimes}
              isDropTarget={dropTargetDate === dateKey}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={onDrop}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onAddClick={handleAddPost}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] bg-black/20">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          <span className="text-[10px] text-zinc-400">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4a7eff]/70" />
          <span className="text-[10px] text-zinc-400">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="text-[10px] text-zinc-400">Error</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <GripHorizontal size={10} className="text-zinc-500" />
          <span className="text-[10px] text-zinc-500">Drag to reschedule</span>
        </div>
      </div>
    </div>
  )
}
