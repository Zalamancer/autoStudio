import { useState, useRef, useCallback } from 'react'
import { Blocks, Loader2, Plus, Trash2, Eye, Save, Sparkles, BookmarkCheck } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { generateComponent, type GeneratedComponent } from '@/services/componentGenerator'
import { parseTemplateConfig } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

// ── localStorage persistence ──

const STORAGE_KEY = 'proanimate-saved-components'

interface SavedComponent {
  id: string
  name: string
  description: string
  html: string
  style: string
  savedAt: number
}

function loadSavedComponents(): SavedComponent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistComponents(components: SavedComponent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(components))
}

// ── Style options ──

const STYLE_OPTIONS = [
  'modern',
  'glassmorphism',
  'minimal',
  'retro',
  'neon',
  'brutalism',
  'neumorphism',
  'gradient',
  'dark',
  'pastel',
] as const

const ASPECT_OPTIONS = ['16:9', '9:16', '1:1'] as const

// ── Panel ──

export function ComponentCreatorPanel() {
  const [tab, setTab] = useState<'create' | 'saved'>('create')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<string>('modern')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [animated, setAnimated] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<GeneratedComponent | null>(null)
  const [savedComponents, setSavedComponents] = useState<SavedComponent[]>(loadSavedComponents)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setError(null)
    setPreview(null)
    try {
      const result = await generateComponent({ prompt: prompt.trim(), style, aspectRatio, animated })
      setPreview(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }, [prompt, style, aspectRatio, animated, generating])

  const handleAddToCanvas = useCallback(() => {
    if (!preview) return
    const { canvasWidth, canvasHeight } = useCanvasStore.getState()
    const totalFrames = useTimelineStore.getState().totalFrames
    const bridgedHtml = injectMessageBridge(preview.html)
    const config = parseTemplateConfig(preview.html)
    const templateId = `comp-${Date.now()}`

    useHTMLTemplateLayerStore.getState().addTemplate({
      id: templateId,
      htmlContent: bridgedHtml,
      name: preview.name,
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
      customConfig: config,
    })
  }, [preview])

  const handleSave = useCallback(() => {
    if (!preview) return
    const entry: SavedComponent = {
      id: `saved-${Date.now()}`,
      name: preview.name,
      description: preview.description,
      html: preview.html,
      style,
      savedAt: Date.now(),
    }
    const updated = [entry, ...savedComponents]
    setSavedComponents(updated)
    persistComponents(updated)
  }, [preview, style, savedComponents])

  const handleDelete = useCallback(
    (id: string) => {
      const updated = savedComponents.filter((c) => c.id !== id)
      setSavedComponents(updated)
      persistComponents(updated)
    },
    [savedComponents],
  )

  const handleUseSaved = useCallback((component: SavedComponent) => {
    const { canvasWidth, canvasHeight } = useCanvasStore.getState()
    const totalFrames = useTimelineStore.getState().totalFrames
    const bridgedHtml = injectMessageBridge(component.html)
    const config = parseTemplateConfig(component.html)
    const templateId = `comp-${Date.now()}`

    useHTMLTemplateLayerStore.getState().addTemplate({
      id: templateId,
      htmlContent: bridgedHtml,
      name: component.name,
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
      customConfig: config,
    })
  }, [])

  const generateFooter =
    tab === 'create' ? (
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || generating}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        {generating ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Generate Component
          </>
        )}
      </button>
    ) : null

  return (
    <PanelLayout icon={Blocks} title="Component Creator" iconClassName="text-violet-400" footer={generateFooter}>
      {/* Tab switcher */}
      <div className="flex gap-1 p-0.5 bg-zinc-800 rounded-lg">
        <button
          onClick={() => setTab('create')}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
            tab === 'create' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Create
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
            tab === 'saved' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Saved ({savedComponents.length})
        </button>
      </div>

      {tab === 'create' ? (
        <>
          {/* Prompt */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Describe your component</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A glassmorphism pricing card with monthly/yearly toggle"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Style */}
          <PanelSelect
            label="Style"
            value={style}
            onChange={setStyle}
            options={STYLE_OPTIONS.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
            fullWidth
          />

          {/* Aspect Ratio + Animated */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Aspect Ratio</label>
              <div className="flex gap-1">
                {ASPECT_OPTIONS.map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    className={`flex-1 text-xs py-1.5 rounded-md border transition-colors ${
                      aspectRatio === ar
                        ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                        : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Animated</label>
              <button
                onClick={() => setAnimated(!animated)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  animated
                    ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                    : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {animated ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Eye size={12} /> Preview
                </span>
                <span className="text-xs text-zinc-500 truncate max-w-[160px]">{preview.name}</span>
              </div>
              <div
                className="relative w-full bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden"
                style={{ aspectRatio: aspectRatio.replace(':', '/') }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={preview.html}
                  sandbox="allow-scripts"
                  className="absolute inset-0 w-full h-full border-0"
                  title="Component preview"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCanvas}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  <Plus size={12} />
                  Add to Canvas
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  <Save size={12} />
                  Save
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Saved tab */
        <>
          {savedComponents.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <BookmarkCheck size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No saved components yet</p>
              <p className="text-[10px] mt-1 text-zinc-600">Generate and save components to reuse them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedComponents.map((comp) => (
                <div key={comp.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{comp.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{comp.description}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">{comp.style}</span>
                    <span className="text-[10px] text-zinc-600 ml-auto">
                      {new Date(comp.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUseSaved(comp)}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium py-1.5 rounded-md border border-violet-500/20 transition-colors"
                  >
                    <Plus size={12} />
                    Use on Canvas
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PanelLayout>
  )
}
