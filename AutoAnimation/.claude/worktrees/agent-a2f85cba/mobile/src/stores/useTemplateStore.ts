import { create } from 'zustand'
import { fetchTemplates, type TemplateSummary } from '../services/api'

interface TemplateState {
  templates: TemplateSummary[]
  loading: boolean
  error: string | null
  selectedCategory: string | null
  searchQuery: string
  fetch: () => Promise<void>
  setCategory: (category: string | null) => void
  setSearch: (query: string) => void
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,
  selectedCategory: null,
  searchQuery: '',

  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const { selectedCategory, searchQuery } = get()
      const { templates } = await fetchTemplates({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      })
      set({ templates, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  setCategory: (category) => {
    set({ selectedCategory: category })
    get().fetch()
  },

  setSearch: (query) => {
    set({ searchQuery: query })
    // Debounce would be nice here but keep it simple
    get().fetch()
  },
}))
