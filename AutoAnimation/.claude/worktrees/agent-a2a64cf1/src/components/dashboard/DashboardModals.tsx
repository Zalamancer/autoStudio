import { useCallback, useEffect, useState } from 'react'
import { Film, Share2, BarChart3 } from 'lucide-react'
import { CompositionPlayer } from '@/engine'
import { ModalShell } from '@/components/modals/ModalShell'
import { VideoComposition } from '@/remotion/VideoComposition'
import type { VideoCompositionProps } from '@/remotion/types'
import { useRecordingsStore } from '@/stores/useRecordingsStore'
import { useEditorStore } from '@/stores'
import { getRecordingBlob } from '@/services/recordingsDB'

/**
 * Dashboard-scoped modals for video preview, share, and analytics.
 *
 * The preview modal supports two modes:
 * 1. **Remotion Player** — used when the video is still exporting (renders from compositionSnapshot)
 * 2. **HTML5 <video>** — used when the export is done (plays the recorded blob)
 */

interface DashboardModalsProps {
  // Video preview
  previewRecordingId: string | null
  previewCompositionSnapshot: VideoCompositionProps | null
  onClosePreview: () => void
  // Share
  shareRecordingId: string | null
  onCloseShare: () => void
  // Analytics
  analyticsRecordingId: string | null
  onCloseAnalytics: () => void
}

// ── Video Preview: Remotion Player (for pre-export preview) ──────────────

function RemotionPreviewContent({ compositionSnapshot }: { compositionSnapshot: VideoCompositionProps }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-3xl bg-black rounded-lg overflow-hidden">
        <CompositionPlayer
          component={VideoComposition as unknown as React.ComponentType<Record<string, unknown>>}
          inputProps={compositionSnapshot as unknown as Record<string, unknown>}
          durationInFrames={Math.max(compositionSnapshot.durationInFrames, 1)}
          fps={compositionSnapshot.fps}
          compositionWidth={compositionSnapshot.width}
          compositionHeight={compositionSnapshot.height}
          style={{
            width: '100%',
            maxHeight: '70vh',
            aspectRatio: `${compositionSnapshot.width}/${compositionSnapshot.height}`,
          }}
          controls
          autoPlay
          loop
          initialFrame={0}
          clickToPlay
        />
      </div>

      <div className="text-center text-xs text-zinc-500">
        {compositionSnapshot.width}x{compositionSnapshot.height} &middot;{' '}
        {compositionSnapshot.fps}fps &middot;{' '}
        {(compositionSnapshot.durationInFrames / compositionSnapshot.fps).toFixed(1)}s
        <span className="text-zinc-600 ml-2">(Live preview — export in progress)</span>
      </div>
    </div>
  )
}

// ── Video Preview: HTML5 video (for exported recordings) ──────────────────

function VideoPreviewContent({ recordingId }: { recordingId: string }) {
  const recording = useRecordingsStore((s) =>
    s.recordings.find((r) => r.id === recordingId),
  )
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (recording?.videoUrl) {
      setVideoUrl(recording.videoUrl)
      return
    }
    // Fallback: load from IndexedDB
    let revoke: string | null = null
    getRecordingBlob(recordingId).then((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        revoke = url
        setVideoUrl(url)
      }
    })
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [recordingId, recording?.videoUrl])

  if (!recording) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
        Recording not found
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-3xl bg-black rounded-lg overflow-hidden">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full"
            style={{
              maxHeight: '70vh',
              aspectRatio: `${recording.width}/${recording.height}`,
            }}
          />
        ) : (
          <div className="flex items-center justify-center py-24 text-zinc-600">
            Loading video...
          </div>
        )}
      </div>

      <div className="text-center text-xs text-zinc-500">
        {recording.name} &middot; {recording.format.toUpperCase()} &middot;{' '}
        {recording.width}x{recording.height} &middot;{' '}
        {recording.durationSec >= 60
          ? `${Math.floor(recording.durationSec / 60)}:${String(Math.round(recording.durationSec % 60)).padStart(2, '0')}`
          : `${recording.durationSec.toFixed(1)}s`}
      </div>
    </div>
  )
}

