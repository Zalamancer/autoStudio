/**
 * Schedule overview card for the Dashboard page.
 * Shows upcoming auto-publish schedules with status indicators.
 */

import { useEffect } from 'react'
import { Calendar, Clock, ToggleRight, Zap } from 'lucide-react'
import { useAutoPublishStore } from '@/stores/useAutoPublishStore'
import { useShallow } from 'zustand/react/shallow'

export function ScheduleCard() {
  const { schedules, stats, fetchSchedules, fetchStats } = useAutoPublishStore(
    useShallow((s) => ({
      schedules: s.schedules,
      stats: s.stats,
      fetchSchedules: s.fetchSchedules,
      fetchStats: s.fetchStats,
    })),
  )

  useEffect(() => {
    fetchSchedules()
    fetchStats()
  }, [fetchSchedules, fetchStats])

  const activeSchedules = schedules.filter((s) => s.isActive)

  if (schedules.length === 0) return null

  return (
    <div className="bg-panel-bg border border-panel-border/60 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Auto-Publish</h3>
        </div>
        {stats && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
            {stats.totalExecutions} runs
          </span>
        )}
      </div>

      {/* Active Schedules */}
      <div className="space-y-2">
        {activeSchedules.slice(0, 3).map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center gap-2.5 bg-black/20 rounded-lg px-3 py-2"
          >
            <ToggleRight size={14} className="text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white truncate">{schedule.topicPrompt}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-gray-500 capitalize">{schedule.frequency}</span>
                <span className="text-[9px] text-gray-600">·</span>
                <span className="text-[9px] text-gray-500">
                  {schedule.platforms.join(', ')}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] text-gray-500 flex items-center gap-1">
                <Clock size={8} />
                {new Date(schedule.nextRunAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      {stats && (stats.successfulExecutions > 0 || stats.totalCreditsUsed > 0) && (
        <div className="flex items-center gap-4 pt-1 border-t border-panel-surface">
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Zap size={10} className="text-emerald-400" />
            {stats.successfulExecutions} successful
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="text-amber-400">{stats.totalCreditsUsed}</span> credits used
          </div>
        </div>
      )}

      {/* Next Run */}
      {stats?.nextScheduledRun && (
        <p className="text-[9px] text-gray-600">
          Next run: {new Date(stats.nextScheduledRun).toLocaleString()}
        </p>
      )}
    </div>
  )
}
