/**
 * Competitor Scraper Panel — Scrape & analyze competitor videos from TikTok, YouTube, Instagram.
 *
 * Cinema-standardized workflow: shell, blue accent, matching input/button styles.
 */

import { useState, useCallback } from 'react'
import { Search, Loader2, FileText, Brain, Zap, ExternalLink, Eye, Heart, MessageCircle, Clock, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useCompetitorScraperStore } from '@/stores/useCompetitorScraperStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import type { CompetitorVideo, ScraperPlatform, ScraperJobType } from '@/types/competitorScraper'

const INPUT_MODES: { id: ScraperJobType; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'username', label: 'Username' },
  { id: 'keyword', label: 'Keyword' },
]

const PLATFORMS: { id: ScraperPlatform; label: string; color: string }[] = [
  { id: 'tiktok', label: 'TikTok', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'youtube', label: 'YouTube', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { id: 'instagram', label: 'Instagram', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
]

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PlatformBadge({ platform }: { platform: ScraperPlatform }) {
  const p = PLATFORMS.find((pl) => pl.id === platform)
  if (!p) return null
  return (
    <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded border', p.color)}>
      {p.label}
    </span>
  )
}

function VideoCard({ video, isSelected, onClick }: { video: CompetitorVideo; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg text-left transition-colors border',
        isSelected
          ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
          : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
      )}
    >
      <div className="flex gap-2.5">
        {video.thumbnailUrl && (
          <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-zinc-700">
            <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <PlatformBadge platform={video.platform} />
            {video.duration > 0 && (
              <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                <Clock size={9} />
                {formatDuration(video.duration)}
              </span>
            )}
          </div>
          <h4 className="text-[11px] font-medium text-zinc-200 leading-snug line-clamp-2 mb-1">
            {video.title || 'Untitled'}
          </h4>
          <p className="text-[10px] text-zinc-500">@{video.author.username}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-0.5"><Eye size={10} />{formatNumber(video.stats.views)}</span>
        <span className="flex items-center gap-0.5"><Heart size={10} />{formatNumber(video.stats.likes)}</span>
        <span className="flex items-center gap-0.5"><MessageCircle size={10} />{formatNumber(video.stats.comments)}</span>
        {video.transcript && <span className="text-[#4a7eff] flex items-center gap-0.5"><FileText size={10} />Has transcript</span>}
        {video.analysis && <span className="text-[#4a7eff] flex items-center gap-0.5"><Brain size={10} />Analyzed</span>}
      </div>
    </button>
  )
}

function VideoDetail({ video }: { video: CompetitorVideo }) {
  const { doTranscribe, doAnalyze, transcriptCache, analysisCache } = useCompetitorScraperStore(
    useShallow((s) => ({
      doTranscribe: s.doTranscribe,
      doAnalyze: s.doAnalyze,
      transcriptCache: s.transcriptCache,
      analysisCache: s.analysisCache,
    })),
  )
  const setOrchestratorPrompt = useOrchestratorStore((s) => s.setPrompt)
  const setSelectedVideoId = useCompetitorScraperStore((s) => s.setSelectedVideoId)

  const [transcribing, setTranscribing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const transcript = video.transcript || transcriptCache[video.id]
  const analysis = video.analysis || analysisCache[video.id]

  const handleTranscribe = useCallback(async () => {
    setTranscribing(true)
    await doTranscribe(video.id, video.url)
    setTranscribing(false)
  }, [doTranscribe, video.id, video.url])

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true)
    await doAnalyze(video.id)
    setAnalyzing(false)
  }, [doAnalyze, video.id])

  const handleGenerateSimilar = useCallback(() => {
    const prompt = analysis?.replicationPrompt || `Create a video similar to: ${video.title}`
    setOrchestratorPrompt(prompt)
  }, [analysis, video.title, setOrchestratorPrompt])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Back button */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <button
          onClick={() => setSelectedVideoId(null)}
          className="p-1 rounded hover:bg-[#2a2a2a] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[11px] font-medium text-zinc-300 truncate">{video.title || 'Video Detail'}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Thumbnail + meta */}
        {video.thumbnailUrl && (
          <div className="w-full rounded-lg overflow-hidden bg-zinc-700 aspect-video">
            <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <PlatformBadge platform={video.platform} />
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5">
            Open <ExternalLink size={10} />
          </a>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-0.5"><Eye size={10} />{formatNumber(video.stats.views)}</span>
          <span className="flex items-center gap-0.5"><Heart size={10} />{formatNumber(video.stats.likes)}</span>
          <span className="flex items-center gap-0.5"><MessageCircle size={10} />{formatNumber(video.stats.comments)}</span>
        </div>

        {video.description && (
          <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-4">{video.description}</p>
        )}

        {/* Transcript section */}
        <div className="border border-white/5 rounded-lg p-2.5 bg-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <FileText size={12} /> Transcript
            </span>
            {!transcript && (
              <button
                onClick={handleTranscribe}
                disabled={transcribing}
                className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-zinc-300 hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {transcribing ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
                {transcribing ? 'Extracting...' : 'Extract'}
              </button>
            )}
          </div>
          {transcript ? (
            <p className="text-[10px] text-zinc-400 leading-relaxed max-h-[200px] overflow-y-auto">
              {transcript.text}
            </p>
          ) : (
            <p className="text-[10px] text-zinc-600 italic">No transcript yet. Click Extract to get one.</p>
          )}
        </div>

        {/* Analysis section */}
        <div className="border border-white/5 rounded-lg p-2.5 bg-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <Brain size={12} /> AI Analysis
            </span>
            {!analysis && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-zinc-300 hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {analyzing ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            )}
          </div>
          {analysis ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">Hook Score:</span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded',
                    analysis.hookScore >= 80
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : analysis.hookScore >= 50
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300',
                  )}
                >
                  {analysis.hookScore}/100
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block mb-0.5">Structure:</span>
                <p className="text-[10px] text-zinc-400">{analysis.contentStructure}</p>
              </div>

              {analysis.keyTakeaways.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Key Takeaways:</span>
                  <ul className="space-y-0.5">
                    {analysis.keyTakeaways.map((t, i) => (
                      <li key={i} className="text-[10px] text-zinc-400 flex items-start gap-1">
                        <span className="text-zinc-600 shrink-0">•</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.engagementInsights.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Engagement Insights:</span>
                  <ul className="space-y-0.5">
                    {analysis.engagementInsights.map((ins, i) => (
                      <li key={i} className="text-[10px] text-zinc-400 flex items-start gap-1">
                        <span className="text-zinc-600 shrink-0">•</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-600 italic">Click Analyze to get AI insights.</p>
          )}
        </div>

        {/* Generate Similar button */}
        {analysis?.replicationPrompt && (
          <button
            onClick={handleGenerateSimilar}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/20 hover:bg-[#4a7eff]/20 text-[11px] font-medium transition-colors"
          >
            <Zap size={12} />
            Generate Similar Video
          </button>
        )}
      </div>
    </div>
  )
}

export function CompetitorScraperPanel() {
  const {
    scrapedVideos,
    selectedVideoId,
    inputMode,
    isLoading,
    error,
    setInputMode,
    setSelectedVideoId,
    doScrapeUrl,
    doScrapeUsername,
    doScrapeKeyword,
  } = useCompetitorScraperStore(
    useShallow((s) => ({
      scrapedVideos: s.scrapedVideos,
      selectedVideoId: s.selectedVideoId,
      inputMode: s.inputMode,
      isLoading: s.isLoading,
      error: s.error,
      setInputMode: s.setInputMode,
      setSelectedVideoId: s.setSelectedVideoId,
      doScrapeUrl: s.doScrapeUrl,
      doScrapeUsername: s.doScrapeUsername,
      doScrapeKeyword: s.doScrapeKeyword,
    })),
  )

  const [query, setQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<ScraperPlatform>('tiktok')
  const [selectedPlatforms, setSelectedPlatforms] = useState<ScraperPlatform[]>(['tiktok', 'youtube'])

  const selectedVideo = selectedVideoId
    ? scrapedVideos.find((v) => v.id === selectedVideoId) || null
    : null

  // Show detail view if a video is selected
  if (selectedVideo) {
    return <VideoDetail video={selectedVideo} />
  }

  const handleSubmit = () => {
    if (!query.trim() || isLoading) return

    if (inputMode === 'url') {
      doScrapeUrl(query.trim())
    } else if (inputMode === 'username') {
      doScrapeUsername(query.trim().replace(/^@/, ''), selectedPlatform)
    } else {
      doScrapeKeyword(query.trim(), selectedPlatforms)
    }
  }

  const togglePlatform = (p: ScraperPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Input section */}
      <div className="shrink-0 px-3 py-2 space-y-2 border-b border-white/5">
        {/* Mode tabs — Cinema animated style */}
        <div className="flex items-center gap-1">
          {INPUT_MODES.map((mode) => {
            const isActive = inputMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => setInputMode(mode.id)}
                style={{
                  flex: isActive ? 2 : 1,
                  transition:
                    'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
                }}
                className={cn(
                  'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden text-[11px] font-medium',
                  isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
                )}
              >
                {mode.label}
              </button>
            )
          })}
        </div>

        {/* Platform selection */}
        {inputMode === 'username' && (
          <div className="flex items-center gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-md border transition-colors',
                  selectedPlatform === p.id
                    ? p.color
                    : 'border-white/5 text-zinc-500 hover:text-zinc-300',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {inputMode === 'keyword' && (
          <div className="flex items-center gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-md border transition-colors',
                  selectedPlatforms.includes(p.id)
                    ? p.color
                    : 'border-white/5 text-zinc-500 hover:text-zinc-300',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Search input — Cinema style */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={
                inputMode === 'url'
                  ? 'Paste video URL...'
                  : inputMode === 'username'
                    ? '@username'
                    : 'Search keyword or #hashtag'
              }
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="shrink-0 w-9 h-9 rounded-lg bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </div>

        {error && (
          <p className="text-[10px] text-red-400">{error}</p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {scrapedVideos.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Search size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No videos found</span>
            <span className="text-xs text-gray-600 mt-1">Paste a URL, enter a username, or search by keyword</span>
          </div>
        )}

        {scrapedVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isSelected={selectedVideoId === video.id}
            onClick={() => setSelectedVideoId(video.id)}
          />
        ))}
      </div>
    </div>
  )
}
