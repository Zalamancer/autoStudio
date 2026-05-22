import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import type {
  CanvasObjectRef,
  ObjectPropertyTrack,
  EasingType,
  CubicBezierParams,
} from '@/types/keyframes'
import { interpolatePropertyKeyframes } from '@/services/interpolation'
import { isAngleProperty } from '@/services/keyframeProperties'

function refMatches(a: CanvasObjectRef, b: CanvasObjectRef): boolean {
  return a.objectType === b.objectType && a.objectId === b.objectId
}

function makeTrackId(ref: CanvasObjectRef, property: string): string {
  return `${ref.objectType}:${ref.objectId}:${property}`
}

function makeKeyframeId(): string {
  return `kf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

interface KeyframeState {
  tracks: ObjectPropertyTrack[]
  isRecordMode: boolean
  selectedKeyframeIds: string[]
  defaultEasing: EasingType

  // Record mode
  setRecordMode: (on: boolean) => void
  toggleRecordMode: () => void
  setDefaultEasing: (easing: EasingType) => void

  // Keyframe CRUD
  setKeyframe: (
    objectRef: CanvasObjectRef,
    property: string,
    frame: number,
    value: number
  ) => void
  removeKeyframe: (keyframeId: string) => void
  removeKeyframesAtFrame: (objectRef: CanvasObjectRef, frame: number) => void
  removeAllKeyframes: (objectRef: CanvasObjectRef) => void
  updateKeyframeEasing: (
    keyframeId: string,
    easing: EasingType,
    bezierParams?: CubicBezierParams
  ) => void

  // Tagged keyframes (for beat sync, etc.)
  setTaggedKeyframe: (
    objectRef: CanvasObjectRef,
    property: string,
    frame: number,
    value: number,
    easing: EasingType,
    tag: string
  ) => void
  removeTaggedKeyframes: (objectRef: CanvasObjectRef, tag: string) => void

  // Bulk record from a transform event
  setKeyframesFromTransform: (
    objectRef: CanvasObjectRef,
    frame: number,
    properties: Record<string, number>,
    currentValues?: Record<string, number>
  ) => void

  // Selection
  selectKeyframe: (id: string, multi?: boolean) => void
  deselectKeyframe: (id: string) => void
  clearKeyframeSelection: () => void
  deleteSelectedKeyframes: () => void

  // Queries (non-immer, use get())
  getTracksForObject: (objectRef: CanvasObjectRef) => ObjectPropertyTrack[]
  getInterpolatedValue: (
    objectRef: CanvasObjectRef,
    property: string,
    frame: number
  ) => number | undefined
  getInterpolatedValues: (
    objectRef: CanvasObjectRef,
    frame: number
  ) => Record<string, number>
  getAllObjectsWithKeyframes: () => CanvasObjectRef[]
  hasKeyframes: (objectRef: CanvasObjectRef) => boolean
  getKeyframeFrames: (objectRef: CanvasObjectRef) => number[]

  // Persistence
  loadFromProject: (tracks: ObjectPropertyTrack[]) => void
  clearAll: () => void
}

export const useKeyframeStore = create<KeyframeState>()(
  temporal(
    immer((set, get) => ({
      tracks: [],
      isRecordMode: false,
      selectedKeyframeIds: [],
      defaultEasing: 'ease-in-out' as EasingType,

      setRecordMode: (on) =>
        set((state) => {
          state.isRecordMode = on
        }),

      toggleRecordMode: () =>
        set((state) => {
          state.isRecordMode = !state.isRecordMode
        }),

      setDefaultEasing: (easing) =>
        set((state) => {
          state.defaultEasing = easing
        }),

      // -----------------------------------------------------------------
      // Set a single keyframe for one property
      // -----------------------------------------------------------------
      setKeyframe: (objectRef, property, frame, value) =>
        set((state) => {
          const trackId = makeTrackId(objectRef, property)
          let track = state.tracks.find((t) => t.id === trackId)

          if (!track) {
            track = {
              id: trackId,
              objectRef: { ...objectRef },
              property,
              keyframes: [],
            }
            state.tracks.push(track)
          }

          // Check if a keyframe already exists at this frame
          const existingIdx = track.keyframes.findIndex((kf) => kf.frame === frame)
          if (existingIdx !== -1) {
            track.keyframes[existingIdx].value = value
          } else {
            track.keyframes.push({
              id: makeKeyframeId(),
              frame,
              value,
              easing: state.defaultEasing,
            })
            // Keep sorted
            track.keyframes.sort((a, b) => a.frame - b.frame)
          }
        }),

      // -----------------------------------------------------------------
      // Tagged keyframes
      // -----------------------------------------------------------------
      setTaggedKeyframe: (objectRef, property, frame, value, easing, tag) =>
        set((state) => {
          const trackId = makeTrackId(objectRef, property)
          let track = state.tracks.find((t) => t.id === trackId)

          if (!track) {
            track = {
              id: trackId,
              objectRef: { ...objectRef },
              property,
              keyframes: [],
            }
            state.tracks.push(track)
          }

          const existingIdx = track.keyframes.findIndex((kf) => kf.frame === frame)
          if (existingIdx !== -1) {
            track.keyframes[existingIdx].value = value
            track.keyframes[existingIdx].easing = easing
            track.keyframes[existingIdx].tag = tag
          } else {
            track.keyframes.push({
              id: makeKeyframeId(),
              frame,
              value,
              easing,
              tag,
            })
            track.keyframes.sort((a, b) => a.frame - b.frame)
          }
        }),

      removeTaggedKeyframes: (objectRef, tag) =>
        set((state) => {
          for (const track of state.tracks) {
            if (refMatches(track.objectRef, objectRef)) {
              track.keyframes = track.keyframes.filter((kf) => kf.tag !== tag)
            }
          }
          state.tracks = state.tracks.filter((t) => t.keyframes.length > 0)
        }),

      removeKeyframe: (keyframeId) =>
        set((state) => {
          for (const track of state.tracks) {
            const idx = track.keyframes.findIndex((kf) => kf.id === keyframeId)
            if (idx !== -1) {
              track.keyframes.splice(idx, 1)
              break
            }
          }
          // Remove empty tracks
          state.tracks = state.tracks.filter((t) => t.keyframes.length > 0)
          state.selectedKeyframeIds = state.selectedKeyframeIds.filter(
            (id) => id !== keyframeId
          )
        }),

      removeKeyframesAtFrame: (objectRef, frame) =>
        set((state) => {
          for (const track of state.tracks) {
            if (refMatches(track.objectRef, objectRef)) {
              track.keyframes = track.keyframes.filter((kf) => kf.frame !== frame)
            }
          }
          state.tracks = state.tracks.filter((t) => t.keyframes.length > 0)
        }),

      removeAllKeyframes: (objectRef) =>
        set((state) => {
          state.tracks = state.tracks.filter(
            (t) => !refMatches(t.objectRef, objectRef)
          )
        }),

      updateKeyframeEasing: (keyframeId, easing, bezierParams) =>
        set((state) => {
          for (const track of state.tracks) {
            const kf = track.keyframes.find((k) => k.id === keyframeId)
            if (kf) {
              kf.easing = easing
              kf.bezierParams = bezierParams
              break
            }
          }
        }),

      // -----------------------------------------------------------------
      // Bulk set keyframes from a transform event
      // -----------------------------------------------------------------
      setKeyframesFromTransform: (objectRef, frame, properties, currentValues) =>
        set((state) => {
          for (const [property, value] of Object.entries(properties)) {
            const trackId = makeTrackId(objectRef, property)
            let track = state.tracks.find((t) => t.id === trackId)

            if (!track) {
              track = {
                id: trackId,
                objectRef: { ...objectRef },
                property,
                keyframes: [],
              }
              state.tracks.push(track)
            }

            // Auto-create frame 0 keyframe if this is the first keyframe and frame > 0
            if (track.keyframes.length === 0 && frame > 0 && currentValues) {
              const initialValue = currentValues[property]
              if (initialValue !== undefined) {
                track.keyframes.push({
                  id: makeKeyframeId(),
                  frame: 0,
                  value: initialValue,
                  easing: state.defaultEasing,
                })
              }
            }

            // Set or update keyframe at current frame
            const existingIdx = track.keyframes.findIndex((kf) => kf.frame === frame)
            if (existingIdx !== -1) {
              track.keyframes[existingIdx].value = value
            } else {
              track.keyframes.push({
                id: makeKeyframeId(),
                frame,
                value,
                easing: state.defaultEasing,
              })
            }

            // Keep sorted
            track.keyframes.sort((a, b) => a.frame - b.frame)
          }
        }),

      // -----------------------------------------------------------------
      // Selection
      // -----------------------------------------------------------------
      selectKeyframe: (id, multi = false) =>
        set((state) => {
          if (multi) {
            if (!state.selectedKeyframeIds.includes(id)) {
              state.selectedKeyframeIds.push(id)
            }
          } else {
            state.selectedKeyframeIds = [id]
          }
        }),

      deselectKeyframe: (id) =>
        set((state) => {
          state.selectedKeyframeIds = state.selectedKeyframeIds.filter(
            (kId) => kId !== id
          )
        }),

      clearKeyframeSelection: () =>
        set((state) => {
          state.selectedKeyframeIds = []
        }),

      deleteSelectedKeyframes: () =>
        set((state) => {
          const idsToDelete = new Set(state.selectedKeyframeIds)
          for (const track of state.tracks) {
            track.keyframes = track.keyframes.filter(
              (kf) => !idsToDelete.has(kf.id)
            )
          }
          state.tracks = state.tracks.filter((t) => t.keyframes.length > 0)
          state.selectedKeyframeIds = []
        }),

      // -----------------------------------------------------------------
      // Queries
      // -----------------------------------------------------------------
      getTracksForObject: (objectRef) => {
        return get().tracks.filter((t) => refMatches(t.objectRef, objectRef))
      },

      getInterpolatedValue: (objectRef, property, frame) => {
        const trackId = makeTrackId(objectRef, property)
        const track = get().tracks.find((t) => t.id === trackId)
        if (!track || track.keyframes.length === 0) return undefined
        return interpolatePropertyKeyframes(
          track.keyframes,
          frame,
          isAngleProperty(objectRef.objectType, property)
        )
      },

      getInterpolatedValues: (objectRef, frame) => {
        const result: Record<string, number> = {}
        const tracks = get().tracks.filter((t) => refMatches(t.objectRef, objectRef))
        for (const track of tracks) {
          if (track.keyframes.length === 0) continue
          const val = interpolatePropertyKeyframes(
            track.keyframes,
            frame,
            isAngleProperty(objectRef.objectType, track.property)
          )
          if (val !== undefined) {
            result[track.property] = val
          }
        }
        return result
      },

      getAllObjectsWithKeyframes: () => {
        const seen = new Map<string, CanvasObjectRef>()
        for (const track of get().tracks) {
          if (track.keyframes.length > 0) {
            const key = `${track.objectRef.objectType}:${track.objectRef.objectId}`
            if (!seen.has(key)) {
              seen.set(key, track.objectRef)
            }
          }
        }
        return Array.from(seen.values())
      },

      hasKeyframes: (objectRef) => {
        return get().tracks.some(
          (t) => refMatches(t.objectRef, objectRef) && t.keyframes.length > 0
        )
      },

      getKeyframeFrames: (objectRef) => {
        const frameSet = new Set<number>()
        for (const track of get().tracks) {
          if (refMatches(track.objectRef, objectRef)) {
            for (const kf of track.keyframes) {
              frameSet.add(kf.frame)
            }
          }
        }
        return Array.from(frameSet).sort((a, b) => a - b)
      },

      // -----------------------------------------------------------------
      // Persistence
      // -----------------------------------------------------------------
      loadFromProject: (tracks) =>
        set((state) => {
          state.tracks = tracks
          state.selectedKeyframeIds = []
        }),

      clearAll: () =>
        set((state) => {
          state.tracks = []
          state.selectedKeyframeIds = []
          state.isRecordMode = false
        }),
    })),
    { limit: 100 }
  )
)
