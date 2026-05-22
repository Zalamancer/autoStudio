import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ProjectSchema, SchemaVariable, SchemaBinding } from '@/types/projectSchema'

interface ProjectSchemaState {
  schema: ProjectSchema | null
  isDirty: boolean
}

interface ProjectSchemaActions {
  initSchema: () => void
  setVariable: (key: string, value: unknown) => void
  setVariableBatch: (updates: Record<string, unknown>) => void
  addVariable: (variable: SchemaVariable) => void
  removeVariable: (key: string) => void
  updateVariableDefinition: (key: string, updates: Partial<SchemaVariable>) => void
  addBinding: (binding: SchemaBinding) => void
  removeBinding: (variableKey: string, index: number) => void
  updateBinding: (variableKey: string, index: number, updates: Partial<SchemaBinding>) => void
  autoDetectVariables: () => void
  loadFromProject: (schema: ProjectSchema) => void
  exportSchema: () => ProjectSchema | null
  reset: () => void
}

export const useProjectSchemaStore = create<ProjectSchemaState & ProjectSchemaActions>()(
  immer((set, get) => ({
    schema: null,
    isDirty: false,

    initSchema: () => {
      set((state) => {
        if (!state.schema) {
          state.schema = {
            version: 1,
            variables: [],
            bindings: [],
            groupOrder: ['Text', 'Colors', 'Characters', 'Layout', 'Audio', 'Templates', 'Other'],
            updatedAt: new Date().toISOString(),
          }
        }
      })
    },

    setVariable: (key, value) => {
      set((state) => {
        if (!state.schema) return
        const variable = state.schema.variables.find((v) => v.key === key)
        if (variable) {
          variable.value = value
          state.schema.updatedAt = new Date().toISOString()
          state.isDirty = true
        }
      })
    },

    setVariableBatch: (updates) => {
      set((state) => {
        if (!state.schema) return
        for (const [key, value] of Object.entries(updates)) {
          const variable = state.schema.variables.find((v) => v.key === key)
          if (variable) {
            variable.value = value
          }
        }
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    addVariable: (variable) => {
      set((state) => {
        if (!state.schema) return
        // Don't add duplicates
        if (state.schema.variables.some((v) => v.key === variable.key)) return
        state.schema.variables.push(variable)
        // Add group to order if new
        if (!state.schema.groupOrder.includes(variable.group)) {
          state.schema.groupOrder.push(variable.group)
        }
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    removeVariable: (key) => {
      set((state) => {
        if (!state.schema) return
        state.schema.variables = state.schema.variables.filter((v) => v.key !== key)
        state.schema.bindings = state.schema.bindings.filter((b) => b.variableKey !== key)
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    updateVariableDefinition: (key, updates) => {
      set((state) => {
        if (!state.schema) return
        const variable = state.schema.variables.find((v) => v.key === key)
        if (variable) {
          Object.assign(variable, updates)
          state.schema.updatedAt = new Date().toISOString()
          state.isDirty = true
        }
      })
    },

    addBinding: (binding) => {
      set((state) => {
        if (!state.schema) return
        state.schema.bindings.push(binding)
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    removeBinding: (variableKey, index) => {
      set((state) => {
        if (!state.schema) return
        const bindingsForKey = state.schema.bindings.filter((b) => b.variableKey === variableKey)
        if (index >= 0 && index < bindingsForKey.length) {
          const targetBinding = bindingsForKey[index]
          const globalIndex = state.schema.bindings.indexOf(targetBinding)
          if (globalIndex !== -1) {
            state.schema.bindings.splice(globalIndex, 1)
          }
        }
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    updateBinding: (variableKey, index, updates) => {
      set((state) => {
        if (!state.schema) return
        const bindingsForKey = state.schema.bindings.filter((b) => b.variableKey === variableKey)
        if (index >= 0 && index < bindingsForKey.length) {
          Object.assign(bindingsForKey[index], updates)
        }
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    autoDetectVariables: () => {
      // Lazy import to avoid circular deps
      import('@/services/schemaAutoDetector').then(({ detectSchemaVariables }) => {
        const detected = detectSchemaVariables()
        set((state) => {
          if (!state.schema) {
            state.schema = {
              version: 1,
              variables: [],
              bindings: [],
              groupOrder: ['Text', 'Colors', 'Characters', 'Layout', 'Audio', 'Templates', 'Other'],
              updatedAt: new Date().toISOString(),
            }
          }
          // Merge detected variables (don't overwrite existing)
          for (const { variable, bindings } of detected) {
            if (!state.schema.variables.some((v) => v.key === variable.key)) {
              state.schema.variables.push(variable)
              for (const binding of bindings) {
                state.schema.bindings.push(binding)
              }
            }
            if (!state.schema.groupOrder.includes(variable.group)) {
              state.schema.groupOrder.push(variable.group)
            }
          }
          state.schema.updatedAt = new Date().toISOString()
          state.isDirty = true
        })
      })
    },

    loadFromProject: (schema) => {
      set((state) => {
        state.schema = schema
        state.isDirty = false
      })
    },

    exportSchema: () => {
      return get().schema
    },

    reset: () => {
      set((state) => {
        state.schema = null
        state.isDirty = false
      })
    },
  }))
)
