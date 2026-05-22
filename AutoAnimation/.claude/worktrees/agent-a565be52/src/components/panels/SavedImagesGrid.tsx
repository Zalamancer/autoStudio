import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Pencil, Check, Tag, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCharacterConfigStore, useCharacterPartsStore, type CharacterPartTab } from '@/stores'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'

export interface AssetDetailInfo {
  tab: CharacterPartTab
  index: number
  image: string
  label: string
  anchorY: number
}

interface SavedImagesGridProps {
  tab: CharacterPartTab
  label: string
  onAssetDetailOpen?: (info: AssetDetailInfo) => void
  openDetailIndex?: number | null
}

export function SavedImagesGrid({
  tab,
  label,
  onAssetDetailOpen,
  openDetailIndex,
}: SavedImagesGridProps) {
  const { savedImages, removeSavedImage, spriteLabels, setSpriteLabel, customTags, addCustomTag, removeCustomTag } = useCharacterConfigStore()
  const { selectedSprites, setSelectedSprite } = useCharacterPartsStore()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isBulkRenaming, setIsBulkRenaming] = useState(false)
  const [bulkNames, setBulkNames] = useState('')
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false)
  const [newTagValue, setNewTagValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const images = savedImages[tab]
  const selectedIndex = selectedSprites[tab]
  const labels = spriteLabels[tab]

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingIndex])

  useEffect(() => {
    if (isBulkRenaming && bulkInputRef.current) {
      bulkInputRef.current.focus()
    }
  }, [isBulkRenaming])

  useEffect(() => {
    if (isTagEditorOpen && tagInputRef.current) {
      tagInputRef.current.focus()
    }
  }, [isTagEditorOpen])

  const handleStartBulkRename = useCallback(() => {
    // Pre-fill with existing names
    const existingNames = images.map((_, i) => labels[i] || '').join(', ')
    setBulkNames(existingNames)
    setIsBulkRenaming(true)
  }, [images, labels])

  const handleApplyBulkRename = useCallback(() => {
    const names = bulkNames.split(',').map((n) => n.trim())
    names.forEach((name, i) => {
      if (i < images.length) {
        setSpriteLabel(tab, i, name)
      }
    })
    setIsBulkRenaming(false)
    setBulkNames('')
  }, [bulkNames, images.length, tab, setSpriteLabel])

  const handleAddTag = useCallback(() => {
    const trimmed = newTagValue.trim()
    if (trimmed) {
      addCustomTag(tab, trimmed)
      setNewTagValue('')
    }
  }, [newTagValue, tab, addCustomTag])

  const tabTags = customTags[tab]

  if (images.length === 0) {
    return null
  }

  const handleSelect = (index: number) => {
    // Toggle selection - if already selected, deselect
    const newIndex = selectedIndex === index ? null : index
    setSelectedSprite(tab, newIndex)

    // Also update the active character's default sprite + all dialogue line overrides
    // so the canvas immediately reflects the change
    const overridePart = tab as string

    // Helper: sync selection + only this tab's images to a saved character
    const syncToSavedCharacter = (savedCharId: string) => {
      const { updateCharacter, persistImages } = useSavedCharactersStore.getState()
      const savedChar = useSavedCharactersStore.getState().characters.find((c) => c.id === savedCharId)
      if (!savedChar) return
      const tabImages = useCharacterConfigStore.getState().savedImages[tab] || []
      updateCharacter(savedChar.id, {
        selectedSprites: {
          ...savedChar.selectedSprites,
          [tab]: newIndex,
        } as Record<CharacterPartTab, number | null>,
        bodyParts: {
          ...savedChar.bodyParts,
          [tab]: tabImages,
        } as Record<CharacterPartTab, string[]>,
      })
      persistImages(savedChar.id).catch(() => {})
    }

    const { activeCharacterId, characters, dialogueLines, updateDialogueCharacter, updateDialogueLine } = useMultiCharacterStore.getState()
    if (activeCharacterId) {
      // Update character-level default (applies when playhead is outside any dialogue line)
      const char = characters.find((c) => c.id === activeCharacterId)
      updateDialogueCharacter(activeCharacterId, {
        defaultSpriteOverrides: {
          ...char?.defaultSpriteOverrides,
          [overridePart]: newIndex ?? 0,
        },
      })

      // Update all dialogue lines for this character too
      const charLines = dialogueLines.filter((l) => l.characterId === activeCharacterId)
      for (const line of charLines) {
        updateDialogueLine(line.id, {
          spriteOverrides: {
            ...line.spriteOverrides,
            [overridePart]: newIndex ?? 0,
          },
        })
      }

      // Sync to saved character (CharacterLayer reads from savedCharacter.bodyParts)
      if (char?.savedCharacterId) {
        syncToSavedCharacter(char.savedCharacterId)
      }
    } else {
      // No active dialogue character — sync directly to the selected saved character
      const { selectedCharacterId } = useSavedCharactersStore.getState()
      if (selectedCharacterId) {
        syncToSavedCharacter(selectedCharacterId)
      }
    }
  }

  const handleOpenDetail = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()

    if (!onAssetDetailOpen) return

    // Get the clicked element's position
    const element = itemRefs.current.get(index)
    if (!element) return

    const rect = element.getBoundingClientRect()
    const anchorY = rect.top + rect.height / 2

    onAssetDetailOpen({
      tab,
      index,
      image: images[index],
      label: labels[index] || '',
      anchorY,
    })
  }

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()

    // If removing the selected sprite, clear selection
    if (selectedIndex === index) {
      setSelectedSprite(tab, null)
    } else if (selectedIndex !== null && index < selectedIndex) {
      // Adjust selection index if removing an item before it
      setSelectedSprite(tab, selectedIndex - 1)
    }

    removeSavedImage(tab, index)
  }

  const handleStartEdit = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setEditingIndex(index)
    setEditValue(labels[index] || '')
  }

  const handleSaveLabel = () => {
    if (editingIndex !== null) {
      setSpriteLabel(tab, editingIndex, editValue)
      setEditingIndex(null)
      setEditValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveLabel()
    } else if (e.key === 'Escape') {
      setEditingIndex(null)
      setEditValue('')
    }
  }

  const getSpriteDisplayName = (index: number): string => {
    return labels[index] || `${label} ${index + 1}`
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">
          Saved {label} ({images.length})
        </label>
        <div className="flex items-center gap-2">
          {selectedIndex !== null && (
            <span className="text-xs text-green-400">
              {labels[selectedIndex] || `#${selectedIndex + 1}`} active
            </span>
          )}
          <button
            onClick={() => setIsTagEditorOpen(!isTagEditorOpen)}
            className={cn(
              'text-xs flex items-center gap-1 transition-colors',
              isTagEditorOpen ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
            )}
            title="Manage quick tags"
          >
            <Plus size={10} />
            Tags
          </button>
          <button
            onClick={handleStartBulkRename}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            title="Bulk rename sprites"
          >
            <Tag size={10} />
            Rename
          </button>
        </div>
      </div>

      {/* Bulk rename input */}
      {isBulkRenaming && (
        <div className="space-y-1.5 p-2 bg-zinc-800/80 rounded-lg border border-zinc-700">
          <input
            ref={bulkInputRef}
            type="text"
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyBulkRename()
              if (e.key === 'Escape') setIsBulkRenaming(false)
            }}
            placeholder="Name1, Name2, Name3..."
            className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-green-500 focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">{images.length} sprites — comma separated</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsBulkRenaming(false)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkRename}
                className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-0.5"
              >
                <Check size={10} />
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom tag editor */}
      {isTagEditorOpen && (
        <div className="space-y-1.5 p-2 bg-zinc-800/80 rounded-lg border border-zinc-700">
          <div className="flex flex-wrap gap-1">
            {tabTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-700 rounded text-[10px] text-zinc-300"
              >
                {tag}
                <button
                  onClick={() => removeCustomTag(tab, tag)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X size={8} />
                </button>
              </span>
            ))}
            {tabTags.length === 0 && (
              <span className="text-[10px] text-zinc-500 italic">No tags yet</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <input
              ref={tagInputRef}
              type="text"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag()
                if (e.key === 'Escape') setIsTagEditorOpen(false)
              }}
              placeholder="Add tag..."
              className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-green-500 focus:outline-none min-w-0"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTagValue.trim()}
              className="px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded text-[10px] text-white transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1">
        {images.map((imgSrc: string, index: number) => (
          <div
            key={index}
            ref={(el) => {
              if (el) itemRefs.current.set(index, el)
              else itemRefs.current.delete(index)
            }}
            data-asset-item
            onClick={(e) => {
              handleSelect(index)
              handleOpenDetail(e, index)
            }}
            className={cn(
              'relative aspect-square bg-zinc-800 rounded border overflow-hidden cursor-pointer transition-all group',
              selectedIndex === index
                ? 'border-green-500 ring-2 ring-green-500/30'
                : 'border-zinc-700 hover:border-green-500/50',
              openDetailIndex === index && 'ring-2 ring-green-400'
            )}
          >
            <img
              src={imgSrc}
              alt={getSpriteDisplayName(index)}
              className="w-full h-full object-contain"
            />

            {/* Selected indicator */}
            {selectedIndex === index && (
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">✓</span>
              </div>
            )}

            {/* Label badge - shown at bottom */}
            {editingIndex === index ? (
              <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 p-1 flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveLabel}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter name..."
                  className="flex-1 text-[10px] bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-zinc-200 focus:border-green-500 focus:outline-none min-w-0"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveLabel()
                  }}
                  className="w-4 h-4 bg-green-500 rounded flex items-center justify-center text-white hover:bg-green-600"
                >
                  <Check size={10} />
                </button>
              </div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-sm px-1 py-0.5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-300 truncate flex-1">
                  {labels[index] || (
                    <span className="text-zinc-500 italic">#{index + 1}</span>
                  )}
                </span>
                <button
                  onClick={(e) => handleStartEdit(e, index)}
                  className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil size={10} />
                </button>
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={(e) => handleRemove(e, index)}
              className="absolute top-0.5 right-0.5 z-20 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}
