import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  RigData,
  BoneSkeleton,
  BoneJoint,
  BonePose,
  JointPoseState,
  BonePoseTrack,
  SkinWeight,
  SVGElementSkinning,
} from '@/types/rig'
import { generateGridMesh, generateAlphaAwareMesh, loadImageData } from '@/services/meshGenerator'
import { computeSkinningWeights } from '@/services/meshDeformer'
import { getPoseAtFrame } from '@/services/poseInterpolation'
import { decodeSvgDataUrl, parseSvgElements, computeElementSkinningWeights } from '@/services/svgRigService'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildRestPose(skeleton: BoneSkeleton): BonePose {
  const pose: BonePose = {}
  for (const joint of skeleton.joints) {
    pose[joint.id] = { dx: 0, dy: 0, rotation: 0 }
  }
  return pose
}

/** Recompute SVG element skinning weights if the rig has SVG bindings. */
function recomputeSvgWeightsIfNeeded(rig: RigData): void {
  if (!rig.svgElementSkinning || rig.svgElementSkinning.length === 0 || rig.skeleton.joints.length === 0) return
  const elements = rig.svgElementSkinning.map((b) => ({
    elementId: b.elementId,
    tagName: b.tagName,
    label: b.label,
    centerX: b.pivotX,
    centerY: b.pivotY,
  }))
  rig.svgElementSkinning = computeElementSkinningWeights(elements, rig.skeleton, rig.imageWidth, rig.imageHeight)
}

interface RigState {
  // Rig data
  rigs: Record<string, RigData>

  // Active editing state
  activeRigId: string | null
  selectedJointId: string | null
  selectedSvgElementId: string | null
  isRigMode: boolean
  showMeshWireframe: boolean
  showBoneOverlay: boolean

  // Current pose (live manipulation)
  currentPose: BonePose | null

  // Bone pose animation tracks
  poseTracks: BonePoseTrack[]
  activePoseTrackId: string | null

  // Per-character active pose track (characterId → trackId)
  characterPoseTrackIds: Record<string, string>

  // Global animation selection (format: "rigId:animIndex")
  activeAnimationId: string | null

  // Auto-rig state
  isAutoRigging: boolean
  autoRigProgress: string | null
  autoRigError: string | null

  // Rig CRUD
  createRig: (imageUrl: string, imageWidth: number, imageHeight: number, gridSpacing?: number) => string
  createSvgRig: (svgDataUrl: string) => string
  deleteRig: (rigId: string) => void
  setAutoRigResult: (rigId: string, skeleton: BoneSkeleton) => void

  // SVG element rigging
  setSvgElementWeights: (rigId: string, elementId: string, weights: SkinWeight[]) => void
  autoComputeSvgWeights: (rigId: string) => void
  selectSvgElement: (id: string | null) => void
  updateSvgElementPivots: (rigId: string, updatedSkinning: SVGElementSkinning) => void

  // Joint editing
  updateJointPosition: (rigId: string, jointId: string, x: number, y: number) => void
  addJoint: (rigId: string, joint: BoneJoint) => void
  removeJoint: (rigId: string, jointId: string) => void
  setParent: (rigId: string, jointId: string, parentId: string | null) => void

  // Mesh
  regenerateMesh: (rigId: string, gridSpacing?: number) => void
  regenerateAlphaMesh: (rigId: string, gridSpacing?: number) => Promise<void>
  recomputeSkinning: (rigId: string, influenceRadius?: number) => void

  // Posing
  setJointPose: (jointId: string, pose: Partial<JointPoseState>) => void
  setCurrentPose: (pose: BonePose) => void
  resetPose: () => void

  // Pose keyframes / animation selection
  selectPoseTrack: (trackId: string | null) => void
  selectCharacterPoseTrack: (characterId: string, trackId: string) => void
  selectAnimation: (id: string | null) => void
  renameAnimation: (rigId: string, animIndex: number, newName: string) => void
  removeAnimation: (rigId: string, animIndex: number, trackId: string) => void
  addPoseKeyframe: (characterId: string, frame: number, pose: BonePose) => void
  removePoseKeyframe: (trackId: string, keyframeId: string) => void
  getInterpolatedPoseAtFrame: (characterId: string, frame: number) => BonePose | null

  // Selection / mode
  selectJoint: (id: string | null) => void
  selectRig: (id: string | null) => void
  toggleRigMode: () => void
  setRigMode: (on: boolean) => void

