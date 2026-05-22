import { useCallback } from 'react'
import { CompositionPlayer } from '@/engine'
import {
  Play,
  Download,
  Share2,
  BarChart3,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { VideoComposition } from '@/remotion/VideoComposition'
import type { VideoCompositionProps } from '@/remotion/types'
import { useRecordingsStore } from '@/stores/useRecordingsStore'
import { getRecordingBlob } from '@/services/recordingsDB'
import { getFileExtension, formatFileSize } from '@/services/videoExport'

interface ClipDoneActionsProps {
  compositionSnapshot: VideoCompositionProps | null
  recordingId: string | null
  isExporting: boolean
  exportError: string | null
  exportProgress: number
  onPlay: (recordingId: string, compositionSnapshot?: VideoCompositionProps | null) => void
  onShare: (recordingId: string) => void
  onInsights: (recordingId: string) => void
}

export function ClipDoneActions({
  compositionSnapshot,
  recordingId,
  isExporting,
  exportError,
  exportProgress,
  onPlay,
  onShare,
  onInsights,
}: ClipDoneActionsProps) {
  const recording = useRecordingsStore((s) =>
    s.recordings.find((r) => r.id === recordingId),
  )

  const handleDownload = useCallback(async () => {
    if (!recordingId || !recording) return
    try {
      let blobUrl = recording.videoUrl
      if (!blobUrl) {
        const blob = await getRecordingBlob(recordingId)
        if (blob) {
          blobUrl = URL.createObjectURL(blob)
        }
      }
      if (!blobUrl) return

      const ext = getFileExtension(recording.format)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `clip-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error('[ClipDoneActions] Download failed:', err)
    }
  }, [recordingId, recording])

  const handlePlay = useCallback(() => {
    if (recordingId) {
      onPlay(recordingId, compositionSnapshot)
    } else if (compositionSnapshot) {
      // No recording yet but we have a snapshot — open with composition preview
      onPlay('', compositionSnapshot)
    }
  }, [recordingId, compositionSnapshot, onPlay])

  // Nothing to show
  if (!compositionSnapshot && !recordingId && !isExporting && !exportError) {
    return null
  }

  const exportDone = !!recordingId && !isExporting

  return (
    <div className="space-y-3">
      {/* ── Remotion Player Preview (instant, from snapshot) ── */}
      {compositionSnapshot && (
        <div
          className="bg-black rounded-lg overflow-hidden cursor-pointer group relative"
          onClick={handlePlay}
        >
          <CompositionPlayer
            component={VideoComposition as unknown as React.ComponentType<Record<string, unknown>>}
            inputProps={compositionSnapshot as unknown as Record<string, unknown>}
            durationInFrames={Math.max(compositionSnapshot.durationInFrames, 1)}
            fps={compositionSnapshot.fps}
            compositionWidth={compositionSnapshot.width}
            compositionHeight={compositionSnapshot.height}
            style={{
              width: '100%',
              aspectRatio: `${compositionSnapshot.width}/${compositionSnapshot.height}`,
            }}
            controls
            autoPlay={false}
            loop
            initialFrame={0}
            clickToPlay
          />
        </div>
      )}

      {/* ── Export progress / status ── */}
      {isExporting && (
        <div className="space-y-1.5">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-blue-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              Exporting video...
            </span>
            <span className="text-zinc-500">{exportProgress}%</span>
          </div>
        </div>
      )}

      {exportDone && recording && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <Check size={12} />
          Export complete ({formatFileSize(recording.fileSize)})
        </div>
      )}

      {exportError && (
        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-red-300">Export failed: {exportError}</p>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Play size={14} />
          Play
        </button>
        <button
          onClick={handleDownload}
          disabled={!exportDone}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={!exportDone ? 'Waiting for export to finish...' : 'Download'}
        >
          <Download size={14} />
          Download
        </button>
        <button
          onClick={() => recordingId && onShare(recordingId)}
          disabled={!exportDone}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={!exportDone ? 'Waiting for export to finish...' : 'Publish'}
        >
          <Share2 size={14} />
          Publish
        </button>
        <button
          onClick={() => recordingId && onInsights(recordingId)}
          disabled={!exportDone}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={!exportDone ? 'Waiting for export to finish...' : 'Insights'}
        >
          <BarChart3 size={14} />
          Insights
        </button>
      </div>
    </div>
  )
}
