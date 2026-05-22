/**
 * Trend Panel — AI-powered trending topic discovery with one-click video creation.
 *
 * Cinema-standardized browser: search, filter toggle, thick rows, blue accent.
 */

import { useState, useMemo } from 'react'
import { TrendingUp, Loader2, RefreshCw, Zap, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelCategoryTabs } from '@/components/ui/panel-controls'
import { useShallow } from 'zustand/react/shallow'
import { useTrendStore } from '@/stores/useTrendStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useEditorStore } from '@/stores/useEditorStore'
const NICHE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'tech', label: 'Tech' },
  { id: 'business', label: 'Business' },
  { id: 'health', label: 'Health' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'education', label: 'Education' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'finance', label: 'Finance' },
  { id: 'science', label: 'Science' },
  { id: 'sports', label: 'Sports' },
]

export function TrendPanel() {
  const { trends, isLoading, lastFetchedAt, setNiche, refresh } = useTrendStore(
    useShallow((s) => ({
      trends: s.trends,
      isLoading: s.isLoading,
      lastFetchedAt: s.lastFetchedAt,
      setNiche: s.setNiche,
      refresh: s.refresh,
    })),
  )

  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [nicheFilter, setNicheFilter] = useState('all')

  const q = search.toLowerCase().trim()

  const filteredTrends = useMemo(() => {
    let result = trends
    if (q) {
      result = result.filter(
        (t) =>
          t.topic.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.hashtags.some((h) => h.toLowerCase().includes(q)),
      )
    }
    return result
  }, [trends, q])

  const handleCreateVideo = (prompt: string) => {
    const orchStore = useOrchestratorStore.getState()
    orchStore.setPrompt(prompt)
    useEditorStore.getState().openCanvasOverlay('ai-director')
  }

  const handleNicheChange = (id: string) => {
    setNicheFilter(id)
    if (id !== 'all') {
      setNiche(id)
    }
  }

  const isFilterActive = nicheFilter !== 'all'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search Bar + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trends..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
              filtersOpen ? 'bg-[#4a7eff]/20 text-[#4a7eff]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
            )}
          >
            <SlidersHorizontal size={14} />
            {isFilterActive && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />}
          </button>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a] transition-colors"
            title={lastFetchedAt ? `Last updated ${Math.floor((Date.now() - lastFetchedAt) / 60000)}m ago` : 'Refresh'}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Filter panel (hidden by default) ── */}
      {filtersOpen && (
        <div className="shrink-0 px-3 pb-2">
          <PanelCategoryTabs tabs={NICHE_CATEGORIES} activeTab={nicheFilter} onChange={handleNicheChange} compact />
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Loading state */}
        {isLoading && trends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Loader2 size={28} className="mb-3 animate-spin text-[#4a7eff]" />
            <span className="text-sm text-gray-400">Searching for trending topics...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && trends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <TrendingUp size={28} className="mb-3" />
            <span className="text-sm text-gray-400">Discover trending topics</span>
            <span className="text-xs text-gray-600 mt-1 text-center max-w-[220px]">
              Find what's trending right now and create viral videos with one click
            </span>
            <button
              onClick={() => refresh()}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#4a7eff] text-white hover:bg-[#5a8eff] shadow-lg shadow-[#4a7eff]/20 transition-all"
            >
              <TrendingUp size={14} />
              Find Trends (5 credits)
            </button>
          </div>
        )}

        {/* Search empty state */}
        {!isLoading && trends.length > 0 && filteredTrends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Search size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No trends found</span>
            <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
          </div>
        )}

        {/* Trend rows */}
        {filteredTrends.length > 0 && !isLoading && (
          <div className="space-y-1">
            {filteredTrends.map((trend) => (
              <div
                key={trend.id}
                className="w-full px-3 py-2.5 rounded-lg text-left transition-colors border bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-xs font-medium text-zinc-200 leading-snug">{trend.topic}</h4>
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0',
                      trend.trendScore >= 80
                        ? 'bg-[#4a7eff]/20 text-[#4a7eff]'
                        : trend.trendScore >= 60
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-zinc-700 text-zinc-400',
                    )}
                  >
                    {trend.trendScore}
                  </span>
                </div>

                <p className="text-[9px] text-gray-500 mt-0.5 mb-2">{trend.description}</p>

                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/20">
                    {trend.suggestedFormat}
                  </span>
                  {trend.hashtags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[9px] text-zinc-600">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleCreateVideo(trend.orchestratorPrompt)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/20 hover:bg-[#4a7eff]/20 transition-all"
                >
                  <Zap size={11} />
                  Create Video
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
