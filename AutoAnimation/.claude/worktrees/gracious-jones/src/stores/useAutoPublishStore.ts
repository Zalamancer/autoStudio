/**
 * Auto-Publish Store — Schedule CRUD, execution polling, queue management.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  AutoPublishSchedule,
  AutoPublishExecution,
  AutoPublishStats,
} from '@/types/autoPublish'
import * as api from '@/services/autoPublishService'
import { logger } from '@/utils/logger'

interface AutoPublishState {
  // Data
  schedules: AutoPublishSchedule[]
  executions: AutoPublishExecution[]
  stats: AutoPublishStats | null
  isLoading: boolean
  error: string | null

  // Calendar
  calendarView: 'week' | 'month'

  // Polling
  isPolling: boolean
  pollIntervalId: ReturnType<typeof setInterval> | null

  // Actions
  fetchSchedules: () => Promise<void>
  createSchedule: (schedule: Parameters<typeof api.createSchedule>[0]) => Promise<AutoPublishSchedule | null>
  updateSchedule: (id: string, updates: Partial<AutoPublishSchedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  toggleSchedule: (id: string, isActive: boolean) => Promise<void>
  fetchStats: () => Promise<void>
  fetchExecutions: (scheduleId: string) => Promise<void>

  // Calendar
  setCalendarView: (view: 'week' | 'month') => void
  rescheduleExecution: (id: string, newDate: string) => void
  getSchedulesByDate: (date: string) => AutoPublishSchedule[]

  // Polling
  startPolling: () => void
  stopPolling: () => void
  checkDueExecutions: () => Promise<AutoPublishExecution[]>

  // Error handling
  clearError: () => void
}

export const useAutoPublishStore = create<AutoPublishState>()(
  immer((set, get) => ({
    schedules: [],
    executions: [],
    stats: null,
    isLoading: false,
    error: null,
    calendarView: 'month',
    isPolling: false,
    pollIntervalId: null,

    fetchSchedules: async () => {
      set((s) => { s.isLoading = true; s.error = null })
      try {
        const schedules = await api.getSchedules()
        set((s) => { s.schedules = schedules; s.isLoading = false })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Failed to fetch schedules'
          s.isLoading = false
        })
      }
    },

    createSchedule: async (schedule) => {
      set((s) => { s.isLoading = true; s.error = null })
      try {
        const created = await api.createSchedule(schedule)
        set((s) => { s.schedules.push(created); s.isLoading = false })
        return created
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Failed to create schedule'
          s.isLoading = false
        })
        return null
      }
    },

    updateSchedule: async (id, updates) => {
      try {
        const updated = await api.updateSchedule(id, updates)
        set((s) => {
          const idx = s.schedules.findIndex((sc) => sc.id === id)
          if (idx >= 0) s.schedules[idx] = updated
        })
      } catch (err) {
        set((s) => { s.error = err instanceof Error ? err.message : 'Failed to update' })
      }
    },

    deleteSchedule: async (id) => {
      try {
        await api.deleteSchedule(id)
        set((s) => { s.schedules = s.schedules.filter((sc) => sc.id !== id) })
      } catch (err) {
        set((s) => { s.error = err instanceof Error ? err.message : 'Failed to delete' })
      }
    },

    toggleSchedule: async (id, isActive) => {
      try {
        const updated = await api.toggleSchedule(id, isActive)
        set((s) => {
          const idx = s.schedules.findIndex((sc) => sc.id === id)
          if (idx >= 0) s.schedules[idx] = updated
        })
      } catch (err) {
        set((s) => { s.error = err instanceof Error ? err.message : 'Failed to toggle' })
      }
    },

    fetchStats: async () => {
      try {
        const stats = await api.getStats()
        set((s) => { s.stats = stats })
      } catch {
        // Stats are non-critical
      }
    },

    fetchExecutions: async (scheduleId) => {
      try {
        const executions = await api.getExecutions(scheduleId)
        set((s) => { s.executions = executions })
      } catch {
        // Non-critical
      }
    },

    startPolling: () => {
      const { isPolling } = get()
      if (isPolling) return

      const intervalId = setInterval(async () => {
        try {
          await get().checkDueExecutions()
        } catch (err) {
          logger.warn('[AutoPublish] Polling error:', err)
        }
      }, 60_000) // Poll every 60 seconds

      set((s) => { s.isPolling = true; s.pollIntervalId = intervalId })
      logger.info('[AutoPublish] Started polling for due executions')
    },

    stopPolling: () => {
      const { pollIntervalId } = get()
      if (pollIntervalId) {
        clearInterval(pollIntervalId)
      }
      set((s) => { s.isPolling = false; s.pollIntervalId = null })
    },

    checkDueExecutions: async () => {
      try {
        const due = await api.getDueExecutions()
        return due
      } catch {
        return []
      }
    },

    setCalendarView: (view) => {
      set((s) => { s.calendarView = view })
    },

    rescheduleExecution: (id, newDate) => {
      set((s) => {
        const exec = s.executions.find((e) => e.id === id)
        if (exec) {
          // Update the startedAt to the new date, preserving time
          const oldDate = new Date(exec.startedAt)
          const [year, month, day] = newDate.split('-').map(Number)
          oldDate.setFullYear(year, month - 1, day)
          exec.startedAt = oldDate.toISOString()
        }
      })
      // Persist the reschedule to the server
      api.rescheduleExecution(id, newDate).catch((err) => {
        logger.error(`[AutoPublish] Failed to persist reschedule for ${id}:`, err)
      })
      logger.info(`[AutoPublish] Rescheduled execution ${id} to ${newDate}`)
    },

    getSchedulesByDate: (date) => {
      return get().schedules.filter((s) => {
        if (!s.nextRunAt) return false
        return s.nextRunAt.startsWith(date)
      })
    },

    clearError: () => set((s) => { s.error = null }),
  }))
)
