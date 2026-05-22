import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, Square, Box, Grid3x3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'
import { TAB_GROUPS } from '@/constants/tabGroups'
import type { TabGroupId, LeftPanelTab } from '@/types'
import type { CharacterMode } from '@/types/nodeCanvas'
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
  Fingerprint,
  Shirt,
  LayoutGrid,
  ScanFace,
  Clapperboard,
  FileVideo,
  Presentation,
  Wand2,
  Music,
  Users,
  PenTool,
  Smile,
  Layers,
  ImagePlus,
  Film,
  AudioLines,
  Wand,
  FileText,
  GitBranch,
  Activity,
  Gauge,
  Share2,
  Download,
  Grid3X3 as Grid3x3Icon,
  Package,
} from 'lucide-react'

const GROUP_COLORS: Record<TabGroupId, string> = {
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
  Fingerprint,
  Shirt,
  LayoutGrid,
  ScanFace,
  Clapperboard,
  FileVideo,
  Presentation,
  Wand2,
  Music,
  Users,
  PenTool,
  Smile,
  Layers,
  ImagePlus,
  Film,
  AudioLines,
  Wand,
  FileText,
  Mic,
  GitBranch,
  Activity,
  Gauge,
  Share2,
  Download,
  Grid3x3: Grid3x3Icon,
}

/** Tabs to exclude from the spotlight */
const EXCLUDED_TABS = new Set<string>(['rig-editor', 'rig-editor-3d'])

interface SpotlightItem {
  tabId: LeftPanelTab
  groupId: TabGroupId
  label: string
  description?: string
  icon?: string
  /** For character sub-items */
  characterMode?: CharacterMode
  /** Unique key for dedup (tabId alone isn't unique for character sub-items) */
  key: string
}

function buildItems(): SpotlightItem[] {
  const items: SpotlightItem[] = []
  for (const group of TAB_GROUPS) {
    if (group.subTabs.length === 0 && !EXCLUDED_TABS.has(group.id)) {
      items.push({
        tabId: group.id as LeftPanelTab,
        groupId: group.id,
        label: group.label,
        key: group.id,
      })
    }
    for (const sub of group.subTabs) {
      if (EXCLUDED_TABS.has(sub.id)) continue
      // Split "Characters" into 2D/3D/1D
      if (sub.id === 'character') {
        items.push({
          tabId: 'character',
          groupId: group.id,
          label: '2D Characters',
          description: 'Sprite-based characters with lip sync',
          characterMode: '2d',
          key: 'character-2d',
        })
        items.push({
          tabId: 'character',
          groupId: group.id,
          label: '3D Characters',
          description: 'GLB/FBX 3D rigged characters',
          characterMode: '3d',
          key: 'character-3d',
        })
        items.push({
          tabId: 'character',
          groupId: group.id,
          label: '1D Characters',
          description: 'AI pixel-art characters',
          characterMode: '1d',
          key: 'character-1d',
        })
        continue
      }
      items.push({
        tabId: sub.id,
        groupId: group.id,
        label: sub.label,
        description: sub.description,
        icon: sub.icon,
        key: sub.id,
      })
    }
  }
  return items
}

const ALL_ITEMS = buildItems()

const CHARACTER_ICONS: Record<string, LucideIcon> = {
  '2d': Square,
  '3d': Box,
  '1d': Grid3x3,
}

