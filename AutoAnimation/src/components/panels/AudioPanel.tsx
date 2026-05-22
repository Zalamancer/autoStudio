import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import {
  Music,
  Play,
  Pause,
  Upload,
  Trash2,
  Repeat,
  Sparkles,
  Loader2,
  Search,
  Download,
  Globe,
  Wand2,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSlider, PanelCategoryTabs } from '@/components/ui/panel-controls'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { hasElevenLabsService, generateMusic, generateSoundEffect } from '@/services/elevenlabs'
import { enhanceAudio, localAudioCleanup } from '@/services/audioCleanup'
import { buildMusicPlanFromDialogue } from '@/services/musicAnalyzer'
import { getFreesoundService, hasFreesoundService, type FreesoundHit } from '@/services/freesound'
import { useFreesoundStore } from '@/stores/useFreesoundStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { saveMediaBlob } from '@/services/mediaDB'

// ─── Types ─────────────────────────────────────────────────────
interface AudioItem {
  id: string
  name: string
  duration: number // seconds
  audioUrl: string // object URL
  volume: number
  isPlaying: boolean
  audioElement: HTMLAudioElement
  waveformData: number[] // normalised 0-1 peaks for the mini canvas
}

// ─── Helpers ───────────────────────────────────────────────────

/** Decode an audio file and return normalised peak data for a waveform preview. */
async function extractWaveform(file: File, bars: number = 60): Promise<number[]> {
  const ctx = new AudioContext()
  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
  const rawData = audioBuffer.getChannelData(0)
  const blockSize = Math.floor(rawData.length / bars)
  const peaks: number[] = []
  for (let i = 0; i < bars; i++) {
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[i * blockSize + j])
    }
    peaks.push(sum / blockSize)
  }
  const max = Math.max(...peaks, 0.01)
  await ctx.close()
  return peaks.map((p) => p / max)
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Built-in sound effects ───────────────────────────────────
interface BuiltInSfx {
  id: string
  name: string
  label: string
}

const BUILT_IN_SFX: BuiltInSfx[] = [
  { id: 'sfx-whoosh', name: 'Whoosh', label: 'Whoosh' },
  { id: 'sfx-pop', name: 'Pop', label: 'Pop' },
  { id: 'sfx-click', name: 'Click', label: 'Click' },
  { id: 'sfx-ding', name: 'Ding', label: 'Ding' },
  { id: 'sfx-swoosh', name: 'Swoosh', label: 'Swoosh' },
  { id: 'sfx-rise', name: 'Rise', label: 'Rise' },
  { id: 'sfx-fall', name: 'Fall', label: 'Fall' },
  { id: 'sfx-snap', name: 'Snap', label: 'Snap' },
  { id: 'sfx-chime', name: 'Chime', label: 'Chime' },
  { id: 'sfx-womp', name: 'Womp', label: 'Womp' },
  { id: 'sfx-slide', name: 'Slide', label: 'Slide' },
  { id: 'sfx-blip', name: 'Blip', label: 'Blip' },
]

// ─── Cinema standard: tabs & filter categories ────────────────

const AUDIO_TABS = [
  { id: 'browse', label: 'Browse', icon: Globe },
  { id: 'generate', label: 'Generate', icon: Wand2 },
  { id: 'library', label: 'Library', icon: Music },
] as const

type AudioTabId = (typeof AUDIO_TABS)[number]['id']

const BROWSE_DURATION_TABS = [
  { id: '0', label: 'All' },
  { id: '5', label: '< 5s' },
  { id: '10', label: '< 10s' },
  { id: '30', label: '< 30s' },
]

