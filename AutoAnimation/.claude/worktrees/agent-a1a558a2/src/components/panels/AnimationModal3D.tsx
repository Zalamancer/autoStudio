/**
 * Floating animation modal for the 3D rig editor viewport.
 * Opens from a button centered at the bottom of the canvas.
 * Contains: AI generation prompt (top) + motion library grid (below).
 */
import { useState, useCallback, useMemo, Suspense, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { X, Wand2, Loader2, Play, Square, Sparkles, AlertCircle } from 'lucide-react'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { get3DBlob, blobToUrl, isGlbBlob, save3DBlob } from '@/services/character3dDB'
import { generateMotion } from '@/services/hunyuanMotion'
import { AnimationPreviewCharacter } from '@/components/canvas/AnimationPreviewCharacter'
import type { Animation3D } from '@/types/character3d'

interface AnimationModal3DProps {
  characterId: string
  onClose: () => void
}

export function AnimationModal3D({ characterId, onClose }: AnimationModal3DProps) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(3)
  const [fps, setFps] = useState(30)
  const [error, setError] = useState<string | null>(null)
  const [generationStep, setGenerationStep] = useState('')
  const [hoveredAnimId, setHoveredAnimId] = useState<string | null>(null)

  const isGenerating = use3DAnimationStore((s) => s.isGenerating)
  const generationProgress = use3DAnimationStore((s) => s.generationProgress)
  const animations = use3DAnimationStore((s) => s.animations)
  const animBlobUrls = use3DAnimationStore((s) => s.blobUrls)
  const character = use3DCharacterStore((s) =>
    s.characters.find((c) => c.id === characterId) ?? null
  )

  // Resolve character GLB URL + thumbnail for preview cards
  const savedCharacters = useSaved3DCharactersStore((s) => s.characters)
  const charBlobUrls = useSaved3DCharactersStore((s) => s.blobUrls)
  const savedChar = character?.saved3DCharacterId
    ? savedCharacters.find((sc) => sc.id === character.saved3DCharacterId)
    : null
  const charGlbUrl = savedChar ? charBlobUrls[savedChar.glbBlobId] ?? null : null
  const charThumbnail = savedChar?.thumbnailDataUrl ?? null

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    setError(null)
    const animStore = use3DAnimationStore.getState()
    const charStore = use3DCharacterStore.getState()
    animStore.setGenerating(true)

    try {
      const { glbBlob, taskId } = await generateMotion(
        prompt.trim(),
        duration,
        fps,
        (step, progress) => {
          setGenerationStep(step)
          animStore.setGenerationProgress(progress)
        }
      )

      const glbBlobId = `anim_${taskId}`
      await save3DBlob(glbBlobId, glbBlob)

      const url = blobToUrl(glbBlob)
      animStore.setBlobUrl(glbBlobId, url)

      const animId = `anim3d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const animation: Animation3D = {
        id: animId,
        name: prompt.trim().slice(0, 50),
        glbBlobId,
        durationSeconds: duration,
        fps,
        sourcePrompt: prompt.trim(),
        source: 'hunyuan-motion',
        tags: prompt.trim().toLowerCase().split(/\s+/).slice(0, 5),
        createdAt: Date.now(),
      }

      animStore.addAnimation(animation)
      charStore.playAnimation(characterId, animId)

      setGenerationStep('')
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      use3DAnimationStore.getState().setGenerating(false)
    }
  }, [prompt, duration, fps, isGenerating, characterId])

  const handleApply = useCallback(
    (animId: string) => {
      const anim = use3DAnimationStore.getState().animations.find((a) => a.id === animId)
      if (!anim) return

      const existingUrl = use3DAnimationStore.getState().getBlobUrl(anim.glbBlobId)
      if (!existingUrl) {
        get3DBlob(anim.glbBlobId).then(async (blob) => {
          if (blob) {
            if (!(await isGlbBlob(blob))) {
              console.warn('[AnimationModal3D] Skipping non-GLB blob for', anim.glbBlobId)
              return
            }
            const url = blobToUrl(blob)
            use3DAnimationStore.getState().setBlobUrl(anim.glbBlobId, url)
          }
        })
      }

      use3DCharacterStore.getState().playAnimation(characterId, animId)
    },
    [characterId]
  )

  const handleStop = useCallback(() => {
    use3DCharacterStore.getState().stopAnimation(characterId)
  }, [characterId])

  const activeAnimName = useMemo(() => {
    if (!character?.activeAnimationId) return null
    return animations.find((a) => a.id === character.activeAnimationId)?.name ?? null
  }, [character?.activeAnimationId, animations])

  return (
    // Backdrop
    <div
      className="absolute inset-0 z-20 flex items-end md:items-end justify-center pb-0 md:pb-16"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal panel */}
      <div
        className="w-full md:w-[580px] h-full md:h-auto max-h-full md:max-h-[70vh] bg-zinc-900/95 backdrop-blur-xl md:border border-zinc-700/60 md:rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
              <Play size={16} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Animations</h2>
              <p className="text-xs text-zinc-500">{animations.length} motion{animations.length !== 1 ? 's' : ''} in library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Generate section */}
          <div className="px-5 py-4 border-b border-zinc-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-green-400" />
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Generate Animation</span>
            </div>

            <div className="flex gap-2.5">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a motion... e.g. Walking forward confidently"
                rows={2}
                disabled={isGenerating}
                className="flex-1 px-3 py-2.5 text-sm bg-zinc-800/80 border border-zinc-700/50 rounded-xl text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 resize-none disabled:opacity-50"
              />
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-500 active:scale-[0.98]"
                >
                  {isGenerating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Wand2 size={14} />
                  )}
                  {isGenerating ? 'Generating' : 'Generate'}
                </button>
                <div className="flex gap-1.5 items-center">
                  <PanelSlider
                    label="Duration"
                    value={duration}
                    onChange={setDuration}
                    min={1}
                    max={10}
                    step={1}
                    suffix="s"
                    compact
                  />
                  <PanelSelect
                    value={String(fps)}
                    onChange={(v) => setFps(Number(v))}
                    options={[
                      { value: '24', label: '24fps' },
                      { value: '30', label: '30fps' },
                      { value: '60', label: '60fps' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="flex flex-col gap-1 mt-3">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${generationProgress}%` }}
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                  />
                </div>
                <span className="text-xs text-zinc-500">{generationStep}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2 flex items-center gap-1.5 mt-3">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Active animation bar */}
          {character?.activeAnimationId && activeAnimName && (
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-green-500/5 border-b border-zinc-800/50">
              <Play size={13} className="text-green-400 shrink-0" />
              <span className="text-sm text-green-400 flex-1 truncate">
                {activeAnimName}
              </span>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
              >
                <Square size={10} />
                Stop
              </button>
            </div>
          )}

          {/* Motion library grid */}
          <div className="px-5 py-4">
            {animations.length === 0 ? (
              <div className="text-center py-8">
                <Play size={28} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-600">No animations yet</p>
                <p className="text-xs text-zinc-700 mt-1">Generate one above or import a GLB</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {animations.map((anim) => (
                  <AnimationCard
                    key={anim.id}
                    animation={anim}
                    isActive={character?.activeAnimationId === anim.id}
                    isHovered={hoveredAnimId === anim.id}
                    onHover={setHoveredAnimId}
                    onApply={() => handleApply(anim.id)}
                    charGlbUrl={charGlbUrl}
                    charThumbnail={charThumbnail}
                    animGlbUrl={animBlobUrls[anim.glbBlobId] ?? null}
                    boneMapping={savedChar?.boneMapping}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Animation Card ──────────────────────────────────────────────────────────

function AnimationCard({
  animation,
  isActive,
  isHovered,
  onHover,
  onApply,
  charGlbUrl,
  charThumbnail,
  animGlbUrl,
  boneMapping,
}: {
  animation: Animation3D
  isActive: boolean
  isHovered: boolean
  onHover: (id: string | null) => void
  onApply: () => void
  charGlbUrl: string | null
  charThumbnail: string | null
  animGlbUrl: string | null
  boneMapping?: Record<string, string>
}) {
  const SOURCE_LABELS: Record<string, string> = {
    'hunyuan-motion': 'Hunyuan',
    imported: 'Imported',
    'model-embedded': 'Model',
    retargeted: 'Retarget',
  }
  const SOURCE_COLORS: Record<string, string> = {
    'hunyuan-motion': 'text-purple-400',
    imported: 'text-blue-400',
    'model-embedded': 'text-zinc-400',
    retargeted: 'text-green-400',
  }

  const sourceLabel = (animation.source && SOURCE_LABELS[animation.source]) || animation.source || 'Unknown'
  const sourceColor = (animation.source && SOURCE_COLORS[animation.source]) || 'text-zinc-400'

  const showPreview = isHovered && charGlbUrl && animGlbUrl

  return (
    <div
      onMouseEnter={() => onHover(animation.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onApply}
      className={`group flex flex-col rounded-xl overflow-hidden transition-all cursor-pointer ${
        isActive
          ? 'bg-green-500/10 ring-1 ring-green-500/30'
          : 'bg-zinc-800/40 ring-1 ring-zinc-700/30 hover:ring-zinc-600/50 hover:bg-zinc-800/60'
      }`}
    >
      {/* Preview area */}
      <div className="aspect-square bg-zinc-900/50 relative">
        {showPreview ? (
          <CanvasErrorBoundary fallback={<FallbackThumbnail thumbnail={charThumbnail} />}>
            <Suspense fallback={<FallbackThumbnail thumbnail={charThumbnail} />}>
              <Canvas
                camera={{ position: [0, 1, 2.5], fov: 45, near: 0.01, far: 100 }}
                gl={{ alpha: true, antialias: true }}
                style={{ width: '100%', height: '100%' }}
                onCreated={(state) => state.gl.setClearColor(0x18181b, 1)}
              >
                <ambientLight intensity={0.6} />
                <directionalLight position={[3, 5, 3]} intensity={0.8} />
                <hemisphereLight args={['#b1e1ff', '#b97a20', 0.2]} />
                <Environment preset="studio" />
                <AnimationPreviewCharacter
                  glbUrl={charGlbUrl!}
                  animationGlbUrl={animGlbUrl!}
                  boneMapping={boneMapping}
                />
              </Canvas>
            </Suspense>
          </CanvasErrorBoundary>
        ) : (
          <FallbackThumbnail thumbnail={charThumbnail} />
        )}

        {/* Duration badge */}
        <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-zinc-300 px-1.5 py-0.5 rounded-md">
          {animation.durationSeconds.toFixed(1)}s
        </span>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-1.5 left-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2 py-1.5">
        <div className="text-xs text-zinc-300 truncate font-medium">{animation.name}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-[10px] ${sourceColor}`}>{sourceLabel}</span>
          {isActive && <span className="text-[10px] text-green-400 font-medium">Playing</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[AnimationCard] Canvas error caught:', error.message, info.componentStack?.slice(0, 200))
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}

function FallbackThumbnail({ thumbnail }: { thumbnail: string | null }) {
  return thumbnail ? (
    <img
      src={thumbnail}
      alt="Character"
      className="w-full h-full object-contain"
      draggable={false}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <Play size={20} className="text-zinc-600" />
    </div>
  )
}
