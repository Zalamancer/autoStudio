import { lazy, Suspense, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Image,
  Palette,
  Send,
  MessageCircle,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
  Square,
  Box,
  Database,
  Wand2,
  Grid3x3,
  Music,
  Activity,
  Users,
  PenTool,
  Shirt,
  Smile,
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
  UserCircle,
  Fingerprint,
  Clapperboard,
  FileVideo,
  Presentation,
  FileText,
  Mic,
  Search,
  RotateCcw,
  ArrowRightFromLine,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores'
import { CharacterGeneratorPanel, CaptionsPanel, MediaPanel, TransitionsPanel, TextPanel } from '@/components/panels'
import { ScriptsPanel as ScriptsPanelDirect } from '@/components/panels/ScriptsPanel'
import { DialoguePanel } from '@/components/panels/DialoguePanel'
import { VideosPanel } from '@/components/panels/VideosPanel'
import { TemplatesLibraryPanel } from '@/components/panels/TemplatesLibraryPanel'
import { AssetsPanel } from '@/components/panels/AssetsPanel'
import { RigEditorPanel } from '@/components/panels/RigEditorPanel'
import { Character3DPanel } from '@/components/panels/Character3DPanel'
import { Character1DPanel } from '@/components/panels/Character1DPanel'
import { ProjectTemplateLibrary } from '@/components/templates/ProjectTemplateLibrary'
import { SchemaPanel } from '@/components/panels/schema/SchemaPanel'
import { TAB_GROUPS, CARD_GRID_THRESHOLD } from '@/constants/tabGroups'
import type { LeftPanelTab, TabGroupId, SubTabDef } from '@/types'
import type { LucideIcon } from 'lucide-react'

/** Icon name string → Lucide component */
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
  Wand2,
  Music,
  Activity,
  Users,
  PenTool,
  Shirt,
  Smile,
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
  Image,
  Fingerprint,
  Clapperboard,
  FileVideo,
  Presentation,
  FileText,
  Mic,
  Search,
  RotateCcw,
  ArrowRightFromLine,
  GraduationCap,
}

/** Icon mapping for each tab group */
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

