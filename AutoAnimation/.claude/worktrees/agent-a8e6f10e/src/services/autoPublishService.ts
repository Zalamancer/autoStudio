/**
 * Auto-Publish Service — Frontend API client for schedule management.
 */

import type {
  AutoPublishSchedule,
  AutoPublishExecution,
  AutoPublishStats,
} from '@/types/autoPublish'
import { apiClient } from './apiClient'

/** Create a new auto-publish schedule */
export async function createSchedule(
  schedule: Omit<AutoPublishSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'nextRunAt'>
): Promise<AutoPublishSchedule> {
  return apiClient.post<AutoPublishSchedule>('/api/auto-publish/schedules', schedule)
}

/** Get all schedules for the current user */
export async function getSchedules(): Promise<AutoPublishSchedule[]> {
  return apiClient.get<AutoPublishSchedule[]>('/api/auto-publish/schedules')
}

/** Update a schedule */
export async function updateSchedule(
  id: string,
  updates: Partial<AutoPublishSchedule>,
): Promise<AutoPublishSchedule> {
  return apiClient.put<AutoPublishSchedule>(`/api/auto-publish/schedules/${id}`, updates)
}

/** Delete a schedule */
export async function deleteSchedule(id: string): Promise<void> {
  await apiClient.del(`/api/auto-publish/schedules/${id}`)
}

/** Toggle schedule active/inactive */
export async function toggleSchedule(id: string, isActive: boolean): Promise<AutoPublishSchedule> {
  return updateSchedule(id, { isActive })
}

/** Get due executions (schedules ready to run) */
export async function getDueExecutions(): Promise<AutoPublishExecution[]> {
  return apiClient.get<AutoPublishExecution[]>('/api/auto-publish/due')
}

/** Mark an execution as started */
export async function startExecution(executionId: string): Promise<void> {
  await apiClient.post(`/api/auto-publish/executions/${executionId}/start`)
}

/** Mark an execution as completed */
export async function completeExecution(
  executionId: string,
  result: { creditsUsed: number; publishedPostIds: string[] },
): Promise<void> {
  await apiClient.post(`/api/auto-publish/executions/${executionId}/complete`, result)
}

/** Mark an execution as failed */
export async function failExecution(executionId: string, error: string): Promise<void> {
  await apiClient.post(`/api/auto-publish/executions/${executionId}/fail`, { error })
}

/** Get execution history for a schedule */
export async function getExecutions(scheduleId: string): Promise<AutoPublishExecution[]> {
  return apiClient.get<AutoPublishExecution[]>(`/api/auto-publish/schedules/${scheduleId}/executions`)
}

/** Reschedule an execution to a new date */
export async function rescheduleExecution(executionId: string, newDate: string): Promise<void> {
  await apiClient.post(`/api/auto-publish/executions/${executionId}/reschedule`, { newDate })
}

/** Get auto-publish stats */
export async function getStats(): Promise<AutoPublishStats> {
  return apiClient.get<AutoPublishStats>('/api/auto-publish/stats')
}

/** Frequency to cron expression mapping */
export function frequencyToCron(frequency: string): string {
  switch (frequency) {
    case 'daily': return '0 9 * * *' // 9 AM daily
    case 'every-2-days': return '0 9 */2 * *'
    case 'every-3-days': return '0 9 */3 * *'
    case 'weekly': return '0 9 * * 1' // Monday 9 AM
    default: return '0 9 * * *'
  }
}
