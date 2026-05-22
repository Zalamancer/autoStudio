import { memo, useMemo, useState } from 'react'
import { Type, Trash2, Copy, AlignLeft, AlignCenter, AlignRight, AlignJustify, ArrowUp, Minus, ArrowDown, Sparkles, Flame, X } from 'lucide-react'
import { useTextOverlayStore, type FontFamily, type FontWeight } from '@/stores/useTextOverlayStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { recordPropertyChange } from '@/hooks/usePropertyRecorder'
import { cn } from '@/lib/utils'
import { ColorPicker } from '@/components/ui'
import { PanelSelect, PanelSlider } from '@/components/ui/panel-controls'
import { BlendModeSelector } from '@/components/ui/BlendModeSelector'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'
import { BLUR_PRESETS } from '@/services/effects/blurEffect'
import { COMIC_TEXT_STYLE_PRESETS, type ComicTextStylePreset } from '@/data/comicTextStylePresets'
import { ELEMENTAL_TEXT_PRESETS, type ElementalTextPreset } from '@/data/elementalTextPresets'
import { HIGHLIGHTED_TEXT_PRESETS, type HighlightedTextPreset } from '@/data/highlightedTextPresets'
import { Highlighter } from 'lucide-react'

const RP_FONTS: { value: string; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Ubuntu', label: 'Ubuntu' },
  { value: 'PT Sans', label: 'PT Sans' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Comfortaa', label: 'Comfortaa' },
  { value: 'Fredoka', label: 'Fredoka' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Abril Fatface', label: 'Abril Fatface' },
  { value: 'Space Mono', label: 'Space Mono' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Archivo Black', label: 'Archivo Black' },
  { value: 'Alfa Slab One', label: 'Alfa Slab One' },
  { value: 'Bangers', label: 'Bangers' },
  { value: 'Righteous', label: 'Righteous' },
  { value: 'Permanent Marker', label: 'Permanent Marker' },
  { value: 'Pacifico', label: 'Pacifico' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Caveat', label: 'Caveat' },
]

const RP_WEIGHTS = [
  { value: 'normal', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
  { value: 'black', label: 'Black' },
]

const ALIGN_OPTIONS = [
  { value: 'left' as const, Icon: AlignLeft, title: 'Left' },
  { value: 'center' as const, Icon: AlignCenter, title: 'Center' },
  { value: 'right' as const, Icon: AlignRight, title: 'Right' },
  { value: 'justify' as const, Icon: AlignJustify, title: 'Justify' },
]

const VALIGN_OPTIONS = [
  { value: 'top' as const, Icon: ArrowUp, title: 'Top' },
  { value: 'middle' as const, Icon: Minus, title: 'Middle' },
  { value: 'bottom' as const, Icon: ArrowDown, title: 'Bottom' },
]

const CASE_OPTIONS = [
  { value: 'none' as const, label: 'Aa', title: 'As Typed' },
  { value: 'uppercase' as const, label: 'AA', title: 'Uppercase' },
  { value: 'lowercase' as const, label: 'aa', title: 'Lowercase' },
]

const FONT_WEIGHT_MAP: Record<string, number> = {
  normal: 400, medium: 500, semibold: 600, bold: 700, black: 900,
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16) || 0,
    g: parseInt(h.substring(2, 4), 16) || 0,
    b: parseInt(h.substring(4, 6), 16) || 0,
  }
}

export function TextPropertiesPanel() {
  const overlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const removeOverlay = useTextOverlayStore((s) => s.removeOverlay)
  const duplicateOverlay = useTextOverlayStore((s) => s.duplicateOverlay)
  const setSelectedId = useTextOverlayStore((s) => s.setSelectedId)

  const liveTransform = useLiveTransformStore((s) => s.active)

  const isLiveActive = liveTransform?.type === 'text' && liveTransform?.id === overlay?.id
  const displayValues = useMemo(() => {
    if (!overlay) return null
    if (isLiveActive && liveTransform) {
      return {
        freeX: liveTransform.x,
        freeY: liveTransform.y,
        rotation: liveTransform.rotation,
        opacity: overlay.opacity,
        zIndex: overlay.zIndex,
      }
    }
    return {
      freeX: overlay.freeX,
      freeY: overlay.freeY,
      rotation: overlay.rotation,
      opacity: overlay.opacity,
      zIndex: overlay.zIndex,
    }
  }, [overlay, isLiveActive, liveTransform])

  if (!overlay || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Type size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No text selected</p>
        <p className="text-[10px] mt-1">Click a text overlay on the canvas to edit</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Text ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Text</h2>

        {/* Content */}
        <div className="mb-3">
          <span className="text-gray-400 text-sm mb-1 block">Content</span>
          <textarea
            value={overlay.content}
            onChange={(e) => updateOverlay(overlay.id, { content: e.target.value })}
            rows={3}
            className="w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
          />
        </div>

        {/* Font Size */}
        <PanelSlider label="Size" value={overlay.fontSize} onChange={(v) => {
          updateOverlay(overlay.id, { fontSize: v })
          recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'fontSize', v, overlay.fontSize)
        }} min={8} max={400} step={1} precision={0} suffix="px" />

        {/* Line Height */}
        <PanelSlider label="Height" value={overlay.lineHeight} onChange={(v) => {
          updateOverlay(overlay.id, { lineHeight: v })
          recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'lineHeight', v, overlay.lineHeight)
        }} min={0.5} max={3} step={0.1} precision={1} suffix="x" />

        {/* Letter Spacing */}
        <PanelSlider label="Spacing" value={overlay.letterSpacing} onChange={(v) => {
          updateOverlay(overlay.id, { letterSpacing: v })
          recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'letterSpacing', v, overlay.letterSpacing)
        }} min={-5} max={20} step={0.5} precision={1} suffix="px" />

        {/* Font Family */}
        <PanelSelect
          label="Font"
          value={overlay.fontFamily}
          onChange={(v) => updateOverlay(overlay.id, { fontFamily: v as FontFamily })}
          options={RP_FONTS}
        />

        {/* Font Weight */}
        <PanelSelect
          label="Weight"
          value={overlay.fontWeight}
          onChange={(v) => updateOverlay(overlay.id, { fontWeight: v as FontWeight })}
          options={RP_WEIGHTS}
        />

        {/* Horizontal Alignment */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Align</span>
          <div className="flex gap-1 flex-wrap">
            {ALIGN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateOverlay(overlay.id, { align: opt.value })}
                title={opt.title}
                className={cn(
                  'w-9 h-8 rounded-lg flex items-center justify-center transition-colors',
                  overlay.align === opt.value
                    ? 'bg-[#4a7eff] text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                )}
              >
                <opt.Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Alignment */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Vertical</span>
          <div className="flex gap-1 flex-wrap">
            {VALIGN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const posMap = { top: 'top', middle: 'center', bottom: 'bottom' } as const
                  updateOverlay(overlay.id, { verticalAlign: opt.value, position: posMap[opt.value] })
                }}
                title={opt.title}
                className={cn(
                  'w-9 h-8 rounded-lg flex items-center justify-center transition-colors',
                  overlay.verticalAlign === opt.value
                    ? 'bg-[#4a7eff] text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                )}
              >
                <opt.Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Text Case */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Case</span>
          <div className="flex gap-1 flex-wrap">
            {CASE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateOverlay(overlay.id, { textCase: opt.value })}
                title={opt.title}
                className={cn(
                  'w-9 h-8 rounded-lg flex items-center justify-center transition-colors text-xs font-medium',
                  overlay.textCase === opt.value
                    ? 'bg-[#4a7eff] text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Style ─────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Style</h2>

        {/* Color */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-zinc-400 w-14 shrink-0">Color</span>
          <ColorPicker color={overlay.color} onChange={(c) => updateOverlay(overlay.id, { color: c })} />
        </div>

        {/* Opacity */}
        <PanelSlider label="Opacity" value={Math.round(displayValues.opacity * 100)} onChange={(v) => {
          const val = Math.min(1, Math.max(0, v / 100))
          updateOverlay(overlay.id, { opacity: val })
          recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'opacity', val, overlay.opacity)
        }} min={0} max={100} step={1} precision={0} suffix="%" />

        {/* Shadow Toggle */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Shadow</span>
          <button
            onClick={() => updateOverlay(overlay.id, { shadow: !overlay.shadow })}
            className={cn(
              'relative w-10 h-6 rounded-full transition-colors',
              overlay.shadow ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]'
            )}
          >
            <span className={cn(
              'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
              overlay.shadow && 'translate-x-4'
            )} />
          </button>
        </div>

        {/* Background Toggle */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Background</span>
          <button
            onClick={() => updateOverlay(overlay.id, { background: !overlay.background })}
            className={cn(
              'relative w-10 h-6 rounded-full transition-colors',
              overlay.background ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]'
            )}
          >
            <span className={cn(
              'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
              overlay.background && 'translate-x-4'
            )} />
          </button>
        </div>

        {/* Background Opacity */}
        {overlay.background && (
          <>
            <PanelSlider label="BG %" value={Math.round(overlay.backgroundOpacity * 100)} onChange={(v) => {
              const val = Math.min(1, Math.max(0, v / 100))
              updateOverlay(overlay.id, { backgroundOpacity: val })
              recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'backgroundOpacity', val, overlay.backgroundOpacity)
            }} min={0} max={100} step={5} precision={0} suffix="%" />

            {/* Background Color */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-zinc-400 w-14 shrink-0">BG Color</span>
              <ColorPicker color={overlay.backgroundColor || '#000000'} onChange={(c) => updateOverlay(overlay.id, { backgroundColor: c })} />
            </div>

            {/* Border Radius */}
            <PanelSlider label="Radius" value={overlay.backgroundBorderRadius ?? 6} onChange={(v) => {
              updateOverlay(overlay.id, { backgroundBorderRadius: Math.max(0, v) })
            }} min={0} max={100} step={1} precision={0} suffix="px" />

            {/* Padding X */}
            <PanelSlider label="Pad X" value={overlay.backgroundPaddingX ?? 0.3} onChange={(v) => {
              updateOverlay(overlay.id, { backgroundPaddingX: Math.max(0, v) })
            }} min={0} max={2} step={0.05} precision={2} suffix="x" />

            {/* Padding Y */}
            <PanelSlider label="Pad Y" value={overlay.backgroundPaddingY ?? 0.15} onChange={(v) => {
              updateOverlay(overlay.id, { backgroundPaddingY: Math.max(0, v) })
            }} min={0} max={2} step={0.05} precision={2} suffix="x" />
          </>
        )}

        {/* Blend Mode */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Blend</span>
          <BlendModeSelector
            value={(overlay.blendMode ?? 'source-over') as BlendMode}
            onChange={(mode) => updateOverlay(overlay.id, { blendMode: mode })}
            className="flex-1 bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-[#4a7eff] cursor-pointer"
          />
        </div>

        {/* Blur */}
        <PanelSlider label="Blur" value={overlay.blur ?? 0} onChange={(v) => updateOverlay(overlay.id, { blur: Math.max(0, v) })} min={0} max={50} step={0.5} precision={1} suffix="px" />
        {(overlay.blur ?? 0) > 0 && (
          <>
            <PanelSelect
              label="Blur Type"
              value={overlay.blurType ?? 'gaussian'}
              onChange={(v) => updateOverlay(overlay.id, { blurType: v as BlurType })}
              options={[
                { value: 'gaussian', label: 'Gaussian' },
                { value: 'motion', label: 'Motion' },
                { value: 'tilt-shift', label: 'Tilt-Shift' },
              ]}
            />
            {overlay.blurType === 'motion' && (
              <PanelSlider label="Angle" value={overlay.motionBlurAngle ?? 0} onChange={(v) => updateOverlay(overlay.id, { motionBlurAngle: v })} min={0} max={360} step={1} precision={0} suffix="deg" />
            )}
            <PanelSelect
              label="Preset"
              value=""
              onChange={(v) => {
                const preset = BLUR_PRESETS.find((p) => p.label === v)
                if (preset) {
                  updateOverlay(overlay.id, {
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
            />
          </>
        )}
      </div>

      {/* ── Fun Styles ──────────────────────────────────────────── */}
      <ComicStylePresetSection overlayId={overlay.id} activePresetId={overlay.textStylePreset} />

      {/* ── Elemental Styles ──────────────────────────────────── */}
      <ElementalStylePresetSection overlayId={overlay.id} activePresetId={overlay.textStylePreset} />

      {/* ── Highlighted / Boxed Styles ─────────────────────────── */}
      <HighlightedStylePresetSection overlayId={overlay.id} activePresetId={overlay.textStylePreset} />

      {/* ── Transform ─────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-white text-base font-semibold">Transform</h2>
          {isLiveActive && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>

        {/* Position */}
        <PanelSlider
          label="X"
          value={displayValues.freeX}
          onChange={(v) => {
            updateOverlay(overlay.id, { freeX: v, position: 'free' as const })
            recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'freeX', v, overlay.freeX)
          }}
          min={0}
          max={100}
          step={1}
          precision={0}
          compact
        />
        <PanelSlider
          label="Y"
          value={displayValues.freeY}
          onChange={(v) => {
            updateOverlay(overlay.id, { freeY: v, position: 'free' as const })
            recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'freeY', v, overlay.freeY)
          }}
          min={0}
          max={100}
          step={1}
          precision={0}
          compact
        />

        {/* Rotation */}
        <PanelSlider
          label="Rotation"
          value={displayValues.rotation}
          onChange={(v) => {
            updateOverlay(overlay.id, { rotation: v })
            recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'rotation', v, overlay.rotation)
          }}
          min={-180}
          max={180}
          step={1}
          precision={0}
          suffix="deg"
        />

        {/* Z-Index */}
        <PanelSlider
          label="Z-Index"
          value={displayValues.zIndex}
          onChange={(v) => {
            const val = Math.round(v)
            updateOverlay(overlay.id, { zIndex: val })
            recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'zIndex', val, overlay.zIndex)
          }}
          min={-100}
          max={100}
          step={1}
          precision={0}
        />
      </div>

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => duplicateOverlay(overlay.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2a2a2a] text-white text-sm rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            onClick={() => { removeOverlay(overlay.id); setSelectedId(null) }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/10 text-red-400 text-sm rounded-lg hover:bg-red-600/20 transition-colors"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Comic / Fun Style Preset Section ─────────────────────────────────────

function ComicStylePresetSection({ overlayId, activePresetId }: { overlayId: string; activePresetId?: string }) {
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const [expanded, setExpanded] = useState(false)

  const applyPreset = (preset: ComicTextStylePreset) => {
    updateOverlay(overlayId, {
      fontFamily: preset.fontFamily,
      fontWeight: preset.fontWeight,
      color: preset.color,
      textShadow: preset.textShadow,
      webkitTextStroke: preset.WebkitTextStroke ?? undefined,
      letterSpacing: preset.letterSpacing,
      textStylePreset: preset.id,
      shadow: false, // disable basic shadow since custom textShadow takes over
    })
  }

  const clearPreset = () => {
    updateOverlay(overlayId, {
      textShadow: undefined,
      webkitTextStroke: undefined,
      textStylePreset: undefined,
    })
  }

  const visiblePresets = expanded ? COMIC_TEXT_STYLE_PRESETS : COMIC_TEXT_STYLE_PRESETS.slice(0, 6)

  return (
    <div className="p-4 border-b border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-400" />
          <h2 className="text-white text-base font-semibold">Fun Styles</h2>
        </div>
        {activePresetId && (
          <button
            onClick={clearPreset}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-white bg-[#2a2a2a] rounded-md transition-colors"
            title="Clear style preset"
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {visiblePresets.map((preset) => (
          <ComicPresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onApply={() => applyPreset(preset)}
          />
        ))}
      </div>

      {COMIC_TEXT_STYLE_PRESETS.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 py-1.5 text-[11px] text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${COMIC_TEXT_STYLE_PRESETS.length} styles`}
        </button>
      )}
    </div>
  )
}

const ComicPresetCard = memo(function ComicPresetCard({ preset, isActive, onApply }: { preset: ComicTextStylePreset; isActive: boolean; onApply: () => void }) {
  return (
    <button
      onClick={onApply}
      className={cn(
        'relative rounded-lg p-2 text-left transition-all overflow-hidden group',
        isActive
          ? 'ring-2 ring-[#4a7eff] bg-[#4a7eff]/10'
          : 'bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-transparent hover:border-gray-600'
      )}
      title={preset.description}
    >
      {/* Live preview text */}
      <div
        className="text-sm font-bold leading-tight truncate mb-1"
        style={{
          fontFamily: `"${preset.fontFamily}", sans-serif`,
          color: preset.color,
          textShadow: preset.textShadow,
          WebkitTextStroke: preset.WebkitTextStroke,
          letterSpacing: `${preset.letterSpacing}px`,
          fontSize: '14px',
        }}
      >
        Abc
      </div>

      {/* Preset name */}
      <div className="flex items-center gap-1">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: `linear-gradient(135deg, ${preset.previewColors[0]}, ${preset.previewColors[1]})` }}
        />
        <span className="text-[10px] text-gray-400 truncate group-hover:text-gray-300">
          {preset.name}
        </span>
      </div>
    </button>
  )
})

// ── Elemental / Nature Style Preset Section ──────────────────────────────

function ElementalStylePresetSection({ overlayId, activePresetId }: { overlayId: string; activePresetId?: string }) {
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const [expanded, setExpanded] = useState(false)

  const applyPreset = (preset: ElementalTextPreset) => {
    updateOverlay(overlayId, {
      fontFamily: preset.fontFamily,
      fontWeight: preset.fontWeight,
      color: preset.color,
      textShadow: preset.textShadow,
      webkitTextStroke: preset.webkitTextStroke ?? undefined,
      letterSpacing: preset.letterSpacing,
      textCase: preset.textCase ?? 'none',
      textStylePreset: preset.id,
      shadow: false,
    })
  }

  const clearPreset = () => {
    updateOverlay(overlayId, {
      textShadow: undefined,
      webkitTextStroke: undefined,
      textStylePreset: undefined,
    })
  }

  // Check if active preset belongs to this collection
  const isElementalActive = activePresetId ? ELEMENTAL_TEXT_PRESETS.some(p => p.id === activePresetId) : false

  const visiblePresets = expanded ? ELEMENTAL_TEXT_PRESETS : ELEMENTAL_TEXT_PRESETS.slice(0, 6)

  return (
    <div className="p-4 border-b border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <h2 className="text-white text-base font-semibold">Elemental</h2>
        </div>
        {isElementalActive && (
          <button
            onClick={clearPreset}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-white bg-[#2a2a2a] rounded-md transition-colors"
            title="Clear elemental style"
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {visiblePresets.map((preset) => (
          <ElementalPresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onApply={() => applyPreset(preset)}
          />
        ))}
      </div>

      {ELEMENTAL_TEXT_PRESETS.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 py-1.5 text-[11px] text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${ELEMENTAL_TEXT_PRESETS.length} styles`}
        </button>
      )}
    </div>
  )
}

const ElementalPresetCard = memo(function ElementalPresetCard({ preset, isActive, onApply }: { preset: ElementalTextPreset; isActive: boolean; onApply: () => void }) {
  return (
    <button
      onClick={onApply}
      className={cn(
        'relative rounded-lg p-2 text-left transition-all overflow-hidden group',
        isActive
          ? 'ring-2 ring-orange-400 bg-orange-400/10'
          : 'bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-transparent hover:border-gray-600'
      )}
      title={preset.description}
    >
      {/* Live preview text */}
      <div
        className="text-sm font-bold leading-tight truncate mb-1"
        style={{
          fontFamily: `"${preset.fontFamily}", sans-serif`,
          color: preset.color,
          textShadow: preset.textShadow,
          letterSpacing: `${Math.min(preset.letterSpacing, 3)}px`,
          fontSize: '14px',
          textTransform: preset.textCase === 'uppercase' ? 'uppercase' : undefined,
          ...(preset.webkitTextStroke ? { WebkitTextStroke: preset.webkitTextStroke } : {}),
        } as React.CSSProperties}
      >
        Abc
      </div>

      {/* Preset name */}
      <div className="flex items-center gap-1">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: `linear-gradient(135deg, ${preset.previewColors[0]}, ${preset.previewColors[1]})` }}
        />
        <span className="text-[10px] text-gray-400 truncate group-hover:text-gray-300">
          {preset.name}
        </span>
      </div>
    </button>
  )
})

// ── Highlighted / Boxed Style Preset Section ──────────────────────────────

function HighlightedStylePresetSection({ overlayId, activePresetId }: { overlayId: string; activePresetId?: string }) {
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const [expanded, setExpanded] = useState(false)

  const applyPreset = (preset: HighlightedTextPreset) => {
    updateOverlay(overlayId, {
      fontFamily: preset.fontFamily,
      fontWeight: preset.fontWeight,
      color: preset.color,
      letterSpacing: preset.letterSpacing,
      textCase: preset.textCase ?? 'none',
      background: true,
      backgroundColor: preset.backgroundColor,
      backgroundOpacity: preset.backgroundOpacity,
      backgroundBorderRadius: preset.backgroundBorderRadius,
      backgroundPaddingX: preset.backgroundPaddingX,
      backgroundPaddingY: preset.backgroundPaddingY,
      backgroundBorder: preset.backgroundBorder ?? undefined,
      textShadow: preset.textShadow ?? undefined,
      webkitTextStroke: preset.webkitTextStroke ?? undefined,
      textStylePreset: preset.id,
      shadow: false,
    })
  }

  const clearPreset = () => {
    updateOverlay(overlayId, {
      background: false,
      backgroundColor: undefined,
      backgroundBorderRadius: undefined,
      backgroundPaddingX: undefined,
      backgroundPaddingY: undefined,
      backgroundBorder: undefined,
      textShadow: undefined,
      webkitTextStroke: undefined,
      textStylePreset: undefined,
    })
  }

  // Check if active preset belongs to this collection
  const isHighlightedActive = activePresetId ? HIGHLIGHTED_TEXT_PRESETS.some(p => p.id === activePresetId) : false

  const visiblePresets = expanded ? HIGHLIGHTED_TEXT_PRESETS : HIGHLIGHTED_TEXT_PRESETS.slice(0, 6)

  return (
    <div className="p-4 border-b border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Highlighter size={16} className="text-yellow-400" />
          <h2 className="text-white text-base font-semibold">Highlighted</h2>
        </div>
        {isHighlightedActive && (
          <button
            onClick={clearPreset}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-white bg-[#2a2a2a] rounded-md transition-colors"
            title="Clear highlighted style"
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {visiblePresets.map((preset) => (
          <HighlightedPresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onApply={() => applyPreset(preset)}
          />
        ))}
      </div>

      {HIGHLIGHTED_TEXT_PRESETS.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 py-1.5 text-[11px] text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${HIGHLIGHTED_TEXT_PRESETS.length} styles`}
        </button>
      )}
    </div>
  )
}

const HighlightedPresetCard = memo(function HighlightedPresetCard({ preset, isActive, onApply }: { preset: HighlightedTextPreset; isActive: boolean; onApply: () => void }) {
  const bgRgb = hexToRgb(preset.backgroundColor)

  return (
    <button
      onClick={onApply}
      className={cn(
        'relative rounded-lg p-2 text-left transition-all overflow-hidden group',
        isActive
          ? 'ring-2 ring-yellow-400 bg-yellow-400/10'
          : 'bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-transparent hover:border-gray-600'
      )}
      title={preset.description}
    >
      {/* Live preview text with background */}
      <div
        className="text-[12px] leading-tight truncate mb-1"
        style={{
          fontFamily: `"${preset.fontFamily}", sans-serif`,
          fontWeight: FONT_WEIGHT_MAP[preset.fontWeight] ?? 400,
          color: preset.color,
          backgroundColor: `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${preset.backgroundOpacity})`,
          padding: '2px 5px',
          borderRadius: `${Math.min(preset.backgroundBorderRadius, 8)}px`,
          letterSpacing: `${Math.min(preset.letterSpacing, 3)}px`,
          textTransform: preset.textCase === 'uppercase' ? 'uppercase' : undefined,
          ...(preset.textShadow ? { textShadow: preset.textShadow } : {}),
          ...(preset.webkitTextStroke ? { WebkitTextStroke: preset.webkitTextStroke } : {}),
          ...(preset.backgroundBorder ? { border: preset.backgroundBorder } : {}),
          display: 'inline-block',
        } as React.CSSProperties}
      >
        Abc
      </div>

      {/* Preset name */}
      <div className="flex items-center gap-1">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ background: preset.backgroundColor, border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <span className="text-[10px] text-gray-400 truncate group-hover:text-gray-300">
          {preset.name}
        </span>
      </div>
    </button>
  )
})
