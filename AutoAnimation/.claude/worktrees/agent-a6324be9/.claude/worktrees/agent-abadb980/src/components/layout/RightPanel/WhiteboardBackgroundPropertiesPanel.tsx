/**
 * WhiteboardBackgroundPropertiesPanel — background color, templates, and texture/code editor.
 */
import { useState, useRef } from 'react'
import { Image, Trash2, Film, Copy, Zap } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { ColorPicker } from '@/components/ui'
import { PanelSlider, PanelSelect, PanelToggle, PanelMultiSelect } from '@/components/ui/panel-controls'
import { createDefaultDraftingConfig, type DraftingConfig } from '@/services/whiteboardAnimation'
import { parseCodeControls, CODE_BACKGROUND_PROMPT } from '@/services/codeBackground'
import { cn } from '@/lib/utils'

/** Recommended background colors (quick-pick swatches) */
const WB_RECOMMENDED_COLORS: { label: string; color: string }[] = [
  { label: 'Blank', color: 'transparent' },
  { label: 'White', color: '#ffffff' },
  { label: 'Light Gray', color: '#f5f5f5' },
  { label: 'Dark', color: '#1e1e1e' },
  { label: 'Cream', color: '#fdf6e3' },
  { label: 'Chalkboard', color: '#2d4a3e' },
  { label: 'Blueprint', color: '#1a2744' },
]

/** Element toggles for drafting overlay */
const WB_ELEMENT_TOGGLES: { key: string; label: string }[] = [
  { key: 'showGrid', label: 'Grid' },
  { key: 'showScales', label: 'Scales' },
  { key: 'showLabels', label: 'Labels' },
  { key: 'showRadialCurves', label: 'Radial Curves' },
  { key: 'showPolarGrid', label: 'Polar Grid' },
  { key: 'showConcentricCircles', label: 'Concentric Circles' },
  { key: 'showTestCircles', label: 'Test Circles' },
  { key: 'showRadiatingLines', label: 'Radiating Lines' },
  { key: 'showLargeArc', label: 'Large Arc' },
]

