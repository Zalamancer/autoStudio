/**
 * WhiteboardStrokePropertiesPanel
 *
 * Right panel for editing a selected whiteboard stroke's easing curve,
 * duration, color, and width. Features an interactive cubic bezier
 * curve editor with draggable control points.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { PanelSlider, PanelSelect, PanelToggle } from '@/components/ui/panel-controls'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { useTimelineStore } from '@/stores'
import type { WhiteboardStroke, WhiteboardConfig } from '@/services/whiteboardAnimation'

// ── Easing presets with their bezier values ──
const EASING_PRESETS: { value: WhiteboardStroke['easing']; label: string; bezier?: [number, number, number, number] }[] = [
  { value: 'linear', label: 'Linear', bezier: [0, 0, 1, 1] },
  { value: 'ease-in', label: 'Ease In', bezier: [0.42, 0, 1, 1] },
  { value: 'ease-out', label: 'Ease Out', bezier: [0, 0, 0.58, 1] },
  { value: 'ease-in-out', label: 'Ease In Out', bezier: [0.42, 0, 0.58, 1] },
  { value: 'ease-in-cubic', label: 'Ease In Cubic', bezier: [0.32, 0, 0.67, 0] },
  { value: 'ease-out-cubic', label: 'Ease Out Cubic', bezier: [0.33, 1, 0.68, 1] },
  { value: 'ease-in-out-cubic', label: 'Ease In Out Cubic', bezier: [0.65, 0, 0.35, 1] },
  { value: 'ease-out-back', label: 'Ease Out Back', bezier: [0.34, 1.56, 0.64, 1] },
  { value: 'ease-in-expo', label: 'Ease In Expo', bezier: [0.7, 0, 0.84, 0] },
  { value: 'ease-out-expo', label: 'Ease Out Expo', bezier: [0.16, 1, 0.3, 1] },
  { value: 'custom', label: 'Custom Bezier' },
]

// ── Bezier Curve Editor SVG ──
function BezierCurveEditor({
  bezier,
  onChange,
}: {
  bezier: [number, number, number, number]
  onChange: (b: [number, number, number, number]) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<1 | 2 | null>(null)
  const [x1, y1, x2, y2] = bezier

  // SVG viewBox: 0,0 to 1,1 but we use padding
  const pad = 0.12
  const toSvgX = (v: number) => pad + v * (1 - 2 * pad)
  const toSvgY = (v: number) => 1 - pad - v * (1 - 2 * pad)
  const fromSvg = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const rawX = (clientX - rect.left) / rect.width
    const rawY = (clientY - rect.top) / rect.height
    const x = Math.max(0, Math.min(1, (rawX - pad) / (1 - 2 * pad)))
    const y = Math.max(-0.5, Math.min(1.5, (1 - rawY - pad) / (1 - 2 * pad)))
    return { x, y }
  }, [])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => {
      const { x, y } = fromSvg(e.clientX, e.clientY)
      const xClamped = Math.round(x * 100) / 100
      const yClamped = Math.round(y * 100) / 100
      if (dragging === 1) onChange([xClamped, yClamped, x2, y2])
      else onChange([x1, y1, xClamped, yClamped])
    }
    const handleUp = () => setDragging(null)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, x1, y1, x2, y2, onChange, fromSvg])

  // Generate curve path
  const pathD = `M ${toSvgX(0)} ${toSvgY(0)} C ${toSvgX(x1)} ${toSvgY(y1)}, ${toSvgX(x2)} ${toSvgY(y2)}, ${toSvgX(1)} ${toSvgY(1)}`

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1 1"
      className="w-full aspect-square rounded-lg border border-white/5 cursor-crosshair"
      style={{ background: 'var(--color-surface-lowest)' }}
    >
      {/* Grid */}
      <rect x={toSvgX(0)} y={toSvgY(1)} width={toSvgX(1) - toSvgX(0)} height={toSvgY(0) - toSvgY(1)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.005" />
      <line x1={toSvgX(0.5)} y1={toSvgY(0)} x2={toSvgX(0.5)} y2={toSvgY(1)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.003" />
      <line x1={toSvgX(0)} y1={toSvgY(0.5)} x2={toSvgX(1)} y2={toSvgY(0.5)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.003" />

      {/* Diagonal reference (linear) */}
      <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(1)} y2={toSvgY(1)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.003" strokeDasharray="0.015 0.01" />

      {/* Control point lines */}
      <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(x1)} y2={toSvgY(y1)} stroke="rgba(255,255,255,0.25)" strokeWidth="0.005" />
      <line x1={toSvgX(1)} y1={toSvgY(1)} x2={toSvgX(x2)} y2={toSvgY(y2)} stroke="rgba(255,255,255,0.25)" strokeWidth="0.005" />

      {/* Curve */}
      <path d={pathD} fill="none" stroke="#4a7eff" strokeWidth="0.012" />

      {/* Start/end points */}
      <circle cx={toSvgX(0)} cy={toSvgY(0)} r="0.018" fill="#71717a" />
      <circle cx={toSvgX(1)} cy={toSvgY(1)} r="0.018" fill="#71717a" />

      {/* Control point 1 (draggable) */}
      <circle
        cx={toSvgX(x1)} cy={toSvgY(y1)} r="0.028"
        fill="#4a7eff" stroke="#fff" strokeWidth="0.006"
        className="cursor-grab"
        onMouseDown={(e) => { e.preventDefault(); setDragging(1) }}
      />

      {/* Control point 2 (draggable) */}
      <circle
        cx={toSvgX(x2)} cy={toSvgY(y2)} r="0.028"
        fill="#4a7eff" stroke="#fff" strokeWidth="0.006"
        className="cursor-grab"
        onMouseDown={(e) => { e.preventDefault(); setDragging(2) }}
      />
    </svg>
  )
}

