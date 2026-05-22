/**
 * Panel for generating AI motion designs from prompts.
 * Three tabs: Create, Quick Build (no AI), and Saved.
 * Integrates color harmony, typography presets, and flow-aware placement.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Wand2, Loader2, Plus, Trash2, Save, BookmarkCheck, Palette, Zap, Layers } from 'lucide-react'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelCheckbox, PanelSelect } from '@/components/ui/panel-controls'
import { generateMotionDesign, buildMotionDesign } from '@/services/motionDesignGenerator'
import { registerAndAddMotionDesign, registerAndAddMotionDesignInFlow } from '@/motionGraphics/dynamicRegistry'
import { DynamicMotionDesignRenderer } from '@/motionGraphics/DynamicMotionDesignRenderer'
import { paletteFromMood, type PaletteMood } from '@/services/motionDesign/colorHarmony'
import type { MotionDesignDescription } from '@/types/motionDesign'
import type { FlowRole } from '@/services/motionDesign/visualFlow'
import type { FlowTransitionType } from '@/services/motionDesign/visualFlow'

// ── localStorage persistence ──

const STORAGE_KEY = 'proanimate-saved-motion-designs'

interface SavedMotionDesign {
  id: string
  name: string
  description: string
  data: MotionDesignDescription
  savedAt: number
}

function loadSaved(): SavedMotionDesign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistSaved(items: SavedMotionDesign[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ── Options ──

const STYLE_OPTIONS = [
  'modern', 'neon', 'minimal', 'glassmorphism', 'gradient',
  'dark', 'pastel', 'retro', 'brutalism', 'corporate',
] as const

const MOOD_OPTIONS: PaletteMood[] = [
  'vibrant', 'muted', 'dark', 'light', 'neon', 'pastel', 'corporate', 'warm', 'cool',
]

const FLOW_ROLES: FlowRole[] = [
  'title', 'subtitle', 'lower-third', 'stat', 'cta', 'quote', 'list', 'end-screen',
]

const TRANSITION_TYPES: { value: FlowTransitionType; label: string }[] = [
  { value: 'crossfade', label: 'Crossfade' },
  { value: 'push-left', label: 'Push Left' },
  { value: 'push-up', label: 'Push Up' },
  { value: 'zoom-through', label: 'Zoom Through' },
  { value: 'wipe-horizontal', label: 'Wipe H' },
  { value: 'cut', label: 'Cut' },
]

// ── Animated Preview ──

function AnimatedPreview({ description }: { description: MotionDesignDescription }) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef(0)

  useEffect(() => {
    startRef.current = performance.now()
    const CYCLE_MS = 4000

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      setProgress((elapsed % CYCLE_MS) / CYCLE_MS)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [description])

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-zinc-900">
      <DynamicMotionDesignRenderer
        description={description}
        config={description.defaultConfig}
        frame={0}
        fps={30}
        durationInFrames={150}
        width={640}
        height={360}
        progress={progress}
      />
    </div>
  )
}

// ── Palette Preview ──

function PalettePreview({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-1">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-full border border-white/10"
          style={{ background: c }}
          title={c}
        />
      ))}
    </div>
  )
}

// ── Panel ──

export function MotionDesignPanel() {
  const [tab, setTab] = useState<'create' | 'quick' | 'saved'>('create')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<string>('modern')
  const [colorMood, setColorMood] = useState<PaletteMood>('vibrant')
  const [flowRole, setFlowRole] = useState<FlowRole>('title')
  const [transitionType, setTransitionType] = useState<FlowTransitionType>('crossfade')
  const [flowAware, setFlowAware] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<MotionDesignDescription | null>(null)
  const [saved, setSaved] = useState<SavedMotionDesign[]>(loadSaved)
  const [addedToCanvas, setAddedToCanvas] = useState(false)

  // Quick build state
  const [qbTitle, setQbTitle] = useState('Your Title')
  const [qbSubtitle, setQbSubtitle] = useState('Subtitle text')
  const [qbRole, setQbRole] = useState<FlowRole>('title')
  const [qbMood, setQbMood] = useState<PaletteMood>('dark')

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setError(null)
    setPreview(null)
    setAddedToCanvas(false)
    try {
      const result = await generateMotionDesign({
        prompt: prompt.trim(),
        style,
        colorMood,
        flowRole,
        emotion: colorMood,
      })
      setPreview(result)
    } catch (err: any) {
      setError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }, [prompt, style, colorMood, flowRole, generating])

  const handleAddToCanvas = useCallback(() => {
    if (!preview) return
    if (flowAware) {
      registerAndAddMotionDesignInFlow(preview, { transitionType })
    } else {
      registerAndAddMotionDesign(preview)
    }
    setAddedToCanvas(true)
  }, [preview, flowAware, transitionType])

  const handleQuickBuild = useCallback(() => {
    const palette = paletteFromMood(qbMood)
    const design = buildMotionDesign(
      qbRole,
      { title: qbTitle, subtitle: qbSubtitle, name: qbTitle },
      palette,
    )
    setPreview(design)
    setTab('create') // Switch to create tab to show preview
  }, [qbTitle, qbSubtitle, qbRole, qbMood])

  const handleSave = useCallback(() => {
    if (!preview) return
    const item: SavedMotionDesign = {
      id: `md-${Date.now()}`,
      name: preview.name,
      description: preview.description,
      data: preview,
      savedAt: Date.now(),
    }
    const updated = [item, ...saved]
    setSaved(updated)
    persistSaved(updated)
  }, [preview, saved])

  const handleDelete = useCallback(
    (id: string) => {
      const updated = saved.filter((s) => s.id !== id)
      setSaved(updated)
      persistSaved(updated)
    },
    [saved],
  )

  const handleUseOnCanvas = useCallback((design: MotionDesignDescription) => {
    if (flowAware) {
      registerAndAddMotionDesignInFlow(design, { transitionType })
    } else {
      registerAndAddMotionDesign(design)
    }
  }, [flowAware, transitionType])

  // Generate palette preview
  const currentPalette = paletteFromMood(colorMood)

  return (
    <PanelLayout icon={Wand2} title="Motion AI" iconClassName="text-teal-400">
      {/* Tab switcher */}
      <div className="shrink-0 flex gap-1 px-3 pt-2 pb-1">
        {([
          { key: 'create' as const, label: 'AI Create' },
          { key: 'quick' as const, label: 'Quick Build' },
          { key: 'saved' as const, label: `Saved (${saved.length})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === key
                ? 'bg-white/10 text-white'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Prompt */}
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Describe your motion design</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. animated bar chart showing revenue growth with a dark theme..."
              className="w-full h-20 px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-teal-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
              }}
            />
          </div>

          {/* Style selector */}
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    style === s
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:border-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color Mood */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
              <Palette size={10} /> Color Mood
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setColorMood(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    colorMood === m
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-800 text-zinc-500 border border-white/5 hover:border-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <PalettePreview colors={[currentPalette.primary, currentPalette.secondary, currentPalette.accent, currentPalette.background, currentPalette.text]} />
          </div>

          {/* Flow Options */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Layers size={10} /> Flow Options
            </label>
            <PanelCheckbox
              label="Auto-sequence on timeline"
              checked={flowAware}
              onChange={(v) => setFlowAware(v)}
            />
            {flowAware && (
              <div className="flex gap-2">
                <PanelSelect
                  value={flowRole}
                  onChange={(v) => setFlowRole(v as FlowRole)}
                  options={FLOW_ROLES.map((r) => ({ value: r, label: r }))}
                />
                <PanelSelect
                  value={transitionType}
                  onChange={(v) => setTransitionType(v as FlowTransitionType)}
                  options={TRANSITION_TYPES}
                />
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generate Motion Design
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">{preview.name}</span>
                {preview.flowRole && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    {preview.flowRole}
                  </span>
                )}
              </div>
              <AnimatedPreview description={preview} />
              <p className="text-[11px] text-zinc-500">{preview.description}</p>

              {/* Palette display */}
              {preview.palette && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">Palette:</span>
                  <PalettePreview colors={Object.values(preview.palette)} />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCanvas}
                  disabled={addedToCanvas}
                  className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  {addedToCanvas ? (
                    <>
                      <BookmarkCheck size={14} />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      {flowAware ? 'Add to Flow' : 'Add to Canvas'}
                    </>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      ) : tab === 'quick' ? (
        /* Quick Build tab */
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Title</label>
            <input
              type="text"
              value={qbTitle}
              onChange={(e) => setQbTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Subtitle</label>
            <input
              type="text"
              value={qbSubtitle}
              onChange={(e) => setQbSubtitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Element Role</label>
            <div className="flex flex-wrap gap-1.5">
              {FLOW_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setQbRole(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    qbRole === r
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:border-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Color Mood</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setQbMood(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    qbMood === m
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-800 text-zinc-500 border border-white/5 hover:border-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <PalettePreview colors={(() => {
              const p = paletteFromMood(qbMood)
              return [p.primary, p.secondary, p.accent, p.background, p.text]
            })()} />
          </div>
          <button
            onClick={handleQuickBuild}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Zap size={16} />
            Build Instantly
          </button>
        </div>
      ) : (
        /* Saved tab */
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {saved.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-xs">
              No saved designs yet. Generate and save one!
            </div>
          ) : (
            saved.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-zinc-800/50 border border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">{item.name}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">{item.description}</p>
                <button
                  onClick={() => handleUseOnCanvas(item.data)}
                  className="w-full py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-xs text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={12} />
                  Use on Canvas
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </PanelLayout>
  )
}
