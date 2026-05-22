import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Mic,
  Play,
  Loader2,
  Volume2,
  Trash2,
  Sparkles,
  ListPlus,
  PlayCircle,
  Settings2,
  Square,
  Waves,
  UserPlus,
  Upload,
  X,
  AlertTriangle,
  Star,
  Clock,
  ChevronDown,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { useVoiceStore, useTimelineStore, useCharacterConfigStore } from '@/stores'
import { getGeminiService, hasGeminiService } from '@/services/gemini'
import { callElevenLabsProxy } from '@/services/aiProxy'
import { CustomSelect } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import type { CaptionStyle, ElevenLabsModelId } from '@/types/voice'

const PREVIEW_TEXT = 'Hello! This is a preview of my voice.'

/** Trending caption style presets shown in the panel */
const CAPTION_PRESET_PICKS = [
  { id: 'hormozi', name: 'Hormozi', fontSize: 1.3, position: 'center' as const },
  { id: 'mrbeast', name: 'MrBeast', fontSize: 1.4, position: 'bottom' as const },
  { id: 'tiktok-bold', name: 'TikTok', fontSize: 1.35, position: 'center' as const },
  { id: 'youtube-shorts', name: 'YT Shorts', fontSize: 1.4, position: 'center' as const },
  { id: 'karaoke-glow', name: 'Karaoke', fontSize: 1.1, position: 'bottom' as const },
  { id: 'neon-glow', name: 'Neon', fontSize: 1.1, position: 'bottom' as const },
  { id: 'bounce', name: 'Bounce', fontSize: 1.15, position: 'bottom' as const },
  { id: 'typewriter', name: 'Typewriter', fontSize: 0.95, position: 'bottom' as const },
  { id: 'classic', name: 'Classic', fontSize: 1, position: 'bottom' as const },
]

