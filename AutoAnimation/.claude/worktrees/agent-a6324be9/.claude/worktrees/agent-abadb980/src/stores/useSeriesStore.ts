/**
 * Series Templates Store — manages reusable templates with slot placeholders.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SeriesTemplate, SeriesEpisode, SeriesSlot, SeriesOutline, NarrativeArc } from '@/types/series'
import type { OrchestratorSettings, ClipPlan } from '@/types/orchestrator'
import { generateSeriesOutline, generateEpisodePrompt } from '@/services/seriesGenerator'
import { logger } from '@/utils/logger'

interface SeriesState {
  templates: SeriesTemplate[]
  episodes: SeriesEpisode[]
  activeTemplateId: string | null

  /** AI-generated series outlines */
  outlines: SeriesOutline[]
  /** Whether an outline is being generated */
  isGeneratingOutline: boolean

  // Actions
  addTemplate: (template: Omit<SeriesTemplate, 'id' | 'createdAt' | 'updatedAt' | 'episodeCount'>) => string
  removeTemplate: (id: string) => void
  updateTemplate: (id: string, updates: Partial<SeriesTemplate>) => void
  selectTemplate: (id: string | null) => void

  addEpisode: (episode: Omit<SeriesEpisode, 'id' | 'createdAt'>) => string
  updateEpisode: (id: string, updates: Partial<SeriesEpisode>) => void
  removeEpisode: (id: string) => void

  getActiveTemplate: () => SeriesTemplate | null
  getTemplateEpisodes: (templateId: string) => SeriesEpisode[]

  /** Create a series template from a successful orchestration run */
  createFromOrchestration: (
    name: string,
    prompt: string,
    settings: OrchestratorSettings,
    plan: ClipPlan,
  ) => string

  /** Resolve a template prompt with slot values */
  resolvePrompt: (templateId: string, slotValues: Record<string, string>) => string | null

  /** Generate an AI series outline from a topic */
  generateOutline: (
    topic: string,
    episodeCount: number,
    narrativeArc: NarrativeArc,
    settings?: Partial<OrchestratorSettings>,
  ) => Promise<SeriesOutline>

  /** Get episode prompts from an outline with series context */
  getOutlinePrompts: (outline: SeriesOutline) => string[]

  reset: () => void
}

/**
 * Extract {{SLOT}} placeholders from a prompt template.
 */
function extractSlots(prompt: string): SeriesSlot[] {
  const regex = /\{\{(\w+)\}\}/g
  const slots = new Map<string, SeriesSlot>()
  let match: RegExpExecArray | null

  while ((match = regex.exec(prompt)) !== null) {
    const key = match[1]
    if (!slots.has(key)) {
      slots.set(key, {
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        required: true,
      })
    }
  }

  return Array.from(slots.values())
}

/**
 * Convert a concrete prompt into a template by replacing specific content with slots.
 */
function templatizePrompt(prompt: string): string {
  // Keep the original prompt and let the user add {{SLOT}} placeholders manually
  // or auto-detect the most variable parts
  return prompt
}

export const useSeriesStore = create<SeriesState>()(
  immer((set, get) => ({
    templates: [],
    episodes: [],
    activeTemplateId: null,
    outlines: [],
    isGeneratingOutline: false,

    addTemplate: (template) => {
      const id = `series_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const now = Date.now()
      set((state) => {
        state.templates.push({
          ...template,
          id,
          createdAt: now,
          updatedAt: now,
          episodeCount: 0,
        })
      })
      return id
    },

    removeTemplate: (id) => {
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id)
        state.episodes = state.episodes.filter((e) => e.templateId !== id)
        if (state.activeTemplateId === id) state.activeTemplateId = null
      })
    },

    updateTemplate: (id, updates) => {
      set((state) => {
        const template = state.templates.find((t) => t.id === id)
        if (template) {
          Object.assign(template, updates, { updatedAt: Date.now() })
        }
      })
    },

    selectTemplate: (id) => {
      set((state) => {
        state.activeTemplateId = id
      })
    },

    addEpisode: (episode) => {
      const id = `episode_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        state.episodes.push({ ...episode, id, createdAt: Date.now() })
        const template = state.templates.find((t) => t.id === episode.templateId)
        if (template) template.episodeCount++
      })
      return id
    },

    updateEpisode: (id, updates) => {
      set((state) => {
        const episode = state.episodes.find((e) => e.id === id)
        if (episode) Object.assign(episode, updates)
      })
    },

    removeEpisode: (id) => {
      set((state) => {
        state.episodes = state.episodes.filter((e) => e.id !== id)
      })
    },

    getActiveTemplate: () => {
      const { templates, activeTemplateId } = get()
      return templates.find((t) => t.id === activeTemplateId) || null
    },

    getTemplateEpisodes: (templateId) => {
      return get().episodes.filter((e) => e.templateId === templateId)
    },

    createFromOrchestration: (name, prompt, settings, plan) => {
      // Convert the concrete prompt to a template with slots
      const promptTemplate = templatizePrompt(prompt)
      const slots = extractSlots(promptTemplate)

      // If no slots were detected, add a default {{TOPIC}} slot
      if (slots.length === 0) {
        slots.push({
          key: 'TOPIC',
          label: 'Topic',
          description: 'The main topic or subject for this episode',
          required: true,
        })
      }

      return get().addTemplate({
        name,
        promptTemplate: slots.length === 0
          ? promptTemplate
          : promptTemplate,
        settings,
        planSkeleton: {
          canvas: plan.canvas,
          background: plan.background,
          captions: plan.captions,
        },
        slots,
      })
    },

    resolvePrompt: (templateId, slotValues) => {
      const template = get().templates.find((t) => t.id === templateId)
      if (!template) return null

      let resolved = template.promptTemplate
      for (const slot of template.slots) {
        const value = slotValues[slot.key] || slot.defaultValue || ''
        resolved = resolved.replace(new RegExp(`\\{\\{${slot.key}\\}\\}`, 'g'), value)
      }
      return resolved
    },

    generateOutline: async (topic, episodeCount, narrativeArc, settings) => {
      set((s) => { s.isGeneratingOutline = true })
      try {
        const outline = await generateSeriesOutline({
          topic,
          episodeCount,
          narrativeArc,
          settings,
        })
        set((s) => {
          s.outlines.push(outline)
          s.isGeneratingOutline = false
        })
        return outline
      } catch (err) {
        set((s) => { s.isGeneratingOutline = false })
        logger.error('[SeriesStore] Outline generation failed:', err)
        throw err
      }
    },

    getOutlinePrompts: (outline) => {
      return outline.episodes.map((_, i) => generateEpisodePrompt(outline, i))
    },

    reset: () => {
      set((state) => {
        state.templates = []
        state.episodes = []
        state.activeTemplateId = null
        state.outlines = []
        state.isGeneratingOutline = false
      })
    },
  }))
)
