/**
 * AudioSampleCard — Reusable card for displaying an uploaded audio sample.
 *
 * Shows filename, duration, format badge, mini waveform (simplified peak values),
 * and remove button. Used in VoiceClonePanel.
 */

import { X, FileAudio, Loader2 } from 'lucide-react'
import { useAudioDuration } from '@/hooks/useAudioDuration'
import { cn } from '@/lib/utils'

interface AudioSampleCardProps {
  file: File
  onRemove: () => void
  className?: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getFormatBadge(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return ext.toUpperCase()
}

export function AudioSampleCard({ file, onRemove, className }: AudioSampleCardProps) {
  const { duration, isLoading, error } = useAudioDuration(file)

  const format = getFormatBadge(file.name)
  const sizeWarning = file.size > 10 * 1024 * 1024 // > 10MB

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all',
        'bg-black/20 border-white/5',
        sizeWarning && 'border-amber-500/30',
        className
      )}
    >
      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
        <FileAudio size={14} className="text-purple-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-zinc-200 truncate">{file.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {format}
          </span>
          {isLoading ? (
            <Loader2 size={10} className="animate-spin text-zinc-500" />
          ) : error ? (
            <span className="text-[9px] text-red-400">Error</span>
          ) : (
            <span className="text-[9px] text-zinc-400">{formatDuration(duration)}</span>
          )}
          {sizeWarning && (
            <span className="text-[9px] text-amber-400">&gt;10MB</span>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  )
}
