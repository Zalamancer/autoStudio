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
  onRecordProperty?: (key: string, newValue: number, previousValue: number) => void
  zIndex?: number
  onZIndexChange?: (value: number) => void
  draggable?: boolean
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
        'rounded-lg overflow-hidden transition-colors border',
        isDragOver ? 'border-[#4a7eff]/60 bg-[#4a7eff]/5' : 'border-white/5',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header — Cinema thick row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors cursor-pointer select-none',
          !transform.visible && 'opacity-50',
        )}
      >
        {draggable && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors -ml-1 shrink-0"
          >
            <GripVertical size={14} />
          </div>
        )}
        {isExpanded ? (
          <ChevronDown size={14} className="text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500" />
        )}
        <div className={cn('w-2 h-2 rounded-full shrink-0', color)} />
        <span className="flex-1 text-xs font-medium text-gray-200 text-left">{label}</span>
        <button
          onClick={handleToggleVisibility}
          className={cn(
            'p-1 rounded transition-colors',
            transform.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400',
          )}
        >
          {transform.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={cn('px-3 py-2.5', !transform.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-gray-400 text-sm shrink-0 w-16">Position</span>
            <div className="flex-1 flex gap-1.5">
              <PanelSlider
                label=""
                value={transform.x}
                onChange={(v) => {
                  onChange({ x: v })
                  onRecordProperty?.('x', v, transform.x)
                }}
                min={-2000}
                max={2000}
                step={1}
                precision={0}
                inline
                className="flex-1"
              />
              <PanelSlider
                label=""
                value={transform.y}
                onChange={(v) => {
                  onChange({ y: v })
                  onRecordProperty?.('y', v, transform.y)
                }}
                min={-2000}
                max={2000}
                step={1}
                precision={0}
                inline
                className="flex-1"
              />
            </div>
          </div>

          {/* Scale */}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-gray-400 text-sm shrink-0 w-16">Scale</span>
            <div className="flex-1 relative">
              <div className="flex gap-1.5">
                <PanelSlider
                  label=""
                  value={Math.round(transform.scaleX * 100)}
                  onChange={(v) => {
                    const val = v / 100
                    if (scaleLocked) {
                      const ratio = transform.scaleX !== 0 ? val / transform.scaleX : 1
                      const sy = Math.max(0.1, Math.min(5, transform.scaleY * ratio))
                      onChange({ scaleX: val, scaleY: sy })
                      onRecordProperty?.('scaleX', val, transform.scaleX)
                      onRecordProperty?.('scaleY', sy, transform.scaleY)
                    } else {
                      onChange({ scaleX: val })
                      onRecordProperty?.('scaleX', val, transform.scaleX)
                    }
                  }}
                  min={10}
                  max={500}
                  step={1}
                  precision={0}
                  inline
                  className="flex-1"
                />
                <PanelSlider
                  label=""
                  value={Math.round(transform.scaleY * 100)}
                  onChange={(v) => {
                    const val = v / 100
                    if (scaleLocked) {
                      const ratio = transform.scaleY !== 0 ? val / transform.scaleY : 1
                      const sx = Math.max(0.1, Math.min(5, transform.scaleX * ratio))
                      onChange({ scaleX: sx, scaleY: val })
                      onRecordProperty?.('scaleX', sx, transform.scaleX)
                      onRecordProperty?.('scaleY', val, transform.scaleY)
                    } else {
                      onChange({ scaleY: val })
                      onRecordProperty?.('scaleY', val, transform.scaleY)
                    }
                  }}
                  min={10}
                  max={500}
                  step={1}
                  precision={0}
                  inline
                  className="flex-1"
                />
              </div>
              {/* Lock icon — floats centered between the two pills */}
              <button
                onClick={() => setScaleLocked(!scaleLocked)}
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
                  scaleLocked
                    ? 'text-[#4a7eff] bg-[#2a2a2a] border-[#4a7eff]/30'
                    : 'text-zinc-600 bg-[#2a2a2a] border-white/5 hover:text-zinc-400',
                )}
              >
                {scaleLocked ? <Link size={10} /> : <Unlink size={10} />}
              </button>
            </div>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-gray-400 text-sm shrink-0 w-16">Rotation</span>
            <div className="flex-1 flex gap-1.5">
              <PanelSlider
                label=""
                value={transform.rotation}
                onChange={(v) => {
                  onChange({ rotation: v })
                  onRecordProperty?.('rotation', v, transform.rotation)
                }}
                min={-180}
                max={180}
                step={1}
                precision={0}
                inline
                className="flex-1"
              />
            </div>
          </div>

          {/* Z-Index */}
          {zIndex !== undefined && onZIndexChange && (
            <div className="flex items-center gap-3 mb-1">
              <span className="text-gray-400 text-sm shrink-0 w-16">Z-Index</span>
              <div className="flex-1 flex gap-1.5">
                <PanelSlider
                  label=""
                  value={zIndex}
                  onChange={(v) => onZIndexChange(Math.round(v))}
                  min={0}
                  max={100}
                  step={1}
                  precision={0}
                  inline
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
