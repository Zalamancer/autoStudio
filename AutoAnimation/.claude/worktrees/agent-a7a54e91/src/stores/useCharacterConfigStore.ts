import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Viseme } from '@/types/voice'
import { LEGACY_VISEME_MAP } from '@/types/voice'
import type { CurvedVisemeKey, CurvedVisemeSprites, MouthCurvature } from '@/types/nanoBanana'
import { createEmptySpriteSet, CURVATURES, VISEMES } from '@/types/nanoBanana'
import type { EyeVariant, EyebrowVariant, EyeVariantSprites, EyebrowVariantSprites } from '@/types/emotionHeads'
import { createEmptyEyeVariantSet, createEmptyEyebrowVariantSet, getEyeVariantFromEmotion, getEyebrowVariantFromEmotion } from '@/types/emotionHeads'
import type { VisemeSpriteMap } from '@/services/visemeMapper'

export type CharacterPartTab = 'viseme' | 'eye' | 'eyebrow' | 'hair' | 'body' | 'head' | 'shirt' | 'pants' | 'shoes'
export type CuttingMode = 'grid' | 'pixel'

// Sprite with optional label
export interface LabeledSprite {
  src: string
  label: string
}

// Viseme mapping for lip sync
export type VisemeMapping = Record<Viseme, number | null> // index into viseme savedImages array

interface CharacterConfigState {
  // Uploaded images per tab
  uploadedImages: Record<CharacterPartTab, string | null>

  // Saved/cut images per tab (now with labels)
  savedImages: Record<CharacterPartTab, string[]>
  spriteLabels: Record<CharacterPartTab, Record<number, string>>

  // Custom quick-tags per tab (user-defined label presets)
  customTags: Record<CharacterPartTab, string[]>

  // Currently active config tab
  currentConfigTab: CharacterPartTab | null

  // Config panel open state
  isConfigPanelOpen: boolean

  // Cutting settings
  cuttingMode: CuttingMode
  gridRows: number
  gridColumns: number
  pixelWidth: number
  pixelHeight: number

  // Temporary slices before saving
  tempSlices: string[]

  // Actions
  setUploadedImage: (tab: CharacterPartTab, image: string | null) => void
  setSavedImages: (tab: CharacterPartTab, images: string[]) => void
  addSavedImages: (tab: CharacterPartTab, images: string[]) => void
  removeSavedImage: (tab: CharacterPartTab, index: number) => void
  clearSavedImages: (tab: CharacterPartTab) => void

  setCurrentConfigTab: (tab: CharacterPartTab | null) => void
  setConfigPanelOpen: (open: boolean) => void

  setCuttingMode: (mode: CuttingMode) => void
  setGridSettings: (rows: number, columns: number) => void
  setPixelSettings: (width: number, height: number) => void

  setTempSlices: (slices: string[]) => void
  clearTempSlices: () => void

  // Helper to open config panel for a tab
  openConfigPanel: (tab: CharacterPartTab) => void
  closeConfigPanel: () => void

  // Sprite labeling
  setSpriteLabel: (tab: CharacterPartTab, index: number, label: string) => void

  // Custom quick-tags
  addCustomTag: (tab: CharacterPartTab, tag: string) => void
  removeCustomTag: (tab: CharacterPartTab, tag: string) => void

  // Viseme mapping for lip sync
  visemeMapping: VisemeMapping
  useDefaultVisemeSet: boolean
  setVisemeMapping: (viseme: Viseme, spriteIndex: number | null) => void
  setUseDefaultVisemeSet: (useDefault: boolean) => void
  autoMapVisemesFromLabels: () => void

  // Project persistence
  loadFromProject: (data: {
    savedImages: Record<CharacterPartTab, string[]>
    spriteLabels: Record<CharacterPartTab, Record<number, string>>
    visemeMapping: Record<Viseme, number>
    uploadedImages?: Record<CharacterPartTab, string | null>
    curvedVisemes?: CurvedVisemeSprites
    eyeVariants?: EyeVariantSprites
    eyebrowVariants?: EyebrowVariantSprites
    visemeTransitionMs?: number
    visemeSpriteMap?: VisemeSpriteMap | null
  }) => void

