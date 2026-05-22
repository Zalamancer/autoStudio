import { useRef, useState, useCallback, useEffect } from 'react'
import { useCharacterContext } from '../../contexts/CharacterContext'
import { useViewportContext } from '../../contexts/ViewportContext'
import { useToolContext } from '../../contexts/ToolContext'
import { useAnimationContext } from '../../contexts/AnimationContext'
import { useEngineContext } from '../../contexts/EngineContext'
import { useEditorPropsContext } from './BoneRiggingProvider'
import { AutoRigger, SkinWeightCalculator } from '@bonerigging/core'
import type { RigPart } from '@bonerigging/core'
import type { ClothingOverlayInput } from '../../hooks/useBoneRiggingEngine'
import { PanelMultiSelect } from '@/components/ui/panel-controls'
import { Undo2, Redo2, ChevronDown, Shirt, Footprints } from 'lucide-react'
import { PantsIcon } from '@/components/layout/RightPanel/rightPanelConstants'
import { cn } from '@/lib/utils'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'

/**
 * BRToolPanel — left panel for embedded use in AutoStudio.
 * Uses exact same styling as AutoStudio's RightPanel sections:
 *   sections: p-4 border-b border-white/5
 *   headings: text-white text-base font-semibold mb-4
 *   labels:   text-gray-400 text-sm
 *   inputs:   bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg
 *   buttons:  bg-[#2a2a2a] text-sm rounded-lg
 *   active:   bg-[#4a7eff] text-white
 */
