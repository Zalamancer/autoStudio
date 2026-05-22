/**
 * useDataSourceStore — State management for data-driven procedural animation.
 *
 * Manages external data sources (CSV, JSON, REST APIs, Google Sheets),
 * data bindings that connect data columns to template CONFIG fields,
 * and keyframe generation rules that auto-create animation keyframes
 * from data series.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  DataSource,
  DataBinding,
  DataKeyframeRule,
  DataSourceType,
} from '@/types/dataSource'
import { applyDataTransform } from '@/types/dataSource'

interface DataSourceState {
  // ── Data sources ──
  dataSources: DataSource[]
  selectedDataSourceId: string | null

  // ── Bindings ──
  bindings: DataBinding[]

  // ── Keyframe rules ──
  keyframeRules: DataKeyframeRule[]

  // ── Polling timers ──
  _pollTimers: Map<string, ReturnType<typeof setInterval>>

  // ── Data source CRUD ──
  addDataSource: (type: DataSourceType, name?: string) => string
  removeDataSource: (id: string) => void
  updateDataSource: (id: string, updates: Partial<DataSource>) => void
  setSelectedDataSourceId: (id: string | null) => void

  // ── Data loading ──
  loadCSV: (id: string, csvText: string) => void
  loadJSON: (id: string, jsonText: string) => void
  fetchFromURL: (id: string) => Promise<void>
  startPolling: (id: string) => void
  stopPolling: (id: string) => void
  snapshotData: (id: string) => Record<string, unknown>[]

  // ── Binding CRUD ──
  addBinding: (binding: Omit<DataBinding, 'id'>) => string
  removeBinding: (id: string) => void
  updateBinding: (id: string, updates: Partial<DataBinding>) => void
  getBindingsForDataSource: (dataSourceId: string) => DataBinding[]
  getBindingsForTarget: (targetLayerId: string) => DataBinding[]

  // ── Keyframe rule CRUD ──
  addKeyframeRule: (rule: Omit<DataKeyframeRule, 'id'>) => string
  removeKeyframeRule: (id: string) => void
  updateKeyframeRule: (id: string, updates: Partial<DataKeyframeRule>) => void

  // ── Resolve bindings ──
  resolveBindingValue: (bindingId: string) => unknown
  resolveAllBindingsForTarget: (targetLayerId: string) => Record<string, unknown>

  // ── Cleanup ──
  clearAll: () => void
}

function parseCSV(text: string): { columns: string[]; data: Record<string, unknown>[] } {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { columns: [], data: [] }

  const header = lines[0]
  // Handle quoted CSV fields
  const columns = header.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

  const data: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, unknown> = {}
    columns.forEach((col, idx) => {
      const val = values[idx] ?? ''
      // Try to parse numbers
      const num = parseFloat(val)
      row[col] = !isNaN(num) && val !== '' ? num : val
    })
    data.push(row)
  }

  return { columns, data }
}

function parseJSONData(text: string): { columns: string[]; data: Record<string, unknown>[] } {
  try {
    const parsed = JSON.parse(text)
    const arr = Array.isArray(parsed) ? parsed : parsed.data || parsed.rows || parsed.items || [parsed]

    if (arr.length === 0) return { columns: [], data: [] }

    const columns = Object.keys(arr[0])
    return { columns, data: arr }
  } catch {
    return { columns: [], data: [] }
  }
}

export const useDataSourceStore = create<DataSourceState>()(
  immer((set, get) => ({
    dataSources: [],
    selectedDataSourceId: null,
    bindings: [],
    keyframeRules: [],
    _pollTimers: new Map(),

    // ── Data source CRUD ──

    addDataSource: (type, name) => {
      const id = `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        const source: DataSource = {
          id,
          name: name || `Data Source ${state.dataSources.length + 1}`,
          type,
          url: '',
          pollInterval: 0,
          lastFetched: null,
          status: 'idle',
          error: null,
          data: [],
          columns: [],
          freezeOnExport: true,
        }
        state.dataSources.push(source)
        state.selectedDataSourceId = id
      })
      return id
    },

    removeDataSource: (id) => {
      const timers = get()._pollTimers
      const timer = timers.get(id)
      if (timer) {
        clearInterval(timer)
        timers.delete(id)
      }

      set((state) => {
        state.dataSources = state.dataSources.filter((ds) => ds.id !== id)
        state.bindings = state.bindings.filter((b) => b.dataSourceId !== id)
        state.keyframeRules = state.keyframeRules.filter((r) => r.dataSourceId !== id)
        if (state.selectedDataSourceId === id) {
          state.selectedDataSourceId = state.dataSources[0]?.id || null
        }
      })
    },

    updateDataSource: (id, updates) =>
      set((state) => {
        const ds = state.dataSources.find((d) => d.id === id)
        if (ds) {
          Object.assign(ds, updates)
        }
      }),

    setSelectedDataSourceId: (id) =>
      set((state) => {
        state.selectedDataSourceId = id
      }),

    // ── Data loading ──

    loadCSV: (id, csvText) =>
      set((state) => {
        const ds = state.dataSources.find((d) => d.id === id)
        if (!ds) return

        try {
          const { columns, data } = parseCSV(csvText)
          ds.columns = columns
          ds.data = data
          ds.status = 'loaded'
          ds.error = null
          ds.lastFetched = Date.now()
        } catch (err) {
          ds.status = 'error'
          ds.error = `CSV parse error: ${err instanceof Error ? err.message : String(err)}`
        }
      }),

    loadJSON: (id, jsonText) =>
      set((state) => {
        const ds = state.dataSources.find((d) => d.id === id)
        if (!ds) return

        try {
          const { columns, data } = parseJSONData(jsonText)
          ds.columns = columns
          ds.data = data
          ds.status = 'loaded'
          ds.error = null
          ds.lastFetched = Date.now()
        } catch (err) {
          ds.status = 'error'
          ds.error = `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
        }
      }),

    fetchFromURL: async (id) => {
      const ds = get().dataSources.find((d) => d.id === id)
      if (!ds || !ds.url) return

      set((state) => {
        const target = state.dataSources.find((d) => d.id === id)
        if (target) target.status = 'loading'
      })

      try {
        const response = await fetch(ds.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const contentType = response.headers.get('content-type') || ''
        const text = await response.text()

        if (contentType.includes('json') || ds.type === 'json' || ds.type === 'rest-api' || ds.type === 'google-sheets') {
          const { columns, data } = parseJSONData(text)
          set((state) => {
            const target = state.dataSources.find((d) => d.id === id)
            if (target) {
              target.columns = columns
              target.data = data
              target.status = 'loaded'
              target.error = null
              target.lastFetched = Date.now()
            }
          })
        } else {
          const { columns, data } = parseCSV(text)
          set((state) => {
            const target = state.dataSources.find((d) => d.id === id)
            if (target) {
              target.columns = columns
              target.data = data
              target.status = 'loaded'
              target.error = null
              target.lastFetched = Date.now()
            }
          })
        }
      } catch (err) {
        set((state) => {
          const target = state.dataSources.find((d) => d.id === id)
          if (target) {
            target.status = 'error'
            target.error = `Fetch error: ${err instanceof Error ? err.message : String(err)}`
          }
        })
      }
    },

    startPolling: (id) => {
      const ds = get().dataSources.find((d) => d.id === id)
      if (!ds || ds.pollInterval <= 0) return

      // Stop existing timer
      const timers = get()._pollTimers
      const existing = timers.get(id)
      if (existing) clearInterval(existing)

      const timer = setInterval(() => {
        get().fetchFromURL(id)
      }, ds.pollInterval * 1000)

      timers.set(id, timer)
    },

    stopPolling: (id) => {
      const timers = get()._pollTimers
      const timer = timers.get(id)
      if (timer) {
        clearInterval(timer)
        timers.delete(id)
      }
    },

    snapshotData: (id) => {
      const ds = get().dataSources.find((d) => d.id === id)
      return ds ? JSON.parse(JSON.stringify(ds.data)) : []
    },

    // ── Binding CRUD ──

    addBinding: (binding) => {
      const id = `db-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        state.bindings.push({ ...binding, id })
      })
      return id
    },

    removeBinding: (id) =>
      set((state) => {
        state.bindings = state.bindings.filter((b) => b.id !== id)
      }),

    updateBinding: (id, updates) =>
      set((state) => {
        const binding = state.bindings.find((b) => b.id === id)
        if (binding) {
          Object.assign(binding, updates)
        }
      }),

    getBindingsForDataSource: (dataSourceId) => {
      return get().bindings.filter((b) => b.dataSourceId === dataSourceId)
    },

    getBindingsForTarget: (targetLayerId) => {
      return get().bindings.filter((b) => b.targetLayerId === targetLayerId)
    },

    // ── Keyframe rule CRUD ──

    addKeyframeRule: (rule) => {
      const id = `dkr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        state.keyframeRules.push({ ...rule, id })
      })
      return id
    },

    removeKeyframeRule: (id) =>
      set((state) => {
        state.keyframeRules = state.keyframeRules.filter((r) => r.id !== id)
      }),

    updateKeyframeRule: (id, updates) =>
      set((state) => {
        const rule = state.keyframeRules.find((r) => r.id === id)
        if (rule) {
          Object.assign(rule, updates)
        }
      }),

    // ── Resolve bindings ──

    resolveBindingValue: (bindingId) => {
      const { bindings, dataSources } = get()
      const binding = bindings.find((b) => b.id === bindingId)
      if (!binding) return undefined

      const ds = dataSources.find((d) => d.id === binding.dataSourceId)
      if (!ds || ds.data.length === 0) return undefined

      if (binding.rowIndex === 'all') {
        // Return full column as array
        return ds.data.map((row) => row[binding.columnName])
      }

      const rowIdx = Math.min(binding.rowIndex, ds.data.length - 1)
      const row = ds.data[rowIdx]
      if (!row) return undefined

      return applyDataTransform(row[binding.columnName], binding.transform)
    },

    resolveAllBindingsForTarget: (targetLayerId) => {
      const { bindings } = get()
      const result: Record<string, unknown> = {}

      const targetBindings = bindings.filter((b) => b.targetLayerId === targetLayerId)
      for (const binding of targetBindings) {
        const value = get().resolveBindingValue(binding.id)
        if (value !== undefined) {
          result[binding.targetConfigKey] = value
        }
      }

      return result
    },

    // ── Cleanup ──

    clearAll: () => {
      // Stop all polling
      const timers = get()._pollTimers
      for (const timer of timers.values()) {
        clearInterval(timer)
      }
      timers.clear()

      set((state) => {
        state.dataSources = []
        state.selectedDataSourceId = null
        state.bindings = []
        state.keyframeRules = []
      })
    },
  }))
)