// ─── Component ─────────────────────────────────────────────────
export function AudioPanel() {
  const [audioItems, setAudioItems] = useState<AudioItem[]>([])
  const [activeBackgroundId, setActiveBackgroundId] = useState<string | null>(null)
  const [masterVolume, setMasterVolume] = useState(1)
  const [loop, setLoop] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Tab, search & filter state (Cinema standard) ────────────
  const [activeTab, setActiveTab] = useState<AudioTabId>('browse')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // ── AI Music Generation state ──────────────────────────────────
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false)
  const [musicGenError, setMusicGenError] = useState<string | null>(null)
  const [musicGenStatus, setMusicGenStatus] = useState<string | null>(null)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const fps = useTimelineStore((s) => s.fps)
  const hasDialogue = dialogueLines.length > 0
  const hasApiKey = hasElevenLabsService()

  // ── AI SFX Generation state ────────────────────────────────────
  const [sfxPrompt, setSfxPrompt] = useState('')
  const [sfxDuration, setSfxDuration] = useState(2)
  const [sfxPromptInfluence, setSfxPromptInfluence] = useState(0.3)
  const [isGeneratingSfx, setIsGeneratingSfx] = useState(false)
  const [sfxGenError, setSfxGenError] = useState<string | null>(null)

  // ── Freesound browse state ─────────────────────────────────────
  const freesoundStore = useFreesoundStore()
  const browseDebounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [previewingId, setPreviewingId] = useState<number | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const hasFreesound = hasFreesoundService()

  // Sync loop flag on active background audio element
  useEffect(() => {
    if (!activeBackgroundId) return
    const item = audioItems.find((a) => a.id === activeBackgroundId)
    if (item) {
      item.audioElement.loop = loop
    }
  }, [loop, activeBackgroundId, audioItems])

  // Sync master volume to active background audio element
  useEffect(() => {
    if (!activeBackgroundId) return
    const item = audioItems.find((a) => a.id === activeBackgroundId)
    if (item) {
      item.audioElement.volume = masterVolume * item.volume
    }
  }, [masterVolume, activeBackgroundId, audioItems])

  // Cleanup object URLs and audio elements on unmount
  useEffect(() => {
    return () => {
      audioItems.forEach((item) => {
        item.audioElement.pause()
        URL.revokeObjectURL(item.audioUrl)
      })
      previewAudioRef.current?.pause()
    }
    // We intentionally only run cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Freesound search handler ──────────────────────────────────
  const searchFreesound = useCallback(
    async (query: string, page: number = 1) => {
      if (!query.trim() || !hasFreesound) return

      freesoundStore.setLoading(true)
      freesoundStore.setError(null)
      try {
        const service = getFreesoundService()
        const maxDur = freesoundStore.maxDuration
        const filter = maxDur > 0 ? `duration:[0 TO ${maxDur}]` : undefined
        const result = await service.search({ query, page, filter })

        if (page === 1) {
          freesoundStore.setResults(result.results, result.count, page)
        } else {
          freesoundStore.appendResults(result.results, result.count, page)
        }
      } catch (err) {
        freesoundStore.setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        freesoundStore.setLoading(false)
      }
    },
    [hasFreesound, freesoundStore],
  )

  // Load popular sounds on mount when Freesound is available
  useEffect(() => {
    if (hasFreesound && freesoundStore.results.length === 0 && !freesoundStore.isLoading) {
      searchFreesound('sound effect', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFreesound])

  // Debounced Freesound search on search query change (browse tab only)
  useEffect(() => {
    if (activeTab !== 'browse') return
    if (browseDebounceRef.current) clearTimeout(browseDebounceRef.current)
    if (!search.trim()) {
      // When search is cleared, reload the default results
      if (hasFreesound) {
        searchFreesound('sound effect', 1)
      }
      return
    }
    browseDebounceRef.current = setTimeout(() => {
      freesoundStore.setQuery(search)
      searchFreesound(search, 1)
    }, 400)
    return () => {
      if (browseDebounceRef.current) clearTimeout(browseDebounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, freesoundStore.maxDuration, activeTab])

  // ── Freesound preview handler ──────────────────────────────────
  const togglePreview = useCallback(
    (hit: FreesoundHit) => {
      if (previewingId === hit.id) {
        previewAudioRef.current?.pause()
        setPreviewingId(null)
        return
      }
      previewAudioRef.current?.pause()
      const audio = new Audio(hit.previews['preview-hq-mp3'])
      audio.addEventListener('ended', () => setPreviewingId(null), { once: true })
      audio.play()
      previewAudioRef.current = audio
      setPreviewingId(hit.id)
    },
    [previewingId],
  )

  // ── Freesound add to library + timeline handler ────────────────
  const addFreesoundToLibrary = useCallback(
    async (hit: FreesoundHit) => {
      if (!hasFreesound) return
      freesoundStore.addDownloadingId(hit.id)
      try {
        const service = getFreesoundService()
        const blob = await service.downloadAsBlob(hit.previews['preview-hq-mp3'])
        const url = URL.createObjectURL(blob)

        const assetId = `freesound_${hit.id}_${Date.now()}`
        const asset = {
          id: assetId,
          name: hit.name,
          type: 'audio/mpeg',
          size: blob.size,
          category: 'audio' as const,
          url,
          duration: hit.duration,
          addedAt: Date.now(),
        }
        await saveMediaBlob(assetId, blob)
        const mediaStore = useMediaStore.getState()
        mediaStore.addAsset(asset, blob)
        // Place on canvas/timeline at the current playhead position
        mediaStore.addToCanvas(assetId)
        // Fix the time range: start at playhead, span the actual audio duration
        const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === assetId)
        if (canvasItem) {
          const timelineState = useTimelineStore.getState()
          const currentFrame = timelineState.currentFrame
          const timelineFps = timelineState.fps || 30
          const totalFrames = timelineState.totalFrames
          const durationFrames = Math.round(hit.duration * timelineFps)
          mediaStore.updateCanvasItem(canvasItem.id, {
            startFrame: currentFrame,
            endFrame: Math.min(currentFrame + durationFrames, totalFrames),
          })
        }
      } catch (err) {
        console.error('[AudioPanel] Failed to add Freesound clip:', err)
      } finally {
        freesoundStore.removeDownloadingId(hit.id)
      }
    },
    [hasFreesound, freesoundStore],
  )

  // ── File import handler ──────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) continue

      const url = URL.createObjectURL(file)
      const audio = new Audio(url)

      // Wait for metadata so we know duration
      await new Promise<void>((resolve) => {
        audio.addEventListener('loadedmetadata', () => resolve(), { once: true })
        audio.addEventListener('error', () => resolve(), { once: true })
      })

      let waveformData: number[] = []
      try {
        waveformData = await extractWaveform(file)
      } catch {
        // Fallback: random peaks if decode fails
        waveformData = Array.from({ length: 60 }, () => Math.random())
      }

      const newItem: AudioItem = {
        id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        duration: audio.duration || 0,
        audioUrl: url,
        volume: 1,
        isPlaying: false,
        audioElement: audio,
        waveformData,
      }

      // When audio finishes, mark as not playing
      audio.addEventListener('ended', () => {
        setAudioItems((prev) => prev.map((a) => (a.id === newItem.id ? { ...a, isPlaying: false } : a)))
      })

      setAudioItems((prev) => [...prev, newItem])
    }
  }, [])

  // ── Playback toggle ──────────────────────────────────────────
  const togglePlay = useCallback(
    (id: string) => {
      setAudioItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item
          if (item.isPlaying) {
            item.audioElement.pause()
            return { ...item, isPlaying: false }
          } else {
            item.audioElement.volume = item.volume * masterVolume
            item.audioElement.play()
            return { ...item, isPlaying: true }
          }
        }),
      )
    },
    [masterVolume],
  )

  // ── Delete ───────────────────────────────────────────────────
  const deleteItem = useCallback(
    (id: string) => {
      setAudioItems((prev) => {
        const item = prev.find((a) => a.id === id)
        if (item) {
          item.audioElement.pause()
          URL.revokeObjectURL(item.audioUrl)
        }
        return prev.filter((a) => a.id !== id)
      })
      if (activeBackgroundId === id) {
        setActiveBackgroundId(null)
      }
    },
    [activeBackgroundId],
  )

  // ── Set as background music ──────────────────────────────────
  const setAsBackground = useCallback((id: string) => {
    setActiveBackgroundId((prev) => (prev === id ? null : id))
  }, [])

  // ── Drag & Drop handlers ────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  // ── Helper: add a blob as an audio item ─────────────────────
  const addAudioFromBlob = useCallback(async (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio()

    // Wait for metadata with timeout — some blob formats take a while
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000) // 5s max wait
      audio.addEventListener(
        'loadedmetadata',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      audio.addEventListener(
        'canplaythrough',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      audio.addEventListener(
        'error',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      audio.src = url
      audio.load() // Explicitly trigger loading
    })

    // Generate waveform from blob (with timeout fallback)
    let waveformData: number[] = []
    try {
      const file = new File([blob], name, { type: blob.type || 'audio/mpeg' })
      waveformData = await Promise.race([
        extractWaveform(file),
        new Promise<number[]>((resolve) =>
          setTimeout(() => resolve(Array.from({ length: 60 }, () => Math.random() * 0.5 + 0.25)), 8000),
        ),
      ])
    } catch {
      waveformData = Array.from({ length: 60 }, () => Math.random() * 0.5 + 0.25)
    }

    const newItem: AudioItem = {
      id: `ai-music-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      duration: audio.duration || 0,
      audioUrl: url,
      volume: 0.4, // Background music defaults to 40% volume
      isPlaying: false,
      audioElement: audio,
      waveformData,
    }

    audio.addEventListener('ended', () => {
      setAudioItems((prev) => prev.map((a) => (a.id === newItem.id ? { ...a, isPlaying: false } : a)))
    })

    setAudioItems((prev) => [...prev, newItem])

    // Auto-set as background music
    setActiveBackgroundId(newItem.id)
  }, [])

  // ── AI Music Generation handler ────────────────────────────────
  const handleGenerateMusic = useCallback(async () => {
    if (isGeneratingMusic) return

    setIsGeneratingMusic(true)
    setMusicGenError(null)
    setMusicGenStatus('Analyzing dialogue...')

    try {
      // Calculate total duration from dialogue
      const sorted = [...dialogueLines].sort((a, b) => a.startFrame - b.startFrame)
      const totalDurationMs =
        sorted.length > 0 ? ((sorted[sorted.length - 1].endFrame - sorted[0].startFrame) / fps) * 1000 : 30_000

      // Clamp to ElevenLabs limits: 3s – 10min
      const clampedDuration = Math.max(3000, Math.min(600_000, totalDurationMs))

      if (hasDialogue) {
        // Use composition plan for dialogue-aware music
        setMusicGenStatus('Building composition plan from dialogue...')
        const plan = buildMusicPlanFromDialogue(dialogueLines, fps)

        console.log('[MusicGen] Composition plan:', plan)
        setMusicGenStatus('Generating music with ElevenLabs...')

        const result = await generateMusic({
          compositionPlan: plan,
          forceInstrumental: true,
        })

        setMusicGenStatus('Adding to library...')
        await addAudioFromBlob(result.audioBlob, `AI Background Music (${Math.round(clampedDuration / 1000)}s)`)
      } else {
        // No dialogue — use a simple prompt
        setMusicGenStatus('Generating ambient background music...')
        const result = await generateMusic({
          prompt:
            'Cinematic instrumental background music, ambient, gentle, suitable for a short-form video. No vocals.',
          durationMs: clampedDuration,
          forceInstrumental: true,
        })

        setMusicGenStatus('Adding to library...')
        await addAudioFromBlob(result.audioBlob, `AI Ambient Music (${Math.round(clampedDuration / 1000)}s)`)
      }

      setMusicGenStatus(null)
    } catch (err) {
      console.error('[MusicGen] Error:', err)
      setMusicGenError(err instanceof Error ? err.message : 'Failed to generate music')
      setMusicGenStatus(null)
    } finally {
      setIsGeneratingMusic(false)
    }
  }, [isGeneratingMusic, dialogueLines, fps, hasDialogue, addAudioFromBlob])

  // ── AI SFX Generation handler ──────────────────────────────────
  const handleGenerateSfx = useCallback(async () => {
    if (isGeneratingSfx || !sfxPrompt.trim() || !hasApiKey) return

    setIsGeneratingSfx(true)
    setSfxGenError(null)

    try {
      const result = await generateSoundEffect({
        text: sfxPrompt.trim(),
        durationSeconds: sfxDuration,
        promptInfluence: sfxPromptInfluence,
      })

      // Add to media store
      const assetId = `sfx_gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const asset = {
        id: assetId,
        name: `SFX: ${sfxPrompt.trim()}`,
        type: 'audio/mpeg',
        size: result.audioBlob.size,
        category: 'audio' as const,
        url: result.audioUrl,
        duration: result.durationMs / 1000,
        addedAt: Date.now(),
      }
      await saveMediaBlob(assetId, result.audioBlob)
      useMediaStore.getState().addAsset(asset, result.audioBlob)

      // Also add to local audio items for preview
      await addAudioFromBlob(result.audioBlob, `SFX: ${sfxPrompt.trim()}`)

      setSfxPrompt('')
    } catch (err) {
      console.error('[SFX Gen] Error:', err)
      setSfxGenError(err instanceof Error ? err.message : 'Failed to generate sound effect')
    } finally {
      setIsGeneratingSfx(false)
    }
  }, [isGeneratingSfx, sfxPrompt, sfxDuration, sfxPromptInfluence, hasApiKey, addAudioFromBlob])

  // ── Filtered lists (memoized) ─────────────────────────────────
  const q = search.toLowerCase().trim()

  const filteredAudioItems = useMemo(() => {
    if (!q) return audioItems
    return audioItems.filter((item) => item.name.toLowerCase().includes(q))
  }, [audioItems, q])

  const filteredBuiltInSfx = useMemo(() => {
    if (!q) return BUILT_IN_SFX
    return BUILT_IN_SFX.filter((sfx) => sfx.label.toLowerCase().includes(q))
  }, [q])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {AUDIO_TABS.map((tab) => {
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
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
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
              {tab.id === 'library' && audioItems.length > 0 && (
                <span
                  style={{
                    transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                  }}
                  className={cn(
                    'text-[10px] truncate',
                    isActive ? 'max-w-[30px] opacity-100 text-gray-500' : 'max-w-0 opacity-0',
                  )}
                >
                  {audioItems.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Search Bar + Filter Toggle + Upload ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'browse'
                  ? hasFreesound
                    ? 'Search Freesound & SFX...'
                    : 'Search sound effects...'
                  : activeTab === 'library'
                    ? 'Search library...'
                    : 'Search...'
              }
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
          {activeTab === 'library' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface transition-colors"
              title="Import audio"
            >
              <Upload size={14} />
            </button>
          )}
          {activeTab === 'browse' && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen ? 'bg-accent/20 text-accent' : 'text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface',
              )}
              title="Duration filters"
            >
              <SlidersHorizontal size={14} />
              {freesoundStore.maxDuration > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter panel (Browse tab, duration categories) ── */}
      {activeTab === 'browse' && filtersOpen && hasFreesound && (
        <div className="shrink-0 px-3 pb-2">
          <PanelCategoryTabs
            tabs={BROWSE_DURATION_TABS}
            activeTab={String(freesoundStore.maxDuration)}
            onChange={(id) => freesoundStore.setMaxDuration(Number(id))}
            compact
          />
        </div>
      )}

      {/* ── Status banners (AI Music generation) ── */}
      {isGeneratingMusic && (
        <div className="shrink-0 px-3 pb-1">
          <div className="flex items-center gap-2 p-2.5 bg-accent/10 border border-accent/30 rounded-lg">
            <Loader2 size={14} className="animate-spin text-accent flex-shrink-0" />
            <span className="text-xs text-accent">{musicGenStatus || 'Generating...'}</span>
          </div>
        </div>
      )}
      {musicGenError && !isGeneratingMusic && (
        <div className="shrink-0 px-3 pb-1">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <span className="text-xs text-red-400">{musicGenError}</span>
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ═══ Browse tab: Freesound + Built-in SFX ═══ */}
        {activeTab === 'browse' && (
          <div className="space-y-3">
            {/* Freesound results */}
            {hasFreesound && (
              <>
                {/* Loading */}
                {freesoundStore.isLoading && freesoundStore.results.length === 0 && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-gray-500" />
                    <span className="text-xs text-gray-500 ml-2">Searching Freesound...</span>
                  </div>
                )}

                {/* Error */}
                {freesoundStore.error && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-xs text-red-400">{freesoundStore.error}</span>
                  </div>
                )}

                {/* Results list */}
                {freesoundStore.results.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Globe size={12} className="text-gray-500 flex-shrink-0" />
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Freesound</span>
                      <span className="text-[10px] text-gray-600">
                        {freesoundStore.totalHits.toLocaleString()} results
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="space-y-1">
                      {freesoundStore.results.map((hit) => (
                        <div
                          key={hit.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-panel-surface border border-white/5 hover:bg-panel-surface-hover transition-colors group"
                        >
                          <button
                            onClick={() => togglePreview(hit)}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-panel-surface-hover group-hover:bg-accent flex items-center justify-center transition-colors"
                            title={previewingId === hit.id ? 'Stop preview' : 'Preview'}
                          >
                            {previewingId === hit.id ? (
                              <Pause size={14} className="text-white" />
                            ) : (
                              <Play size={14} className="text-gray-400 group-hover:text-white ml-0.5" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                              {hit.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>{formatDuration(hit.duration)}</span>
                              <span>by {hit.username}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => addFreesoundToLibrary(hit)}
                            disabled={freesoundStore.downloadingIds.includes(hit.id)}
                            className="p-1.5 rounded-md text-gray-600 hover:text-white hover:bg-panel-surface-hover opacity-0 group-hover:opacity-100 transition-all"
                            title="Add to library"
                          >
                            {freesoundStore.downloadingIds.includes(hit.id) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Load More */}
                {freesoundStore.hasMore && (
                  <button
                    onClick={() => searchFreesound(search.trim() || 'sound effect', freesoundStore.currentPage + 1)}
                    disabled={freesoundStore.isLoading}
                    className="w-full py-2 text-xs text-gray-400 hover:text-white bg-panel-surface rounded-lg hover:bg-panel-surface-hover transition-colors"
                  >
                    {freesoundStore.isLoading ? 'Loading...' : 'Load More'}
                  </button>
                )}

                {/* Freesound empty state */}
                {search.trim() &&
                  !freesoundStore.isLoading &&
                  freesoundStore.results.length === 0 &&
                  !freesoundStore.error && (
                    <div className="py-3 text-center">
                      <p className="text-[10px] text-gray-600">No Freesound results for &ldquo;{search}&rdquo;</p>
                    </div>
                  )}
              </>
            )}

            {/* Built-in SFX */}
            {filteredBuiltInSfx.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Music size={12} className="text-gray-500 flex-shrink-0" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Quick SFX</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="space-y-1">
                  {filteredBuiltInSfx.map((sfx) => (
                    <button
                      key={sfx.id}
                      onClick={() => {
                        setSfxPrompt(sfx.name.toLowerCase() + ' sound effect')
                        setActiveTab('generate')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-panel-surface border border-white/5 hover:bg-panel-surface-hover transition-colors group text-left"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-panel-surface-hover group-hover:bg-accent flex items-center justify-center transition-colors">
                        <Wand2 size={14} className="text-gray-400 group-hover:text-white" />
                      </span>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate flex-1">
                        {sfx.label}
                      </span>
                      <span className="text-[9px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        AI Generate
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* No results at all */}
            {q &&
              filteredBuiltInSfx.length === 0 &&
              (!hasFreesound || (freesoundStore.results.length === 0 && !freesoundStore.isLoading)) && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <Globe size={28} className="mb-3" />
                  <span className="text-sm text-gray-400">No sounds found</span>
                  <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
                </div>
              )}
          </div>
        )}

        {/* ═══ Generate tab: AI Music + AI SFX ═══ */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            {/* AI Background Music section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-gray-500 flex-shrink-0" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Background Music</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <button
                onClick={handleGenerateMusic}
                disabled={isGeneratingMusic || !hasApiKey}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                  isGeneratingMusic
                    ? 'bg-accent/10 border-accent/30'
                    : !hasApiKey
                      ? 'bg-panel-surface border-white/5 text-gray-600 cursor-not-allowed'
                      : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                )}
              >
                {isGeneratingMusic ? (
                  <Loader2 size={14} className="animate-spin text-accent flex-shrink-0" />
                ) : (
                  <Sparkles size={14} className="text-gray-500 flex-shrink-0" />
                )}
                <div>
                  <div className="text-xs font-medium text-gray-200">
                    {isGeneratingMusic
                      ? musicGenStatus || 'Generating...'
                      : hasDialogue
                        ? 'Generate from Dialogue'
                        : 'Generate Ambient Music'}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    {hasDialogue
                      ? `Analyzes ${dialogueLines.length} line${dialogueLines.length !== 1 ? 's' : ''} for mood-aware composition`
                      : 'Cinematic instrumental background track'}
                  </div>
                </div>
              </button>
            </div>

            {/* AI SFX Generation section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 size={12} className="text-gray-500 flex-shrink-0" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Sound Effects</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <textarea
                value={sfxPrompt}
                onChange={(e) => setSfxPrompt(e.target.value)}
                placeholder="e.g. dramatic orchestral hit, coin dropping on wooden table, sci-fi laser beam..."
                rows={3}
                className="w-full bg-panel-surface border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/30 resize-none"
              />

              {/* Duration slider */}
              <PanelSlider
                label="Duration"
                value={sfxDuration}
                onChange={setSfxDuration}
                min={0.5}
                max={22}
                step={0.5}
                suffix="s"
                compact
              />

              {/* Prompt influence slider */}
              <PanelSlider
                label="Prompt Influence"
                value={sfxPromptInfluence}
                onChange={setSfxPromptInfluence}
                min={0}
                max={1}
                step={0.05}
                compact
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />

              {/* Generate button */}
              <button
                onClick={handleGenerateSfx}
                disabled={isGeneratingSfx || !sfxPrompt.trim() || !hasApiKey}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isGeneratingSfx
                    ? 'bg-accent/20 text-accent'
                    : !hasApiKey || !sfxPrompt.trim()
                      ? 'bg-panel-surface text-gray-600 cursor-not-allowed'
                      : 'bg-accent text-white hover:bg-[#5a8eff]',
                )}
              >
                {isGeneratingSfx ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate Sound Effect
                  </>
                )}
              </button>

              {/* Error */}
              {sfxGenError && !isGeneratingSfx && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <span className="text-xs text-red-400">{sfxGenError}</span>
                </div>
              )}

              {!hasApiKey && (
                <div className="py-2 text-center">
                  <p className="text-xs text-gray-500">Set VITE_ELEVENLABS_API_KEY to generate sound effects</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Library tab: Imported audio ═══ */}
        {activeTab === 'library' && (
          <div className="space-y-3" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            {/* Empty state */}
            {filteredAudioItems.length === 0 && !q ? (
              <div
                className={cn(
                  'flex flex-col items-center justify-center py-16 text-center cursor-pointer rounded-lg border-2 border-dashed transition-colors',
                  isDragging ? 'border-accent bg-accent/10' : 'border-white/5',
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={28} className="text-gray-600 mb-3" />
                <span className="text-sm text-gray-400">No audio imported</span>
                <span className="text-xs text-gray-600 mt-1">Drag & drop or click to upload</span>
                <span className="text-[10px] text-gray-700 mt-1">MP3, WAV, OGG, M4A</span>
              </div>
            ) : (
              <>
                {/* Drag indicator */}
                {isDragging && (
                  <div className="flex items-center justify-center py-4 rounded-lg border-2 border-dashed border-accent bg-accent/10">
                    <span className="text-xs text-accent">Drop audio files here</span>
                  </div>
                )}

                <div className="space-y-1">
                  {filteredAudioItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border group',
                        activeBackgroundId === item.id
                          ? 'bg-accent/10 border-accent/30'
                          : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                      )}
                    >
                      <button
                        onClick={() => togglePlay(item.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-panel-surface-hover group-hover:bg-accent flex items-center justify-center transition-colors"
                      >
                        {item.isPlaying ? (
                          <Pause size={14} className="text-white" />
                        ) : (
                          <Play size={14} className="text-gray-400 group-hover:text-white ml-0.5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                          {item.name}
                        </div>
                        <span className="text-[10px] text-gray-500">{formatDuration(item.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setAsBackground(item.id)}
                          className={cn(
                            'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                            activeBackgroundId === item.id
                              ? 'bg-accent text-white opacity-100'
                              : 'bg-panel-surface-hover text-gray-400 hover:bg-[#4a4a4a] hover:text-gray-300',
                          )}
                          title={activeBackgroundId === item.id ? 'Remove as background' : 'Set as background music'}
                        >
                          BG
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const resp = await fetch(item.audioUrl)
                              const blob = await resp.blob()
                              const hasApi = hasElevenLabsService()
                              const cleaned = hasApi ? await enhanceAudio(blob) : await localAudioCleanup(blob)
                              const cleanUrl = URL.createObjectURL(cleaned)
                              const mediaStore = useMediaStore.getState()
                              mediaStore.updateAsset(item.id, { url: cleanUrl })
                              await saveMediaBlob(item.id, cleaned)
                            } catch {
                              /* ignore cleanup error */
                            }
                          }}
                          className="px-2 py-1 rounded text-[10px] font-medium bg-panel-surface-hover text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                          title="Clean audio: remove noise, normalize levels"
                        >
                          <Wand2 size={10} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Search no results */}
            {q && filteredAudioItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Music size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No audio found</span>
                <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
              </div>
            )}

            {/* Active Background Music Controls */}
            {activeBackgroundId && (
              <div className="space-y-3 p-3 bg-panel-surface/80 rounded-lg border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate">
                    {audioItems.find((a) => a.id === activeBackgroundId)?.name || 'Unknown'}
                  </span>
                  <span className="text-[10px] text-accent font-medium uppercase">Background</span>
                </div>

                {/* Master Volume */}
                <PanelSlider
                  label="Master Volume"
                  value={masterVolume}
                  onChange={setMasterVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  compact
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />

                {/* Loop Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Repeat size={12} />
                    Loop
                  </span>
                  <button
                    onClick={() => setLoop(!loop)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      loop ? 'bg-accent text-white' : 'bg-panel-surface-hover text-gray-400 hover:bg-panel-surface-hover',
                    )}
                  >
                    {loop ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: contextual action per tab ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        {activeTab === 'browse' && (
          <button
            onClick={() => setActiveTab('generate')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-accent text-white hover:bg-[#5a8eff] transition-colors"
          >
            <Wand2 size={13} />
            Generate Sound Effect
          </button>
        )}
        {activeTab === 'generate' && (
          <button
            onClick={() => setActiveTab('browse')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-panel-surface text-gray-400 border border-white/5 hover:bg-panel-surface-hover hover:text-gray-200 transition-colors"
          >
            <Globe size={13} />
            Browse Freesound Library
          </button>
        )}
        {activeTab === 'library' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-panel-surface text-gray-400 border border-white/5 hover:bg-panel-surface-hover hover:text-gray-200 transition-colors"
          >
            <Upload size={13} />
            Import Audio
          </button>
        )}
      </div>
    </div>
  )
}