export function BRToolPanel() {
  const engine = useEngineContext()
  const { state: charState, dispatch: charDispatch } = useCharacterContext()
  const { state: vpState, dispatch: vpDispatch } = useViewportContext()
  const { state: toolState } = useToolContext()
  const { state: animState } = useAnimationContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [characterDropdownOpen, setCharacterDropdownOpen] = useState(false)
  const DEFAULT_PARTS: RigPart[] = ['head', 'body', 'arms', 'legs', 'hands']
  const [rigParts, setRigParts] = useState<RigPart[]>(DEFAULT_PARTS)

  const { onSave } = useEditorPropsContext()

  const hasCharacter = charState.parsed !== null
  const isEditMode = toolState.editMode
  const isPinned = charState.selectedJoint ? charState.pinnedJoints.has(charState.selectedJoint) : false

  // Apply rig AND immediately persist to the store
  const handleApplyAndSave = useCallback(() => {
    engine.handleApplyRig()
    // Persist immediately — don't wait for 30s auto-save timer
    if (onSave) {
      // Small delay to ensure handleApplyRig has finished updating joint.rest
      setTimeout(() => {
        const data = engine.getSerializedData()
        if (data) onSave(data)
      }, 0)
    }
  }, [engine, onSave])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      engine.loadFile(file)
      e.target.value = ''
    }
  }

  const modeLabel = charState.mode === 'svg' ? 'SVG' : charState.mode === 'raster' ? 'Raster' : ''

  const handlePartsChange = useCallback(
    (ids: string[]) => {
      if (!charState.parsed) return
      const parts = ids as RigPart[]
      setRigParts(parts)
      const hasPhalanges = parts.includes('phalanges')
      const skeleton = AutoRigger.createSkeleton(charState.parsed, { phalanges: hasPhalanges, parts })
      if (charState.mode === 'raster' && charState.mesh) {
        const weights = SkinWeightCalculator.compute(charState.mesh.vertices, skeleton, charState.parsed.bbox)
        charDispatch({ type: 'UPDATE_SKELETON', skeleton })
        charDispatch({ type: 'UPDATE_WEIGHTS', weights })
      } else if (charState.mode === 'svg') {
        const weights = SkinWeightCalculator.compute(charState.parsed.allControlPoints, skeleton, charState.parsed.bbox)
        charDispatch({ type: 'UPDATE_SKELETON', skeleton })
        charDispatch({ type: 'UPDATE_WEIGHTS', weights })
      }
    },
    [charState.parsed, charState.mode, charState.mesh, charDispatch],
  )

  // Button styles — exact same as AutoStudio RightPanel
  const btn = 'w-full px-3 py-2 text-sm rounded-lg transition-colors'
  const btnDefault = `${btn} bg-[#2a2a2a] text-gray-400 hover:text-white`
  const btnActive = `${btn} bg-[#4a7eff] text-white`
  const btnGreen = `${btn} bg-green-600 text-white hover:bg-green-500`
  const btnHalf = 'flex-1 px-3 py-2 text-sm rounded-lg transition-colors'

  const { characterLibrary, activeCharacterId } = charState
  const activeCharacter = characterLibrary.find((c) => c.id === activeCharacterId)

  // --- Clothing overlay state (driven by selectedSprites in saved character store) ---
  const CLOTHING_ITEMS = [
    { id: 'shirt', label: 'Shirt', icon: Shirt, zOrder: 3, fit: 1.2 },
    { id: 'pants', label: 'Pants', icon: PantsIcon, zOrder: 1, fit: 1.0 },
    { id: 'shoes', label: 'Shoes', icon: Footprints, zOrder: 2, fit: 0.8 },
  ] as const
  const clothingImgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())

  // Read clothing sprites from the active saved character
  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const updateSavedCharacter = useSavedCharactersStore((s) => s.updateCharacter)
  // activeCharacterId from rig context is the savedCharacterId; also try dialogue char lookup as fallback
  const dialogueChars = useMultiCharacterStore((s) => s.characters)
  const globalActiveId = useMultiCharacterStore((s) => s.activeCharacterId)
  const activeDialogueChar = dialogueChars.find((c) => c.id === globalActiveId)
  const savedChar =
    savedCharacters.find((c) => c.id === activeCharacterId) ||
    savedCharacters.find((c) => c.id === activeDialogueChar?.savedCharacterId)
  const bodyParts = (savedChar?.bodyParts ?? {}) as Record<string, string[]>
  const selectedSprites = (savedChar?.selectedSprites ?? {}) as Record<string, number | null>
  const partTransforms = (savedChar?.partTransforms ?? {}) as Record<
    string,
    { x: number; y: number; scaleX: number; scaleY: number; rotation: number; visible: boolean }
  >

  // Toggle a clothing type on/off via selectedSprites (shared with right panel Clothes tab)
  const toggleClothing = useCallback(
    (itemId: string) => {
      if (!savedChar) return
      const current = selectedSprites[itemId]
      const newVal = current === null || current === undefined ? 0 : null
      updateSavedCharacter(savedChar.id, {
        selectedSprites: { ...selectedSprites, [itemId]: newVal } as any,
      })
    },
    [savedChar, selectedSprites, updateSavedCharacter],
  )

  // Sync clothing overlays with engine whenever selectedSprites changes
  useEffect(() => {
    const activeItems = CLOTHING_ITEMS.filter(
      (item) => selectedSprites[item.id] !== null && selectedSprites[item.id] !== undefined,
    )
    if (activeItems.length === 0) {
      engine.setClothingOverlays([])
      return
    }

    const layers: ClothingOverlayInput[] = []
    const toLoad: { id: string; url: string; zOrder: number; fit: number }[] = []

    for (const item of activeItems) {
      const sprites = bodyParts[item.id]
      const idx = selectedSprites[item.id] ?? 0
      const url = sprites?.[idx]
      if (!url) continue

      const pt = partTransforms[item.id]
      const cached = clothingImgCacheRef.current.get(url)
      if (cached) {
        layers.push({ id: item.id, image: cached, zOrder: item.zOrder, fitLooseness: item.fit, partTransform: pt })
      } else {
        toLoad.push({ id: item.id, url, zOrder: item.zOrder, fit: item.fit })
      }
    }

    if (toLoad.length === 0) {
      engine.setClothingOverlays(layers)
      return
    }

    // Load missing images then set all layers
    Promise.all(
      toLoad.map(
        ({ url }) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = url
          }),
      ),
    ).then((images) => {
      for (let i = 0; i < toLoad.length; i++) {
        clothingImgCacheRef.current.set(toLoad[i].url, images[i])
        const ptl = partTransforms[toLoad[i].id]
        layers.push({
          id: toLoad[i].id,
          image: images[i],
          zOrder: toLoad[i].zOrder,
          fitLooseness: toLoad[i].fit,
          partTransform: ptl,
        })
      }
      engine.setClothingOverlays(layers)
    })
  }, [selectedSprites, bodyParts, partTransforms, engine])

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.bmp"
        hidden
        onChange={handleFileChange}
      />

      {/* ──── Character Library ──── */}
      {characterLibrary.length > 0 && (
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white text-base font-semibold mb-4">Characters</h2>

          <button
            onClick={() => setCharacterDropdownOpen(!characterDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#2a2a2a] rounded-lg border border-white/5 hover:bg-[#3a3a3a] transition-colors mb-3"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                {activeCharacter ? (
                  <img
                    src={activeCharacter.thumbnailUrl || activeCharacter.imageUrl}
                    alt={activeCharacter.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-zinc-500">
                    <span className="text-[10px] font-medium leading-none">?</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-zinc-200 truncate">
                {activeCharacter?.name || 'Select Character'}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-zinc-400 transition-transform ${characterDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {characterDropdownOpen && (
            <div className="grid grid-cols-3 gap-2 mb-3 bg-black/20 p-2 rounded-xl border border-white/5">
              {characterLibrary.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    charDispatch({ type: 'SET_ACTIVE_CHARACTER', id: entry.id })
                    setCharacterDropdownOpen(false)
                    if (entry.savedRigData) {
                      // Restore existing rig (joint positions, weights, animations)
                      // but patch sourceImageUrl with the live URL
                      const patchedData = { ...entry.savedRigData, sourceImageUrl: entry.imageUrl }
                      engine.loadSerializedData(patchedData)
                    } else {
                      engine.loadCharacterFromUrl(entry.imageUrl, entry.name, entry.svgSource)
                    }
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    activeCharacterId === entry.id
                      ? 'border-[#4a7eff] shadow-[0_0_10px_rgba(74,126,255,0.3)]'
                      : 'border-transparent hover:border-white/20 hover:scale-105'
                  }`}
                >
                  <img
                    src={entry.thumbnailUrl || entry.imageUrl}
                    alt={entry.name}
                    className="w-full aspect-square object-contain bg-[#2a2a2a]"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center truncate">
                    {entry.name}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`${btnDefault} text-xs font-semibold uppercase tracking-wider`}
          >
            Upload Custom
          </button>
        </div>
      )}

      {/* ──── Clothing Overlays — Cinema Pill Tabs ──── */}
      {hasCharacter && savedChar && (
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white text-base font-semibold mb-3">Clothing</h2>
          <div className="flex items-center gap-1">
            {CLOTHING_ITEMS.map(({ id, label, icon: Icon }) => {
              const sprites = bodyParts[id]
              const hasSprite = sprites && sprites.length > 0 && !!sprites[0]
              const active = selectedSprites[id] !== null && selectedSprites[id] !== undefined
              return (
                <button
                  key={id}
                  disabled={!hasSprite}
                  onClick={() => toggleClothing(id)}
                  title={hasSprite ? label : `${label} — no sprite`}
                  style={{
                    flex: active ? 2 : 1,
                    transition:
                      'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
                  }}
                  className={cn(
                    'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                    active ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
                    !hasSprite && 'opacity-30 pointer-events-none',
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span
                    style={{
                      transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                    }}
                    className={cn(
                      'text-[11px] font-medium truncate',
                      active ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                    )}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ──── File ──── */}
      {characterLibrary.length === 0 && (
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white text-base font-semibold mb-4">File</h2>
          {modeLabel && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">
                {modeLabel}
                {isEditMode ? ' — Edit Mode' : ''}
              </span>
              {engine.fps > 0 && <span className="text-gray-400 text-xs">{engine.fps} fps</span>}
            </div>
          )}
          <div className="space-y-2">
            <button onClick={() => fileInputRef.current?.click()} className={btnDefault}>
              Upload File
            </button>
            <button
              onClick={engine.handleResetPose}
              disabled={!hasCharacter}
              className={`${btnDefault} disabled:opacity-30`}
            >
              Reset Pose
            </button>
          </div>
        </div>
      )}

      {/* ──── Deformation ──── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Deformation</h2>

        <div className="flex gap-1 mb-2">
          <button
            onClick={() => charDispatch({ type: 'SET_DEFORM_MODE', mode: 'rigid' })}
            className={`${btnHalf} ${charState.deformMode === 'rigid' ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}
          >
            Rigid
          </button>
          <button
            onClick={() => charDispatch({ type: 'SET_DEFORM_MODE', mode: 'stretch' })}
            className={`${btnHalf} ${charState.deformMode === 'stretch' ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}
          >
            Stretch
          </button>
        </div>

        {charState.deformMode === 'stretch' && (
          <button
            onClick={() => charDispatch({ type: 'TOGGLE_SQUASH_STRETCH', enabled: !charState.squashStretchEnabled })}
            className={`${charState.squashStretchEnabled ? btnActive : btnDefault} mb-2`}
          >
            Elastic
          </button>
        )}

        <button
          onClick={() => {
            if (charState.selectedJoint) charDispatch({ type: 'TOGGLE_PIN', joint: charState.selectedJoint })
          }}
          disabled={!charState.selectedJoint}
          className={`${isPinned ? btnActive : btnDefault} disabled:opacity-30`}
        >
          {isPinned ? 'Unpin Joint' : 'Pin Joint'}
        </button>
      </div>

      {/* ──── Rig Editing ──── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Rig Editing</h2>
        <div className="space-y-2">
          {!isEditMode ? (
            <button
              onClick={engine.handleEditRig}
              disabled={!hasCharacter}
              className={`${btnDefault} disabled:opacity-30`}
            >
              Edit Rig
            </button>
          ) : (
            <>
              <button onClick={handleApplyAndSave} className={btnGreen}>
                Apply Rig
              </button>
              <div className="flex gap-2">
                <button
                  onClick={engine.handleAddJoint}
                  className={`${btnHalf} bg-[#2a2a2a] text-gray-400 hover:text-white`}
                >
                  + Joint
                </button>
                <button
                  onClick={engine.handleDeleteJoint}
                  className={`${btnHalf} bg-[#2a2a2a] text-red-400 hover:text-red-300`}
                >
                  − Joint
                </button>
              </div>
              <button onClick={engine.handleMirror} className={btnDefault}>
                Mirror L→R
              </button>
            </>
          )}
          {hasCharacter && (
            <div className="mt-2">
              <PanelMultiSelect
                label="Parts"
                options={[
                  { value: 'head', label: 'Head' },
                  { value: 'body', label: 'Body' },
                  { value: 'arms', label: 'Arms' },
                  { value: 'legs', label: 'Legs' },
                  { value: 'hands', label: 'Hands' },
                  { value: 'phalanges', label: 'Phalanges' },
                ]}
                value={rigParts}
                onChange={handlePartsChange}
                placeholder="None"
              />
            </div>
          )}
        </div>
      </div>

      {/* ──── History ──── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">History</h2>
        <div className="flex gap-2">
          <button
            onClick={engine.handleUndo}
            disabled={!engine.canUndo}
            className={`${btnHalf} flex items-center justify-center gap-1.5 bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-30`}
          >
            <Undo2 size={14} /> Undo
          </button>
          <button
            onClick={engine.handleRedo}
            disabled={!engine.canRedo}
            className={`${btnHalf} flex items-center justify-center gap-1.5 bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-30`}
          >
            <Redo2 size={14} /> Redo
          </button>
        </div>
      </div>

      {/* ──── Tools ──── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Tools</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={engine.handleTogglePoses}
            disabled={!hasCharacter}
            className={`${btnHalf} ${engine.showPoses ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'} disabled:opacity-30`}
          >
            Poses
          </button>
          <button
            onClick={engine.handleToggleTimeline}
            disabled={!hasCharacter}
            className={`${btnHalf} ${animState.showTimeline ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'} disabled:opacity-30`}
          >
            Timeline
          </button>
          <button
            onClick={engine.handleToggleWeightPaint}
            disabled={!hasCharacter}
            className={`${btnHalf} ${toolState.weightPaintMode ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'} disabled:opacity-30`}
          >
            Weights
          </button>
          <button
            onClick={engine.handleToggleFFD}
            disabled={!hasCharacter}
            className={`${btnHalf} ${charState.ffdMode ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'} disabled:opacity-30`}
          >
            FFD
          </button>
        </div>
      </div>

      {/* ──── Mesh Quality (raster only) ──── */}
      {charState.mode === 'raster' && (
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white text-base font-semibold mb-4">Mesh Quality</h2>
          <div className="flex gap-1">
            {[
              { label: 'Low', value: 8 },
              { label: 'Med', value: 16 },
              { label: 'High', value: 30 },
              { label: 'Ultra', value: 50 },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => vpDispatch({ type: 'SET_MESH_DENSITY', density: value })}
                className={`${btnHalf} ${vpState.meshDensity === value ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {charState.mesh && (
            <p className="text-gray-400 text-xs mt-2">
              {charState.mesh.vertices.length} vertices · {charState.mesh.triangles.length} triangles
            </p>
          )}
        </div>
      )}
    </div>
  )
}
