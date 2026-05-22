import { useMemo } from 'react'
import { Square, Trash2, RotateCcw, Palette, Copy, Eye, EyeOff } from 'lucide-react'
import { ColorPicker } from '@/components/ui'
import { useShapeStore } from '@/stores/useShapeStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { recordPropertyChange } from '@/hooks/usePropertyRecorder'
import { cn } from '@/lib/utils'
import { BlendModeSelector } from '@/components/ui/BlendModeSelector'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'
import { BLUR_PRESETS } from '@/services/effects/blurEffect'
import { PanelSelect, PanelSlider } from '@/components/ui/panel-controls'
import type { GradientFill } from '@/types/gradient'

/** Extract a CSS-compatible color string from a fill value (solid string or GradientFill) */
function resolveFillString(fill: string | GradientFill): string {
  if (typeof fill === 'string') return fill
  return fill.stops?.[0]?.color ?? '#000000'
}

const SHAPE_TYPE_LABELS: Record<string, string> = {
  rectangle: 'Rectangle',
  circle: 'Circle',
  triangle: 'Triangle',
  star: 'Star',
}

export function ShapePropertiesPanel() {
  const selectedShapeId = useShapeStore((s) => s.selectedShapeId)
  const shapes = useShapeStore((s) => s.shapes)
  const updateShape = useShapeStore((s) => s.updateShape)
  const removeShape = useShapeStore((s) => s.removeShape)
  const duplicateShape = useShapeStore((s) => s.duplicateShape)
  const setSelectedShapeId = useShapeStore((s) => s.setSelectedShapeId)

  const liveTransform = useLiveTransformStore((s) => s.active)

  const shape = shapes.find((s) => s.id === selectedShapeId)

  // Use live transform values when actively manipulating
  const isLiveActive = liveTransform?.type === 'shape' && liveTransform?.id === shape?.id
  const displayValues = useMemo(() => {
    if (!shape) return null
    if (isLiveActive && liveTransform) {
      return {
        x: liveTransform.x,
        y: liveTransform.y,
        rotation: liveTransform.rotation,
        width: shape.width * (liveTransform.scale ?? 1),
        height: shape.height * (liveTransform.scale ?? 1),
        opacity: shape.opacity,
        zIndex: shape.zIndex,
      }
    }
    return {
      x: shape.position.x,
      y: shape.position.y,
      rotation: shape.rotation,
      width: shape.width,
      height: shape.height,
      opacity: shape.opacity,
      zIndex: shape.zIndex,
    }
  }, [shape, isLiveActive, liveTransform])

  if (!shape || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Square size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No shape selected</p>
        <p className="text-[10px] mt-1">Click a shape on the canvas or add one from the Media panel</p>
      </div>
    )
  }

  const handleReset = () => {
    updateShape(shape.id, {
      position: { x: 100, y: 100 },
      rotation: 0,
      opacity: 1,
      zIndex: 6,
    })
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Shape Preview */}
        <div className="w-14 h-14 bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-700/50 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            {shape.type === 'rectangle' && (
              <rect x="4" y="6" width="28" height="24" rx={Math.min(shape.borderRadius ?? 0, 6)} fill={resolveFillString(shape.fill)} stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'} strokeWidth={Math.min(shape.strokeWidth, 2)} />
            )}
            {shape.type === 'circle' && (
              <ellipse cx="18" cy="18" rx="14" ry="14" fill={resolveFillString(shape.fill)} stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'} strokeWidth={Math.min(shape.strokeWidth, 2)} />
            )}
            {shape.type === 'triangle' && (
              <polygon points="18,4 34,32 2,32" fill={resolveFillString(shape.fill)} stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'} strokeWidth={Math.min(shape.strokeWidth, 2)} strokeLinejoin="round" />
            )}
            {shape.type === 'star' && (() => {
              const cx = 18, cy = 18, outerR = 14
              const innerR = outerR * (shape.innerRadius ?? 0.4)
              const numPts = shape.points ?? 5
              const pts: string[] = []
              for (let i = 0; i < numPts * 2; i++) {
                const angle = (Math.PI * i) / numPts - Math.PI / 2
                const r = i % 2 === 0 ? outerR : innerR
                pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
              }
              return <polygon points={pts.join(' ')} fill={resolveFillString(shape.fill)} stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'} strokeWidth={Math.min(shape.strokeWidth, 2)} strokeLinejoin="round" />
            })()}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 truncate">{shape.name}</p>
          <p className="text-[10px] text-zinc-500">{SHAPE_TYPE_LABELS[shape.type] || shape.type}</p>
          <p className="text-[10px] text-zinc-600">{Math.round(shape.width)} × {Math.round(shape.height)}</p>
        </div>
      </div>

      {/* Transform Section */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', isLiveActive ? 'bg-green-400 animate-pulse' : 'bg-violet-400')} />
            <span className="text-sm text-zinc-300">Transform</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateShape(shape.id, { visible: !shape.visible })}
              className={cn(
                'p-1 rounded transition-colors',
                shape.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
              )}
              title={shape.visible ? 'Hide' : 'Show'}
            >
              {shape.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={handleReset}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset transform"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <div className={cn('p-3 space-y-3 bg-zinc-900/30', !shape.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <PanelSlider
            label="X"
            value={displayValues.x}
            onChange={(v) => {
              updateShape(shape.id, { position: { ...shape.position, x: v } })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'x', v, shape.position.x)
            }}
            min={-2000}
            max={2000}
            step={1}
            precision={1}
            compact
          />
          <PanelSlider
            label="Y"
            value={displayValues.y}
            onChange={(v) => {
              updateShape(shape.id, { position: { ...shape.position, y: v } })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'y', v, shape.position.y)
            }}
            min={-2000}
            max={2000}
            step={1}
            precision={1}
            compact
          />

          {/* Size */}
          <PanelSlider
            label="W"
            value={displayValues.width}
            onChange={(v) => {
              const val = Math.max(10, v)
              updateShape(shape.id, { width: val })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'width', val, shape.width)
            }}
            min={10}
            max={2000}
            step={1}
            precision={0}
            compact
          />
          <PanelSlider
            label="H"
            value={displayValues.height}
            onChange={(v) => {
              const val = Math.max(10, v)
              updateShape(shape.id, { height: val })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'height', val, shape.height)
            }}
            min={10}
            max={2000}
            step={1}
            precision={0}
            compact
          />

          {/* Rotation */}
          <PanelSlider
            label="Rotation"
            value={displayValues.rotation}
            onChange={(v) => {
              updateShape(shape.id, { rotation: v })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'rotation', v, shape.rotation)
            }}
            min={-180}
            max={180}
            step={1}
            precision={0}
            suffix="deg"
          />

          {/* Opacity */}
          <PanelSlider
            label="Opacity"
            value={displayValues.opacity * 100}
            onChange={(v) => {
              const val = Math.min(1, Math.max(0, v / 100))
              updateShape(shape.id, { opacity: val })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'opacity', val, shape.opacity)
            }}
            min={0}
            max={100}
            step={1}
            precision={0}
            suffix="%"
          />

          {/* Z-Index */}
          <PanelSlider
            label="Z-Index"
            value={displayValues.zIndex}
            onChange={(v) => {
              const val = Math.round(v)
              updateShape(shape.id, { zIndex: val })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'zIndex', val, shape.zIndex)
            }}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />
        </div>
      </div>

      {/* Appearance Section */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Palette size={12} className="text-zinc-400" />
            <span className="text-xs text-zinc-300">Appearance</span>
          </div>
        </div>

        <div className="p-3 space-y-3 bg-zinc-900/30">
          {/* Fill Color */}
          <div className="flex items-center gap-2">
            <ColorPicker color={resolveFillString(shape.fill)} onChange={(c) => updateShape(shape.id, { fill: c })} />
            <span className="text-xs text-zinc-400 flex-1">Fill</span>
            <span className="text-[10px] text-zinc-500 font-mono">{resolveFillString(shape.fill)}</span>
          </div>

          {/* Stroke Color */}
          <div className="flex items-center gap-2">
            <ColorPicker
              color={shape.stroke === 'transparent' ? '#000000' : shape.stroke}
              onChange={(c) => updateShape(shape.id, { stroke: c, strokeWidth: Math.max(shape.strokeWidth, 1) })}
            />
            <span className="text-xs text-zinc-400 flex-1">Stroke</span>
            {shape.stroke !== 'transparent' && (
              <button
                onClick={() => updateShape(shape.id, { stroke: 'transparent', strokeWidth: 0 })}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                title="Remove stroke"
              >
                none
              </button>
            )}
            <span className="text-[10px] text-zinc-500 font-mono">
              {shape.stroke === 'transparent' ? 'none' : shape.stroke}
            </span>
          </div>

          {/* Stroke Width */}
          {shape.stroke !== 'transparent' && (
            <PanelSlider
              label="Stroke Width"
              value={shape.strokeWidth}
              onChange={(v) => {
                const val = Math.max(0, v)
                updateShape(shape.id, { strokeWidth: val })
                recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'strokeWidth', val, shape.strokeWidth)
              }}
              min={0}
              max={50}
              step={1}
              precision={0}
              suffix="px"
            />
          )}

          {/* Rectangle: Corner Radius */}
          {shape.type === 'rectangle' && (
            <PanelSlider
              label="Corner Radius"
              value={shape.borderRadius ?? 0}
              onChange={(v) => {
                const val = Math.max(0, v)
                updateShape(shape.id, { borderRadius: val })
                recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'borderRadius', val, shape.borderRadius ?? 0)
              }}
              min={0}
              max={Math.min(shape.width, shape.height) / 2}
              step={1}
              precision={0}
              suffix="px"
            />
          )}

          {/* Star: Points */}
          {shape.type === 'star' && (
            <>
              <PanelSlider
                label="Points"
                value={shape.points ?? 5}
                onChange={(v) => updateShape(shape.id, { points: Math.max(3, Math.min(12, Math.round(v))) })}
                min={3}
                max={12}
                step={1}
                precision={0}
              />
              <PanelSlider
                label="Inner Radius"
                value={(shape.innerRadius ?? 0.4) * 100}
                onChange={(v) => {
                  const val = Math.min(0.9, Math.max(0.1, v / 100))
                  updateShape(shape.id, { innerRadius: val })
                  recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'innerRadius', val, shape.innerRadius ?? 0.4)
                }}
                min={10}
                max={90}
                step={5}
                precision={0}
                suffix="%"
              />
            </>
          )}

          {/* Blend Mode */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Blend Mode</span>
            <BlendModeSelector
              value={(shape.blendMode ?? 'source-over') as BlendMode}
              onChange={(mode) => updateShape(shape.id, { blendMode: mode })}
            />
          </div>

          {/* Blur */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Blur</span>
            <PanelSlider
              label="Amount"
              value={shape.blur ?? 0}
              onChange={(v) => updateShape(shape.id, { blur: Math.max(0, v) })}
              min={0}
              max={50}
              step={0.5}
              precision={1}
              suffix="px"
            />
            <PanelSelect
              value={shape.blurType ?? 'gaussian'}
              onChange={(v) => updateShape(shape.id, { blurType: v as BlurType })}
              options={[
                { value: 'gaussian', label: 'Gaussian' },
                { value: 'motion', label: 'Motion' },
                { value: 'tilt-shift', label: 'Tilt-Shift' },
              ]}
              fullWidth
            />
            {shape.blurType === 'motion' && (
              <PanelSlider
                label="Angle"
                value={shape.motionBlurAngle ?? 0}
                onChange={(v) => updateShape(shape.id, { motionBlurAngle: v })}
                min={0}
                max={360}
                step={1}
                precision={0}
                suffix="deg"
              />
            )}
            {(shape.blur ?? 0) > 0 && (
              <PanelSelect
                value=""
                onChange={(v) => {
                  const preset = BLUR_PRESETS.find((p) => p.label === v)
                  if (preset) {
                    updateShape(shape.id, {
                      blur: preset.blur,
                      blurType: preset.type as BlurType,
                      motionBlurAngle: preset.angle ?? 0,
                    })
                  }
                }}
                options={[
                  { value: '', label: 'Apply Preset...' },
                  ...BLUR_PRESETS.map((p) => ({ value: p.label, label: p.label })),
                ]}
                fullWidth
              />
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => duplicateShape(shape.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-colors"
          title="Duplicate shape"
        >
          <Copy size={12} />
          Duplicate
        </button>
        <button
          onClick={() => {
            removeShape(shape.id)
            setSelectedShapeId(null)
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
          title="Remove shape"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>

      {/* Other Shapes Quick Select */}
      {shapes.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-zinc-700/50">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Shapes</span>
          {shapes
            .filter((s) => s.id !== shape.id)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShapeId(s.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-left"
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: resolveFillString(s.fill) }}
                />
                <span className={cn('text-xs truncate', s.visible ? 'text-zinc-300' : 'text-zinc-600')}>
                  {s.name}
                </span>
                {!s.visible && <span className="text-[8px] text-zinc-600 ml-auto">hidden</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
