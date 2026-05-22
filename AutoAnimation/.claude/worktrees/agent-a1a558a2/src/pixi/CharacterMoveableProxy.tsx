/* eslint-disable react-hooks/rules-of-hooks */
import { memo, useRef, useCallback, useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCanvasStore, useCharacterPartsStore } from '@/stores'
import { useEditorStore } from '@/stores/useEditorStore'
import { useMultiCharacterStore, type DialogueCharacter } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore, type SavedCharacter } from '@/stores/useSavedCharactersStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from '@/components/canvas/SelectionTransformBox'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'

/**
 * CharacterMoveableProxy provides invisible DOM divs positioned over PixiJS-rendered
 * characters. These divs handle click selection, drag movement, and Moveable.js
 * transform handles — while PixiJS handles the actual rendering on the GPU canvas.
 *
 * Same pattern as MoveableProxy.tsx (media), ShapeMoveableProxy.tsx (shapes),
 * and TextMoveableProxy.tsx (text).
 */

const BASE_CHARACTER_SIZE = 200

// ─── Single Character Proxy (non-dialogue mode) ─────────────────────────

/**
 * SingleCharacterProxy — invisible overlay for the primary character composite.
 * Uses manual pointer drag (matching CharacterComposite.tsx pattern).
 */
const SingleCharacterProxy = memo(function SingleCharacterProxy() {
  const layerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

  const { selectCharacter, selectedCharacterId } = useCanvasStore()
  const { transforms, updateTransform } = useCharacterPartsStore()
  const { recordIfEnabled } = useKeyframeRecorder()

  const containerWidth = useCanvasStore((s) => s.canvasWidth)
  const containerHeight = useCanvasStore((s) => s.canvasHeight)

  const groupTransform = transforms.group

  if (!groupTransform.visible) return null

  // Position as percentage of container (matching CharacterComposite.tsx)
  const left = (groupTransform.x / containerWidth) * 100
  const top = (groupTransform.y / containerHeight) * 100

  const isSelected = selectedCharacterId === 'composite'

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      selectCharacter('composite')

      setIsDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        startX: groupTransform.x,
        startY: groupTransform.y,
      }

      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [groupTransform.x, groupTransform.y, selectCharacter]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - dragStart.current.x
      const deltaY = e.clientY - dragStart.current.y

      // Scale delta based on container size vs actual display size
      const parent = layerRef.current?.parentElement
      const scaleX = containerWidth / (parent?.clientWidth || 1)
      const scaleY = containerHeight / (parent?.clientHeight || 1)

      updateTransform('group', {
        x: Math.round(dragStart.current.startX + deltaX * scaleX),
        y: Math.round(dragStart.current.startY + deltaY * scaleY),
      })
    },
    [isDragging, containerWidth, containerHeight, updateTransform]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        recordIfEnabled(
          { objectType: 'character', objectId: 'group' },
          { x: groupTransform.x, y: groupTransform.y },
          { x: dragStart.current.startX, y: dragStart.current.startY }
        )
      }
      setIsDragging(false)
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    },
    [isDragging, groupTransform.x, groupTransform.y, recordIfEnabled]
  )

  return (
    <div
      ref={layerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        'absolute cursor-move select-none',
        isSelected && 'outline outline-2 outline-green-500 outline-offset-2 rounded-lg'
      )}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${groupTransform.rotation}deg) scale(${groupTransform.scaleX}, ${groupTransform.scaleY})`,
        // Estimated size — enough to cover the PixiJS character sprites
        width: '128px',
        height: '160px',
        pointerEvents: 'auto',
        zIndex: 7,
      }}
    />
  )
})

// ─── Dialogue Character Proxy (multi-character mode) ─────────────────────

interface DialogueCharacterProxyProps {
  character: DialogueCharacter
  isSelected: boolean
}

/**
 * DialogueCharacterProxy — invisible overlay for one dialogue character.
 * Uses SelectionTransformBox for drag/resize/rotate (matching CharacterLayer.tsx).
 * Also handles hydration and visemeSpriteMap migration.
 */
const DialogueCharacterProxy = memo(function DialogueCharacterProxy({
  character,
  isSelected,
}: DialogueCharacterProxyProps) {
  const targetRef = useRef<HTMLDivElement>(null)

  const selectDialogueCharacter = useMultiCharacterStore((s) => s.selectDialogueCharacter)
  const removeDialogueCharacter = useMultiCharacterStore((s) => s.removeDialogueCharacter)
  const updateDialogueCharacter = useMultiCharacterStore((s) => s.updateDialogueCharacter)
  const selectSavedCharacter = useSavedCharactersStore((s) => s.selectCharacter)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)
  const { recordIfEnabled } = useKeyframeRecorder()

  // Get the saved character for hydration
  const savedCharacter: SavedCharacter | undefined = useSavedCharactersStore(
    (s) => s.characters.find((c) => c.id === character.savedCharacterId)
  )

  // ── Hydration: if saved character exists but hasn't been hydrated from IndexedDB yet ──
  useEffect(() => {
    if (savedCharacter && !savedCharacter._hydrated && character.savedCharacterId) {
      useSavedCharactersStore.getState().hydrateCharacter(character.savedCharacterId).catch(() => {})
    }
  }, [savedCharacter?._hydrated, character.savedCharacterId])

  // ── Lazy migration: build visemeSpriteMap for characters that don't have one yet ──
  useEffect(() => {
    if (!savedCharacter?._hydrated || savedCharacter.visemeSpriteMap) return

    const hasCurved = Object.values(savedCharacter.curvedVisemes).some(v => v !== null)
    if (hasCurved) {
      import('@/services/visemeMapper').then(({ buildVisemeSpriteMapFromCurved }) => {
        const map = buildVisemeSpriteMapFromCurved(savedCharacter.curvedVisemes)
        const { updateCharacter, persistImages } = useSavedCharactersStore.getState()
        updateCharacter(savedCharacter.id, { visemeSpriteMap: map })
        persistImages(savedCharacter.id).catch(() => {})
      }).catch(() => {})
      return
    }

    const visemeSprites = savedCharacter.bodyParts?.viseme || []
    const visemeLabels = savedCharacter.spriteLabels?.viseme || {}
    if (visemeSprites.length > 1 && Object.keys(visemeLabels).length > 0) {
      import('@/services/visemeMapper').then(({ buildVisemeSpriteMap }) => {
        const entries = visemeSprites.map((src: string, i: number) => ({
          key: visemeLabels[i] || `sprite_${i}`,
          src,
        }))
        buildVisemeSpriteMap(entries, { useGemini: false }).then((map) => {
          const hasAny = Object.values(map).some(v => v !== null)
          if (hasAny) {
            const { updateCharacter, persistImages } = useSavedCharactersStore.getState()
            updateCharacter(savedCharacter.id, { visemeSpriteMap: map })
            persistImages(savedCharacter.id).catch(() => {})
          }
        }).catch(() => {})
      }).catch(() => {})
    }
  }, [savedCharacter?._hydrated, savedCharacter?.id, savedCharacter?.visemeSpriteMap, savedCharacter?.curvedVisemes, savedCharacter?.bodyParts, savedCharacter?.spriteLabels])

  // ── Size and position ──
  const displayWidth = BASE_CHARACTER_SIZE * character.scale
  const displayHeight = BASE_CHARACTER_SIZE * character.scale
  const charRotation = character.rotation || 0

  // ── Sync proxy div with store values (same pattern as MoveableProxy.tsx) ──
  // Imperative style sync prevents Moveable and React from fighting over DOM styles.
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    el.style.left = `${character.position.x - displayWidth / 2}px`
    el.style.top = `${character.position.y - displayHeight / 2}px`
    el.style.width = `${displayWidth}px`
    el.style.height = `${displayHeight}px`
    el.style.transform = charRotation !== 0 ? `rotate(${charRotation}deg)` : ''
  }, [character.position.x, character.position.y, character.scale, charRotation, displayWidth, displayHeight])

  if (!character.visible) return null

  // ── Click to select ──
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      selectDialogueCharacter(character.id)
      if (character.savedCharacterId) {
        selectSavedCharacter(character.savedCharacterId)
      }
      setRightPanelTab('group-properties')
    },
    [character.id, character.savedCharacterId, selectDialogueCharacter, selectSavedCharacter, setRightPanelTab]
  )

  // ── Remove character ──
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeDialogueCharacter(character.id)
  }

  // ── Live transform (during drag/resize) ──
  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      const newScale = Math.max(0.01, values.width / BASE_CHARACTER_SIZE)
      setLiveTransform({
        type: 'media',
        id: character.id,
        x: values.left + values.width / 2,
        y: values.top + values.height / 2,
        rotation: Math.round(values.rotation),
        scale: newScale,
      })
    },
    [character.id, setLiveTransform]
  )

  // ── Commit transform ──
  const handleTransformEnd = useCallback(
    () => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || 0
      const finalTop = parseFloat(el.style.top) || 0
      const finalWidth = el.offsetWidth
      const newScale = Math.max(0.01, finalWidth / BASE_CHARACTER_SIZE)

      const transformStr = el.style.transform || ''
      const rotateMatch = transformStr.match(/rotate\(([^)]+)deg\)/)
      const newRotation = rotateMatch ? Math.round(parseFloat(rotateMatch[1])) : (character.rotation || 0)

      const centerX = Math.round(finalLeft + finalWidth / 2)
      const centerY = Math.round(finalTop + el.offsetHeight / 2)

      updateDialogueCharacter(character.id, {
        position: { x: centerX, y: centerY },
        scale: newScale,
        rotation: newRotation,
      })

      recordIfEnabled(
        { objectType: 'dialogueCharacter', objectId: character.id },
        { 'position.x': centerX, 'position.y': centerY, scale: newScale, rotation: newRotation },
        { 'position.x': character.position.x, 'position.y': character.position.y, scale: character.scale, rotation: character.rotation || 0 }
      )
    },
    [character.id, character.position.x, character.position.y, character.scale, character.rotation, updateDialogueCharacter, clearLiveTransform, recordIfEnabled]
  )

  return (
    <>
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          left: character.position.x - displayWidth / 2,
          top: character.position.y - displayHeight / 2,
          width: displayWidth,
          height: displayHeight,
          // z-index 7 matches DOM character layer order, + character stacking
          zIndex: 7 + character.zIndex,
          cursor: character.locked ? 'default' : 'move',
          transform: charRotation !== 0 ? `rotate(${charRotation}deg)` : undefined,
          opacity: 0, // Invisible — only used as Moveable target
          pointerEvents: 'auto',
        }}
        onClick={handleClick}
      >
        {/* Remove button (visible when selected) */}
        {isSelected && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg z-10"
            style={{ opacity: 1 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Moveable control box — only shown when selected */}
      {isSelected && !character.locked && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio={true}
          color="#4a7eff"
        />
      )}
    </>
  )
})

// ─── Container Component ─────────────────────────────────────────────────

/**
 * CharacterMoveableProxies — renders either SingleCharacterProxy or
 * DialogueCharacterProxy instances depending on mode.
 * Used when PixiJS renderer is active — characters are rendered on the GPU canvas,
 * but these invisible proxies provide selection + transform interaction.
 */
export const CharacterMoveableProxies = memo(function CharacterMoveableProxies() {
  const multiCharacters = useMultiCharacterStore((s) => s.characters)
  const activeDialogueCharId = useMultiCharacterStore((s) => s.activeCharacterId)
  const isMultiCharacterMode = multiCharacters.length > 0

  if (isMultiCharacterMode) {
    return (
      <>
        {multiCharacters.map((dChar) => (
          <DialogueCharacterProxy
            key={dChar.id}
            character={dChar}
            isSelected={activeDialogueCharId === dChar.id}
          />
        ))}
      </>
    )
  }

  return <SingleCharacterProxy />
})
