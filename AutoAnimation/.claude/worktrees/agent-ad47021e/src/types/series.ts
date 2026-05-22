/**
 * Series Templates — reusable templates with slot placeholders
 * for consistent series content (e.g. "Daily AI News #47").
 */

import type { OrchestratorSettings, ClipPlan } from './orchestrator'

/** A placeholder slot in a series template (e.g. {{TOPIC}}, {{HOOK}}) */
export interface SeriesSlot {
  /** Slot key, e.g. "TOPIC", "HOOK", "FACT_1" */
  key: string
  /** Human-readable label */
  label: string
  /** Optional description / hint text */
  description?: string
  /** Default value (pre-filled) */
  defaultValue?: string
  /** Whether this slot is required */
  required: boolean
}

/** A saved series template */
export interface SeriesTemplate {
  id: string
  /** Display name, e.g. "Daily AI News" */
  name: string
  /** Original prompt with {{SLOT}} placeholders */
  promptTemplate: string
  /** Frozen orchestrator settings */
  settings: OrchestratorSettings
  /** Skeleton clip plan (frozen from the original successful run) */
  planSkeleton: Partial<ClipPlan>
  /** Slot definitions extracted from the prompt template */
  slots: SeriesSlot[]
  /** Number of episodes generated from this template */
  episodeCount: number
  /** Timestamp */
  createdAt: number
  updatedAt: number
  /** User ID (for Supabase RLS) */
  userId?: string
}

/** A generated episode from a series template */
export interface SeriesEpisode {
  id: string
  templateId: string
  /** Filled slot values */
  slotValues: Record<string, string>
  /** Resolved prompt (slots replaced with values) */
  resolvedPrompt: string
  /** Project ID after orchestration */
  projectId?: string
  /** Status */
  status: 'pending' | 'generating' | 'done' | 'error'
  error?: string
  createdAt: number
}

// ── AI Series Outline Types ──

export type NarrativeArc = 'standalone' | 'progressive' | 'seasonal'

export type ArcPosition = 'intro' | 'build' | 'climax' | 'resolution'

/** AI-generated outline for an entire series */
export interface SeriesOutline {
  title: string
  theme: string
  targetAudience: string
  episodeCount: number
  narrativeArc: NarrativeArc
  episodes: SeriesEpisodeOutline[]
  /** Shared character names across the series */
  sharedCharacters: string[]
}

/** Outline for a single episode in a series */
export interface SeriesEpisodeOutline {
  episodeNumber: number
  title: string
  /** Full orchestrator prompt for this episode */
  prompt: string
  /** Suggested opening hooks */
  hooks: string[]
  /** Call-to-action text */
  cta: string
  /** Position in the narrative arc */
  arcPosition: ArcPosition
}
