/**
 * Cinema Studio panel — preset-only left panel for Quick Moves, Genre Feel, and Cinema Shots.
 * Camera body, lens, and optical controls have moved to CameraPropertiesPanel (right panel).
 */

import { useState, useMemo, useEffect } from 'react'
import { Film, Zap, Sparkles, SlidersHorizontal, Search, Ban } from 'lucide-react'
import { PanelCategoryTabs } from '@/components/ui/panel-controls'
import { useCinemaStore } from '@/stores/useCinemaStore'
import { useCameraStore, CAMERA_PRESETS } from '@/stores/useCameraStore'
import { usePlaybackStore, useEditorStore } from '@/stores'
import { useTimelineStore } from '@/stores'
import { CINEMA_PRESETS } from '@/data/cinemaPresets'
import { GENRE_MOTION_PRESETS } from '@/data/genreMotionPresets'
import type { CinemaPresetCategory } from '@/types/cinemaCamera'
import { cn } from '@/lib/utils'

const CINEMA_TABS = [
  { id: 'quick', label: 'Quick', icon: Zap },
  { id: 'genre', label: 'Genre', icon: Sparkles },
  { id: 'cinema', label: 'Cinema', icon: Film },
] as const

type CinemaTabId = (typeof CINEMA_TABS)[number]['id']

const CATEGORIES: { id: CinemaPresetCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'establishing', label: 'Establishing' },
  { id: 'dialogue', label: 'Dialogue' },
  { id: 'action', label: 'Action' },
  { id: 'emotion', label: 'Emotion' },
  { id: 'transition', label: 'Transition' },
]

const QUICK_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'pan', label: 'Pan' },
  { id: 'other', label: 'Other' },
]

const GENRE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'intense', label: 'Intense' },
  { id: 'calm', label: 'Calm' },
]

