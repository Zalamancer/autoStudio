import { useCallback } from 'react'
import {
  ArrowUpRight,
  Circle,
  Square,
  Highlighter,
  Type,
  Eraser,
  PenTool,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  MousePointer,
} from 'lucide-react'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelSlider } from '@/components/ui/panel-controls'
import {
  useAnnotationStore,
  type AnnotationAnimation,
  type AnnotationTool,
} from '@/stores/useAnnotationStore'
import { usePlaybackStore } from '@/stores'

// ── Tool definitions ──────────────────────────────────────────────────

interface ToolDef {
  type: AnnotationTool
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const TOOLS: ToolDef[] = [
  { type: null, label: 'Select', icon: MousePointer },
  { type: 'arrow', label: 'Arrow', icon: ArrowUpRight },
  { type: 'circle', label: 'Circle', icon: Circle },
  { type: 'rectangle', label: 'Rectangle', icon: Square },
  { type: 'highlight', label: 'Highlight', icon: Highlighter },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'blur', label: 'Blur', icon: Eraser },
  { type: 'freehand', label: 'Freehand', icon: PenTool },
]

const COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#000000', // black
]

const ANIMATIONS: { value: AnnotationAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'draw', label: 'Draw' },
]

// ── Component ─────────────────────────────────────────────────────────

