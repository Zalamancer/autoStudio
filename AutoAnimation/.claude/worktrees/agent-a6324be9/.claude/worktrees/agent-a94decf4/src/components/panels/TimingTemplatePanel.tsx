import React, { useState } from 'react'
import { useTimingTemplateStore } from '@/stores/useTimingTemplateStore'
import type { TimingTemplate } from '@/types/timingTemplate'
import type { CanvasObjectRef } from '@/types/keyframes'
import { applyTimingTemplate, extractTimingTemplate } from '@/services/timingTemplateService'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { TimingTemplatePreview } from '@/components/ui/TimingTemplatePreview'
import { Download, Upload, Save, Clock, Zap, RotateCcw, ArrowUp, ArrowDown, Sparkles, Repeat, ArrowLeftRight } from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  entrance: <ArrowUp size={12} />,
  exit: <ArrowDown size={12} />,
  emphasis: <Sparkles size={12} />,
  loop: <Repeat size={12} />,
  transition: <ArrowLeftRight size={12} />,
  custom: <Zap size={12} />,
}

const CATEGORY_LABELS: Record<string, string> = {
  entrance: 'Entrance',
  exit: 'Exit',
  emphasis: 'Emphasis',
  loop: 'Loop',
  transition: 'Transition',
  custom: 'Custom',
}

interface TimingTemplatePanelProps {
  selectedObjectRef?: CanvasObjectRef | null
}

export const TimingTemplatePanel: React.FC<TimingTemplatePanelProps> = ({ selectedObjectRef }) => {
  const { templates, addTemplate, removeTemplate, importTemplateFromJSON, exportTemplateAsJSON } = useTimingTemplateStore()
  const currentFrame = usePlaybackStore((s) => s.currentFrame)
  const [activeCategory, setActiveCategory] = useState<string>('entrance')
  const [durationOverride, setDurationOverride] = useState<string>('')
  const [_staggerFrames, _setStaggerFrames] = useState(5)
  const [saveName, setSaveName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const categories = ['entrance', 'exit', 'emphasis', 'loop', 'transition', 'custom']
  const filteredTemplates = templates.filter((t) => t.category === activeCategory)

  const handleApply = (template: TimingTemplate) => {
    if (!selectedObjectRef) return
    const dur = durationOverride ? parseInt(durationOverride) : undefined
    // Get current values for relative mode
    const currentValues = useKeyframeStore.getState().getInterpolatedValues(selectedObjectRef, currentFrame)
    applyTimingTemplate(template, selectedObjectRef, currentFrame, dur, currentValues)
  }

  const handleSaveCurrent = () => {
    if (!selectedObjectRef || !saveName) return
    try {
      const template = extractTimingTemplate(selectedObjectRef, saveName, 'custom')
      addTemplate(template)
      setSaveName('')
      setShowSaveDialog(false)
    } catch {
      // No keyframes to extract
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        importTemplateFromJSON(reader.result as string)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleExport = (id: string) => {
    const json = exportTemplateAsJSON(id)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'timing-template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-800">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              activeCategory === cat
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'bg-zinc-800/50 text-zinc-400 border border-transparent hover:border-zinc-700'
            }`}
          >
            {CATEGORY_ICONS[cat]}
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredTemplates.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-8">
            No templates in this category
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-200">{template.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                    <Clock size={10} />
                    {template.defaultDuration}f
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mb-2">{template.description}</p>

              {/* Mini preview */}
              <TimingTemplatePreview template={template} className="mb-2" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleApply(template)}
                  disabled={!selectedObjectRef}
                  className="flex-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
                {template.source === 'user' && (
                  <>
                    <button
                      onClick={() => handleExport(template.id)}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Export"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={() => removeTemplate(template.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom controls */}
      <div className="border-t border-zinc-800 p-2 space-y-2">
        {/* Duration override */}
        <PanelSlider
          label="Duration"
          value={durationOverride ? parseInt(durationOverride) : 0}
          onChange={(v) => setDurationOverride(v > 0 ? String(v) : '')}
          min={0}
          max={300}
          step={1}
          suffix="f"
          compact
        />

        {/* Save / Import buttons */}
        <div className="flex gap-1.5">
          {showSaveDialog ? (
            <div className="flex gap-1 flex-1">
              <input
                type="text"
                placeholder="Template name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCurrent()
                  if (e.key === 'Escape') setShowSaveDialog(false)
                }}
              />
              <button
                onClick={handleSaveCurrent}
                disabled={!saveName || !selectedObjectRef}
                className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-30"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={!selectedObjectRef}
              className="flex items-center gap-1 flex-1 px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 transition-colors"
            >
              <Save size={12} />
              Save Current
            </button>
          )}
          <button
            onClick={handleImport}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <Upload size={12} />
            Import
          </button>
        </div>
      </div>
    </div>
  )
}
