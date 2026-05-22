/**
 * DataSourcePanel — UI for managing data-driven procedural animations.
 *
 * Allows users to import CSV/JSON data, connect to REST APIs and Google Sheets,
 * bind data columns to template CONFIG fields, and generate keyframes from
 * data series.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PanelSelect, PanelSlider } from '@/components/ui/panel-controls'
import { useDataSourceStore } from '@/stores/useDataSourceStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { createDataSourceFromFile, createDataSourceFromURL, pushBindingsToTemplates } from '@/services/dataSourceManager'
import {
  Database,
  Plus,
  Trash2,
  Upload,
  Link,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronRight,
  Table2,
  FileJson,
  Globe,
  Sheet,
  X,
  Link2,
  ArrowRight,
} from 'lucide-react'
import type { DataSourceType, DataTransform } from '@/types/dataSource'

const TYPE_ICONS: Record<DataSourceType, React.ReactNode> = {
  csv: <Table2 size={14} />,
  json: <FileJson size={14} />,
  'rest-api': <Globe size={14} />,
  'google-sheets': <Sheet size={14} />,
}

const TYPE_LABELS: Record<DataSourceType, string> = {
  csv: 'CSV File',
  json: 'JSON File',
  'rest-api': 'REST API',
  'google-sheets': 'Google Sheets',
}

const TRANSFORM_OPTIONS: { value: DataTransform; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'round', label: 'Round' },
  { value: 'floor', label: 'Floor' },
  { value: 'ceil', label: 'Ceil' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'titlecase', label: 'Title Case' },
  { value: 'truncate-50', label: 'Truncate (50)' },
  { value: 'truncate-100', label: 'Truncate (100)' },
]

export function DataSourcePanel() {
  const dataSources = useDataSourceStore((s) => s.dataSources)
  const selectedId = useDataSourceStore((s) => s.selectedDataSourceId)
  const setSelectedId = useDataSourceStore((s) => s.setSelectedDataSourceId)
  const addDataSource = useDataSourceStore((s) => s.addDataSource)
  const removeDataSource = useDataSourceStore((s) => s.removeDataSource)

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await createDataSourceFromFile(file)
    e.target.value = '' // Reset
  }, [])

  const handleAddFromURL = useCallback(async () => {
    if (!urlInput.trim()) return
    await createDataSourceFromURL(urlInput.trim())
    setUrlInput('')
    setShowUrlInput(false)
  }, [urlInput])

  const selectedSource = dataSources.find((d) => d.id === selectedId)

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-blue-400" />
          <span className="font-medium">Data Sources</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
          >
            <Plus size={14} />
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/5 text-left"
                onClick={() => {
                  fileInputRef.current?.click()
                  setShowAddMenu(false)
                }}
              >
                <Upload size={12} /> Upload CSV/JSON
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/5 text-left"
                onClick={() => {
                  setShowUrlInput(true)
                  setShowAddMenu(false)
                }}
              >
                <Link size={12} /> From URL
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/5 text-left"
                onClick={() => {
                  addDataSource('rest-api', 'REST API')
                  setShowAddMenu(false)
                }}
              >
                <Globe size={12} /> REST API
              </button>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://api.example.com/data.json"
            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAddFromURL()}
          />
          <button
            onClick={handleAddFromURL}
            className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500"
          >
            Add
          </button>
          <button
            onClick={() => setShowUrlInput(false)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Source list */}
      <div className="flex-1 overflow-y-auto">
        {dataSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-xs gap-2">
            <Database size={24} />
            <span>No data sources yet</span>
            <span>Upload a CSV/JSON file or connect an API</span>
          </div>
        ) : (
          dataSources.map((ds) => (
            <div
              key={ds.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 ${
                ds.id === selectedId ? 'bg-white/10 border-l-2 border-blue-400' : ''
              }`}
              onClick={() => setSelectedId(ds.id)}
            >
              <span className="text-white/40">{TYPE_ICONS[ds.type]}</span>
              <span className="flex-1 truncate">{ds.name}</span>
              <span className="text-[10px] text-white/30">
                {ds.data.length} rows
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  ds.status === 'loaded'
                    ? 'bg-green-400'
                    : ds.status === 'loading'
                    ? 'bg-yellow-400'
                    : ds.status === 'error'
                    ? 'bg-red-400'
                    : 'bg-gray-500'
                }`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeDataSource(ds.id)
                }}
                className="p-0.5 hover:bg-white/10 rounded text-white/30 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Detail view for selected source */}
      {selectedSource && (
        <DataSourceDetail source={selectedSource} />
      )}
    </div>
  )
}

// ── Data Source Detail ──

