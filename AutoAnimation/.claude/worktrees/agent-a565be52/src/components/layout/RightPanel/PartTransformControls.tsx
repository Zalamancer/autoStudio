import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, GripVertical, Link, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSlider } from '@/components/ui/panel-controls'

export interface PartTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
}

interface PartTransformControlsProps {
  label: string
  transform: PartTransform
  onChange: (transform: Partial<PartTransform>) => void
  color?: string
  defaultExpanded?: boolean
  /** Optional callback to record property keyframes (only wired for the group part) */
  onRecordProperty?: (key: string, newValue: number, previousValue: number) => void
  /** Optional z-index value + setter to render inside the transform panel */
  zIndex?: number
  onZIndexChange?: (value: number) => void
  /** Show drag handle for layer reordering */
  draggable?: boolean
  /** Whether this item is currently being dragged over */
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

export function PartTransformControls({
  label,
  transform,
  onChange,
  color = 'bg-[#4a7eff]',
  defaultExpanded = false,
  onRecordProperty,
  zIndex,
  onZIndexChange,
  draggable = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: PartTransformControlsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [scaleLocked, setScaleLocked] = useState(true)

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({ visible: !transform.visible })
  }

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-colors',
        isDragOver ? 'border-[#4a7eff]/60 bg-[#4a7eff]/5' : 'border-white/5'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors cursor-pointer select-none',
          !transform.visible && 'opacity-50'
        )}
      >
        {/* Drag Handle */}
        {draggable && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors -ml-1 flex-shrink-0"
            title="Drag to reorder layers"
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Expand/Collapse Icon */}
        {isExpanded ? (
          <ChevronDown size={14} className="text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500" />
        )}

        {/* Color Indicator */}
        <div className={cn('w-2 h-2 rounded-full', color)} />

        {/* Label */}
        <span className="flex-1 text-sm text-zinc-300 text-left">{label}</span>

        {/* Visibility Toggle */}
        <button
          onClick={handleToggleVisibility}
          className={cn(
            'p-1 rounded transition-colors',
            transform.visible
              ? 'text-zinc-400 hover:text-zinc-200'
              : 'text-zinc-600 hover:text-zinc-400'
          )}
        >
          {transform.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={cn('px-3 py-2.5 space-y-3', !transform.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <PanelSlider
            label="X"
            value={transform.x}
            onChange={(v) => {
              onChange({ x: v })
              onRecordProperty?.('x', v, transform.x)
            }}
            min={-2000}
            max={2000}
            step={1}
            precision={1}
            compact
          />
          <PanelSlider
            label="Y"
            value={transform.y}
            onChange={(v) => {
              onChange({ y: v })
              onRecordProperty?.('y', v, transform.y)
            }}
            min={-2000}
            max={2000}
            step={1}
            precision={1}
            compact
          />

          {/* Rotation */}
          <PanelSlider
            label="Rotation"
            value={transform.rotation}
            onChange={(v) => {
              onChange({ rotation: v })
              onRecordProperty?.('rotation', v, transform.rotation)
            }}
            min={-180}
            max={180}
            step={1}
            precision={0}
            suffix="°"
          />

          {/* Scale */}
          <div className="relative">
            <PanelSlider
              label="W"
              value={transform.scaleX * 100}
              onChange={(v) => {
                const val = v / 100
                if (scaleLocked) {
                  const ratio = transform.scaleX !== 0 ? val / transform.scaleX : 1
                  const newScaleY = Math.max(0.1, Math.min(5, transform.scaleY * ratio))
                  onChange({ scaleX: val, scaleY: newScaleY })
                  onRecordProperty?.('scaleX', val, transform.scaleX)
                  onRecordProperty?.('scaleY', newScaleY, transform.scaleY)
                } else {
                  onChange({ scaleX: val })
                  onRecordProperty?.('scaleX', val, transform.scaleX)
                }
              }}
              min={10}
              max={500}
              step={1}
              suffix="%"
              precision={0}
              compact
            />
            <PanelSlider
              label="H"
              value={transform.scaleY * 100}
              onChange={(v) => {
                const val = v / 100
                if (scaleLocked) {
                  const ratio = transform.scaleY !== 0 ? val / transform.scaleY : 1
                  const newScaleX = Math.max(0.1, Math.min(5, transform.scaleX * ratio))
                  onChange({ scaleX: newScaleX, scaleY: val })
                  onRecordProperty?.('scaleX', newScaleX, transform.scaleX)
                  onRecordProperty?.('scaleY', val, transform.scaleY)
                } else {
                  onChange({ scaleY: val })
                  onRecordProperty?.('scaleY', val, transform.scaleY)
                }
              }}
              min={10}
              max={500}
              step={1}
              suffix="%"
              precision={0}
              compact
            />
            {/* Lock icon */}
            <button
              onClick={() => setScaleLocked(!scaleLocked)}
              className={cn(
                'absolute top-1/2 right-0 -translate-y-1/2 z-10 p-1 rounded-full border transition-colors',
                scaleLocked
                  ? 'text-[#4a7eff] bg-[#2a2a2a] border-[#4a7eff]/30'
                  : 'text-zinc-600 bg-[#2a2a2a] border-white/5 hover:text-zinc-400'
              )}
              title={scaleLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {scaleLocked ? <Link size={12} /> : <Unlink size={12} />}
            </button>
          </div>

          {/* Z-Index (only shown when prop is provided) */}
          {zIndex !== undefined && onZIndexChange && (
            <PanelSlider
              label="Z-Index"
              value={zIndex}
              onChange={(v) => onZIndexChange(Math.round(v))}
              min={0}
              max={100}
              step={1}
              precision={0}
            />
          )}
        </div>
      )}
    </div>
  )
}
