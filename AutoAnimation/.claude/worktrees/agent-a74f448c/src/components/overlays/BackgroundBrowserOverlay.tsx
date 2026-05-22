import { useState, useRef } from 'react'
import { Palette, Image, Trash2, Film, Zap, Copy } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { ColorPicker } from '@/components/ui'
import { PanelSlider, PanelToggle, PanelSelect } from '@/components/ui/panel-controls'
import { parseCodeControls, CODE_BACKGROUND_PROMPT } from '@/services/codeBackground'
import { cn } from '@/lib/utils'

const WB_BACKGROUND_STYLES: { label: string; color: string; style: string }[] = [
  { label: 'White', color: '#ffffff', style: 'white' },
  { label: 'Light Gray', color: '#f5f5f5', style: 'light-gray' },
  { label: 'Dark', color: '#1e1e1e', style: 'dark' },
  { label: 'Cream', color: '#fdf6e3', style: 'cream' },
  { label: 'Chalkboard', color: '#2d4a3e', style: 'chalkboard' },
  { label: 'Blueprint', color: '#1a2744', style: 'blueprint' },
  { label: 'Cutting Mat', color: '#1a3bc2', style: 'cutting-mat' },
  { label: 'Drafting', color: '#0f2e7a', style: 'drafting' },
]

export default function BackgroundBrowserOverlay({ onClose }: { onClose: () => void }) {
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
  const addCustomBackground = useWhiteboardStore((s) => s.addCustomBackground)
  const removeCustomBackground = useWhiteboardStore((s) => s.removeCustomBackground)

  const [isDragging, setIsDragging] = useState(false)
  const [codeText, setCodeText] = useState(config.backgroundCode ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (files: FileList | null) => {
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

  return (
    <CanvasOverlay title="Background Browser" icon={Palette} onClose={onClose}>
      <div className="h-full overflow-y-auto p-6 space-y-8">

        {/* ── Presets ────────────────────────────────────────────── */}
        <div className="space-y-3">
          <span className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">Presets</span>
          <div className="grid grid-cols-4 gap-3">
            {WB_BACKGROUND_STYLES.map((bg) => {
              const isActive = config.backgroundType === 'preset' && config.backgroundStyle === bg.style
              return (
                <button
                  key={bg.style}
                  onClick={() => {
                    setBackgroundColor(bg.color)
                    setBackgroundStyle(bg.style)
                    setBackgroundType('preset')
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                    isActive
                      ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-zinc-800 bg-zinc-700/30'
                      : 'hover:bg-zinc-700/30'
                  )}
                >
                  <div
                    className="w-full aspect-video rounded-md border border-zinc-600 relative overflow-hidden"
                    style={{ backgroundColor: bg.color }}
                  >
                    {bg.style === 'cutting-mat' && (
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 27" preserveAspectRatio="none">
                        <line x1="12" y1="0" x2="12" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                        <line x1="24" y1="0" x2="24" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                        <line x1="36" y1="0" x2="36" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                        <line x1="0" y1="9" x2="48" y2="9" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                        <line x1="0" y1="18" x2="48" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
                      </svg>
                    )}
                    {bg.style === 'drafting' && (
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 27" preserveAspectRatio="none">
                        {[8,16,24,32,40].map(x => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={27} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>)}
                        {[7,14,20].map(y => <line key={`h${y}`} x1={0} y1={y} x2={48} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>)}
                        <path d="M 14 27 A 20 20 0 0 1 34 27" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">{bg.label}</span>
                </button>
              )
            })}
          </div>

          {/* Custom color */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-gray-400 text-sm w-20 shrink-0">Color</span>
            <ColorPicker
              color={config.backgroundColor}
              onChange={(c) => { setBackgroundColor(c); setBackgroundStyle('custom'); setBackgroundType('preset') }}
              showAlpha={false}
            />
          </div>
        </div>

        {/* ── Custom Uploads ─────────────────────────────────────── */}
        <div className="space-y-3">
          <span className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">Custom Uploads</span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.svg"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
              isDragging
                ? 'border-green-500 bg-green-500/10'
                : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-500'
            )}
          >
            <Image size={24} className={cn('mb-2', isDragging ? 'text-green-400' : 'text-zinc-500')} />
            <p className={cn('text-sm', isDragging ? 'text-green-400' : 'text-zinc-400')}>
              Drop image, video, or SVG
            </p>
            <p className="text-xs text-zinc-600 mt-1">or click to browse</p>
          </div>

          {customBackgrounds.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {customBackgrounds.map((bg) => {
                const isActive =
                  (bg.type === 'video' && config.backgroundType === 'video' && config.backgroundVideoUrl === bg.dataUrl) ||
                  (bg.type !== 'video' && config.backgroundType === 'image' && config.backgroundImageUrl === bg.dataUrl)
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
                        'w-full aspect-video rounded-md border overflow-hidden',
                        isActive
                          ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-zinc-800 border-green-500'
                          : 'border-zinc-600 hover:border-zinc-400'
                      )}
                    >
                      {bg.type === 'video' ? (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <Film size={16} className="text-zinc-500" />
                        </div>
                      ) : (
                        <img src={bg.dataUrl} alt={bg.label} className="w-full h-full object-cover" />
                      )}
                    </button>
                    <button
                      onClick={() => removeCustomBackground(bg.id)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/60 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Code Background ────────────────────────────────────── */}
        <div className="space-y-3">
          <span className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">Code Background</span>

          {/* Copy AI prompt button */}
          <button
            onClick={() => { navigator.clipboard.writeText(CODE_BACKGROUND_PROMPT) }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-600 transition-colors text-xs font-medium"
          >
            <Copy size={14} />
            Copy AI Prompt
          </button>

          <textarea
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            placeholder={`// Paste AI-generated JS code here\n// Uses draw(ctx, w, h, t, controls)\n// addControl(id, label, min, max, val)\n// addControl(id, label, "color", "#hex")\n// addControl(id, label, "toggle", true)\n// addControl(id, label, "text", "value")\n// addControl(id, label, "dropdown", "sel", [...])`}
            className="w-full h-48 px-4 py-3 rounded-lg bg-zinc-900/80 border border-zinc-700 text-xs text-zinc-200 font-mono placeholder-zinc-600 outline-none focus:border-green-500/40 transition-colors resize-y"
            spellCheck={false}
          />
          <button
            onClick={applyCode}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 transition-colors text-xs font-medium"
          >
            <Zap size={14} />
            Apply Code
          </button>

          {/* Auto-generated controls from addControl() */}
          {config.backgroundCodeControls && config.backgroundCodeControls.length > 0 && (
            <div className="space-y-3 pt-2">
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
                      <ColorPicker color={ctrl.value} onChange={(c) => updateBackgroundCodeControl(ctrl.id, c)} showAlpha={false} />
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
                      <span className="text-gray-400 text-xs w-20 shrink-0">{ctrl.label}</span>
                      <input
                        type="text"
                        value={ctrl.value}
                        onChange={(e) => updateBackgroundCodeControl(ctrl.id, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded bg-zinc-800/50 border border-white/5 text-xs text-zinc-200 outline-none focus:border-green-500/30"
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
    </CanvasOverlay>
  )
}
