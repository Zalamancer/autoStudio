import { useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/stores'
import type { Character } from '@/types'

interface CharacterLayerProps {
  character: Character
  isSelected: boolean
  containerWidth: number
  containerHeight: number
}

export function CharacterLayer({
  character,
  isSelected,
  containerWidth,
  containerHeight,
}: CharacterLayerProps) {
  const { selectCharacter, removeCharacter, updateCharacterTransform } = useCanvasStore()
  const layerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, charX: 0, charY: 0 })

  const { transform, visible, locked, name } = character

  // Calculate position as percentage of container
  const left = (transform.x / containerWidth) * 100
  const top = (transform.y / containerHeight) * 100

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (locked) return

      e.stopPropagation()
      selectCharacter(character.id)

      setIsDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        charX: transform.x,
        charY: transform.y,
      }

      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [locked, character.id, transform.x, transform.y, selectCharacter]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || locked) return

      const deltaX = e.clientX - dragStart.current.x
      const deltaY = e.clientY - dragStart.current.y

      // Scale delta based on container size vs actual position
      const scaledDeltaX = deltaX * (containerWidth / (layerRef.current?.parentElement?.clientWidth || 1))
      const scaledDeltaY = deltaY * (containerHeight / (layerRef.current?.parentElement?.clientHeight || 1))

      updateCharacterTransform(character.id, {
        x: Math.round(dragStart.current.charX + scaledDeltaX),
        y: Math.round(dragStart.current.charY + scaledDeltaY),
      })
    },
    [isDragging, locked, character.id, containerWidth, containerHeight, updateCharacterTransform]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(false)
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    },
    []
  )

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeCharacter(character.id)
  }

  if (!visible) return null

  return (
    <div
      ref={layerRef}
      className={cn(
        'absolute cursor-move transition-shadow',
        isSelected && 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-900',
        locked && 'cursor-not-allowed opacity-75'
      )}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Character Placeholder */}
      <div className="w-32 h-40 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-lg flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-zinc-500 rounded-full mb-2" />
        <span className="text-xs text-zinc-400">{name}</span>
      </div>

      {/* Remove Button */}
      {isSelected && !locked && (
        <button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
        >
          <X size={14} />
        </button>
      )}

      {/* Resize Handles */}
      {isSelected && !locked && (
        <>
          {/* Corner handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  )
}
