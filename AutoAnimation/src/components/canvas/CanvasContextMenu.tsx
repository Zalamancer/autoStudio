/**
 * CanvasContextMenu
 *
 * Custom right-click context menu for the canvas area.
 * Shows contextual actions based on what's selected (copy, paste, duplicate, delete, etc.)
 */

import { useEffect, useRef, useCallback, memo } from 'react'
import { Clipboard, Trash2, CopyPlus, Eye, EyeOff, RotateCcw, FlipHorizontal, Copy, Download } from 'lucide-react'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useAnimationStore } from '@/stores/useAnimationStore'

interface MenuItem {
  label: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  shortcut?: string
  action: () => void
  danger?: boolean
  separator?: boolean
  disabled?: boolean
}

interface CanvasContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

export const CanvasContextMenu = memo(function CanvasContextMenu({ x, y, onClose }: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Get selected elements from each store
  const selectedTextId = useTextOverlayStore((s) => s.selectedId)
  const textOverlays = useTextOverlayStore((s) => s.overlays)
  const selectedShapeId = useShapeStore((s) => s.selectedShapeId)
  const selectedMediaId = useMediaStore((s) => s.selectedCanvasItemId)
  const selectedCharacterId = useCanvasStore((s) => s.selectedCharacterId)
  const activeDialogueCharId = useMultiCharacterStore((s) => s.activeCharacterId)
  const selectedTemplateId = useHTMLTemplateLayerStore((s) => s.selectedTemplateId)
  const selectedAnimationId = useAnimationStore((s) => s.selectedActiveId)

  // Close on click outside or escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Delay to avoid immediately closing from the contextmenu event
    requestAnimationFrame(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    })
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Keep menu within viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const el = menuRef.current
    if (rect.right > window.innerWidth) {
      el.style.left = `${x - rect.width}px`
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${y - rect.height}px`
    }
  }, [x, y])

  const handleAction = useCallback(
    (action: () => void) => {
      action()
      onClose()
    },
    [onClose],
  )

  // Determine which element is selected (priority order)
  const selectedType = selectedTextId
    ? 'text'
    : selectedShapeId
      ? 'shape'
      : selectedMediaId
        ? 'media'
        : selectedCharacterId
          ? 'character'
          : activeDialogueCharId
            ? 'dialogue-character'
            : selectedTemplateId
              ? 'template'
              : selectedAnimationId
                ? 'animation'
                : null

  // Build menu items based on what's selected
  const items: MenuItem[] = []

  if (selectedType === 'text' && selectedTextId) {
    const overlay = textOverlays.find((o) => o.id === selectedTextId)
    items.push(
      {
        label: 'Duplicate',
        icon: CopyPlus,
        shortcut: 'Ctrl+D',
        action: () => useTextOverlayStore.getState().duplicateOverlay(selectedTextId),
      },
      {
        label: 'Delete',
        icon: Trash2,
        shortcut: 'Del',
        action: () => useTextOverlayStore.getState().removeOverlay(selectedTextId),
        danger: true,
      },
      { label: '', action: () => {}, separator: true },
      {
        label: overlay?.visible === false ? 'Show' : 'Hide',
        icon: overlay?.visible === false ? Eye : EyeOff,
        action: () => useTextOverlayStore.getState().toggleVisibility(selectedTextId),
      },
    )
  } else if (selectedType === 'shape' && selectedShapeId) {
    items.push(
      {
        label: 'Duplicate',
        icon: CopyPlus,
        shortcut: 'Ctrl+D',
        action: () => useShapeStore.getState().duplicateShape(selectedShapeId),
      },
      {
        label: 'Delete',
        icon: Trash2,
        shortcut: 'Del',
        action: () => useShapeStore.getState().removeShape(selectedShapeId),
        danger: true,
      },
    )
  } else if (selectedType === 'media' && selectedMediaId) {
    const store = useMediaStore.getState()
    const canvasItem = store.canvasItems.find((c) => c.id === selectedMediaId)
    const mediaAsset = canvasItem ? store.assets.find((a) => a.id === canvasItem.assetId) : null
    const mediaUrl = mediaAsset?.url
    if (mediaUrl) {
      items.push(
        {
          label: 'Copy Image',
          icon: Copy,
          action: async () => {
            try {
              const res = await fetch(mediaUrl)
              const blob = await res.blob()
              await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
            } catch {
              // Fallback: copy URL as text
              navigator.clipboard.writeText(mediaUrl)
            }
          },
        },
        {
          label: 'Download Image',
          icon: Download,
          action: () => {
            const a = document.createElement('a')
            a.href = mediaUrl
            a.download = mediaAsset?.name || 'image'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          },
        },
        { label: '', action: () => {}, separator: true },
      )
    }
    items.push({
      label: 'Remove from Canvas',
      icon: Trash2,
      action: () => useMediaStore.getState().removeFromCanvas(selectedMediaId),
      danger: true,
    })
  } else if (selectedType === 'character' && selectedCharacterId) {
    const parts = useCharacterPartsStore.getState()
    const groupVisible = parts.parts.group?.visible !== false
    items.push(
      {
        label: groupVisible ? 'Hide Character' : 'Show Character',
        icon: groupVisible ? EyeOff : Eye,
        action: () => {
          useCharacterPartsStore.getState().updateTransform('group', { visible: !groupVisible })
        },
      },
      {
        label: 'Flip Horizontal',
        icon: FlipHorizontal,
        action: () => {
          const g = useCharacterPartsStore.getState().parts.group
          useCharacterPartsStore.getState().updateTransform('group', { scaleX: (g?.scale?.x ?? 1) * -1 })
        },
      },
      {
        label: 'Reset Position',
        icon: RotateCcw,
        action: () => {
          useCharacterPartsStore
            .getState()
            .updateTransform('group', { x: 960, y: 540, scaleX: 1, scaleY: 1, rotation: 0 })
        },
      },
    )
  } else if (selectedType === 'dialogue-character' && activeDialogueCharId) {
    items.push(
      {
        label: 'Duplicate Character',
        icon: CopyPlus,
        action: () => {
          const store = useMultiCharacterStore.getState()
          const char = store.characters.find((c) => c.id === activeDialogueCharId)
          if (char) {
            const { id: _id, ...rest } = char
            store.addDialogueCharacter({ ...rest, position: { x: char.position.x + 50, y: char.position.y + 50 } })
          }
        },
      },
      {
        label: 'Remove Character',
        icon: Trash2,
        action: () => useMultiCharacterStore.getState().removeDialogueCharacter(activeDialogueCharId),
        danger: true,
      },
    )
  } else if (selectedType === 'template' && selectedTemplateId) {
    items.push({
      label: 'Remove Template',
      icon: Trash2,
      action: () => useHTMLTemplateLayerStore.getState().removeTemplate(selectedTemplateId),
      danger: true,
    })
  } else if (selectedType === 'animation' && selectedAnimationId) {
    items.push({
      label: 'Remove Animation',
      icon: Trash2,
      action: () => useAnimationStore.getState().removeFromCanvas(selectedAnimationId),
      danger: true,
    })
  } else {
    // No selection — show general canvas actions
    items.push(
      { label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V', action: () => {}, disabled: true },
      { label: '', action: () => {}, separator: true },
      { label: 'Reset View', icon: RotateCcw, action: () => useCanvasStore.getState().resetCanvasView() },
    )
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] py-1 rounded-lg shadow-2xl border border-zinc-700/60 overflow-hidden"
      style={{
        left: x,
        top: y,
        backgroundColor: 'var(--color-surface-low)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="h-px mx-2 my-1 bg-zinc-700/40" />
        }
        const Icon = item.icon
        return (
          <button
            key={i}
            disabled={item.disabled}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors ${
              item.disabled
                ? 'text-zinc-600 cursor-default'
                : item.danger
                  ? 'text-red-400 hover:bg-red-500/15'
                  : 'text-zinc-200 hover:bg-zinc-700/50'
            }`}
            onClick={() => !item.disabled && handleAction(item.action)}
          >
            {Icon && (
              <Icon
                size={14}
                className={item.disabled ? 'text-zinc-600' : item.danger ? 'text-red-400' : 'text-zinc-400'}
              />
            )}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-zinc-500 font-mono">{item.shortcut}</span>}
          </button>
        )
      })}
    </div>
  )
})
