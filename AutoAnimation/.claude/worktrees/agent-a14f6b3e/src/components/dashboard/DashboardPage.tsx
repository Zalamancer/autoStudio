import { useState, useCallback, useMemo } from 'react'
import { Layers, Play, Copy, Search, ArrowUpDown } from 'lucide-react'
import type { OrchestratorPhase } from '@/types/orchestrator'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { DashboardHeader } from './DashboardHeader'
import { NewClipButton } from './NewClipButton'
import { ClipGrid } from './ClipGrid'
import { BatchCreatePanel } from './BatchCreatePanel'
import { DashboardModals } from './DashboardModals'
import { SignInModal } from '@/components/modals/SignInModal'
import { ProjectTemplateLibrary } from '@/components/templates/ProjectTemplateLibrary'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import type { VideoCompositionProps } from '@/remotion/types'

type DashboardTab = 'clips' | 'templates' | 'my-templates'
type SortOption = 'newest' | 'oldest' | 'alphabetical'
type StatusFilter = 'all' | OrchestratorPhase

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'idle', label: 'Draft' },
  { value: 'planning', label: 'Planning' },
  { value: 'reviewing', label: 'Ready' },
  { value: 'executing', label: 'Executing' },
  { value: 'done', label: 'Complete' },
  { value: 'error', label: 'Error' },
]

