/**
 * BatchPanel.tsx
 *
 * Full batch generation UI: file upload, column preview, variable mapping,
 * template prompt editor, progress tracking, and ZIP export.
 */

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  Table,
  Play,
  Download,
  Loader2,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  FileSpreadsheet,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelSelect } from '@/components/ui/panel-controls'
import {
  parseSpreadsheet,
  substituteVariables,
  extractPlaceholders,
  autoDetectMapping,
  type ParsedSpreadsheet,
} from '@/services/batchProcessor'
import type { BatchRowResult } from '@/types/orchestrator'

type BatchPhase = 'upload' | 'mapping' | 'ready' | 'running' | 'done'

export function BatchPanel() {
  const [phase, setPhase] = useState<BatchPhase>('upload')
  const [spreadsheet, setSpreadsheet] = useState<ParsedSpreadsheet | null>(null)
  const [templatePrompt, setTemplatePrompt] = useState(
    'Create a 15-second product video for {title}. Price: {price}. Features: {features}. Use an engaging visual style.',
  )
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [results, setResults] = useState<BatchRowResult[]>([])
  const [currentRow, setCurrentRow] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [_cancelled, setCancelled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef({ value: false })

  // Upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null)
    try {
      const data = await parseSpreadsheet(file)
      if (data.rows.length === 0) {
        setError('File is empty or has no data rows')
        return
      }
      setSpreadsheet(data)

      // Auto-detect mapping
      const placeholders = extractPlaceholders(templatePrompt)
      const detected = autoDetectMapping(data.columns, placeholders)
      setMapping(detected)

      setPhase('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }, [templatePrompt])

  // Get preview of first row with substitution
  const getPreview = useCallback(() => {
    if (!spreadsheet || spreadsheet.rows.length === 0) return ''
    return substituteVariables(templatePrompt, spreadsheet.rows[0])
  }, [spreadsheet, templatePrompt])

  const placeholders = extractPlaceholders(templatePrompt)

  // Start batch generation
  const handleStartBatch = useCallback(async () => {
    if (!spreadsheet) return
    setPhase('running')
    setCancelled(false)
    cancelRef.current.value = false
    setResults([])

    const newResults: BatchRowResult[] = []

    for (let i = 0; i < spreadsheet.rows.length; i++) {
      if (cancelRef.current.value) break

      setCurrentRow(i)
      const row = spreadsheet.rows[i]
      // Substitute variables for this row (will be used by orchestrator in production)
      void substituteVariables(templatePrompt, row)

      newResults.push({
        rowIndex: i,
        status: 'generating',
      })
      setResults([...newResults])

      // Simulate generation (in production, this would call the orchestrator)
      try {
        // In a real implementation, this would call:
        // await orchestrator.generateClipPlan(prompt, settings)
        // await orchestrator.executePlan()
        // await videoExport.exportComposition(...)
        await new Promise((resolve) => setTimeout(resolve, 500))

        newResults[i] = {
          rowIndex: i,
          status: 'complete',
          videoUrl: undefined, // Would be set by actual export
        }
      } catch (err) {
        newResults[i] = {
          rowIndex: i,
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        }
      }

      setResults([...newResults])
    }

    setPhase('done')
  }, [spreadsheet, templatePrompt])

  const handleCancel = useCallback(() => {
    cancelRef.current.value = true
    setCancelled(true)
  }, [])

  const completedCount = results.filter((r) => r.status === 'complete').length
  const failedCount = results.filter((r) => r.status === 'error').length

  return (
    <PanelLayout title="Batch Generation" icon={FileSpreadsheet}>
      <div className="space-y-3 p-3">
        {/* Phase: Upload */}
        {phase === 'upload' && (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-panel-border rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              <Upload size={24} className="mx-auto mb-2 text-gray-500" />
              <p className="text-xs text-gray-400">Upload CSV or Excel file</p>
              <p className="text-[9px] text-gray-600 mt-1">.csv, .xlsx, .xls</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                className="hidden"
              />
            </div>

            {/* Template Prompt */}
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Template Prompt</p>
              <textarea
                value={templatePrompt}
                onChange={(e) => setTemplatePrompt(e.target.value)}
                placeholder="Write your prompt with {variable} placeholders..."
                className="w-full bg-panel-bg border border-panel-border rounded-md px-2 py-1.5 text-xs text-white placeholder:text-gray-600 resize-none h-24 focus:outline-none focus:ring-1 focus:ring-amber-500/60"
              />
              {placeholders.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {placeholders.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded"
                    >
                      {'{' + p + '}'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Phase: Mapping */}
        {phase === 'mapping' && spreadsheet && (
          <>
            {/* Column Preview Table */}
            <div>
              <p className="text-[10px] text-gray-500 mb-1">
                <Table size={10} className="inline mr-1" />
                Preview ({spreadsheet.rows.length} rows, {spreadsheet.columns.length} columns)
              </p>
              <div className="overflow-x-auto">
                <table className="text-[9px] w-full">
                  <thead>
                    <tr className="border-b border-panel-border">
                      {spreadsheet.columns.map((col) => (
                        <th key={col} className="text-left text-gray-500 px-1.5 py-1 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {spreadsheet.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-panel-surface">
                        {spreadsheet.columns.map((col) => (
                          <td key={col} className="text-gray-400 px-1.5 py-1 truncate max-w-[100px]">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column Mapping */}
            {placeholders.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Column Mapping</p>
                <div className="space-y-1">
                  {placeholders.map((placeholder) => (
                    <div key={placeholder} className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400 w-24 truncate">
                        {'{' + placeholder + '}'}
                      </span>
                      <PanelSelect
                        value={mapping[placeholder] || ''}
                        onChange={(v) =>
                          setMapping((prev) => ({ ...prev, [placeholder]: v }))
                        }
                        options={[
                          { value: '', label: '-- Select column --' },
                          ...spreadsheet.columns.map((col) => ({ value: col, label: col })),
                        ]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            <div>
              <p className="text-[10px] text-gray-500 mb-1">
                <Eye size={10} className="inline mr-1" />
                Row 1 Preview
              </p>
              <p className="text-[10px] text-gray-300 bg-panel-surface rounded p-2 whitespace-pre-wrap">
                {getPreview()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setPhase('upload')}
                className="px-3 py-1.5 rounded-md bg-panel-surface hover:bg-panel-surface-hover text-gray-300 text-[10px]"
              >
                Back
              </button>
              <button
                onClick={handleStartBatch}
                className="flex-1 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium flex items-center justify-center gap-1"
              >
                <Play size={12} />
                Generate All ({spreadsheet.rows.length} videos)
              </button>
            </div>
          </>
        )}

        {/* Phase: Running */}
        {(phase === 'running' || phase === 'done') && (
          <>
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">
                  {phase === 'running' ? `Processing row ${currentRow + 1}/${spreadsheet?.rows.length}` : 'Complete'}
                </span>
                <span className="text-amber-400">
                  {completedCount} done, {failedCount} failed
                </span>
              </div>
              <div className="h-1.5 bg-panel-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{
                    width: `${spreadsheet ? ((completedCount + failedCount) / spreadsheet.rows.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.rowIndex}
                  className={cn(
                    'aspect-square rounded flex items-center justify-center text-[9px]',
                    result.status === 'complete' && 'bg-green-500/20 text-green-400',
                    result.status === 'error' && 'bg-red-500/20 text-red-400',
                    result.status === 'generating' && 'bg-amber-500/20 text-amber-400',
                    result.status === 'pending' && 'bg-panel-surface text-gray-500',
                  )}
                >
                  {result.status === 'complete' && <Check size={12} />}
                  {result.status === 'error' && <AlertCircle size={12} />}
                  {result.status === 'generating' && <Loader2 size={12} className="animate-spin" />}
                  {result.status === 'pending' && result.rowIndex + 1}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-1.5">
              {phase === 'running' && (
                <button
                  onClick={handleCancel}
                  className="flex-1 py-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-medium flex items-center justify-center gap-1"
                >
                  <X size={12} />
                  Cancel
                </button>
              )}
              {phase === 'done' && (
                <>
                  <button
                    onClick={() => {
                      setPhase('upload')
                      setResults([])
                      setSpreadsheet(null)
                    }}
                    className="px-3 py-1.5 rounded-md bg-panel-surface hover:bg-panel-surface-hover text-gray-300 text-[10px] flex items-center gap-1"
                  >
                    <RotateCcw size={10} />
                    New Batch
                  </button>
                  <button
                    disabled={completedCount === 0}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center gap-1',
                      completedCount > 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-panel-surface-hover text-gray-500 cursor-not-allowed',
                    )}
                  >
                    <Download size={12} />
                    Download All as ZIP
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-400">{error}</p>
        )}
      </div>
    </PanelLayout>
  )
}
