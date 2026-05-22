import React from 'react'
import { useMaskStore, type MaskType } from '@/stores/useMaskStore'
import type { CanvasObjectRef } from '@/types/keyframes'
import { Trash2, Edit3, EyeOff, Eye, Square, Circle, Spline, Layers } from 'lucide-react'
import { PanelSlider, PanelCheckbox } from '@/components/ui/panel-controls'

const MASK_TYPES: { value: MaskType; label: string; icon: React.ReactNode }[] = [
  { value: 'rectangle', label: 'Rectangle', icon: <Square size={14} /> },
  { value: 'ellipse', label: 'Ellipse', icon: <Circle size={14} /> },
  { value: 'path', label: 'Path', icon: <Spline size={14} /> },
  { value: 'layer', label: 'Layer', icon: <Layers size={14} /> },
]

interface MaskPanelProps {
  objectRef: CanvasObjectRef
  maskId?: string
  onMaskIdChange: (maskId: string | undefined) => void
}

export const MaskPanel: React.FC<MaskPanelProps> = ({ objectRef, maskId, onMaskIdChange }) => {
  const { masks: _masks, addMask, updateMask, removeMask, activeEditingMaskId: _activeEditingMaskId, getMaskById } = useMaskStore()
  const mask = maskId ? getMaskById(maskId) : undefined

  const handleAddMask = (type: MaskType) => {
    const newMaskId = addMask(type, objectRef)
    onMaskIdChange(newMaskId)
  }

  const handleRemoveMask = () => {
    if (maskId) {
      removeMask(maskId)
      onMaskIdChange(undefined)
    }
  }

  if (!mask) {
    return (
      <div className="p-3">
        <div className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Add Mask</div>
        <div className="grid grid-cols-2 gap-1.5">
          {MASK_TYPES.map((mt) => (
            <button
              key={mt.value}
              onClick={() => handleAddMask(mt.value)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-blue-500/50 hover:text-blue-400 transition-colors text-xs"
            >
              {mt.icon}
              {mt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Mask ({mask.type})
        </span>
        <button
          onClick={handleRemoveMask}
          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Remove Mask"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Position */}
      {mask.type !== 'layer' && (
        <div className="grid grid-cols-2 gap-2">
          <PanelSlider
            label="X"
            inline
            value={Math.round(mask.position.x)}
            min={-1920}
            max={3840}
            step={1}
            onChange={(v) => updateMask(mask.id, { position: { ...mask.position, x: v } })}
          />
          <PanelSlider
            label="Y"
            inline
            value={Math.round(mask.position.y)}
            min={-1080}
            max={2160}
            step={1}
            onChange={(v) => updateMask(mask.id, { position: { ...mask.position, y: v } })}
          />
        </div>
      )}

      {/* Size */}
      {(mask.type === 'rectangle' || mask.type === 'ellipse') && (
        <div className="grid grid-cols-2 gap-2">
          <PanelSlider
            label="W"
            inline
            value={Math.round(mask.width)}
            min={1}
            max={3840}
            step={1}
            onChange={(v) => updateMask(mask.id, { width: Math.max(1, v) })}
          />
          <PanelSlider
            label="H"
            inline
            value={Math.round(mask.height)}
            min={1}
            max={2160}
            step={1}
            onChange={(v) => updateMask(mask.id, { height: Math.max(1, v) })}
          />
        </div>
      )}

      {/* Rotation */}
      {mask.type !== 'layer' && (
        <PanelSlider
          label="Rotation"
          value={mask.rotation}
          min={-360}
          max={360}
          step={1}
          suffix="°"
          compact
          onChange={(v) => updateMask(mask.id, { rotation: v })}
        />
      )}

      {/* Feather */}
      <PanelSlider
        label="Feather"
        value={mask.feather}
        onChange={(v) => updateMask(mask.id, { feather: v })}
        min={0}
        max={100}
        step={1}
        suffix="px"
        compact
      />

      {/* Expansion */}
      <PanelSlider
        label="Expansion"
        value={mask.expansion}
        onChange={(v) => updateMask(mask.id, { expansion: v })}
        min={-100}
        max={100}
        step={1}
        suffix="px"
        compact
      />

      {/* Opacity */}
      <PanelSlider
        label="Opacity"
        value={mask.opacity}
        onChange={(v) => updateMask(mask.id, { opacity: v })}
        min={0}
        max={1}
        step={0.01}
        precision={0}
        compact
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      {/* Invert toggle */}
      <PanelCheckbox
        label="Invert Mask"
        checked={mask.inverted}
        onChange={(v) => updateMask(mask.id, { inverted: v })}
        icon={mask.inverted ? EyeOff : Eye}
      />

      {/* Edit on Canvas */}
      <button
        onClick={() => useMaskStore.setState({ activeEditingMaskId: mask.id })}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-colors text-xs"
      >
        <Edit3 size={14} />
        Edit on Canvas
      </button>
    </div>
  )
}
