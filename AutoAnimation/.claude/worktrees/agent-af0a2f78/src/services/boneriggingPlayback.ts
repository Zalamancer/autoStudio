/**
 * BoneRiggingPlaybackEngine — Full-fidelity playback of bonerigging-authored
 * animations using @bonerigging/core's DeformationEngine.
 *
 * This preserves Squash & Stretch, spring physics, and other advanced
 * deformation features that AutoStudio's simple LBS pipeline doesn't support.
 *
 * Usage:
 *   const engine = new BoneRiggingPlaybackEngine(serializedData)
 *   // Per frame:
 *   const positions = engine.getDeformedMeshAtTime(0, currentTime)
 */

import {
  BoneRiggingConverter,
  DeformationEngine,
  AnimationManager,
  V2,
  type SerializedRigData,
  type Skeleton,
  type BoneWeight,
  type MeshData,
  type Vec2,
  type Animation,
} from '@bonerigging/core'

export class BoneRiggingPlaybackEngine {
  private skeleton: Skeleton
  private weights: BoneWeight[][]
  private mesh: MeshData | null
  private animations: Animation[]
  private squashStretchEnabled: boolean
  private animationManager: AnimationManager
  private deformedPositions: Vec2[] = []
  private blendSourcePositions: Vec2[] = []

  constructor(serializedData: SerializedRigData) {
    const deserialized = BoneRiggingConverter.deserialize(serializedData)
    this.skeleton = deserialized.skeleton
    this.weights = deserialized.weights
    this.mesh = deserialized.mesh
    this.animations = deserialized.animations
    this.squashStretchEnabled = serializedData.squashStretchEnabled ?? false
    this.animationManager = new AnimationManager()
    this.animationManager.loadAnimations(deserialized.animations)

    // Pre-allocate deformed positions array and blend buffer
    if (this.mesh) {
      this.deformedPositions = this.mesh.vertices.map((v) =>
        V2(v.point.x, v.point.y)
      )
      this.blendSourcePositions = this.mesh.vertices.map((v) =>
        V2(v.point.x, v.point.y)
      )
    }
  }

  /** Number of animations available */
  get animationCount(): number {
    return this.animations.length
  }

  /** Get the bonerigging mesh data (vertices, triangles, UVs) for rendering */
  getMeshData(): MeshData | null {
    return this.mesh
  }

  /** Get rest vertex positions (undeformed) */
  getRestPositions(): Vec2[] {
    if (!this.mesh) return []
    return this.mesh.vertices.map((v) => V2(v.point.x, v.point.y))
  }

  /** Get animation info by index */
  getAnimationInfo(index: number): { name: string; duration: number; fps: number } | null {
    const anim = this.animations[index]
    if (!anim) return null
    return { name: anim.name, duration: anim.duration, fps: anim.fps }
  }

  /**
   * Returns deformed vertex positions for a given animation at a given time.
   * The returned array has the same length as the mesh vertices.
   */
  getDeformedMeshAtTime(animIndex: number, time: number): Vec2[] {
    const anim = this.animations[animIndex]
    if (!anim || !this.mesh) return this.deformedPositions

    const pose = this.animationManager.getInterpolatedPose(anim, time)
    if (!pose) return this.deformedPositions

    // Reset skeleton to rest pose
    for (const j of Object.values(this.skeleton.joints)) {
      j.current = V2(j.rest.x, j.rest.y)
    }

    // Apply interpolated pose deltas
    for (const [jointName, delta] of Object.entries(pose.deltas)) {
      const j = this.skeleton.joints[jointName]
      if (j) {
        j.current = V2(j.rest.x + delta.x, j.rest.y + delta.y)
      }
    }

    // Compute bone data with full feature set (includes S&S)
    const boneData = DeformationEngine.computeBoneData(
      this.skeleton,
      this.squashStretchEnabled
    )

    // Deform mesh vertices in-place
    DeformationEngine.deformInPlace(
      this.mesh.vertices,
      this.weights,
      boneData,
      this.deformedPositions,
      this.squashStretchEnabled
    )

    return this.deformedPositions
  }

  /**
   * Returns blended vertex positions between two animations for smooth crossfade.
   * blend=0 → full animA, blend=1 → full animB.
   */
  getBlendedMeshAtTime(
    animA: number, timeA: number,
    animB: number, timeB: number,
    blend: number,
  ): Vec2[] {
    if (blend <= 0) return this.getDeformedMeshAtTime(animA, timeA)
    if (blend >= 1) return this.getDeformedMeshAtTime(animB, timeB)

    // Get positions for animation A
    const posA = this.getDeformedMeshAtTime(animA, timeA)
    // Copy A positions to blend buffer (getDeformedMeshAtTime reuses this.deformedPositions)
    for (let i = 0; i < posA.length; i++) {
      this.blendSourcePositions[i] = V2(posA[i].x, posA[i].y)
    }
    // Get positions for animation B (overwrites this.deformedPositions)
    const posB = this.getDeformedMeshAtTime(animB, timeB)
    // Lerp in-place
    for (let i = 0; i < posB.length; i++) {
      this.deformedPositions[i] = V2(
        this.blendSourcePositions[i].x + (posB[i].x - this.blendSourcePositions[i].x) * blend,
        this.blendSourcePositions[i].y + (posB[i].y - this.blendSourcePositions[i].y) * blend,
      )
    }
    return this.deformedPositions
  }

  /**
   * Apply a static pose (by name) and return deformed positions.
   * Useful for thumbnail generation.
   */
  getDeformedMeshForPose(poseDeltas: Record<string, { x: number; y: number }>): Vec2[] {
    if (!this.mesh) return this.deformedPositions

    // Reset to rest
    for (const j of Object.values(this.skeleton.joints)) {
      j.current = V2(j.rest.x, j.rest.y)
    }

    // Apply pose
    for (const [jointName, delta] of Object.entries(poseDeltas)) {
      const j = this.skeleton.joints[jointName]
      if (j) {
        j.current = V2(j.rest.x + delta.x, j.rest.y + delta.y)
      }
    }

    const boneData = DeformationEngine.computeBoneData(
      this.skeleton,
      this.squashStretchEnabled
    )

    DeformationEngine.deformInPlace(
      this.mesh.vertices,
      this.weights,
      boneData,
      this.deformedPositions,
      this.squashStretchEnabled
    )

    return this.deformedPositions
  }
}
