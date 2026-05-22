import { create } from 'zustand'
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject as apiDeleteProject,
  type Project,
} from '../services/api'

// In-memory draft storage (MMKV requires native module not in current dev build)
const draftCache = new Map<string, string>()
const storage = {
  getString: (key: string) => draftCache.get(key),
  set: (key: string, value: string) => { draftCache.set(key, value) },
  delete: (key: string) => { draftCache.delete(key) },
}

interface DraftProject {
  templateId: string
  config: Record<string, unknown>
  updatedAt: number
}

interface ProjectState {
  projects: Project[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  create: (data: { name: string; templateId?: string; configState?: Record<string, unknown>; motionDesignDescription?: Record<string, unknown> }) => Promise<Project>
  update: (id: string, data: Partial<{ name: string; configState: Record<string, unknown> }>) => Promise<void>
  remove: (id: string) => Promise<void>
  // Draft persistence
  saveDraft: (templateId: string, config: Record<string, unknown>) => void
  getDraft: (templateId: string) => DraftProject | null
  clearDraft: (templateId: string) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const { projects } = await fetchProjects()
      set({ projects, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const project = await createProject(data)
    set((state) => ({ projects: [project, ...state.projects] }))
    return project
  },

  update: async (id, data) => {
    const updated = await updateProject(id, data)
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }))
  },

  remove: async (id) => {
    await apiDeleteProject(id)
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
  },

  saveDraft: (templateId, config) => {
    const draft: DraftProject = { templateId, config, updatedAt: Date.now() }
    storage.set(`draft:${templateId}`, JSON.stringify(draft))
  },

  getDraft: (templateId) => {
    const raw = storage.getString(`draft:${templateId}`)
    if (!raw) return null
    try {
      return JSON.parse(raw) as DraftProject
    } catch {
      return null
    }
  },

  clearDraft: (templateId) => {
    storage.delete(`draft:${templateId}`)
  },
}))
