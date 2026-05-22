/**
 * WhiteboardTextPropertiesPanel
 *
 * Right panel for whiteboard text. Two modes:
 * - No text selected → "Add Text" form with draw style presets
 * - Text selected → edit properties with draw style at top
 */

import { useState, useEffect, useRef } from 'react'
import { Trash2, Type, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown } from 'lucide-react'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import type { WhiteboardTextItem } from '@/stores/useWhiteboardStore'
import { useTimelineStore } from '@/stores'
import { PanelSlider, PanelToggle, PanelSelect } from '@/components/ui/panel-controls'
import { ColorPicker } from '@/components/ui'
import { PEN_PRESETS } from '@/services/progressiveDrawing'
import { textToPath } from '@/services/whiteboardAnimation'
import { loadFont, textToCharPaths, measureTextWidth, BUNDLED_FONTS } from '@/services/textToSvgPath'

// Pen preset options for the stroke type dropdown (includes Outline)
const PEN_PRESET_OPTIONS = [
  ...Object.keys(PEN_PRESETS).map((k) => ({
    value: k,
    label: k.charAt(0).toUpperCase() + k.slice(1),
  })),
  { value: 'outline', label: 'Outline' },
]

// ---------------------------------------------------------------------------
// Add Text Form (no text selected)
// ---------------------------------------------------------------------------

