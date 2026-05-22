import { useState, useMemo, useCallback } from 'react'
import {
  Palette,
  Shuffle,
  Plus,
  Trash2,
  Save,
  CircleDot,
  Wind,
  Waves,
  Flame,
  Ribbon,
  Circle,
  Snail,
  Grab,
  PartyPopper,
  Spline,
  Sun,
  Sparkles,
  Mountain,
  Star,
  Hexagon,
  Cloudy,
  MapPin,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeSvg } from '@/services/sanitize'
import { PanelLayout } from '@/components/ui/PanelHeader'
import {
  PanelSection,
  PanelSlider,
  PanelToggle,
  PanelActionButton,
  PanelCategoryTabs,
} from '@/components/ui/panel-controls'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useArtCurveStore } from '@/stores/useArtCurveStore'
import { useEditorStore } from '@/stores'
import { parseTemplateConfig } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import {
  generateSVGArt,
  wrapSVGAsHTML,
  ART_STYLES,
  COLOR_PALETTES,
  type ArtStyle,
  type ArtOptions,
} from '@/services/svgArtGenerator'
import {
  generateArtCurves,
  buildVariableWidthSVG,
} from '@/services/artCurveGenerator'

// ── Style icons ─────────────────────────────────────────────────────────

const STYLE_ICONS: Record<ArtStyle, typeof Palette> = {
  // Playful
  noodle: Spline,
  squiggle: Wind,
  bubbles: CircleDot,
  lava: Flame,
  ribbon: Ribbon,
  bounce: Circle,
  swirl: Snail,
  tentacle: Grab,
  confetti: PartyPopper,
  wiggle: Waves,
  // Classic
  blob: CircleDot,
  flowField: Wind,
  mandala: Sun,
  spiral: Sparkles,
  waves: Waves,
  aurora: Cloudy,
  topography: MapPin,
  constellation: Star,
  geometric: Hexagon,
  landscape: Mountain,
}