function DataSourceDetail({ source }: { source: ReturnType<typeof useDataSourceStore.getState>['dataSources'][0] }) {
  const fetchFromURL = useDataSourceStore((s) => s.fetchFromURL)
  const updateDataSource = useDataSourceStore((s) => s.updateDataSource)
  const startPolling = useDataSourceStore((s) => s.startPolling)
  const stopPolling = useDataSourceStore((s) => s.stopPolling)
  const [expandedData, setExpandedData] = useState(false)
  const [expandedBindings, setExpandedBindings] = useState(true)

  // ── Polling: start/stop interval when pollInterval changes ──
  useEffect(() => {
    if (source.pollInterval > 0 && source.url) {
      startPolling(source.id)
      return () => {
        stopPolling(source.id)
      }
    } else {
      stopPolling(source.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.id, source.pollInterval, source.url])

  return (
    <div className="border-t border-white/10 max-h-[500px] overflow-y-auto">
      {/* Source info */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2 text-xs text-white/50">
          {TYPE_ICONS[source.type]}
          <span>{TYPE_LABELS[source.type]}</span>
          {source.lastFetched && (
            <span className="ml-auto">
              Last: {new Date(source.lastFetched).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* URL field for API sources */}
        {(source.type === 'rest-api' || source.type === 'google-sheets') && (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={source.url}
              onChange={(e) => updateDataSource(source.id, { url: e.target.value })}
              placeholder="API URL..."
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => fetchFromURL(source.id)}
              className="p-1 bg-blue-600 rounded hover:bg-blue-500"
              title="Fetch data"
            >
              <RefreshCw size={11} />
            </button>
          </div>
        )}

        {/* Polling interval for API sources */}
        {(source.type === 'rest-api' || source.type === 'google-sheets') && (
          <div className="flex items-center gap-2">
            <PanelSlider
              label="Poll Interval"
              value={source.pollInterval}
              onChange={(v) =>
                updateDataSource(source.id, {
                  pollInterval: Math.max(0, v),
                })
              }
              min={0}
              max={300}
              step={5}
              suffix="s"
              compact
            />
            {source.pollInterval > 0 && (
              <span className="text-[10px] text-green-400 shrink-0">Active</span>
            )}
          </div>
        )}

        {/* Error display */}
        {source.error && (
          <div className="text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded">
            {source.error}
          </div>
        )}

        {/* Columns */}
        {source.columns.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              Columns ({source.columns.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {source.columns.map((col) => (
                <span
                  key={col}
                  className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/60"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Data preview */}
        {source.data.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedData(!expandedData)}
              className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60"
            >
              {expandedData ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Preview ({source.data.length} rows)
            </button>
            {expandedData && (
              <div className="mt-1 overflow-x-auto max-h-32 overflow-y-auto">
                <table className="text-[10px] border-collapse">
                  <thead>
                    <tr>
                      {source.columns.map((col) => (
                        <th
                          key={col}
                          className="px-2 py-0.5 border border-white/10 bg-white/5 text-white/50 font-medium text-left"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {source.data.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {source.columns.map((col) => (
                          <td
                            key={col}
                            className="px-2 py-0.5 border border-white/10 text-white/40 truncate max-w-[100px]"
                          >
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {source.data.length > 5 && (
                  <div className="text-[10px] text-white/30 mt-1">
                    ...and {source.data.length - 5} more rows
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Bindings Section ── */}
        {source.columns.length > 0 && (
          <BindingsSection
            source={source}
            expanded={expandedBindings}
            onToggle={() => setExpandedBindings(!expandedBindings)}
          />
        )}

        {/* Push bindings button */}
        <button
          onClick={pushBindingsToTemplates}
          className="flex items-center gap-2 w-full px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30"
        >
          <Play size={12} />
          Push Data to Templates
        </button>
      </div>
    </div>
  )
}

// ── Bindings Section ──

function BindingsSection({
  source,
  expanded,
  onToggle,
}: {
  source: ReturnType<typeof useDataSourceStore.getState>['dataSources'][0]
  expanded: boolean
  onToggle: () => void
}) {
  const bindings = useDataSourceStore((s) => s.bindings)
  const addBinding = useDataSourceStore((s) => s.addBinding)
  const removeBinding = useDataSourceStore((s) => s.removeBinding)
  const updateBinding = useDataSourceStore((s) => s.updateBinding)
  const templates = useHTMLTemplateLayerStore((s) => s.templates)

  // Bindings for this data source
  const sourceBindings = bindings.filter((b) => b.dataSourceId === source.id)

  const handleAddBinding = useCallback(() => {
    if (source.columns.length === 0 || templates.length === 0) return

    const firstTemplate = templates[0]
    const firstConfigKey =
      firstTemplate.customConfig.length > 0
        ? firstTemplate.customConfig[0].key
        : ''

    addBinding({
      dataSourceId: source.id,
      columnName: source.columns[0],
      targetLayerId: firstTemplate.id,
      targetConfigKey: firstConfigKey,
      transform: 'none',
      rowIndex: 0,
    })
  }, [source.id, source.columns, templates, addBinding])

  return (
    <div className="space-y-1.5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 uppercase tracking-wider"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          <Link2 size={10} />
          Bindings ({sourceBindings.length})
        </button>
        <button
          onClick={handleAddBinding}
          disabled={templates.length === 0}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title={templates.length === 0 ? 'Add a template first' : 'Add binding'}
        >
          <Plus size={9} />
          Add
        </button>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          {templates.length === 0 && (
            <div className="text-[10px] text-white/30 italic px-1">
              No templates on canvas. Add an HTML template to create bindings.
            </div>
          )}

          {sourceBindings.length === 0 && templates.length > 0 && (
            <div className="text-[10px] text-white/30 italic px-1">
              No bindings yet. Click "Add" to connect a data column to a template CONFIG key.
            </div>
          )}

          {/* Binding rows */}
          {sourceBindings.map((binding) => (
            <BindingRow
              key={binding.id}
              binding={binding}
              columns={source.columns}
              templates={templates}
              rowCount={source.data.length}
              onUpdate={(updates) => updateBinding(binding.id, updates)}
              onRemove={() => removeBinding(binding.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Single Binding Row ──

function BindingRow({
  binding,
  columns,
  templates,
  rowCount,
  onUpdate,
  onRemove,
}: {
  binding: ReturnType<typeof useDataSourceStore.getState>['bindings'][0]
  columns: string[]
  templates: ReturnType<typeof useHTMLTemplateLayerStore.getState>['templates']
  rowCount: number
  onUpdate: (updates: Partial<typeof binding>) => void
  onRemove: () => void
}) {
  const selectedTemplate = templates.find((t) => t.id === binding.targetLayerId)
  const configKeys = selectedTemplate?.customConfig.map((c) => c.key) ?? []

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 space-y-1.5">
      {/* Row 1: Column -> Template */}
      <div className="flex items-center gap-1">
        {/* Column select */}
        <div className="flex-1">
          <PanelSelect
            value={binding.columnName}
            onChange={(v) => onUpdate({ columnName: v })}
            options={columns.map((col) => ({ value: col, label: col }))}
            fullWidth
          />
        </div>

        <ArrowRight size={10} className="text-white/20 shrink-0" />

        {/* Template select */}
        <div className="flex-1">
          <PanelSelect
            value={binding.targetLayerId}
            onChange={(v) => {
              const newTemplate = templates.find((t) => t.id === v)
              const firstKey =
                newTemplate?.customConfig.length
                  ? newTemplate.customConfig[0].key
                  : ''
              onUpdate({ targetLayerId: v, targetConfigKey: firstKey })
            }}
            options={templates.map((t) => ({ value: t.id, label: t.name || t.id }))}
            fullWidth
          />
        </div>

        {/* Delete */}
        <button
          onClick={onRemove}
          className="p-0.5 hover:bg-white/10 rounded text-white/30 hover:text-red-400 shrink-0"
          title="Remove binding"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Row 2: Config key + Transform + Row index */}
      <div className="flex items-center gap-1">
        {/* Config key select */}
        <div className="flex-1">
          <PanelSelect
            value={binding.targetConfigKey}
            onChange={(v) => onUpdate({ targetConfigKey: v })}
            options={configKeys.length === 0
              ? [{ value: '', label: 'No config keys' }]
              : configKeys.map((key) => ({ value: key, label: key }))
            }
            fullWidth
          />
        </div>

        {/* Transform select */}
        <div className="w-20">
          <PanelSelect
            value={binding.transform}
            onChange={(v) => onUpdate({ transform: v as DataTransform })}
            options={TRANSFORM_OPTIONS}
            fullWidth
          />
        </div>

        {/* Row index */}
        <div className="w-14">
          <PanelSelect
            value={binding.rowIndex === 'all' ? 'all' : String(binding.rowIndex)}
            onChange={(v) => {
              onUpdate({ rowIndex: v === 'all' ? 'all' : parseInt(v) || 0 })
            }}
            options={[
              { value: 'all', label: 'All' },
              ...Array.from({ length: Math.min(rowCount, 50) }, (_, i) => ({
                value: String(i),
                label: `#${i}`,
              })),
            ]}
            fullWidth
          />
        </div>
      </div>
    </div>
  )
}

export default DataSourcePanel