  // 36-sprite curved viseme system (emotion-aware lip sync)
  curvedVisemes: CurvedVisemeSprites
  useCurvedVisemes: boolean  // Whether to use curved system vs flat system
  setCurvedViseme: (key: CurvedVisemeKey, image: string | null) => void
  setCurvedVisemes: (sprites: CurvedVisemeSprites) => void
  setUseCurvedVisemes: (use: boolean) => void
  clearCurvedVisemes: () => void

  // Eye variant sprites (6 variants)
  eyeVariantSprites: EyeVariantSprites
  setEyeVariantSprite: (variant: EyeVariant, image: string | null) => void
  setEyeVariantSprites: (sprites: EyeVariantSprites) => void
  clearEyeVariantSprites: () => void

  // Eyebrow variant sprites (6 variants)
  eyebrowVariantSprites: EyebrowVariantSprites
  setEyebrowVariantSprite: (variant: EyebrowVariant, image: string | null) => void
  setEyebrowVariantSprites: (sprites: EyebrowVariantSprites) => void
  clearEyebrowVariantSprites: () => void

  // Pre-computed viseme sprite map for flexible name matching
  visemeSpriteMap: VisemeSpriteMap | null
  setVisemeSpriteMap: (map: VisemeSpriteMap | null) => void

  // Viseme cross-fade transition duration (ms)
  visemeTransitionMs: number
  setVisemeTransitionMs: (ms: number) => void

  // Reset all state to initial values (for new project)
  reset: () => void
}

/**
 * Sync current savedImages/spriteLabels/curvedVisemes back to the active
 * saved character in IndexedDB so deletions persist across reloads.
 * Debounced to avoid rapid successive writes.
 */
let _syncTimer: ReturnType<typeof setTimeout> | null = null
function _syncToSavedCharacter() {
  if (_syncTimer) clearTimeout(_syncTimer)
  _syncTimer = setTimeout(async () => {
    const { useSavedCharactersStore } = await import('./useSavedCharactersStore')
    const savedStore = useSavedCharactersStore.getState()

    const charId = savedStore.selectedCharacterId
    if (!charId) return

    const state = useCharacterConfigStore.getState()
    savedStore.updateCharacter(charId, {
      bodyParts: { ...state.savedImages },
      spriteLabels: { ...state.spriteLabels },
      curvedVisemes: { ...state.curvedVisemes },
      uploadedSheets: { ...state.uploadedImages },
    })
    savedStore.persistImages(charId).catch(() => {})
  }, 300)
}

