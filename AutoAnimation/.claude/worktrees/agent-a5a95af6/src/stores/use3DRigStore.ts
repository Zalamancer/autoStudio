/**
 * State management for 3D character rigging and bone animation.
 * Mirrors useRigStore.ts patterns but uses quaternions, Vec3, and Three.js skeletal data.
 *
 * Design: manual bone poses are OFFSETS applied on top of AnimationMixer output.
 * The render loop applies: mixer.update() → manual pose offsets → GPU skinning.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type * as THREE from 'three'
import type { BoneMapping } from '@/types/character3d'
import type {
  RigData3D,
  BonePose3D,
  BonePoseTrack3D,
  JointPoseState3D,
  ManipulationMode,
  CoordinateSpace,
  SpringChain3D,
  SquashStretchBone3D,
} from '@/types/rig3d'
import type { BonePropertyTrack, BonePropertyKeyframe } from '@/types/animCurves'
import { buildSkeletonTree, captureRestPose } from '@/services/skeletonTree'
import { getPose3DAtFrame } from '@/services/poseInterpolation3d'

// ─── State Interface ────────────────────────────────────────────────────────

interface Rig3DState {
  // Rig data
  rigs: Record<string, RigData3D>
  activeRigId: string | null

  // Bone selection
  selectedBoneName: string | null
  hoveredBoneName: string | null

  // Editor mode
  manipulationMode: ManipulationMode
  coordinateSpace: CoordinateSpace
  showSkeletonOverlay: boolean
  showBoneNames: boolean
  showWeightPaint: boolean
  weightPaintBoneName: string | null

  // Current pose (live manipulation, before keyframing)
  currentPose: BonePose3D | null

  // ─── Rig CRUD ──────────────────────────────────────────────────────

  /** Create a 3D rig from a loaded Three.js skeleton */
  createRigFromSkeleton: (
    characterId: string,
    skeleton: THREE.Skeleton,
    boneMapping: BoneMapping
  ) => string

  /** Delete a rig */
  deleteRig: (rigId: string) => void

  /** Get the active rig data */
  getActiveRig: () => RigData3D | null

  /** Set active rig by ID */
  setActiveRig: (rigId: string | null) => void

  // ─── Bone Selection ────────────────────────────────────────────────

  selectBone: (name: string | null) => void
  hoverBone: (name: string | null) => void

  // ─── Posing ────────────────────────────────────────────────────────

  /** Update a single bone's pose offset */
  setBonePose: (boneName: string, pose: Partial<JointPoseState3D>) => void

  /** Set the entire current pose (e.g. from interpolation during playback) */
  setCurrentPose: (pose: BonePose3D | null) => void

  /** Reset all bone poses to identity (zero offset) */
  resetPose: () => void

  /** Reset a single bone to identity */
  resetBonePose: (boneName: string) => void

  // ─── Keyframes ─────────────────────────────────────────────────────

  /** Add a pose keyframe at a specific frame for a character */
  addPoseKeyframe: (characterId: string, frame: number, pose: BonePose3D, easing?: string) => void

  /** Remove a pose keyframe */
  removePoseKeyframe: (trackId: string, keyframeId: string) => void

  /** Update a keyframe's easing */
  updateKeyframeEasing: (trackId: string, keyframeId: string, easing: string) => void

  /** Get interpolated pose at a given frame */
  getInterpolatedPoseAtFrame: (characterId: string, frame: number) => BonePose3D | null

  /** Get the pose track for a character (creates one if needed) */
  getOrCreatePoseTrack: (characterId: string) => BonePoseTrack3D

  // ─── Clip Blending ─────────────────────────────────────────────────

  /** Add an active animation clip */
  addActiveClip: (clipId: string, weight?: number) => void

  /** Remove an active animation clip */
  removeActiveClip: (clipId: string) => void

  /** Set blend weight for a clip */
  setClipBlendWeight: (clipId: string, weight: number) => void

  // ─── Spring Chains ─────────────────────────────────────────────────

  /** Add a spring bone chain */
  addSpringChain: (chain: Omit<SpringChain3D, 'id'>) => string

  /** Update a spring chain */
  updateSpringChain: (chainId: string, updates: Partial<SpringChain3D>) => void

  /** Remove a spring chain */
  removeSpringChain: (chainId: string) => void

  // ─── Squash & Stretch ──────────────────────────────────────────────

  /** Set squash & stretch config for a bone */
  setSquashStretchBone: (config: SquashStretchBone3D) => void

  /** Remove squash & stretch for a bone */
  removeSquashStretchBone: (boneName: string) => void

  // ─── Bone Property Tracks (Curve Editor) ──────────────────────────

  /** Add a property keyframe for a bone */
  addBonePropertyKeyframe: (boneName: string, property: string, frame: number, value: number, easing?: string) => void

  /** Remove a property keyframe */
  removeBonePropertyKeyframe: (trackId: string, keyframeId: string) => void

  /** Update a property keyframe value */
  updateBonePropertyKeyframe: (trackId: string, keyframeId: string, updates: Partial<BonePropertyKeyframe>) => void

  /** Get all property tracks for a bone */
  getBonePropertyTracks: (boneName: string) => BonePropertyTrack[]

  // ─── Editor Mode ──────────────────────────────────────────────────

  setManipulationMode: (mode: ManipulationMode) => void
  setCoordinateSpace: (space: CoordinateSpace) => void
  toggleSkeletonOverlay: () => void
  toggleBoneNames: () => void
  setShowWeightPaint: (visible: boolean) => void
  setWeightPaintBoneName: (boneName: string | null) => void

  // ─── Persistence ───────────────────────────────────────────────────

  /** Re-capture rest pose from a live viewport skeleton.
   *  Ensures rest pose bone names match the skeleton the gizmo operates on.
   *  Called when the viewport skeleton is ready (may differ from rig creation skeleton). */
  updateActiveRigRestPose: (skeleton: THREE.Skeleton) => void

  /** Reset all state */
  reset: () => void
}

