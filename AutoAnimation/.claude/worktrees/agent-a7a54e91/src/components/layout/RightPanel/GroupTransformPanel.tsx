import { useCallback, useState } from 'react'
import { RotateCcw, User } from 'lucide-react'
import { type LayerPart } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore, createDefaultPartTransforms } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { PartTransformControls } from './PartTransformControls'
import { recordPropertyChange } from '@/hooks/usePropertyRecorder'

const DEFAULT_LAYER_ORDER: LayerPart[] = ['body', 'shirt', 'pants', 'shoes', 'head', 'eye', 'eyebrow', 'viseme', 'hair']

const partLabelMap: Record<LayerPart, { label: string; color: string }> = {
  body: { label: 'Body', color: 'bg-[#4a7eff]' },
  head: { label: 'Head', color: 'bg-[#4a7eff]' },
  eye: { label: 'Eye', color: 'bg-[#4a7eff]' },
  eyebrow: { label: 'Eyebrow', color: 'bg-[#4a7eff]' },
  viseme: { label: 'Viseme', color: 'bg-[#4a7eff]' },
  hair: { label: 'Hair', color: 'bg-[#4a7eff]' },
  shirt: { label: 'Shirt', color: 'bg-[#4a7eff]' },
  pants: { label: 'Pants', color: 'bg-[#4a7eff]' },
  shoes: { label: 'Shoes', color: 'bg-[#4a7eff]' },
}

/** Character preview layers — excludes viseme */
const PREVIEW_LAYERS: { part: string; zBase: number }[] = [
  { part: 'body', zBase: 0 },
  { part: 'shirt', zBase: 1 },
  { part: 'pants', zBase: 2 },
  { part: 'shoes', zBase: 3 },
  { part: 'head', zBase: 4 },
  { part: 'eye', zBase: 5 },
  { part: 'eyebrow', zBase: 6 },
  { part: 'hair', zBase: 8 },
]

