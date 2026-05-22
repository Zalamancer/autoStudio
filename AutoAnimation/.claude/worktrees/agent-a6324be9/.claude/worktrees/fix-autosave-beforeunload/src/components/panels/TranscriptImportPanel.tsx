/**
 * TranscriptImportPanel — Upload audio/video → multi-provider transcript → rich editor.
 *
 * Major overhaul from the original:
 * - Provider selection (Whisper/Deepgram/AssemblyAI)
 * - Diarization toggle
 * - Language selection
 * - Rich transcript editor with word-level interaction
 * - Speaker management
 * - Search bar
 * - Export (SRT, VTT)
 * - Generate Captions button
 * - Silence removal section
 * - Smart Zoom section
 */

import { useRef, useState } from 'react'
import {
  FileAudio, Loader2, Upload, Trash2,
  Import, Download, Captions, Scissors, ZoomIn,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { TranscriptEditor } from '@/components/panels/TranscriptEditor'
import { TranscriptSearchBar } from '@/components/panels/TranscriptSearchBar'
import { SpeakerManager } from '@/components/panels/SpeakerManager'
import { SilenceRemovalPanel } from '@/components/panels/SilenceRemovalPanel'
import { SmartZoomPanel } from '@/components/panels/SmartZoomPanel'
// TranscriptionOptions type is used implicitly via the store

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

type CollapsibleSection = 'speakers' | 'cleanup' | 'smartzoom'

export function TranscriptImportPanel() {
  const {
    fileName, isTranscribing, error, editedSegments, result, speakers,
    transcriptionOptions,
    setFile, setTranscriptionOptions, transcribe, importToProject, generateCaptions,
    exportAsSRT, exportAsVTT, reset,
  } = useTranscriptStore(
    useShallow((s) => ({
      fileName: s.fileName,
      isTranscribing: s.isTranscribing,
      error: s.error,
      editedSegments: s.editedSegments,
      result: s.result,
      speakers: s.speakers,
      transcriptionOptions: s.transcriptionOptions,
      setFile: s.setFile,
      setTranscriptionOptions: s.setTranscriptionOptions,
      transcribe: s.transcribe,
      importToProject: s.importToProject,
      generateCaptions: s.generateCaptions,
      exportAsSRT: s.exportAsSRT,
      exportAsVTT: s.exportAsVTT,
      reset: s.reset,
    })),
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedSections, setExpandedSections] = useState<Set<CollapsibleSection>>(new Set())

  const toggleSection = (section: CollapsibleSection) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) setFile(file)
  }

  const handleExport = (format: 'srt' | 'vtt') => {
    const content = format === 'srt' ? exportAsSRT() : exportAsVTT()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none flex items-center justify-between min-h-[49px] px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <FileAudio size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Transcription</h3>
        </div>
        {(fileName || result) && (
          <button
            onClick={reset}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            title="Reset"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Upload zone */}
      {!fileName && !result && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full cursor-pointer border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
          >
            <Upload size={28} className="mx-auto text-zinc-500 mb-3" />
            <p className="text-sm font-medium text-zinc-300 mb-1">Upload audio or video</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              MP3, WAV, M4A, MP4, WebM — up to 100MB
            </p>
            <p className="text-[10px] text-zinc-600 mt-2">
              20 credits per transcription
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* File selected — provider selection and transcribe */}
      {fileName && !result && !isTranscribing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FileAudio size={20} className="text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-zinc-300">{fileName}</p>

          {/* Provider selector */}
          <div className="w-full space-y-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Provider</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['whisper', 'deepgram', 'assemblyai'] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => setTranscriptionOptions({ provider })}
                  className={cn(
                    'py-1.5 rounded-lg text-[10px] font-medium border transition-all',
                    transcriptionOptions.provider === provider
                      ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                      : 'bg-zinc-800/40 border-white/5 text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {provider === 'whisper' ? 'Whisper' : provider === 'deepgram' ? 'Deepgram' : 'AssemblyAI'}
                </button>
              ))}
            </div>
          </div>

          {/* Diarization toggle */}
          <div className="w-full flex items-center justify-between px-1">
            <span className="text-[10px] text-zinc-400">Speaker diarization</span>
            <button
              onClick={() => setTranscriptionOptions({ diarize: !transcriptionOptions.diarize })}
              className={cn(
                'w-8 h-4 rounded-full transition-colors relative',
                transcriptionOptions.diarize ? 'bg-cyan-500' : 'bg-zinc-700',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all',
                  transcriptionOptions.diarize ? 'left-4.5' : 'left-0.5',
                )}
              />
            </button>
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <button
            onClick={() => transcribe()}
            className="w-full px-4 py-2 rounded-xl text-xs font-medium bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all"
          >
            Transcribe (20 credits)
          </button>
        </div>
      )}

      {/* Transcribing */}
      {isTranscribing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 size={24} className="animate-spin text-cyan-400 mb-3" />
          <p className="text-xs text-zinc-400">
            Transcribing with {transcriptionOptions.provider === 'deepgram' ? 'Deepgram' : transcriptionOptions.provider === 'assemblyai' ? 'AssemblyAI' : 'Whisper'}...
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">This may take a minute for longer files</p>
        </div>
      )}

      {/* Transcript results */}
      {result && editedSegments.length > 0 && (
        <>
          {/* Info bar */}
          <div className="flex-none flex items-center justify-between px-3 py-1.5 border-b border-white/5">
            <span className="text-[10px] text-zinc-500">
              {editedSegments.length} segments · {result.language.toUpperCase()} · {formatTime(result.duration)}
              {speakers.length > 0 && ` · ${speakers.length} speakers`}
            </span>
          </div>

          {/* Search bar */}
          <div className="flex-none px-2 pt-2">
            <TranscriptSearchBar />
          </div>

          {/* Editable transcript */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            <TranscriptEditor />
          </div>

          {/* Collapsible sections */}
          <div className="flex-none border-t border-white/5">
            {/* Speaker Manager */}
            {speakers.length > 0 && (
              <CollapsibleHeader
                title="Speakers"
                isExpanded={expandedSections.has('speakers')}
                onToggle={() => toggleSection('speakers')}
              />
            )}
            {expandedSections.has('speakers') && speakers.length > 0 && (
              <div className="px-2 pb-2">
                <SpeakerManager />
              </div>
            )}

            {/* Clean Up (Silence Removal) */}
            <CollapsibleHeader
              title="Clean Up"
              icon={Scissors}
              isExpanded={expandedSections.has('cleanup')}
              onToggle={() => toggleSection('cleanup')}
            />
            {expandedSections.has('cleanup') && (
              <div className="px-2 pb-2">
                <SilenceRemovalPanel />
              </div>
            )}

            {/* Smart Zoom */}
            <CollapsibleHeader
              title="Smart Zoom"
              icon={ZoomIn}
              isExpanded={expandedSections.has('smartzoom')}
              onToggle={() => toggleSection('smartzoom')}
            />
            {expandedSections.has('smartzoom') && (
              <div className="px-2 pb-2">
                <SmartZoomPanel />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex-none p-3 border-t border-white/5 space-y-2">
            {/* Generate Captions */}
            <button
              onClick={generateCaptions}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 transition-all"
            >
              <Captions size={14} />
              Generate Captions
            </button>

            {/* Export */}
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('srt')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all"
              >
                <Download size={10} />
                SRT
              </button>
              <button
                onClick={() => handleExport('vtt')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all"
              >
                <Download size={10} />
                VTT
              </button>
            </div>

            {/* Import to project */}
            <button
              onClick={importToProject}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Import size={14} />
              Import {editedSegments.length} lines to project
            </button>
          </div>
        </>
      )}

      {/* Empty result */}
      {result && editedSegments.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-zinc-500">No speech detected in the audio.</p>
        </div>
      )}
    </div>
  )
}

function CollapsibleHeader({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
}: {
  title: string
  icon?: typeof Scissors
  isExpanded: boolean
  onToggle: () => void
}) {
  const Chevron = isExpanded ? ChevronDown : ChevronRight
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5"
    >
      <Chevron size={12} className="text-zinc-500" />
      {Icon && <Icon size={12} className="text-zinc-400" />}
      <span className="text-[11px] font-medium text-zinc-400">{title}</span>
    </button>
  )
}
