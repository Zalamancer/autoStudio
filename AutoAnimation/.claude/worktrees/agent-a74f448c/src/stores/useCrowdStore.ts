import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import {
  generateCrowd,
  DEFAULT_CROWD_PALETTES,
  type CrowdMember,
  type CrowdPattern,
} from '@/services/crowdGenerator'

// ── Types ──────────────────────────────────────────────────────────

export interface CrowdGroup {
  id: string
  name: string
  pattern: CrowdPattern
  count: number
  seed: number
  /** Bounding area in normalized coordinates (0-1) */
  area: { x: number; y: number; w: number; h: number }
  /** Array of [skinColor, outfitColor] pairs */
  colors: string[][]
  animSpeed: number
  visible: boolean
  startFrame: number
  endFrame: number
}

interface CrowdState {
  groups: CrowdGroup[]
  /** Cached generated members per group id */
  membersCache: Record<string, CrowdMember[]>

  addGroup: () => void
  removeGroup: (id: string) => void
  updateGroup: (id: string, updates: Partial<CrowdGroup>) => void
  regenerate: (groupId: string) => void
  setSeed: (groupId: string, seed: number) => void
  clearGroups: () => void
  loadFromSnapshot: (groups: CrowdGroup[]) => void
}

// ── Helpers ────────────────────────────────────────────────────────

function generateMembers(group: CrowdGroup): CrowdMember[] {
  return generateCrowd({
    count: group.count,
    pattern: group.pattern,
    seed: group.seed,
    area: group.area,
    colors: group.colors,
    animSpeed: group.animSpeed,
  })
}

// ── Store ──────────────────────────────────────────────────────────

export const useCrowdStore = create<CrowdState>()(
  immer((set) => ({
    groups: [],
    membersCache: {},

    addGroup: () =>
      set((state) => {
        const { totalFrames } = useTimelineStore.getState()
        const id = `crowd-${Date.now()}`
        const count = state.groups.length + 1
        const seed = Math.floor(Math.random() * 999999)

        const group: CrowdGroup = {
          id,
          name: `Crowd ${count}`,
          pattern: 'scattered',
          count: 30,
          seed,
          area: { x: 0.05, y: 0.5, w: 0.9, h: 0.45 },
          colors: DEFAULT_CROWD_PALETTES,
          animSpeed: 1,
          visible: true,
          startFrame: 0,
          endFrame: totalFrames,
        }

        state.groups.push(group)
        state.membersCache[id] = generateMembers(group)
      }),

    removeGroup: (id) =>
      set((state) => {
        state.groups = state.groups.filter((g) => g.id !== id)
        delete state.membersCache[id]
      }),

    updateGroup: (id, updates) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === id)
        if (!group) return
        Object.assign(group, updates)
        // Regenerate members when relevant properties change
        const needsRegen =
          updates.count !== undefined ||
          updates.pattern !== undefined ||
          updates.seed !== undefined ||
          updates.area !== undefined ||
          updates.colors !== undefined ||
          updates.animSpeed !== undefined
        if (needsRegen) {
          state.membersCache[id] = generateMembers(group)
        }
      }),

    regenerate: (groupId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId)
        if (!group) return
        group.seed = Math.floor(Math.random() * 999999)
        state.membersCache[groupId] = generateMembers(group)
      }),

    setSeed: (groupId, seed) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId)
        if (!group) return
        group.seed = seed
        state.membersCache[groupId] = generateMembers(group)
      }),

    clearGroups: () =>
      set((state) => {
        state.groups = []
        state.membersCache = {}
      }),

    loadFromSnapshot: (groups) =>
      set((state) => {
        state.groups = groups
        state.membersCache = {}
        for (const group of groups) {
          state.membersCache[group.id] = generateMembers(group)
        }
      }),
  })),
)
