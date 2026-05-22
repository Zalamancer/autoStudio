import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import { useSavedCharactersStore, type CharacterPartTab } from './useSavedCharactersStore'
import {
  generateCrowd,
  DEFAULT_CROWD_PALETTES,
  type CrowdMember,
  type CrowdPattern,
  type CharacterSpriteInfo,
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
  /** Optional: use a saved character instead of silhouettes */
  characterId?: string
  /** Which body parts to randomize per crowd member */
  randomizeParts: CharacterPartTab[]
}

interface CrowdState {
  groups: CrowdGroup[]
  /** Cached generated members per group id */
  membersCache: Record<string, CrowdMember[]>
  /** Currently selected group for right-panel editing */
  selectedGroupId: string | null

  addGroup: () => void
  removeGroup: (id: string) => void
  updateGroup: (id: string, updates: Partial<CrowdGroup>) => void
  regenerate: (groupId: string) => void
  setSeed: (groupId: string, seed: number) => void
  clearGroups: () => void
  loadFromSnapshot: (groups: CrowdGroup[]) => void
  setSelectedGroupId: (id: string | null) => void
}

// ── Sprite bitmap cache (module-level, not serializable) ──────────

const spriteBitmapCache: Record<string, Map<string, ImageBitmap>> = {}

export function getSpriteBitmaps(groupId: string): Map<string, ImageBitmap> | undefined {
  return spriteBitmapCache[groupId]
}

export function setSpriteBitmaps(groupId: string, bitmaps: Map<string, ImageBitmap>): void {
  spriteBitmapCache[groupId] = bitmaps
}

export function clearSpriteBitmaps(groupId: string): void {
  const cache = spriteBitmapCache[groupId]
  if (cache) {
    for (const bm of cache.values()) bm.close()
    delete spriteBitmapCache[groupId]
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function buildCharacterInfo(group: CrowdGroup): CharacterSpriteInfo | undefined {
  if (!group.characterId) return undefined

  const saved = useSavedCharactersStore.getState().characters.find((c) => c.id === group.characterId)
  if (!saved?.bodyParts || !saved._hydrated) return undefined

  const spriteCounts: Record<string, number> = {}
  const fixedSelections: Record<string, number> = {}
  for (const [part, urls] of Object.entries(saved.bodyParts)) {
    spriteCounts[part] = urls.length
    fixedSelections[part] = saved.selectedSprites?.[part as CharacterPartTab] ?? 0
  }

  return {
    spriteCounts,
    randomizeParts: group.randomizeParts,
    fixedSelections,
  }
}

function generateMembers(group: CrowdGroup): CrowdMember[] {
  const characterInfo = buildCharacterInfo(group)
  return generateCrowd(
    {
      count: group.count,
      pattern: group.pattern,
      seed: group.seed,
      area: group.area,
      colors: group.colors,
      animSpeed: group.animSpeed,
    },
    characterInfo,
  )
}

// ── Store ──────────────────────────────────────────────────────────

export const useCrowdStore = create<CrowdState>()(
  immer((set) => ({
    groups: [],
    membersCache: {},
    selectedGroupId: null,

    setSelectedGroupId: (id) => set({ selectedGroupId: id }),

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
          randomizeParts: ['hair', 'shirt', 'pants', 'shoes'],
        }

        state.groups.push(group)
        state.membersCache[id] = generateMembers(group)
      }),

    removeGroup: (id) =>
      set((state) => {
        state.groups = state.groups.filter((g) => g.id !== id)
        delete state.membersCache[id]
        clearSpriteBitmaps(id)
        if (state.selectedGroupId === id) state.selectedGroupId = null
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
          updates.animSpeed !== undefined ||
          updates.characterId !== undefined ||
          updates.randomizeParts !== undefined
        if (needsRegen) {
          clearSpriteBitmaps(id)
          state.membersCache[id] = generateMembers(group)
        }
      }),

    regenerate: (groupId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId)
        if (!group) return
        group.seed = Math.floor(Math.random() * 999999)
        clearSpriteBitmaps(groupId)
        state.membersCache[groupId] = generateMembers(group)
      }),

    setSeed: (groupId, seed) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId)
        if (!group) return
        group.seed = seed
        clearSpriteBitmaps(groupId)
        state.membersCache[groupId] = generateMembers(group)
      }),

    clearGroups: () =>
      set((state) => {
        for (const id of Object.keys(spriteBitmapCache)) clearSpriteBitmaps(id)
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
