import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Blend,
  Scissors,
  SunDim,
  SunMedium,
  PanelLeftClose,
  PanelRightClose,
  Check,
  X,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelCategoryTabs, PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { useTimelineStore, useEditorStore } from '@/stores'
import type {
  TransitionType,
  TransitionConfig,
  TransitionPreset,
  EasingType,
} from '@/types/transitions'
import type { ClipTransition } from '@/types/timeline'
import {
  TRANSITION_PRESETS,
  EASING_OPTIONS,
  DEFAULT_TRANSITION_CONFIG,
} from '@/types/transitions'

const TRANSITION_DRAG_MIME = 'application/x-transition-preset'

// ── Filter categories ─────────────────────────────────────────────────────────

const TRANSITION_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'wipe', label: 'Wipe' },
  { id: 'dissolve', label: 'Dissolve' },
  { id: 'cut', label: 'Cut' },
]

// Icon mapping for each transition preset
function getTransitionIcon(type: TransitionType) {
  switch (type) {
    case 'fade-in':
      return SunMedium
    case 'fade-out':
      return SunDim
    case 'slide-left':
      return ArrowLeft
    case 'slide-right':
      return ArrowRight
    case 'slide-up':
      return ArrowUp
    case 'slide-down':
      return ArrowDown
    case 'zoom-in':
      return Maximize2
    case 'zoom-out':
      return Minimize2
    case 'dissolve':
      return Blend
    case 'wipe-left':
      return PanelLeftClose
    case 'wipe-right':
      return PanelRightClose
    case 'cut':
      return Scissors
    default:
      return ArrowRight
  }
}

// Category color classes matching the dark theme
const categoryColors: Record<string, string> = {
  fade: 'bg-amber-500/20 text-amber-400',
  slide: 'bg-blue-500/20 text-blue-400',
  zoom: 'bg-purple-500/20 text-purple-400',
  dissolve: 'bg-cyan-500/20 text-cyan-400',
  wipe: 'bg-orange-500/20 text-orange-400',
  cut: 'bg-gray-500/20 text-gray-400',
}

// Mini animated preview for each transition type
function TransitionPreviewAnimation({
  type,
  isPlaying,
  gradientClass,
}: {
  type: TransitionType
  isPlaying: boolean
  gradientClass?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPlaying || !boxRef.current) return

    const el = boxRef.current
    el.style.transition = 'none'

    // Reset to initial state
    switch (type) {
      case 'fade-in':
        el.style.opacity = '0'
        break
      case 'fade-out':
        el.style.opacity = '1'
        break
      case 'slide-left':
        el.style.transform = 'translateX(100%)'
        el.style.opacity = '1'
        break
      case 'slide-right':
        el.style.transform = 'translateX(-100%)'
        el.style.opacity = '1'
        break
      case 'slide-up':
        el.style.transform = 'translateY(100%)'
        el.style.opacity = '1'
        break
      case 'slide-down':
        el.style.transform = 'translateY(-100%)'
        el.style.opacity = '1'
        break
      case 'zoom-in':
        el.style.transform = 'scale(0.2)'
        el.style.opacity = '0.5'
        break
      case 'zoom-out':
        el.style.transform = 'scale(1.8)'
        el.style.opacity = '0.5'
        break
      case 'dissolve':
        el.style.opacity = '0'
        el.style.filter = 'blur(4px)'
        break
      case 'wipe-left':
        el.style.clipPath = 'inset(0 0 0 100%)'
        el.style.opacity = '1'
        break
      case 'wipe-right':
        el.style.clipPath = 'inset(0 100% 0 0)'
        el.style.opacity = '1'
        break
      case 'cut':
        el.style.opacity = '0'
        break
    }

    // Force reflow
    void el.offsetWidth

    // Animate to final state
    const duration = type === 'cut' ? 50 : 600
    el.style.transition = `all ${duration}ms ease-in-out`

    requestAnimationFrame(() => {
      switch (type) {
        case 'fade-in':
          el.style.opacity = '1'
          break
        case 'fade-out':
          el.style.opacity = '0'
          break
        case 'slide-left':
        case 'slide-right':
        case 'slide-up':
        case 'slide-down':
          el.style.transform = 'translate(0, 0)'
          break
        case 'zoom-in':
          el.style.transform = 'scale(1)'
          el.style.opacity = '1'
          break
        case 'zoom-out':
          el.style.transform = 'scale(1)'
          el.style.opacity = '1'
          break
        case 'dissolve':
          el.style.opacity = '1'
          el.style.filter = 'blur(0px)'
          break
        case 'wipe-left':
          el.style.clipPath = 'inset(0 0 0 0)'
          break
        case 'wipe-right':
          el.style.clipPath = 'inset(0 0 0 0)'
          break
        case 'cut':
          el.style.opacity = '1'
          break
      }
    })
  }, [type, isPlaying])

  return (
    <div className="w-full h-full overflow-hidden rounded flex items-center justify-center bg-[#1e1e1e]">
      <div
        ref={boxRef}
        className={cn(
          'w-3/4 h-3/4 rounded',
          gradientClass || 'bg-gradient-to-br from-green-500 to-green-700'
        )}
      />
    </div>
  )
}

