import { useCallback, useState } from 'react'
import { X, Square, Box, Grid3x3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { TAB_GROUPS } from '@/constants/tabGroups'
import type { CanvasNode } from '@/types/nodeCanvas'
import type { TabGroupId } from '@/types'
import type { LucideIcon } from 'lucide-react'
import {
  Sparkles,
  Image,
  Palette,
  Send,
  Type,
  Subtitles,
  ArrowRightLeft,
  Pen,
  Camera,
  Paintbrush,
  Component,
  ScrollText,
  MessageCircle,
  Calendar,
  Library,
  TrendingUp,
  Flame,
  Copy,
  Database,
  Mic,
  Film,
  Wand2,
  Package,
  Clapperboard,
} from 'lucide-react'

export const GROUP_COLORS: Record<TabGroupId, string> = {
  'ai-director': '#f59e0b',
  character: '#a855f7',
  media: '#3b82f6',
  audio: '#ec4899',
  edit: '#8b5cf6',
  script: '#06b6d4',
  design: '#22c55e',
  publish: '#f97316',
  marketplace: '#a78bfa',
  // apps: '#14b8a6',
}

const GROUP_ICONS: Record<TabGroupId, LucideIcon> = {
  'ai-director': Clapperboard,
  character: Sparkles,
  media: Image,
  audio: Mic,
  edit: Wand2,
  script: ScrollText,
  design: Palette,
  publish: Send,
  marketplace: Package,
  // apps: LayoutGrid,
}

const ICON_MAP: Record<string, LucideIcon> = {
  Type,
  Subtitles,
  ArrowRightLeft,
  Sparkles,
  Pen,
  Camera,
  Paintbrush,
  Component,
  Palette,
  Calendar,
  Library,
  TrendingUp,
  Flame,
  Copy,
  ScrollText,
  MessageCircle,
  Database,
}

const CHARACTER_MODE_ICONS: Record<string, LucideIcon> = {
  '2d': Square,
  '3d': Box,
  '1d': Grid3x3,
}

const CHARACTER_MODE_LABELS: Record<string, string> = {
  '2d': '2D Characters',
  '3d': '3D Characters',
  '1d': '1D Characters',
}

function getNodeLabel(node: CanvasNode): string {
  // Character nodes use mode-specific labels
  if (node.tabId === 'character' && node.characterMode) {
    return CHARACTER_MODE_LABELS[node.characterMode] ?? 'Characters'
  }
  for (const group of TAB_GROUPS) {
    const sub = group.subTabs.find((s) => s.id === node.tabId)
    if (sub) return sub.label
    if (group.id === node.tabId) return group.label
  }
  return node.tabId
}

function getNodeDescription(node: CanvasNode): string | undefined {
  if (node.tabId === 'character' && node.characterMode) {
    const descs: Record<string, string> = {
      '2d': 'Sprite-based characters with lip sync',
      '3d': 'GLB/FBX 3D rigged characters',
      '1d': 'AI pixel-art characters',
    }
    return descs[node.characterMode]
  }
  for (const group of TAB_GROUPS) {
    const sub = group.subTabs.find((s) => s.id === node.tabId)
    if (sub) return sub.description
  }
  return undefined
}

function getNodeIcon(node: CanvasNode): LucideIcon {
  if (node.tabId === 'character' && node.characterMode) {
    return CHARACTER_MODE_ICONS[node.characterMode] ?? Sparkles
  }
  for (const group of TAB_GROUPS) {
    const sub = group.subTabs.find((s) => s.id === node.tabId)
    if (sub?.icon && ICON_MAP[sub.icon]) return ICON_MAP[sub.icon]
  }
  return GROUP_ICONS[node.groupId] ?? Sparkles
}

/** Card dimensions exported for connection layer + hit testing */
export const CARD_W = 200
export const CARD_H = 100

interface NodeCardProps {
  node: CanvasNode
  zoom: number
  onStartDrag: (nodeId: string, e: React.MouseEvent) => void
  onStartConnection: (nodeId: string, e: React.MouseEvent) => void
}

export function NodeCard({ node, zoom, onStartDrag, onStartConnection }: NodeCardProps) {
  const selectedNodeId = useNodeCanvasStore((s) => s.selectedNodeId)
  const focusedNodeId = useNodeCanvasStore((s) => s.focusedNodeId)
  const focusNode = useNodeCanvasStore((s) => s.focusNode)
  const removeNode = useNodeCanvasStore((s) => s.removeNode)
  const [hovered, setHovered] = useState(false)

  // Get character thumbnail for character nodes
  const bodySprites = useCharacterConfigStore((s) => s.savedImages.body)
  const isCharacterNode = node.tabId === 'character'
  const thumbnail = isCharacterNode && bodySprites.length > 0 ? bodySprites[0] : null

  const isSelected = selectedNodeId === node.id
  const isFocused = focusedNodeId === node.id
  const color = GROUP_COLORS[node.groupId] ?? '#64748b'
  const label = getNodeLabel(node)
  const description = getNodeDescription(node)
  const Icon = getNodeIcon(node)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      focusNode(node.id)
    },
    [focusNode, node.id],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.stopPropagation()
      onStartDrag(node.id, e)
    },
    [onStartDrag, node.id],
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      removeNode(node.id)
    },
    [removeNode, node.id],
  )

  const handlePortMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onStartConnection(node.id, e)
    },
    [onStartConnection, node.id],
  )

  return (
    <div
      className="absolute select-none"
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'top left',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          'relative flex flex-col rounded-2xl cursor-pointer transition-all duration-200',
          'bg-zinc-900/80 backdrop-blur-xl border overflow-hidden',
          isFocused ? 'shadow-lg' : isSelected ? 'shadow-md' : 'shadow-sm hover:shadow-md',
        )}
        style={{
          width: CARD_W,
          minHeight: CARD_H,
          borderColor: isFocused ? color : isSelected ? `${color}80` : 'rgba(255,255,255,0.06)',
          boxShadow: isFocused ? `0 0 20px ${color}30` : undefined,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: color }} />

        {/* Card content */}
        <div className="flex items-start gap-3 px-3 py-2.5">
          {/* Icon or thumbnail */}
          {thumbnail ? (
            <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-800/80 border border-white/[0.06] overflow-hidden flex items-center justify-center">
              <img src={thumbnail} alt={label} className="w-full h-full object-contain" draggable={false} />
            </div>
          ) : (
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="text-[13px] font-medium text-zinc-200 truncate leading-tight">{label}</div>
            {description && (
              <div className="text-[10px] text-zinc-500 mt-1 leading-snug line-clamp-2">{description}</div>
            )}
          </div>
        </div>

        {/* Remove button */}
        {hovered && (
          <button
            onClick={handleRemove}
            className="absolute top-2.5 right-2 p-0.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
          >
            <X size={12} />
          </button>
        )}

        {/* Input port (left) */}
        <div
          className={cn(
            'absolute -left-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 bg-zinc-900 transition-opacity duration-200 cursor-crosshair',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
          style={{ borderColor: color }}
        />

        {/* Output port (right) */}
        <div
          className={cn(
            'absolute -right-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 bg-zinc-900 transition-opacity duration-200 cursor-crosshair',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
          style={{ borderColor: color }}
          onMouseDown={handlePortMouseDown}
        />
      </div>
    </div>
  )
}