export function DashboardPage() {
  useThemeEffect()
  const clips = useDashboardStore((s) => s.clips)
  const expandedClipId = useDashboardStore((s) => s.expandedClipId)
  const executingClipId = useDashboardStore((s) => s.executingClipId)
  const { addClip, removeClip, setExpandedClip, executeAllReviewed } = useDashboardStore()

  const [activeTab, setActiveTab] = useState<DashboardTab>('clips')
  const [showBatchPanel, setShowBatchPanel] = useState(false)

  // ── Search, filter, sort state ──
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')

  const filteredClips = useMemo(() => {
    let result = clips

    // Filter by search query (match against prompt text)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((clip) => clip.prompt.toLowerCase().includes(q))
    }

    // Filter by status/phase
    if (statusFilter !== 'all') {
      result = result.filter((clip) => clip.phase === statusFilter)
    }

    // Sort
    if (sortOption === 'oldest') {
      result = [...result].sort((a, b) => a.createdAt - b.createdAt)
    } else if (sortOption === 'alphabetical') {
      result = [...result].sort((a, b) =>
        (a.prompt || '').localeCompare(b.prompt || ''),
      )
    }
    // 'newest' is the default order (clips are unshifted, so already newest-first)

    return result
  }, [clips, searchQuery, statusFilter, sortOption])

  // ── Modal state ──
  const [previewRecordingId, setPreviewRecordingId] = useState<string | null>(null)
  const [previewCompositionSnapshot, setPreviewCompositionSnapshot] = useState<VideoCompositionProps | null>(null)
  const [shareRecordingId, setShareRecordingId] = useState<string | null>(null)
  const [analyticsRecordingId, setAnalyticsRecordingId] = useState<string | null>(null)

  const handleToggleExpand = useCallback(
    (clipId: string) => {
      // Read expandedClipId directly from store to avoid stale closure + dep churn
      const current = useDashboardStore.getState().expandedClipId
      setExpandedClip(current === clipId ? null : clipId)
    },
    [setExpandedClip],
  )

  // Modal handlers
  const handlePlay = useCallback((recordingId: string, compositionSnapshot?: VideoCompositionProps | null) => {
    setPreviewRecordingId(recordingId || null)
    setPreviewCompositionSnapshot(compositionSnapshot ?? null)
  }, [])

  const handleShare = useCallback((recordingId: string) => {
    setShareRecordingId(recordingId)
  }, [])

  const handleInsights = useCallback((recordingId: string) => {
    setAnalyticsRecordingId(recordingId)
  }, [])

  // Count clips in different states for action buttons
  const reviewedCount = clips.filter((c) => c.phase === 'reviewing' && c.plan).length

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-900 text-white">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-[#2a2a2a]">
            <TabButton active={activeTab === 'clips'} onClick={() => setActiveTab('clips')}>
              Clips
            </TabButton>
            <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>
              <Copy size={13} className="mr-1.5" />
              Templates
            </TabButton>
            <TabButton active={activeTab === 'my-templates'} onClick={() => setActiveTab('my-templates')}>
              My Templates
            </TabButton>
          </div>

          {/* Clips tab */}
          {activeTab === 'clips' && (
            <>
              {/* Top bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Clips</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Generate multiple AI clips in parallel
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Execute All button */}
                  {reviewedCount > 0 && (
                    <button
                      onClick={executeAllReviewed}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition-colors"
                    >
                      <Play size={16} />
                      <span className="hidden sm:inline">Execute All</span> ({reviewedCount})
                    </button>
                  )}

                  {/* Batch Generate button */}
                  <button
                    onClick={() => setShowBatchPanel(!showBatchPanel)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                      showBatchPanel
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] border border-[#3a3a3a]'
                    }`}
                  >
                    <Layers size={16} />
                    <span className="hidden sm:inline">Batch</span>
                  </button>

                  {/* Single clip button */}
                  <NewClipButton onClick={() => addClip()} />
                </div>
              </div>

              {/* Search, filter & sort */}
              {clips.length > 0 && (
                <div className="space-y-3">
                  {/* Search bar + sort */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search clips by prompt..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white placeholder-gray-600 outline-none focus:border-[#3a3a3a] transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="appearance-none pl-8 pr-6 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-gray-300 outline-none focus:border-[#3a3a3a] transition-colors cursor-pointer"
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="alphabetical">A-Z</option>
                      </select>
                      <ArrowUpDown size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Status filter pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_FILTERS.map(({ value, label }) => {
                      const isActive = statusFilter === value
                      const count = value === 'all'
                        ? clips.length
                        : clips.filter((c) => c.phase === value).length
                      if (value !== 'all' && count === 0) return null
                      return (
                        <button
                          key={value}
                          onClick={() => setStatusFilter(isActive && value !== 'all' ? 'all' : value)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a] hover:text-gray-300 hover:border-[#3a3a3a]'
                          }`}
                        >
                          {label}
                          <span className={`ml-1.5 ${isActive ? 'text-blue-400/70' : 'text-gray-600'}`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Batch Create Panel (inline) */}
              {showBatchPanel && (
                <BatchCreatePanel onClose={() => setShowBatchPanel(false)} />
              )}

              {/* Clip Grid */}
              <ClipGrid
                clips={filteredClips}
                totalClipCount={clips.length}
                expandedClipId={expandedClipId}
                executingClipId={executingClipId}
                onToggleExpand={handleToggleExpand}
                onRemove={removeClip}
                onPlay={handlePlay}
                onShare={handleShare}
                onInsights={handleInsights}
              />
            </>
          )}

          {/* Templates tab */}
          {activeTab === 'templates' && (
            <div className="min-h-[400px]">
              <ProjectTemplateLibrary />
            </div>
          )}

          {/* My Templates tab */}
          {activeTab === 'my-templates' && (
            <div className="min-h-[400px]">
              <ProjectTemplateLibrary showMyTemplates />
            </div>
          )}
        </div>
      </div>

      {/* Dashboard-scoped modals */}
      <DashboardModals
        previewRecordingId={previewRecordingId}
        previewCompositionSnapshot={previewCompositionSnapshot}
        onClosePreview={() => {
          setPreviewRecordingId(null)
          setPreviewCompositionSnapshot(null)
        }}
        shareRecordingId={shareRecordingId}
        onCloseShare={() => setShareRecordingId(null)}
        analyticsRecordingId={analyticsRecordingId}
        onCloseAnalytics={() => setAnalyticsRecordingId(null)}
      />
      <SignInModal />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'text-white border-blue-500'
          : 'text-gray-500 border-transparent hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}
