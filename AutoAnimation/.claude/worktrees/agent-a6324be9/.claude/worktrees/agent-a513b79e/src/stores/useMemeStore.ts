/**
 * useMemeStore.ts
 *
 * Zustand store for the Meme Template Engine.
 * Manages meme template selection, config editing, and canvas integration.
 *
 * Memes are HTML templates with a specialized UI. When added to canvas,
 * they create entries in useHTMLTemplateLayerStore and are rendered by
 * the existing HTMLTemplateLayer component.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { MEME_TEMPLATES } from '@/data/memeTemplates'
import { MEME_TEMPLATE_META, type MemeTemplateMeta } from '@/data/memeTemplates'
import { getTemplateContent } from '@/data/builtinTemplates'
import { parseTemplateConfig } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { useHTMLTemplateLayerStore } from './useHTMLTemplateLayerStore'
import { useTimelineStore } from './useTimelineStore'
import { useCanvasStore } from './useCanvasStore'
import type { BuiltinTemplate } from '@/data/builtinTemplates'

// ── Types ─────────────────────────────────────────────────────────────

export interface MemeConfigValue {
  key: string
  value: string
}

interface MemeStoreState {
  /** All available meme templates */
  templates: BuiltinTemplate[]
  /** Template metadata (fields, emoji, etc.) keyed by id */
  meta: Record<string, MemeTemplateMeta>
  /** Currently selected meme template ID */
  selectedTemplateId: string | null
  /** Config values for the selected meme (text fields, colors, etc.) */
  configValues: Record<string, string>
  /** Search query for filtering memes */
  searchQuery: string

  // Actions
  selectMeme: (templateId: string | null) => void
  updateConfig: (key: string, value: string) => void
  setSearchQuery: (query: string) => void
  addMemeToCanvas: () => void
  resetConfig: () => void
}

// ── Store ─────────────────────────────────────────────────────────────

export const useMemeStore = create<MemeStoreState>()(
  immer((set, get) => ({
    templates: MEME_TEMPLATES,
    meta: MEME_TEMPLATE_META,
    selectedTemplateId: null,
    configValues: {},
    searchQuery: '',

    selectMeme: (templateId) =>
      set((state) => {
        state.selectedTemplateId = templateId
        state.configValues = {}

        // Pre-populate config with default values from template metadata
        if (templateId) {
          const meta = state.meta[templateId]
          if (meta) {
            for (const field of meta.fields) {
              state.configValues[field.key] = field.placeholder
            }
          }

          // Also parse the actual template HTML to get full CONFIG defaults
          const tpl = state.templates.find((t) => t.id === templateId)
          if (tpl) {
            const html = getTemplateContent(tpl.filename)
            if (html) {
              const parsed = parseTemplateConfig(html)
              for (const prop of parsed) {
                if (typeof prop.value === 'string' && !state.configValues[prop.key]) {
                  state.configValues[prop.key] = prop.value
                }
              }
            }
          }
        }
      }),

    updateConfig: (key, value) =>
      set((state) => {
        state.configValues[key] = value
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    resetConfig: () =>
      set((state) => {
        const templateId = state.selectedTemplateId
        state.configValues = {}
        if (templateId) {
          const meta = state.meta[templateId]
          if (meta) {
            for (const field of meta.fields) {
              state.configValues[field.key] = field.placeholder
            }
          }
        }
      }),

    addMemeToCanvas: () => {
      const { selectedTemplateId, configValues, templates } = get()
      if (!selectedTemplateId) return

      const tpl = templates.find((t) => t.id === selectedTemplateId)
      if (!tpl) return

      const rawHtml = getTemplateContent(tpl.filename)
      if (!rawHtml) {
        console.warn('[MemeStore] No HTML content for meme template:', tpl.filename)
        return
      }

      // Parse config properties from template
      const staticConfig = parseTemplateConfig(rawHtml)

      // Override with user-edited values
      const updatedConfig = staticConfig.map((prop) => {
        if (prop.key in configValues && typeof configValues[prop.key] === 'string') {
          return { ...prop, value: configValues[prop.key] }
        }
        return prop
      })

      // Inject message bridge for live updates
      const bridgedHtml = injectMessageBridge(rawHtml)

      const canvasWidth = useCanvasStore.getState().canvasWidth
      const canvasHeight = useCanvasStore.getState().canvasHeight
      const totalFrames = useTimelineStore.getState().totalFrames
      const templateId = `meme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      // Add to HTML template layer store (existing infrastructure handles rendering)
      useHTMLTemplateLayerStore.getState().addTemplate({
        id: templateId,
        htmlContent: bridgedHtml,
        name: tpl.title,
        position: { x: 0, y: 0 },
        scale: 1,
        opacity: 1,
        zIndex: 1,
        rotation: 0,
        visible: true,
        width: canvasWidth,
        height: canvasHeight,
        startFrame: 0,
        endFrame: totalFrames,
        customConfig: updatedConfig,
      })

      // Apply the user config values via the template's customConfig
      const store = useHTMLTemplateLayerStore.getState()
      for (const [key, value] of Object.entries(configValues)) {
        store.updateTemplateConfig(templateId, key, value)
      }
    },
  }))
)
