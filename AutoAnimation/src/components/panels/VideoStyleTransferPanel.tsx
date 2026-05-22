/**
 * Video Style Transfer Panel — AI-powered video style transformation.
 * Upload a source video, choose a target style, adjust intensity, and generate.
 */

import { useCallback, useRef, useState } from 'react'
import { Sparkles, Upload, Loader2, X, Download, Plus } from 'lucide-react'
import { PanelSlider, PanelDropZone } from '@/components/ui/panel-controls'
import { useStyleTransferStore } from '@/stores/useStyleTransferStore'
import { transferVideoStyle, STYLE_OPTIONS } from '@/services/styleTransfer'
import { useMediaStore } from '@/stores/useMediaStore'
import { saveMediaBlob } from '@/services/mediaDB'
import { cn } from '@/lib/utils'
import { logger } from '@/utils/logger'

export function VideoStyleTransferPanel() {
  const videoInputRef = useRef<HTMLInputElement>(null)

  const sourceVideoUrl = useStyleTransferStore((s) => s.sourceVideoUrl)
  const sourceVideoBlob = useStyleTransferStore((s) => s.sourceVideoBlob)
  const targetStyle = useStyleTransferStore((s) => s.targetStyle)
  const intensity = useStyleTransferStore((s) => s.intensity)
  const isProcessing = useStyleTransferStore((s) => s.isProcessing)
  const progress = useStyleTransferStore((s) => s.progress)
  const statusMessage = useStyleTransferStore((s) => s.statusMessage)
  const resultVideoUrl = useStyleTransferStore((s) => s.resultVideoUrl)
  const resultVideoBlob = useStyleTransferStore((s) => s.resultVideoBlob)
  const error = useStyleTransferStore((s) => s.error)

  const setSourceVideo = useStyleTransferStore((s) => s.setSourceVideo)
  const clearSourceVideo = useStyleTransferStore((s) => s.clearSourceVideo)
  const setTargetStyle = useStyleTransferStore((s) => s.setTargetStyle)
  const setIntensity = useStyleTransferStore((s) => s.setIntensity)
  const setProcessing = useStyleTransferStore((s) => s.setProcessing)
  const setResult = useStyleTransferStore((s) => s.setResult)
  const setError = useStyleTransferStore((s) => s.setError)

  const handleVideoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      setSourceVideo(file)
    },
    [setSourceVideo],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (!file || !file.type.startsWith('video/')) return
      setSourceVideo(file)
    },
    [setSourceVideo],
  )

  const handleStartTransfer = useCallback(async () => {
    if (!sourceVideoBlob || isProcessing) return

    setProcessing(true)
    setError(null)

    try {
      const result = await transferVideoStyle({
        videoBlob: sourceVideoBlob,
        style: targetStyle,
        intensity,
      })
      setResult(result.videoBlob)
    } catch (err) {
      logger.error('[StyleTransfer] Error:', err)
      setError(err instanceof Error ? err.message : 'Style transfer failed')
    }
  }, [sourceVideoBlob, isProcessing, targetStyle, intensity, setProcessing, setError, setResult])

  const handleAddToTimeline = useCallback(async () => {
    if (!resultVideoBlob) return
    const assetId = `styled-video-${Date.now()}`
    const blobUrl = URL.createObjectURL(resultVideoBlob)

    await saveMediaBlob(assetId, resultVideoBlob)
    const mediaStore = useMediaStore.getState()
    mediaStore.addAsset(
      {
        id: assetId,
        name: `Style Transfer (${targetStyle})`,
        type: 'video/mp4',
        size: resultVideoBlob.size,
        category: 'video',
        url: blobUrl,
        addedAt: Date.now(),
      },
      resultVideoBlob,
    )
    mediaStore.addToCanvas(assetId)
  }, [resultVideoBlob, targetStyle])

  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Hidden file input */}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          onChange={handleVideoSelect}
          className="hidden"
        />

        {/* Video preview / drop zone */}
        {sourceVideoUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-panel-border">
            <video
              src={sourceVideoUrl}
              controls
              className="w-full max-h-32 object-contain bg-black"
            />
            <button
              onClick={clearSourceVideo}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-gray-300 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <PanelDropZone
            icon={Upload}
            label="Drop a video or click to upload"
            isDragging={isDragging}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              setIsDragging(false)
              handleDrop(e)
            }}
            onClick={() => videoInputRef.current?.click()}
          />
        )}

        {/* Style picker + controls (shown after video upload) */}
        {sourceVideoUrl && (
          <>
            {/* Target Style */}
            <div>
              <span className="text-xs text-zinc-400 mb-1.5 block">Target Style</span>
              <div className="space-y-1">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setTargetStyle(s.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-left transition-colors border flex items-center gap-2',
                      targetStyle === s.value
                        ? 'bg-accent/10 border-accent/30'
                        : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded shrink-0 border border-white/10"
                      style={{ backgroundColor: s.preview }}
                    />
                    <span className="text-xs font-medium text-gray-200">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <PanelSlider
              label="Intensity"
              value={Math.round(intensity * 100)}
              onChange={(v) => setIntensity(Math.min(1, Math.max(0, v / 100)))}
              min={0}
              max={100}
              step={5}
              suffix="%"
            />

            {/* Start button */}
            <button
              onClick={handleStartTransfer}
              disabled={isProcessing}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isProcessing
                  ? 'bg-accent/20 text-accent'
                  : 'bg-accent text-white hover:bg-[#5a8eff]',
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {statusMessage || `${progress}%`}
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Transform Video
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span className="text-xs text-red-400">{error}</span>
              </div>
            )}

            {/* Result */}
            {resultVideoUrl && !isProcessing && (
              <div className="bg-panel-bg rounded-lg p-3 space-y-2">
                <video
                  src={resultVideoUrl}
                  controls
                  loop
                  className="w-full rounded border border-panel-border"
                />
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={resultVideoUrl}
                    download={`styled-${targetStyle}.mp4`}
                    className="py-1.5 rounded-lg bg-panel-surface text-xs text-white flex items-center justify-center gap-1.5 hover:bg-panel-surface-hover transition-colors"
                  >
                    <Download size={12} />
                    Download
                  </a>
                  <button
                    onClick={handleAddToTimeline}
                    className="py-1.5 rounded-lg bg-accent text-xs text-white flex items-center justify-center gap-1.5 hover:bg-[#5a8eff] transition-colors"
                  >
                    <Plus size={12} />
                    To Timeline
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
