import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type { TimingTemplate } from '@/types/timingTemplate'
import type { KeyframableObjectType } from '@/types/keyframes'
import { BUILTIN_TIMING_TEMPLATES } from '@/data/builtinTimingTemplates'

interface TimingTemplateState {
  templates: TimingTemplate[]

  // CRUD
  addTemplate: (template: Omit<TimingTemplate, 'id' | 'source'>) => string
  updateTemplate: (id: string, updates: Partial<TimingTemplate>) => void
  removeTemplate: (id: string) => void
  duplicateTemplate: (id: string) => string

  // Queries
  getTemplateById: (id: string) => TimingTemplate | undefined
  getTemplatesByCategory: (category: TimingTemplate['category']) => TimingTemplate[]
  getCompatibleTemplates: (objectType: KeyframableObjectType) => TimingTemplate[]

  // Import/Export
  exportTemplateAsJSON: (id: string) => string
  importTemplateFromJSON: (json: string) => string

  // Persistence
  loadBuiltins: () => void
}

export const useTimingTemplateStore = create<TimingTemplateState>()(
  persist(
    immer((set, get) => ({
      templates: [...BUILTIN_TIMING_TEMPLATES],

      addTemplate: (template) => {
        const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        set((state) => {
          state.templates.push({
            ...template,
            id,
            source: 'user',
          })
        })
        return id
      },

      updateTemplate: (id, updates) =>
        set((state) => {
          const tpl = state.templates.find((t) => t.id === id)
          if (tpl && tpl.source === 'user') {
            Object.assign(tpl, updates)
          }
        }),

      removeTemplate: (id) =>
        set((state) => {
          state.templates = state.templates.filter(
            (t) => t.id !== id || t.source === 'builtin'
          )
        }),

      duplicateTemplate: (id) => {
        const source = get().templates.find((t) => t.id === id)
        if (!source) return ''
        const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        set((state) => {
          state.templates.push({
            ...JSON.parse(JSON.stringify(source)),
            id: newId,
            name: `${source.name} (copy)`,
            source: 'user',
          })
        })
        return newId
      },

      getTemplateById: (id) => {
        return get().templates.find((t) => t.id === id)
      },

      getTemplatesByCategory: (category) => {
        return get().templates.filter((t) => t.category === category)
      },

      getCompatibleTemplates: (objectType) => {
        return get().templates.filter((t) => {
          if (t.compatibleTypes === 'all') return true
          return (t.compatibleTypes as KeyframableObjectType[]).includes(objectType)
        })
      },

      exportTemplateAsJSON: (id) => {
        const tpl = get().templates.find((t) => t.id === id)
        if (!tpl) return '{}'
        return JSON.stringify(tpl, null, 2)
      },

      importTemplateFromJSON: (json) => {
        try {
          const parsed = JSON.parse(json) as TimingTemplate
          const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          set((state) => {
            state.templates.push({
              ...parsed,
              id: newId,
              source: 'user',
            })
          })
          return newId
        } catch {
          return ''
        }
      },

      loadBuiltins: () =>
        set((state) => {
          // Add any missing builtins
          for (const builtin of BUILTIN_TIMING_TEMPLATES) {
            if (!state.templates.some((t) => t.id === builtin.id)) {
              state.templates.push(builtin)
            }
          }
        }),
    })),
    {
      name: 'timing-templates-storage',
      partialize: (state) => ({
        templates: state.templates.filter((t) => t.source === 'user'),
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<TimingTemplateState>
        return {
          ...current,
          templates: [
            ...BUILTIN_TIMING_TEMPLATES,
            ...(persistedState.templates ?? []),
          ],
        }
      },
    }
  )
)
