/**
 * Figma Import Panel
 *
 * UI for importing designs from Figma via the ProAnimate Figma plugin.
 * Supports drag-and-drop of exported ZIP files, direct plugin bridge
 * via postMessage, and manual layer mapping.
 */

import { useState, useEffect, useCallback } from 'react'
import type { FigmaImportResult, FigmaLayerMapping, FigmaPartType } from '@/types/figmaPlugin'
import {
  listenForFigmaMessages,
  convertToCharacterConfig,
  autoMapLayers,
} from '@/services/figmaImporter'
import { PanelSelect, PanelCheckbox } from '@/components/ui/panel-controls'

const PART_TYPE_OPTIONS: { value: FigmaPartType; label: string }[] = [
  { value: 'body', label: 'Body' },
  { value: 'head', label: 'Head' },
  { value: 'hair', label: 'Hair' },
  { value: 'eye', label: 'Eye' },
  { value: 'eyebrow', label: 'Eyebrow' },
  { value: 'viseme-rest', label: 'Mouth (Rest)' },
  { value: 'viseme-ai', label: 'Mouth (AI)' },
  { value: 'viseme-e', label: 'Mouth (E)' },
  { value: 'viseme-o', label: 'Mouth (O)' },
  { value: 'viseme-u', label: 'Mouth (U)' },
  { value: 'viseme-mbp', label: 'Mouth (MBP)' },
  { value: 'viseme-fv', label: 'Mouth (FV)' },
  { value: 'viseme-lth', label: 'Mouth (LTH)' },
  { value: 'background', label: 'Background' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'svg-object', label: 'SVG Object' },
]

export function FigmaImportPanel() {
  const [importResult, setImportResult] = useState<FigmaImportResult | null>(null)
  const [layerMappings, setLayerMappings] = useState<FigmaLayerMapping[]>([])
  const [isListening, setIsListening] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')

  // Listen for Figma plugin messages
  useEffect(() => {
    if (!isListening) return

    const cleanup = listenForFigmaMessages((result) => {
      setImportResult(result)
      setImportStatus('success')

      // Auto-generate layer mappings from the imported parts
      const layers = Object.entries(result.parts)
        .filter(([, v]) => v !== null)
        .map(([key], idx) => ({
          nodeId: `layer_${idx}`,
          name: key,
        }))
      setLayerMappings(autoMapLayers(layers))
    })

    return cleanup
  }, [isListening])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    setImportStatus('importing')

    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find((f) => f.name.endsWith('.json'))

    if (jsonFile) {
      try {
        const text = await jsonFile.text()
        const data = JSON.parse(text) as FigmaImportResult
        setImportResult(data)
        setImportStatus('success')
      } catch {
        setImportStatus('error')
      }
    } else {
      setImportStatus('error')
    }
  }, [])

  const handleLayerTypeChange = (index: number, partType: FigmaPartType) => {
    setLayerMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, partType } : m)),
    )
  }

  const handleLayerToggle = (index: number) => {
    setLayerMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, enabled: !m.enabled } : m)),
    )
  }

  const handleImportAsCharacter = () => {
    if (!importResult) return

    const config = convertToCharacterConfig(importResult)
    // Dispatch to character config store
    console.log('[FigmaImport] Importing character:', config.name, config)
    setImportStatus('success')
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-white">Figma Import</h2>
        <p className="text-xs text-gray-400 mt-1">
          Import designs from Figma as characters, backgrounds, or SVG objects.
        </p>
      </div>

      {/* Plugin listener toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Figma Plugin Bridge</span>
        <button
          onClick={() => setIsListening(!isListening)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            isListening
              ? 'bg-green-600/20 text-green-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {isListening ? 'Listening' : 'Start Listening'}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <p className="text-sm text-gray-400">
          Drop exported Figma JSON here
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Or use the Figma plugin to send directly
        </p>
      </div>

      {/* Import status */}
      {importStatus === 'importing' && (
        <div className="text-xs text-yellow-400">Processing import...</div>
      )}
      {importStatus === 'error' && (
        <div className="text-xs text-red-400">
          Failed to import. Please check the file format.
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-xs font-medium text-white">{importResult.characterName}</h3>
            <div className="text-[10px] text-gray-400 mt-1">
              {importResult.dimensions.width} x {importResult.dimensions.height}px
              {importResult.metadata.fileName && (
                <> | {importResult.metadata.fileName}</>
              )}
            </div>
          </div>

          {/* Layer mappings */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Layer Mappings
            </h3>

            {layerMappings.map((mapping, index) => (
              <div
                key={mapping.nodeId}
                className="flex items-center gap-2 bg-gray-800/30 rounded px-2 py-1.5"
              >
                <PanelCheckbox
                  label={mapping.layerName}
                  checked={mapping.enabled}
                  onChange={() => handleLayerToggle(index)}
                />
                <PanelSelect
                  value={mapping.partType}
                  onChange={(v) => handleLayerTypeChange(index, v as FigmaPartType)}
                  options={PART_TYPE_OPTIONS}
                />
              </div>
            ))}
          </div>

          {/* Import actions */}
          <div className="flex gap-2">
            <button
              onClick={handleImportAsCharacter}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              Import as Character
            </button>
            <button
              onClick={() => { setImportResult(null); setLayerMappings([]); setImportStatus('idle') }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-auto pt-4 border-t border-gray-800">
        <h3 className="text-xs font-medium text-gray-400 mb-2">Figma Layer Naming</h3>
        <div className="flex flex-col gap-1 text-[10px] text-gray-500">
          <span><code className="text-gray-400">body</code> - Character body/torso</span>
          <span><code className="text-gray-400">head</code> - Character head/face</span>
          <span><code className="text-gray-400">hair</code> - Hair overlay</span>
          <span><code className="text-gray-400">mouth-rest</code> - Closed mouth</span>
          <span><code className="text-gray-400">mouth-ai</code> - Open mouth (AH)</span>
          <span><code className="text-gray-400">eye</code> - Eye sprites</span>
          <span><code className="text-gray-400">bg</code> - Background layer</span>
        </div>
      </div>
    </div>
  )
}
