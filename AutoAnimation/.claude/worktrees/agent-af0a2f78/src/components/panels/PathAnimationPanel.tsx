import React from 'react'
import { usePathStore } from '@/stores/usePathStore'
import { useCanvasStore } from '@/stores'
import type { CanvasObjectRef, EasingType } from '@/types/keyframes'
import type { PathType } from '@/engine/path'
import { PathPresets } from '@/engine/path'
import { Route, Trash2, Edit3 } from 'lucide-react'
import { PanelSelect, PanelCheckbox, PanelSlider } from '@/components/ui/panel-controls'

const PATH_TYPES: { value: PathType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'cubic-bezier', label: 'Cubic Bezier' },
  { value: 'quadratic-bezier', label: 'Quadratic Bezier' },
  { value: 'catmull-rom', label: 'Catmull-Rom' },
  { value: 'arc', label: 'Arc' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'figure-eight', label: 'Figure Eight' },
  { value: 'spiral', label: 'Spiral' },
]

const PRESET_NAMES: { value: keyof typeof PathPresets; label: string }[] = [
  { value: 'sCurve', label: 'S-Curve' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'bouncingArc', label: 'Bouncing Arc' },
  { value: 'figureEight', label: 'Figure Eight' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'zigzag', label: 'Zigzag' },
  { value: 'wave', label: 'Wave' },
]

const EASING_OPTIONS: EasingType[] = [
  'linear', 'ease-in', 'ease-out', 'ease-in-out',
  'spring-light', 'spring-medium', 'elastic-out', 'bounce-out',
  'back-out', 'expo-out', 'material', 'snappy',
]

interface PathAnimationPanelProps {
  objectRef: CanvasObjectRef
}

export const PathAnimationPanel: React.FC<PathAnimationPanelProps> = ({ objectRef }) => {
  const { paths: _paths, addPath, updatePath, removePath, setActiveEditingPath, applyPreset, getPathForObject } = usePathStore()
  const { width: canvasWidth, height: canvasHeight } = useCanvasStore()

  const existingPath = getPathForObject(objectRef)

  const handleAddPath = () => {
    const defaultConfig = PathPresets.sCurve(canvasWidth, canvasHeight)
    addPath(objectRef, defaultConfig)
  }

  if (!existingPath) {
    return (
      <div className="p-3">
        <button
          onClick={handleAddPath}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
        >
          <Route size={16} />
          Add Path Animation
        </button>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Path Animation
        </span>
        <button
          onClick={() => removePath(existingPath.id)}
          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Remove Path"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Path type */}
      <PanelSelect
        label="Path Type"
        value={existingPath.config.type}
        onChange={(v) => {
          const newType = v as PathType
          const defaultPoints = newType === 'cubic-bezier'
            ? [
                { x: 0, y: canvasHeight / 2 },
                { x: canvasWidth * 0.33, y: canvasHeight * 0.2 },
                { x: canvasWidth * 0.66, y: canvasHeight * 0.8 },
                { x: canvasWidth, y: canvasHeight / 2 },
              ]
            : newType === 'quadratic-bezier'
            ? [
                { x: 0, y: canvasHeight / 2 },
                { x: canvasWidth / 2, y: 0 },
                { x: canvasWidth, y: canvasHeight / 2 },
              ]
            : [
                { x: canvasWidth / 2, y: canvasHeight / 2 },
              ]
          updatePath(existingPath.id, {
            config: {
              ...existingPath.config,
              type: newType,
              points: defaultPoints,
              radiusX: Math.min(canvasWidth, canvasHeight) * 0.3,
              radiusY: Math.min(canvasWidth, canvasHeight) * 0.2,
            },
          })
        }}
        options={PATH_TYPES}
        fullWidth
      />

      {/* Presets */}
      <PanelSelect
        label="Preset"
        value=""
        onChange={(v) => {
          if (v) {
            applyPreset(existingPath.id, v as keyof typeof PathPresets, canvasWidth, canvasHeight)
          }
        }}
        options={[
          { value: '', label: 'Apply preset...' },
          ...PRESET_NAMES,
        ]}
        fullWidth
      />

      {/* Frame range */}
      <div className="grid grid-cols-2 gap-2">
        <PanelSlider
          label="Start"
          inline
          value={existingPath.startFrame}
          min={0}
          max={9999}
          step={1}
          onChange={(v) => updatePath(existingPath.id, { startFrame: v })}
        />
        <PanelSlider
          label="End"
          inline
          value={existingPath.endFrame}
          min={0}
          max={9999}
          step={1}
          onChange={(v) => updatePath(existingPath.id, { endFrame: v })}
        />
      </div>

      {/* Easing */}
      <PanelSelect
        label="Easing"
        value={existingPath.easing}
        onChange={(v) => updatePath(existingPath.id, { easing: v as EasingType })}
        options={EASING_OPTIONS.map((e) => ({ value: e, label: e }))}
        fullWidth
      />

      {/* Toggles */}
      <div className="space-y-2">
        <PanelCheckbox
          label="Auto-Rotate"
          checked={existingPath.autoRotate}
          onChange={(v) => updatePath(existingPath.id, { autoRotate: v })}
        />
        <PanelCheckbox
          label="Constant Speed"
          checked={existingPath.constantSpeed}
          onChange={(v) => updatePath(existingPath.id, { constantSpeed: v })}
        />
        <PanelCheckbox
          label="Loop"
          checked={existingPath.loop}
          onChange={(v) => updatePath(existingPath.id, { loop: v })}
        />
      </div>

      {/* Edit on Canvas button */}
      <button
        onClick={() => setActiveEditingPath(existingPath.id)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-colors text-xs"
      >
        <Edit3 size={14} />
        Edit on Canvas
      </button>
    </div>
  )
}
