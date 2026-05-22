/**
 * Right panel properties editor for pixel art characters on canvas.
 * Styled to match TextPropertiesPanel conventions (section headers, labels, spacing).
 * Contains two sections navigated via arrows:
 * - Properties: transform, direction slider, visibility
 * - Animations: active animation, speed, generate new (PixelArtAnimationsPanel)
 */
import { useState, useCallback } from 'react'
import { Grid3x3, Loader2, Play, Trash2, Film, Plus } from 'lucide-react'
import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { useTimelineStore } from '@/stores'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { CustomSelect } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'
import { savePixelArtBlob } from '@/services/pixelArtDB'
import * as pixelLabAPI from '@/services/pixelLabAPI'
import type { PixelArtDirection } from '@/types/pixelLab'
import { DIRECTIONS_4, DIRECTIONS_8 } from '@/types/pixelLab'

export function PixelArtCharacterPropertiesPanel() {
  const activeCharacterId = usePixelArtCharacterStore((s) => s.activeCharacterId)
  const characters = usePixelArtCharacterStore((s) => s.characters)
  const updateCharacter = usePixelArtCharacterStore((s) => s.updatePixelArtCharacter)
  const removeCharacter = usePixelArtCharacterStore((s) => s.removePixelArtCharacter)
  const savedCharacters = useSavedPixelArtCharactersStore((s) => s.characters)

  const character = characters.find((c) => c.id === activeCharacterId)
  const savedChar = character ? savedCharacters.find((sc) => sc.id === character.savedPixelArtCharacterId) : null

  if (!character) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <Grid3x3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No pixel art character selected</p>
        <p className="text-xs mt-1">Click a pixel art character on the canvas to edit its properties</p>
      </div>
    )
  }

  const directions = savedChar ? (savedChar.n_directions === 8 ? DIRECTIONS_8 : DIRECTIONS_4) : DIRECTIONS_4

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Grid3x3 size={16} className="text-[#4a7eff] shrink-0" />
          <h2 className="text-white text-base font-semibold truncate">{character.name}</h2>
        </div>
        {savedChar && (
          <p className="text-xs text-gray-400">
            {savedChar.size}px · {savedChar.n_directions} directions
          </p>
        )}
      </div>

      {/* ── Transform ── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Transform</h2>

        <PanelSlider
          label="X"
          value={character.position.x}
          onChange={(v) => updateCharacter(character.id, { position: { ...character.position, x: v } })}
          min={-2000}
          max={2000}
          step={1}
          precision={0}
          compact
        />
        <PanelSlider
          label="Y"
          value={character.position.y}
          onChange={(v) => updateCharacter(character.id, { position: { ...character.position, y: v } })}
          min={-2000}
          max={2000}
          step={1}
          precision={0}
          compact
        />
        <PanelSlider
          label="Scale"
          value={character.scale}
          onChange={(v) => updateCharacter(character.id, { scale: Math.max(0.5, v) })}
          min={0.5}
          max={20}
          step={0.1}
          precision={1}
          suffix="x"
        />
        <PanelSlider
          label="Opacity"
          value={Math.round(character.opacity * 100)}
          onChange={(v) => updateCharacter(character.id, { opacity: Math.max(0, Math.min(100, v)) / 100 })}
          min={0}
          max={100}
          step={1}
          precision={0}
          suffix="%"
        />

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Direction</span>
          <div className="flex-1 min-w-0">
            <DirectionSliderAlt
              directions={directions}
              current={character.direction}
              availableDirections={savedChar?.directionBlobIds ?? {}}
              onChange={(dir) => updateCharacter(character.id, { direction: dir })}
            />
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => updateCharacter(character.id, { visible: !character.visible })}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors',
              character.visible
                ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]',
            )}
          >
            {character.visible ? 'Visible' : 'Hidden'}
          </button>
          <button
            onClick={() => removeCharacter(character.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2a2a2a] text-red-400 text-sm rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Direction Slider (RPSlider style) ─────────────────────────────────────────

function DirectionSliderAlt({
  directions,
  current,
  availableDirections,
  onChange,
}: {
  directions: PixelArtDirection[]
  current: string
  availableDirections: Partial<Record<PixelArtDirection, string>>
  onChange: (dir: PixelArtDirection) => void
}) {
  const [dragging, setDragging] = useState(false)
  const currentIndex = directions.indexOf(current as PixelArtDirection)
  const count = directions.length
  const pct = count > 1 ? (currentIndex / (count - 1)) * 100 : 0

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value)
      const dir = directions[idx]
      if (dir && availableDirections[dir]) {
        onChange(dir)
      }
    },
    [directions, availableDirections, onChange],
  )

  const dirLabel =
    current.length > 2
      ? (current as string)
          .split('-')
          .map((w) => w[0].toUpperCase())
          .join('')
      : (current as string)[0].toUpperCase()

  return (
    <div className="flex-1 relative h-8 bg-[#2a2a2a] rounded-lg overflow-visible">
      {/* Hidden native range for input/accessibility */}
      <input
        type="range"
        min={0}
        max={count - 1}
        step={1}
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={handleChange}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      {/* Tick marks */}
      {directions.map((dir, i) => {
        const tickPct = count > 1 ? (i / (count - 1)) * 100 : 50
        const isActive = dir === current
        const hasSprite = !!availableDirections[dir]
        return (
          <div
            key={dir}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `${tickPct}%` }}
          >
            <div
              className={cn(
                'w-[1px] rounded-full',
                isActive ? 'h-4 bg-zinc-300' : hasSprite ? 'h-2.5 bg-zinc-600' : 'h-1.5 bg-zinc-700',
              )}
            />
          </div>
        )
      })}

      {/* Thumb with direction label */}
      <div
        className={cn(
          'absolute flex items-center justify-center rounded-md pointer-events-none transition-all duration-150',
          dragging ? 'h-7 min-w-[32px] px-1.5 bg-[#6a6a6a] shadow-lg' : 'h-5 min-w-[24px] px-1 bg-[#5a5a5a]',
        )}
        style={{
          left: `${pct}%`,
          top: '50%',
          transform: dragging ? 'translate(-50%, -130%)' : 'translate(-50%, -50%)',
        }}
      >
        <span
          className={cn(
            'font-medium text-zinc-200 leading-none transition-all duration-150',
            dragging ? 'text-[11px]' : 'text-[9px]',
          )}
        >
          {dirLabel}
        </span>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