export const useCharacterConfigStore = create<CharacterConfigState>()(
  immer((set) => ({
    // Initial state
    uploadedImages: {
      viseme: null,
      eye: null,
      eyebrow: null,
      hair: null,
      body: null,
      head: null,
      shirt: null,
      pants: null,
      shoes: null,
    },

    savedImages: {
      viseme: [],
      eye: [],
      eyebrow: [],
      hair: [],
      body: [],
      head: [],
      shirt: [],
      pants: [],
      shoes: [],
    },

    spriteLabels: {
      viseme: {},
      eye: {},
      eyebrow: {},
      hair: {},
      body: {},
      head: {},
      shirt: {},
      pants: {},
      shoes: {},
    },

    customTags: {
      viseme: [],
      eye: [],
      eyebrow: [],
      hair: [],
      body: [],
      head: [],
      shirt: [],
      pants: [],
      shoes: [],
    },

    currentConfigTab: null,
    isConfigPanelOpen: false,

    cuttingMode: 'grid' as CuttingMode,
    gridRows: 1,
    gridColumns: 1,
    pixelWidth: 128,
    pixelHeight: 128,

    tempSlices: [],

    // Actions
    setUploadedImage: (tab, image) =>
      set((state) => {
        state.uploadedImages[tab] = image
      }),

    setSavedImages: (tab, images) =>
      set((state) => {
        state.savedImages[tab] = images
      }),

    addSavedImages: (tab, images) =>
      set((state) => {
        state.savedImages[tab].push(...images)
      }),

    removeSavedImage: (tab, index) => {
      set((state) => {
        state.savedImages[tab].splice(index, 1)
        // Remove the label and shift remaining labels
        const newLabels: Record<number, string> = {}
        Object.entries(state.spriteLabels[tab]).forEach(([key, value]) => {
          const keyNum = parseInt(key)
          if (keyNum < index) {
            newLabels[keyNum] = value
          } else if (keyNum > index) {
            newLabels[keyNum - 1] = value
          }
          // Skip the removed index
        })
        state.spriteLabels[tab] = newLabels
      })
      // Persist deletion to the saved character in IndexedDB
      _syncToSavedCharacter()
    },

    clearSavedImages: (tab) => {
      set((state) => {
        state.savedImages[tab] = []
        state.spriteLabels[tab] = {}
      })
      // Persist clearing to the saved character in IndexedDB
      _syncToSavedCharacter()
    },

    setCurrentConfigTab: (tab) =>
      set((state) => {
        state.currentConfigTab = tab
      }),

    setConfigPanelOpen: (open) =>
      set((state) => {
        state.isConfigPanelOpen = open
      }),

    setCuttingMode: (mode) =>
      set((state) => {
        state.cuttingMode = mode
      }),

    setGridSettings: (rows, columns) =>
      set((state) => {
        state.gridRows = rows
        state.gridColumns = columns
      }),

    setPixelSettings: (width, height) =>
      set((state) => {
        state.pixelWidth = width
        state.pixelHeight = height
      }),

    setTempSlices: (slices) =>
      set((state) => {
        state.tempSlices = slices
      }),

    clearTempSlices: () =>
      set((state) => {
        state.tempSlices = []
      }),

    openConfigPanel: (tab) =>
      set((state) => {
        state.currentConfigTab = tab
        state.isConfigPanelOpen = true
        state.tempSlices = []
      }),

    closeConfigPanel: () =>
      set((state) => {
        state.isConfigPanelOpen = false
        state.tempSlices = []
      }),

    setSpriteLabel: (tab, index, label) =>
      set((state) => {
        if (label.trim()) {
          state.spriteLabels[tab][index] = label.trim()
        } else {
          delete state.spriteLabels[tab][index]
        }
      }),

    addCustomTag: (tab, tag) =>
      set((state) => {
        const trimmed = tag.trim()
        if (trimmed && !state.customTags[tab].includes(trimmed)) {
          state.customTags[tab].push(trimmed)
        }
      }),

    removeCustomTag: (tab, tag) =>
      set((state) => {
        state.customTags[tab] = state.customTags[tab].filter((t) => t !== tag)
      }),

    // Viseme mapping - maps 9 viseme types to sprite indices
    visemeMapping: {
      Rest: null,
      Aa: null,
      Ee: null,
      Oh: null,
      Oo: null,
      FV: null,
      MBP: null,
      DTL: null,
      ChR: null,
    } as VisemeMapping,

    useDefaultVisemeSet: true,

    setVisemeMapping: (viseme, spriteIndex) =>
      set((state) => {
        state.visemeMapping[viseme] = spriteIndex
      }),

    setUseDefaultVisemeSet: (useDefault) =>
      set((state) => {
        state.useDefaultVisemeSet = useDefault
        if (useDefault) {
          // Auto-map first 9 sprites to visemes in order
          const visemes: Viseme[] = ['Rest', 'Aa', 'Ee', 'Oh', 'Oo', 'FV', 'MBP', 'DTL', 'ChR']
          visemes.forEach((viseme, i) => {
            state.visemeMapping[viseme] = i < state.savedImages.viseme.length ? i : null
          })
        }
      }),

    // Auto-map visemes based on sprite labels
    autoMapVisemesFromLabels: () =>
      set((state) => {
        const labels = state.spriteLabels.viseme
        const visemes: Viseme[] = ['Rest', 'Aa', 'Ee', 'Oh', 'Oo', 'FV', 'MBP', 'DTL', 'ChR']

        // Reset mapping
        visemes.forEach((v) => {
          state.visemeMapping[v] = null
        })

        // Find sprites with matching labels
        Object.entries(labels).forEach(([indexStr, label]) => {
          const index = parseInt(indexStr)
          const lowerLabel = label.toLowerCase().trim()

          // Check if label matches a viseme (case-insensitive)
          for (const viseme of visemes) {
            if (lowerLabel === viseme.toLowerCase() || lowerLabel.includes(viseme.toLowerCase())) {
              state.visemeMapping[viseme] = index
              break
            }
          }

          // Also check common alternatives
          const labelAliases: Record<string, Viseme> = {
            'closed': 'Rest',
            'neutral': 'Rest',
            'idle': 'Rest',
            'rest': 'Rest',
            'silent': 'Rest',
            'a': 'Aa',
            'ah': 'Aa',
            'aa': 'Aa',
            'ae': 'Aa',
            'ay': 'Aa',
            'd': 'DTL',
            't': 'DTL',
            'n': 'DTL',
            'th': 'DTL',
            'l': 'DTL',
            'dtl': 'DTL',
            'ee': 'Ee',
            'eh': 'Ee',
            'ey': 'Ee',
            'f': 'FV',
            'v': 'FV',
            'fv': 'FV',
            'm': 'MBP',
            'b': 'MBP',
            'p': 'MBP',
            'mbp': 'MBP',
            'oh': 'Oh',
            'ow': 'Oh',
            'o': 'Oh',
            'r': 'ChR',
            'er': 'ChR',
            's': 'ChR',
            'z': 'ChR',
            'sh': 'ChR',
            'ch': 'ChR',
            'chr': 'ChR',
            'oo': 'Oo',
            'uh': 'Oo',
            'uw': 'Oo',
            'u': 'Oo',
            'w': 'Oo',
            'y': 'Oo',
          }

          if (labelAliases[lowerLabel] && state.visemeMapping[labelAliases[lowerLabel]] === null) {
            state.visemeMapping[labelAliases[lowerLabel]] = index
          }

          // Handle "curvature_viseme" format from quick-tag overlay (e.g. "upward_Aa")
          const curvedMatch = label.match(/^(upward|neutral|downward)_(.+)$/i)
          if (curvedMatch) {
            const visemePart = curvedMatch[2]
            for (const viseme of visemes) {
              if (visemePart.toLowerCase() === viseme.toLowerCase()) {
                if (state.visemeMapping[viseme] === null) {
                  state.visemeMapping[viseme] = index
                }
                break
              }
            }
          }
        })
      }),

    // Load from project
    loadFromProject: (data) =>
      set((state) => {
        state.savedImages = data.savedImages
        state.spriteLabels = data.spriteLabels
        // Convert viseme mapping - handle both new 9-viseme and legacy formats
        const newVisemes: Viseme[] = ['Rest', 'Aa', 'Ee', 'Oh', 'Oo', 'FV', 'MBP', 'DTL', 'ChR']
        newVisemes.forEach((v) => {
          state.visemeMapping[v] = (data.visemeMapping as Record<string, number>)[v] ?? null
        })
        // Backwards compat: map old viseme names to new
        for (const [oldKey, newKey] of Object.entries(LEGACY_VISEME_MAP)) {
          if (state.visemeMapping[newKey] === null && (data.visemeMapping as Record<string, number>)[oldKey] != null) {
            state.visemeMapping[newKey] = (data.visemeMapping as Record<string, number>)[oldKey]
          }
        }
        state.useDefaultVisemeSet = false
        // Restore uploaded images (sprite sheets)
        if (data.uploadedImages) {
          state.uploadedImages = data.uploadedImages
        }
        // Restore curved visemes if present
        if (data.curvedVisemes) {
          state.curvedVisemes = data.curvedVisemes
          state.useCurvedVisemes = true
        }
        // Restore eye/eyebrow variant sprites if present
        if (data.eyeVariants) {
          state.eyeVariantSprites = data.eyeVariants
        }
        if (data.eyebrowVariants) {
          state.eyebrowVariantSprites = data.eyebrowVariants
        }
        // Restore viseme transition duration if present
        if (data.visemeTransitionMs !== undefined) {
          state.visemeTransitionMs = data.visemeTransitionMs
        }
        // Restore viseme sprite map if present
        if (data.visemeSpriteMap) {
          state.visemeSpriteMap = data.visemeSpriteMap
        }
      }),

    // 24-sprite curved viseme system
    curvedVisemes: createEmptySpriteSet(),
    useCurvedVisemes: false,

    setCurvedViseme: (key, image) =>
      set((state) => {
        state.curvedVisemes[key] = image
      }),

    setCurvedVisemes: (sprites) =>
      set((state) => {
        state.curvedVisemes = sprites
        state.useCurvedVisemes = true

        // Sync curved visemes into savedImages.viseme + labels so they render
        // through the standard SavedImagesGrid (consistent UI across all tabs)
        const images: string[] = []
        const labels: Record<number, string> = {}
        for (const curvature of CURVATURES) {
          for (const viseme of VISEMES) {
            const key = `${curvature}_${viseme}` as CurvedVisemeKey
            const sprite = sprites[key]
            if (sprite) {
              const idx = images.length
              images.push(sprite)
              labels[idx] = key
            }
          }
        }
        state.savedImages.viseme = images
        state.spriteLabels.viseme = labels
      }),

    setUseCurvedVisemes: (use) =>
      set((state) => {
        state.useCurvedVisemes = use
      }),

    clearCurvedVisemes: () =>
      set((state) => {
        state.curvedVisemes = createEmptySpriteSet()
        state.useCurvedVisemes = false
        state.savedImages.viseme = []
        state.spriteLabels.viseme = {}
      }),

    // Eye variant sprites (6 variants)
    eyeVariantSprites: createEmptyEyeVariantSet(),

    setEyeVariantSprite: (variant, image) =>
      set((state) => {
        state.eyeVariantSprites[variant] = image
      }),

    setEyeVariantSprites: (sprites) =>
      set((state) => {
        state.eyeVariantSprites = sprites
      }),

    clearEyeVariantSprites: () =>
      set((state) => {
        state.eyeVariantSprites = createEmptyEyeVariantSet()
      }),

    // Eyebrow variant sprites (6 variants)
    eyebrowVariantSprites: createEmptyEyebrowVariantSet(),

    setEyebrowVariantSprite: (variant, image) =>
      set((state) => {
        state.eyebrowVariantSprites[variant] = image
      }),

    setEyebrowVariantSprites: (sprites) =>
      set((state) => {
        state.eyebrowVariantSprites = sprites
      }),

    clearEyebrowVariantSprites: () =>
      set((state) => {
        state.eyebrowVariantSprites = createEmptyEyebrowVariantSet()
      }),

    // Pre-computed viseme sprite map for flexible name matching
    visemeSpriteMap: null as VisemeSpriteMap | null,

    setVisemeSpriteMap: (map) =>
      set((state) => {
        state.visemeSpriteMap = map
      }),

    // Viseme cross-fade transition duration (ms)
    visemeTransitionMs: 60,

    setVisemeTransitionMs: (ms) =>
      set((state) => {
        state.visemeTransitionMs = ms
      }),

    // Reset all state to initial values (for new project)
    reset: () =>
      set((state) => {
        state.uploadedImages = { viseme: null, eye: null, eyebrow: null, hair: null, body: null, head: null, shirt: null, pants: null, shoes: null }
        state.savedImages = { viseme: [], eye: [], eyebrow: [], hair: [], body: [], head: [], shirt: [], pants: [], shoes: [] }
        state.spriteLabels = { viseme: {}, eye: {}, eyebrow: {}, hair: {}, body: {}, head: {}, shirt: {}, pants: {}, shoes: {} }
        state.customTags = { viseme: [], eye: [], eyebrow: [], hair: [], body: [], head: [], shirt: [], pants: [], shoes: [] }
        state.currentConfigTab = null
        state.isConfigPanelOpen = false
        state.cuttingMode = 'grid' as CuttingMode
        state.gridRows = 1
        state.gridColumns = 1
        state.pixelWidth = 128
        state.pixelHeight = 128
        state.tempSlices = []
        state.visemeMapping = {
          Rest: null, Aa: null, Ee: null, Oh: null, Oo: null,
          FV: null, MBP: null, DTL: null, ChR: null,
        } as VisemeMapping
        state.useDefaultVisemeSet = true
        state.curvedVisemes = createEmptySpriteSet()
        state.useCurvedVisemes = false
        state.eyeVariantSprites = createEmptyEyeVariantSet()
        state.eyebrowVariantSprites = createEmptyEyebrowVariantSet()
        state.visemeTransitionMs = 60
        state.visemeSpriteMap = null
      }),
  }))
)