// ── Lazy-loaded Share & Analytics panels ──────────────────────────────────

function LazySharePanel() {
  const [SharePanel, setSharePanel] = useState<React.ComponentType | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    import('@/components/panels/SharePanel').then((mod) => {
      setSharePanel(() => mod.SharePanel)
    }).catch((err) => {
      console.error('[DashboardModals] Failed to load SharePanel:', err)
      setLoadError('Failed to load Share panel. Please refresh the page.')
    })
  }, [])

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-red-400">
        {loadError}
      </div>
    )
  }

  if (!SharePanel) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
        Loading...
      </div>
    )
  }

  return <SharePanel />
}

function LazyAnalyticsPanel() {
  const [AnalyticsPanel, setAnalyticsPanel] = useState<React.ComponentType | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    import('@/components/panels/AnalyticsPanel').then((mod) => {
      setAnalyticsPanel(() => mod.AnalyticsPanel)
    }).catch((err) => {
      console.error('[DashboardModals] Failed to load AnalyticsPanel:', err)
      setLoadError('Failed to load Analytics panel. Please refresh the page.')
    })
  }, [])

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-red-400">
        {loadError}
      </div>
    )
  }

  if (!AnalyticsPanel) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
        Loading...
      </div>
    )
  }

  return <AnalyticsPanel />
}

// ── Main export ──────────────────────────────────────────────────────────

export function DashboardModals({
  previewRecordingId,
  previewCompositionSnapshot,
  onClosePreview,
  shareRecordingId,
  onCloseShare,
  analyticsRecordingId,
  onCloseAnalytics,
}: DashboardModalsProps) {
  // When share modal opens, inject the recordingId into useEditorStore
  const handleOpenShare = useCallback(() => {
    if (shareRecordingId) {
      useEditorStore.getState().setShareRecordingId(shareRecordingId)
    }
  }, [shareRecordingId])

  // When analytics modal opens, inject the recordingId into useEditorStore
  const handleOpenAnalytics = useCallback(() => {
    if (analyticsRecordingId) {
      useEditorStore.getState().setAnalyticsRecordingId(analyticsRecordingId)
    }
  }, [analyticsRecordingId])

  useEffect(() => {
    if (shareRecordingId) handleOpenShare()
  }, [shareRecordingId, handleOpenShare])

  useEffect(() => {
    if (analyticsRecordingId) handleOpenAnalytics()
  }, [analyticsRecordingId, handleOpenAnalytics])

  // Determine if we should show the preview modal (either recording or snapshot)
  const showPreview = !!(previewRecordingId || previewCompositionSnapshot)

  // Check if the recording exists in the recordings store
  const hasRecordingBlob = useRecordingsStore((s) =>
    previewRecordingId ? s.recordings.some((r) => r.id === previewRecordingId) : false,
  )

  return (
    <>
      {/* Video Preview Modal */}
      <ModalShell
        open={showPreview}
        onClose={onClosePreview}
        title="Video Preview"
        icon={Film}
        iconColor="text-emerald-400"
        gradientFrom="from-emerald-900/20"
        size="full"
      >
        {/* If we have a recorded video, play it. Otherwise use Remotion Player from snapshot. */}
        {previewRecordingId && hasRecordingBlob ? (
          <VideoPreviewContent recordingId={previewRecordingId} />
        ) : previewCompositionSnapshot ? (
          <RemotionPreviewContent compositionSnapshot={previewCompositionSnapshot} />
        ) : null}
      </ModalShell>

      {/* Share Modal */}
      <ModalShell
        open={!!shareRecordingId}
        onClose={onCloseShare}
        title="Publish"
        icon={Share2}
        iconColor="text-blue-400"
        gradientFrom="from-blue-900/20"
        size="compact"
      >
        <LazySharePanel />
      </ModalShell>

      {/* Analytics Modal */}
      <ModalShell
        open={!!analyticsRecordingId}
        onClose={onCloseAnalytics}
        title="Analytics & Insights"
        icon={BarChart3}
        iconColor="text-purple-400"
        gradientFrom="from-purple-900/20"
        size="full"
      >
        <LazyAnalyticsPanel />
      </ModalShell>
    </>
  )
}
