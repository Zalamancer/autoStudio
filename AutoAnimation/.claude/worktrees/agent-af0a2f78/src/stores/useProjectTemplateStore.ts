import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ProjectTemplate, TemplateCategory } from '@/types/projectTemplate'
import {
  listPublished,
  listMyTemplates,
  deleteTemplate as deleteTemplateSvc,
} from '@/services/templateService'

interface ProjectTemplateState {
  // Published templates library
  templates: ProjectTemplate[]
  // User's own templates
  myTemplates: ProjectTemplate[]
  // UI state
  selectedTemplateId: string | null
  isLoading: boolean
  error: string | null
  searchQuery: string
  categoryFilter: TemplateCategory | 'all'

  // Actions
  fetchPublished: () => Promise<void>
  fetchMyTemplates: () => Promise<void>
  selectTemplate: (id: string | null) => void
  setSearch: (query: string) => void
  setCategory: (category: TemplateCategory | 'all') => void
  deleteTemplate: (id: string) => Promise<void>
  clearError: () => void
}

export const useProjectTemplateStore = create<ProjectTemplateState>()(
  immer((set, get) => ({
    templates: [],
    myTemplates: [],
    selectedTemplateId: null,
    isLoading: false,
    error: null,
    searchQuery: '',
    categoryFilter: 'all',

    fetchPublished: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const { searchQuery, categoryFilter } = get()
        const templates = await listPublished({
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          search: searchQuery || undefined,
          limit: 50,
        })
        set((state) => {
          state.templates = templates
          state.isLoading = false
        })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to load templates'
          state.isLoading = false
        })
      }
    },

    fetchMyTemplates: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const templates = await listMyTemplates()
        set((state) => {
          state.myTemplates = templates
          state.isLoading = false
        })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to load templates'
          state.isLoading = false
        })
      }
    },

    selectTemplate: (id) =>
      set((state) => {
        state.selectedTemplateId = id
      }),

    setSearch: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    setCategory: (category) =>
      set((state) => {
        state.categoryFilter = category
      }),

    deleteTemplate: async (id) => {
      try {
        await deleteTemplateSvc(id)
        set((state) => {
          state.templates = state.templates.filter((t) => t.id !== id)
          state.myTemplates = state.myTemplates.filter((t) => t.id !== id)
          if (state.selectedTemplateId === id) {
            state.selectedTemplateId = null
          }
        })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to delete template'
        })
      }
    },

    clearError: () =>
      set((state) => {
        state.error = null
      }),
  }))
)