// Lazy-loaded panels
const BrandKitPanel = lazy(() =>
  import('@/components/panels/BrandKitPanel').then((m) => ({ default: m.BrandKitPanel })),
)
const SoundEffectsPanel = lazy(() =>
  import('@/components/panels/SoundEffectsPanel').then((m) => ({ default: m.SoundEffectsPanel })),
)
const CameraPanel = lazy(() => import('@/components/panels/CameraPanel').then((m) => ({ default: m.CameraPanel })))
const BeatSyncPanel = lazy(() =>
  import('@/components/panels/BeatSyncPanel').then((m) => ({ default: m.BeatSyncPanel })),
)
// const StylePanel = lazy(() => import('@/components/panels/StylePanel').then(m => ({ default: m.StylePanel })))
const AutoPublishPanel = lazy(() =>
  import('@/components/panels/AutoPublishPanel').then((m) => ({ default: m.AutoPublishPanel })),
)
const ViralityScorePanel = lazy(() =>
  import('@/components/panels/ViralityScorePanel').then((m) => ({ default: m.ViralityScorePanel })),
)
const RepurposePanel = lazy(() =>
  import('@/components/panels/RepurposePanel').then((m) => ({ default: m.RepurposePanel })),
)
const SeriesPanel = lazy(() => import('@/components/panels/SeriesPanel').then((m) => ({ default: m.SeriesPanel })))
const SmartCutPanel = lazy(() =>
  import('@/components/panels/SmartCutPanel').then((m) => ({ default: m.SmartCutPanel })),
)
const ScreenRecordPanel = lazy(() =>
  import('@/components/panels/ScreenRecordPanel').then((m) => ({ default: m.ScreenRecordPanel })),
)
const TrendPanel = lazy(() => import('@/components/panels/TrendPanel').then((m) => ({ default: m.TrendPanel })))
const AnimStylePanel = lazy(() =>
  import('@/components/panels/AnimStylePanel').then((m) => ({ default: m.AnimStylePanel })),
)
const AdaptiveMusicPanel = lazy(() =>
  import('@/components/panels/AdaptiveMusicPanel').then((m) => ({ default: m.AdaptiveMusicPanel })),
)
const PacingPanel = lazy(() => import('@/components/panels/PacingPanel').then((m) => ({ default: m.PacingPanel })))
const CrowdPanel = lazy(() => import('@/components/panels/CrowdPanel').then((m) => ({ default: m.CrowdPanel })))
const AnnotationPanel = lazy(() =>
  import('@/components/panels/AnnotationPanel').then((m) => ({ default: m.AnnotationPanel })),
)
const WardrobePanel = lazy(() =>
  import('@/components/panels/WardrobePanel').then((m) => ({ default: m.WardrobePanel })),
)
const MemePanel = lazy(() => import('@/components/panels/MemePanel').then((m) => ({ default: m.MemePanel })))
const MotionGalleryPanel = lazy(() =>
  import('@/components/panels/MotionGalleryPanel').then((m) => ({ default: m.MotionGalleryPanel })),
)
// WhiteboardPanel removed — whiteboard is now toggled from the canvas top bar
const BranchingVideoPanel = lazy(() =>
  import('@/components/panels/BranchingVideoPanel').then((m) => ({ default: m.BranchingVideoPanel })),
)
// const AppsPanel = lazy(() => import('@/components/panels/AppsPanel').then(m => ({ default: m.AppsPanel })))
// const FaceSwapPanel = lazy(() => import('@/components/panels/FaceSwapPanel').then(m => ({ default: m.FaceSwapPanel })))
const MixedMediaPanel = lazy(() =>
  import('@/components/panels/MixedMediaPanel').then((m) => ({ default: m.MixedMediaPanel })),
)
const ContentScorePanel = lazy(() =>
  import('@/components/panels/ContentScorePanel').then((m) => ({ default: m.ContentScorePanel })),
)
const MoodboardPanel = lazy(() =>
  import('@/components/panels/MoodboardPanel').then((m) => ({ default: m.MoodboardPanel })),
)
const CinemaStudioPanel = lazy(() =>
  import('@/components/panels/CinemaStudioPanel').then((m) => ({ default: m.CinemaStudioPanel })),
)
const ShotGridPanel = lazy(() =>
  import('@/components/panels/ShotGridPanel').then((m) => ({ default: m.ShotGridPanel })),
)
const AudioPanel = lazy(() => import('@/components/panels/AudioPanel').then((m) => ({ default: m.AudioPanel })))
const AudioEnhancementPanel = lazy(() =>
  import('@/components/panels/AudioEnhancementPanel').then((m) => ({ default: m.AudioEnhancementPanel })),
)
const SocialIntegrationPanel = lazy(() =>
  import('@/components/panels/SocialIntegrationPanel').then((m) => ({ default: m.SocialIntegrationPanel })),
)
const ExportProfilePanel = lazy(() =>
  import('@/components/panels/ExportProfilePanel').then((m) => ({ default: m.ExportProfilePanel })),
)
const EffectBrowserPanel = lazy(() =>
  import('@/components/panels/EffectBrowserPanel').then((m) => ({ default: m.EffectBrowserPanel })),
)
const AIModelsPanel = lazy(() =>
  import('@/components/panels/AIModelsPanel').then((m) => ({ default: m.AIModelsPanel })),
)
const AudioReactivePanel = lazy(() =>
  import('@/components/panels/AudioReactivePanel').then((m) => ({ default: m.AudioReactivePanel })),
)
// MotionDesignPanel consolidated into AssetsPanel
const VoiceClonePanel = lazy(() =>
  import('@/components/panels/VoiceClonePanel').then((m) => ({ default: m.VoiceClonePanel })),
)
const TranscriptPanel = lazy(() =>
  import('@/components/panels/TranscriptPanel').then((m) => ({ default: m.TranscriptPanel })),
)
const BrollSuggestionPanel = lazy(() =>
  import('@/components/panels/BrollSuggestionPanel').then((m) => ({ default: m.BrollSuggestionPanel })),
)
const CharacterIdentityPanel = lazy(() =>
  import('@/components/panels/CharacterIdentityPanel').then((m) => ({ default: m.CharacterIdentityPanel })),
)
const SingingPanel = lazy(() => import('@/components/panels/SingingPanel').then((m) => ({ default: m.SingingPanel })))
const ImageToVideoPanel = lazy(() =>
  import('@/components/panels/ImageToVideoPanel').then((m) => ({ default: m.ImageToVideoPanel })),
)
const FigmaImportPanel = lazy(() =>
  import('@/components/panels/FigmaImportPanel').then((m) => ({ default: m.FigmaImportPanel })),
)
const AvatarPanel = lazy(() => import('@/components/panels/AvatarPanel').then((m) => ({ default: m.AvatarPanel })))
const CompetitorScraperPanel = lazy(() =>
  import('@/components/panels/CompetitorScraperPanel').then((m) => ({ default: m.CompetitorScraperPanel })),
)
const GenImagePanel = lazy(() =>
  import('@/components/panels/GenImagePanel').then((m) => ({ default: m.GenImagePanel })),
)
const GenTextToVideoPanel = lazy(() =>
  import('@/components/panels/GenTextToVideoPanel').then((m) => ({ default: m.GenTextToVideoPanel })),
)
const GenAudioToVideoPanel = lazy(() =>
  import('@/components/panels/GenAudioToVideoPanel').then((m) => ({ default: m.GenAudioToVideoPanel })),
)
const GenVideoToVideoPanel = lazy(() =>
  import('@/components/panels/GenVideoToVideoPanel').then((m) => ({ default: m.GenVideoToVideoPanel })),
)
const GenRetakePanel = lazy(() =>
  import('@/components/panels/GenRetakePanel').then((m) => ({ default: m.GenRetakePanel })),
)
const GenExtendPanel = lazy(() =>
  import('@/components/panels/GenExtendPanel').then((m) => ({ default: m.GenExtendPanel })),
)
const GenManimPanel = lazy(() =>
  import('@/components/panels/GenManimPanel').then((m) => ({ default: m.GenManimPanel })),
)