export function VoicesPanel() {
  const {
    isLoading,
    error,
    isApiKeyValid,
    availableVoices,
    selectedVoiceId,
    voiceSettings,
    script,
    generatedVoices,
    activeVoiceId,
    captionStyle,
    captionFontSize,
    captionPosition,
    clonedVoices,
    isCloning,
    cloneError,
    favoriteVoiceIds,
    recentVoiceIds,
    setScript,
    setSelectedVoice,
    setVoiceSettings,
    setCaptionStyle,
    setCaptionFontSize,
    setCaptionPosition,
    captionPresetId,
    setCaptionPreset,
    fetchVoices,
    generateVoice,
    setActiveVoice,
    removeGeneratedVoice,
    cloneVoice,
    deleteClonedVoice,
    clearError,
    toggleFavoriteVoice,
    scriptHistory,
  } = useVoiceStore()

  const fps = useTimelineStore((s) => s.fps)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const tracks = useTimelineStore((s) => s.tracks)
  const addTrack = useTimelineStore((state) => state.addTrack)
  const addClip = useTimelineStore((state) => state.addClip)
  const seekToFrame = useTimelineStore((state) => state.seekToFrame)
  const togglePlayback = useTimelineStore((state) => state.togglePlayback)
  const isPlaying = useTimelineStore((state) => state.isPlaying)

  // Get sprite labels from character config store
  const spriteLabels = useCharacterConfigStore((state) => state.spriteLabels)
  const savedImages = useCharacterConfigStore((state) => state.savedImages)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showScriptHistory, setShowScriptHistory] = useState(false)
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false)
  const voiceDropdownRef = useRef<HTMLDivElement>(null)
  const voiceTriggerRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null)
  const [showCloning, setShowCloning] = useState(false)
  const [cloneName, setCloneName] = useState('')
  const [cloneDescription, setCloneDescription] = useState('')
  const [cloneFiles, setCloneFiles] = useState<File[]>([])
  const [audioWarning, setAudioWarning] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [, setPreviewAudio] = useState<HTMLAudioElement | null>(null)
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)

  // Voice preview state
  const [previewCache] = useState<Record<string, string>>({})
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Close voice dropdown on click outside
  useEffect(() => {
    if (!voiceDropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        voiceDropdownRef.current &&
        !voiceDropdownRef.current.contains(target) &&
        voiceTriggerRef.current &&
        !voiceTriggerRef.current.contains(target)
      ) {
        setVoiceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [voiceDropdownOpen])

  // Position the portal dropdown when opened
  const openVoiceDropdown = useCallback(() => {
    if (voiceTriggerRef.current) {
      const rect = voiceTriggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setVoiceDropdownOpen((v) => !v)
  }, [])

  // Cleanup cached blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewCache).forEach((url) => URL.revokeObjectURL(url))
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
    }
  }, [])

  const handlePreviewVoice = useCallback(
    async (overrideVoiceId?: string) => {
      const voiceId = overrideVoiceId ?? selectedVoiceId
      if (!voiceId || isPreviewLoading) return

      // If already playing, stop playback
      if (isPreviewPlaying && previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current.currentTime = 0
        setIsPreviewPlaying(false)
        return
      }

      // Check cache first
      if (previewCache[voiceId]) {
        const audio = new Audio(previewCache[voiceId])
        previewAudioRef.current = audio
        setIsPreviewPlaying(true)
        audio.onended = () => {
          setIsPreviewPlaying(false)
          previewAudioRef.current = null
        }
        audio.onerror = () => {
          setIsPreviewPlaying(false)
          previewAudioRef.current = null
        }
        audio.play()
        return
      }

      // Generate preview via ElevenLabs TTS
      setIsPreviewLoading(true)
      try {
        const response = await callElevenLabsProxy(`text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: PREVIEW_TEXT,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: voiceSettings.stability,
              similarity_boost: voiceSettings.similarityBoost,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Preview failed: ${response.statusText}`)
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // Cache the result
        previewCache[voiceId] = audioUrl

        // Play immediately
        const audio = new Audio(audioUrl)
        previewAudioRef.current = audio
        setIsPreviewPlaying(true)
        audio.onended = () => {
          setIsPreviewPlaying(false)
          previewAudioRef.current = null
        }
        audio.onerror = () => {
          setIsPreviewPlaying(false)
          previewAudioRef.current = null
        }
        audio.play()
      } catch (err) {
        console.error('Voice preview error:', err)
      } finally {
        setIsPreviewLoading(false)
      }
    },
    [selectedVoiceId, isPreviewLoading, isPreviewPlaying, previewCache, voiceSettings],
  )

  // Validate audio file duration (ElevenLabs requires >= 10 seconds)
  const validateAudioFile = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const audio = new Audio(url)
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url)
        if (audio.duration < 10) {
          resolve(`"${file.name}" is ${audio.duration.toFixed(1)}s — minimum 10 seconds required`)
        } else {
          resolve(null)
        }
      })
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        resolve(`"${file.name}" could not be loaded — may not be a valid audio file`)
      })
    })
  }, [])

  const handleCloneFilesChange = useCallback(
    async (newFiles: File[]) => {
      setAudioWarning(null)
      const validFiles: File[] = []
      for (const file of newFiles) {
        const warning = await validateAudioFile(file)
        if (warning) {
          setAudioWarning(warning)
        } else {
          validFiles.push(file)
        }
      }
      setCloneFiles((prev) => [...prev, ...validFiles])
    },
    [validateAudioFile],
  )

  // In-browser recording for voice cloning
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'audio/webm' })
        setCloneFiles((prev) => [...prev, file])
        setRecordingTime(0)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch {
      setAudioWarning('Microphone access denied')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }, [])

  const handleGenerate = async () => {
    clearError()
    await generateVoice(fps)
  }

  const playPreview = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
    setPreviewAudio(audio)
  }

  // Auto-fetch voices on mount using env key
  useEffect(() => {
    fetchVoices()
  }, [])

  // AI rewrite handler — enhances script with expression cues
  const handleAiRewrite = async () => {
    if (!script.trim()) return

    setIsRewriting(true)
    setRewriteError(null)

    try {
      const service = getGeminiService()
      const result = await service.enhanceScript(script)
      setScript(result.rawScript)
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : 'AI rewrite failed')
    } finally {
      setIsRewriting(false)
    }
  }

  const hasGemini = hasGeminiService()

  return (
    <>
      <div className="flex flex-col flex-1">
        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-2 bg-red-600/10 text-red-400 text-xs rounded-lg">
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200 text-lg leading-none">
              &times;
            </button>
          </div>
        )}

        {/* ── Script ──────────────────────────────────────────────── */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-base font-semibold">Script</h2>
            <div className="flex items-center gap-1">
              {hasGemini && (
                <button
                  onClick={handleAiRewrite}
                  disabled={isRewriting || !script.trim()}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isRewriting || !script.trim()
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-panel-surface',
                  )}
                  title="AI rewrite — add expression cues [happy], [sad], etc."
                >
                  {isRewriting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                </button>
              )}
              <button
                onClick={() => setShowScriptHistory(!showScriptHistory)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  showScriptHistory ? 'bg-accent text-white' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
                )}
                title="Load previous script"
              >
                <Clock size={14} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            {rewriteError && <p className="text-xs text-red-400 mb-2">{rewriteError}</p>}
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your script here... Use the Scripts tab for AI generation"
              rows={4}
              className="w-full bg-panel-surface text-white text-sm px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-gray-600"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-gray-500 italic">
                {script.includes('[') && 'Expression cues will be stripped for voice generation'}
              </span>
              <span className="text-[10px] text-gray-500">{script.length} chars</span>
            </div>
          </div>

          {/* Script history dropdown */}
          {showScriptHistory && (
            <div className="space-y-1.5 pt-3 border-t border-white/5">
              <span className="text-gray-400 text-sm">Load Script</span>
              {scriptHistory.length === 0 && generatedVoices.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-3">
                  No scripts available. Generate scripts in the Scripts tab or generate voices to build history.
                </p>
              ) : (
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {scriptHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setScript(item.text)
                        setShowScriptHistory(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-panel-surface hover:bg-panel-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={10} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-white truncate">{item.topic}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-panel-surface-hover text-gray-500 shrink-0">
                          {item.style}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5 ml-4">{item.text}</p>
                    </button>
                  ))}
                  {generatedVoices
                    .filter((v) => v.script.trim())
                    .map((voice) => (
                      <button
                        key={`gen-${voice.id}`}
                        onClick={() => {
                          setScript(voice.script)
                          setShowScriptHistory(false)
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-panel-surface hover:bg-panel-surface-hover transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <Waves size={10} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-white truncate">{voice.voiceName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-panel-surface-hover text-gray-500 shrink-0">
                            {voice.audioDuration?.toFixed(1)}s
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5 ml-4">{voice.script}</p>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Voice Selection ─────────────────────────────────────── */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-base font-semibold">Voice Selection</h2>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                showAdvanced ? 'bg-accent text-white' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
              )}
              title="Voice settings"
            >
              <Settings2 size={14} />
            </button>
          </div>

          {/* Voice dropdown */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              {/* Custom dropdown trigger */}
              <div className="min-w-0 flex-1">
                <button
                  ref={voiceTriggerRef}
                  onClick={openVoiceDropdown}
                  disabled={!availableVoices || availableVoices.length === 0}
                  className={cn(
                    'w-full flex items-center gap-2 bg-panel-surface text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50',
                    voiceDropdownOpen ? 'ring-1 ring-accent' : 'hover:bg-[#333]',
                  )}
                >
                  <span className={cn('flex-1 text-left truncate', selectedVoiceId ? 'text-white' : 'text-gray-500')}>
                    {selectedVoiceId
                      ? (availableVoices?.find((v) => v.voice_id === selectedVoiceId)?.name ?? 'Unknown')
                      : 'Select a voice...'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn('shrink-0 text-gray-500 transition-transform', voiceDropdownOpen && 'rotate-180')}
                  />
                </button>
              </div>

              {/* Action buttons */}
              {selectedVoiceId && (
                <button
                  onClick={() => toggleFavoriteVoice(selectedVoiceId)}
                  className={cn(
                    'w-9 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
                    favoriteVoiceIds.includes(selectedVoiceId)
                      ? 'bg-accent text-white'
                      : 'bg-panel-surface text-gray-400 hover:text-white',
                  )}
                  title={favoriteVoiceIds.includes(selectedVoiceId) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={14} fill={favoriteVoiceIds.includes(selectedVoiceId) ? 'currentColor' : 'none'} />
                </button>
              )}
              <button
                onClick={() => handlePreviewVoice()}
                disabled={!selectedVoiceId || isPreviewLoading}
                className={cn(
                  'w-9 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
                  !selectedVoiceId || isPreviewLoading
                    ? 'bg-panel-surface text-gray-600 cursor-not-allowed'
                    : isPreviewPlaying
                      ? 'bg-accent text-white'
                      : 'bg-panel-surface text-gray-400 hover:text-white',
                )}
                title="Preview voice"
              >
                {isPreviewLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isPreviewPlaying ? (
                  <Square size={14} fill="currentColor" />
                ) : (
                  <Volume2 size={14} />
                )}
              </button>
            </div>
          </div>

          {/* Advanced Voice Settings */}
          {showAdvanced && (
            <div className="pt-3 border-t border-white/5">
              {/* Model */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs text-gray-400 w-24 shrink-0"
                  title="v3 converts [emotion] cues to expressive speech"
                >
                  Model
                </span>
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    value={voiceSettings.modelId ?? 'eleven_v3'}
                    onChange={(v) => setVoiceSettings({ modelId: v as ElevenLabsModelId })}
                    options={[
                      { value: 'eleven_v3', label: 'v3 Expressive' },
                      { value: 'eleven_multilingual_v2', label: 'Multilingual v2' },
                      { value: 'eleven_turbo_v2_5', label: 'Turbo v2.5' },
                      { value: 'eleven_flash_v2_5', label: 'Flash v2.5' },
                    ]}
                  />
                </div>
              </div>

              {/* Voice parameters */}
              <div className="space-y-2">
                <PanelSlider
                  label="Expressiveness"
                  value={Math.round((voiceSettings.style ?? 0) * 100)}
                  onChange={(v) => setVoiceSettings({ style: Math.min(1, Math.max(0, v / 100)) })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="%"
                />
                <PanelSlider
                  label="Stability"
                  value={Math.round(voiceSettings.stability * 100)}
                  onChange={(v) => setVoiceSettings({ stability: Math.min(1, Math.max(0, v / 100)) })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="%"
                />
                <PanelSlider
                  label="Similarity"
                  value={Math.round(voiceSettings.similarityBoost * 100)}
                  onChange={(v) => setVoiceSettings({ similarityBoost: Math.min(1, Math.max(0, v / 100)) })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="%"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── My Voices (Cloned) ──────────────────────────────────── */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-base font-semibold">My Voices</h2>
            <button
              onClick={() => setShowCloning(!showCloning)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showCloning ? 'bg-accent text-white' : 'bg-panel-surface text-gray-400 hover:text-white',
              )}
            >
              {showCloning ? 'Close' : 'Clone Voice'}
            </button>
          </div>

          {showCloning ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Upload a 10s–5m audio sample. Clear speech without background noise works best.
              </p>

              {/* Name */}
              <div>
                <span className="text-xs text-gray-400 mb-1 block">Name</span>
                <input
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="My Custom Voice"
                  className="w-full bg-panel-surface text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-gray-600"
                />
              </div>

              {/* Description */}
              <div>
                <span className="text-xs text-gray-400 mb-1 block">Description</span>
                <input
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                  placeholder="Voice characteristics..."
                  className="w-full bg-panel-surface text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-gray-600"
                />
              </div>

              {/* Audio Samples */}
              <div>
                <span className="text-xs text-gray-400 mb-1.5 block">Audio Samples</span>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label className="flex flex-col items-center justify-center flex-1 h-16 bg-panel-surface border-2 border-dashed border-panel-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
                      <Upload size={16} className="text-gray-500 mb-0.5" />
                      <span className="text-[10px] text-gray-500">Upload</span>
                      <input
                        type="file"
                        multiple
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleCloneFilesChange(Array.from(e.target.files))
                          }
                        }}
                      />
                    </label>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={cn(
                        'flex flex-col items-center justify-center flex-1 h-16 rounded-lg border-2 border-dashed transition-colors',
                        isRecording
                          ? 'bg-red-600/10 border-red-500/30 text-red-400'
                          : 'bg-panel-surface border-panel-border text-gray-500 hover:border-accent/50',
                      )}
                    >
                      {isRecording ? (
                        <>
                          <Square size={16} className="mb-0.5" />
                          <span className="text-[10px]">
                            {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Mic size={16} className="mb-0.5" />
                          <span className="text-[10px]">Record</span>
                        </>
                      )}
                    </button>
                  </div>
                  {cloneFiles.length > 0 && (
                    <div className="space-y-1">
                      {cloneFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs text-gray-400 bg-panel-surface rounded-lg px-2 py-1.5"
                        >
                          <span className="truncate flex-1">{file.name}</span>
                          <button
                            onClick={() => setCloneFiles(cloneFiles.filter((_, j) => j !== i))}
                            className="text-gray-600 hover:text-red-400 ml-2"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {audioWarning && (
                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{audioWarning}</span>
                </div>
              )}

              {cloneError && <p className="text-xs text-red-400 bg-red-600/10 rounded-lg p-2">{cloneError}</p>}

              <button
                onClick={async () => {
                  const result = await cloneVoice(cloneName, cloneDescription, cloneFiles)
                  if (result) {
                    setCloneName('')
                    setCloneDescription('')
                    setCloneFiles([])
                    setShowCloning(false)
                    setAudioWarning(null)
                  }
                }}
                disabled={isCloning || !cloneName.trim() || cloneFiles.length === 0}
                className={cn(
                  'w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors',
                  isCloning || !cloneName.trim() || cloneFiles.length === 0
                    ? 'bg-panel-surface text-gray-500 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-hover',
                )}
              >
                {isCloning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    Create Voice Clone
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {clonedVoices.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">No cloned voices yet</p>
              ) : (
                clonedVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer',
                      selectedVoiceId === voice.voice_id
                        ? 'bg-accent/15 text-white'
                        : 'bg-panel-surface text-gray-300 hover:bg-panel-surface-hover',
                    )}
                    onClick={() => setSelectedVoice(voice.voice_id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <UserPlus size={12} className="text-gray-400 shrink-0" />
                        <span className="text-sm font-medium truncate">{voice.name}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-medium shrink-0">
                          CLONED
                        </span>
                      </div>
                      {voice.description && (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5 ml-5">{voice.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedVoice(voice.voice_id)
                          handlePreviewVoice(voice.voice_id)
                        }}
                        className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-panel-surface transition-colors"
                        title="Preview voice"
                      >
                        <Play size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteClonedVoice(voice.voice_id)
                        }}
                        className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                        title="Delete cloned voice"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Captions & Style ────────────────────────────────────── */}
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white text-base font-semibold mb-4">Captions & Style</h2>

          {/* Caption mode */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400 w-14 shrink-0">Mode</span>
            <div className="flex-1 min-w-0">
              <CustomSelect
                value={captionStyle}
                onChange={(v) => setCaptionStyle(v as CaptionStyle)}
                options={[
                  { value: 'word-by-word', label: 'Word by Word' },
                  { value: 'sentence', label: 'Sentence' },
                  { value: 'karaoke', label: 'Karaoke' },
                ]}
              />
            </div>
          </div>

          {/* Caption Presets */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400 w-14 shrink-0">Preset</span>
            <div className="flex-1 min-w-0">
              <CustomSelect
                value={captionPresetId ?? ''}
                onChange={(v) => {
                  const preset = CAPTION_PRESET_PICKS.find((p) => p.id === v)
                  if (preset) {
                    setCaptionPreset(preset.id)
                    setCaptionFontSize(Math.round(48 * preset.fontSize))
                    if (preset.position) setCaptionPosition(preset.position)
                  }
                }}
                options={CAPTION_PRESET_PICKS.map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>
          </div>

          {/* Position */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400 w-14 shrink-0">Position</span>
            <div className="flex-1 grid grid-cols-3 gap-1">
              {(['top', 'center', 'bottom'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setCaptionPosition(pos)}
                  className={cn(
                    'py-1.5 rounded-lg text-[11px] font-medium transition-colors capitalize',
                    captionPosition === pos
                      ? 'bg-accent text-white'
                      : 'bg-panel-surface text-gray-400 hover:text-white',
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <PanelSlider
            label="Size"
            value={captionFontSize}
            onChange={(v) => setCaptionFontSize(Math.round(v))}
            min={12}
            max={120}
            step={1}
            suffix="px"
            compact
          />
        </div>

        {/* ── Generate ────────────────────────────────────────────── */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !script.trim() || !selectedVoiceId || !isApiKeyValid}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors',
              isLoading || !script.trim() || !selectedVoiceId || !isApiKeyValid
                ? 'bg-panel-surface text-gray-500 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-hover',
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Waves size={14} />
                Generate Voice + Lip Sync
                <CreditCostTag operation="elevenlabs-tts" />
              </>
            )}
          </button>
        </div>

        {/* ── History ─────────────────────────────────────────────── */}
        {generatedVoices && generatedVoices.length > 0 && (
          <div className="p-4 border-b border-white/5">
            <h2 className="text-white text-base font-semibold mb-4">History ({generatedVoices.length})</h2>

            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {generatedVoices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => setActiveVoice(voice.id)}
                  className={cn(
                    'px-3 py-2.5 rounded-lg transition-colors group cursor-pointer',
                    activeVoiceId === voice.id ? 'bg-accent/15' : 'bg-panel-surface hover:bg-panel-surface-hover',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white truncate">{voice.voiceName}</span>
                        {activeVoiceId === voice.id && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">"{voice.script}"</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                        <span>{voice.audioDuration?.toFixed(1)}s</span>
                        <span>·</span>
                        <span>{voice.visemeTimeline?.length || 0} phonemes</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          playPreview(voice.audioUrl)
                        }}
                        className="p-1.5 rounded-lg bg-panel-surface-hover hover:bg-[#4a4a4a] text-gray-400 hover:text-white transition-colors"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeGeneratedVoice(voice.id)
                        }}
                        className="p-1.5 rounded-lg bg-red-600/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activeVoiceId && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    seekToFrame(0)
                    if (!isPlaying) togglePlayback()
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-panel-surface text-white text-sm rounded-lg hover:bg-panel-surface-hover transition-colors"
                >
                  <PlayCircle size={14} />
                  {isPlaying ? 'Playing...' : 'Preview Sync'}
                </button>
                <button
                  onClick={() => {
                    const voice = generatedVoices.find((v) => v.id === activeVoiceId)
                    if (!voice) return
                    const startFrame = currentFrame
                    const durationFrames = Math.ceil(voice.audioDuration * fps)
                    const endFrame = startFrame + durationFrames
                    const timestamp = Date.now()
                    const partColors: Record<string, string> = {
                      eye: '#f59e0b',
                      eyebrow: '#eab308',
                      viseme: '#ec4899',
                      hair: '#8b5cf6',
                      body: '#06b6d4',
                      shirt: '#10b981',
                      pants: '#6366f1',
                      shoes: '#78716c',
                    }
                    const partTypes = ['eye', 'eyebrow', 'viseme', 'hair', 'body', 'shirt', 'pants', 'shoes'] as const
                    for (const partType of partTypes) {
                      const images = savedImages[partType] || []
                      if (images.length === 0) continue
                      const trackId = `${partType}-track-${timestamp}`
                      const existingTrack = tracks.find(
                        (t) => t.name === `${partType.charAt(0).toUpperCase() + partType.slice(1)} Sprites`,
                      )
                      if (!existingTrack) {
                        addTrack({
                          id: trackId,
                          type: 'sprite',
                          name: `${partType.charAt(0).toUpperCase() + partType.slice(1)} Sprites`,
                          clips: [],
                          locked: false,
                          muted: false,
                          visible: true,
                          height: 36,
                        })
                      }
                      const targetTrackId = existingTrack?.id || trackId
                      if (partType === 'viseme' && voice.visemeTimeline && voice.visemeTimeline.length > 0) {
                        voice.visemeTimeline.forEach((event, index) => {
                          const clipStartFrame = startFrame + event.startFrame
                          const clipEndFrame = startFrame + event.endFrame
                          const visemeOrder = ['Aa', 'D', 'Ee', 'F', 'L', 'M', 'O', 'R', 'S', 'U', 'W', 'Rest']
                          const spriteIndex = visemeOrder.indexOf(event.viseme)
                          const label = spriteLabels.viseme?.[spriteIndex] || event.viseme
                          addClip(targetTrackId, {
                            id: `${partType}_clip_${timestamp}_${index}`,
                            trackId: targetTrackId,
                            startFrame: clipStartFrame,
                            endFrame: clipEndFrame,
                            sourceId: `${partType}_${spriteIndex}`,
                            sourceInPoint: 0,
                            sourceOutPoint: clipEndFrame - clipStartFrame,
                            color: partColors[partType],
                            name: label,
                          })
                        })
                      } else {
                        const labels = spriteLabels[partType] || {}
                        const label = labels[0] || `${partType} 1`
                        addClip(targetTrackId, {
                          id: `${partType}_clip_${timestamp}`,
                          trackId: targetTrackId,
                          startFrame,
                          endFrame,
                          sourceId: `${partType}_0`,
                          sourceInPoint: 0,
                          sourceOutPoint: durationFrames,
                          color: partColors[partType],
                          name: label,
                        })
                      }
                    }
                    addClip('audio-1', {
                      id: `audio_clip_${timestamp}`,
                      trackId: 'audio-1',
                      startFrame,
                      endFrame,
                      sourceId: voice.id,
                      sourceInPoint: 0,
                      sourceOutPoint: durationFrames,
                      color: '#f97316',
                      name: `Voice: ${voice.voiceName}`,
                    })
                  }}
                  className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
                  title="Add to timeline"
                >
                  <ListPlus size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice dropdown portal — renders outside panel overflow */}
      {voiceDropdownOpen &&
        dropdownPos &&
        createPortal(
          <div
            ref={voiceDropdownRef}
            className="fixed z-dropdown w-[340px] bg-panel-bg border border-white/10 rounded-xl shadow-2xl max-h-[320px] overflow-y-auto"
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
          >
            {availableVoices && favoriteVoiceIds.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider sticky top-0 bg-panel-bg">
                  Favorites
                </div>
                {favoriteVoiceIds
                  .map((id) => availableVoices.find((v) => v.voice_id === id))
                  .filter(Boolean)
                  .map((voice) => (
                    <button
                      key={`fav-${voice!.voice_id}`}
                      onClick={() => {
                        setSelectedVoice(voice!.voice_id)
                        setVoiceDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        selectedVoiceId === voice!.voice_id
                          ? 'bg-accent/15 text-white'
                          : 'text-gray-300 hover:bg-white/[0.06]',
                      )}
                    >
                      <Star size={12} className="shrink-0 text-yellow-500" fill="currentColor" />
                      <span className="truncate flex-1">{voice!.name}</span>
                      {voice!.labels?.accent && (
                        <span className="text-[10px] text-gray-500 shrink-0">{voice!.labels.accent}</span>
                      )}
                      {selectedVoiceId === voice!.voice_id && <Check size={12} className="shrink-0 text-accent" />}
                    </button>
                  ))}
              </>
            )}
            {availableVoices && recentVoiceIds.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider sticky top-0 bg-panel-bg">
                  Recent
                </div>
                {recentVoiceIds
                  .filter((id) => !favoriteVoiceIds.includes(id))
                  .map((id) => availableVoices.find((v) => v.voice_id === id))
                  .filter(Boolean)
                  .map((voice) => (
                    <button
                      key={`recent-${voice!.voice_id}`}
                      onClick={() => {
                        setSelectedVoice(voice!.voice_id)
                        setVoiceDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        selectedVoiceId === voice!.voice_id
                          ? 'bg-accent/15 text-white'
                          : 'text-gray-300 hover:bg-white/[0.06]',
                      )}
                    >
                      <span className="truncate flex-1">{voice!.name}</span>
                      {voice!.labels?.accent && (
                        <span className="text-[10px] text-gray-500 shrink-0">{voice!.labels.accent}</span>
                      )}
                      {selectedVoiceId === voice!.voice_id && <Check size={12} className="shrink-0 text-accent" />}
                    </button>
                  ))}
              </>
            )}
            <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider sticky top-0 bg-panel-bg">
              All Voices
            </div>
            {availableVoices &&
              availableVoices.map((voice) => (
                <button
                  key={voice.voice_id}
                  onClick={() => {
                    setSelectedVoice(voice.voice_id)
                    setVoiceDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    selectedVoiceId === voice.voice_id
                      ? 'bg-accent/15 text-white'
                      : 'text-gray-300 hover:bg-white/[0.06]',
                  )}
                >
                  <span className="truncate flex-1">{voice.name}</span>
                  {voice.labels?.accent && (
                    <span className="text-[10px] text-gray-500 shrink-0">{voice.labels.accent}</span>
                  )}
                  {selectedVoiceId === voice.voice_id && <Check size={12} className="shrink-0 text-accent" />}
                </button>
              ))}
          </div>,
          document.body,
        )}
    </>
  )
}
