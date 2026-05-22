/**
 * Auto-Publish Scheduling Types
 */

import type { OrchestratorSettings } from './orchestrator'

export interface AutoPublishSchedule {
  id: string
  userId: string
  /** Template prompt with optional {variation} placeholder */
  topicPrompt: string
  /** Target platforms for publishing */
  platforms: string[]
  /** Frequency label */
  frequency: 'daily' | 'every-2-days' | 'every-3-days' | 'weekly'
  /** Cron expression for scheduling */
  cronExpression: string
  /** Next run timestamp (ISO 8601) */
  nextRunAt: string
  /** User's timezone (IANA, e.g. "America/New_York") */
  timezone: string
  /** Orchestrator settings to use for each run */
  orchestratorSettings: Partial<OrchestratorSettings>
  /** Whether the schedule is active */
  isActive: boolean
  /** Creation timestamp */
  createdAt: string
  /** Last updated timestamp */
  updatedAt: string
}

export type AutoPublishExecutionStatus =
  | 'pending'
  | 'generating'
  | 'exporting'
  | 'publishing'
  | 'done'
  | 'error'

export interface AutoPublishExecution {
  id: string
  scheduleId: string
  status: AutoPublishExecutionStatus
  /** The specific prompt used (after variation) */
  prompt?: string
  /** Error message if status is 'error' */
  error?: string
  /** Credits used for this execution */
  creditsUsed: number
  /** Published post IDs/URLs */
  publishedPostIds: string[]
  /** Start timestamp */
  startedAt: string
  /** Completion timestamp */
  completedAt?: string
}

export interface AutoPublishStats {
  totalExecutions: number
  successfulExecutions: number
  totalCreditsUsed: number
  nextScheduledRun?: string
}
