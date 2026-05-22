import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { VisemeEvent, WordEvent } from '@/types/voice'
import type { LayerPart } from '@/stores/useCharacterPartsStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'

/** Per-part transform (body/eye/eyebrow/viseme/hair/shirt/pants/shoes offsets within a character) */
export interface CharPartTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
}

const DEFAULT_PART_TRANSFORM: CharPartTransform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }

/** Default draw order: body (bottom) → clothing → head → expression → hair (top) */
const DEFAULT_LAYER_ORDER: LayerPart[] = ['body', 'shirt', 'pants', 'shoes', 'head', 'eye', 'eyebrow', 'viseme', 'hair']

export function createDefaultPartTransforms(): Record<LayerPart, CharPartTransform> {
  return {
    body: { ...DEFAULT_PART_TRANSFORM },
    head: { ...DEFAULT_PART_TRANSFORM },
    shirt: { ...DEFAULT_PART_TRANSFORM },
    pants: { ...DEFAULT_PART_TRANSFORM },
    shoes: { ...DEFAULT_PART_TRANSFORM },
    eye: { ...DEFAULT_PART_TRANSFORM },
    eyebrow: { ...DEFAULT_PART_TRANSFORM },
    viseme: { ...DEFAULT_PART_TRANSFORM },
    hair: { ...DEFAULT_PART_TRANSFORM },
  }
}

export interface DialogueCharacter {
  id: string
  name: string
  /** Reference to useSavedCharactersStore character ID */
  savedCharacterId: string | null
  /** Transform on canvas */
  position: { x: number; y: number }
  scale: number
  rotation?: number
  zIndex: number
  visible: boolean
  locked: boolean
  /** ElevenLabs voice ID for this character */
  voiceId: string | null
  /** Display color for UI identification */
  color: string
  /** Per-character body part transforms (body/head/viseme/hair) */
  partTransforms?: Record<LayerPart, CharPartTransform>
  /** Per-character layer draw order */
  layerOrder?: LayerPart[]
  /** Default sprite indices for layers (used when no dialogue line is active) */
  defaultSpriteOverrides?: {
    hair?: number
    body?: number
    head?: number
    eye?: number
    eyebrow?: number
    viseme?: number
    shirt?: number
    pants?: number
    shoes?: number
  }
  /** Render mode: sprite (default 4-layer) or rigged (2D mesh deformation) */
  renderMode?: 'sprite' | 'rigged'
  /** Reference to rig in useRigStore (when renderMode is 'rigged') */
  rigId?: string | null
  /** Whether to show the bone skeleton overlay on the rigged body (default: true) */
  showBones?: boolean
  /** Active animation for this character (format: "rigId:animIndex") */
  activeAnimationId?: string | null
  /**
   * Unscaled bounding box width/height of the character as last measured by CharacterLayer.
   * Equals computedBounds.width/height (tight-fit around opaque content) when available,
   * otherwise BASE_CHARACTER_SIZE (200). Used by export renderers to correctly center
   * the character at its stored position.x/y.
   */
  boundsWidth?: number
  boundsHeight?: number
  /** Voice effect applied to all dialogue lines for this character */
  voiceEffect?: import('@/types/voiceEffects').VoiceEffectType
  /** Procedural animation identifier (e.g. 'idle', 'bounce') */
  proceduralAnim?: string
  /** Hand-drawn boiling line effect settings (optional) */
  boilingLine?: import('@/types/boilingLine').BoilingLineSettings
  /** Pixel art post-processing effect settings (optional) */
  pixelArt?: import('@/types/pixelArtEffect').PixelArtEffectSettings
  /** Active Canvas 2D style effect (mutually exclusive — only one at a time) */
  activeStyleEffect?: import('@/types/styleEffects').ActiveStyleEffect
  /** Reference to a singing dialogue line (lip sync to music, no TTS) */
  singingLineId?: string
}

/** Emotion options for dialogue line override */
export type DialogueEmotion = 'Auto' | 'Joy' | 'Anger' | 'Disgust' | 'Fear' | 'Sadness' | 'Surprise' | 'Neutral'