const CURVE_PALETTES = [
  { id: 'neon', label: 'Neon', colors: ['#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b'] },
  { id: 'ocean', label: 'Ocean', colors: ['#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4'] },
  { id: 'forest', label: 'Forest', colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'] },
  { id: 'sunset', label: 'Sunset', colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'] },
  { id: 'mono', label: 'Mono', colors: ['#f8f9fa', '#dee2e6', '#adb5bd', '#6c757d', '#343a40'] },
  { id: 'warm', label: 'Warm', colors: ['#ffba08', '#faa307', '#f48c06', '#e85d04', '#dc2f02'] },
  { id: 'cool', label: 'Cool', colors: ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#03045e'] },
  { id: 'candy', label: 'Candy', colors: ['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9'] },
]

// ── Saved art localStorage ──────────────────────────────────────────────

interface SavedArt {
  id: string
  name: string
  style: ArtStyle
  svg: string
  palette: string[]
  options: ArtOptions
  date: number
}

const STORAGE_KEY = 'proanimate-svg-art-saved'

function loadSavedArt(): SavedArt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSavedArt(items: SavedArt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ── Panel Component ─────────────────────────────────────────────────────

export function SVGArtPanel() {
  const [tab, setTab] = useState<'create' | 'curves' | 'saved'>('create')
  const [style, setStyle] = useState<ArtStyle>('noodle')
  const [paletteId, setPaletteId] = useState('neon')
  const [customColors, setCustomColors] = useState<string[] | null>(null)
  const [complexity, setComplexity] = useState(5)
  const [animated, setAnimated] = useState(true)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 999999))
  const [savedArt, setSavedArt] = useState<SavedArt[]>(loadSavedArt)

  // Curve-specific state
  const [curvePaletteId, setCurvePaletteId] = useState('neon')
  const [curveComplexity, setCurveComplexity] = useState(5)
  const [curveAnimated, setCurveAnimated] = useState(true)
  const [curveSeed, setCurveSeed] = useState(() => Math.floor(Math.random() * 999999))
  const [widthStart, setWidthStart] = useState(8)
  const [widthMid, setWidthMid] = useState(16)
  const [widthEnd, setWidthEnd] = useState(4)
  const addCurveComposition = useArtCurveStore((s) => s.addComposition)

  const curvePalette = CURVE_PALETTES.find((p) => p.id === curvePaletteId)?.colors || CURVE_PALETTES[0].colors

  const previewCurves = useMemo(
    () =>
      generateArtCurves({
        style: 'swirl',
        width: 800,
        height: 600,
        palette: curvePalette,
        complexity: curveComplexity,
        seed: curveSeed,
        animated: curveAnimated,
        widthStart,
        widthMid,
        widthEnd,
      }),
    [curvePalette, curveComplexity, curveSeed, curveAnimated, widthStart, widthMid, widthEnd]
  )

  const curvePreviewSVG = useMemo(
    () => buildVariableWidthSVG(previewCurves, 800, 600, curveAnimated),
    [previewCurves, curveAnimated]
  )

  const randomizeCurve = useCallback(() => setCurveSeed(Math.floor(Math.random() * 999999)), [])

  const addCurveToCanvas = useCallback(() => {
    addCurveComposition({
      palette: curvePalette,
      complexity: curveComplexity,
      animated: curveAnimated,
      seed: curveSeed,
      globalWidthStart: widthStart,
      globalWidthMid: widthMid,
      globalWidthEnd: widthEnd,
    })
    useEditorStore.getState().setRightPanelTab('art-curve-properties')
  }, [curvePalette, curveComplexity, curveAnimated, curveSeed, widthStart, widthMid, widthEnd, addCurveComposition])

  const palette = customColors || COLOR_PALETTES.find((p) => p.id === paletteId)?.colors || COLOR_PALETTES[0].colors

  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)

  const options: ArtOptions = useMemo(
    () => ({ style, width: 800, height: 600, palette, complexity, seed, animated }),
    [style, palette, complexity, seed, animated]
  )

  const { svg, name } = useMemo(() => generateSVGArt(options), [options])

  const randomize = useCallback(() => setSeed(Math.floor(Math.random() * 999999)), [])

  const addToCanvas = useCallback(() => {
    const html = wrapSVGAsHTML(svg, palette, name)
    const bridgedHtml = injectMessageBridge(html)
    const staticConfig = parseTemplateConfig(bridgedHtml)
    const totalFrames = useTimelineStore.getState().totalFrames
    const templateId = `svg-art-${Date.now()}`

    useHTMLTemplateLayerStore.getState().addTemplate({
      id: templateId,
      htmlContent: bridgedHtml,
      name: `SVG Art: ${ART_STYLES.find((s) => s.id === style)?.label || style}`,
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 1,
      rotation: 0,
      visible: true,
      width: canvasWidth,
      height: canvasHeight,
      startFrame: 0,
      endFrame: totalFrames,
      customConfig: staticConfig,
    })

    useHTMLTemplateLayerStore.getState().setSelectedTemplateId(templateId)
    useEditorStore.getState().setRightPanelTab('html-template-properties')
  }, [svg, palette, name, style, canvasWidth, canvasHeight])

  const saveArt = useCallback(() => {
    const item: SavedArt = {
      id: `saved-${Date.now()}`,
      name: `${ART_STYLES.find((s) => s.id === style)?.label || style} #${seed}`,
      style,
      svg,
      palette,
      options,
      date: Date.now(),
    }
    const next = [item, ...savedArt]
    setSavedArt(next)
    saveSavedArt(next)
  }, [svg, palette, style, seed, options, savedArt])

  const deleteSaved = useCallback(
    (id: string) => {
      const next = savedArt.filter((a) => a.id !== id)
      setSavedArt(next)
      saveSavedArt(next)
    },
    [savedArt]
  )

  const useSaved = useCallback(
    (item: SavedArt) => {
      const html = wrapSVGAsHTML(item.svg, item.palette, item.name)
      const bridgedHtml = injectMessageBridge(html)
      const staticConfig = parseTemplateConfig(bridgedHtml)
      const totalFrames = useTimelineStore.getState().totalFrames
      const templateId = `svg-art-${Date.now()}`

      useHTMLTemplateLayerStore.getState().addTemplate({
        id: templateId,
        htmlContent: bridgedHtml,
        name: `SVG Art: ${item.name}`,
        position: { x: 0, y: 0 },
        scale: 1,
        opacity: 1,
        zIndex: 1,
        rotation: 0,
        visible: true,
        width: canvasWidth,
        height: canvasHeight,
        startFrame: 0,
        endFrame: totalFrames,
        customConfig: staticConfig,
      })

      useHTMLTemplateLayerStore.getState().setSelectedTemplateId(templateId)
      useEditorStore.getState().setRightPanelTab('html-template-properties')
    },
    [canvasWidth, canvasHeight]
  )

  return (
    <PanelLayout icon={Palette} title="SVG Art" trailing={
      <button
        onClick={() => useEditorStore.getState().openCanvasOverlay('svg-art-generator')}
        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
        title="Expand"
      >
        <Maximize2 size={15} />
      </button>
    }>
      {/* ── Sub-tab navigation ── */}
      <PanelCategoryTabs
        tabs={[
          { id: 'create', label: 'Create' },
          { id: 'curves', label: 'Curves' },
          { id: 'saved', label: `Saved (${savedArt.length})` },
        ]}
        activeTab={tab}
        onChange={(id) => setTab(id as typeof tab)}
        compact
      />

      {tab === 'create' ? (
        <>
          {/* Style grid — Playful */}
          <PanelSection title="Playful">
            <div className="grid grid-cols-5 gap-1.5">
              {ART_STYLES.filter((s) => s.group === 'playful').map((s) => {
                const Icon = STYLE_ICONS[s.id]
                return (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-[10px] border',
                      style === s.id
                        ? 'bg-[#4a7eff]/10 text-[#4a7eff] border-[#4a7eff]/50'
                        : 'bg-[#2a2a2a] border-[#3a3a3a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white',
                    )}
                  >
                    <Icon size={16} />
                    <span className="truncate w-full text-center">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </PanelSection>

          {/* Style grid — Classic */}
          <PanelSection title="Classic">
            <div className="grid grid-cols-5 gap-1.5">
              {ART_STYLES.filter((s) => s.group === 'classic').map((s) => {
                const Icon = STYLE_ICONS[s.id]
                return (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-[10px] border',
                      style === s.id
                        ? 'bg-[#4a7eff]/10 text-[#4a7eff] border-[#4a7eff]/50'
                        : 'bg-[#2a2a2a] border-[#3a3a3a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white',
                    )}
                  >
                    <Icon size={16} />
                    <span className="truncate w-full text-center">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </PanelSection>

          {/* Color palettes */}
          <PanelSection title="Palette">
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPaletteId(p.id)
                    setCustomColors(null)
                  }}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg overflow-hidden transition-all border',
                    paletteId === p.id && !customColors
                      ? 'border-[#4a7eff] bg-[#4a7eff]/10'
                      : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-gray-600',
                  )}
                >
                  <div className="flex w-full h-5">
                    {p.colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 px-1.5 pb-1">{p.label}</span>
                </button>
              ))}
            </div>
          </PanelSection>

          {/* Complexity + Animated */}
          <PanelSection noBorder>
            <PanelSlider label="Complexity" value={complexity} onChange={setComplexity} min={1} max={10} step={1} />
            <PanelToggle label="Animated" checked={animated} onChange={setAnimated} />
          </PanelSection>

          {/* Action buttons */}
          <div className="flex gap-2">
            <PanelActionButton onClick={randomize} variant="secondary" icon={Shuffle} fullWidth>
              Randomize
            </PanelActionButton>
            <PanelActionButton onClick={saveArt} variant="secondary" icon={Save} size="sm">
              {' '}
            </PanelActionButton>
          </div>

          {/* Live preview */}
          <div>
            <span className="text-gray-400 text-sm mb-2 block">Preview</span>
            <div
              className="w-full aspect-[4/3] bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#3a3a3a]"
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
            />
          </div>

          {/* Add to Canvas */}
          <PanelActionButton onClick={addToCanvas} variant="accent" icon={Plus} fullWidth>
            Add to Canvas
          </PanelActionButton>
        </>
      ) : tab === 'curves' ? (
        /* Curves tab — single swirl style */
        <>
          {/* Thickness sliders */}
          <PanelSection title="Thickness">
            <PanelSlider label="Start" value={widthStart} onChange={(v) => setWidthStart(v)} min={2} max={50} step={1} suffix="px" compact />
            <PanelSlider label="Mid" value={widthMid} onChange={(v) => setWidthMid(v)} min={2} max={50} step={1} suffix="px" compact />
            <PanelSlider label="End" value={widthEnd} onChange={(v) => setWidthEnd(v)} min={2} max={50} step={1} suffix="px" compact />
          </PanelSection>

          {/* Curve color palettes */}
          <PanelSection title="Palette">
            <div className="grid grid-cols-2 gap-1.5">
              {CURVE_PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCurvePaletteId(p.id)}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg overflow-hidden transition-all border',
                    curvePaletteId === p.id
                      ? 'border-[#4a7eff] bg-[#4a7eff]/10'
                      : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-gray-600',
                  )}
                >
                  <div className="flex w-full h-5">
                    {p.colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 px-1.5 pb-1">{p.label}</span>
                </button>
              ))}
            </div>
          </PanelSection>

          {/* Complexity + animated */}
          <PanelSection noBorder>
            <PanelSlider label="Complexity" value={curveComplexity} onChange={(v) => setCurveComplexity(v)} min={1} max={10} step={1} />
            <PanelToggle label="Animated" checked={curveAnimated} onChange={setCurveAnimated} />
          </PanelSection>

          {/* Randomize */}
          <PanelActionButton onClick={randomizeCurve} variant="secondary" icon={Shuffle} fullWidth>
            Randomize
          </PanelActionButton>

          {/* Curve preview */}
          <div>
            <span className="text-gray-400 text-sm mb-2 block">Preview</span>
            <div
              className="w-full aspect-[4/3] bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#3a3a3a]"
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(curvePreviewSVG) }}
            />
          </div>

          {/* Add to Canvas */}
          <PanelActionButton onClick={addCurveToCanvas} variant="accent" icon={Plus} fullWidth>
            Add to Canvas
          </PanelActionButton>
        </>
      ) : (
        /* Saved tab */
        <div className="space-y-2 mt-4">
          {savedArt.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[#3a3a3a] rounded-lg bg-[#2a2a2a]/30">
              <Save size={32} className="text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No saved artworks yet</p>
              <p className="text-xs text-gray-600">Create and save SVG art to see it here</p>
            </div>
          ) : (
            savedArt.map((item) => (
              <div key={item.id} className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#3a3a3a]">
                <div
                  className="w-full aspect-[3/2] bg-[#1e1e1e] overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(item.svg) }}
                />
                <div className="p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-white truncate">{item.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#3a3a3a] border border-[#444] rounded text-gray-400">
                      {ART_STYLES.find((s) => s.id === item.style)?.label}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      // eslint-disable-next-line react-hooks/rules-of-hooks
                      onClick={() => useSaved(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-[#4a7eff]/10 border border-[#4a7eff]/30 hover:bg-[#4a7eff]/20 text-[#4a7eff] rounded transition-colors"
                    >
                      <Plus size={12} />
                      Use on Canvas
                    </button>
                    <button
                      onClick={() => deleteSaved(item.id)}
                      className="px-2 py-1.5 text-gray-400 hover:text-red-400 bg-[#3a3a3a] border border-[#3a3a3a] hover:border-red-500/30 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </PanelLayout>
  )
}