// Helper function to get viseme sprite index (outside store to avoid circular reference)
export function getVisemeSpriteIndex(viseme: Viseme): number | null {
  const state = useCharacterConfigStore.getState()
  if (state.useDefaultVisemeSet) {
    // Default: first 9 sprites map to visemes in order
    const visemeOrder: Viseme[] = ['Rest', 'Aa', 'Ee', 'Oh', 'Oo', 'FV', 'MBP', 'DTL', 'ChR']
    const index = visemeOrder.indexOf(viseme)
    return index >= 0 && index < state.savedImages.viseme.length ? index : null
  }
  return state.visemeMapping[viseme]
}

// Helper function to get curved viseme sprite (for emotion-aware lip sync)
// Now checks visemeSpriteMap first for flexible name matching
export function getCurvedVisemeSprite(curvature: MouthCurvature, viseme: Viseme): string | null {
  const state = useCharacterConfigStore.getState()
  // Check pre-computed map first (handles non-canonical sprite names)
  if (state.visemeSpriteMap) {
    const key = `${curvature}_${viseme}` as CurvedVisemeKey
    if (state.visemeSpriteMap[key]) return state.visemeSpriteMap[key]
    // Fallback to neutral curvature in the map
    const neutralKey = `neutral_${viseme}` as CurvedVisemeKey
    if (state.visemeSpriteMap[neutralKey]) return state.visemeSpriteMap[neutralKey]
  }
  // Direct lookup on curvedVisemes
  const key = `${curvature}_${viseme}` as CurvedVisemeKey
  return state.curvedVisemes[key]
}