export interface DialogueLine {
  id: string
  characterId: string
  script: string
  /** ID of generated voice from useVoiceStore.generatedVoices */
  generatedVoiceId: string | null
  startFrame: number
  endFrame: number
  order: number
  /** Cached viseme timeline from generation */
  visemeTimeline: VisemeEvent[]
  /** Cached word timeline from generation */
  wordTimeline: WordEvent[]
  /** Emotion override for this line. 'Auto' or undefined = auto-detect from text */
  emotion?: DialogueEmotion
  /** Audio URL for this dialogue line (object URL of generated voice) */
  audioUrl?: string | null
  /** Original script text before translation or editing */
  originalScript?: string
  /** Per-part sprite index overrides for this line's time range */
  spriteOverrides?: {
    hair?: number
    body?: number
    head?: number
    eye?: number
    eyebrow?: number
    viseme?: number
    shirt?: number
    pants?: number
    shoes?: number
  }
}

interface MultiCharacterState {
  characters: DialogueCharacter[]
  dialogueLines: DialogueLine[]
  activeCharacterId: string | null
  /** Currently selected dialogue line (from timeline click) */
  selectedDialogueLineId: string | null

  // Actions
  addDialogueCharacter: (character: Omit<DialogueCharacter, 'id'>) => string
  removeDialogueCharacter: (id: string) => void
  updateDialogueCharacter: (id: string, updates: Partial<DialogueCharacter>) => void
  selectDialogueCharacter: (id: string | null) => void

  updateCharacterPartTransform: (charId: string, part: LayerPart, updates: Partial<CharPartTransform>) => void
  setCharacterLayerOrder: (charId: string, order: LayerPart[]) => void
  moveCharacterLayerUp: (charId: string, part: LayerPart) => void
  moveCharacterLayerDown: (charId: string, part: LayerPart) => void

  addDialogueLine: (line: Omit<DialogueLine, 'id'>) => string
  removeDialogueLine: (id: string) => void
  updateDialogueLine: (id: string, updates: Partial<DialogueLine>) => void
  reorderDialogueLines: (lineIds: string[]) => void
  selectDialogueLine: (id: string | null) => void
  insertDialogueLine: (afterLineId: string, line: Omit<DialogueLine, 'id'>) => string
  splitDialogueLine: (lineId: string, splitFrame: number) => void

  // Helpers
  getActiveCharacter: () => DialogueCharacter | null
  getCharacterLines: (characterId: string) => DialogueLine[]
  getLineAtFrame: (frame: number) => DialogueLine | null
  getActiveCharacterAtFrame: (frame: number) => string | null
  getSortedLines: () => DialogueLine[]

  /** Reflow dialogue line frame positions sequentially after duration changes */
  reflowDialogueFrames: (lineIds?: string[]) => void

  // Project persistence
  loadFromProject: (data: { characters: DialogueCharacter[]; dialogueLines: DialogueLine[] }) => void

  // Reset all state (for new project)
  reset: () => void
}

const CHARACTER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

let nextCharColorIndex = 0

function getNextColor(): string {
  const color = CHARACTER_COLORS[nextCharColorIndex % CHARACTER_COLORS.length]
  nextCharColorIndex++
  return color
}

