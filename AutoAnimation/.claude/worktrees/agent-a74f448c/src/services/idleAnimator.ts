/**
 * CharacterIdleAnimator — Procedural idle animations for 2D sprite characters.
 *
 * Adds breathing, head sway, hair physics, blink, and speech gestures
 * using sine-wave oscillators on per-part transforms. No new art assets needed.
 *
 * Shared between live preview (CharacterLayer.tsx) and export (RemotionCharacter.tsx).
 */

export interface IdleDeltas {
  body: { scaleY: number; y: number }
  head: { rotation: number }
  hair: { rotation: number }
  /** 0 = normal, 1 = fully closed (blink) */
  blinkFactor: number
  /** Speech gesture: pop-up offset in px */
  gestureY: number
  /** Speech gesture: head tilt in degrees */
  gestureTilt: number
}

interface GestureEvent {
  /** Frame the gesture was triggered */
  frame: number
  /** 'pop' = emphasis pop, 'tilt' = question tilt */
  type: 'pop' | 'tilt'
}

const ZERO_DELTAS: IdleDeltas = {
  body: { scaleY: 0, y: 0 },
  head: { rotation: 0 },
  hair: { rotation: 0 },
  blinkFactor: 0,
  gestureY: 0,
  gestureTilt: 0,
}

export class CharacterIdleAnimator {
  /** Intensity multiplier 0-1 (user-adjustable) */
  intensity: number
  /** FPS for consistent timing */
  private fps: number
  /** Random offset so characters don't breathe in sync */
  private phaseOffset: number
  /** Next blink frame (randomized 3-5s intervals) */
  private nextBlinkFrame: number
  /** Whether currently in a blink */
  private blinkStartFrame: number
  /** Blink duration in frames */
  private blinkDuration: number
  /** Queue of active speech gesture events */
  private gestureQueue: GestureEvent[]

  constructor(fps = 30, intensity = 1) {
    this.fps = fps
    this.intensity = intensity
    this.phaseOffset = Math.random() * Math.PI * 2
    this.nextBlinkFrame = this.randomBlinkInterval()
    this.blinkStartFrame = -1
    this.blinkDuration = Math.round(fps * 0.15) // 150ms
    this.gestureQueue = []
  }

  private randomBlinkInterval(): number {
    // 3-5 seconds between blinks
    return Math.round((3 + Math.random() * 2) * this.fps)
  }

  /**
   * Trigger a speech gesture at the given frame.
   * Call this when emphasis words (caps, !, emotion changes) are detected.
   */
  triggerGesture(frame: number, type: 'pop' | 'tilt'): void {
    this.gestureQueue.push({ frame, type })
    // Prune old gestures (keep last 1s worth)
    const cutoff = frame - this.fps
    this.gestureQueue = this.gestureQueue.filter((g) => g.frame > cutoff)
  }

  /**
   * Compute idle animation deltas for a given frame.
   * Returns additive offsets to apply on top of the character's base transforms.
   */
  computeFrame(frame: number): IdleDeltas {
    if (this.intensity <= 0) return ZERO_DELTAS

    const t = frame / this.fps + this.phaseOffset
    const i = this.intensity

    // --- Breathing ---
    const breathScaleY = Math.sin(t * 2.5) * 0.008 * i
    const breathY = Math.sin(t * 2.5) * 1.5 * i

    // --- Head sway ---
    const headRotation = Math.sin(t * 0.7) * 1.2 * i

    // --- Hair physics ---
    const hairRotation = Math.sin(t * 0.5 + 0.3) * 0.8 * i

    // --- Blink ---
    let blinkFactor = 0
    if (frame >= this.nextBlinkFrame && this.blinkStartFrame < 0) {
      this.blinkStartFrame = frame
      this.nextBlinkFrame = frame + this.randomBlinkInterval()
    }
    if (this.blinkStartFrame >= 0) {
      const blinkProgress = (frame - this.blinkStartFrame) / this.blinkDuration
      if (blinkProgress <= 1) {
        // Triangle wave: 0 → 1 → 0 over blinkDuration
        blinkFactor = blinkProgress <= 0.5
          ? blinkProgress * 2
          : (1 - blinkProgress) * 2
      } else {
        this.blinkStartFrame = -1
      }
    }

    // --- Speech gestures ---
    let gestureY = 0
    let gestureTilt = 0
    const gestureDecay = this.fps * 0.2 // 200ms decay
    for (const g of this.gestureQueue) {
      const elapsed = frame - g.frame
      if (elapsed < 0 || elapsed > gestureDecay) continue
      const progress = 1 - elapsed / gestureDecay
      const eased = progress * progress // quadratic ease-out
      if (g.type === 'pop') {
        gestureY = Math.max(gestureY, -3 * eased * i) // pop up (negative Y = up)
      } else {
        gestureTilt = 5 * eased * i // head tilt
      }
    }

    return {
      body: { scaleY: breathScaleY, y: breathY },
      head: { rotation: headRotation },
      hair: { rotation: hairRotation },
      blinkFactor,
      gestureY,
      gestureTilt,
    }
  }

  /**
   * Analyze a word and trigger appropriate gestures.
   * Call per word during dialogue playback.
   */
  analyzeWord(word: string, frame: number): void {
    // Emphasis: ALL CAPS, ending with !, emotion cue changes
    if (word === word.toUpperCase() && word.length > 1 && /[A-Z]/.test(word)) {
      this.triggerGesture(frame, 'pop')
    } else if (word.includes('!')) {
      this.triggerGesture(frame, 'pop')
    } else if (word.includes('?')) {
      this.triggerGesture(frame, 'tilt')
    }
  }
}