export function WhiteboardStrokePropertiesPanel() {
  const selectedStrokeId = useWhiteboardStore((s) => s.selectedStrokeId)
  const strokes = useWhiteboardStore((s) => s.config.strokes)
  const updateStroke = useWhiteboardStore((s) => s.updateStroke)
  const config = useWhiteboardStore((s) => s.config)
  const setLineCap = useWhiteboardStore((s) => s.setLineCap)
  const setLineJoin = useWhiteboardStore((s) => s.setLineJoin)
  const fps = useTimelineStore((s) => s.fps)

  const stroke = strokes.find((s) => s.id === selectedStrokeId)
  if (!stroke) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <p className="text-xs">No stroke selected</p>
        <p className="text-[10px] mt-1">Select a stroke on the timeline to edit its properties</p>
      </div>
    )
  }

  const isInstant = stroke.startFrame === 0 && stroke.endFrame === 0
  const duration = isInstant ? 0 : (stroke.endFrame - stroke.startFrame) / fps
  const currentEasing = stroke.easing || 'linear'
  const currentBezier: [number, number, number, number] = stroke.easingBezier ?? [0.42, 0, 0.58, 1]

  // Get display bezier for the preset
  const presetBezier = EASING_PRESETS.find((p) => p.value === currentEasing)?.bezier ?? currentBezier

  const handleEasingChange = (value: string) => {
    const easing = value as WhiteboardStroke['easing']
    updateStroke(stroke.id, { easing })
    // When switching to a preset, clear custom bezier
    if (easing !== 'custom') {
      updateStroke(stroke.id, { easingBezier: undefined })
    }
  }

  const handleBezierChange = (b: [number, number, number, number]) => {
    updateStroke(stroke.id, { easing: 'custom', easingBezier: b })
  }

  const handleDurationChange = (newDuration: number) => {
    const newEndFrame = stroke.startFrame + Math.round(newDuration * fps)
    updateStroke(stroke.id, { endFrame: newEndFrame })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">
          {stroke.isEraser ? 'Eraser' : stroke.textContent ? `Text: ${stroke.textContent.substring(0, 20)}` : 'Stroke'} Properties
        </h2>

        {/* Easing selector */}
        <PanelSelect
          label="Transition"
          value={currentEasing || 'linear'}
          onChange={handleEasingChange}
          options={EASING_PRESETS.map((p) => ({ label: p.label, value: p.value! }))}
        />

        {/* Duration */}
        {!isInstant && (
          <div className="mt-3">
            <PanelSlider
              label="Duration"
              min={0.1}
              max={10}
              step={0.1}
              value={duration}
              onChange={handleDurationChange}
            />
          </div>
        )}
      </div>

      {/* ── Curve Editor ───────────────────────────────────────── */}
      {!isInstant && !stroke.isEraser && (
        <div className="p-4 border-b border-white/5 space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Curve</h4>
          <BezierCurveEditor
            bezier={currentEasing === 'custom' ? currentBezier : presetBezier}
            onChange={handleBezierChange}
          />

          {/* Control point values */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 w-12">Control 1</span>
              <span className="text-[10px] text-accent font-mono">
                X {(currentEasing === 'custom' ? currentBezier[0] : presetBezier[0]).toFixed(2)}
              </span>
              <span className="text-[10px] text-accent font-mono">
                Y {(currentEasing === 'custom' ? currentBezier[1] : presetBezier[1]).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 w-12">Control 2</span>
              <span className="text-[10px] text-accent font-mono">
                X {(currentEasing === 'custom' ? currentBezier[2] : presetBezier[2]).toFixed(2)}
              </span>
              <span className="text-[10px] text-accent font-mono">
                Y {(currentEasing === 'custom' ? currentBezier[3] : presetBezier[3]).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Appearance ─────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Appearance</h4>

        {/* Color picker + quick colors */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Color</span>
          <input
            type="color"
            value={stroke.color}
            onChange={(e) => updateStroke(stroke.id, { color: e.target.value })}
            className="w-6 h-5 rounded border border-white/10 cursor-pointer bg-transparent"
          />
          <span className="text-[10px] text-zinc-500 font-mono">{stroke.color}</span>
        </div>
        <div className="flex items-center gap-1.5 pl-[calc(80px+12px)]">
          {['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#000000'].map((c) => (
            <button
              key={c}
              onClick={() => updateStroke(stroke.id, { color: c })}
              className={`w-5 h-5 rounded border transition-colors ${
                stroke.color === c ? 'border-accent ring-1 ring-accent/30' : 'border-white/10 hover:border-white/20'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Width */}
        <PanelSlider
          label="Width"
          min={0.5}
          max={30}
          step={0.5}
          value={stroke.strokeWidth}
          onChange={(v) => updateStroke(stroke.id, { strokeWidth: v })}
          suffix="px"
        />

        {/* Line Cap */}
        <PanelSelect
          label="Line Cap"
          value={config.lineCap}
          onChange={(v) => setLineCap(v as WhiteboardConfig['lineCap'])}
          options={[
            { value: 'round', label: 'Round' },
            { value: 'butt', label: 'Butt' },
            { value: 'square', label: 'Square' },
          ]}
        />

        {/* Line Join */}
        <PanelSelect
          label="Line Join"
          value={config.lineJoin}
          onChange={(v) => setLineJoin(v as WhiteboardConfig['lineJoin'])}
          options={[
            { value: 'round', label: 'Round' },
            { value: 'bevel', label: 'Bevel' },
            { value: 'miter', label: 'Miter' },
          ]}
        />
      </div>

      {/* ── Pen Style (per-stroke) ─────────────────────────────── */}
      {stroke.penStyle && !stroke.isEraser && (
        <div className="p-4 border-b border-white/5 space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Pen Style</h4>
          <PanelSlider
            label="Pen Size"
            min={1} max={30} step={0.5}
            value={stroke.penStyle.size}
            onChange={(v) => updateStroke(stroke.id, { penStyle: { ...stroke.penStyle!, size: v } })}
            suffix="px"
          />
          <PanelSlider
            label="Thinning"
            min={-1} max={1} step={0.05}
            value={stroke.penStyle.thinning}
            onChange={(v) => updateStroke(stroke.id, { penStyle: { ...stroke.penStyle!, thinning: v } })}
          />
          <PanelSlider
            label="Smoothing"
            min={0} max={1} step={0.05}
            value={stroke.penStyle.smoothing}
            onChange={(v) => updateStroke(stroke.id, { penStyle: { ...stroke.penStyle!, smoothing: v } })}
          />
          <PanelSlider
            label="Streamline"
            min={0} max={1} step={0.05}
            value={stroke.penStyle.streamline}
            onChange={(v) => updateStroke(stroke.id, { penStyle: { ...stroke.penStyle!, streamline: v } })}
          />
          <PanelToggle
            label="Simulate Pressure"
            checked={stroke.penStyle.simulatePressure}
            onChange={(v) => updateStroke(stroke.id, { penStyle: { ...stroke.penStyle!, simulatePressure: v } })}
          />
          <PanelSlider
            label="Taper Start"
            min={0} max={50} step={1}
            value={stroke.penStyle.taperStart}
            onChange={(v) => updateStroke(stroke.id, { penStyle: { ...stroke.penStyle!, taperStart: v } })}
            suffix="px"
          />
          <PanelSlider
            label="Taper End"
            min={0} max={50} step={1}
            value={stroke.penStyle.taperEnd}
            onChange={(v) => updateStroke(stroke.id, { penStyle: { ...stroke.penStyle!, taperEnd: v } })}
            suffix="px"
          />
        </div>
      )}

      {/* ── Timing ─────────────────────────────────────────────── */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase mb-3">Timing</h4>
        <div className="text-[10px] text-zinc-500 space-y-0.5">
          <div>Start: frame {stroke.startFrame}</div>
          <div>End: frame {stroke.endFrame}</div>
          {!isInstant && <div>Duration: {duration.toFixed(2)}s ({stroke.endFrame - stroke.startFrame} frames)</div>}
          {isInstant && <div>Mode: Instant (visible at all frames)</div>}
        </div>
      </div>
    </div>
  )
}