// ─── Identity pose values (inline to avoid circular import) ─────────────────

const IDENTITY: JointPoseState3D = {
  position: { x: 0, y: 0, z: 0 },
  quaternion: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const use3DRigStore = create<Rig3DState>()(
  immer((set, get) => ({
    rigs: {},
    activeRigId: null,
    selectedBoneName: null,
    hoveredBoneName: null,
    manipulationMode: 'rotate',
    coordinateSpace: 'local',
    showSkeletonOverlay: true,
    showBoneNames: false,
    showWeightPaint: false,
    weightPaintBoneName: null,
    currentPose: null,

    // ─── Rig CRUD ────────────────────────────────────────────────────

    createRigFromSkeleton: (characterId, skeleton, boneMapping) => {
      const skeletonTree = buildSkeletonTree(skeleton, boneMapping)
      const restPose = captureRestPose(skeleton)
      const id = generateId('rig3d')

      set((state) => {
        state.rigs[id] = {
          id,
          characterId,
          skeletonTree,
          restPose,
          poseTracks: [],
          activeClipIds: [],
          clipBlendWeights: {},
          springChains: [],
          squashStretchBones: [],
          bonePropertyTracks: [],
          createdAt: new Date().toISOString(),
        }
        state.activeRigId = id
        state.currentPose = null
        state.selectedBoneName = null
      })

      return id
    },

    deleteRig: (rigId) =>
      set((state) => {
        delete state.rigs[rigId]
        if (state.activeRigId === rigId) {
          state.activeRigId = null
          state.currentPose = null
          state.selectedBoneName = null
        }
      }),

    getActiveRig: () => {
      const { rigs, activeRigId } = get()
      return activeRigId ? rigs[activeRigId] ?? null : null
    },

    setActiveRig: (rigId) =>
      set((state) => {
        state.activeRigId = rigId
        state.currentPose = null
        state.selectedBoneName = null
      }),

    // ─── Bone Selection ──────────────────────────────────────────────

    selectBone: (name) =>
      set((state) => {
        state.selectedBoneName = name
      }),

    hoverBone: (name) =>
      set((state) => {
        state.hoveredBoneName = name
      }),

    // ─── Posing ──────────────────────────────────────────────────────

    setBonePose: (boneName, partialPose) =>
      set((state) => {
        if (!state.currentPose) {
          state.currentPose = {}
        }
        const existing = state.currentPose[boneName] || {
          position: { ...IDENTITY.position },
          quaternion: { ...IDENTITY.quaternion },
          scale: { ...IDENTITY.scale },
        }
        if (partialPose.position) {
          existing.position = { ...existing.position, ...partialPose.position }
        }
        if (partialPose.quaternion) {
          existing.quaternion = { ...existing.quaternion, ...partialPose.quaternion }
        }
        if (partialPose.scale) {
          existing.scale = { ...existing.scale, ...partialPose.scale }
        }
        state.currentPose[boneName] = existing
      }),

    setCurrentPose: (pose) =>
      set((state) => {
        state.currentPose = pose
      }),

    resetPose: () =>
      set((state) => {
        state.currentPose = null
      }),

    resetBonePose: (boneName) =>
      set((state) => {
        if (state.currentPose && state.currentPose[boneName]) {
          delete state.currentPose[boneName]
        }
      }),

    // ─── Keyframes ───────────────────────────────────────────────────

    addPoseKeyframe: (characterId, frame, pose, easing = 'ease-in-out') => {
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return

        let track = rig.poseTracks.find((t) => t.characterId === characterId)
        if (!track) {
          track = {
            id: generateId('track3d'),
            characterId,
            keyframes: [],
          }
          rig.poseTracks.push(track)
        }

        track.keyframes = track.keyframes.filter((kf) => kf.frame !== frame)

        track.keyframes.push({
          id: generateId('kf3d'),
          frame,
          pose: JSON.parse(JSON.stringify(pose)),
          easing: easing as any,
        })

        track.keyframes.sort((a, b) => a.frame - b.frame)
      })
    },

    removePoseKeyframe: (trackId, keyframeId) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        const track = rig.poseTracks.find((t) => t.id === trackId)
        if (!track) return
        track.keyframes = track.keyframes.filter((kf) => kf.id !== keyframeId)
      }),

    updateKeyframeEasing: (trackId, keyframeId, easing) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        const track = rig.poseTracks.find((t) => t.id === trackId)
        if (!track) return
        const kf = track.keyframes.find((k) => k.id === keyframeId)
        if (kf) {
          kf.easing = easing as any
        }
      }),

    getInterpolatedPoseAtFrame: (characterId, frame) => {
      const { rigs, activeRigId } = get()
      const rig = activeRigId ? rigs[activeRigId] : null
      if (!rig) return null

      const track = rig.poseTracks.find((t) => t.characterId === characterId)
      if (!track || track.keyframes.length === 0) return null

      return getPose3DAtFrame(track.keyframes, frame)
    },

    getOrCreatePoseTrack: (characterId) => {
      const { rigs, activeRigId } = get()
      const rig = activeRigId ? rigs[activeRigId] : null
      if (!rig) {
        return { id: '', characterId, keyframes: [] }
      }

      const track = rig.poseTracks.find((t) => t.characterId === characterId)
      if (track) return track

      // Create and persist the new track into state
      const newTrack = { id: generateId('track3d'), characterId, keyframes: [] as any[] }
      set((state) => {
        const r = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (r) {
          r.poseTracks.push(newTrack)
        }
      })
      return newTrack
    },

    // ─── Clip Blending ───────────────────────────────────────────────

    addActiveClip: (clipId, weight = 1) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        if (!rig.activeClipIds.includes(clipId)) {
          rig.activeClipIds.push(clipId)
        }
        rig.clipBlendWeights[clipId] = weight
      }),

    removeActiveClip: (clipId) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        rig.activeClipIds = rig.activeClipIds.filter((id) => id !== clipId)
        delete rig.clipBlendWeights[clipId]
      }),

    setClipBlendWeight: (clipId, weight) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        rig.clipBlendWeights[clipId] = Math.max(0, Math.min(1, weight))
      }),

    // ─── Spring Chains ───────────────────────────────────────────────

    addSpringChain: (chain) => {
      const id = generateId('spring')
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        rig.springChains.push({ id, ...chain })
      })
      return id
    },

    updateSpringChain: (chainId, updates) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        const chain = rig.springChains.find((c) => c.id === chainId)
        if (chain) Object.assign(chain, updates)
      }),

    removeSpringChain: (chainId) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        rig.springChains = rig.springChains.filter((c) => c.id !== chainId)
      }),

    // ─── Squash & Stretch ────────────────────────────────────────────

    setSquashStretchBone: (config) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        const idx = rig.squashStretchBones.findIndex((b) => b.boneName === config.boneName)
        if (idx >= 0) {
          rig.squashStretchBones[idx] = config
        } else {
          rig.squashStretchBones.push(config)
        }
      }),

    removeSquashStretchBone: (boneName) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        rig.squashStretchBones = rig.squashStretchBones.filter((b) => b.boneName !== boneName)
      }),

    // ─── Bone Property Tracks (Curve Editor) ────────────────────────

    addBonePropertyKeyframe: (boneName, property, frame, value, easing = 'ease-in-out') =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return

        let track = rig.bonePropertyTracks.find(
          (t) => t.boneName === boneName && t.property === property
        )
        if (!track) {
          track = {
            id: generateId('bpt'),
            boneName,
            property,
            keyframes: [],
          }
          rig.bonePropertyTracks.push(track)
        }

        // Replace existing keyframe at same frame
        track.keyframes = track.keyframes.filter((kf) => kf.frame !== frame)
        track.keyframes.push({
          id: generateId('bpkf'),
          frame,
          value,
          easing: easing as any,
        })
        track.keyframes.sort((a, b) => a.frame - b.frame)
      }),

    removeBonePropertyKeyframe: (trackId, keyframeId) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        const track = rig.bonePropertyTracks.find((t) => t.id === trackId)
        if (!track) return
        track.keyframes = track.keyframes.filter((kf) => kf.id !== keyframeId)
      }),

    updateBonePropertyKeyframe: (trackId, keyframeId, updates) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return
        const track = rig.bonePropertyTracks.find((t) => t.id === trackId)
        if (!track) return
        const kf = track.keyframes.find((k) => k.id === keyframeId)
        if (kf) Object.assign(kf, updates)
      }),

    getBonePropertyTracks: (boneName) => {
      const { rigs, activeRigId } = get()
      const rig = activeRigId ? rigs[activeRigId] : null
      if (!rig) return []
      return rig.bonePropertyTracks.filter((t) => t.boneName === boneName)
    },

    // ─── Editor Mode ─────────────────────────────────────────────────

    setManipulationMode: (mode) =>
      set((state) => {
        state.manipulationMode = mode
      }),

    setCoordinateSpace: (space) =>
      set((state) => {
        state.coordinateSpace = space
      }),

    toggleSkeletonOverlay: () =>
      set((state) => {
        state.showSkeletonOverlay = !state.showSkeletonOverlay
      }),

    toggleBoneNames: () =>
      set((state) => {
        state.showBoneNames = !state.showBoneNames
      }),

    setShowWeightPaint: (visible) =>
      set((state) => {
        state.showWeightPaint = visible
      }),

    setWeightPaintBoneName: (boneName) =>
      set((state) => {
        state.weightPaintBoneName = boneName
      }),

    // ─── Rest Pose Sync ─────────────────────────────────────────────

    updateActiveRigRestPose: (skeleton) =>
      set((state) => {
        const rig = state.activeRigId ? state.rigs[state.activeRigId] : null
        if (!rig) return

        // Rebuild skeletonTree from the viewport skeleton (fixes stale tree data
        // from rigs created before bug fixes, and ensures parent/child relationships
        // match the actual skeleton in the scene graph)
        const newTree = buildSkeletonTree(skeleton, rig.skeletonTree.boneMapping)
        const oldRootName = rig.skeletonTree.rootBoneName
        if (newTree.rootBoneName !== oldRootName) {
          console.log(`[use3DRigStore] SkeletonTree rebuilt: root changed "${oldRootName}" → "${newTree.rootBoneName}"`)
        }
        rig.skeletonTree = newTree

        const newRestPose: BonePose3D = {}
        for (const bone of skeleton.bones) {
          newRestPose[bone.name] = {
            position: { x: bone.position.x, y: bone.position.y, z: bone.position.z },
            quaternion: { x: bone.quaternion.x, y: bone.quaternion.y, z: bone.quaternion.z, w: bone.quaternion.w },
            scale: { x: bone.scale.x, y: bone.scale.y, z: bone.scale.z },
          }
        }

        const oldKeys = Object.keys(rig.restPose)
        const newKeys = Object.keys(newRestPose)
        if (oldKeys.length !== newKeys.length || oldKeys.some(k => !newRestPose[k])) {
          console.log('[use3DRigStore] Rest pose synced from viewport skeleton.',
            `Old: ${oldKeys.length} bones (${oldKeys.slice(0, 3).join(', ')}…)`,
            `New: ${newKeys.length} bones (${newKeys.slice(0, 3).join(', ')}…)`
          )
        }

        rig.restPose = newRestPose
      }),

    // ─── Persistence ─────────────────────────────────────────────────

    reset: () =>
      set((state) => {
        state.rigs = {}
        state.activeRigId = null
        state.selectedBoneName = null
        state.hoveredBoneName = null
        state.currentPose = null
      }),
  }))
)