export function CinemaStudioPanel() {
  const store = useCinemaStore()
  const cameraStore = useCameraStore()
  const fps = usePlaybackStore((s) => s.fps)
  const duration = usePlaybackStore((s) => s.duration)
  const totalFrames = Math.round(duration * fps)

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<CinemaTabId>('quick')
  const [activeCategory, setActiveCategory] = useState<CinemaPresetCategory | 'all'>('all')
  const [quickCategory, setQuickCategory] = useState('all')
  const [genreCategory, setGenreCategory] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const cameraEnabled = useCameraStore((s) => s.enabled)
  const cameraSetEnabled = useCameraStore((s) => s.setEnabled)
  const cameraActivePresetId = useCameraStore((s) => s.activePresetId)
  const cameraApplyPreset = useCameraStore((s) => s.applyPreset)
  const timelineTotalFrames = useTimelineStore((s) => s.totalFrames)

  // ── Search filtering ──────────────────────────────────────────────────

  const q = search.toLowerCase().trim()

  const filteredQuickMoves = useMemo(() => {
    let result = CAMERA_PRESETS
    if (quickCategory !== 'all') {
      result = result.filter((p) => {
        const name = p.name.toLowerCase()
        if (quickCategory === 'zoom') return name.includes('zoom') || name.includes('ken burns')
        if (quickCategory === 'pan') return name.includes('pan')
        // 'other' — everything else (push, pull, drift)
        return !name.includes('zoom') && !name.includes('ken burns') && !name.includes('pan')
      })
    }
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    return result
  }, [q, quickCategory])

  const filteredGenres = useMemo(() => {
    let result = GENRE_MOTION_PRESETS
    if (genreCategory !== 'all') {
      result = result.filter((p) => {
        const genre = p.genre.toLowerCase()
        if (genreCategory === 'intense') return genre === 'action' || genre === 'horror' || genre === 'suspense'
        // 'calm'
        return genre === 'romance' || genre === 'comedy' || genre === 'documentary'
      })
    }
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.genre.toLowerCase().includes(q),
      )
    }
    return result
  }, [q, genreCategory])

  const filteredPresets = useMemo(() => {
    let result = CINEMA_PRESETS
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory)
    }
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    return result
  }, [activeCategory, q])

  // ── Active tab empty state ────────────────────────────────────────────

  const activeTabEmpty =
    (activeTab === 'quick' && filteredQuickMoves.length === 0) ||
    (activeTab === 'genre' && filteredGenres.length === 0) ||
    (activeTab === 'cinema' && filteredPresets.length === 0)

  // ── Preset application (unchanged) ─────────────────────────────────

  const handleApplyPreset = (presetId: string) => {
    const preset = CINEMA_PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    store.applyPreset(presetId)

    // Apply optical settings
    if (preset.opticalSettings) {
      store.setOptical(preset.opticalSettings)
    }

    // Convert cinema keyframes to camera keyframes
    const frames = totalFrames || 300
    const cameraKeyframes = preset.keyframes.map((kf) => ({
      frame: Math.round((kf.framePercent / 100) * (frames - 1)),
      zoom: kf.zoom,
      panX: kf.position.x,
      panY: kf.position.y,
      rotation: kf.rotation.z,
      easing: kf.easing as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out',
    }))

    cameraStore.setKeyframes(cameraKeyframes)
    cameraStore.setEnabled(true)
  }

  const handleApplyGenre = (genre: string) => {
    const preset = GENRE_MOTION_PRESETS.find((p) => p.genre === genre)
    if (!preset) return

    const frames = totalFrames || 300
    const cameraKeyframes = preset.keyframes.map((kf) => ({
      frame: Math.round((kf.framePercent / 100) * (frames - 1)),
      zoom: kf.zoom,
      panX: kf.position.x,
      panY: kf.position.y,
      rotation: kf.rotation.z,
      easing: kf.easing as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out',
    }))

    cameraStore.setKeyframes(cameraKeyframes)
    cameraStore.setEnabled(true)

    if (preset.opticalOverrides) {
      store.setOptical(preset.opticalOverrides)
    }
  }

  // Show camera properties in right panel when this tab is active
  useEffect(() => {
    useEditorStore.getState().setRightPanelTab('camera-properties')
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {CINEMA_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{
                  transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search Bar + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presets..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
              filtersOpen ? 'bg-accent/20 text-accent' : 'text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface',
            )}
          >
            <SlidersHorizontal size={14} />
            {((activeTab === 'quick' && quickCategory !== 'all') ||
              (activeTab === 'genre' && genreCategory !== 'all') ||
              (activeTab === 'cinema' && activeCategory !== 'all')) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
        </div>
      </div>

      {/* Category filter — shown when filter toggle is open */}
      {filtersOpen && (
        <div className="shrink-0 px-3 pb-2">
          <PanelCategoryTabs
            tabs={activeTab === 'quick' ? QUICK_CATEGORIES : activeTab === 'genre' ? GENRE_CATEGORIES : CATEGORIES}
            activeTab={activeTab === 'quick' ? quickCategory : activeTab === 'genre' ? genreCategory : activeCategory}
            onChange={(id) => {
              if (activeTab === 'quick') setQuickCategory(id)
              else if (activeTab === 'genre') setGenreCategory(id)
              else setActiveCategory(id as CinemaPresetCategory | 'all')
            }}
            compact
          />
        </div>
      )}

      {/* ── Content by active tab ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Empty state */}
        {activeTabEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Film size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No presets found</span>
            <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
          </div>
        )}

        {/* Quick tab */}
        {activeTab === 'quick' && !activeTabEmpty && (
          <div className="space-y-1">
            {/* None option — disables camera */}
            <button
              onClick={() => {
                cameraSetEnabled(false)
                useCameraStore.getState().clearKeyframes()
              }}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                !cameraEnabled
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
              )}
            >
              <Ban size={14} className="shrink-0 text-gray-500" />
              <div>
                <div className="text-xs font-medium text-gray-200">None</div>
                <div className="text-[9px] text-gray-500 mt-0.5">No camera movement</div>
              </div>
            </button>
            {filteredQuickMoves.map((preset) => (
              <button
                key={preset.id}
                onClick={() => cameraApplyPreset(preset.id, timelineTotalFrames)}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg text-left transition-colors border',
                  cameraActivePresetId === preset.id
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                )}
              >
                <div className="text-xs font-medium text-gray-200">{preset.name}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Genre tab */}
        {activeTab === 'genre' && filteredGenres.length > 0 && (
          <div className="space-y-1">
            {filteredGenres.map((gp) => (
              <button
                key={gp.id}
                onClick={() => handleApplyGenre(gp.genre)}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg text-left transition-colors border',
                  store.activePresetId === gp.id
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                )}
              >
                <div className="text-xs font-medium text-gray-200">{gp.name}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{gp.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Cinema tab */}
        {activeTab === 'cinema' && filteredPresets.length > 0 && (
          <div className="space-y-1">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg text-left transition-colors border',
                  store.activePresetId === preset.id
                    ? 'bg-accent/10 border-accent/30 text-white'
                    : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover text-gray-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{preset.name}</span>
                  <span className="text-[9px] uppercase tracking-wide text-gray-500">{preset.category}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={() => useEditorStore.getState().setRightPanelTab('camera-properties')}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-panel-surface text-gray-400 border border-white/5 hover:bg-panel-surface-hover hover:text-gray-200 transition-colors"
        >
          <SlidersHorizontal size={13} />
          Camera Settings
        </button>
      </div>
    </div>
  )
}
