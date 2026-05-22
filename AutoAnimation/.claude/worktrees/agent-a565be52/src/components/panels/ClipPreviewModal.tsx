/**
 * ClipPreviewModal — Modal that plays a sliced video preview with rewritten hook.
 */

import { X, Sparkles, Download } from 'lucide-react'
import type { ExtractedClip } from '@/services/clipExtractor'
import type { ClipRank } from '@/services/clipRanker'

interface ClipPreviewModalProps {
  clip: ExtractedClip
  rank: ClipRank | null
  onClose: () => void
  onGenerateShort: () => void
}

export function ClipPreviewModal({ clip, rank, onClose, onGenerateShort }: ClipPreviewModalProps) {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">{clip.title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video preview */}
        <div className="aspect-video bg-black relative">
          {clip.videoPreviewUrl ? (
            <video
              src={clip.videoPreviewUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600 text-xs">
              No preview available
            </div>
          )}
          {/* Hook overlay */}
          {clip.hookRewrite && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-xs text-white/90 italic">&ldquo;{clip.hookRewrite}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          {/* Timecodes */}
          <div className="flex items-center gap-4 text-[10px] text-zinc-500">
            <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
            <span>{Math.round(clip.duration)}s</span>
            {rank && <span>Score: {rank.compositeScore}/100</span>}
          </div>

          {/* Transcript excerpt */}
          <p className="text-[11px] text-zinc-400 line-clamp-3">
            {clip.segments.map((s) => s.text.trim()).join(' ')}
          </p>

          {/* Score breakdown */}
          {rank && (
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(rank.breakdown).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-[9px] text-zinc-600">{key.replace('Score', '')}</div>
                  <div className="text-xs text-zinc-300">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onGenerateShort}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-2 transition-colors"
            >
              <Sparkles size={12} /> Generate Short
            </button>
            {clip.videoPreviewUrl && (
              <a
                href={clip.videoPreviewUrl}
                download={`${clip.title}.mp4`}
                className="flex items-center justify-center gap-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 transition-colors"
              >
                <Download size={12} /> Quick Export
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