export const useMultiCharacterStore = create<MultiCharacterState>()(
  immer((set, get) => ({
    characters: [],
    dialogueLines: [],
    activeCharacterId: null,
    selectedDialogueLineId: null,

    addDialogueCharacter: (character) => {
      const id = `dchar_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const colorToUse = character.color || getNextColor()

      // Auto-load saved sprite selections & part transforms when a savedCharacterId is provided
      // but the caller didn't explicitly pass them (e.g. orchestrator, drag-and-drop)
      let resolvedOverrides = character.defaultSpriteOverrides
      let resolvedPartTransforms = character.partTransforms
      if (character.savedCharacterId && (!resolvedOverrides || !resolvedPartTransforms)) {
        const savedChar = useSavedCharactersStore.getState().characters.find(
          (c) => c.id === character.savedCharacterId
        )
        if (savedChar) {
          // Build defaultSpriteOverrides from saved selectedSprites
          if (!resolvedOverrides && savedChar.selectedSprites) {
            const sel = savedChar.selectedSprites
            resolvedOverrides = {
              hair: sel.hair ?? 0,
              body: sel.body ?? 0,
              head: (sel as Record<string, number | null>).head ?? 0,
              eye: sel.eye ?? 0,
              eyebrow: sel.eyebrow ?? 0,
              shirt: sel.shirt ?? 0,
              pants: sel.pants ?? 0,
              shoes: sel.shoes ?? 0,
            }
          }
          // Build partTransforms from saved partTransforms
          if (!resolvedPartTransforms && savedChar.partTransforms) {
            const DEFAULT = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }
            const sp = savedChar.partTransforms as Record<string, typeof DEFAULT>
            resolvedPartTransforms = {
              body: sp.body ? { ...sp.body } : { ...DEFAULT },
              head: sp.head ? { ...sp.head } : { ...DEFAULT },
              shirt: sp.shirt ? { ...sp.shirt } : { ...DEFAULT },
              pants: sp.pants ? { ...sp.pants } : { ...DEFAULT },
              shoes: sp.shoes ? { ...sp.shoes } : { ...DEFAULT },
              eye: sp.eye ? { ...sp.eye } : { ...DEFAULT },
              eyebrow: sp.eyebrow ? { ...sp.eyebrow } : { ...DEFAULT },
              viseme: sp.viseme ? { ...sp.viseme } : { ...DEFAULT },
              hair: sp.hair ? { ...sp.hair } : { ...DEFAULT },
            }
          }
        }
      }

      set((state) => {
        state.characters.push({
          ...character,
          id,
          color: colorToUse,
          // Use resolved values (from saved character or caller) or defaults
          partTransforms: resolvedPartTransforms || createDefaultPartTransforms(),
          layerOrder: character.layerOrder || [...DEFAULT_LAYER_ORDER],
          defaultSpriteOverrides: resolvedOverrides,
        })
      })
      return id
    },

    removeDialogueCharacter: (id) =>
      set((state) => {
        state.characters = state.characters.filter((c) => c.id !== id)
        // Remove all dialogue lines for this character
        state.dialogueLines = state.dialogueLines.filter((l) => l.characterId !== id)
        if (state.activeCharacterId === id) {
          state.activeCharacterId = null
        }
      }),

    updateDialogueCharacter: (id, updates) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          Object.assign(character, updates)
        }
      }),

    selectDialogueCharacter: (id) =>
      set((state) => {
        state.activeCharacterId = id
      }),

    updateCharacterPartTransform: (charId, part, updates) =>
      set((state) => {
        const char = state.characters.find((c) => c.id === charId)
        if (!char) return
        // Lazy-init if missing (backwards compat for old data)
        if (!char.partTransforms) char.partTransforms = createDefaultPartTransforms()

        // Only body cascades to children (moves the whole character).
        // All other parts are independently positionable.
        const POSITION_CHILDREN: Record<string, LayerPart[]> = {
          body: ['shirt', 'pants', 'shoes'],
          head: ['eye', 'eyebrow', 'hair', 'viseme'],
          eye: [],
          shirt: [],
          pants: [],
          shoes: [],
          eyebrow: [],
          hair: [],
          viseme: [],
        }
        const SCALE_CHILDREN: Record<string, LayerPart[]> = {
          body: ['shirt', 'pants', 'shoes'],
          head: ['eye', 'eyebrow', 'hair', 'viseme'],
          eye: [],
          shirt: [],
          pants: [],
          shoes: [],
          eyebrow: [],
          hair: [],
          viseme: [],
        }
        const posChildren = POSITION_CHILDREN[part] || []
        const scaleChildren = SCALE_CHILDREN[part] || []

        // Compute position deltas to cascade to children
        const current = char.partTransforms[part]
        const dx = updates.x !== undefined ? updates.x - current.x : 0
        const dy = updates.y !== undefined ? updates.y - current.y : 0

        // Compute scale ratios to cascade to children
        const scaleRatioX = updates.scaleX !== undefined && current.scaleX !== 0
          ? updates.scaleX / current.scaleX : 1
        const scaleRatioY = updates.scaleY !== undefined && current.scaleY !== 0
          ? updates.scaleY / current.scaleY : 1

        // Apply the update to the target part
        Object.assign(char.partTransforms[part], updates)

        // Cascade position deltas to child parts
        if (dx !== 0 || dy !== 0) {
          for (const child of posChildren) {
            char.partTransforms[child].x += dx
            char.partTransforms[child].y += dy
          }
        }

        // Cascade scale ratios to child parts (multiplicative)
        if (scaleRatioX !== 1 || scaleRatioY !== 1) {
          for (const child of scaleChildren) {
            char.partTransforms[child].scaleX = Math.max(0.1, Math.min(5, char.partTransforms[child].scaleX * scaleRatioX))
            char.partTransforms[child].scaleY = Math.max(0.1, Math.min(5, char.partTransforms[child].scaleY * scaleRatioY))
          }
        }
      }),

    setCharacterLayerOrder: (charId, order) =>
      set((state) => {
        const char = state.characters.find((c) => c.id === charId)
        if (char) char.layerOrder = order
      }),

    moveCharacterLayerUp: (charId, part) =>
      set((state) => {
        const char = state.characters.find((c) => c.id === charId)
        if (!char) return
        if (!char.layerOrder) char.layerOrder = [...DEFAULT_LAYER_ORDER]
        const idx = char.layerOrder.indexOf(part)
        if (idx < char.layerOrder.length - 1) {
          const temp = char.layerOrder[idx + 1]
          char.layerOrder[idx + 1] = part
          char.layerOrder[idx] = temp
        }
      }),

    moveCharacterLayerDown: (charId, part) =>
      set((state) => {
        const char = state.characters.find((c) => c.id === charId)
        if (!char) return
        if (!char.layerOrder) char.layerOrder = [...DEFAULT_LAYER_ORDER]
        const idx = char.layerOrder.indexOf(part)
        if (idx > 0) {
          const temp = char.layerOrder[idx - 1]
          char.layerOrder[idx - 1] = part
          char.layerOrder[idx] = temp
        }
      }),

    addDialogueLine: (line) => {
      const id = `dline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      set((state) => {
        state.dialogueLines.push({ ...line, id })
      })
      return id
    },

    removeDialogueLine: (id) =>
      set((state) => {
        state.dialogueLines = state.dialogueLines.filter((l) => l.id !== id)
        // Re-order remaining lines
        const sorted = [...state.dialogueLines].sort((a, b) => a.order - b.order)
        sorted.forEach((line, idx) => {
          line.order = idx
        })
      }),

    updateDialogueLine: (id, updates) =>
      set((state) => {
        const line = state.dialogueLines.find((l) => l.id === id)
        if (line) {
          Object.assign(line, updates)
        }
      }),

    reorderDialogueLines: (lineIds) =>
      set((state) => {
        // Collect durations in the new order before mutating
        const durations: { id: string; duration: number }[] = []
        for (const id of lineIds) {
          const line = state.dialogueLines.find((l) => l.id === id)
          if (line) {
            durations.push({ id, duration: line.endFrame - line.startFrame })
          }
        }

        // Find the earliest start frame to preserve offset
        const sorted = [...state.dialogueLines].sort((a, b) => a.order - b.order)
        const firstStart = sorted.length > 0 ? sorted[0].startFrame : 0

        // Reassign order and recalculate startFrame/endFrame sequentially
        let currentFrame = firstStart
        for (let i = 0; i < durations.length; i++) {
          const line = state.dialogueLines.find((l) => l.id === durations[i].id)
          if (line) {
            line.order = i
            line.startFrame = currentFrame
            line.endFrame = currentFrame + durations[i].duration
            currentFrame = line.endFrame
          }
        }
      }),

    selectDialogueLine: (id) =>
      set((state) => {
        state.selectedDialogueLineId = id
      }),

    insertDialogueLine: (afterLineId, line) => {
      const id = `dline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      set((state) => {
        const afterLine = state.dialogueLines.find((l) => l.id === afterLineId)
        const insertOrder = afterLine ? (afterLine.order ?? 0) + 1 : state.dialogueLines.length
        // Shift subsequent lines' order
        for (const l of state.dialogueLines) {
          if ((l.order ?? 0) >= insertOrder) {
            l.order = (l.order ?? 0) + 1
          }
        }
        state.dialogueLines.push({ ...line, id, order: insertOrder })
      })
      return id
    },

    splitDialogueLine: (lineId, splitFrame) => {
      set((state) => {
        const line = state.dialogueLines.find((l) => l.id === lineId)
        if (!line) return

        const originalEnd = line.endFrame
        const originalScript = line.script
        const fraction = (splitFrame - line.startFrame) / Math.max(line.endFrame - line.startFrame, 1)
        const splitIndex = Math.round(originalScript.length * fraction)
        const textBefore = originalScript.slice(0, splitIndex).trim()
        const textAfter = originalScript.slice(splitIndex).trim()

        // Shorten existing line
        line.script = textBefore || originalScript
        line.endFrame = splitFrame

        // Create new line for the second half
        const newId = `dline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const newOrder = (line.order ?? 0) + 1

        // Shift subsequent lines' order
        for (const l of state.dialogueLines) {
          if (l.id !== lineId && (l.order ?? 0) >= newOrder) {
            l.order = (l.order ?? 0) + 1
          }
        }

        state.dialogueLines.push({
          id: newId,
          characterId: line.characterId,
          script: textAfter || '...',
          generatedVoiceId: null,
          startFrame: splitFrame,
          endFrame: originalEnd,
          order: newOrder,
          visemeTimeline: [],
          wordTimeline: [],
          emotion: line.emotion,
        })
      })
    },

    getActiveCharacter: () => {
      const { characters, activeCharacterId } = get()
      return characters.find((c) => c.id === activeCharacterId) || null
    },

    getCharacterLines: (characterId) => {
      const { dialogueLines } = get()
      return dialogueLines
        .filter((l) => l.characterId === characterId)
        .sort((a, b) => a.order - b.order)
    },

    getLineAtFrame: (frame) => {
      const { dialogueLines } = get()
      return dialogueLines.find(
        (l) => frame >= l.startFrame && frame < l.endFrame
      ) || null
    },

    getActiveCharacterAtFrame: (frame) => {
      const { dialogueLines } = get()
      const line = dialogueLines.find(
        (l) => frame >= l.startFrame && frame < l.endFrame
      )
      return line?.characterId || null
    },

    getSortedLines: () => {
      const { dialogueLines } = get()
      return [...dialogueLines].sort((a, b) => a.order - b.order)
    },

    reflowDialogueFrames: (lineIds?: string[]) =>
      set((state) => {
        // Determine which lines to reflow (default: all, sorted by current order)
        const targetIds = lineIds ?? state.dialogueLines.map((l) => l.id)
        const sorted = targetIds
          .map((id) => state.dialogueLines.find((l) => l.id === id))
          .filter((l): l is DialogueLine => !!l)
          .sort((a, b) => a.order - b.order)

        if (sorted.length === 0) return

        // Sequential reflow: each line starts where the previous one ends
        let currentFrame = sorted[0].startFrame
        for (const line of sorted) {
          const duration = line.endFrame - line.startFrame
          line.startFrame = currentFrame
          line.endFrame = currentFrame + duration
          currentFrame = line.endFrame
        }
      }),

    // Project persistence — restore characters and dialogue lines from saved project
    loadFromProject: (data) =>
      set((state) => {
        state.characters = data.characters
        state.dialogueLines = data.dialogueLines
        state.activeCharacterId = null
        state.selectedDialogueLineId = null
      }),

    // Reset all state (for new project)
    reset: () =>
      set((state) => {
        state.characters = []
        state.dialogueLines = []
        state.activeCharacterId = null
        state.selectedDialogueLineId = null
      }),
  }))
)