export function AnnotationPanel() {
  const annotations = useAnnotationStore((s) => s.annotations)
  const selectedAnnotationId = useAnnotationStore((s) => s.selectedAnnotationId)
  const activeTool = useAnnotationStore((s) => s.activeTool)
  const style = useAnnotationStore((s) => s.style)
  const setTool = useAnnotationStore((s) => s.setTool)
  const setColor = useAnnotationStore((s) => s.setColor)
  const setThickness = useAnnotationStore((s) => s.setThickness)
  const setOpacity = useAnnotationStore((s) => s.setOpacity)
  const setAnimation = useAnnotationStore((s) => s.setAnimation)
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation)
  const toggleVisibility = useAnnotationStore((s) => s.toggleVisibility)
  const setSelectedAnnotation = useAnnotationStore((s) => s.setSelectedAnnotation)
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation)
  const duplicateAnnotation = useAnnotationStore((s) => s.duplicateAnnotation)
  const clearAnnotations = useAnnotationStore((s) => s.clearAnnotations)
  const fps = usePlaybackStore((s) => s.fps)

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId)

  const handleFrameChange = useCallback(
    (field: 'startFrame' | 'endFrame', value: string) => {
      if (!selectedAnnotationId) return
      const num = parseInt(value, 10)
      if (!isNaN(num) && num >= 0) {
        updateAnnotation(selectedAnnotationId, { [field]: num })
      }
    },
    [selectedAnnotationId, updateAnnotation],
  )

  const frameToSec = (frame: number) => (frame / (fps || 30)).toFixed(1)

  return (
    <PanelLayout title="Annotations" icon={PenTool}>
      {/* Tool Selector */}
      <div className="space-y-3">
        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Drawing Tool</label>
        <div className="grid grid-cols-4 gap-1.5">
          {TOOLS.map(({ type, label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setTool(type)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] transition-colors ${
                activeTool === type
                  ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
              title={label}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style Controls */}
      <div className="space-y-3 mt-4">
        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Style</label>

        {/* Color Picker */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-zinc-500">Color</span>
          <div className="flex items-center gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  style.color === color ? 'border-white scale-110' : 'border-transparent hover:border-white/30'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <input
              type="color"
              value={style.color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border border-zinc-600"
              title="Custom color"
            />
          </div>
        </div>

        {/* Thickness */}
        <PanelSlider
          label="Thickness"
          value={style.thickness}
          onChange={setThickness}
          min={1}
          max={20}
          step={1}
          suffix="px"
          compact
        />

        {/* Opacity */}
        <PanelSlider
          label="Opacity"
          value={style.opacity}
          onChange={setOpacity}
          min={0.1}
          max={1}
          step={0.05}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          compact
        />

        {/* Animation Mode */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-zinc-500">Animation</span>
          <div className="flex gap-1.5">
            {ANIMATIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAnimation(value)}
                className={`flex-1 py-1.5 text-[11px] rounded-md transition-colors ${
                  style.animation === value
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Annotations List */}
      <div className="space-y-2 mt-5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            Annotations ({annotations.length})
          </label>
          {annotations.length > 0 && (
            <button
              onClick={clearAnnotations}
              className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {annotations.length === 0 ? (
          <p className="text-[11px] text-zinc-600 text-center py-4">
            Select a tool and draw on the canvas to add annotations.
          </p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {annotations.map((annotation) => {
              const isSelected = selectedAnnotationId === annotation.id
              const TypeIcon = TOOLS.find((t) => t.type === annotation.type)?.icon ?? PenTool

              return (
                <div
                  key={annotation.id}
                  onClick={() => setSelectedAnnotation(annotation.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-green-500/10 ring-1 ring-green-500/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Color dot + type icon */}
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: annotation.color + '30' }}
                  >
                    <TypeIcon size={11} className="text-zinc-300" />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-zinc-300 truncate capitalize">
                      {annotation.type}
                      {annotation.type === 'text' && annotation.textContent
                        ? `: ${annotation.textContent}`
                        : ''}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {frameToSec(annotation.startFrame)}s - {frameToSec(annotation.endFrame)}s
                    </div>
                  </div>

                  {/* Per-annotation animation badge */}
                  {annotation.animation !== 'none' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                      {annotation.animation}
                    </span>
                  )}

                  {/* Actions */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(annotation.id) }}
                    className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                    title={annotation.visible ? 'Hide' : 'Show'}
                  >
                    {annotation.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateAnnotation(annotation.id) }}
                    className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeAnnotation(annotation.id) }}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected annotation properties */}
      {selectedAnnotation && (
        <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
          <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            Selected: {selectedAnnotation.type}
          </label>

          {/* Frame range */}
          <div className="grid grid-cols-2 gap-2">
            <PanelSlider
              label="Start"
              inline
              value={selectedAnnotation.startFrame}
              min={0}
              max={9999}
              step={1}
              onChange={(v) => handleFrameChange('startFrame', String(v))}
            />
            <PanelSlider
              label="End"
              inline
              value={selectedAnnotation.endFrame}
              min={0}
              max={9999}
              step={1}
              onChange={(v) => handleFrameChange('endFrame', String(v))}
            />
          </div>

          {/* Per-annotation animation */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500">Animation</span>
            <div className="flex gap-1.5">
              {ANIMATIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateAnnotation(selectedAnnotation.id, { animation: value })}
                  className={`flex-1 py-1.5 text-[10px] rounded-md transition-colors ${
                    selectedAnnotation.animation === value
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-annotation color */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500">Color</span>
            <div className="flex items-center gap-1.5">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateAnnotation(selectedAnnotation.id, { color })}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    selectedAnnotation.color === color ? 'border-white scale-110' : 'border-transparent hover:border-white/30'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Per-annotation opacity */}
          <PanelSlider
            label="Opacity"
            value={selectedAnnotation.opacity}
            onChange={(v) => updateAnnotation(selectedAnnotation.id, { opacity: v })}
            min={0.1}
            max={1}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            compact
          />

          {/* Text content (for text annotations) */}
          {selectedAnnotation.type === 'text' && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500">Text Content</span>
              <input
                type="text"
                value={selectedAnnotation.textContent ?? ''}
                onChange={(e) => updateAnnotation(selectedAnnotation.id, { textContent: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-green-500/50"
              />
            </div>
          )}

          {/* Blur radius (for blur annotations) */}
          {selectedAnnotation.type === 'blur' && (
            <PanelSlider
              label="Blur Radius"
              value={selectedAnnotation.blurRadius ?? 10}
              onChange={(v) => updateAnnotation(selectedAnnotation.id, { blurRadius: v })}
              min={2}
              max={30}
              step={1}
              suffix="px"
              compact
            />
          )}
        </div>
      )}
    </PanelLayout>
  )
}