// ── Pixel Art Animations Panel (separate section via arrow nav) ──────────────

/** Default clip duration: one full loop of the animation at 8fps sprite rate */
const SPRITE_BASE_FPS = 8

export function PixelArtAnimationsPanel() {
  const activeCharacterId = usePixelArtCharacterStore((s) => s.activeCharacterId)
  const characters = usePixelArtCharacterStore((s) => s.characters)
  const updateCanvasCharacter = usePixelArtCharacterStore((s) => s.updatePixelArtCharacter)
  const addAnimationClip = usePixelArtCharacterStore((s) => s.addAnimationClip)
  const savedCharacters = useSavedPixelArtCharactersStore((s) => s.characters)
  const blobUrls = useSavedPixelArtCharactersStore((s) => s.blobUrls)
  const updateSavedCharacter = useSavedPixelArtCharactersStore((s) => s.updateCharacter)
  const setBlobUrl = useSavedPixelArtCharactersStore((s) => s.setBlobUrl)

  const character = characters.find((c) => c.id === activeCharacterId)
  const savedChar = character ? savedCharacters.find((sc) => sc.id === character.savedPixelArtCharacterId) : null

  const [action, setAction] = useState('walking')
  const [nFrames, setNFrames] = useState(4)
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnimate = useCallback(async () => {
    if (!savedChar) return

    const southBlobId = savedChar.directionBlobIds['south']
    if (!southBlobId) {
      setError('Character has no front-facing sprite for reference')
      return
    }

    const blobUrl = blobUrls[southBlobId]
    if (!blobUrl) {
      setError('Character sprite not loaded')
      return
    }

    setIsAnimating(true)
    setError(null)

    try {
      const response = await fetch(blobUrl)
      const blob = await response.blob()
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const res = reader.result as string
          resolve(res.split(',')[1])
        }
        reader.readAsDataURL(blob)
      })

      const result = await pixelLabAPI.animateWithText({
        image_size: { width: 64, height: 64 },
        description: savedChar.description,
        action,
        reference_image: { type: 'base64', base64: b64 },
        n_frames: nFrames,
        direction: 'south',
      })

      const animName = action.replace(/\s+/g, '-').toLowerCase()
      const frameBlobIds: string[] = []

      for (let i = 0; i < result.images.length; i++) {
        const frameBase64 = result.images[i].base64
        const blobId = `px_${savedChar.id}_${animName}_f${i}`
        const frameBlob = base64ToBlob(frameBase64)
        await savePixelArtBlob(blobId, frameBlob)
        frameBlobIds.push(blobId)
        setBlobUrl(blobId, URL.createObjectURL(frameBlob))
      }

      const newAnimBlobIds = {
        ...savedChar.animationBlobIds,
        [animName]: [{ direction: 'south' as import('@/types/pixelLab').PixelArtDirection, frameBlobIds }],
      }
      updateSavedCharacter(savedChar.id, { animationBlobIds: newAnimBlobIds })

      // Auto-select the new animation on the canvas character
      if (character) {
        updateCanvasCharacter(character.id, { activeAnimation: animName })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Animation failed')
    } finally {
      setIsAnimating(false)
    }
  }, [savedChar, character, action, nFrames, blobUrls, updateSavedCharacter, updateCanvasCharacter, setBlobUrl])

  if (!character || !savedChar) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No pixel art character selected</p>
        <p className="text-xs mt-1">Click a pixel art character on the canvas first</p>
      </div>
    )
  }

  const availableAnims = Object.keys(savedChar.animationBlobIds)
  const hasSouthSprite = !!savedChar.directionBlobIds['south']

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Film size={16} className="text-[#4a7eff] shrink-0" />
          <h2 className="text-white text-base font-semibold truncate">{character.name}</h2>
        </div>
        <p className="text-xs text-gray-400">
          {availableAnims.length} animation{availableAnims.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Playback ── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Playback</h2>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Animation</span>
          <div className="flex-1 min-w-0">
            <CustomSelect
              value={character.activeAnimation || ''}
              onChange={(v) => updateCanvasCharacter(character.id, { activeAnimation: v || null })}
              options={[
                { value: '', label: 'None (static)' },
                ...availableAnims.map((anim) => ({ value: anim, label: anim })),
              ]}
            />
          </div>
        </div>

        <PanelSlider
          label="Speed"
          value={character.animationSpeed}
          onChange={(v) => updateCanvasCharacter(character.id, { animationSpeed: Math.max(0, v) })}
          min={0}
          max={10}
          step={0.05}
          precision={2}
          suffix="x"
        />
      </div>

      {/* ── Saved Animations ── */}
      {availableAnims.length > 0 && (
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white text-base font-semibold mb-4">Saved</h2>
          <div className="space-y-1.5">
            {availableAnims.map((animName) => {
              const dirs = savedChar.animationBlobIds[animName]
              const totalFrames = dirs.reduce((sum, d) => sum + d.frameBlobIds.length, 0)
              const isActive = character.activeAnimation === animName

              return (
                <div
                  key={animName}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer',
                    isActive
                      ? 'bg-[#4a7eff]/10 border border-[#4a7eff]/30 text-white'
                      : 'bg-[#2a2a2a] border border-white/5 text-gray-400 hover:text-zinc-200 hover:bg-[#3a3a3a]',
                  )}
                  onClick={() =>
                    updateCanvasCharacter(character.id, {
                      activeAnimation: isActive ? null : animName,
                    })
                  }
                >
                  <Play size={12} className="shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{animName}</span>
                  <span className="text-xs text-gray-500 shrink-0">{totalFrames}f</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const { currentFrame, fps } = useTimelineStore.getState()
                      const dirs = savedChar.animationBlobIds[animName]
                      const frameCount = dirs?.[0]?.frameBlobIds.length ?? 4
                      const clipDuration = Math.ceil((frameCount / SPRITE_BASE_FPS) * fps)
                      addAnimationClip(character.id, {
                        animationName: animName,
                        startFrame: currentFrame,
                        endFrame: currentFrame + clipDuration,
                        speed: character.animationSpeed || 1,
                      })
                    }}
                    className="shrink-0 p-1 rounded text-[#4a7eff] hover:text-[#6b94ff] transition-colors"
                    title="Add at playhead"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!window.confirm(`Delete animation "${animName}"?`)) return
                      const newAnimBlobIds = { ...savedChar.animationBlobIds }
                      delete newAnimBlobIds[animName]
                      updateSavedCharacter(savedChar.id, { animationBlobIds: newAnimBlobIds })
                      if (character.activeAnimation === animName) {
                        updateCanvasCharacter(character.id, { activeAnimation: null })
                      }
                    }}
                    className="shrink-0 p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Generate ── */}
      <div className="p-4">
        <h2 className="text-white text-base font-semibold mb-4">Generate</h2>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Action</span>
          <div className="flex-1 min-w-0">
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g., walking, running"
              className="w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
            />
          </div>
        </div>

        <PanelSlider
          label="Frames"
          value={nFrames}
          onChange={(v) => setNFrames(Math.max(2, Math.min(20, Math.round(v))))}
          min={2}
          max={20}
          step={1}
          precision={0}
        />

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <button
          onClick={handleAnimate}
          disabled={!hasSouthSprite || isAnimating || !action.trim()}
          className={cn(
            'w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
            !hasSouthSprite || isAnimating || !action.trim()
              ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
              : 'bg-[#2a2a2a] text-[#4a7eff] hover:bg-[#3a3a3a]',
          )}
        >
          {isAnimating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Play size={14} /> Generate Animation
            </>
          )}
        </button>

        {!hasSouthSprite && (
          <p className="text-xs text-gray-500 text-center mt-2">Needs a front-facing sprite to generate animations</p>
        )}
      </div>
    </div>
  )
}
