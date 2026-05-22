import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import type { CanvasObjectRef, EasingType } from '@/types/keyframes'
import type { PathConfig, Point2D, PathResult } from '@/engine/path'
import { evaluatePath, evaluatePathArcLength, PathPresets } from '@/engine/path'
import { applyEasing } from '@/services/interpolation'

export interface PathDefinition {
  id: string
  config: PathConfig
  name: string
  objectRef: CanvasObjectRef
  startFrame: number
  endFrame: number
  autoRotate: boolean
  easing: EasingType
  loop: boolean
  constantSpeed: boolean
}

interface PathState {
  paths: PathDefinition[]
  activeEditingPathId: string | null

  // CRUD
  addPath: (objectRef: CanvasObjectRef, config: PathConfig) => string
  updatePath: (pathId: string, updates: Partial<PathDefinition>) => void
  removePath: (pathId: string) => void
  removePathsForObject: (objectRef: CanvasObjectRef) => void

  // Path editing
  setActiveEditingPath: (pathId: string | null) => void
  updateControlPoint: (pathId: string, pointIndex: number, point: Point2D) => void
  addControlPoint: (pathId: string, point: Point2D, afterIndex: number) => void
  removeControlPoint: (pathId: string, pointIndex: number) => void

  // Presets
  applyPreset: (pathId: string, presetName: keyof typeof PathPresets, canvasWidth: number, canvasHeight: number) => void

  // Queries
  getPathForObject: (objectRef: CanvasObjectRef) => PathDefinition | undefined
  evaluateAtFrame: (pathId: string, frame: number) => PathResult | undefined

  // Persistence
  loadFromProject: (paths: PathDefinition[]) => void
}

export const usePathStore = create<PathState>()(
  temporal(
    immer((set, get) => ({
      paths: [],
      activeEditingPathId: null,

      addPath: (objectRef, config) => {
        const id = `path_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        set((state) => {
          state.paths.push({
            id,
            config,
            name: `Path ${state.paths.length + 1}`,
            objectRef: { ...objectRef },
            startFrame: 0,
            endFrame: 90,
            autoRotate: false,
            easing: 'ease-in-out',
            loop: false,
            constantSpeed: true,
          })
          state.activeEditingPathId = id
        })
        return id
      },

      updatePath: (pathId, updates) =>
        set((state) => {
          const path = state.paths.find((p) => p.id === pathId)
          if (path) {
            Object.assign(path, updates)
          }
        }),

      removePath: (pathId) =>
        set((state) => {
          state.paths = state.paths.filter((p) => p.id !== pathId)
          if (state.activeEditingPathId === pathId) {
            state.activeEditingPathId = null
          }
        }),

      removePathsForObject: (objectRef) =>
        set((state) => {
          state.paths = state.paths.filter(
            (p) => !(p.objectRef.objectType === objectRef.objectType && p.objectRef.objectId === objectRef.objectId)
          )
        }),

      setActiveEditingPath: (pathId) =>
        set((state) => {
          state.activeEditingPathId = pathId
        }),

      updateControlPoint: (pathId, pointIndex, point) =>
        set((state) => {
          const path = state.paths.find((p) => p.id === pathId)
          if (path && path.config.points[pointIndex]) {
            path.config.points[pointIndex] = { ...point }
          }
        }),

      addControlPoint: (pathId, point, afterIndex) =>
        set((state) => {
          const path = state.paths.find((p) => p.id === pathId)
          if (path) {
            path.config.points.splice(afterIndex + 1, 0, { ...point })
          }
        }),

      removeControlPoint: (pathId, pointIndex) =>
        set((state) => {
          const path = state.paths.find((p) => p.id === pathId)
          if (path && path.config.points.length > 2) {
            path.config.points.splice(pointIndex, 1)
          }
        }),

      applyPreset: (pathId, presetName, canvasWidth, canvasHeight) =>
        set((state) => {
          const path = state.paths.find((p) => p.id === pathId)
          if (!path) return

          const cx = canvasWidth / 2
          const cy = canvasHeight / 2
          const size = Math.min(canvasWidth, canvasHeight) * 0.3

          let config: PathConfig
          switch (presetName) {
            case 'sCurve':
              config = PathPresets.sCurve(canvasWidth, canvasHeight)
              break
            case 'orbit':
              config = PathPresets.orbit(cx, cy, size)
              break
            case 'bouncingArc':
              config = PathPresets.bouncingArc(
                { x: canvasWidth * 0.2, y: canvasHeight * 0.7 },
                { x: canvasWidth * 0.8, y: canvasHeight * 0.7 }
              )
              break
            case 'figureEight':
              config = PathPresets.figureEight(cx, cy, size)
              break
            case 'spiral':
              config = PathPresets.spiral(cx, cy, size)
              break
            case 'zigzag':
              config = PathPresets.zigzag(canvasWidth, canvasHeight)
              break
            case 'wave':
              config = PathPresets.wave(canvasWidth, canvasHeight)
              break
            default:
              return
          }

          path.config = config
        }),

      getPathForObject: (objectRef) => {
        return get().paths.find(
          (p) => p.objectRef.objectType === objectRef.objectType && p.objectRef.objectId === objectRef.objectId
        )
      },

      evaluateAtFrame: (pathId, frame) => {
        const path = get().paths.find((p) => p.id === pathId)
        if (!path) return undefined

        let t: number
        const duration = path.endFrame - path.startFrame
        if (duration <= 0) return undefined

        if (path.loop) {
          t = ((frame - path.startFrame) % duration) / duration
          if (t < 0) t += 1
        } else {
          t = (frame - path.startFrame) / duration
          if (t < 0 || t > 1) return undefined
        }

        // Apply easing
        t = Math.max(0, Math.min(1, t))
        t = applyEasing(t, path.easing)

        // Arc-length parameterization for constant speed
        if (path.constantSpeed) {
          return evaluatePathArcLength(t, path.config)
        }
        return evaluatePath(t, path.config)
      },

      loadFromProject: (paths) =>
        set((state) => {
          state.paths = paths
          state.activeEditingPathId = null
        }),
    })),
    { limit: 100 }
  )
)