/* ── Character Preview ── */
function CharacterPreview({ savedCharId }: { savedCharId: string | null }) {
  const savedChar = useSavedCharactersStore((s) =>
    savedCharId ? s.characters.find((c) => c.id === savedCharId) : null
  )
  if (!savedChar) return null

  const bp = savedChar.bodyParts
  const hasBP = bp && Object.values(bp).some((arr) => arr.length > 0)

  return (
    <div className="w-full aspect-[4/5] bg-[#1a1a1a] relative overflow-hidden rounded-lg">
      {hasBP && bp ? (
        PREVIEW_LAYERS.map(({ part, zBase }) => {
          const sel = savedChar.selectedSprites
          const idx = (sel as Record<string, number | null> | undefined)?.[part] ?? 0
          const src = bp[part as keyof typeof bp]?.[idx] || bp[part as keyof typeof bp]?.[0]
          if (!src) return null
          const pt = savedChar.partTransforms as Record<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }> | undefined
          const t = pt?.[part]
          if (t && !t.visible) return null
          return (
            <img
              key={part}
              src={src}
              alt={part}
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                zIndex: zBase,
                ...(t ? {
                  transform: `translate(${(t.x / 200) * 100}%, ${(t.y / 200) * 100}%) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                  transformOrigin: 'center center',
                } : {}),
              }}
            />
          )
        })
      ) : savedChar.referenceImage ? (
        <img src={savedChar.referenceImage} alt={savedChar.name} className="w-full h-full object-contain" />
      ) : (
        <User size={48} className="text-zinc-700 absolute inset-0 m-auto" />
      )}
      {/* Name overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 z-10">
        <p className="text-xs font-medium text-white">{savedChar.name}</p>
      </div>
    </div>
  )
}

/* ── Draggable Part List ── */
function DraggablePartList({
  layerOrder,
  charId,
  charPartTransforms,
  onPartTransformChange,
}: {
  layerOrder: LayerPart[]
  charId: string
  charPartTransforms: ReturnType<typeof createDefaultPartTransforms>
  onPartTransformChange: (part: LayerPart, updates: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>) => void
}) {
  const setCharacterLayerOrder = useMultiCharacterStore((s) => s.setCharacterLayerOrder)
  const [draggedPart, setDraggedPart] = useState<LayerPart | null>(null)
  const [dragOverPart, setDragOverPart] = useState<LayerPart | null>(null)

  const displayOrder = [...layerOrder].reverse()

  const handleDragStart = (part: LayerPart) => (e: React.DragEvent) => {
    setDraggedPart(part)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget.parentElement?.parentElement) e.dataTransfer.setDragImage(e.currentTarget.parentElement.parentElement, 0, 0)
  }
  const handleDragEnd = () => { setDraggedPart(null); setDragOverPart(null) }
  const handleDragOver = (part: LayerPart) => (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (draggedPart && part !== draggedPart) setDragOverPart(part) }
  const handleDragLeave = () => setDragOverPart(null)
  const handleDrop = (targetPart: LayerPart) => (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedPart || draggedPart === targetPart) return
    const newOrder = [...layerOrder]
    const fromIdx = newOrder.indexOf(draggedPart)
    const toIdx = newOrder.indexOf(targetPart)
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, draggedPart)
    setCharacterLayerOrder(charId, newOrder)
    setDraggedPart(null)
    setDragOverPart(null)
  }

  return (
    <div className="space-y-1">
      {displayOrder.map((part) => {
        const entry = partLabelMap[part]
        if (!entry) return null
        return (
          <PartTransformControls
            key={part}
            label={entry.label}
            transform={charPartTransforms[part]}
            onChange={(updates) => onPartTransformChange(part, updates)}
            color={entry.color}
            defaultExpanded={false}
            draggable
            isDragOver={dragOverPart === part}
            onDragStart={handleDragStart(part)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver(part)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(part)}
          />
        )
      })}
    </div>
  )
}

/* ── Main Panel ── */
export function GroupTransformPanel() {
  const activeDialogueChar = useMultiCharacterStore((s) => {
    const id = s.activeCharacterId
    return id ? s.characters.find((c) => c.id === id) : null
  })
  const updateDialogueCharacter = useMultiCharacterStore((s) => s.updateDialogueCharacter)
  const updateCharacterPartTransform = useMultiCharacterStore((s) => s.updateCharacterPartTransform)

  const charPartTransforms = activeDialogueChar?.partTransforms || createDefaultPartTransforms()
  const charLayerOrder = activeDialogueChar?.layerOrder || DEFAULT_LAYER_ORDER
  const charId = activeDialogueChar?.id || ''

  const groupTransform = activeDialogueChar
    ? { x: activeDialogueChar.position.x, y: activeDialogueChar.position.y, rotation: activeDialogueChar.rotation || 0, scaleX: activeDialogueChar.scale, scaleY: activeDialogueChar.scale, visible: activeDialogueChar.visible }
    : { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }

  const handleGroupChange = useCallback(
    (updates: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>) => {
      if (!activeDialogueChar) return
      const patch: Partial<typeof activeDialogueChar> = {}
      if (updates.x !== undefined || updates.y !== undefined) {
        patch.position = { x: updates.x ?? activeDialogueChar.position.x, y: updates.y ?? activeDialogueChar.position.y }
      }
      if (updates.scaleX !== undefined) patch.scale = updates.scaleX
      if (updates.scaleY !== undefined) patch.scale = updates.scaleY
      if (updates.rotation !== undefined) patch.rotation = updates.rotation
      if (updates.visible !== undefined) patch.visible = updates.visible
      updateDialogueCharacter(activeDialogueChar.id, patch)
    },
    [activeDialogueChar, updateDialogueCharacter]
  )

  const handleGroupRecordProperty = useCallback(
    (key: string, newValue: number, previousValue: number) => {
      if (!activeDialogueChar) return
      recordPropertyChange({ objectType: 'dialogueCharacter', objectId: activeDialogueChar.id }, key, newValue, previousValue)
    },
    [activeDialogueChar]
  )

  const persistPartTransformsToSaved = useCallback((cId: string, savedCharId: string | null) => {
    if (!savedCharId) return
    const char = useMultiCharacterStore.getState().characters.find((c) => c.id === cId)
    if (!char?.partTransforms) return
    const { updateCharacter, persistImages } = useSavedCharactersStore.getState()
    updateCharacter(savedCharId, { partTransforms: { ...char.partTransforms } })
    persistImages(savedCharId).catch(() => {})
  }, [])

  const handlePartTransformChange = useCallback((part: LayerPart, updates: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>) => {
    if (!activeDialogueChar) return
    updateCharacterPartTransform(activeDialogueChar.id, part, updates)
    persistPartTransformsToSaved(activeDialogueChar.id, activeDialogueChar.savedCharacterId)
  }, [activeDialogueChar, updateCharacterPartTransform, persistPartTransformsToSaved])

  const handleResetAll = useCallback(() => {
    if (!activeDialogueChar) return
    const defaults = createDefaultPartTransforms()
    for (const part of Object.keys(defaults) as LayerPart[]) {
      updateCharacterPartTransform(activeDialogueChar.id, part, defaults[part])
    }
    persistPartTransformsToSaved(activeDialogueChar.id, activeDialogueChar.savedCharacterId)
  }, [activeDialogueChar, updateCharacterPartTransform, persistPartTransformsToSaved])

  if (!activeDialogueChar) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <User size={28} className="mb-3" />
        <span className="text-sm text-gray-400">No character selected</span>
        <span className="text-xs text-gray-600 mt-1">Select one on the canvas</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Scrollable body — preview + transform share scroll ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Character Preview */}
        <div className="px-3 pt-3">
          <CharacterPreview savedCharId={activeDialogueChar.savedCharacterId} />
        </div>

        {/* ── Transform ── */}
        <div className="px-3 py-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Transform</span>
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded transition-colors"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          </div>
          <PartTransformControls
            label={activeDialogueChar.name || 'Character'}
            transform={groupTransform}
            onChange={handleGroupChange}
            color="bg-white"
            defaultExpanded={true}
            onRecordProperty={handleGroupRecordProperty}
            zIndex={activeDialogueChar.zIndex}
            onZIndexChange={(v) => updateDialogueCharacter(activeDialogueChar.id, { zIndex: v })}
          />
        </div>

        {/* ── Part Layers ── */}
        <div className="px-3 pb-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Part Layers</span>
          <DraggablePartList
            layerOrder={charLayerOrder}
            charId={charId}
            charPartTransforms={charPartTransforms}
            onPartTransformChange={handlePartTransformChange}
          />
        </div>
      </div>
    </div>
  )
}
