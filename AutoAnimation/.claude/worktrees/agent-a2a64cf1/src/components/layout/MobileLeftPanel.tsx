import { useCallback, useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Image,
  Palette,
  Send,
  Type,
  Subtitles,
  ArrowRightLeft,
  Pen,
  Paintbrush,
  Component,
  Calendar,
  Library,
  TrendingUp,
  Flame,
  Camera,
  Copy,
  ScrollText,
  MessageCircle,
  Wand2,
  Users,
  PenTool,
  Shirt,
  Smile,
  Music,
  Activity,
  Fingerprint,
  Clapperboard,
  FileVideo,
  Presentation,
  FileText,
  Mic,
  Database,
  GitBranch,
  LayoutGrid,
  ScanFace,
  Layers,
  ImagePlus,
  Gauge,
  Film,
  AudioLines,
  Wand,
  Share2,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores'
import { PanelContent } from './LeftPanel'
import { TAB_GROUPS, CARD_GRID_THRESHOLD } from '@/constants/tabGroups'
import type { TabGroupId, SubTabDef } from '@/types'
import type { LucideIcon } from 'lucide-react'

const GROUP_ICONS: Record<TabGroupId, LucideIcon> = {
  create: Sparkles,
  media: Image,
  audio: Mic,
  edit: Wand2,
  script: ScrollText,
  design: Palette,
  publish: Send,
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
  Wand2,
  Users,
  PenTool,
  Shirt,
  Smile,
  Music,
  Activity,
  Image,
  Fingerprint,
  Clapperboard,
  FileVideo,
  Presentation,
  FileText,
  Mic,
  Database,
  GitBranch,
  LayoutGrid,
  ScanFace,
  Layers,
  ImagePlus,
  Gauge,
  Film,
  AudioLines,
  Wand,
  Share2,
  Download,
}

function MobileCardGrid({ subTabs }: { subTabs: SubTabDef[] }) {
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
      {subTabs.map((sub) => {
        const Icon = sub.icon ? ICON_MAP[sub.icon] : null
        return (
          <button
            key={sub.id}
            onClick={() => setLeftPanelActiveTab(sub.id)}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.06] group"
          >
            {Icon && (
              <div className="shrink-0 w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-green-400 group-hover:bg-green-500/10 transition-colors">
                <Icon size={18} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">
                {sub.label}
              </div>
              {sub.description && (
                <div className="text-[11px] leading-relaxed text-zinc-500 mt-0.5">{sub.description}</div>
              )}
            </div>
            <ChevronRight size={15} className="shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </button>
        )
      })}
    </div>
  )
}

function MobileDrillDownHeader({ subTabs }: { subTabs: SubTabDef[] }) {
  const activeTab = useEditorStore((s) => s.leftPanelActiveTab)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)
  const setShowGroupHome = useEditorStore((s) => s.setShowGroupHome)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentIndex = subTabs.findIndex((s) => s.id === activeTab)
  const currentSub = currentIndex >= 0 ? subTabs[currentIndex] : null
  const currentLabel = currentSub?.label ?? ''
  const CurrentIcon = currentSub?.icon ? ICON_MAP[currentSub.icon] : null

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return
    setLeftPanelActiveTab(subTabs[currentIndex - 1].id)
  }, [currentIndex, subTabs, setLeftPanelActiveTab])

  const goNext = useCallback(() => {
    if (currentIndex < 0 || currentIndex >= subTabs.length - 1) return
    setLeftPanelActiveTab(subTabs[currentIndex + 1].id)
  }, [currentIndex, subTabs, setLeftPanelActiveTab])

  return (
    <div className="shrink-0 flex items-center gap-1 px-2 py-2.5 border-b border-white/5">
      <button
        onClick={() => setShowGroupHome(true)}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Back to menu"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={goPrev}
        disabled={currentIndex <= 0}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors disabled:opacity-25 disabled:pointer-events-none"
      >
        <ChevronLeft size={16} />
      </button>

      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {CurrentIcon && <CurrentIcon size={14} className="shrink-0 text-zinc-400" />}
          <span className="truncate">{currentLabel}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl py-1.5 max-h-[320px] overflow-y-auto">
            {subTabs.map((sub, i) => {
              const Icon = sub.icon ? ICON_MAP[sub.icon] : null
              const isActive = i === currentIndex
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setLeftPanelActiveTab(sub.id)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-green-500/10 text-green-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                  )}
                >
                  {Icon && <Icon size={15} className="shrink-0" />}
                  <span className="truncate">{sub.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={goNext}
        disabled={currentIndex < 0 || currentIndex >= subTabs.length - 1}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors disabled:opacity-25 disabled:pointer-events-none"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export function MobileLeftPanel() {
  const leftPanelActiveTab = useEditorStore((s) => s.leftPanelActiveTab)
  const leftPanelActiveGroup = useEditorStore((s) => s.leftPanelActiveGroup)
  const setLeftPanelGroup = useEditorStore((s) => s.setLeftPanelGroup)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)
  const showGroupHome = useEditorStore((s) => s.showGroupHome)

  const currentGroupIndex = TAB_GROUPS.findIndex((g) => g.id === leftPanelActiveGroup)
  const currentGroup = TAB_GROUPS[currentGroupIndex] ?? TAB_GROUPS[0]
  const Icon = GROUP_ICONS[currentGroup.id]
  const isLargeGroup = currentGroup.subTabs.length > CARD_GRID_THRESHOLD
  const hasSubTabs = currentGroup.subTabs.length > 1

  const goPrev = useCallback(() => {
    const prev = (currentGroupIndex - 1 + TAB_GROUPS.length) % TAB_GROUPS.length
    setLeftPanelGroup(TAB_GROUPS[prev].id)
  }, [currentGroupIndex, setLeftPanelGroup])

  const goNext = useCallback(() => {
    const next = (currentGroupIndex + 1) % TAB_GROUPS.length
    setLeftPanelGroup(TAB_GROUPS[next].id)
  }, [currentGroupIndex, setLeftPanelGroup])

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Group-level navigation */}
      <div className="shrink-0 flex items-center border-b border-white/5">
        <button
          onClick={goPrev}
          className="shrink-0 flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2 py-2 min-w-0">
          <Icon size={16} className="shrink-0 text-green-400" />
          <span className="text-sm font-medium text-white truncate">{currentGroup.label}</span>
          <span className="text-[10px] text-zinc-500">
            {currentGroupIndex + 1}/{TAB_GROUPS.length}
          </span>
        </div>

        <button
          onClick={goNext}
          className="shrink-0 flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLargeGroup && showGroupHome ? (
        /* Card grid for large groups */
        <MobileCardGrid subTabs={currentGroup.subTabs} />
      ) : (
        <>
          {/* Drill-down header for large groups, pill bar for small groups */}
          {isLargeGroup ? (
            <MobileDrillDownHeader subTabs={currentGroup.subTabs} />
          ) : hasSubTabs ? (
            <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-none">
              {currentGroup.subTabs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setLeftPanelActiveTab(sub.id)}
                  className={cn(
                    'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap',
                    leftPanelActiveTab === sub.id
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ) : null}

          {/* Panel content */}
          <div
            className={cn(
              'flex-1 min-h-0',
              leftPanelActiveTab === 'rig-editor'
                ? 'overflow-hidden flex flex-col'
                : leftPanelActiveTab === 'rig-editor-3d'
                  ? 'overflow-y-auto flex flex-col'
                  : 'overflow-y-auto',
            )}
          >
            <PanelContent tab={leftPanelActiveTab} />
          </div>
        </>
      )}
    </div>
  )
}
