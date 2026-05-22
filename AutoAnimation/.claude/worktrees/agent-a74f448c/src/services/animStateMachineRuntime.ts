/**
 * Per-frame animation state machine evaluator.
 * Checks transition conditions, manages crossfade timers,
 * and outputs the current blend state (which clips at what weights).
 */
import type { AnimStateMachine, AnimState, AnimTransition } from '@/types/animStateMachine'

export interface BlendOutput {
  /** Active state clips with their weights (sums to 1 during crossfade) */
  activeStates: Array<{
    stateId: string
    clipId: string | null
    poseTrackId: string | null
    weight: number
    speed: number
    loop: boolean
  }>
}

interface CrossfadeState {
  fromStateId: string
  toStateId: string
  duration: number
  elapsed: number
  transition: AnimTransition
}

export class AnimStateMachineRuntime {
  private machine: AnimStateMachine
  private crossfade: CrossfadeState | null = null
  private stateElapsed: number = 0

  constructor(machine: AnimStateMachine) {
    this.machine = machine
  }

  /** Update the machine reference (when store state changes) */
  setMachine(machine: AnimStateMachine) {
    this.machine = machine
  }

  /** Set a runtime parameter value */
  setParameter(name: string, value: number | boolean | string) {
    this.machine.parameters[name] = value
  }

  /** Fire a trigger (sets parameter to true, auto-resets after evaluation) */
  fireTrigger(name: string) {
    this.machine.parameters[name] = true
  }

  /**
   * Evaluate one frame. Returns the current blend output.
   * @param delta time in seconds since last frame
   * @param stateDuration duration of current state's animation in seconds (for exit time)
   */
  update(delta: number, stateDuration: number = 1): BlendOutput {
    this.stateElapsed += delta

    // Advance crossfade if active
    if (this.crossfade) {
      this.crossfade.elapsed += delta
      const t = Math.min(this.crossfade.elapsed / this.crossfade.duration, 1)

      const fromState = this.getState(this.crossfade.fromStateId)
      const toState = this.getState(this.crossfade.toStateId)

      if (t >= 1) {
        // Crossfade complete
        this.machine.currentStateId = this.crossfade.toStateId
        this.crossfade = null
        this.stateElapsed = 0

        if (toState) {
          return {
            activeStates: [{
              stateId: toState.id,
              clipId: toState.clipId,
              poseTrackId: toState.poseTrackId,
              weight: 1,
              speed: toState.speed,
              loop: toState.loop,
            }],
          }
        }
      } else if (fromState && toState) {
        return {
          activeStates: [
            {
              stateId: fromState.id,
              clipId: fromState.clipId,
              poseTrackId: fromState.poseTrackId,
              weight: 1 - t,
              speed: fromState.speed,
              loop: fromState.loop,
            },
            {
              stateId: toState.id,
              clipId: toState.clipId,
              poseTrackId: toState.poseTrackId,
              weight: t,
              speed: toState.speed,
              loop: toState.loop,
            },
          ],
        }
      }
    }

    // Check transitions from current state
    if (!this.crossfade) {
      const transitions = this.machine.transitions.filter(
        (t) => t.fromStateId === this.machine.currentStateId
      )

      for (const transition of transitions) {
        // Check exit time condition
        if (transition.hasExitTime) {
          const normalizedTime = stateDuration > 0 ? this.stateElapsed / stateDuration : 1
          if (normalizedTime < transition.exitTime) continue
        }

        // Evaluate condition
        if (transition.condition && !this.evaluateCondition(transition.condition)) {
          continue
        }

        // Trigger transition
        this.crossfade = {
          fromStateId: this.machine.currentStateId,
          toStateId: transition.toStateId,
          duration: Math.max(0.001, transition.duration),
          elapsed: 0,
          transition,
        }
        break
      }
    }

    // Reset trigger parameters after evaluation
    for (const [key, value] of Object.entries(this.machine.parameters)) {
      if (typeof value === 'boolean' && value === true) {
        // Check if this was used as a trigger (starts with 'trigger:')
        if (key.startsWith('trigger:')) {
          this.machine.parameters[key] = false
        }
      }
    }

    // Return current state
    const currentState = this.getState(this.machine.currentStateId)
    if (currentState) {
      return {
        activeStates: [{
          stateId: currentState.id,
          clipId: currentState.clipId,
          poseTrackId: currentState.poseTrackId,
          weight: 1,
          speed: currentState.speed,
          loop: currentState.loop,
        }],
      }
    }

    return { activeStates: [] }
  }

  /** Force transition to a specific state */
  forceTransition(toStateId: string, duration: number = 0.3) {
    this.crossfade = {
      fromStateId: this.machine.currentStateId,
      toStateId,
      duration: Math.max(0.001, duration),
      elapsed: 0,
      transition: {
        id: 'forced',
        fromStateId: this.machine.currentStateId,
        toStateId,
        duration,
        condition: '',
        hasExitTime: false,
        exitTime: 0,
      },
    }
  }

  /** Get the current state ID */
  getCurrentStateId(): string {
    return this.machine.currentStateId
  }

  /** Check if currently in a crossfade */
  isTransitioning(): boolean {
    return this.crossfade !== null
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private getState(id: string): AnimState | undefined {
    return this.machine.states.find((s) => s.id === id)
  }

  /**
   * Simple condition evaluator. Supports:
   * - 'trigger:name' — checks if parameter is true
   * - 'param > value', 'param < value', 'param == value'
   * - 'param >= value', 'param <= value'
   */
  private evaluateCondition(condition: string): boolean {
    const trimmed = condition.trim()

    // Trigger check
    if (trimmed.startsWith('trigger:')) {
      const triggerName = trimmed
      return this.machine.parameters[triggerName] === true
    }

    // Comparison operators
    const match = trimmed.match(/^(\w+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/)
    if (!match) return false

    const [, paramName, op, rawValue] = match
    const paramValue = this.machine.parameters[paramName]
    if (paramValue === undefined) return false

    const targetValue = parseFloat(rawValue) || rawValue.trim()

    switch (op) {
      case '>': return Number(paramValue) > Number(targetValue)
      case '<': return Number(paramValue) < Number(targetValue)
      case '>=': return Number(paramValue) >= Number(targetValue)
      case '<=': return Number(paramValue) <= Number(targetValue)
      case '==': return String(paramValue) === String(targetValue)
      case '!=': return String(paramValue) !== String(targetValue)
      default: return false
    }
  }
}