  // Auto-rig progress
  setAutoRigging: (value: boolean) => void
  setAutoRigProgress: (msg: string | null) => void
  setAutoRigError: (err: string | null) => void

  // Persistence
  loadFromProject: (data: { rigs: Record<string, RigData>; poseTracks: BonePoseTrack[] }) => void
  clearAll: () => void
}

export const useRigStore = create<RigState>()(
  persist(
    immer((set, get) => ({
      rigs: {},
      activeRigId: null,
      selectedJointId: null,
      selectedSvgElementId: null,
      isRigMode: false,
      showMeshWireframe: false,
      showBoneOverlay: true,
      currentPose: null,
      poseTracks: [],
      activePoseTrackId: null,
      characterPoseTrackIds: {},
      activeAnimationId: null,
      isAutoRigging: false,
      autoRigProgress: null,
      autoRigError: null,

      createRig: (imageUrl, imageWidth, imageHeight, gridSpacing = 48) => {
        const id = generateId()
        // Start with a fast grid mesh, then async upgrade to alpha-aware mesh
        const mesh = generateGridMesh(imageWidth, imageHeight, gridSpacing)
        const emptyPose: BonePose = {}
        const rig: RigData = {
          id,
          sourceImageUrl: imageUrl,
          imageWidth,
          imageHeight,
          skeleton: { joints: [], rootJointId: '' },
          mesh,
          skinning: mesh.vertices.map(() => []),
          meshGridSpacing: gridSpacing,
          restPose: emptyPose,
          createdAt: new Date().toISOString(),
        }

        set((state) => {
          state.rigs[id] = rig
          state.activeRigId = id
          state.currentPose = emptyPose
          state.isRigMode = true
        })

        // Upgrade to alpha-aware mesh in background (skips transparent regions)
        get().regenerateAlphaMesh(id, gridSpacing)

        return id
      },

      createSvgRig: (svgDataUrl: string) => {
        const id = generateId()
        const svgXml = decodeSvgDataUrl(svgDataUrl)
        const { svgSource, elements, svgWidth, svgHeight } = parseSvgElements(svgXml)

        // Use fallback dimensions if SVG has none
        const w = svgWidth || 512
        const h = svgHeight || 512

        // Build minimal mesh (not used for SVG rigs but satisfies the type)
        const mesh = generateGridMesh(w, h, 128)
        const emptyPose: BonePose = {}

        // Build element bindings with zero weights (user assigns bones first)
        const svgElementSkinning: SVGElementSkinning = elements.map((el) => ({
          elementId: el.elementId,
          tagName: el.tagName,
          label: el.label,
          weights: [],
          pivotX: el.centerX,
          pivotY: el.centerY,
        }))

        const rig: RigData = {
          id,
          sourceImageUrl: svgDataUrl,
          imageWidth: w,
          imageHeight: h,
          skeleton: { joints: [], rootJointId: '' },
          mesh,
          skinning: mesh.vertices.map(() => []),
          meshGridSpacing: 128,
          restPose: emptyPose,
          createdAt: new Date().toISOString(),
          svgSource,
          svgElementSkinning,
        }

        set((state) => {
          state.rigs[id] = rig
          state.activeRigId = id
          state.currentPose = emptyPose
          state.isRigMode = true
        })
        return id
      },

      deleteRig: (rigId) =>
        set((state) => {
          delete state.rigs[rigId]
          if (state.activeRigId === rigId) {
            state.activeRigId = null
            state.currentPose = null
            state.selectedJointId = null
          }
          state.poseTracks = state.poseTracks.filter((t) => {
            // Only keep tracks whose characterId maps to a rig that still exists
            return t.characterId in state.rigs
          })
        }),

      setAutoRigResult: (rigId, skeleton) => {
        console.log(
          '[RigStore] setAutoRigResult',
          rigId,
          'joints:',
          skeleton.joints.length,
          'root:',
          skeleton.rootJointId,
        )
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig) {
            console.warn('[RigStore] setAutoRigResult: rig not found', rigId)
            return
          }
          rig.skeleton = skeleton
          rig.restPose = buildRestPose(skeleton)
          // Recompute skinning weights with new skeleton (basic — no alpha barrier yet)
          const skinning = computeSkinningWeights(rig.mesh, skeleton)
          rig.skinning = skinning
          state.currentPose = buildRestPose(skeleton)

          // Also auto-compute SVG element weights if this is an SVG rig
          if (rig.svgElementSkinning && rig.svgElementSkinning.length > 0) {
            const elements = rig.svgElementSkinning.map((b) => ({
              elementId: b.elementId,
              tagName: b.tagName,
              label: b.label,
              centerX: b.pivotX,
              centerY: b.pivotY,
            }))
            rig.svgElementSkinning = computeElementSkinningWeights(elements, skeleton, rig.imageWidth, rig.imageHeight)
          }
        })
        // Kick off alpha-aware mesh + skinning upgrade in background
        get().regenerateAlphaMesh(rigId)
      },

      updateJointPosition: (rigId, jointId, x, y) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig) return
          const joint = rig.skeleton.joints.find((j) => j.id === jointId)
          if (!joint) return
          joint.restPosition = { x, y }
          // Rebuild rest pose & recompute skinning
          rig.restPose = buildRestPose(rig.skeleton)
          rig.skinning = computeSkinningWeights(rig.mesh, rig.skeleton)
          recomputeSvgWeightsIfNeeded(rig)
          state.currentPose = buildRestPose(rig.skeleton)
        }),

      addJoint: (rigId, joint) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig) return
          rig.skeleton.joints.push(joint)
          if (rig.skeleton.joints.length === 1) {
            rig.skeleton.rootJointId = joint.id
          }
          rig.restPose = buildRestPose(rig.skeleton)
          rig.skinning = computeSkinningWeights(rig.mesh, rig.skeleton)
          recomputeSvgWeightsIfNeeded(rig)
          state.currentPose = buildRestPose(rig.skeleton)
        }),

      removeJoint: (rigId, jointId) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig) return
          // Reparent children to the removed joint's parent
          const removed = rig.skeleton.joints.find((j) => j.id === jointId)
          if (!removed) return
          for (const j of rig.skeleton.joints) {
            if (j.parentId === jointId) {
              j.parentId = removed.parentId
            }
          }
          rig.skeleton.joints = rig.skeleton.joints.filter((j) => j.id !== jointId)
          if (rig.skeleton.rootJointId === jointId) {
            rig.skeleton.rootJointId = rig.skeleton.joints[0]?.id || ''
          }
          rig.restPose = buildRestPose(rig.skeleton)
          rig.skinning = computeSkinningWeights(rig.mesh, rig.skeleton)
          recomputeSvgWeightsIfNeeded(rig)
          state.currentPose = buildRestPose(rig.skeleton)
          if (state.selectedJointId === jointId) state.selectedJointId = null
        }),

      setParent: (rigId, jointId, parentId) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig) return
          const joint = rig.skeleton.joints.find((j) => j.id === jointId)
          if (!joint) return
          joint.parentId = parentId
          // Recompute skinning — hierarchy changes affect weight distribution
          if (rig.skeleton.joints.length > 0) {
            rig.restPose = buildRestPose(rig.skeleton)
            rig.skinning = computeSkinningWeights(rig.mesh, rig.skeleton)
            recomputeSvgWeightsIfNeeded(rig)
          }
        }),

      regenerateMesh: (rigId, gridSpacing) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig) return
          const spacing = gridSpacing ?? rig.meshGridSpacing
          rig.mesh = generateGridMesh(rig.imageWidth, rig.imageHeight, spacing)
          rig.meshGridSpacing = spacing
          if (rig.skeleton.joints.length > 0) {
            rig.skinning = computeSkinningWeights(rig.mesh, rig.skeleton)
          }
        }),

      regenerateAlphaMesh: async (rigId, gridSpacing) => {
        const rig = get().rigs[rigId]
        if (!rig?.sourceImageUrl) return
        // Skip for SVG rigs (they use element binding, not pixel mesh)
        if (rig.svgSource) return

        const spacing = gridSpacing ?? rig.meshGridSpacing
        const imageData = await loadImageData(rig.sourceImageUrl)
        if (!imageData) {
          console.warn('[RigStore] Could not load image data for alpha mesh, keeping grid mesh')
          return
        }

        const alphaMesh = generateAlphaAwareMesh(imageData, spacing)
        console.log(
          `[RigStore] Alpha-aware mesh: ${alphaMesh.triangles.length} triangles (was ${rig.mesh.triangles.length} with full grid)`,
        )

        set((state) => {
          const r = state.rigs[rigId]
          if (!r) return
          r.mesh = alphaMesh
          r.meshGridSpacing = spacing
          if (r.skeleton.joints.length > 0) {
            // Pass imageData for alpha-barrier skinning — prevents bones from
            // influencing vertices across transparent gaps between body parts
            r.skinning = computeSkinningWeights(r.mesh, r.skeleton, undefined, imageData)
          }
        })
      },

      recomputeSkinning: (rigId, influenceRadius) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig || rig.skeleton.joints.length === 0) return
          rig.skinning = computeSkinningWeights(rig.mesh, rig.skeleton, influenceRadius)
        }),

      // SVG element weight methods
      setSvgElementWeights: (rigId, elementId, weights) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig?.svgElementSkinning) return
          const binding = rig.svgElementSkinning.find((b) => b.elementId === elementId)
          if (binding) binding.weights = weights
        }),

      autoComputeSvgWeights: (rigId) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig?.svgElementSkinning || rig.skeleton.joints.length === 0) return
          const elements = rig.svgElementSkinning.map((b) => ({
            elementId: b.elementId,
            tagName: b.tagName,
            label: b.label,
            centerX: b.pivotX,
            centerY: b.pivotY,
          }))
          rig.svgElementSkinning = computeElementSkinningWeights(
            elements,
            rig.skeleton,
            rig.imageWidth,
            rig.imageHeight,
          )
        }),

      selectSvgElement: (id) =>
        set((state) => {
          state.selectedSvgElementId = id
        }),

      updateSvgElementPivots: (rigId, updatedSkinning) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig) return
          rig.svgElementSkinning = updatedSkinning
        }),

      setJointPose: (jointId, poseUpdate) =>
        set((state) => {
          if (!state.currentPose) return
          const current = state.currentPose[jointId] || { dx: 0, dy: 0, rotation: 0 }
          state.currentPose[jointId] = { ...current, ...poseUpdate }
        }),

      setCurrentPose: (pose) =>
        set((state) => {
          state.currentPose = pose
        }),

      resetPose: () =>
        set((state) => {
          if (!state.activeRigId) return
          const rig = state.rigs[state.activeRigId]
          if (!rig) return
          state.currentPose = buildRestPose(rig.skeleton)
        }),

      addPoseKeyframe: (characterId, frame, pose) =>
        set((state) => {
          let track = state.poseTracks.find((t) => t.characterId === characterId)
          if (!track) {
            track = { id: generateId(), characterId, keyframes: [] }
            state.poseTracks.push(track)
          }
          // Remove existing keyframe at same frame
          track.keyframes = track.keyframes.filter((kf) => kf.frame !== frame)
          track.keyframes.push({
            id: generateId(),
            frame,
            pose: JSON.parse(JSON.stringify(pose)),
            easing: 'ease-in-out',
          })
          track.keyframes.sort((a, b) => a.frame - b.frame)
        }),

      selectPoseTrack: (trackId) =>
        set((state) => {
          state.activePoseTrackId = trackId
        }),

      selectCharacterPoseTrack: (characterId, trackId) =>
        set((state) => {
          state.characterPoseTrackIds[characterId] = trackId
        }),

      selectAnimation: (id) =>
        set((state) => {
          state.activeAnimationId = id
        }),

      renameAnimation: (rigId, animIndex, newName) =>
        set((state) => {
          const rig = state.rigs[rigId]
          if (!rig?.boneriggingSerializedData) return
          try {
            const parsed = JSON.parse(rig.boneriggingSerializedData)
            const animations = parsed.animations ?? []
            if (animIndex < 0 || animIndex >= animations.length) return
            animations[animIndex].name = newName
            rig.boneriggingSerializedData = JSON.stringify(parsed)
          } catch {
            /* ignore parse errors */
          }
        }),

      removeAnimation: (rigId, animIndex, trackId) =>
        set((state) => {
          // Remove from serialized data
          const rig = state.rigs[rigId]
          if (rig?.boneriggingSerializedData) {
            try {
              const parsed = JSON.parse(rig.boneriggingSerializedData)
              const animations = parsed.animations ?? []
              if (animIndex >= 0 && animIndex < animations.length) {
                animations.splice(animIndex, 1)
                rig.boneriggingSerializedData = JSON.stringify(parsed)
              }
            } catch {
              /* ignore */
            }
          }
          // Remove matching pose track
          state.poseTracks = state.poseTracks.filter((t) => t.id !== trackId)
          // Clear selection if it was the deleted track
          if (state.activePoseTrackId === trackId) {
            state.activePoseTrackId = null
          }
          for (const [charId, tid] of Object.entries(state.characterPoseTrackIds)) {
            if (tid === trackId) delete state.characterPoseTrackIds[charId]
          }
        }),

      removePoseKeyframe: (trackId, keyframeId) =>
        set((state) => {
          const track = state.poseTracks.find((t) => t.id === trackId)
          if (!track) return
          track.keyframes = track.keyframes.filter((kf) => kf.id !== keyframeId)
        }),

      getInterpolatedPoseAtFrame: (characterId, frame) => {
        const state = get()
        // If a specific track is selected, use it
        let track = state.activePoseTrackId
          ? state.poseTracks.find((t) => t.id === state.activePoseTrackId && t.characterId === characterId)
          : undefined
        // Fallback to first track for this character
        if (!track) {
          track = state.poseTracks.find((t) => t.characterId === characterId)
        }
        if (!track) return null
        return getPoseAtFrame(track.keyframes, frame)
      },

      selectJoint: (id) =>
        set((state) => {
          state.selectedJointId = id
        }),

      selectRig: (id) =>
        set((state) => {
          state.activeRigId = id
          if (id) {
            const rig = state.rigs[id]
            if (rig) {
              state.currentPose = buildRestPose(rig.skeleton)
            }
          } else {
            state.currentPose = null
          }
        }),

      toggleRigMode: () =>
        set((state) => {
          state.isRigMode = !state.isRigMode
        }),

      setRigMode: (on) =>
        set((state) => {
          state.isRigMode = on
        }),

      setAutoRigging: (value) =>
        set((state) => {
          state.isAutoRigging = value
        }),

      setAutoRigProgress: (msg) =>
        set((state) => {
          state.autoRigProgress = msg
        }),

      setAutoRigError: (err) =>
        set((state) => {
          state.autoRigError = err
        }),

      loadFromProject: (data) =>
        set((state) => {
          state.rigs = data.rigs
          state.poseTracks = data.poseTracks
          state.activePoseTrackId = null
          state.activeAnimationId = null
          const firstRigId = Object.keys(data.rigs)[0] || null
          state.activeRigId = firstRigId
          if (firstRigId) {
            state.currentPose = buildRestPose(data.rigs[firstRigId].skeleton)
          }
        }),

      clearAll: () =>
        set((state) => {
          state.rigs = {}
          state.activeRigId = null
          state.selectedJointId = null
          state.selectedSvgElementId = null
          state.currentPose = null
          state.poseTracks = []
          state.activePoseTrackId = null
          state.activeAnimationId = null
          state.isAutoRigging = false
          state.autoRigProgress = null
          state.autoRigError = null
        }),
    })),
    {
      name: 'proanimate-rigs',
      partialize: (state) => ({
        // Strip large fields to stay within localStorage ~5MB quota.
        // boneriggingSerializedData is in IndexedDB (rigCache).
        // mesh + skinning are regenerated on hydration from imageWidth/Height.
        rigs: Object.fromEntries(
          Object.entries(state.rigs).map(([id, rig]) => {
            const { boneriggingSerializedData: _, mesh: _m, skinning: _s, ...rest } = rig
            // Keep empty placeholders so the type stays valid
            return [
              id,
              {
                ...rest,
                mesh: {
                  vertices: [],
                  triangles: [],
                  imageWidth: rig.imageWidth,
                  imageHeight: rig.imageHeight,
                  gridSpacing: rig.meshGridSpacing || 48,
                },
                skinning: [],
              },
            ]
          }),
        ),
        activeRigId: state.activeRigId,
        poseTracks: state.poseTracks,
        characterPoseTrackIds: state.characterPoseTrackIds,
      }),
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name)
          return raw ? JSON.parse(raw) : null
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch (e) {
            console.warn('[RigStore] localStorage quota exceeded, skipping persist', e)
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        for (const id of Object.keys(state.rigs)) {
          const rig = state.rigs[id]
          const joints = rig.skeleton?.joints?.length ?? 0
          const meshVerts = rig.mesh?.vertices?.length ?? 0

          // Regenerate grid mesh if lost (alpha mesh was empty when saved)
          if (meshVerts === 0 && rig.imageWidth > 0 && rig.imageHeight > 0) {
            const spacing = rig.meshGridSpacing || 48
            console.warn(`[RigStore] rig ${id}: mesh empty — regenerating (${rig.imageWidth}x${rig.imageHeight})`)
            rig.mesh = generateGridMesh(rig.imageWidth, rig.imageHeight, spacing)
            if (joints > 0) {
              rig.skinning = computeSkinningWeights(rig.mesh, rig.skeleton)
            }
          }
        }
      },
    },
  ),
)
