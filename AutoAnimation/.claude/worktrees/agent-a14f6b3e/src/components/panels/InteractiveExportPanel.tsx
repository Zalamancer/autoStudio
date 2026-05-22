/**
 * Interactive Export Panel
 *
 * UI for configuring and exporting interactive HTML bundles with
 * click/hover triggers, scene transitions, and playback controls.
 */

import { useState } from 'react'
import { useInteractiveExportStore } from '@/stores/useInteractiveExportStore'
import { PanelSelect, PanelCheckbox } from '@/components/ui/panel-controls'
import type { InteractiveExportConfig } from '@/types/interactiveExport'

export function InteractiveExportPanel() {
  const {
    scenes,
    config,
    exportStatus,
    error,
    updateConfig,
    setExportStatus,
  } = useInteractiveExportStore()

  const [exportProgress, setExportProgress] = useState(0)

  const handleExport = async () => {
    setExportStatus('building')
    setExportProgress(0)

    try {
      // Dynamically import the exporter to avoid bundle bloat
      const { exportInteractiveBundle } = await import('@/services/interactiveExporter')
      const { buildCompositionPropsFromStores } = await import('@/services/compositionBuilder')

      setExportProgress(30)

      // Build composition props from current state
      const props = buildCompositionPropsFromStores()
      setExportProgress(60)

      // Generate the bundle
      const blob = exportInteractiveBundle(
        props,
        'ProAnimate Interactive',
        config,
      )
      setExportProgress(90)

      // Download the file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = config.format === 'json-manifest'
        ? 'interactive-manifest.json'
        : 'interactive-player.html'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportProgress(100)
      setExportStatus('complete')
    } catch (err) {
      console.error('[InteractiveExport] Export failed:', err)
      setExportStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-white">Interactive Export</h2>
        <p className="text-xs text-gray-400 mt-1">
          Export as an interactive HTML experience with click/hover triggers.
        </p>
      </div>

      {/* Format selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">Output Format</label>
        <div className="flex gap-2">
          <button
            onClick={() => updateConfig({ format: 'html-bundle' })}
            className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
              config.format === 'html-bundle'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            HTML Bundle
          </button>
          <button
            onClick={() => updateConfig({ format: 'json-manifest' })}
            className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
              config.format === 'json-manifest'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            JSON Manifest
          </button>
        </div>
      </div>

      {/* Player settings */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Player Settings</label>

        <PanelSelect
          label="Theme"
          value={config.playerTheme}
          onChange={(v) => updateConfig({ playerTheme: v as InteractiveExportConfig['playerTheme'] })}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'transparent', label: 'Transparent' },
          ]}
          fullWidth
        />

        <PanelCheckbox
          label="Show playback controls"
          checked={config.showControls}
          onChange={(v) => updateConfig({ showControls: v })}
        />

        <PanelCheckbox
          label="Autoplay on load"
          checked={config.autoplay}
          onChange={(v) => updateConfig({ autoplay: v })}
        />

        <PanelCheckbox
          label="Loop animation"
          checked={config.loop}
          onChange={(v) => updateConfig({ loop: v })}
        />
      </div>

      {/* Advanced settings */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Advanced</label>

        <PanelCheckbox
          label="Inline assets (single file)"
          checked={config.inlineAssets}
          onChange={(v) => updateConfig({ inlineAssets: v })}
        />

        <PanelCheckbox
          label="Minify output"
          checked={config.minify}
          onChange={(v) => updateConfig({ minify: v })}
        />
      </div>

      {/* Scenes summary */}
      {scenes.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Scenes ({scenes.length})</label>
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="flex items-center gap-2 bg-gray-800/30 rounded px-2 py-1"
            >
              <span className="text-xs text-gray-300">{scene.name}</span>
              <span className="text-[10px] text-gray-500">
                {scene.layers.length} layers
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exportStatus === 'building'}
        className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-wait text-white text-sm font-medium rounded transition-colors"
      >
        {exportStatus === 'building'
          ? `Exporting... ${exportProgress}%`
          : exportStatus === 'complete'
            ? 'Export Again'
            : 'Export Interactive Bundle'}
      </button>

      {/* Progress bar */}
      {exportStatus === 'building' && (
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}

      {/* Success message */}
      {exportStatus === 'complete' && (
        <div className="text-xs text-green-400 bg-green-500/10 rounded px-2 py-1.5">
          Export complete! File has been downloaded.
        </div>
      )}

      {/* Error message */}
      {(exportStatus === 'error' || error) && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1.5">
          {error || 'Export failed. Please try again.'}
        </div>
      )}
    </div>
  )
}
