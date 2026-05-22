/**
 * State machine store for animation state management.
 * Each 3D character can have one state machine that manages
 * transitions between animation states.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AnimStateMachine, AnimState, AnimTransition } from '@/types/animStateMachine'

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

interface AnimStateMachineState {
  machines: Record<string, AnimStateMachine>
  activeMachineId: string | null

  // CRUD
  createMachine: (characterId: string, name?: string) => string
  deleteMachine: (id: string) => void
  setActiveMachine: (id: string | null) => void
  getActiveMachine: () => AnimStateMachine | null
  getMachineForCharacter: (characterId: string) => AnimStateMachine | null

  // States
  addState: (machineId: string, state?: Partial<AnimState>) => string
  updateState: (machineId: string, stateId: string, updates: Partial<AnimState>) => void
  removeState: (machineId: string, stateId: string) => void
  setDefaultState: (machineId: string, stateId: string) => void

  // Transitions
  addTransition: (machineId: string, fromStateId: string, toStateId: string) => string
  updateTransition: (machineId: string, transitionId: string, updates: Partial<AnimTransition>) => void
  removeTransition: (machineId: string, transitionId: string) => void

  // Parameters
  setParameter: (machineId: string, name: string, value: number | boolean | string) => void
  removeParameter: (machineId: string, name: string) => void

  // Runtime
  setCurrentState: (machineId: string, stateId: string) => void

  // Reset
  reset: () => void
}

export const useAnimStateMachineStore = create<AnimStateMachineState>()(
  immer((set, get) => ({
    machines: {},
    activeMachineId: null,

    createMachine: (characterId, name = 'State Machine') => {
      const id = generateId('asm')
      const defaultState: AnimState = {
        id: generateId('state'),
        name: 'Idle',
        clipId: null,
        poseTrackId: null,
        speed: 1,
        loop: true,
        position: { x: 100, y: 100 },
      }

      set((state) => {
        state.machines[id] = {
          id,
          characterId,
          name,
          states: [defaultState],
          transitions: [],
          defaultStateId: defaultState.id,
          currentStateId: defaultState.id,
          parameters: {},
        }
        state.activeMachineId = id
      })

      return id
    },

    deleteMachine: (id) =>
      set((state) => {
        delete state.machines[id]
        if (state.activeMachineId === id) {
          state.activeMachineId = null
        }
      }),

    setActiveMachine: (id) =>
      set((state) => {
        state.activeMachineId = id
      }),

    getActiveMachine: () => {
      const { machines, activeMachineId } = get()
      return activeMachineId ? machines[activeMachineId] ?? null : null
    },

    getMachineForCharacter: (characterId) => {
      const { machines } = get()
      return Object.values(machines).find((m) => m.characterId === characterId) ?? null
    },

    // States
    addState: (machineId, partial = {}) => {
      const stateId = generateId('state')
      set((state) => {
        const machine = state.machines[machineId]
        if (!machine) return
        machine.states.push({
          id: stateId,
          name: partial.name ?? `State ${machine.states.length + 1}`,
          clipId: partial.clipId ?? null,
          poseTrackId: partial.poseTrackId ?? null,
          speed: partial.speed ?? 1,
          loop: partial.loop ?? true,
          position: partial.position ?? {
            x: 100 + machine.states.length * 200,
            y: 100,
          },
        })
      })
      return stateId
    },

    updateState: (machineId, stateId, updates) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (!machine) return
        const s = machine.states.find((s) => s.id === stateId)
        if (s) Object.assign(s, updates)
      }),

    removeState: (machineId, stateId) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (!machine) return
        machine.states = machine.states.filter((s) => s.id !== stateId)
        machine.transitions = machine.transitions.filter(
          (t) => t.fromStateId !== stateId && t.toStateId !== stateId
        )
        if (machine.defaultStateId === stateId && machine.states.length > 0) {
          machine.defaultStateId = machine.states[0].id
        }
        if (machine.currentStateId === stateId && machine.states.length > 0) {
          machine.currentStateId = machine.states[0].id
        }
      }),

    setDefaultState: (machineId, stateId) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (machine) machine.defaultStateId = stateId
      }),

    // Transitions
    addTransition: (machineId, fromStateId, toStateId) => {
      const transitionId = generateId('trans')
      set((state) => {
        const machine = state.machines[machineId]
        if (!machine) return
        machine.transitions.push({
          id: transitionId,
          fromStateId,
          toStateId,
          duration: 0.3,
          condition: '',
          hasExitTime: false,
          exitTime: 1,
        })
      })
      return transitionId
    },

    updateTransition: (machineId, transitionId, updates) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (!machine) return
        const t = machine.transitions.find((t) => t.id === transitionId)
        if (t) Object.assign(t, updates)
      }),

    removeTransition: (machineId, transitionId) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (!machine) return
        machine.transitions = machine.transitions.filter((t) => t.id !== transitionId)
      }),

    // Parameters
    setParameter: (machineId, name, value) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (machine) machine.parameters[name] = value
      }),

    removeParameter: (machineId, name) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (machine) delete machine.parameters[name]
      }),

    // Runtime
    setCurrentState: (machineId, stateId) =>
      set((state) => {
        const machine = state.machines[machineId]
        if (machine) machine.currentStateId = stateId
      }),

    reset: () =>
      set((state) => {
        state.machines = {}
        state.activeMachineId = null
      }),
  }))
)
