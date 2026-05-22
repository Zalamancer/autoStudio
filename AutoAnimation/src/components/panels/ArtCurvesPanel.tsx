import { useState, useMemo, useCallback } from 'react'
import {
  Palette,
  Shuffle,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import {
  PanelSection,
  PanelSlider,
  PanelToggle,
  PanelActionButton,
} from '@/components/ui/panel-controls'
import { useArtCurveStore } from '@/stores/useArtCurveStore'
import { useEditorStore } from '@/stores'
import {
  generateArtCurves,
  buildVariableWidthSVG,
} from '@/services/artCurveGenerator'

const PALETTES = [
  { id: 'neon', label: 'Neon', colors: ['#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b'] },
  { id: 'ocean', label: 'Ocean', colors: ['#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4'] },
  { id: 'forest', label: 'Forest', colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'] },
  { id: 'sunset', label: 'Sunset', colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'] },
  { id: 'mono', label: 'Mono', colors: ['#f8f9fa', '#dee2e6', '#adb5bd', '#6c757d', '#343a40'] },
  { id: 'warm', label: 'Warm', colors: ['#ffba08', '#faa307', '#f48c06', '#e85d04', '#dc2f02'] },
  { id: 'cool', label: 'Cool', colors: ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#03045e'] },
  { id: 'candy', label: 'Candy', colors: ['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9'] },
]

// ── Panel Component ─────────────────────────────────────────────────────

export function ArtCurvesPanel() {
  const [paletteId, setPaletteId] = useState('neon')
  const [complexity, setComplexity] = useState(5)
  const [animated, setAnimated] = useState(true)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 999999))
  const [widthStart, setWidthStart] = useState(8)
  const [widthMid, setWidthMid] = useState(16)
  const [widthEnd, setWidthEnd] = useState(4)

  const addComposition = useArtCurveStore((s) => s.addComposition)

  const palette = PALETTES.find((p) => p.id === paletteId)?.colors || PALETTES[0].colors

  const previewCurves = useMemo(
    () =>
      generateArtCurves({
        style: 'swirl',
        width: 800,
        height: 600,
        palette,
        complexity,
        seed,
        animated: false,
        widthStart,
        widthMid,
        widthEnd,
      }),
    [palette, complexity, seed, widthStart, widthMid, widthEnd],
  )

  const previewSVG = useMemo(
    () => buildVariableWidthSVG(previewCurves, 800, 600, false),
    [previewCurves],
  )

  const randomize = useCallback(() => setSeed(Math.floor(Math.random() * 999999)), [])

  const handleAddToCanvas = useCallback(() => {
    addComposition({
      palette,
      complexity,
      animated,
      seed,
      globalWidthStart: widthStart,
      globalWidthMid: widthMid,
      globalWidthEnd: widthEnd,
    })
    useEditorStore.getState().setRightPanelTab('art-curve-properties' as any)
  }, [palette, complexity, animated, seed, widthStart, widthMid, widthEnd, addComposition])

  return (
    <PanelLayout icon={Palette} title="Art Curves">
      {/* Thickness sliders */}
      <PanelSection title="Thickness">
        <PanelSlider
          label="Start"
          value={widthStart}
          onChange={setWidthStart}
          min={2}
          max={50}
          step={1}
          suffix="px"
          compact
        />
        <PanelSlider
          label="Mid"
          value={widthMid}
          onChange={setWidthMid}
          min={2}
          max={50}
          step={1}
          suffix="px"
          compact
        />
        <PanelSlider
          label="End"
          value={widthEnd}
          onChange={setWidthEnd}
          min={2}
          max={50}
          step={1}
          suffix="px"
          compact
        />
      </PanelSection>

      {/* Color palettes */}
      <PanelSection title="Palette">
        <div className="grid grid-cols-2 gap-1.5">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPaletteId(p.id)}
              className={cn(
                'flex flex-col gap-1 rounded-lg overflow-hidden transition-all border',
                paletteId === p.id
                  ? 'border-accent bg-accent/10'
                  : 'border-panel-border bg-panel-surface hover:border-gray-600',
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

      {/* Complexity slider */}
      <PanelSection noBorder>
        <PanelSlider
          label="Complexity"
          value={complexity}
          onChange={setComplexity}
          min={1}
          max={10}
          step={1}
        />

        <PanelToggle
          label="Animated"
          checked={animated}
          onChange={setAnimated}
        />
      </PanelSection>

      {/* Randomize */}
      <PanelActionButton onClick={randomize} variant="secondary" icon={Shuffle} fullWidth>
        Randomize
      </PanelActionButton>

      {/* Preview */}
      <div>
        <span className="text-gray-400 text-sm mb-2 block">Preview</span>
        <div
          className="w-full aspect-[4/3] bg-panel-bg rounded-lg overflow-hidden border border-panel-border"
          dangerouslySetInnerHTML={{ __html: previewSVG }}
        />
      </div>

      {/* Add to Canvas */}
      <PanelActionButton onClick={handleAddToCanvas} variant="accent" icon={Plus} fullWidth>
        Add to Canvas
      </PanelActionButton>
    </PanelLayout>
  )
}
