import { create } from 'zustand'
import { fetchTemplateById, type TemplateDetail } from '../services/api'
import type { MotionDesignDescription } from '@proanimate/core'
import { useProjectStore } from './useProjectStore'
import { getTemplateById as getBundledTemplate } from '../data/templates'

interface EditorState {
  templateId: string | null
  template: TemplateDetail | null
  description: MotionDesignDescription | null
  config: Record<string, unknown>
  loading: boolean
  error: string | null
  projectId: string | null  // set when editing an existing project
  loadTemplate: (id: string) => Promise<void>
  loadBundledTemplate: (id: string) => void
  loadProject: (projectId: string, templateId: string, config: Record<string, unknown>, description: MotionDesignDescription) => void
  updateConfig: (key: string, value: unknown) => void
  resetConfig: () => void
  clear: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  templateId: null,
  template: null,
  description: null,
  config: {},
  loading: false,
  error: null,
  projectId: null,

  loadTemplate: async (id) => {
    set({ loading: true, error: null, templateId: id, projectId: null })
    try {
      const template = await fetchTemplateById(id)
      const description = template.motionDesignDescription as unknown as MotionDesignDescription

      // Check for draft
      const draft = useProjectStore.getState().getDraft(id)
      const config = draft ? draft.config : { ...template.defaultConfig }

      set({ template, description, config, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  loadBundledTemplate: (id) => {
    const template = getBundledTemplate(id)
    if (!template) {
      set({ error: 'Template not found', loading: false })
      return
    }
    set({
      templateId: id,
      template: {
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        tags: template.tags,
        thumbnailUrl: null,
        configSchema: template.configSchema,
        defaultConfig: template.defaultConfig,
        motionDesignDescription: template.motionDesignDescription as unknown as Record<string, unknown>,
      } as any,
      description: template.motionDesignDescription,
      config: { ...template.defaultConfig },
      loading: false,
      error: null,
      projectId: null,
    })
  },

  loadProject: (projectId, templateId, config, description) => {
    set({
      projectId,
      templateId,
      description,
      config,
      loading: false,
      error: null,
    })
  },

  updateConfig: (key, value) => {
    const newConfig = { ...get().config, [key]: value }
    set({ config: newConfig })

    // Auto-save draft
    const { templateId } = get()
    if (templateId) {
      useProjectStore.getState().saveDraft(templateId, newConfig)
    }
  },

  resetConfig: () => {
    const { template } = get()
    if (template) {
      set({ config: { ...template.defaultConfig } })
    }
  },

  clear: () => {
    set({
      templateId: null,
      template: null,
      description: null,
      config: {},
      projectId: null,
      loading: false,
      error: null,
    })
  },
}))
