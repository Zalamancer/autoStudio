/**
 * DataSourceManager — Service for connecting external data to template CONFIG.
 *
 * Handles fetching from REST APIs, parsing CSV/JSON files, Google Sheets
 * integration, and auto-generating keyframes from data series.
 *
 * Data flows: DataSource -> DataBinding -> Template CONFIG key
 * Keyframe flow: DataSource column -> DataKeyframeRule -> Property keyframes
 */

import { useDataSourceStore } from '@/stores/useDataSourceStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import type { DataKeyframeRule } from '@/types/dataSource'
import { applyDataTransform } from '@/types/dataSource'

/**
 * Push all resolved binding values to their target HTML templates.
 * Sends CONFIG_UPDATE messages to template iframes via the bridge.
 */
export function pushBindingsToTemplates(): void {
  const { bindings, dataSources } = useDataSourceStore.getState()
  const { templates: layers, updateTemplateConfig: updateLayerConfig } = useHTMLTemplateLayerStore.getState()

  // Group bindings by target layer
  const byTarget = new Map<string, Array<{ key: string; value: unknown }>>()

  for (const binding of bindings) {
    const ds = dataSources.find((d) => d.id === binding.dataSourceId)
    if (!ds || ds.data.length === 0) continue

    let value: unknown
    if (binding.rowIndex === 'all') {
      value = ds.data.map((row) => row[binding.columnName])
    } else {
      const rowIdx = Math.min(binding.rowIndex as number, ds.data.length - 1)
      value = applyDataTransform(ds.data[rowIdx]?.[binding.columnName], binding.transform)
    }

    if (value === undefined) continue

    if (!byTarget.has(binding.targetLayerId)) {
      byTarget.set(binding.targetLayerId, [])
    }
    byTarget.get(binding.targetLayerId)!.push({
      key: binding.targetConfigKey,
      value,
    })
  }

  // Push to each target template
  for (const [layerId, configs] of byTarget) {
    const layer = layers.find((l) => l.id === layerId)
    if (!layer) continue

    // Update the layer's config values
    for (const { key, value } of configs) {
      updateLayerConfig(layerId, key, value)
    }
  }
}

/**
 * Generate keyframes from a data series based on a keyframe rule.
 *
 * Converts a column of data values into evenly-spaced keyframes that
 * animate a target property over time.
 *
 * Returns an array of { frame, value } pairs ready to be inserted into
 * the keyframe store.
 */
export function generateKeyframesFromData(
  rule: DataKeyframeRule,
): Array<{ frame: number; value: number | string }> {
  const ds = useDataSourceStore.getState().dataSources.find((d) => d.id === rule.dataSourceId)
  if (!ds || ds.data.length === 0) return []

  const values = ds.data.map((row) => row[rule.columnName])
  const keyframes: Array<{ frame: number; value: number | string }> = []

  if (rule.mappingMode === 'linear' || rule.mappingMode === 'proportional') {
    // Numeric interpolation between data points
    const numericValues = values.map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
    const validValues = numericValues.filter((v) => !isNaN(v))

    if (validValues.length === 0) return []

    const minVal = Math.min(...validValues)
    let maxVal = Math.max(...validValues)
    if (minVal === maxVal) maxVal = minVal + 1

    for (let i = 0; i < numericValues.length; i++) {
      const frame = i * rule.framesPerPoint
      const val = numericValues[i]
      if (isNaN(val)) continue

      if (rule.mappingMode === 'proportional') {
        // Normalize to 0-1 range
        keyframes.push({ frame, value: (val - minVal) / (maxVal - minVal) })
      } else {
        keyframes.push({ frame, value: val })
      }
    }
  } else if (rule.mappingMode === 'stepped') {
    // Step between values (hold until next)
    for (let i = 0; i < values.length; i++) {
      const frame = i * rule.framesPerPoint
      const value = values[i]
      keyframes.push({ frame, value: typeof value === 'number' ? value : String(value ?? '') })
    }
  }

  return keyframes
}

/**
 * Build a Google Sheets URL for the Google Sheets API (public sheets).
 * Converts a standard Google Sheets share URL to a CSV export URL.
 */
export function googleSheetsToCSVUrl(url: string): string {
  // Match Google Sheets URL pattern
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) return url

  const sheetId = match[1]
  // Extract gid (sheet tab) if present
  const gidMatch = url.match(/gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
}

/**
 * Auto-detect data source type from a URL.
 */
export function detectDataSourceType(url: string): 'csv' | 'json' | 'rest-api' | 'google-sheets' {
  if (url.includes('docs.google.com/spreadsheets')) return 'google-sheets'
  if (url.endsWith('.csv')) return 'csv'
  if (url.endsWith('.json')) return 'json'
  return 'rest-api'
}

/**
 * Create a data source from a file upload event.
 */
export async function createDataSourceFromFile(file: File): Promise<string> {
  const store = useDataSourceStore.getState()
  const text = await file.text()

  const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv'
  const isJSON = file.name.endsWith('.json') || file.type === 'application/json'

  const type = isCSV ? 'csv' : isJSON ? 'json' : 'csv'
  const id = store.addDataSource(type, file.name.replace(/\.(csv|json)$/, ''))

  if (isCSV) {
    store.loadCSV(id, text)
  } else {
    store.loadJSON(id, text)
  }

  return id
}

/**
 * Create a data source from a URL and fetch its data.
 */
export async function createDataSourceFromURL(url: string, name?: string): Promise<string> {
  const store = useDataSourceStore.getState()
  const type = detectDataSourceType(url)

  const finalUrl = type === 'google-sheets' ? googleSheetsToCSVUrl(url) : url
  const id = store.addDataSource(type, name || `Source from ${new URL(url).hostname}`)

  store.updateDataSource(id, { url: finalUrl })
  await store.fetchFromURL(id)

  return id
}

/**
 * Snapshot all data sources for export (freeze data).
 * Returns a map of data source ID to their frozen data.
 */
export function snapshotAllDataSources(): Map<string, Record<string, unknown>[]> {
  const { dataSources } = useDataSourceStore.getState()
  const snapshots = new Map<string, Record<string, unknown>[]>()

  for (const ds of dataSources) {
    if (ds.freezeOnExport) {
      snapshots.set(ds.id, JSON.parse(JSON.stringify(ds.data)))
    }
  }

  return snapshots
}
