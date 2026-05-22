import { useState } from 'react'
import { Smile, Eye, Box } from 'lucide-react'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { DragField, TransformRow, SENSITIVITIES, type Axis } from '@/components/panels/BonePropertyControls'
import type { VisemeFaceMapping, FaceExpressionMapping } from '@/types/character3d'
import { DEFAULT_VISEME_FACE_MAPPING, DEFAULT_FACE_EXPRESSION_MAPPING } from '@/types/character3d'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'

const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180

export function Character3DPropertiesPanel() {
  const activeCharacterId = use3DCharacterStore((s) => s.activeCharacterId)
  const characters = use3DCharacterStore((s) => s.characters)
  const updateCharacter = use3DCharacterStore((s) => s.update3DCharacter)
  const removeCharacter = use3DCharacterStore((s) => s.remove3DCharacter)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)
  const animations = use3DAnimationStore((s) => s.animations)

  const character = characters.find((c) => c.id === activeCharacterId)
  const savedChar = character ? saved3DCharacters.find((sc) => sc.id === character.saved3DCharacterId) : null

  if (!character) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No 3D character selected</p>
        <p className="text-xs mt-1">Click a 3D character on the canvas to edit its properties</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Character name */}
      <div className="flex items-center gap-2">
        <Box className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-sm text-zinc-200 font-semibold truncate tracking-wide">{character.name}</span>
        {savedChar && (
          <span className="text-[10px] text-zinc-500 ml-auto shrink-0">
            {savedChar.skeletonType} • {(savedChar.polyCount / 1000).toFixed(1)}k
          </span>
        )}
      </div>

      <div className="h-px bg-zinc-700/50" />

      {/* Position */}
      <TransformRow label="Position">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={character.position[axis]}
            onChange={(v) => {
              updateCharacter(character.id, { position: { ...character.position, [axis]: v } })
            }}
            sensitivity={SENSITIVITIES.position}
          />
        ))}
      </TransformRow>

      {/* Rotation (display as degrees, store as radians) */}
      <TransformRow label="Rotation">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={character.rotation[axis] * RAD_TO_DEG}
            onChange={(deg) => {
              updateCharacter(character.id, {
                rotation: { ...character.rotation, [axis]: deg * DEG_TO_RAD },
              })
            }}
            sensitivity={SENSITIVITIES.rotation}
            decimals={1}
          />
        ))}
      </TransformRow>

      {/* Scale (uniform — show same value on all three axes) */}
      <TransformRow label="Scale">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={character.scale}
            onChange={(v) => {
              updateCharacter(character.id, { scale: Math.max(0.01, v) })
            }}
            sensitivity={SENSITIVITIES.scale}
          />
        ))}
      </TransformRow>

      <div className="h-px bg-zinc-700/50" />

      {/* Animation Speed */}
      <TransformRow label="Speed">
        <DragField
          axis="x"
          value={character.animationSpeed}
          onChange={(v) => {
            updateCharacter(character.id, { animationSpeed: Math.max(0, v) })
          }}
          sensitivity={0.005}
          decimals={2}
        />
      </TransformRow>

      {/* Animation selector */}
      {animations.length > 0 && (
        <PanelSelect
          label="Animation"
          value={character.activeAnimationId ?? ''}
          onChange={(v) => updateCharacter(character.id, { activeAnimationId: v || null })}
          options={[{ value: '', label: 'None' }, ...animations.map((a) => ({ value: a.id, label: a.name }))]}
          fullWidth
        />
      )}

      <div className="h-px bg-zinc-700/50" />

      {/* Face Lip Sync */}
      <VisemeFaceMappingSection character={character} updateCharacter={updateCharacter} />

      {/* Face Expressions (Eye + Eyebrow) */}
      <FaceExpressionMappingSection character={character} updateCharacter={updateCharacter} />

      <div className="h-px bg-zinc-700/50" />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => updateCharacter(character.id, { visible: !character.visible })}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            character.visible
              ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
          )}
        >
          {character.visible ? 'Visible' : 'Hidden'}
        </button>
        <button
          onClick={() => removeCharacter(character.id)}
          className="flex-1 px-3 py-2 text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ── Viseme Face Mapping Section ───────────────────────────────────────────────

const RAD_TO_DEG_VFM = 180 / Math.PI
const DEG_TO_RAD_VFM = Math.PI / 180

