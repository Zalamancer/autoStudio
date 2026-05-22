/**
 * Sketch-to-Animation Panel
 *
 * Upload hand-drawn sketches, preview AI analysis, configure settings,
 * and generate animations from the detected scene elements.
 */

import { useRef, useCallback } from 'react'
import { PanelSelect, PanelCheckbox, PanelSlider } from '@/components/ui/panel-controls'
import { sanitizeSvg } from '@/services/sanitize'
import { useSketchToAnimationStore } from '@/stores/useSketchToAnimationStore'
import type { SketchPipelineStatus } from '@/types/sketchToAnimation'

const STATUS_LABELS: Record<SketchPipelineStatus, string> = {
  idle: 'Ready',
  uploading: 'Uploading...',
  analyzing: 'Analyzing sketch...',
  'generating-plan': 'Building animation plan...',
  vectorizing: 'Converting to SVG...',
  'generating-characters': 'Generating characters...',
  'building-scene': 'Building scene...',
  complete: 'Complete',
  error: 'Error',
}

export function SketchToAnimationPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    sketchImage,
    analysis,
    clipPlan,
    vectorSvg,
    pipelineStatus,
    statusDetail,
    error,
    config,
    setSketchImage,
    processSketch,
    updateConfig,
    reset,
  } = useSketchToAnimationStore()

  const isProcessing = !['idle', 'complete', 'error'].includes(pipelineStatus)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setSketchImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [setSketchImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      setSketchImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [setSketchImage])

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-white">Sketch to Animation</h2>
        <p className="text-xs text-gray-400 mt-1">
          Upload a hand-drawn sketch and AI will convert it into an animated scene.
        </p>
      </div>

      {/* Upload area */}
      {!sketchImage ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
        >
          <div className="text-3xl text-gray-600 mb-2">+</div>
          <p className="text-sm text-gray-400">
            Drop sketch image here
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports PNG, JPG, or photo of whiteboard
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <>
          {/* Sketch preview */}
          <div className="relative">
            <img
              src={sketchImage}
              alt="Uploaded sketch"
              className="w-full rounded-lg border border-gray-700"
            />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-800/80 hover:bg-gray-700 rounded-full text-gray-400 text-xs flex items-center justify-center"
            >
              x
            </button>
          </div>

          {/* Configuration */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Settings
            </h3>

            <PanelCheckbox
              label="Vectorize to clean SVG"
              checked={config.vectorize}
              onChange={(v) => updateConfig({ vectorize: v })}
            />

            <PanelCheckbox
              label="Generate characters"
              checked={config.generateCharacters}
              onChange={(v) => updateConfig({ generateCharacters: v })}
            />

            <PanelCheckbox
              label="Generate background"
              checked={config.generateBackground}
              onChange={(v) => updateConfig({ generateBackground: v })}
            />

            <PanelCheckbox
              label="Generate dialogue from speech bubbles"
              checked={config.generateDialogue}
              onChange={(v) => updateConfig({ generateDialogue: v })}
            />

            <PanelSlider
              label="Duration"
              value={config.targetDuration}
              onChange={(v) => updateConfig({ targetDuration: v })}
              min={5}
              max={120}
              step={1}
              suffix="s"
            />

            <PanelSelect
              label="Style"
              value={config.styleOverride || ''}
              onChange={(v) =>
                updateConfig({
                  styleOverride: (v || undefined) as 'cartoon' | 'realistic' | 'minimal' | 'sketch' | undefined,
                })
              }
              options={[
                { value: '', label: 'Auto-detect' },
                { value: 'cartoon', label: 'Cartoon' },
                { value: 'realistic', label: 'Realistic' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'sketch', label: 'Sketch' },
              ]}
            />
          </div>

          {/* Process button */}
          <button
            onClick={processSketch}
            disabled={isProcessing}
            className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-wait text-white text-sm font-medium rounded transition-colors"
          >
            {isProcessing ? STATUS_LABELS[pipelineStatus] : 'Analyze & Generate'}
          </button>

          {/* Status */}
          {isProcessing && statusDetail && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-blue-400">{statusDetail}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1.5">
              {error}
            </div>
          )}

          {/* Analysis results */}
          {analysis && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Analysis Results
              </h3>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-300">{analysis.sceneDescription}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                    {analysis.suggestedStyle}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                    {analysis.suggestedMood}
                  </span>
                  {analysis.isStoryboard && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                      Storyboard ({analysis.panels?.length} panels)
                    </span>
                  )}
                </div>
              </div>

              {/* Detected characters */}
              {analysis.characters.length > 0 && (
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">
                    Characters ({analysis.characters.length})
                  </span>
                  {analysis.characters.map((char, i) => (
                    <div key={i} className="bg-gray-800/30 rounded px-2 py-1.5 mt-1">
                      <span className="text-xs text-white font-medium">{char.name}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{char.description}</p>
                      {char.speechText && (
                        <p className="text-[10px] text-yellow-400 mt-0.5 italic">
                          &quot;{char.speechText}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Detected objects */}
              {analysis.objects.length > 0 && (
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">
                    Objects ({analysis.objects.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.objects.map((obj, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded"
                      >
                        {obj.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vectorized SVG preview */}
          {vectorSvg && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase">Vectorized SVG</span>
              <div
                className="w-full bg-white rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg(vectorSvg) }}
              />
            </div>
          )}

          {/* Generated plan */}
          {clipPlan && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-green-400">Plan Ready</h3>
              <div className="text-[10px] text-gray-400">
                {clipPlan.characters.length} characters,{' '}
                {clipPlan.dialogue.length} dialogue lines,{' '}
                {clipPlan.textOverlays.length} text overlays,{' '}
                {clipPlan.svgObjects?.length || 0} SVG objects
              </div>
              <button
                onClick={() => {
                  // This would trigger the orchestrator with the generated plan
                  console.log('[SketchToAnimation] Executing plan:', clipPlan)
                }}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
              >
                Execute Animation Plan
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
