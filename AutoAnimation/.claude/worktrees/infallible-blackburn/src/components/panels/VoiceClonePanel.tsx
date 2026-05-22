/**
 * VoiceClonePanel — Voice cloning UI (Cinema standard).
 *
 * Two tabs:
 *   Clone  — workflow: upload samples -> name -> clone -> result
 *   Library — browse/manage cloned voices
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import {
  Upload,
  Mic,
  Trash2,
  Loader2,
  Plus,
  AlertCircle,
  AlertTriangle,
  Play,
  Square,
  CheckCircle,
  Search,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { getElevenLabsService } from '@/services/elevenlabs'
import { AudioSampleCard } from '@/components/ui/AudioSampleCard'
import { CreditCostTag } from '@/components/credits/CreditCostTag'

const ACCEPTED_FORMATS = '.mp3,.wav,.m4a,.ogg,.webm'
const SUPPORTED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.webm', '.ogg']
const MAX_FILES = 25
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MIN_TOTAL_DURATION = 60 // seconds
const PREVIEW_PHRASE = 'Hello, this is my cloned voice. How does it sound?'

const TABS = [
  { id: 'clone', label: 'Clone', icon: Mic },
  { id: 'library', label: 'Library', icon: BookOpen },
] as const
type TabId = (typeof TABS)[number]['id']

export function VoiceClonePanel() {
  const [activeTab, setActiveTab] = useState<TabId>('clone')
  const [search, setSearch] = useState('')

  const [files, setFiles] = useState<File[]>([])
  const [sampleDurations, setSampleDurations] = useState<Record<string, number>>({})
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [cloneProgress, setCloneProgress] = useState(0)
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null) // voice_id on success
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCloning = useVoiceStore((s) => s.isCloning)
  const cloneError = useVoiceStore((s) => s.cloneError)
  const clonedVoices = useVoiceStore((s) => s.clonedVoices)

  // Compute total duration
  const totalDuration = useMemo(() => Object.values(sampleDurations).reduce((a, b) => a + b, 0), [sampleDurations])

  // Validate samples
  const warnings = useMemo((): string[] => {
    const warns: string[] = []
    if (files.length > 0 && totalDuration > 0 && totalDuration < MIN_TOTAL_DURATION) {
      warns.push(`Total duration is ${Math.round(totalDuration)}s -- recommend at least 60s for decent quality.`)
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        warns.push(`${file.name} exceeds 10MB -- ElevenLabs may reject it.`)
      }
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        warns.push(`${file.name} -- unsupported format. Use wav, mp3, m4a, webm, or ogg.`)
      }
    }
    return warns
  }, [files, totalDuration])

  // Filter cloned voices for library tab
  const q = search.toLowerCase().trim()
  const filteredVoices = useMemo(() => {
    if (!q) return clonedVoices
    return clonedVoices.filter((v) => v.name.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q))
  }, [clonedVoices, q])

  const handleAddFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter((f) => /\.(mp3|wav|m4a|ogg|webm|flac)$/i.test(f.name))
    setFiles((prev) => {
      const combined = [...prev, ...arr]
      return combined.slice(0, MAX_FILES)
    })

    // Decode durations for each new file
    for (const file of arr) {
      const key = file.name + file.size
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const ctx = new AudioContext()
          const buffer = await ctx.decodeAudioData(reader.result as ArrayBuffer)
          await ctx.close()
          setSampleDurations((prev) => ({ ...prev, [key]: buffer.duration }))
        } catch {
          setSampleDurations((prev) => ({ ...prev, [key]: 0 }))
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        handleAddFiles(e.dataTransfer.files)
      }
    },
    [handleAddFiles],
  )

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => {
      const removed = prev[index]
      if (removed) {
        const key = removed.name + removed.size
        setSampleDurations((d) => {
          const next = { ...d }
          delete next[key]
          return next
        })
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleClone = useCallback(async () => {
    if (!name.trim() || files.length === 0) return
    setCloneProgress(0)
    const result = await useVoiceStore.getState().cloneVoice(name.trim(), description.trim(), files)
    if (result) {
      setCloneSuccess(result.voice_id)
    }
  }, [name, description, files])

  const handleDeleteClone = useCallback(async (voiceId: string) => {
    await useVoiceStore.getState().deleteClonedVoice(voiceId)
  }, [])

  // Preview
  const handlePreview = async () => {
    if (!cloneSuccess) return
    setIsPreviewLoading(true)
    try {
      const service = getElevenLabsService()
      const { audioUrl } = await service.generateSpeech(PREVIEW_PHRASE, cloneSuccess)
      const audio = new Audio(audioUrl)
      previewAudioRef.current = audio
      audio.onended = () => setIsPreviewPlaying(false)
      audio.play()
      setIsPreviewPlaying(true)
    } catch (err) {
      console.error('[VoiceClone] Preview failed:', err)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
      setIsPreviewPlaying(false)
    }
  }

  // Quality indicator
  const qualityColor =
    totalDuration >= 300 ? 'bg-[#4a7eff]' : totalDuration >= MIN_TOTAL_DURATION ? 'bg-amber-500' : 'bg-red-500'
  const qualityPercentage = Math.min(100, (totalDuration / 300) * 100)

  const totalSizeMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{
                  transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search Bar ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'library' ? 'Search cloned voices...' : 'Search samples...'}
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── Clone Tab ── */}
        {activeTab === 'clone' && (
          <>
            {cloneSuccess ? (
              /* Success State */
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#4a7eff]/10 border border-[#4a7eff]/30 rounded-lg">
                  <CheckCircle size={16} className="text-[#4a7eff] shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-gray-200">Voice cloned successfully!</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">
                      &quot;{name}&quot; is now available in your voice library.
                    </div>
                  </div>
                </div>

                <button
                  onClick={isPreviewPlaying ? stopPreview : handlePreview}
                  disabled={isPreviewLoading}
                  className={cn(
                    'w-full py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors',
                    isPreviewLoading
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-[#4a7eff] hover:bg-[#5a8aff] text-white',
                  )}
                >
                  {isPreviewLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isPreviewPlaying ? (
                    <Square size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                  {isPreviewLoading ? 'Generating...' : isPreviewPlaying ? 'Stop Preview' : 'Preview Voice'}
                </button>

                <button
                  onClick={() => {
                    setCloneSuccess(null)
                    setFiles([])
                    setName('')
                    setDescription('')
                  }}
                  className="w-full py-2 rounded-lg text-[11px] font-medium bg-[#2a2a2a] text-gray-400 border border-white/5 hover:bg-[#3a3a3a] hover:text-gray-200 transition-colors"
                >
                  Clone Another Voice
                </button>
              </div>
            ) : (
              /* Clone Form */
              <div className="space-y-3">
                {/* Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                    dragOver
                      ? 'border-[#4a7eff]/60 bg-[#4a7eff]/10'
                      : 'border-white/10 hover:border-white/20 bg-[#2a2a2a]',
                  )}
                >
                  <Upload size={24} className="mx-auto mb-2 text-zinc-500" />
                  <p className="text-xs text-zinc-400">Drop audio files here or click to browse</p>
                  <p className="text-[10px] text-zinc-600 mt-1">WAV, MP3, M4A, WebM, OGG — up to {MAX_FILES} files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FORMATS}
                    multiple
                    onChange={(e) => {
                      if (e.target.files) handleAddFiles(e.target.files)
                      e.target.value = ''
                    }}
                    className="hidden"
                  />
                </div>

                {/* File List with AudioSampleCard */}
                {files.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-500">
                      {files.length} file{files.length !== 1 ? 's' : ''} ({totalSizeMB.toFixed(1)} MB)
                    </p>
                    <div className="space-y-1">
                      {files.map((file, i) => (
                        <AudioSampleCard
                          key={`${file.name}-${file.size}-${i}`}
                          file={file}
                          onRemove={() => handleRemoveFile(i)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Indicator */}
                {files.length > 0 && totalDuration > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-400">Total Duration</span>
                      <span className="text-[10px] text-zinc-300">{Math.round(totalDuration)}s</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', qualityColor)}
                        style={{ width: `${qualityPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5 text-[8px] text-zinc-600">
                      <span>0s</span>
                      <span className="text-amber-400/70">60s min</span>
                      <span className="text-[#4a7eff]/70">5min+ ideal</span>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="space-y-1">
                    {warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-400">
                        <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Name & Description */}
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Voice Name *</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Custom Voice"
                      className="w-full bg-zinc-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#4a7eff]/30"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Description</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the voice characteristics..."
                      rows={2}
                      className="w-full bg-zinc-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#4a7eff]/30 resize-none"
                    />
                  </label>
                </div>

                {/* Clone Error */}
                {cloneError && (
                  <div className="flex items-start gap-1.5 text-[11px] text-red-400">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    {cloneError}
                  </div>
                )}

                {/* Progress bar during cloning */}
                {isCloning && cloneProgress > 0 && (
                  <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4a7eff] rounded-full transition-all"
                      style={{ width: `${cloneProgress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Library Tab ── */}
        {activeTab === 'library' && (
          <div className="space-y-1">
            {filteredVoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Mic size={28} className="mb-3" />
                <span className="text-sm text-gray-400">
                  {clonedVoices.length === 0 ? 'No cloned voices yet' : 'No voices found'}
                </span>
                <span className="text-xs text-gray-600 mt-1">
                  {clonedVoices.length === 0 ? 'Clone a voice from the Clone tab' : 'Try a different keyword'}
                </span>
              </div>
            ) : (
              filteredVoices.map((voice) => (
                <div
                  key={voice.voice_id}
                  className="w-full px-3 py-2.5 rounded-lg text-left transition-colors border bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a] flex items-center gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-200 truncate">{voice.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#4a7eff]/20 text-[#4a7eff] font-medium shrink-0">
                        CLONED
                      </span>
                    </div>
                    {voice.description && (
                      <div className="text-[9px] text-gray-500 mt-0.5 truncate">{voice.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteClone(voice.voice_id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors shrink-0"
                    title="Delete cloned voice"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {activeTab === 'clone' && !cloneSuccess && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <button
            onClick={handleClone}
            disabled={isCloning || !name.trim() || files.length === 0}
            className={cn(
              'w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors',
              isCloning || !name.trim() || files.length === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-[#4a7eff] hover:bg-[#5a8aff] text-white',
            )}
          >
            {isCloning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cloning Voice... {cloneProgress > 0 ? `${Math.round(cloneProgress * 100)}%` : ''}
              </>
            ) : (
              <>
                <Plus size={14} />
                Clone Voice
                <CreditCostTag operation="voice-clone" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
