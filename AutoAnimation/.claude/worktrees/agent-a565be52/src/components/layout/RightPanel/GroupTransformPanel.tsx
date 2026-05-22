import { useCallback, useState } from 'react'
import { RotateCcw } from 'lucide-react'
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

/* ── Draggable Part List (layer reorder via drag handles) ── */
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

  // Display order: reversed so top layer is first visually
  const displayOrder = [...layerOrder].reverse()

  const handleDragStart = (part: LayerPart) => (e: React.DragEvent) => {
    setDraggedPart(part)
    e.dataTransfer.effectAllowed = 'move'
    // Make the drag image semi-transparent
    if (e.currentTarget.parentElement?.parentElement) {
      e.dataTransfer.setDragImage(e.currentTarget.parentElement.parentElement, 0, 0)
    }
  }

  const handleDragEnd = () => {
    setDraggedPart(null)
    setDragOverPart(null)
  }

  const handleDragOver = (part: LayerPart) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedPart && part !== draggedPart) {
      setDragOverPart(part)
    }
  }

  const handleDragLeave = () => {
    setDragOverPart(null)
  }

  const handleDrop = (targetPart: LayerPart) => (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedPart || draggedPart === targetPart) return

    // Build new order: swap positions in the layerOrder array
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
    <div className="space-y-2">
      {displayOrder.map((part) => {
        const entry = partLabelMap[part]
        if (!entry) return null
        const { label, color } = entry
        return (
          <PartTransformControls
            key={part}
            label={label}
            transform={charPartTransforms[part]}
            onChange={(updates) => onPartTransformChange(part, updates)}
            color={color}
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

export function GroupTransformPanel() {
  const activeDialogueChar = useMultiCharacterStore((s) => {
    const id = s.activeCharacterId
    return id ? s.characters.find((c) => c.id === id) : null
  })
  const updateDialogueCharacter = useMultiCharacterStore((s) => s.updateDialogueCharacter)
  const updateCharacterPartTransform = useMultiCharacterStore((s) => s.updateCharacterPartTransform)


  // Per-character transforms (with backwards-compat defaults)
  const charPartTransforms = activeDialogueChar?.partTransforms || createDefaultPartTransforms()
  const charLayerOrder = activeDialogueChar?.layerOrder || DEFAULT_LAYER_ORDER
  const charId = activeDialogueChar?.id || ''

  // Build a PartTransform-shaped object from the character's canvas position/scale
  // so the existing PartTransformControls component can render it
  const groupTransform = activeDialogueChar
    ? {
        x: activeDialogueChar.position.x,
        y: activeDialogueChar.position.y,
        rotation: activeDialogueChar.rotation || 0,
        scaleX: activeDialogueChar.scale,
        scaleY: activeDialogueChar.scale,
        visible: activeDialogueChar.visible,
      }
    : { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }

  // Handle group transform changes -> update character position/scale in multiCharacterStore
  const handleGroupChange = useCallback(
    (updates: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>) => {
      if (!activeDialogueChar) return
      const patch: Partial<typeof activeDialogueChar> = {}
      if (updates.x !== undefined || updates.y !== undefined) {
        patch.position = {
          x: updates.x ?? activeDialogueChar.position.x,
          y: updates.y ?? activeDialogueChar.position.y,
        }
      }
      if (updates.scaleX !== undefined) {
        patch.scale = updates.scaleX
      }
      if (updates.scaleY !== undefined) {
        // Use scaleY as uniform scale if scaleX wasn't set
        patch.scale = updates.scaleY
      }
      if (updates.rotation !== undefined) {
        patch.rotation = updates.rotation
      }
      if (updates.visible !== undefined) {
        patch.visible = updates.visible
      }
      updateDialogueCharacter(activeDialogueChar.id, patch)
    },
    [activeDialogueChar, updateDialogueCharacter]
  )

  // Record keyframe for the group (character) part
  const handleGroupRecordProperty = useCallback(
    (key: string, newValue: number, previousValue: number) => {
      if (!activeDialogueChar) return
      recordPropertyChange(
        { objectType: 'dialogueCharacter', objectId: activeDialogueChar.id },
        key,
        newValue,
        previousValue
      )
    },
    [activeDialogueChar]
  )

  // Persist part transforms to the saved character (IndexedDB) after changes
  const persistPartTransformsToSaved = useCallback((charId: string, savedCharId: string | null) => {
    if (!savedCharId) return
    // Read current per-character transforms from multi-char store
    const char = useMultiCharacterStore.getState().characters.find((c) => c.id === charId)
    if (!char?.partTransforms) return
    const { updateCharacter, persistImages } = useSavedCharactersStore.getState()
    updateCharacter(savedCharId, { partTransforms: { ...char.partTransforms } })
    persistImages(savedCharId).catch(() => {})
  }, [])

  // Wrapper: update part transform + persist to saved character
  const handlePartTransformChange = useCallback((part: LayerPart, updates: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>) => {
    if (!activeDialogueChar) return
    updateCharacterPartTransform(activeDialogueChar.id, part, updates)
    // Debounce persistence: persist after a short delay to avoid spamming IndexedDB on drag
    persistPartTransformsToSaved(activeDialogueChar.id, activeDialogueChar.savedCharacterId)
  }, [activeDialogueChar, updateCharacterPartTransform, persistPartTransformsToSaved])

  // Reset all per-character part transforms to default
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
      <div className="p-4 text-center text-zinc-500">
        <p className="text-xs">Select a character on the canvas to edit its transforms.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-base font-semibold">Transform</h2>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
            title="Reset all part transforms"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* ── Group Transform Controls ───────────────────────────── */}
      <div className="p-4 border-b border-white/5 space-y-2">
        <PartTransformControls
          key="group"
          label={activeDialogueChar.name || 'Group'}
          transform={groupTransform}
          onChange={handleGroupChange}
          color="bg-white"
          defaultExpanded={true}
          onRecordProperty={handleGroupRecordProperty}
          zIndex={activeDialogueChar.zIndex}
          onZIndexChange={(v) => updateDialogueCharacter(activeDialogueChar.id, { zIndex: v })}
        />
      </div>

      {/* ── Part Transform Controls ────────────────────────────── */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase mb-3">Part Layers</h4>
        <DraggablePartList
          layerOrder={charLayerOrder}
          charId={charId}
          charPartTransforms={charPartTransforms}
          onPartTransformChange={handlePartTransformChange}
        />
      </div>
    </div>
  )
}
