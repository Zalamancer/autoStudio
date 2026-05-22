/**
 * Physics-driven secondary motion for bone chains (hair, tails, accessories).
 * Verlet-style spring simulation using Three.js Vector3/Quaternion math.
 *
 * Usage: create a SpringBoneChain3D per chain, call simulate() each frame
 * after pose offsets are applied but before GPU skinning.
 */
import * as THREE from 'three'
import type { Vec3 } from '@/types/rig3d'

export interface SpringChain3DConfig {
  rootBoneName: string
  boneNames: string[]
  stiffness: number    // 0-1, how quickly bones return to rest
  damping: number      // 0-1, velocity decay per frame
  gravity: Vec3        // world-space gravity vector
}

interface SpringParticle {
  boneName: string
  currentPos: THREE.Vector3
  previousPos: THREE.Vector3
  restLocalPos: THREE.Vector3
  bone: THREE.Bone | null
}

// Pre-allocated temp objects
const _worldPos = new THREE.Vector3()
const _parentWorld = new THREE.Vector3()
const _targetLocal = new THREE.Vector3()
const _restWorld = new THREE.Vector3()
const _force = new THREE.Vector3()
const _velocity = new THREE.Vector3()
const _parentWorldQuat = new THREE.Quaternion()
const _parentWorldQuatInv = new THREE.Quaternion()

export class SpringBoneChain3D {
  private config: SpringChain3DConfig
  private particles: SpringParticle[] = []
  private initialized = false

  constructor(config: SpringChain3DConfig) {
    this.config = config
  }

  /** Initialize particles from skeleton bones. Call once after skeleton is loaded. */
  init(skeleton: THREE.Skeleton) {
    this.particles = []

    for (const boneName of this.config.boneNames) {
      const bone = skeleton.bones.find((b) => b.name === boneName) || null
      const restLocal = bone ? bone.position.clone() : new THREE.Vector3()
      const worldPos = bone ? bone.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3()

      this.particles.push({
        boneName,
        currentPos: worldPos.clone(),
        previousPos: worldPos.clone(),
        restLocalPos: restLocal,
        bone,
      })
    }

    this.initialized = true
  }

  /**
   * Run one simulation step. Call after mixer.update() and manual pose offsets,
   * but before the frame is rendered.
   */
  simulate(delta: number) {
    if (!this.initialized || this.particles.length === 0) return

    const dt = Math.min(delta, 1 / 30) // Cap to avoid instability
    const { stiffness, damping, gravity } = this.config

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (!p.bone) continue

      // Get the parent's world transform
      const parent = p.bone.parent as THREE.Bone | null
      if (parent) {
        parent.getWorldPosition(_parentWorld)
        parent.getWorldQuaternion(_parentWorldQuat)
      } else {
        _parentWorld.set(0, 0, 0)
        _parentWorldQuat.identity()
      }

      // Calculate where this bone SHOULD be (rest position in world space)
      _restWorld.copy(p.restLocalPos)
      _restWorld.applyQuaternion(_parentWorldQuat)
      _restWorld.add(_parentWorld)

      // Verlet integration: velocity = current - previous
      _velocity.subVectors(p.currentPos, p.previousPos)
      _velocity.multiplyScalar(1 - damping)

      // Spring force toward rest position
      _force.subVectors(_restWorld, p.currentPos)
      _force.multiplyScalar(stiffness)

      // Gravity
      _force.x += gravity.x * dt
      _force.y += gravity.y * dt
      _force.z += gravity.z * dt

      // Update position
      p.previousPos.copy(p.currentPos)
      p.currentPos.add(_velocity).add(_force.multiplyScalar(dt * dt))

      // Convert world position back to local space and apply to bone
      _parentWorldQuatInv.copy(_parentWorldQuat).invert()
      _targetLocal.copy(p.currentPos).sub(_parentWorld).applyQuaternion(_parentWorldQuatInv)
      p.bone.position.copy(_targetLocal)
    }
  }

  /** Reset all particles to their rest positions */
  reset() {
    for (const p of this.particles) {
      if (!p.bone) continue
      const worldPos = p.bone.getWorldPosition(_worldPos)
      p.currentPos.copy(worldPos)
      p.previousPos.copy(worldPos)
    }
  }

  /** Update config without re-creating the chain */
  updateConfig(config: Partial<SpringChain3DConfig>) {
    Object.assign(this.config, config)
  }
}