/** Card grid for groups with many sub-tabs */
function SubTabCardGrid({ subTabs }: { subTabs: SubTabDef[] }) {
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

/** Drill-down header with Back, Prev, Title (dropdown), Next */
function DrillDownHeader({ subTabs }: { subTabs: SubTabDef[] }) {
  const activeTab = useEditorStore((s) => s.leftPanelActiveTab)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)
  const setShowGroupHome = useEditorStore((s) => s.setShowGroupHome)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentIndex = subTabs.findIndex((s) => s.id === activeTab)
  const currentSub = currentIndex >= 0 ? subTabs[currentIndex] : null
  const currentLabel = currentSub?.label ?? ''
  const CurrentIcon = currentSub?.icon ? ICON_MAP[currentSub.icon] : null

  // Close dropdown on outside click
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
    if (subTabs.length === 0) return
    const prev = currentIndex <= 0 ? subTabs.length - 1 : currentIndex - 1
    setLeftPanelActiveTab(subTabs[prev].id)
  }, [currentIndex, subTabs, setLeftPanelActiveTab])

  const goNext = useCallback(() => {
    if (subTabs.length === 0) return
    const next = currentIndex >= subTabs.length - 1 ? 0 : currentIndex + 1
    setLeftPanelActiveTab(subTabs[next].id)
  }, [currentIndex, subTabs, setLeftPanelActiveTab])

  const goBack = useCallback(() => {
    setShowGroupHome(true)
  }, [setShowGroupHome])

  return (
    <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
      <button
        onClick={goBack}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Back to menu"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={goPrev}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Previous"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Title with dropdown */}
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
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Next"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

