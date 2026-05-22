import { useRef, useCallback, useEffect, useState } from 'react'
import { Film, Upload, Search, Loader2, Check, ExternalLink, Trash2, Plus, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { usePixabayStore } from '@/stores/usePixabayStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { getPixabayService, hasPixabayService } from '@/services/pixabay'
import type { PixabayVideoHit } from '@/services/pixabay'
import type { MediaAsset } from '@/stores/useMediaStore'

type VideoSubTab = 'all' | 'uploads'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideosPanel() {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subTab, setSubTab] = useState<VideoSubTab>('all')
  const [searchOpen, setSearchOpen] = useState(false)

  const query = usePixabayStore((s) => s.query)
  const isLoading = usePixabayStore((s) => s.isLoading)
  const error = usePixabayStore((s) => s.error)
  const videoResults = usePixabayStore((s) => s.videoResults)
  const currentPage = usePixabayStore((s) => s.currentPage)
  const hasMore = usePixabayStore((s) => s.hasMore)
  const downloadingIds = usePixabayStore((s) => s.downloadingIds)

  const setQuery = usePixabayStore((s) => s.setQuery)
  const setLoading = usePixabayStore((s) => s.setLoading)
  const setError = usePixabayStore((s) => s.setError)
  const setVideoResults = usePixabayStore((s) => s.setVideoResults)
  const appendVideoResults = usePixabayStore((s) => s.appendVideoResults)
  const addDownloadingId = usePixabayStore((s) => s.addDownloadingId)
  const removeDownloadingId = usePixabayStore((s) => s.removeDownloadingId)

  const assets = useMediaStore((s) => s.assets)
  const addAsset = useMediaStore((s) => s.addAsset)
  const addToCanvas = useMediaStore((s) => s.addToCanvas)
  const removeAsset = useMediaStore((s) => s.removeAsset)
  const updateAsset = useMediaStore((s) => s.updateAsset)

  const isConfigured = hasPixabayService()

  const uploadedVideos = assets.filter((a) => a.category === 'video')

  // Load trending videos on mount if no results yet
  useEffect(() => {
    if (isConfigured && videoResults.length === 0) {
      performSearchDirect('', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const performSearchDirect = useCallback(
    async (searchQuery: string, page: number = 1) => {
      if (!isConfigured) return
      setLoading(true)
      setError(null)
      try {
        const service = getPixabayService()
        const result = await service.searchVideos({
          q: searchQuery || 'trending',
          page,
          per_page: 20,
        })
        if (page === 1) setVideoResults(result.hits, result.totalHits, page)
        else appendVideoResults(result.hits, result.totalHits, page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    },
    [isConfigured, setLoading, setError, setVideoResults, appendVideoResults],
  )

  // Debounced search when query changes (driven by header search bar)
  useEffect(() => {
    if (!isConfigured) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      debounceRef.current = setTimeout(() => performSearchDirect('', 1), 200)
    } else {
      debounceRef.current = setTimeout(() => performSearchDirect(query, 1), 400)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleLoadMore = useCallback(() => {
    performSearchDirect(query || 'trending', currentPage + 1)
  }, [performSearchDirect, query, currentPage])

  // Import handler
  const isAlreadyImported = useCallback(
    (hitId: number) => {
      return assets.some((a) => a.id.startsWith(`pixabay_vid_${hitId}_`))
    },
    [assets],
  )

  const handleImportVideo = useCallback(
    async (hit: PixabayVideoHit) => {
      addDownloadingId(hit.id)
      try {
        const service = getPixabayService()
        const videoUrl = hit.videos.medium?.url || hit.videos.small?.url || hit.videos.tiny?.url
        if (!videoUrl) throw new Error('No video URL available')

        const blob = await service.downloadAsBlob(videoUrl)
        const url = URL.createObjectURL(blob)

        const name = hit.tags.split(',')[0]?.trim() || `pixabay-${hit.id}`
        const videoSize = hit.videos.medium || hit.videos.small || hit.videos.tiny
        const asset: MediaAsset = {
          id: `pixabay_vid_${hit.id}_${Date.now()}`,
          name: `${name}.mp4`,
          type: 'video/mp4',
          size: blob.size,
          category: 'video',
          url,
          width: videoSize.width,
          height: videoSize.height,
          duration: hit.duration,
          addedAt: Date.now(),
        }

        addAsset(asset, blob)
        addToCanvas(asset.id)
      } catch (err) {
        console.error('Failed to import Pixabay video:', err)
      } finally {
        removeDownloadingId(hit.id)
      }
    },
    [addAsset, addToCanvas, addDownloadingId, removeDownloadingId],
  )

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        Array.from(e.target.files).forEach((file) => {
          if (!file.type.startsWith('video/')) return
          const url = URL.createObjectURL(file)
          const asset: MediaAsset = {
            id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            category: 'video',
            url,
            addedAt: Date.now(),
          }
          const vid = document.createElement('video')
          vid.preload = 'metadata'
          vid.onloadedmetadata = () => {
            updateAsset(asset.id, {
              width: vid.videoWidth,
              height: vid.videoHeight,
              duration: vid.duration,
            })
            URL.revokeObjectURL(vid.src)
          }
          vid.src = URL.createObjectURL(file)
          addAsset(asset, file)
        })
        e.target.value = ''
      }
    },
    [addAsset, updateAsset],
  )

  return (
    <PanelLayout
      icon={Film}
      title="Videos"
      trailing={
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.webm"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleFileSelect}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Upload"
          >
            <Upload size={15} />
          </button>
          <button
            onClick={() => useEditorStore.getState().setRightPanelTab('gen-text-to-video-properties')}
            className="p-1.5 rounded-md text-gray-400 hover:text-emerald-400 hover:bg-[#2a2a2a] transition-colors"
            title="Generate with AI"
          >
            <Sparkles size={15} />
          </button>
          <button
            onClick={() => {
              setSearchOpen(true)
              setSubTab('all')
            }}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Search"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('video-browser')}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Expand"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      }
      searchBar={{
        isOpen: searchOpen,
        onToggle: () => {
          setSearchOpen(false)
          setQuery('')
        },
        query,
        onQueryChange: setQuery,
        placeholder: 'Search videos...',
        isLoading,
      }}
    >
      {/* ── Sub-tab navigation ── */}
      <div className="flex items-center gap-1">
        {[
          { id: 'all' as const, label: 'All' },
          { id: 'uploads' as const, label: 'Uploads' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              subTab === tab.id
                ? 'bg-white text-black'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── All: Pixabay search + results ── */}
      {subTab === 'all' && (
        <>
          {!isConfigured ? (
            <div className="p-3 bg-[#2a2a2a]/80 rounded-lg border border-[#3a3a3a] text-center space-y-2">
              <Film size={20} className="text-gray-600 mx-auto" />
              <p className="text-xs text-gray-400">Add your Pixabay API key to browse free stock videos.</p>
              <a
                href="https://pixabay.com/api/docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[#4a7eff] hover:underline"
              >
                Get API Key <ExternalLink size={10} />
              </a>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <span className="text-xs text-red-400">{error}</span>
                </div>
              )}

              {/* Video grid */}
              {videoResults.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {videoResults.map((hit) => (
                    <PixabayVideoCard
                      key={hit.id}
                      hit={hit}
                      isDownloading={downloadingIds.includes(hit.id)}
                      isImported={isAlreadyImported(hit.id)}
                      onImport={() => handleImportVideo(hit)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && query.trim() && videoResults.length === 0 && !error && (
                <div className="py-6 text-center">
                  <p className="text-xs text-gray-500">No videos found for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {/* Load More */}
              {hasMore && !isLoading && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-2 px-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
                >
                  Load More
                </button>
              )}

              {/* Loading indicator */}
              {isLoading && videoResults.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-gray-500" />
                </div>
              )}

              {/* Attribution */}
              {videoResults.length > 0 && (
                <div className="text-center pb-1">
                  <a
                    href="https://pixabay.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    Free videos from Pixabay <ExternalLink size={9} />
                  </a>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Uploads: user's local videos ── */}
      {subTab === 'uploads' && (
        <div className="space-y-3">
          {uploadedVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Upload size={32} className="text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No videos uploaded yet</p>
              <p className="text-xs text-gray-600">Drag & drop video files or click Upload</p>
              <p className="text-xs text-gray-700 mt-1">Supports MP4, WebM</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {uploadedVideos.map((asset) => (
                <div
                  key={asset.id}
                  className="relative rounded-lg overflow-hidden group cursor-pointer border border-[#3a3a3a] bg-[#2a2a2a]"
                  onClick={() => addToCanvas(asset.id)}
                >
                  <div className="aspect-video bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
                    <Film size={24} className="text-gray-600" />
                  </div>
                  {asset.duration != null && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white font-mono">
                      {formatDuration(Math.round(asset.duration))}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCanvas(asset.id)
                      }}
                      className="p-1.5 rounded bg-[#4a7eff] text-white hover:bg-[#5a8aff] transition-colors"
                      title="Add to canvas"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeAsset(asset.id)
                      }}
                      className="p-1.5 rounded bg-[#3a3a3a] text-gray-300 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="p-1.5">
                    <div className="text-xs font-medium text-white truncate">{asset.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  )
}

// ── Sparkles icon (inline to avoid import conflict) ──────────────────────────
function Sparkles({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

// ── Video Card ───────────────────────────────────────────────────────────────

function PixabayVideoCard({
  hit,
  isDownloading,
  isImported,
  onImport,
}: {
  hit: PixabayVideoHit
  isDownloading: boolean
  isImported: boolean
  onImport: () => void
}) {
  const thumbnail = hit.videos.tiny?.thumbnail || hit.videos.small?.thumbnail || ''

  return (
    <div
      className="relative rounded-lg overflow-hidden group cursor-pointer"
      onClick={() => !isDownloading && !isImported && onImport()}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-[#1e1e1e] overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={hit.tags}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={24} className="text-gray-600" />
          </div>
        )}
      </div>

      {/* Duration badge */}
      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white font-mono">
        {formatDuration(hit.duration)}
      </div>

      {/* Downloading overlay */}
      {isDownloading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 z-10">
          <Loader2 size={16} className="animate-spin text-[#4a7eff]" />
          <span className="text-[10px] text-[#4a7eff]">Adding...</span>
        </div>
      )}

      {/* Imported check */}
      {isImported && !isDownloading && (
        <div className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-green-500">
          <Check size={8} className="text-white" />
        </div>
      )}
    </div>
  )
}
