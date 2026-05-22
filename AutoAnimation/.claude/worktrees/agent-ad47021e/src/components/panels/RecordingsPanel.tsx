import { useState, useCallback, useRef, useMemo } from 'react'
import {
  Film,
  Download,
  Share2,
  Trash2,
  Pencil,
  Check,
  X,
  Clock,
  HardDrive,
  Play,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { useRecordingsStore, type Recording } from '@/stores/useRecordingsStore'
import { useEditorStore, useTimelineStore, useVideoLayerStore, useCanvasStore } from '@/stores'
import { formatFileSize } from '@/services/videoExport'
import { getRecordingBlob } from '@/services/recordingsDB'

const PAGE_SIZE = 20

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

function RecordingCard({ recording }: { recording: Recording }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(recording.name)
  const [hovering, setHovering] = useState(false)
  const [aspectWarning, setAspectWarning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { renameRecording, removeRecording } = useRecordingsStore()
  const { setShareModalOpen, setShareRecordingId, setAnalyticsModalOpen, setAnalyticsRecordingId } = useEditorStore()

  const handleRename = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== recording.name) {
      renameRecording(recording.id, trimmed)
    }
    setIsEditing(false)
  }, [editName, recording.id, recording.name, renameRecording])

  const handleShare = useCallback(() => {
    setShareRecordingId(recording.id)
    setShareModalOpen(true)
  }, [recording.id, setShareRecordingId, setShareModalOpen])

  const handleAnalytics = useCallback(() => {
    setAnalyticsRecordingId(recording.id)
    setAnalyticsModalOpen(true)
  }, [recording.id, setAnalyticsRecordingId, setAnalyticsModalOpen])

  const handleDownload = useCallback(async () => {
    let url = recording.videoUrl
    if (!url) {
      const blob = await getRecordingBlob(recording.id)
      if (!blob) return
      url = URL.createObjectURL(blob)
    }
    const a = document.createElement('a')
    a.href = url
    a.download = `${recording.name}.${recording.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    if (url !== recording.videoUrl) URL.revokeObjectURL(url)
  }, [recording])

  const handleAddToCanvas = useCallback(async () => {
    let url = recording.videoUrl
    if (!url) {
      const blob = await getRecordingBlob(recording.id)
      if (!blob) {
        console.warn('[RecordingsPanel] No blob found for recording', recording.id)
        return
      }
      url = URL.createObjectURL(blob)
    }

    // Aspect ratio mismatch warning
    const { canvasWidth, canvasHeight } = useCanvasStore.getState()
    if (recording.width && recording.height && canvasWidth && canvasHeight) {
      const recAR = recording.width / recording.height
      const canvasAR = canvasWidth / canvasHeight
      if (Math.abs(recAR - canvasAR) / canvasAR > 0.05) {
        setAspectWarning(true)
        setTimeout(() => setAspectWarning(false), 3500)
      }
    }

    const timelineState = useTimelineStore.getState()
    const fps = recording.fps || timelineState.fps || 30
    const totalFrames = Math.round(recording.durationSec * fps)
    const videoId = `recording-${recording.id}-${Date.now()}`

    // Add clip to timeline
    timelineState.addClip('video-1', {
      id: videoId,
      trackId: 'video-1',
      startFrame: 0,
      endFrame: totalFrames,
      sourceId: url,
      sourceInPoint: 0,
      sourceOutPoint: totalFrames,
      name: recording.name,
      color: '#a855f7',
    })

    // Extend timeline if recording is longer than current duration
    if (totalFrames > timelineState.totalFrames) {
      timelineState.setTotalFrames(totalFrames)
    }

    // Add to canvas video layer so it renders
    useVideoLayerStore.getState().addVideo({
      id: `canvas-${videoId}`,
      sourceUrl: url,
      name: recording.name,
      prompt: recording.projectName || 'Imported Recording',
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 3,
      visible: true,
      loop: false,
      durationSeconds: recording.durationSec,
      fps,
      width: recording.width,
      height: recording.height,
    })

    console.log('[RecordingsPanel] Added recording to canvas:', videoId, 'url:', url.slice(0, 60))
  }, [recording])

  const handleDelete = useCallback(() => {
    if (!window.confirm('Delete this recording?')) return
    removeRecording(recording.id)
  }, [recording.id, removeRecording])

  const handleMouseEnter = useCallback(() => {
    setHovering(true)
    if (videoRef.current && recording.videoUrl) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => { })
    }
  }, [recording.videoUrl])

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [])

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors">
      {/* Thumbnail / Video preview */}
      <div
        className="relative aspect-video bg-zinc-900 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {recording.videoUrl ? (
          <>
            {/* Thumbnail shown when not hovering */}
            {recording.thumbnailUrl && !hovering && (
              <img
                src={recording.thumbnailUrl}
                alt={recording.name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {/* Video for hover preview */}
            <video
              ref={videoRef}
              src={recording.videoUrl}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity ${hovering ? 'opacity-100' : 'opacity-0'}`}
              muted
              loop
              playsInline
            />
            {!hovering && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-2 rounded-full bg-black/50 text-white/70">
                  <Play size={20} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
            <Film size={32} />
          </div>
        )}

        {/* Format badge */}
        <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-zinc-300 uppercase">
          {recording.format}
        </span>

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-zinc-300">
          {formatDuration(recording.durationSec)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Name */}
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
            <button onClick={handleRename} className="p-1 text-green-400 hover:text-green-300">
              <Check size={14} />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-1 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          </div>
        ) : (
          <h3 className="text-sm font-medium text-white truncate" title={recording.name}>
            {recording.name}
          </h3>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDate(recording.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive size={10} />
            {formatFileSize(recording.fileSize)}
          </span>
          <span>{recording.width}x{recording.height}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={handleAddToCanvas}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
            title="Add to Canvas"
          >
            <Plus size={13} />
            Canvas
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-700/60 rounded transition-colors"
            title="Download"
          >
            <Download size={13} />
            Download
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            title="Share"
          >
            <Share2 size={13} />
            Share
          </button>
          <button
            onClick={handleAnalytics}
            className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
            title="Analytics"
          >
            <BarChart3 size={13} />
          </button>
          <button
            onClick={() => { setEditName(recording.name); setIsEditing(true) }}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/60 rounded transition-colors"
            title="Rename"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Aspect ratio mismatch toast */}
      {aspectWarning && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] animate-pulse z-10">
          <AlertTriangle size={12} className="shrink-0" />
          <span>Aspect ratio differs from canvas</span>
        </div>
      )}
    </div>
  )
}

export function RecordingsPanel() {
  const recordings = useRecordingsStore((s) => s.recordings)
  const [page, setPage] = useState(0)

  // Reset to page 0 when the recordings list changes length
  const prevLengthRef = useRef(recordings.length)
  if (prevLengthRef.current !== recordings.length) {
    prevLengthRef.current = recordings.length
    if (page !== 0) setPage(0)
  }

  const totalPages = Math.max(1, Math.ceil(recordings.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)

  const pageRecordings = useMemo(
    () => recordings.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [recordings, safePage],
  )

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <div className="p-4 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/5 mb-4">
          <Film size={40} className="text-zinc-600" />
        </div>
        <h3 className="text-sm font-medium text-zinc-400 mb-1">No recordings yet</h3>
        <p className="text-xs text-zinc-500 max-w-[240px]">
          Export your first video from the Export panel. All exports are automatically saved here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{recordings.length} recording{recordings.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pageRecordings.map((rec) => (
          <RecordingCard key={rec.id} recording={rec} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-zinc-400">
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