function VisemeFaceMappingSection({
  character,
  updateCharacter,
}: {
  character: import('@/types/character3d').Character3D
  updateCharacter: (id: string, updates: Partial<import('@/types/character3d').Character3D>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const mapping = character.visemeFaceMapping
  const enabled = mapping?.enabled ?? false

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)

  const toggleEnabled = () => {
    if (enabled) {
      // Disable — keep mapping but toggle enabled off
      updateCharacter(character.id, {
        visemeFaceMapping: mapping ? { ...mapping, enabled: false } : undefined,
      })
    } else {
      // Enable — create default mapping if none exists
      updateCharacter(character.id, {
        visemeFaceMapping: mapping ? { ...mapping, enabled: true } : { ...DEFAULT_VISEME_FACE_MAPPING },
      })
      setExpanded(true)
    }
  }

  const updateMapping = (updates: Partial<VisemeFaceMapping>) => {
    if (!mapping) return
    updateCharacter(character.id, {
      visemeFaceMapping: { ...mapping, ...updates },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium hover:text-zinc-300 transition-colors"
        >
          <Smile className="w-3 h-3" />
          <span>Face Lip Sync</span>
          <span className="text-[10px] text-zinc-600 ml-0.5">{expanded ? '\u25B2' : '\u25BC'}</span>
        </button>
        <button
          onClick={toggleEnabled}
          className={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
            enabled
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
          )}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {expanded && mapping && (
        <div className="flex flex-col gap-2 pl-1">
          {/* Viseme source */}
          <PanelSelect
            label="Viseme Source"
            value={
              mapping.visemeSource.type === 'character-config'
                ? 'character-config'
                : mapping.visemeSource.type === 'saved-2d-character'
                  ? `saved:${mapping.visemeSource.characterId}`
                  : 'custom'
            }
            onChange={(val) => {
              if (val === 'character-config') {
                updateMapping({ visemeSource: { type: 'character-config' } })
              } else if (val.startsWith('saved:')) {
                updateMapping({
                  visemeSource: {
                    type: 'saved-2d-character',
                    characterId: val.replace('saved:', ''),
                  },
                })
              } else {
                updateMapping({ visemeSource: { type: 'custom', sprites: {} } })
              }
            }}
            options={[
              { value: 'character-config', label: 'Primary Character Sprites' },
              ...savedCharacters.map((sc) => ({ value: `saved:${sc.id}`, label: sc.name })),
              { value: 'custom', label: 'Custom Sprites' },
            ]}
            fullWidth
          />

          {/* Dialogue link */}
          {dialogueCharacters.length > 0 && (
            <PanelSelect
              label="Dialogue Source"
              value={mapping.dialogueCharacterId ?? ''}
              onChange={(v) => updateMapping({ dialogueCharacterId: v || undefined })}
              options={[
                { value: '', label: 'Primary Timeline' },
                ...dialogueCharacters.map((dc) => ({ value: dc.id, label: dc.name })),
              ]}
              fullWidth
            />
          )}

          {/* Position offset */}
          <TransformRow label="Offset">
            {(['x', 'y', 'z'] as Axis[]).map((axis) => (
              <DragField
                key={axis}
                axis={axis}
                value={mapping.offset[axis]}
                onChange={(v) => updateMapping({ offset: { ...mapping.offset, [axis]: v } })}
                sensitivity={0.001}
                decimals={3}
              />
            ))}
          </TransformRow>

          {/* Scale */}
          <TransformRow label="Size">
            <DragField
              axis="x"
              value={mapping.scale.x}
              onChange={(v) => updateMapping({ scale: { ...mapping.scale, x: Math.max(0.001, v) } })}
              sensitivity={0.001}
              decimals={3}
            />
            <DragField
              axis="y"
              value={mapping.scale.y}
              onChange={(v) => updateMapping({ scale: { ...mapping.scale, y: Math.max(0.001, v) } })}
              sensitivity={0.001}
              decimals={3}
            />
          </TransformRow>

          {/* Rotation */}
          <TransformRow label="Rotation">
            {(['x', 'y', 'z'] as Axis[]).map((axis) => (
              <DragField
                key={axis}
                axis={axis}
                value={mapping.rotation[axis] * RAD_TO_DEG_VFM}
                onChange={(deg) => updateMapping({ rotation: { ...mapping.rotation, [axis]: deg * DEG_TO_RAD_VFM } })}
                sensitivity={0.5}
                decimals={1}
              />
            ))}
          </TransformRow>

          {/* Opacity */}
          <PanelSlider
            label="Opacity"
            value={mapping.opacity}
            onChange={(v) => updateMapping({ opacity: v })}
            min={0}
            max={1}
            step={0.01}
            precision={0}
            compact
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />

          {/* Transition speed */}
          <PanelSlider
            label="Fade"
            value={mapping.transitionMs}
            onChange={(v) => updateMapping({ transitionMs: Math.max(0, Math.round(v)) })}
            min={0}
            max={500}
            step={10}
            compact
            suffix="ms"
          />

          {/* Place on Face button */}
          <VisemePlacementButton characterId={character.id} />
        </div>
      )}
    </div>
  )
}

function VisemePlacementButton({ characterId }: { characterId: string }) {
  const isPlacing = use3DCharacterStore((s) => s.visemePlacementCharId === characterId)
  const startPlacement = use3DCharacterStore((s) => s.startVisemePlacement)
  const stopPlacement = use3DCharacterStore((s) => s.stopVisemePlacement)

  return (
    <button
      onClick={() => {
        if (isPlacing) {
          stopPlacement()
        } else {
          startPlacement(characterId)
        }
      }}
      className={cn(
        'w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
        isPlacing
          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300',
      )}
    >
      {isPlacing ? 'Click on face to place... (ESC to cancel)' : 'Place on Face'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Face Expression Mapping Section — eye + eyebrow overlays on 3D character
// ---------------------------------------------------------------------------

function FaceExpressionMappingSection({
  character,
  updateCharacter,
}: {
  character: import('@/types/character3d').Character3D
  updateCharacter: (id: string, updates: Partial<import('@/types/character3d').Character3D>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const mapping = character.faceExpressionMapping
  const enabled = mapping?.enabled ?? false

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)

  const toggleEnabled = () => {
    if (enabled) {
      updateCharacter(character.id, {
        faceExpressionMapping: mapping ? { ...mapping, enabled: false } : undefined,
      })
    } else {
      updateCharacter(character.id, {
        faceExpressionMapping: mapping ? { ...mapping, enabled: true } : { ...DEFAULT_FACE_EXPRESSION_MAPPING },
      })
      setExpanded(true)
    }
  }

  const updateMapping = (updates: Partial<FaceExpressionMapping>) => {
    if (!mapping) return
    updateCharacter(character.id, {
      faceExpressionMapping: { ...mapping, ...updates },
    })
  }

  const updatePartConfig = (part: 'eye' | 'eyebrow', updates: Partial<FaceExpressionMapping['eye']>) => {
    if (!mapping) return
    updateCharacter(character.id, {
      faceExpressionMapping: {
        ...mapping,
        [part]: { ...mapping[part], ...updates },
      },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium hover:text-zinc-300 transition-colors"
        >
          <Eye className="w-3 h-3" />
          <span>Face Expressions</span>
          <span className="text-[10px] text-zinc-600 ml-0.5">{expanded ? '\u25B2' : '\u25BC'}</span>
        </button>
        <button
          onClick={toggleEnabled}
          className={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
            enabled
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
          )}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {expanded && mapping && (
        <div className="flex flex-col gap-2 pl-1">
          {/* Expression source */}
          <PanelSelect
            label="Expression Source"
            value={
              mapping.expressionSource.type === 'character-config'
                ? 'character-config'
                : mapping.expressionSource.type === 'saved-2d-character'
                  ? `saved:${mapping.expressionSource.characterId}`
                  : 'custom'
            }
            onChange={(val) => {
              if (val === 'character-config') {
                updateMapping({ expressionSource: { type: 'character-config' } })
              } else if (val.startsWith('saved:')) {
                updateMapping({
                  expressionSource: {
                    type: 'saved-2d-character',
                    characterId: val.replace('saved:', ''),
                  },
                })
              } else {
                updateMapping({
                  expressionSource: {
                    type: 'custom',
                    eyeSprites: {},
                    eyebrowSprites: {},
                  },
                })
              }
            }}
            options={[
              { value: 'character-config', label: 'Primary Character Sprites' },
              ...savedCharacters.map((sc) => ({ value: `saved:${sc.id}`, label: sc.name })),
              { value: 'custom', label: 'Custom Sprites' },
            ]}
            fullWidth
          />

          {/* Dialogue link */}
          {dialogueCharacters.length > 0 && (
            <PanelSelect
              label="Dialogue Source"
              value={mapping.dialogueCharacterId ?? ''}
              onChange={(v) => updateMapping({ dialogueCharacterId: v || undefined })}
              options={[
                { value: '', label: 'Primary Timeline' },
                ...dialogueCharacters.map((dc) => ({ value: dc.id, label: dc.name })),
              ]}
              fullWidth
            />
          )}

          {/* ── Eye overlay ── */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Eye Overlay</span>
              <button
                onClick={() => updatePartConfig('eye', { enabled: !mapping.eye.enabled })}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors',
                  mapping.eye.enabled
                    ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
                )}
              >
                {mapping.eye.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {mapping.eye.enabled && (
              <div className="flex flex-col gap-1.5 pl-1">
                <TransformRow label="Offset">
                  {(['x', 'y', 'z'] as Axis[]).map((axis) => (
                    <DragField
                      key={axis}
                      axis={axis}
                      value={mapping.eye.offset[axis]}
                      onChange={(v) => updatePartConfig('eye', { offset: { ...mapping.eye.offset, [axis]: v } })}
                      sensitivity={0.001}
                      decimals={3}
                    />
                  ))}
                </TransformRow>
                <TransformRow label="Size">
                  <DragField
                    axis="x"
                    value={mapping.eye.scale.x}
                    onChange={(v) =>
                      updatePartConfig('eye', { scale: { ...mapping.eye.scale, x: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                  <DragField
                    axis="y"
                    value={mapping.eye.scale.y}
                    onChange={(v) =>
                      updatePartConfig('eye', { scale: { ...mapping.eye.scale, y: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                </TransformRow>
                <PanelSlider
                  label="Opacity"
                  value={mapping.eye.opacity}
                  onChange={(v) => updatePartConfig('eye', { opacity: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={0}
                  compact
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <ExpressionPlacementButton characterId={character.id} part="eye" />
              </div>
            )}
          </div>

          {/* ── Eyebrow overlay ── */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Eyebrow Overlay</span>
              <button
                onClick={() => updatePartConfig('eyebrow', { enabled: !mapping.eyebrow.enabled })}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors',
                  mapping.eyebrow.enabled
                    ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700',
                )}
              >
                {mapping.eyebrow.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {mapping.eyebrow.enabled && (
              <div className="flex flex-col gap-1.5 pl-1">
                <TransformRow label="Offset">
                  {(['x', 'y', 'z'] as Axis[]).map((axis) => (
                    <DragField
                      key={axis}
                      axis={axis}
                      value={mapping.eyebrow.offset[axis]}
                      onChange={(v) =>
                        updatePartConfig('eyebrow', { offset: { ...mapping.eyebrow.offset, [axis]: v } })
                      }
                      sensitivity={0.001}
                      decimals={3}
                    />
                  ))}
                </TransformRow>
                <TransformRow label="Size">
                  <DragField
                    axis="x"
                    value={mapping.eyebrow.scale.x}
                    onChange={(v) =>
                      updatePartConfig('eyebrow', { scale: { ...mapping.eyebrow.scale, x: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                  <DragField
                    axis="y"
                    value={mapping.eyebrow.scale.y}
                    onChange={(v) =>
                      updatePartConfig('eyebrow', { scale: { ...mapping.eyebrow.scale, y: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                </TransformRow>
                <PanelSlider
                  label="Opacity"
                  value={mapping.eyebrow.opacity}
                  onChange={(v) => updatePartConfig('eyebrow', { opacity: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={0}
                  compact
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <ExpressionPlacementButton characterId={character.id} part="eyebrow" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExpressionPlacementButton({ characterId, part }: { characterId: string; part: 'eye' | 'eyebrow' }) {
  const isPlacing = use3DCharacterStore(
    (s) => s.expressionPlacementCharId === characterId && s.expressionPlacementPart === part,
  )
  const startPlacement = use3DCharacterStore((s) => s.startExpressionPlacement)
  const stopPlacement = use3DCharacterStore((s) => s.stopExpressionPlacement)

  return (
    <button
      onClick={() => {
        if (isPlacing) {
          stopPlacement()
        } else {
          startPlacement(characterId, part)
        }
      }}
      className={cn(
        'w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
        isPlacing
          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300',
      )}
    >
      {isPlacing
        ? `Click on face to place ${part}... (ESC to cancel)`
        : `Place ${part === 'eye' ? 'Eyes' : 'Eyebrows'} on Face`}
    </button>
  )
}
