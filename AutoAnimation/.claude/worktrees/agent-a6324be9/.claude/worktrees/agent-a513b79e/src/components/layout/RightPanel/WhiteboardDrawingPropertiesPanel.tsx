/**
 * WhiteboardDrawingPropertiesPanel
 *
 * Right panel showing properties for the active drawing brush —
 * color, pen preset, size, thinning, smoothing, streamline,
 * pressure, and taper settings. Updates live as you adjust.
 */

import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { ColorPicker } from '@/components/ui'
import { PanelSlider, PanelToggle, PanelSelect } from '@/components/ui/panel-controls'
import { PEN_PRESETS } from '@/services/progressiveDrawing'
import { ALL_TOOLS } from '@/components/canvas/WhiteboardToolbar'
import type { WhiteboardConfig } from '@/services/whiteboardAnimation'

const LINE_CAP_OPTIONS: WhiteboardConfig['lineCap'][] = ['round', 'butt', 'square']
const LINE_JOIN_OPTIONS: WhiteboardConfig['lineJoin'][] = ['round', 'bevel', 'miter']

export function WhiteboardDrawingPropertiesPanel() {
  const activeBrush = useWhiteboardStore((s) => s.activeBrush ?? 'pen')
  const drawingColor = useWhiteboardStore((s) => s.drawingColor ?? '#ffffff')
  const setDrawingColor = useWhiteboardStore((s) => s.setDrawingColor)
  const penPreset = useWhiteboardStore((s) => s.drawingPenPreset)
  const pen = useWhiteboardStore((s) => s.drawingPenStyle)
  const setDrawingPenPreset = useWhiteboardStore((s) => s.setDrawingPenPreset)
  const updateDrawingPenStyle = useWhiteboardStore((s) => s.updateDrawingPenStyle)
  const config = useWhiteboardStore((s) => s.config)
  const setLineCap = useWhiteboardStore((s) => s.setLineCap)
  const setLineJoin = useWhiteboardStore((s) => s.setLineJoin)

  const brush = ALL_TOOLS.find((b) => b.id === activeBrush)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Brush ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">
          {brush?.label ?? 'Drawing'} Tool
        </h2>

        {/* Color: active swatch next to label, quick colors aligned with inputs */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 w-20 shrink-0">
            <span className="text-gray-400 text-sm">Color</span>
            <ColorPicker
              color={drawingColor}
              onChange={setDrawingColor}
              showAlpha={false}
            />
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            {['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'].map((c) => (
              <button
                key={c}
                onClick={() => setDrawingColor(c)}
                className={`w-7 h-7 shrink-0 rounded-lg border transition-colors ${
                  drawingColor === c ? 'border-[#4a7eff]' : 'border-white/10 hover:border-white/20'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Pen Settings ──────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Pen Settings</h4>

        {/* Pen Preset */}
        <PanelSelect
          label="Pen"
          value={penPreset}
          onChange={setDrawingPenPreset}
          options={[
            ...Object.keys(PEN_PRESETS).map((k) => ({
              value: k,
              label: k.charAt(0).toUpperCase() + k.slice(1),
            })),
            ...(penPreset === 'custom' ? [{ value: 'custom', label: 'Custom' }] : []),
          ]}
        />

        {/* Pen Size */}
        <PanelSlider
          label="Pen Size"
          value={pen.size}
          onChange={(v) => updateDrawingPenStyle({ size: v })}
          min={1}
          max={20}
          step={0.5}
          suffix="px"
        />

        {/* Thinning */}
        <PanelSlider
          label="Thinning"
          value={pen.thinning}
          onChange={(v) => updateDrawingPenStyle({ thinning: v })}
          min={-1}
          max={1}
          step={0.05}
        />

        {/* Smoothing */}
        <PanelSlider
          label="Smoothing"
          value={pen.smoothing}
          onChange={(v) => updateDrawingPenStyle({ smoothing: v })}
          min={0}
          max={1}
          step={0.05}
        />

        {/* Streamline */}
        <PanelSlider
          label="Streamline"
          value={pen.streamline}
          onChange={(v) => updateDrawingPenStyle({ streamline: v })}
          min={0}
          max={1}
          step={0.05}
        />

        {/* Simulate Pressure */}
        <PanelToggle
          label="Simulate Pressure"
          checked={pen.simulatePressure}
          onChange={(v) => updateDrawingPenStyle({ simulatePressure: v })}
        />

        {/* Taper Start */}
        <PanelSlider
          label="Taper Start"
          value={pen.taperStart}
          onChange={(v) => updateDrawingPenStyle({ taperStart: v })}
          min={0}
          max={50}
          step={1}
          suffix="px"
        />

        {/* Taper End */}
        <PanelSlider
          label="Taper End"
          value={pen.taperEnd}
          onChange={(v) => updateDrawingPenStyle({ taperEnd: v })}
          min={0}
          max={50}
          step={1}
          suffix="px"
        />

        {/* Line Cap */}
        <PanelSelect
          label="Line Cap"
          value={config.lineCap}
          onChange={(v) => setLineCap(v as WhiteboardConfig['lineCap'])}
          options={LINE_CAP_OPTIONS.map((cap) => ({ value: cap, label: cap.charAt(0).toUpperCase() + cap.slice(1) }))}
        />

        {/* Line Join */}
        <PanelSelect
          label="Line Join"
          value={config.lineJoin}
          onChange={(v) => setLineJoin(v as WhiteboardConfig['lineJoin'])}
          options={LINE_JOIN_OPTIONS.map((join) => ({ value: join, label: join.charAt(0).toUpperCase() + join.slice(1) }))}
        />
      </div>
    </div>
  )
}
