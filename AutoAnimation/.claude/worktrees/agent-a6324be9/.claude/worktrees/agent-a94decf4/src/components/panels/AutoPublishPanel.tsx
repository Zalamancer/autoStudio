/**
 * Auto-Publish Schedule Management Panel.
 * Create, view, and manage recurring video generation schedules.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  List,
  CalendarDays,
  Pause,
  Play,
  Repeat,
  TrendingUp,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores'
import { TAB_GROUPS, CARD_GRID_THRESHOLD } from '@/constants/tabGroups'
import { useAutoPublishStore } from '@/stores/useAutoPublishStore'
import { useShallow } from 'zustand/react/shallow'
import { frequencyToCron } from '@/services/autoPublishService'
import type { AutoPublishSchedule, AutoPublishExecution } from '@/types/autoPublish'
import type { OrchestratorSettings } from '@/types/orchestrator'

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Every day at 9 AM' },
  { value: 'every-2-days', label: '2 Days', description: 'Every other day' },
  { value: 'every-3-days', label: '3 Days', description: 'Every 3rd day' },
  { value: 'weekly', label: 'Weekly', description: 'Every Monday' },
] as const

const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok', color: 'bg-pink-500/20 text-pink-300 border-pink-500/20' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-500/20 text-red-300 border-red-500/20' },
  { value: 'instagram', label: 'Instagram', color: 'bg-purple-500/20 text-purple-300 border-purple-500/20' },
  { value: 'x', label: 'X', color: 'bg-sky-500/20 text-sky-300 border-sky-500/20' },
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-500/20 text-blue-300 border-blue-500/20' },
]

const PLATFORM_DOT: Record<string, string> = {
  tiktok: 'bg-pink-400',
  youtube: 'bg-red-400',
  instagram: 'bg-purple-400',
  x: 'bg-sky-400',
  facebook: 'bg-blue-400',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  generating: 'text-blue-400',
  exporting: 'text-purple-400',
  publishing: 'text-cyan-400',
  done: 'text-emerald-400',
  error: 'text-red-400',
}

export function AutoPublishPanel() {
  const {
    schedules,
    stats,
    isLoading,
    error,
    fetchSchedules,
    deleteSchedule,
    toggleSchedule,
    fetchStats,
    fetchExecutions,
    executions,
    startPolling,
    stopPolling,
    clearError,
  } = useAutoPublishStore(
    useShallow((s) => ({
      schedules: s.schedules,
      stats: s.stats,
      isLoading: s.isLoading,
      error: s.error,
      fetchSchedules: s.fetchSchedules,
      deleteSchedule: s.deleteSchedule,
      toggleSchedule: s.toggleSchedule,
      fetchStats: s.fetchStats,
      fetchExecutions: s.fetchExecutions,
      executions: s.executions,
      startPolling: s.startPolling,
      stopPolling: s.stopPolling,
      clearError: s.clearError,
    })),
  )

  const [showCreate, setShowCreate] = useState(false)
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null)

  const activeCanvasOverlay = useEditorStore((s) => s.activeCanvasOverlay)
  const toggleCanvasOverlay = useEditorStore((s) => s.toggleCanvasOverlay)
  const calendarOpen = activeCanvasOverlay === 'content-calendar'

  // Detect drill-down mode (header already shown by DrillDownHeader)
  const activeGroup = useEditorStore((s) => s.leftPanelActiveGroup)
  const showGroupHome = useEditorStore((s) => s.showGroupHome)
  const inDrillDown = (() => {
    const g = TAB_GROUPS.find((g) => g.id === activeGroup)
    return !!g && g.subTabs.length > CARD_GRID_THRESHOLD && !showGroupHome
  })()

  useEffect(() => {
    fetchSchedules()
    fetchStats()
    startPolling()
    return () => stopPolling()
  }, [fetchSchedules, fetchStats, startPolling, stopPolling])

  const handleExpandSchedule = useCallback(
    (id: string) => {
      if (expandedSchedule === id) {
        setExpandedSchedule(null)
      } else {
        setExpandedSchedule(id)
        fetchExecutions(id)
      }
    },
    [expandedSchedule, fetchExecutions],
  )

  const PUBLISH_TABS = [
    { id: 'list' as const, label: 'List', icon: List },
    { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Pill Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {PUBLISH_TABS.map((tab) => {
          const isActive = (tab.id === 'calendar') === calendarOpen
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'calendar' && !calendarOpen) toggleCanvasOverlay('content-calendar')
                if (tab.id === 'list' && calendarOpen) toggleCanvasOverlay('content-calendar')
              }}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{ transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms' }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className={cn('flex items-center gap-2', inDrillDown && 'ml-auto')}>
            {/* New Schedule button */}
            <button
              onClick={() => setShowCreate(!showCreate)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                showCreate
                  ? 'bg-[#4a7eff] text-white shadow-md shadow-[#4a7eff]/20'
                  : 'bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 border border-[#4a7eff]/20',
              )}
            >
              <Plus size={13} />
              New
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-[#1e1e1e] rounded-lg p-2.5 text-center border border-white/[0.04]">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={10} className="text-zinc-400" />
              </div>
              <p className="text-sm font-bold text-white">{stats.totalExecutions}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Total Runs</p>
            </div>
            <div className="bg-emerald-500/[0.06] rounded-lg p-2.5 text-center border border-emerald-500/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 size={10} className="text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-400">{stats.successfulExecutions}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Successful</p>
            </div>
            <div className="bg-[#4a7eff]/[0.06] rounded-lg p-2.5 text-center border border-[#4a7eff]/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins size={10} className="text-[#4a7eff]" />
              </div>
              <p className="text-sm font-bold text-[#4a7eff]">{stats.totalCreditsUsed}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Credits</p>
            </div>
          </div>
        )}

        {/* Next Run */}
        {stats?.nextScheduledRun && (
          <div className="flex items-center gap-2 bg-[#1e1e1e] rounded-lg px-3 py-2 border border-white/[0.04]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Clock size={11} className="text-zinc-400" />
            <span className="text-xs text-zinc-400">
              Next run: <span className="text-zinc-200">{new Date(stats.nextScheduledRun).toLocaleString()}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="mx-3 mt-2 flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* ── Create Form ────────────────────────────────────────── */}
      {showCreate && (
        <div className="shrink-0 px-3 py-2 border-b border-white/5">
          <CreateScheduleForm
            onCreated={() => {
              setShowCreate(false)
              fetchSchedules()
              fetchStats()
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* ── Schedule List ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && schedules.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-[#4a7eff]" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-10 px-6">
            <div className="w-12 h-12 rounded-xl bg-[#4a7eff]/10 border border-[#4a7eff]/15 flex items-center justify-center mx-auto mb-3">
              <Repeat size={22} className="text-[#4a7eff]" />
            </div>
            <p className="text-sm text-zinc-300 font-medium">No schedules yet</p>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Set up auto-publish to generate and post videos on autopilot
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#4a7eff] hover:bg-[#5a8eff] text-white shadow-lg shadow-[#4a7eff]/20 transition-all"
            >
              <Plus size={13} />
              Create First Schedule
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {schedules.map((schedule) => (
              <ScheduleItem
                key={schedule.id}
                schedule={schedule}
                isExpanded={expandedSchedule === schedule.id}
                executions={expandedSchedule === schedule.id ? executions : []}
                onToggleExpand={() => handleExpandSchedule(schedule.id)}
                onToggleActive={() => toggleSchedule(schedule.id, !schedule.isActive)}
                onDelete={() => deleteSchedule(schedule.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Create Schedule Form ──

function CreateScheduleForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const createSchedule = useAutoPublishStore((s) => s.createSchedule)
  const [topicPrompt, setTopicPrompt] = useState('')
  const [frequency, setFrequency] = useState<AutoPublishSchedule['frequency']>('daily')
  const [platforms, setPlatforms] = useState<string[]>(['tiktok'])
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) => (prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]))
  }

  const handleSubmit = async () => {
    if (!topicPrompt.trim() || platforms.length === 0) return
    setIsSubmitting(true)
    const result = await createSchedule({
      topicPrompt,
      platforms,
      frequency,
      cronExpression: frequencyToCron(frequency),
      timezone,
      orchestratorSettings: {} as Partial<OrchestratorSettings>,
      isActive: true,
    })
    setIsSubmitting(false)
    if (result) onCreated()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#4a7eff]/15 flex items-center justify-center">
          <Zap size={12} className="text-[#4a7eff]" />
        </div>
        <span className="text-sm text-white font-medium">New Schedule</span>
      </div>

      {/* Topic Prompt */}
      <div>
        <span className="text-xs text-zinc-400 mb-2 block">
          Topic prompt <span className="text-zinc-600">(use {'{variation}'} for variety)</span>
        </span>
        <textarea
          value={topicPrompt}
          onChange={(e) => setTopicPrompt(e.target.value)}
          placeholder="Create a 30s video about {variation} tech tips..."
          className="w-full min-h-[4.5rem] bg-zinc-800 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-[#4a7eff]/30 transition-colors"
        />
      </div>

      {/* Frequency */}
      <div>
        <span className="text-xs text-zinc-400 mb-2 block">Frequency</span>
        <div className="grid grid-cols-4 gap-1.5">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFrequency(opt.value)}
              className={cn(
                'px-2 py-2 rounded-lg text-center transition-all border',
                frequency === opt.value
                  ? 'bg-[#4a7eff]/15 border-[#4a7eff]/30 text-[#4a7eff] shadow-sm'
                  : 'bg-[#1e1e1e] border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:border-white/10',
              )}
            >
              <p className="text-xs font-medium">{opt.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <span className="text-xs text-zinc-400 mb-2 block">Platforms</span>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => togglePlatform(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                platforms.includes(opt.value)
                  ? opt.color
                  : 'bg-[#1e1e1e] border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/10',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timezone */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 bg-[#1e1e1e] rounded-lg px-3 py-2 border border-white/[0.04]">
        <Globe size={12} />
        <span>{timezone}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-[#1e1e1e] border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !topicPrompt.trim() || platforms.length === 0}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2',
            isSubmitting || !topicPrompt.trim() || platforms.length === 0
              ? 'bg-[#2a2a2a] text-zinc-600 cursor-not-allowed'
              : 'bg-[#4a7eff] hover:bg-[#5a8eff] text-white shadow-lg shadow-[#4a7eff]/20',
          )}
        >
          {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
          Create Schedule
        </button>
      </div>
    </div>
  )
}

// ── Schedule Item ──

function ScheduleItem({
  schedule,
  isExpanded,
  executions,
  onToggleExpand,
  onToggleActive,
  onDelete,
}: {
  schedule: AutoPublishSchedule
  isExpanded: boolean
  executions: AutoPublishExecution[]
  onToggleExpand: () => void
  onToggleActive: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden transition-all',
        schedule.isActive ? 'bg-[#2a2a2a] border-white/5' : 'bg-[#2a2a2a]/60 border-white/5 opacity-70',
      )}
    >
      {/* Header row */}
      <div
        className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#3a3a3a] transition-colors"
        onClick={onToggleExpand}
      >
        {/* Active indicator */}
        <div className="mt-1 shrink-0">
          {schedule.isActive ? (
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/40 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate leading-snug">{schedule.topicPrompt}</p>

          {/* Frequency badge + platform dots */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
              {FREQUENCY_OPTIONS.find((f) => f.value === schedule.frequency)?.label}
            </span>
            <div className="flex items-center gap-1">
              {schedule.platforms.map((p) => (
                <span key={p} className={cn('w-2 h-2 rounded-full', PLATFORM_DOT[p] || 'bg-zinc-500')} title={p} />
              ))}
            </div>
          </div>

          {/* Next run */}
          {schedule.isActive && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
              <Clock size={11} className="text-zinc-500" />
              <span>{new Date(schedule.nextRunAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          {/* Play/Pause toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleActive()
            }}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              schedule.isActive
                ? 'text-emerald-400 hover:bg-emerald-500/10'
                : 'text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300',
            )}
            title={schedule.isActive ? 'Pause schedule' : 'Resume schedule'}
          >
            {schedule.isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete schedule"
          >
            <Trash2 size={14} />
          </button>

          {/* Expand */}
          <div className="p-1 text-zinc-500">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
        </div>
      </div>

      {/* Execution History */}
      {isExpanded && (
        <div className="border-t border-white/5 px-4 py-3 bg-black/20">
          <p className="text-xs font-medium text-zinc-400 mb-2.5">Recent Runs</p>
          {executions.length === 0 ? (
            <p className="text-xs text-zinc-600 py-3 text-center">No executions yet</p>
          ) : (
            <div className="space-y-1.5">
              {executions.slice(0, 10).map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    {exec.status === 'done' ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : exec.status === 'error' ? (
                      <XCircle size={13} className="text-red-400" />
                    ) : (
                      <Loader2 size={13} className="animate-spin text-[#4a7eff]" />
                    )}
                    <span className={cn('text-xs font-medium capitalize', STATUS_COLORS[exec.status])}>
                      {exec.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {exec.creditsUsed > 0 && (
                      <span className="flex items-center gap-1">
                        <Coins size={10} />
                        {exec.creditsUsed}
                      </span>
                    )}
                    <span>{new Date(exec.startedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