function AddTextForm() {
  const addTextItem = useWhiteboardStore((s) => s.addTextItem)
  const drawingColor = useWhiteboardStore((s) => s.drawingColor)
  const enabled = useWhiteboardStore((s) => s.enabled)
  const setEnabled = useWhiteboardStore((s) => s.setEnabled)

  const [textInput, setTextInput] = useState('')
  const [penPreset, setPenPreset] = useState('chalk')
  const textFontSize = 56

  const isOutline = penPreset === 'outline'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Add Text</h2>

        {/* Text input */}
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type text to draw..."
          className="w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4a7eff] mb-3"
        />

        {/* Stroke Type */}
        <PanelSelect label="Stroke" value={penPreset} onChange={setPenPreset} options={PEN_PRESET_OPTIONS} />
      </div>

      {/* Add Text button */}
      <div className="p-4">
        <button
          onClick={async () => {
            const text = textInput.trim() || 'Hello'
            const currentFrame = useTimelineStore.getState().currentFrame
            const presetKey = isOutline ? 'pen' : penPreset
            const preset = PEN_PRESETS[presetKey] ?? PEN_PRESETS.chalk
            const penOverride = {
              size: preset.size,
              thinning: preset.thinning,
              smoothing: preset.smoothing,
              streamline: preset.streamline,
              simulatePressure: preset.simulatePressure,
              taperStart: preset.taperStart,
              taperEnd: preset.taperEnd,
            }

            if (!isOutline) {
              const charWidth = textFontSize * 0.65
              const totalWidth =
                text.replace(/ /g, '').length * charWidth + (text.split(' ').length - 1) * charWidth * 0.4
              const paths: string[] = []
              let cursorX = 0
              for (const char of text) {
                const singlePath = textToPath(char, cursorX, textFontSize, textFontSize)
                if (singlePath && singlePath.trim()) paths.push(singlePath)
                cursorX += char === ' ' ? charWidth * 0.4 : charWidth
              }

              const item: WhiteboardTextItem = {
                id: `wbtext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                text,
                fontFamily: 'handwriting',
                fontSize: textFontSize,
                color: drawingColor,
                strokeWidth: preset.size,
                x: 50,
                y: 50,
                scale: 1,
                rotation: 0,
                charPaths: paths,
                textWidth: Math.ceil(totalWidth),
                textHeight: Math.ceil(textFontSize * 1.2),
                startFrame: currentFrame,
                framesPerChar: 30,
                easing: 'ease-out',
                drawStyle: 'handwriting',
                penPresetName: penPreset,
                penStyleOverride: penOverride,
              }
              addTextItem(item)
              if (!enabled) setEnabled(true)
            } else {
              const fontUrl = BUNDLED_FONTS['Permanent Marker']
              if (!fontUrl) return
              try {
                const font = await loadFont(fontUrl)
                const charPaths = textToCharPaths(text, font, 0, textFontSize, textFontSize)
                const textWidth = measureTextWidth(text, font, textFontSize)
                const item: WhiteboardTextItem = {
                  id: `wbtext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  text,
                  fontFamily: 'Permanent Marker',
                  fontSize: textFontSize,
                  color: drawingColor,
                  strokeWidth: preset.size,
                  x: 50,
                  y: 50,
                  scale: 1,
                  rotation: 0,
                  charPaths: charPaths.map((cp) => cp.pathData),
                  textWidth: Math.ceil(textWidth),
                  textHeight: Math.ceil(textFontSize * 1.2),
                  startFrame: currentFrame,
                  framesPerChar: 30,
                  easing: 'ease-out',
                  drawStyle: 'outline',
                  penPresetName: penPreset,
                  penStyleOverride: penOverride,
                }
                addTextItem(item)
                if (!enabled) setEnabled(true)
              } catch (err) {
                console.error('[WhiteboardTextPropertiesPanel] Font load failed:', err)
              }
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 border border-[#4a7eff]/20 hover:border-[#4a7eff]/30 transition-colors text-[11px] font-medium"
        >
          <Type size={14} />
          Add Text
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit Text Properties (text selected)
// ---------------------------------------------------------------------------

function EditTextProperties({ item }: { item: WhiteboardTextItem }) {
  const updateTextItem = useWhiteboardStore((s) => s.updateTextItem)
  const removeTextItem = useWhiteboardStore((s) => s.removeTextItem)

  const pen = item.penStyleOverride ?? {
    size: item.strokeWidth || 6,
    thinning: 0.3,
    smoothing: 0.4,
    streamline: 0.4,
    simulatePressure: true,
    taperStart: 5,
    taperEnd: 15,
  }

  const updatePen = (updates: Partial<typeof pen>) => {
    updateTextItem(item.id, {
      penStyleOverride: { ...pen, ...updates },
    })
  }

  const applyPreset = (presetName: string) => {
    if (presetName === 'outline') {
      updateTextItem(item.id, {
        penPresetName: 'outline',
        drawStyle: 'outline',
      })
      return
    }
    const preset = PEN_PRESETS[presetName]
    if (!preset) return
    updateTextItem(item.id, {
      penPresetName: presetName,
      drawStyle: 'handwriting',
      penStyleOverride: {
        size: preset.size,
        thinning: preset.thinning,
        smoothing: preset.smoothing,
        streamline: preset.streamline,
        simulatePressure: preset.simulatePressure,
        taperStart: preset.taperStart,
        taperEnd: preset.taperEnd,
      },
    })
  }

  const currentPreset = item.penPresetName ?? 'custom'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Text ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Whiteboard Text</h2>

        {/* Text content — editable */}
        <TextContentInput item={item} updateTextItem={updateTextItem} />

        {/* Color */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Color</span>
          <ColorPicker color={item.color} onChange={(c) => updateTextItem(item.id, { color: c })} showAlpha={false} />
        </div>
      </div>

      {/* ── Pen Settings ──────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Pen Settings</h4>

        <PanelSelect
          label="Stroke"
          value={currentPreset}
          onChange={applyPreset}
          options={[
            ...PEN_PRESET_OPTIONS,
            ...(currentPreset === 'custom' ? [{ value: 'custom', label: 'Custom' }] : []),
          ]}
        />

        <PanelSlider
          label="Pen Size"
          value={pen.size}
          onChange={(v) => updatePen({ size: v })}
          min={1}
          max={20}
          step={0.5}
          suffix="px"
        />
        <PanelSlider
          label="Thinning"
          value={pen.thinning}
          onChange={(v) => updatePen({ thinning: v })}
          min={-1}
          max={1}
          step={0.05}
        />
        <PanelSlider
          label="Smoothing"
          value={pen.smoothing}
          onChange={(v) => updatePen({ smoothing: v })}
          min={0}
          max={1}
          step={0.05}
        />
        <PanelSlider
          label="Streamline"
          value={pen.streamline}
          onChange={(v) => updatePen({ streamline: v })}
          min={0}
          max={1}
          step={0.05}
        />
        <PanelToggle
          label="Simulate Pressure"
          checked={pen.simulatePressure}
          onChange={(v) => updatePen({ simulatePressure: v })}
        />
        <PanelSlider
          label="Taper Start"
          value={pen.taperStart}
          onChange={(v) => updatePen({ taperStart: v })}
          min={0}
          max={50}
          step={1}
          suffix="px"
        />
        <PanelSlider
          label="Taper End"
          value={pen.taperEnd}
          onChange={(v) => updatePen({ taperEnd: v })}
          min={0}
          max={50}
          step={1}
          suffix="px"
        />
      </div>

      {/* ── Animation & Size ──────────────────────────────────── */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Animation</h4>
        <PanelSlider
          label="Speed"
          value={item.framesPerChar}
          onChange={(v) => updateTextItem(item.id, { framesPerChar: v })}
          min={5}
          max={120}
          step={1}
          suffix="f/char"
        />
        <PanelSlider
          label="Font Size"
          value={item.fontSize}
          onChange={(v) => updateTextItem(item.id, { fontSize: v })}
          min={20}
          max={120}
          step={1}
          suffix="px"
        />
      </div>

      {/* ── Layer Order ───────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase mb-3">Layer Order</h4>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => {
              const items = useWhiteboardStore.getState().textItems
              const idx = items.findIndex((t) => t.id === item.id)
              if (idx < items.length - 1) {
                const reordered = [...items.filter((t) => t.id !== item.id), item]
                useWhiteboardStore.setState({ textItems: reordered })
              }
            }}
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors text-[9px]"
            title="Bring to Front"
          >
            <ChevronsUp size={14} />
            Front
          </button>
          <button
            onClick={() => {
              const items = useWhiteboardStore.getState().textItems
              const idx = items.findIndex((t) => t.id === item.id)
              if (idx < items.length - 1) {
                const reordered = [...items]
                ;[reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]]
                useWhiteboardStore.setState({ textItems: reordered })
              }
            }}
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors text-[9px]"
            title="Bring Forward"
          >
            <ChevronUp size={14} />
            Forward
          </button>
          <button
            onClick={() => {
              const items = useWhiteboardStore.getState().textItems
              const idx = items.findIndex((t) => t.id === item.id)
              if (idx > 0) {
                const reordered = [...items]
                ;[reordered[idx], reordered[idx - 1]] = [reordered[idx - 1], reordered[idx]]
                useWhiteboardStore.setState({ textItems: reordered })
              }
            }}
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors text-[9px]"
            title="Send Backward"
          >
            <ChevronDown size={14} />
            Backward
          </button>
          <button
            onClick={() => {
              const items = useWhiteboardStore.getState().textItems
              const idx = items.findIndex((t) => t.id === item.id)
              if (idx > 0) {
                const reordered = [item, ...items.filter((t) => t.id !== item.id)]
                useWhiteboardStore.setState({ textItems: reordered })
              }
            }}
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors text-[9px]"
            title="Send to Back"
          >
            <ChevronsDown size={14} />
            Back
          </button>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="p-4">
        <button
          onClick={() => removeTextItem(item.id)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors text-xs font-medium"
        >
          <Trash2 size={13} />
          Delete Text
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function WhiteboardTextPropertiesPanel() {
  const selectedId = useWhiteboardStore((s) => s.selectedTextItemId)
  const textItems = useWhiteboardStore((s) => s.textItems)

  const item = textItems.find((t) => t.id === selectedId)

  if (!item) {
    return <AddTextForm />
  }

  return <EditTextProperties item={item} />
}

// ---------------------------------------------------------------------------
// Editable text input with local state to prevent cursor jumps
// ---------------------------------------------------------------------------

function TextContentInput({
  item,
  updateTextItem,
}: {
  item: WhiteboardTextItem
  updateTextItem: (id: string, updates: Partial<WhiteboardTextItem>) => void
}) {
  const [localText, setLocalText] = useState(item.text)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setLocalText(item.text)
  }, [item.id])

  const regeneratePaths = async (newText: string) => {
    if (item.drawStyle === 'handwriting') {
      const charWidth = item.fontSize * 0.65
      const totalWidth =
        newText.replace(/ /g, '').length * charWidth + (newText.split(' ').length - 1) * charWidth * 0.4
      const paths: string[] = []
      let cursorX = 0
      for (const char of newText) {
        const singlePath = textToPath(char, cursorX, item.fontSize, item.fontSize)
        if (singlePath && singlePath.trim()) paths.push(singlePath)
        cursorX += char === ' ' ? charWidth * 0.4 : charWidth
      }
      updateTextItem(item.id, {
        text: newText,
        charPaths: paths,
        textWidth: Math.ceil(totalWidth),
        textHeight: Math.ceil(item.fontSize * 1.2),
      })
    } else {
      const fontUrl = BUNDLED_FONTS[item.fontFamily]
      if (fontUrl) {
        try {
          const font = await loadFont(fontUrl)
          const charPaths = textToCharPaths(newText, font, 0, item.fontSize, item.fontSize)
          const textWidth = measureTextWidth(newText, font, item.fontSize)
          updateTextItem(item.id, {
            text: newText,
            charPaths: charPaths.map((cp) => cp.pathData),
            textWidth: Math.ceil(textWidth),
            textHeight: Math.ceil(item.fontSize * 1.2),
          })
        } catch {
          /* font load failed */
        }
      }
    }
  }

  return (
    <div className="mb-3">
      <span className="text-gray-400 text-sm mb-1 block">Content</span>
      <input
        type="text"
        value={localText}
        onChange={(e) => {
          const val = e.target.value
          setLocalText(val)
          clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => regeneratePaths(val), 300)
        }}
        onBlur={() => {
          clearTimeout(debounceRef.current)
          regeneratePaths(localText)
        }}
        className="w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
        placeholder="Type text..."
      />
    </div>
  )
}