/** Main header — styled like DrillDownHeader but without back button */
function MainGroupHeader() {
  const activeGroup = useEditorStore((s) => s.leftPanelActiveGroup)
  const activeTab = useEditorStore((s) => s.leftPanelActiveTab)
  const setLeftPanelGroup = useEditorStore((s) => s.setLeftPanelGroup)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const groupDef = useMemo(() => TAB_GROUPS.find((g) => g.id === activeGroup), [activeGroup])

  const currentIndex = TAB_GROUPS.findIndex((g) => g.id === activeGroup)

  // Close dropdown on outside click
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

  // Hide when in rig editor (has its own back-header)
  if (activeTab === 'rig-editor' || activeTab === 'rig-editor-3d') return null
  if (!groupDef) return null

  const label = groupDef.subTabs.length === 1 ? groupDef.subTabs[0].label : groupDef.label
  const GroupIcon = GROUP_ICONS[groupDef.id]

  const goPrev = () => {
    const prev = currentIndex <= 0 ? TAB_GROUPS.length - 1 : currentIndex - 1
    setLeftPanelGroup(TAB_GROUPS[prev].id)
  }

  const goNext = () => {
    const next = currentIndex >= TAB_GROUPS.length - 1 ? 0 : currentIndex + 1
    setLeftPanelGroup(TAB_GROUPS[next].id)
  }

  return (
    <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
      <button
        onClick={goPrev}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Previous"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Title with group dropdown */}
      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <GroupIcon size={14} className="shrink-0 text-zinc-400" />
          <span className="truncate">{label}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl py-1.5 max-h-[320px] overflow-y-auto">
            {TAB_GROUPS.map((group) => {
              const Icon = GROUP_ICONS[group.id]
              const isActive = group.id === activeGroup
              const groupLabel = group.subTabs.length === 1 ? group.subTabs[0].label : group.label
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setLeftPanelGroup(group.id)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-green-500/10 text-green-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="truncate">{groupLabel}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={goNext}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Next"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

/** Derive ALL_TABS from TAB_GROUPS for backwards compatibility */
export const ALL_TABS: { id: LeftPanelTab; label: string }[] = TAB_GROUPS.flatMap((group) =>
  group.subTabs.length === 0
    ? [{ id: group.id as LeftPanelTab, label: group.label }]
    : group.subTabs.map((sub) => ({ id: sub.id, label: sub.label })),
)

/** Collapse/expand pill — absolutely positioned OUTSIDE the overflow-hidden flex row, relative to the outer wrapper in EditorLayout */
export function LeftPanelToggle() {
  const leftPanelCollapsed = useEditorStore((s) => s.leftPanelCollapsed)
  const toggleLeftPanel = useEditorStore((s) => s.toggleLeftPanel)

  return (
    <button
      onClick={toggleLeftPanel}
      className="absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-zinc-700 rounded-r-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600 transition-all duration-300"
      style={{ left: leftPanelCollapsed ? 0 : 288 }}
    >
      {leftPanelCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  )
}

export function LeftPanel({ nodesMode: _nodesMode }: { nodesMode?: boolean } = {}) {
  const leftPanelCollapsed = useEditorStore((s) => s.leftPanelCollapsed)
  const toggleLeftPanel = useEditorStore((s) => s.toggleLeftPanel)
  const leftPanelActiveTab = useEditorStore((s) => s.leftPanelActiveTab)
  const leftPanelActiveGroup = useEditorStore((s) => s.leftPanelActiveGroup)
  const showGroupHome = useEditorStore((s) => s.showGroupHome)

  const groupDef = useMemo(() => TAB_GROUPS.find((g) => g.id === leftPanelActiveGroup), [leftPanelActiveGroup])
  const isLargeGroup = groupDef ? groupDef.subTabs.length > CARD_GRID_THRESHOLD : false

  // Which nav header to show
  const navHeader = (() => {
    if (leftPanelCollapsed) return null
    if (isLargeGroup && showGroupHome) return <MainGroupHeader />
    if (isLargeGroup) return <DrillDownHeader subTabs={groupDef!.subTabs} />
    return <MainGroupHeader />
  })()

  return (
    <aside
      className={cn(
        'flex-shrink-0 overflow-visible transition-all duration-300',
        leftPanelCollapsed ? 'w-0' : 'w-[300px]',
      )}
    >
      <div
        className={cn(
          'h-full flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden transition-opacity duration-300',
          leftPanelCollapsed ? 'opacity-0 border-transparent' : '',
        )}
      >
        {/* Nav header with inline group icons */}
        {navHeader}

        {/* Content Area */}
        {!leftPanelCollapsed && (
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {isLargeGroup && showGroupHome ? (
              <SubTabCardGrid subTabs={groupDef!.subTabs} />
            ) : (
              <div
                className={cn(
                  'flex-1 min-h-0',
                  leftPanelActiveTab === 'rig-editor'
                    ? 'overflow-hidden flex flex-col'
                    : leftPanelActiveTab === 'rig-editor-3d'
                      ? 'overflow-y-auto flex flex-col'
                      : 'overflow-hidden',
                )}
              >
                <PanelContent tab={leftPanelActiveTab} />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

const CHARACTER_MODES = [
  { id: '2d' as const, label: '2D', icon: Square },
  { id: '3d' as const, label: '3D', icon: Box },
  { id: '1d' as const, label: '1D', icon: Grid3x3 },
  { id: 'avatar' as const, label: 'AV', icon: UserCircle },
]

function CharacterPanelWrapper() {
  const [mode, setMode] = useState<'2d' | '3d' | '1d' | 'avatar'>('2d')
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {CHARACTER_MODES.map((m) => {
          const isActive = mode === m.id
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.label}
              className={cn(
                'flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-medium',
                isActive ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
              )}
            >
              <m.icon size={14} />
              {m.label}
            </button>
          )
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {mode === '2d' ? (
          <CharacterGeneratorPanel />
        ) : mode === '3d' ? (
          <Character3DPanel />
        ) : mode === '1d' ? (
          <Character1DPanel />
        ) : (
          <Suspense fallback={null}>
            <AvatarPanel />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export function PanelContent({ tab }: { tab: LeftPanelTab }) {
  // Modal-only tabs — return null (never shown as panel content)
  if (tab === 'projects' || tab === 'settings' || tab === 'video' || tab === 'export') {
    return null
  }

  // Absorbed tabs — redirected in store, but handle defensively
  if (tab === 'content-calendar' || tab === 'motion-capture' || tab === 'motion-tracking' || tab === 'live-avatar') {
    return null
  }

  // AI Edit — handled by floating panel, not inline
  if (tab === 'ai-edit') {
    return null
  }

  // --- Eagerly loaded panels ---

  if (tab === 'media') return <MediaPanel />
  if (tab === 'videos') return <VideosPanel />
  if (tab === 'marketplace') return <TemplatesLibraryPanel />
  if (tab === 'project-templates') return <ProjectTemplateLibrary />
  if (tab === 'assets') return <AssetsPanel />
  if (tab === 'character') return <CharacterPanelWrapper />
  if (tab === 'scripts') return <ScriptsPanelDirect />
  if (tab === 'dialogue') return <DialoguePanel />
  if (tab === 'text') return <TextPanel />
  if (tab === 'captions') return <CaptionsPanel />
  if (tab === 'transitions') return <TransitionsPanel />
  // svg-art, component-creator, animations, motion-design → consolidated into 'assets' tab
  if (tab === 'schema') return <SchemaPanel />
  if (tab === 'rig-editor' || tab === 'rig-editor-3d') return <RigEditorPanel />

  if (tab === '3d-objects') return <Character3DPanel />

  // --- Lazy-loaded panels ---
  const lazyFallback = (
    <div className="flex items-center justify-center py-12 text-gray-500">
      <Loader2 size={20} className="animate-spin" />
    </div>
  )

  if (tab === 'audio-browse')
    return (
      <Suspense fallback={lazyFallback}>
        <AudioPanel />
      </Suspense>
    )
  if (tab === 'sound-effects')
    return (
      <Suspense fallback={lazyFallback}>
        <SoundEffectsPanel />
      </Suspense>
    )
  if (tab === 'brand-kit')
    return (
      <Suspense fallback={lazyFallback}>
        <BrandKitPanel />
      </Suspense>
    )
  if (tab === 'camera')
    return (
      <Suspense fallback={lazyFallback}>
        <CameraPanel />
      </Suspense>
    )
  if (tab === 'beat-sync')
    return (
      <Suspense fallback={lazyFallback}>
        <BeatSyncPanel />
      </Suspense>
    )
  // if (tab === 'style-effects') return <Suspense fallback={lazyFallback}><StylePanel /></Suspense>
  if (tab === 'auto-publish')
    return (
      <Suspense fallback={lazyFallback}>
        <AutoPublishPanel />
      </Suspense>
    )
  // motion-capture, motion-tracking, live-avatar absorbed above — embedded in rig editor panels
  if (tab === 'virality')
    return (
      <Suspense fallback={lazyFallback}>
        <ViralityScorePanel />
      </Suspense>
    )
  if (tab === 'repurpose')
    return (
      <Suspense fallback={lazyFallback}>
        <RepurposePanel />
      </Suspense>
    )
  if (tab === 'series')
    return (
      <Suspense fallback={lazyFallback}>
        <SeriesPanel />
      </Suspense>
    )
  if (tab === 'smart-cut')
    return (
      <Suspense fallback={lazyFallback}>
        <SmartCutPanel />
      </Suspense>
    )
  if (tab === 'screen-record')
    return (
      <Suspense fallback={lazyFallback}>
        <ScreenRecordPanel />
      </Suspense>
    )
  if (tab === 'trends')
    return (
      <Suspense fallback={lazyFallback}>
        <TrendPanel />
      </Suspense>
    )
  if (tab === 'animStyle')
    return (
      <Suspense fallback={lazyFallback}>
        <AnimStylePanel />
      </Suspense>
    )
  if (tab === 'adaptive-music')
    return (
      <Suspense fallback={lazyFallback}>
        <AdaptiveMusicPanel />
      </Suspense>
    )
  if (tab === 'pacing')
    return (
      <Suspense fallback={lazyFallback}>
        <PacingPanel />
      </Suspense>
    )
  if (tab === 'crowd')
    return (
      <Suspense fallback={lazyFallback}>
        <CrowdPanel />
      </Suspense>
    )
  if (tab === 'annotations')
    return (
      <Suspense fallback={lazyFallback}>
        <AnnotationPanel />
      </Suspense>
    )
  if (tab === 'wardrobe')
    return (
      <Suspense fallback={lazyFallback}>
        <WardrobePanel />
      </Suspense>
    )
  if (tab === 'memes')
    return (
      <Suspense fallback={lazyFallback}>
        <MemePanel />
      </Suspense>
    )
  if (tab === 'motion-gallery')
    return (
      <Suspense fallback={lazyFallback}>
        <MotionGalleryPanel />
      </Suspense>
    )
  if (tab === 'branching-video')
    return (
      <Suspense fallback={lazyFallback}>
        <BranchingVideoPanel />
      </Suspense>
    )
  // if (tab === 'apps') return <Suspense fallback={lazyFallback}><AppsPanel /></Suspense>
  // if (tab === 'face-swap') return <Suspense fallback={lazyFallback}><FaceSwapPanel /></Suspense>
  if (tab === 'mixed-media')
    return (
      <Suspense fallback={lazyFallback}>
        <MixedMediaPanel />
      </Suspense>
    )
  if (tab === 'content-score')
    return (
      <Suspense fallback={lazyFallback}>
        <ContentScorePanel />
      </Suspense>
    )
  if (tab === 'moodboard')
    return (
      <Suspense fallback={lazyFallback}>
        <MoodboardPanel />
      </Suspense>
    )
  if (tab === 'cinema-studio')
    return (
      <Suspense fallback={lazyFallback}>
        <CinemaStudioPanel />
      </Suspense>
    )
  if (tab === 'shot-grid')
    return (
      <Suspense fallback={lazyFallback}>
        <ShotGridPanel />
      </Suspense>
    )
  if (tab === 'audio-enhancement')
    return (
      <Suspense fallback={lazyFallback}>
        <AudioEnhancementPanel />
      </Suspense>
    )
  if (tab === 'social-integration')
    return (
      <Suspense fallback={lazyFallback}>
        <SocialIntegrationPanel />
      </Suspense>
    )
  if (tab === 'export-profiles')
    return (
      <Suspense fallback={lazyFallback}>
        <ExportProfilePanel />
      </Suspense>
    )
  if (tab === 'effect-browser')
    return (
      <Suspense fallback={lazyFallback}>
        <EffectBrowserPanel />
      </Suspense>
    )
  if (tab === 'ai-models')
    return (
      <Suspense fallback={lazyFallback}>
        <AIModelsPanel />
      </Suspense>
    )
  if (tab === 'audio-reactive')
    return (
      <Suspense fallback={lazyFallback}>
        <AudioReactivePanel />
      </Suspense>
    )
  // motion-design consolidated into assets tab
  if (tab === 'voice-clone')
    return (
      <Suspense fallback={lazyFallback}>
        <VoiceClonePanel />
      </Suspense>
    )
  if (tab === 'transcript')
    return (
      <Suspense fallback={lazyFallback}>
        <TranscriptPanel />
      </Suspense>
    )
  if (tab === 'broll-suggest')
    return (
      <Suspense fallback={lazyFallback}>
        <BrollSuggestionPanel />
      </Suspense>
    )
  if (tab === 'character-identity')
    return (
      <Suspense fallback={lazyFallback}>
        <CharacterIdentityPanel />
      </Suspense>
    )
  if (tab === 'singing')
    return (
      <Suspense fallback={lazyFallback}>
        <SingingPanel />
      </Suspense>
    )
  if (tab === 'image-to-video')
    return (
      <Suspense fallback={lazyFallback}>
        <ImageToVideoPanel />
      </Suspense>
    )
  if (tab === 'pptx-import')
    return (
      <Suspense fallback={lazyFallback}>
        <FigmaImportPanel />
      </Suspense>
    )
  if (tab === 'gen-image')
    return (
      <Suspense fallback={lazyFallback}>
        <GenImagePanel />
      </Suspense>
    )
  if (tab === 'gen-text-to-video')
    return (
      <Suspense fallback={lazyFallback}>
        <GenTextToVideoPanel />
      </Suspense>
    )
  if (tab === 'gen-audio-to-video')
    return (
      <Suspense fallback={lazyFallback}>
        <GenAudioToVideoPanel />
      </Suspense>
    )
  if (tab === 'gen-video-to-video')
    return (
      <Suspense fallback={lazyFallback}>
        <GenVideoToVideoPanel />
      </Suspense>
    )
  if (tab === 'gen-retake')
    return (
      <Suspense fallback={lazyFallback}>
        <GenRetakePanel />
      </Suspense>
    )
  if (tab === 'gen-extend')
    return (
      <Suspense fallback={lazyFallback}>
        <GenExtendPanel />
      </Suspense>
    )
  if (tab === 'gen-manim')
    return (
      <Suspense fallback={lazyFallback}>
        <GenManimPanel />
      </Suspense>
    )
  if (tab === 'competitor-scraper')
    return (
      <Suspense fallback={lazyFallback}>
        <CompetitorScraperPanel />
      </Suspense>
    )
  // live-avatar absorbed above — embedded in 3D rig editor panel

  // Exhaustive check — all LeftPanelTab values handled above
  return tab satisfies never
}