export function WhiteboardBackgroundPropertiesPanel() {
  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)
  const config = useWhiteboardStore((s) => s.config)
  const customBackgrounds = useWhiteboardStore((s) => s.customBackgrounds)
  const setBackgroundColor = useWhiteboardStore((s) => s.setBackgroundColor)
  const setBackgroundStyle = useWhiteboardStore((s) => s.setBackgroundStyle)
  const setBackgroundType = useWhiteboardStore((s) => s.setBackgroundType)
  const setBackgroundImageUrl = useWhiteboardStore((s) => s.setBackgroundImageUrl)
  const setBackgroundVideoUrl = useWhiteboardStore((s) => s.setBackgroundVideoUrl)
  const setBackgroundCode = useWhiteboardStore((s) => s.setBackgroundCode)
  const setBackgroundCodeControls = useWhiteboardStore((s) => s.setBackgroundCodeControls)
  const updateBackgroundCodeControl = useWhiteboardStore((s) => s.updateBackgroundCodeControl)
  const updateDraftingConfig = useWhiteboardStore((s) => s.updateDraftingConfig)
  const addCustomBackground = useWhiteboardStore((s) => s.addCustomBackground)
  const removeCustomBackground = useWhiteboardStore((s) => s.removeCustomBackground)

  const [isDragging, setIsDragging] = useState(false)
  const [codeText, setCodeText] = useState(config.backgroundCode ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      const id = `custbg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      if (file.type.startsWith('video/')) {
        addCustomBackground({ id, type: 'video', dataUrl, label: file.name })
        setBackgroundType('video')
        setBackgroundVideoUrl(dataUrl)
      } else if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        addCustomBackground({ id, type: 'svg', dataUrl, label: file.name })
        setBackgroundType('image')
        setBackgroundImageUrl(dataUrl)
      } else {
        addCustomBackground({ id, type: 'image', dataUrl, label: file.name })
        setBackgroundType('image')
        setBackgroundImageUrl(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const applyCode = () => {
    if (!codeText.trim()) return
    setBackgroundCode(codeText)
    setBackgroundType('code')
    setBackgroundCodeControls(parseCodeControls(codeText))
  }

  // Determine active BG sub-section from tab
  const activeSection =
    rightPanelTab === 'whiteboard-bg-templates'
      ? 'templates'
      : rightPanelTab === 'whiteboard-bg-texture'
        ? 'texture'
        : 'color'

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ════════════════════════════════════════════════════════ */}
      {/* COLOR TAB                                              */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeSection === 'color' && (
        <div className="p-3 space-y-2">
          {/* Custom solid color card — clicking opens ColorPicker */}
          <div className="relative w-full rounded-lg overflow-hidden border-2 border-dashed border-white/5 hover:border-zinc-400 transition-colors">
            <div
              className="w-full aspect-video relative cursor-pointer"
              style={{
                backgroundColor:
                  config.backgroundStyle === 'blank' &&
                  config.backgroundColor &&
                  config.backgroundColor !== 'transparent'
                    ? config.backgroundColor
                    : '#27272a',
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                style={{ mixBlendMode: 'difference' }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[11px] font-medium text-white">Custom Color</span>
              </div>
              {/* Full-card ColorPicker — invisible overlay that opens on click */}
              <div className="absolute inset-0">
                <ColorPicker
                  className="!w-full !h-full !opacity-0 !cursor-pointer"
                  color={config.backgroundColor === 'transparent' ? '#000000' : config.backgroundColor}
                  onChange={(c) => {
                    setBackgroundColor(c)
                    setBackgroundStyle('blank')
                    setBackgroundType('preset')
                  }}
                  showAlpha={false}
                />
              </div>
            </div>
          </div>

          {/* Gradient cards */}
          {[
            { label: 'Sunset', bg: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)', color: '#f97316' },
            { label: 'Ocean', bg: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#0ea5e9' },
            { label: 'Forest', bg: 'linear-gradient(135deg, #22c55e, #14b8a6, #0ea5e9)', color: '#22c55e' },
            { label: 'Night', bg: 'linear-gradient(180deg, #0f172a, #1e1b4b, #312e81)', color: '#0f172a' },
            { label: 'Fire', bg: 'linear-gradient(180deg, #fbbf24, #f97316, #ef4444)', color: '#ef4444' },
            { label: 'Radial Glow', bg: 'radial-gradient(circle at center, #3b82f6, #1e1b4b)', color: '#1e1b4b' },
            { label: 'Radial Warm', bg: 'radial-gradient(circle at center, #fbbf24, #78350f)', color: '#78350f' },
            { label: 'Vignette', bg: 'radial-gradient(circle at center, #374151, #000000)', color: '#000000' },
            { label: 'Aurora', bg: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899, #f97316)', color: '#06b6d4' },
            { label: 'Monochrome', bg: 'linear-gradient(180deg, #525252, #171717)', color: '#171717' },
          ].map((grad) => {
            const isActive = config.backgroundStyle === 'gradient-' + grad.label.toLowerCase().replace(/\s+/g, '-')
            return (
              <button
                key={grad.label}
                onClick={() => {
                  setBackgroundColor(grad.color)
                  setBackgroundStyle('gradient-' + grad.label.toLowerCase().replace(/\s+/g, '-'))
                  setBackgroundType('preset')
                  useWhiteboardStore.getState().setConfig({ backgroundGradient: grad.bg })
                }}
                className={`w-full rounded-lg overflow-hidden transition-all ${
                  isActive
                    ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                    : 'hover:ring-1 hover:ring-zinc-500'
                }`}
              >
                <div className="w-full aspect-video relative" style={{ background: grad.bg }}>
                  <span className="absolute bottom-1 left-2 text-[10px] font-medium text-white/80 drop-shadow-sm">
                    {grad.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}

          {/* Solid color cards */}
          {WB_RECOMMENDED_COLORS.map((swatch) => {
            const isActive =
              config.backgroundColor === swatch.color &&
              config.backgroundStyle !== 'drafting' &&
              config.backgroundStyle !== 'cutting-mat'
            const isTransparent = swatch.color === 'transparent'
            const isDark =
              isTransparent ||
              [
                '#000000',
                '#1a1a2e',
                '#0d1117',
                '#1e1e1e',
                '#0f172a',
                '#1a2744',
                '#2d4a3e',
                '#1a3bc2',
                '#0f2e7a',
              ].includes(swatch.color)
            return (
              <button
                key={swatch.color}
                onClick={() => {
                  setBackgroundColor(swatch.color)
                  setBackgroundStyle('blank')
                  setBackgroundType('preset')
                }}
                className={`w-full rounded-lg overflow-hidden transition-all ${
                  isActive
                    ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                    : 'hover:ring-1 hover:ring-zinc-500'
                }`}
              >
                <div
                  className="w-full aspect-video relative"
                  style={{
                    backgroundColor: isTransparent ? '#1a1a1a' : swatch.color,
                    backgroundImage: isTransparent
                      ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                      : undefined,
                    backgroundSize: isTransparent ? '12px 12px' : undefined,
                    backgroundPosition: isTransparent ? '0 0, 0 6px, 6px -6px, -6px 0px' : undefined,
                  }}
                >
                  <span
                    className={`absolute bottom-1 left-2 text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}
                  >
                    {swatch.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TEMPLATES TAB (Drafting, Cutting Mat, etc.)             */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeSection === 'templates' && (
        <div className="p-3 space-y-2">
          {/* Drafting template card */}
          <button
            onClick={() => {
              setBackgroundStyle('drafting')
              setBackgroundType('preset')
              const dc = config.draftingConfig ?? createDefaultDraftingConfig()
              setBackgroundColor(dc.bgColor)
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'drafting'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#0f2e7a' }}>
              {/* Mini drafting grid preview */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 90" preserveAspectRatio="none">
                {[20, 40, 60, 80, 100, 120, 140].map((x) => (
                  <line key={`v${x}`} x1={x} y1={0} x2={x} y2={90} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                ))}
                {[15, 30, 45, 60, 75].map((y) => (
                  <line key={`h${y}`} x1={0} y1={y} x2={160} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                ))}
                <circle cx="80" cy="45" r="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <line x1="30" y1="80" x2="130" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </svg>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-blue-300">Drafting</span>
              {config.backgroundStyle === 'drafting' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Cutting Mat template card */}
          <button
            onClick={() => {
              setBackgroundStyle('cutting-mat')
              setBackgroundType('preset')
              setBackgroundColor('#1a3bc2')
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'cutting-mat'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#1a3bc2' }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 90" preserveAspectRatio="none">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map((x) => (
                  <line key={`v${x}`} x1={x} y1={5} x2={x} y2={85} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
                ))}
                {[10, 20, 30, 40, 50, 60, 70, 80].map((y) => (
                  <line key={`h${y}`} x1={5} y1={y} x2={155} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
                ))}
                <rect
                  x="5"
                  y="5"
                  width="150"
                  height="80"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.5"
                />
                <line x1="30" y1="85" x2="130" y2="5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <line x1="30" y1="5" x2="130" y2="85" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
              </svg>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-blue-300">Cutting Mat</span>
              {config.backgroundStyle === 'cutting-mat' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Chalkboard template card */}
          <button
            onClick={() => {
              setBackgroundStyle('chalkboard')
              setBackgroundType('preset')
              setBackgroundColor('#2d4a3e')
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'chalkboard'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#2d4a3e' }}>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-zinc-400/60">Chalkboard</span>
              {config.backgroundStyle === 'chalkboard' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Blueprint template card */}
          <button
            onClick={() => {
              setBackgroundStyle('blueprint')
              setBackgroundType('preset')
              setBackgroundColor('#1a2744')
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'blueprint'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#1a2744' }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 90" preserveAspectRatio="none">
                {[20, 40, 60, 80, 100, 120, 140].map((x) => (
                  <line key={`v${x}`} x1={x} y1={0} x2={x} y2={90} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                ))}
                {[15, 30, 45, 60, 75].map((y) => (
                  <line key={`h${y}`} x1={0} y1={y} x2={160} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                ))}
              </svg>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-blue-300/60">Blueprint</span>
              {config.backgroundStyle === 'blueprint' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Drafting properties (shown when drafting is active) */}
          {config.backgroundStyle === 'drafting' &&
            (() => {
              const dc = config.draftingConfig ?? createDefaultDraftingConfig()
              return (
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Drafting Properties</h4>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-20 shrink-0">Line Color</span>
                    <ColorPicker
                      color={dc.lineColor}
                      onChange={(c) => updateDraftingConfig({ lineColor: c })}
                      showAlpha={false}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-20 shrink-0">BG Color</span>
                    <ColorPicker
                      color={dc.bgColor}
                      onChange={(c) => {
                        updateDraftingConfig({ bgColor: c })
                        setBackgroundColor(c)
                      }}
                      showAlpha={false}
                    />
                  </div>

                  <PanelSelect
                    label="Gradient"
                    value={dc.gradientMode}
                    onChange={(v) => updateDraftingConfig({ gradientMode: v as DraftingConfig['gradientMode'] })}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'radial', label: 'Radial' },
                      { value: 'linear-top', label: 'Linear Top' },
                      { value: 'linear-left', label: 'Linear Left' },
                      { value: 'vignette', label: 'Vignette' },
                    ]}
                  />

                  {dc.gradientMode !== 'none' && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm w-20 shrink-0">Grad Color</span>
                      <ColorPicker
                        color={dc.gradientColor}
                        onChange={(c) => updateDraftingConfig({ gradientColor: c })}
                        showAlpha={false}
                      />
                    </div>
                  )}

                  <PanelSlider
                    label="Thickness"
                    min={0.2}
                    max={3}
                    step={0.1}
                    value={dc.thicknessScale}
                    onChange={(v) => updateDraftingConfig({ thicknessScale: v })}
                  />
                  <PanelSlider
                    label="Opacity"
                    min={0}
                    max={1}
                    step={0.05}
                    value={dc.opacity}
                    onChange={(v) => updateDraftingConfig({ opacity: v })}
                  />
                  <PanelSlider
                    label="Grid Density"
                    min={1}
                    max={10}
                    step={1}
                    value={dc.gridDensity}
                    onChange={(v) => updateDraftingConfig({ gridDensity: v })}
                  />
                  <PanelSlider
                    label="Margin"
                    min={0}
                    max={0.1}
                    step={0.005}
                    value={dc.margin}
                    onChange={(v) => updateDraftingConfig({ margin: v })}
                  />

                  <PanelMultiSelect
                    label="Elements"
                    options={WB_ELEMENT_TOGGLES.map((t) => ({ value: t.key, label: t.label }))}
                    value={WB_ELEMENT_TOGGLES.filter((t) => dc[t.key as keyof DraftingConfig] === true).map(
                      (t) => t.key,
                    )}
                    onChange={(vals) => {
                      const updates: Partial<DraftingConfig> = {}
                      for (const t of WB_ELEMENT_TOGGLES) {
                        ;(updates as Record<string, boolean>)[t.key] = vals.includes(t.key)
                      }
                      updateDraftingConfig(updates)
                    }}
                  />
                </div>
              )
            })()}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TEXTURE TAB                                            */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeSection === 'texture' && (
        <div className="p-4 space-y-5">
          {/* Upload area */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Upload</h4>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.svg"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFileUpload(e.dataTransfer.files)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
                isDragging ? 'border-[#4a7eff] bg-[#4a7eff]/10' : 'border-white/5 bg-[#2a2a2a] hover:border-zinc-500',
              )}
            >
              <Image size={20} className={cn('mb-1.5', isDragging ? 'text-[#4a7eff]' : 'text-zinc-500')} />
              <p className={cn('text-xs', isDragging ? 'text-[#4a7eff]' : 'text-zinc-400')}>
                Drop image, video, or SVG
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">or click to browse</p>
            </div>

            {/* Custom backgrounds grid */}
            {customBackgrounds.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {customBackgrounds.map((bg) => {
                  const isActive =
                    (bg.type === 'video' &&
                      config.backgroundType === 'video' &&
                      config.backgroundVideoUrl === bg.dataUrl) ||
                    (bg.type !== 'video' &&
                      config.backgroundType === 'image' &&
                      config.backgroundImageUrl === bg.dataUrl)
                  return (
                    <div key={bg.id} className="relative group">
                      <button
                        onClick={() => {
                          if (bg.type === 'video') {
                            setBackgroundType('video')
                            setBackgroundVideoUrl(bg.dataUrl)
                          } else {
                            setBackgroundType('image')
                            setBackgroundImageUrl(bg.dataUrl)
                          }
                        }}
                        className={cn(
                          'w-full aspect-video rounded-sm border overflow-hidden',
                          isActive
                            ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900 border-[#4a7eff]'
                            : 'border-white/5 hover:border-zinc-400',
                        )}
                      >
                        {bg.type === 'video' ? (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Film size={14} className="text-zinc-500" />
                          </div>
                        ) : (
                          <img src={bg.dataUrl} alt={bg.label} className="w-full h-full object-cover" />
                        )}
                      </button>
                      <button
                        onClick={() => removeCustomBackground(bg.id)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Code Background */}
          <div className="space-y-2 pt-3 border-t border-white/5">
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Code Background</h4>

            {/* Copy AI prompt button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(CODE_BACKGROUND_PROMPT)
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2a2a2a] text-zinc-300 hover:bg-[#3a3a3a] border border-white/5 transition-colors text-[11px] font-medium"
            >
              <Copy size={12} />
              Copy AI Prompt
            </button>

            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              placeholder={`// Paste AI-generated JS code here\n// Uses draw(ctx, w, h, t, controls)\n// addControl(id, label, min, max, val)\n// addControl(id, label, "color", "#hex")\n// addControl(id, label, "toggle", true)\n// addControl(id, label, "text", "value")\n// addControl(id, label, "dropdown", "sel", [...])`}
              className="w-full h-40 px-3 py-2 rounded-lg bg-[#2a2a2a] border border-white/5 text-[11px] text-zinc-200 font-mono placeholder-zinc-600 outline-none focus:ring-1 focus:ring-[#4a7eff] transition-colors resize-y"
              spellCheck={false}
            />
            <button
              onClick={applyCode}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 border border-[#4a7eff]/20 hover:border-[#4a7eff]/30 transition-colors text-[11px] font-medium"
            >
              <Zap size={12} />
              Apply Code
            </button>

            {/* Auto-generated controls from addControl() */}
            {config.backgroundCodeControls && config.backgroundCodeControls.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Controls</span>
                {config.backgroundCodeControls.map((ctrl) => {
                  if (ctrl.type === 'slider') {
                    return (
                      <PanelSlider
                        key={ctrl.id}
                        label={ctrl.label}
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step ?? 0.01}
                        value={ctrl.value}
                        onChange={(v) => updateBackgroundCodeControl(ctrl.id, v)}
                      />
                    )
                  }
                  if (ctrl.type === 'color') {
                    return (
                      <div key={ctrl.id} className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-20 shrink-0">{ctrl.label}</span>
                        <ColorPicker
                          color={ctrl.value}
                          onChange={(c) => updateBackgroundCodeControl(ctrl.id, c)}
                          showAlpha={false}
                        />
                      </div>
                    )
                  }
                  if (ctrl.type === 'toggle') {
                    return (
                      <PanelToggle
                        key={ctrl.id}
                        label={ctrl.label}
                        checked={ctrl.value}
                        onChange={(v) => updateBackgroundCodeControl(ctrl.id, v)}
                      />
                    )
                  }
                  if (ctrl.type === 'text') {
                    return (
                      <div key={ctrl.id} className="flex items-center gap-3">
                        <span className="text-gray-400 text-[11px] w-20 shrink-0">{ctrl.label}</span>
                        <input
                          type="text"
                          value={ctrl.value}
                          onChange={(e) => updateBackgroundCodeControl(ctrl.id, e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-[#2a2a2a] border border-white/5 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-[#4a7eff]"
                        />
                      </div>
                    )
                  }
                  if (ctrl.type === 'dropdown') {
                    return (
                      <PanelSelect
                        key={ctrl.id}
                        label={ctrl.label}
                        value={ctrl.value}
                        onChange={(v) => updateBackgroundCodeControl(ctrl.id, v)}
                        options={ctrl.options.map((o) => ({ value: o, label: o }))}
                      />
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
