import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { LayerGroup, LayerTreeViewMode, LayerTreeSaveData } from '@/types/layerTree'

interface LayerTreeState {
  groups: LayerGroup[]
  assignments: Record<string, string | null>  // layerId → groupId (null = root)
  layerOrder: Record<string, number>          // layerId → sort order within parent
  viewMode: LayerTreeViewMode
}

interface LayerTreeActions {
  setViewMode: (mode: LayerTreeViewMode) => void
  createGroup: (name: string, parentId?: string | null) => string
  deleteGroup: (id: string) => void
  renameGroup: (id: string, name: string) => void
  toggleGroupCollapsed: (id: string) => void
  toggleGroupVisibility: (id: string) => void
  toggleGroupLock: (id: string) => void
  assignToGroup: (layerId: string, groupId: string | null) => void
  reorderInGroup: (itemId: string, newOrder: number, newParentId?: string | null) => void
  getChildLayerIds: (groupId: string) => string[]
  getAllDescendantLayerIds: (groupId: string) => string[]
  exportForSave: () => LayerTreeSaveData
  loadFromProject: (data: LayerTreeSaveData) => void
  reset: () => void
}

const initialState: LayerTreeState = {
  groups: [],
  assignments: {},
  layerOrder: {},
  viewMode: 'categories',
}

export const useLayerTreeStore = create<LayerTreeState & LayerTreeActions>()(
  immer((set, get) => ({
    ...initialState,

    setViewMode: (mode) => {
      set((state) => {
        state.viewMode = mode
      })
    },

    createGroup: (name, parentId = null) => {
      const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const siblings = get().groups.filter((g) => g.parentId === parentId)
      const maxOrder = siblings.length > 0
        ? Math.max(...siblings.map((g) => g.order))
        : 0
      set((state) => {
        state.groups.push({
          id,
          name,
          parentId,
          collapsed: false,
          visible: true,
          locked: false,
          order: maxOrder + 1,
        })
      })
      return id
    },

    deleteGroup: (id) => {
      const group = get().groups.find((g) => g.id === id)
      if (!group) return
      const parentId = group.parentId

      set((state) => {
        // Move child groups to deleted group's parent
        for (const g of state.groups) {
          if (g.parentId === id) {
            g.parentId = parentId
          }
        }
        // Move assigned layers to deleted group's parent
        for (const [layerId, gid] of Object.entries(state.assignments)) {
          if (gid === id) {
            state.assignments[layerId] = parentId
          }
        }
        // Remove the group
        state.groups = state.groups.filter((g) => g.id !== id)
      })
    },

    renameGroup: (id, name) => {
      set((state) => {
        const group = state.groups.find((g) => g.id === id)
        if (group) group.name = name
      })
    },

    toggleGroupCollapsed: (id) => {
      set((state) => {
        const group = state.groups.find((g) => g.id === id)
        if (group) group.collapsed = !group.collapsed
      })
    },

    toggleGroupVisibility: (id) => {
      set((state) => {
        const group = state.groups.find((g) => g.id === id)
        if (group) group.visible = !group.visible
      })
    },

    toggleGroupLock: (id) => {
      set((state) => {
        const group = state.groups.find((g) => g.id === id)
        if (group) group.locked = !group.locked
      })
    },

    assignToGroup: (layerId, groupId) => {
      set((state) => {
        state.assignments[layerId] = groupId
        // Assign a default order if not set
        if (!(layerId in state.layerOrder)) {
          const siblings = Object.entries(state.assignments)
            .filter(([, gid]) => gid === groupId)
            .map(([lid]) => state.layerOrder[lid] ?? 0)
          state.layerOrder[layerId] = siblings.length > 0
            ? Math.max(...siblings) + 1
            : 1
        }
      })
    },

    reorderInGroup: (itemId, newOrder, newParentId) => {
      set((state) => {
        // If it's a group, update its parentId and order
        const group = state.groups.find((g) => g.id === itemId)
        if (group) {
          if (newParentId !== undefined) group.parentId = newParentId
          group.order = newOrder
        } else {
          // It's a layer — update assignment and order
          if (newParentId !== undefined) {
            state.assignments[itemId] = newParentId
          }
          state.layerOrder[itemId] = newOrder
        }
      })
    },

    getChildLayerIds: (groupId) => {
      const { assignments } = get()
      return Object.entries(assignments)
        .filter(([, gid]) => gid === groupId)
        .map(([lid]) => lid)
    },

    getAllDescendantLayerIds: (groupId) => {
      const { groups, assignments } = get()
      const result: string[] = []
      const queue = [groupId]

      while (queue.length > 0) {
        const currentId = queue.shift()!
        // Add layers directly in this group
        for (const [lid, gid] of Object.entries(assignments)) {
          if (gid === currentId) result.push(lid)
        }
        // Add child groups to queue
        for (const g of groups) {
          if (g.parentId === currentId) queue.push(g.id)
        }
      }

      return result
    },

    exportForSave: () => {
      const { groups, assignments, layerOrder } = get()
      return { groups, assignments, layerOrder }
    },

    loadFromProject: (data) => {
      set((state) => {
        state.groups = data.groups || []
        state.assignments = data.assignments || {}
        state.layerOrder = data.layerOrder || {}
      })
    },

    reset: () => {
      set(() => ({ ...initialState }))
    },
  }))
)
