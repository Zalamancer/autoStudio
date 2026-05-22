/**
 * Multi-clip animation blending for 3D characters.
 * Manages multiple AnimationActions with weighted crossfade.
 *
 * Usage: create a BlendController per character, feed it clip references
 * and weights from use3DRigStore, and call update() each frame before
 * manual pose offsets are applied.
 */
import * as THREE from 'three'

export interface BlendedClip {
  clipId: string
  action: THREE.AnimationAction
  weight: number
}

export class AnimationBlendController {
  private mixer: THREE.AnimationMixer
  private clips: Map<string, BlendedClip> = new Map()
  private crossfadeTimer: { from: string; to: string; elapsed: number; duration: number } | null = null

  constructor(mixer: THREE.AnimationMixer) {
    this.mixer = mixer
  }

  /** Add or update a clip with a target weight */
  setClip(clipId: string, clip: THREE.AnimationClip, root: THREE.Object3D, weight: number, loop = true) {
    let entry = this.clips.get(clipId)
    if (!entry) {
      const action = this.mixer.clipAction(clip, root)
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
      if (!loop) action.clampWhenFinished = true
      action.play()
      entry = { clipId, action, weight }
      this.clips.set(clipId, entry)
    }
    entry.weight = weight
    entry.action.setEffectiveWeight(weight)
  }

  /** Remove a clip */
  removeClip(clipId: string) {
    const entry = this.clips.get(clipId)
    if (entry) {
      entry.action.stop()
      this.clips.delete(clipId)
    }
  }

  /** Set weight for a specific clip */
  setWeight(clipId: string, weight: number) {
    const entry = this.clips.get(clipId)
    if (entry) {
      entry.weight = weight
      entry.action.setEffectiveWeight(weight)
    }
  }

  /** Start a crossfade from one clip to another over `duration` seconds */
  crossFadeTo(fromClipId: string, toClipId: string, duration: number) {
    const fromEntry = this.clips.get(fromClipId)
    const toEntry = this.clips.get(toClipId)
    if (!fromEntry || !toEntry) return

    this.crossfadeTimer = {
      from: fromClipId,
      to: toClipId,
      elapsed: 0,
      duration: Math.max(0.001, duration),
    }

    // Ensure the target clip is playing from the start
    toEntry.action.reset()
    toEntry.action.play()
    toEntry.action.setEffectiveWeight(0)
  }

  /** Enable additive blending for a clip */
  setAdditive(clipId: string, additive: boolean) {
    const entry = this.clips.get(clipId)
    if (entry) {
      entry.action.blendMode = additive
        ? THREE.AdditiveAnimationBlendMode
        : THREE.NormalAnimationBlendMode
    }
  }

  /** Call each frame to advance crossfade timers */
  update(delta: number) {
    this.mixer.update(delta)

    if (this.crossfadeTimer) {
      const cf = this.crossfadeTimer
      cf.elapsed += delta
      const t = Math.min(cf.elapsed / cf.duration, 1)

      const fromEntry = this.clips.get(cf.from)
      const toEntry = this.clips.get(cf.to)

      if (fromEntry && toEntry) {
        fromEntry.action.setEffectiveWeight(1 - t)
        toEntry.action.setEffectiveWeight(t)

        fromEntry.weight = 1 - t
        toEntry.weight = t
      }

      if (t >= 1) {
        // Crossfade complete — stop the source clip
        if (fromEntry) {
          fromEntry.action.stop()
          this.clips.delete(cf.from)
        }
        this.crossfadeTimer = null
      }
    }
  }

  /** Stop all clips and reset */
  dispose() {
    for (const [, entry] of this.clips) {
      entry.action.stop()
    }
    this.clips.clear()
    this.crossfadeTimer = null
    this.mixer.stopAllAction()
  }

  /** Get all currently active clips */
  getActiveClips(): BlendedClip[] {
    return Array.from(this.clips.values())
  }
}