export function Spotlight() {
  const spotlightOpen = useNodeCanvasStore((s) => s.spotlightOpen)
  const spotlightPosition = useNodeCanvasStore((s) => s.spotlightPosition)
  const closeSpotlight = useNodeCanvasStore((s) => s.closeSpotlight)
  const addNode = useNodeCanvasStore((s) => s.addNode)
  const addConnection = useNodeCanvasStore((s) => s.addConnection)
  const pendingConnectionFromNodeId = useNodeCanvasStore((s) => s.pendingConnectionFromNodeId)
  const nodes = useNodeCanvasStore((s) => s.nodes)
  const pan = useNodeCanvasStore((s) => s.pan)
  const zoom = useNodeCanvasStore((s) => s.zoom)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ITEMS
    const q = query.toLowerCase()
    return ALL_ITEMS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q),
    )
  }, [query])

  // Group filtered items
  const grouped = useMemo(() => {
    const groups: { groupId: TabGroupId; label: string; items: SpotlightItem[] }[] = []
    const seen = new Set<TabGroupId>()
    for (const item of filtered) {
      if (!seen.has(item.groupId)) {
        seen.add(item.groupId)
        const group = TAB_GROUPS.find((g) => g.id === item.groupId)
        groups.push({
          groupId: item.groupId,
          label: group?.label ?? item.groupId,
          items: [],
        })
      }
      groups.find((g) => g.groupId === item.groupId)!.items.push(item)
    }
    return groups
  }, [filtered])

  // Reset on open
  useEffect(() => {
    if (spotlightOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [spotlightOpen])

  // Close on outside click
  useEffect(() => {
    if (!spotlightOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSpotlight()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [spotlightOpen, closeSpotlight])

  const selectItem = useCallback(
    (item: SpotlightItem) => {
      // Check if a node with this tabId+characterMode already exists
      const existing = nodes.find(
        (n) => n.tabId === item.tabId && (item.characterMode ? n.characterMode === item.characterMode : true),
      )
      const canvasX = (spotlightPosition.x - pan.x) / zoom
      const canvasY = (spotlightPosition.y - pan.y) / zoom

      let targetNodeId: string | null = existing?.id ?? null
      if (!existing) {
        targetNodeId = addNode(item.tabId, { x: canvasX, y: canvasY }, item.characterMode)
      }

      // Auto-connect if this Spotlight was opened from a connection drag
      if (pendingConnectionFromNodeId && targetNodeId) {
        addConnection(pendingConnectionFromNodeId, targetNodeId)
      }

      closeSpotlight()
    },
    [addNode, addConnection, closeSpotlight, spotlightPosition, nodes, pan, zoom, pendingConnectionFromNodeId],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSpotlight()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[activeIndex]) selectItem(filtered[activeIndex])
        return
      }
    },
    [closeSpotlight, filtered, activeIndex, selectItem],
  )

  if (!spotlightOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] w-[280px] bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      style={{
        left: spotlightPosition.x,
        top: spotlightPosition.y,
        maxHeight: 400,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <Search size={14} className="text-zinc-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
          }}
          placeholder={pendingConnectionFromNodeId ? 'Connect to...' : 'Add tool...'}
          className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
        />
      </div>

      {/* Results */}
      <div className="overflow-y-auto max-h-[340px] py-1.5">
        {grouped.length === 0 && <div className="px-3 py-4 text-center text-xs text-zinc-600">No tools found</div>}
        {grouped.map((group) => {
          const color = GROUP_COLORS[group.groupId]
          const GIcon = GROUP_ICONS[group.groupId]
          return (
            <div key={group.groupId}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-3 py-1.5 mt-1 first:mt-0">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{group.label}</span>
              </div>
              {/* Items */}
              {group.items.map((item) => {
                const flatIndex = filtered.indexOf(item)
                const isActive = flatIndex === activeIndex
                const Icon = item.characterMode
                  ? (CHARACTER_ICONS[item.characterMode] ?? GIcon ?? Sparkles)
                  : item.icon
                    ? (ICON_MAP[item.icon] ?? GIcon ?? Sparkles)
                    : (GIcon ?? Sparkles)
                const alreadyExists = nodes.some(
                  (n) => n.tabId === item.tabId && (item.characterMode ? n.characterMode === item.characterMode : true),
                )
                return (
                  <button
                    key={item.key}
                    onClick={() => selectItem(item)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                      isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]',
                      alreadyExists && 'opacity-40',
                    )}
                  >
                    <Icon size={14} style={{ color }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-zinc-200 truncate">{item.label}</div>
                      {item.description && <div className="text-[10px] text-zinc-600 truncate">{item.description}</div>}
                    </div>
                    {alreadyExists && <span className="text-[9px] text-zinc-600">Added</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