// Helper to check if curved visemes are available
export function hasCurvedVisemes(): boolean {
  const state = useCharacterConfigStore.getState()
  return state.useCurvedVisemes && Object.values(state.curvedVisemes).some(v => v !== null)
}

/**
 * Get the eye variant sprite for a given emotion name.
 */
export function getEyeVariantSprite(emotion: string): string | null {
  const state = useCharacterConfigStore.getState()
  const variant = getEyeVariantFromEmotion(emotion)
  return state.eyeVariantSprites[variant] ?? null
}

/**
 * Get the eyebrow variant sprite for a given emotion name.
 */
export function getEyebrowVariantSprite(emotion: string): string | null {
  const state = useCharacterConfigStore.getState()
  const variant = getEyebrowVariantFromEmotion(emotion)
  return state.eyebrowVariantSprites[variant] ?? null
}

// Helper to check if eye variant sprites are available
export function hasEyeVariants(): boolean {
  const state = useCharacterConfigStore.getState()
  return Object.values(state.eyeVariantSprites).some(v => v !== null)
}

// Helper to check if eyebrow variant sprites are available
export function hasEyebrowVariants(): boolean {
  const state = useCharacterConfigStore.getState()
  return Object.values(state.eyebrowVariantSprites).some(v => v !== null)
}

// Legacy compatibility: check if any expression sprites (eye or eyebrow) are available
export function hasEmotionHeads(): boolean {
  return hasEyeVariants() || hasEyebrowVariants()
}