type ApplyMode = 'in' | 'out'

type TransitionCategory = 'all' | 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe' | 'cut'

// ── Main Panel ────────────────────────────────────────────────────────────────

export function TransitionsPanel() {
  const [selectedTransition, setSelectedTransition] = useState<TransitionType | null>(null)
  const [config, setConfig] = useState<TransitionConfig>({ ...DEFAULT_TRANSITION_CONFIG })
  const [applyMode, setApplyMode] = useState<ApplyMode>('in')
  const [detailAnchorY, setDetailAnchorY] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<TransitionCategory>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Timeline integration
  const selectedClipIds = useTimelineStore((s) => s.selectedClipIds)
  const tracks = useTimelineStore((s) => s.tracks)
  const updateClip = useTimelineStore((s) => s.updateClip)

  // Find the selected clip info
  const selectedClipInfo = (() => {
    if (selectedClipIds.length === 0) return null
    const clipId = selectedClipIds[0]
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === clipId)
      if (clip) return { clip, trackId: track.id }
    }
    return null
  })()

  const handleSelectTransition = useCallback(
    (type: TransitionType, anchorY: number) => {
      if (selectedTransition === type) {
        // Toggle off
        setSelectedTransition(null)
        return
      }
      setSelectedTransition(type)
      setConfig((prev) => ({ ...prev, type }))
      setDetailAnchorY(anchorY)
    },
    [selectedTransition]
  )

  const handleCloseDetail = useCallback(() => {
    setSelectedTransition(null)
  }, [])

  const handleDurationChange = useCallback((value: number) => {
    setConfig((prev) => ({ ...prev, duration: value }))
  }, [])

  const handleEasingChange = useCallback((easing: EasingType) => {
    setConfig((prev) => ({ ...prev, easing }))
  }, [])

  const handleCubicBezierChange = useCallback(
    (index: number, value: number) => {
      setConfig((prev) => {
        const current = prev.cubicBezierValues || [0.42, 0, 0.58, 1]
        const next: [number, number, number, number] = [...current]
        next[index] = value
        return { ...prev, cubicBezierValues: next }
      })
    },
    []
  )

  const handleApplyTransition = useCallback(() => {
    if (!selectedClipInfo || !selectedTransition) return

    const transitionData = {
      type: config.type,
      duration: config.duration,
      easing: config.easing,
      ...(config.easing === 'cubic-bezier' && config.cubicBezierValues
        ? { cubicBezierValues: config.cubicBezierValues }
        : {}),
    }

    if (applyMode === 'in') {
      updateClip(selectedClipInfo.trackId, selectedClipInfo.clip.id, {
        transitionIn: transitionData,
      })
    } else {
      updateClip(selectedClipInfo.trackId, selectedClipInfo.clip.id, {
        transitionOut: transitionData,
      })
    }
  }, [selectedClipInfo, selectedTransition, config, applyMode, updateClip])

  const selectedPreset = TRANSITION_PRESETS.find((p) => p.id === selectedTransition)

  const filteredPresets = useMemo(() => {
    return TRANSITION_PRESETS.filter((preset) => {
      const matchesCategory = categoryFilter === 'all' || preset.category === categoryFilter
      const matchesSearch = !searchQuery.trim() || preset.name.toLowerCase().includes(searchQuery.toLowerCase()) || preset.category.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [categoryFilter, searchQuery])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search + Filter + Expand ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transitions..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
              filtersOpen
                ? 'bg-[#4a7eff]/20 text-[#4a7eff]'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
            )}
          >
            <SlidersHorizontal size={14} />
            {categoryFilter !== 'all' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />
            )}
          </button>
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('transition-picker')}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a] transition-colors"
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Filter categories ── */}
      {filtersOpen && (
        <div className="shrink-0 px-3 pb-2">
          <PanelCategoryTabs
            tabs={TRANSITION_CATEGORIES}
            activeTab={categoryFilter}
            onChange={(id) => setCategoryFilter(id as TransitionCategory)}
            compact
          />
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredPresets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Blend size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No transitions found</span>
            <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredPresets.map((preset) => (
              <TransitionCard
                key={preset.id}
                preset={preset}
                isSelected={selectedTransition === preset.id}
                onSelect={(anchorY) => handleSelectTransition(preset.id, anchorY)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer hint ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <p className="text-[10px] text-gray-600 text-center">
          Hover to preview, click to configure. Drag onto timeline clips.
        </p>
      </div>

      {/* Floating Detail Panel (portal) */}
      {selectedTransition && selectedPreset && (
        <TransitionDetailPanel
          preset={selectedPreset}
          config={config}
          applyMode={applyMode}
          selectedClipInfo={selectedClipInfo}
          anchorY={detailAnchorY}
          onClose={handleCloseDetail}
          onDurationChange={handleDurationChange}
          onEasingChange={handleEasingChange}
          onCubicBezierChange={handleCubicBezierChange}
          onApplyModeChange={setApplyMode}
          onApply={handleApplyTransition}
        />
      )}
    </div>
  )
}

// ─── Transition Card (2-col grid item with hover animation) ──────────────────

function TransitionCard({
  preset,
  isSelected,
  onSelect,
}: {
  preset: TransitionPreset
  isSelected: boolean
  onSelect: (anchorY: number) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [hoverKey, setHoverKey] = useState(0)
  const cardRef = useRef<HTMLButtonElement>(null)
  const Icon = getTransitionIcon(preset.id)

  const handleMouseEnter = () => {
    setIsHovered(true)
    setHoverKey((k) => k + 1)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleClick = () => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const anchorY = rect.top + rect.height / 2
    onSelect(anchorY)
  }

  const handleDragStart = (e: React.DragEvent) => {
    const data: TransitionConfig = {
      type: preset.id,
      duration: DEFAULT_TRANSITION_CONFIG.duration,
      easing: DEFAULT_TRANSITION_CONFIG.easing,
    }
    e.dataTransfer.setData(TRANSITION_DRAG_MIME, JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const showAnimation = isHovered || isSelected

  return (
    <button
      ref={cardRef}
      data-transition-card
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-lg border overflow-hidden cursor-grab active:cursor-grabbing transition-all group text-left',
        isSelected
          ? 'border-[#4a7eff] bg-[#4a7eff]/10'
          : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-[#3a3a3a]'
      )}
    >
      {/* Preview area */}
      <div className="aspect-video bg-[#1e1e1e] flex items-center justify-center overflow-hidden relative">
        {showAnimation ? (
          <TransitionPreviewAnimation
            key={isSelected ? `selected-${hoverKey}` : `hover-${hoverKey}`}
            type={preset.id}
            isPlaying={true}
          />
        ) : (
          <Icon
            size={24}
            className="text-gray-600 group-hover:text-gray-400 transition-colors"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="text-xs font-medium text-white truncate">{preset.name}</div>
        <div className="flex items-center gap-1 mt-1">
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              categoryColors[preset.category]
            )}
          >
            {preset.category}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─── Floating Detail Panel (like AssetDetailsPanel) ──────────────────────────

function TransitionDetailPanel({
  preset,
  config,
  applyMode,
  selectedClipInfo,
  anchorY,
  onClose,
  onDurationChange,
  onEasingChange,
  onCubicBezierChange,
  onApplyModeChange,
  onApply,
}: {
  preset: TransitionPreset
  config: TransitionConfig
  applyMode: ApplyMode
  selectedClipInfo: { clip: { id: string; name: string; transitionIn?: ClipTransition; transitionOut?: ClipTransition }; trackId: string } | null
  anchorY: number
  onClose: () => void
  onDurationChange: (v: number) => void
  onEasingChange: (e: EasingType) => void
  onCubicBezierChange: (i: number, v: number) => void
  onApplyModeChange: (m: ApplyMode) => void
  onApply: () => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement
        if (!target.closest('[data-transition-card]')) {
          onClose()
        }
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Auto-replay preview when preset changes
  useEffect(() => {
    setPreviewKey((k) => k + 1)
  }, [preset.id])

  // Position: to the right of the left panel (300px wide + 16px gap)
  const leftPanelWidth = 300
  const gap = 16
  const panelLeft = leftPanelWidth + gap
  const panelTop = Math.max(80, Math.min(anchorY - 180, window.innerHeight - 520))

  // Connection line coordinates
  const panelLeftEdge = panelLeft
  const panelCenterY = panelTop + 180

  return createPortal(
    <>
      {/* Connection Line SVG */}
      <svg
        className="fixed inset-0 pointer-events-none z-[39]"
        style={{ width: '100%', height: '100%' }}
      >
        <line
          x1={leftPanelWidth}
          y1={anchorY}
          x2={panelLeftEdge}
          y2={panelCenterY}
          stroke="#22c55e"
          strokeWidth={2}
          className={cn(
            'transition-all duration-300',
            isVisible ? 'opacity-60' : 'opacity-0'
          )}
        />
        <circle
          cx={leftPanelWidth}
          cy={anchorY}
          r={4}
          fill="#22c55e"
          className={cn(
            'transition-all duration-300',
            isVisible ? 'opacity-80' : 'opacity-0'
          )}
        />
        <circle
          cx={panelLeftEdge}
          cy={panelCenterY}
          r={4}
          fill="#22c55e"
          className={cn(
            'transition-all duration-300',
            isVisible ? 'opacity-80' : 'opacity-0'
          )}
        />
      </svg>

      {/* Floating Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed z-40 w-[260px] bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl shadow-2xl overflow-hidden transition-all duration-300',
          isVisible
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-4'
        )}
        style={{
          left: panelLeft,
          top: panelTop,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                categoryColors[preset.category]
              )}
            >
              {preset.category}
            </span>
            <span className="text-sm font-medium text-white">{preset.name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#3a3a3a] text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Preview</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="p-1 rounded hover:bg-[#3a3a3a] text-gray-500 hover:text-[#4a7eff] transition-colors"
                title="Replay"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => setPreviewEnabled(!previewEnabled)}
                className={cn(
                  'p-1 rounded transition-colors',
                  previewEnabled
                    ? 'text-[#4a7eff] bg-[#4a7eff]/10'
                    : 'text-gray-500 hover:bg-[#3a3a3a]'
                )}
                title={previewEnabled ? 'Disable preview' : 'Enable preview'}
              >
                {previewEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            </div>
          </div>
          <div className="h-28 rounded-lg border border-[#3a3a3a] bg-[#1e1e1e] overflow-hidden">
            {previewEnabled ? (
              <TransitionPreviewAnimation
                key={previewKey}
                type={preset.id}
                isPlaying={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                Preview disabled
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">{preset.description}</p>
        </div>

        {/* Config Section */}
        <div className="px-3 pb-3 space-y-3">
          {/* Duration Slider */}
          <PanelSlider
            label="Duration"
            value={config.duration}
            onChange={onDurationChange}
            min={0.1}
            max={2}
            step={0.1}
            precision={1}
            suffix="s"
            compact
          />

          {/* Easing Select */}
          <PanelSelect
            label="Easing"
            value={config.easing}
            onChange={(v) => onEasingChange(v as EasingType)}
            options={EASING_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            fullWidth
          />

          {/* Cubic Bezier Values */}
          {config.easing === 'cubic-bezier' && (
            <div className="space-y-2 p-2.5 bg-[#1e1e1e]/50 rounded-lg">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide">
                Cubic Bezier
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {['x1', 'y1', 'x2', 'y2'].map((label, index) => (
                  <PanelSlider
                    key={label}
                    label={label}
                    inline
                    value={(config.cubicBezierValues || [0.42, 0, 0.58, 1])[index]}
                    onChange={(v) => onCubicBezierChange(index, v)}
                    min={0}
                    max={1}
                    step={0.05}
                    precision={2}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Easing Visual Hint */}
          {config.easing !== 'cubic-bezier' && (
            <div className="p-2.5 bg-[#1e1e1e]/50 rounded-lg">
              <span className="text-[10px] text-gray-500 mb-1 block">Easing Curve</span>
              <EasingCurvePreview easing={config.easing} />
            </div>
          )}
        </div>

        {/* Apply Section */}
        <div className="px-3 pb-3 pt-2 border-t border-[#3a3a3a] space-y-2">
          {/* In/Out Toggle */}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onApplyModeChange('in')}
              className={cn(
                'py-1.5 rounded text-xs font-medium transition-colors',
                applyMode === 'in'
                  ? 'bg-[#4a7eff] text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
              )}
            >
              Transition In
            </button>
            <button
              onClick={() => onApplyModeChange('out')}
              className={cn(
                'py-1.5 rounded text-xs font-medium transition-colors',
                applyMode === 'out'
                  ? 'bg-[#4a7eff] text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
              )}
            >
              Transition Out
            </button>
          </div>

          {/* Apply button */}
          {selectedClipInfo ? (
            <button
              onClick={onApply}
              className="w-full py-2 px-3 bg-[#4a7eff]/10 border border-[#4a7eff]/30 rounded-lg text-[#4a7eff] text-sm hover:bg-[#4a7eff]/30 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={14} />
              Apply to "{selectedClipInfo.clip.name || 'Clip'}"
            </button>
          ) : (
            <div className="py-2.5 text-center text-gray-600 text-[11px] bg-[#1e1e1e]/50 rounded-lg border border-white/5">
              Select a clip in the timeline to apply
            </div>
          )}

          {/* Current clip transition info */}
          {selectedClipInfo && (selectedClipInfo.clip.transitionIn || selectedClipInfo.clip.transitionOut) && (
            <div className="space-y-1 p-2 bg-[#1e1e1e]/50 rounded-lg text-[11px]">
              {selectedClipInfo.clip.transitionIn && (
                <div className="flex justify-between text-gray-500">
                  <span>Current In</span>
                  <span className="text-amber-400">
                    {selectedClipInfo.clip.transitionIn.type} ({selectedClipInfo.clip.transitionIn.duration}s)
                  </span>
                </div>
              )}
              {selectedClipInfo.clip.transitionOut && (
                <div className="flex justify-between text-gray-500">
                  <span>Current Out</span>
                  <span className="text-amber-400">
                    {selectedClipInfo.clip.transitionOut.type} ({selectedClipInfo.clip.transitionOut.duration}s)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Simple SVG easing curve preview ─────────────────────────────────────────

function EasingCurvePreview({ easing }: { easing: EasingType }) {
  const getPath = () => {
    switch (easing) {
      case 'linear':
        return 'M 0 40 L 60 0'
      case 'ease-in':
        return 'M 0 40 C 20 40, 40 20, 60 0'
      case 'ease-out':
        return 'M 0 40 C 20 20, 40 0, 60 0'
      case 'ease-in-out':
        return 'M 0 40 C 20 40, 40 0, 60 0'
      default:
        return 'M 0 40 L 60 0'
    }
  }

  return (
    <svg
      viewBox="0 0 60 40"
      className="w-full h-8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid lines */}
      <line x1="0" y1="40" x2="60" y2="40" stroke="#3f3f46" strokeWidth="0.5" />
      <line x1="0" y1="0" x2="60" y2="0" stroke="#3f3f46" strokeWidth="0.5" />
      <line x1="0" y1="20" x2="60" y2="20" stroke="#3f3f46" strokeWidth="0.3" strokeDasharray="2" />
      {/* Curve */}
      <path d={getPath()} stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
      {/* Start and end dots */}
      <circle cx="0" cy="40" r="2" fill="#22c55e" />
      <circle cx="60" cy="0" r="2" fill="#22c55e" />
    </svg>
  )
}
