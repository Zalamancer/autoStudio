/**
 * Adaptive Music Panel (Cinema standard)
 *
 * Workflow panel: analyze emotions -> configure segments -> generate music -> mix.
 * Single-mode panel (no tab bar), search filters segments, Cinema shell + blue accent.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Music,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Volume2,
  Zap,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Wand2,
  BarChart3,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSlider, PanelToggle, PanelSelect } from '@/components/ui/panel-controls'
import { useAdaptiveMusicStore } from '@/stores/useAdaptiveMusicStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import {
  MOOD_LABELS,
  getMoodColor,
  type MusicMoodLabel,
  type MusicSegment,
} from '@/services/adaptiveMusicEngine'

// ─── Collapsible Section ─────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 text-xs font-medium text-zinc-400 tracking-wider uppercase hover:text-zinc-200 transition-colors"
      >
        <Icon size={14} className="text-zinc-500" />
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="space-y-3 p-3 bg-panel-surface rounded-lg border border-white/5">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Emotion Timeline Bar ────────────────────────────────────────────────

function EmotionTimelineBar({
  segments,
  totalFrames,
  currentFrame,
  onSegmentClick,
}: {
  segments: MusicSegment[]
  totalFrames: number
  currentFrame: number
  onSegmentClick: (segmentId: string) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)

  if (totalFrames <= 0) {
    return (
      <div className="h-10 rounded-lg bg-panel-surface border border-white/5 flex items-center justify-center">
        <span className="text-[11px] text-zinc-500">No timeline data</span>
      </div>
    )
  }

  return (
    <div ref={barRef} className="relative h-10 rounded-lg bg-panel-surface border border-white/5 overflow-hidden">
      {/* Mood-colored segments */}
      {segments.map((seg) => {
        const left = (seg.startFrame / totalFrames) * 100
        const width = ((seg.endFrame - seg.startFrame) / totalFrames) * 100

        return (
          <button
            key={seg.id}
            onClick={() => onSegmentClick(seg.id)}
            className="absolute top-0 h-full transition-opacity hover:opacity-90 cursor-pointer group"
            style={{
              left: `${left}%`,
              width: `${Math.max(width, 0.5)}%`,
              backgroundColor: getMoodColor(seg.mood),
              opacity: 0.7 + seg.intensity * 0.3,
            }}
            title={`${seg.mood} (${seg.sourceEmotion})`}
          >
            {/* Label if segment is wide enough */}
            {width > 12 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-black/70 truncate px-1">
                {seg.mood}
              </span>
            )}
            {/* Hover border */}
            <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/40 transition-colors rounded-sm" />
          </button>
        )
      })}

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
        style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
      />
    </div>
  )
}

// ─── Segment Card ────────────────────────────────────────────────────────

function SegmentCard({
  segment,
  fps,
  isSelected,
  onSelect,
}: {
  segment: MusicSegment
  fps: number
  isSelected: boolean
  onSelect: () => void
}) {
  const setSegmentMood = useAdaptiveMusicStore((s) => s.setSegmentMood)
  const setSegmentVolume = useAdaptiveMusicStore((s) => s.setSegmentVolume)
  const generateForSegment = useAdaptiveMusicStore((s) => s.generateMusicForSegment)
  const isGenerating = useAdaptiveMusicStore((s) => s.isGenerating)

  const startSec = (segment.startFrame / fps).toFixed(1)
  const endSec = (segment.endFrame / fps).toFixed(1)
  const hasAudio = !!segment.audioUrl

  const [audioEl] = useState(() => new Audio())
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    return () => {
      audioEl.pause()
      audioEl.src = ''
    }
  }, [audioEl])

  const togglePlay = useCallback(() => {
    if (!segment.audioUrl) return
    if (isPlaying) {
      audioEl.pause()
      setIsPlaying(false)
    } else {
      audioEl.src = segment.audioUrl
      audioEl.volume = segment.volume
      audioEl.play().catch(() => {})
      audioEl.onended = () => setIsPlaying(false)
      setIsPlaying(true)
    }
  }, [audioEl, segment.audioUrl, segment.volume, isPlaying])

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors cursor-pointer',
        isSelected
          ? 'bg-accent/10 border-accent/30'
          : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: getMoodColor(segment.mood) }}
        />
        <span className="text-xs font-medium text-gray-200 flex-1 truncate">
          {segment.sourceEmotion}
        </span>
        <span className="text-[10px] text-zinc-500">
          {startSec}s - {endSec}s
        </span>
      </div>

      {/* Controls */}
      <div className="px-3 pb-2.5 space-y-2">
        {/* Mood selector */}
        <div onClick={(e) => e.stopPropagation()}>
          <PanelSelect
            label="Mood"
            value={segment.mood}
            onChange={(v) => setSegmentMood(segment.id, v as MusicMoodLabel)}
            options={MOOD_LABELS.map((m) => ({ value: m.value, label: m.label }))}
            fullWidth
          />
        </div>

        {/* Volume slider */}
        <div onClick={(e) => e.stopPropagation()}>
          <PanelSlider
            label="Vol"
            value={segment.volume}
            onChange={(v) => setSegmentVolume(segment.id, v)}
            min={0}
            max={1}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            compact
          />
        </div>

        {/* Generate / Play */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              generateForSegment(segment.id)
            }}
            disabled={isGenerating}
            className={cn(
              'flex-1 h-7 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors',
              isGenerating
                ? 'bg-zinc-700/30 text-zinc-500 cursor-not-allowed'
                : hasAudio
                  ? 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700/70'
                  : 'bg-accent/20 text-accent hover:bg-accent/30',
            )}
          >
            {isGenerating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Wand2 size={12} />
            )}
            {hasAudio ? 'Regenerate' : 'Generate'}
          </button>

          {hasAudio && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className="w-7 h-7 rounded-lg bg-zinc-700/50 flex items-center justify-center text-zinc-300 hover:bg-zinc-700/70 transition-colors"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Panel ──────────────────────────────────────────────────────────

export function AdaptiveMusicPanel() {
  const enabled = useAdaptiveMusicStore((s) => s.enabled)
  const setEnabled = useAdaptiveMusicStore((s) => s.setEnabled)
  const segments = useAdaptiveMusicStore((s) => s.segments)
  const totalDurationFrames = useAdaptiveMusicStore((s) => s.totalDurationFrames)
  const dominantMood = useAdaptiveMusicStore((s) => s.dominantMood)
  const crossfade = useAdaptiveMusicStore((s) => s.crossfade)
  const masterVolume = useAdaptiveMusicStore((s) => s.masterVolume)
  const isGenerating = useAdaptiveMusicStore((s) => s.isGenerating)
  const generationProgress = useAdaptiveMusicStore((s) => s.generationProgress)
  const generationTotal = useAdaptiveMusicStore((s) => s.generationTotal)
  const error = useAdaptiveMusicStore((s) => s.error)

  const analyzeEmotions = useAdaptiveMusicStore((s) => s.analyzeEmotions)
  const analyzeDialogue = useAdaptiveMusicStore((s) => s.analyzeDialogue)
  const generateAllMusic = useAdaptiveMusicStore((s) => s.generateAllMusic)
  const setCrossfadeDuration = useAdaptiveMusicStore((s) => s.setCrossfadeDuration)
  const setCrossfadeCurve = useAdaptiveMusicStore((s) => s.setCrossfadeCurve)
  const setMasterVolume = useAdaptiveMusicStore((s) => s.setMasterVolume)
  const clearSegments = useAdaptiveMusicStore((s) => s.clearSegments)
  const clearError = useAdaptiveMusicStore((s) => s.clearError)

  // External store data
  const emotionTimeline = useVoiceStore((s) => s.activeEmotionTimeline)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const currentFrame = Math.round(currentTime * fps)

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [moodFilter, setMoodFilter] = useState('all')

  // Auto-analyze when emotion timeline changes
  const handleAnalyze = useCallback(() => {
    const effectiveTotalFrames = totalFrames || totalDurationFrames || 900

    if (emotionTimeline.length > 0) {
      analyzeEmotions(emotionTimeline, effectiveTotalFrames, fps)
    } else if (dialogueLines.length > 0) {
      analyzeDialogue(dialogueLines, effectiveTotalFrames, fps)
    }
  }, [emotionTimeline, dialogueLines, totalFrames, totalDurationFrames, fps, analyzeEmotions, analyzeDialogue])

  const hasSource = emotionTimeline.length > 0 || dialogueLines.length > 0
  const generatedCount = segments.filter((s) => s.audioUrl).length

  // Filter segments by search + mood
  const q = search.toLowerCase().trim()
  const filteredSegments = useMemo(() => {
    let result = segments
    if (moodFilter !== 'all') {
      result = result.filter((s) => s.mood === moodFilter)
    }
    if (q) {
      result = result.filter(
        (s) =>
          s.mood.toLowerCase().includes(q) ||
          s.sourceEmotion.toLowerCase().includes(q),
      )
    }
    return result
  }, [segments, moodFilter, q])

  // Build mood filter options from active segments
  const moodFilterTabs = useMemo(() => {
    const activeMoods = new Set(segments.map((s) => s.mood))
    return [
      { id: 'all', label: 'All' },
      ...MOOD_LABELS.filter((m) => activeMoods.has(m.value)).map((m) => ({
        id: m.value,
        label: m.label,
      })),
    ]
  }, [segments])

  const hasMoodFilter = moodFilter !== 'all'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search segments..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
              filtersOpen ? 'bg-accent/20 text-accent' : 'text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface',
            )}
          >
            <SlidersHorizontal size={14} />
            {hasMoodFilter && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mood filter (hidden by default) ── */}
      {filtersOpen && segments.length > 0 && (
        <div className="shrink-0 px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {moodFilterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMoodFilter(tab.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                  moodFilter === tab.id
                    ? 'bg-accent/20 text-accent'
                    : 'bg-panel-surface text-zinc-400 hover:text-zinc-200 hover:bg-panel-surface-hover',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-4">
          {/* Enable toggle */}
          <PanelToggle label="Adaptive Music Mode" checked={enabled} onChange={setEnabled} />

          {!enabled && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Music size={28} className="mb-3" />
              <span className="text-sm text-gray-400">Adaptive Music Disabled</span>
              <span className="text-xs text-gray-600 mt-1">Enable to auto-adapt music to scene emotions</span>
            </div>
          )}

          {enabled && (
            <>
              {/* Error display */}
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-red-300">{error}</p>
                  </div>
                  <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-300">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Analyze / Generate buttons */}
              <Section icon={Zap} title="Emotion Analysis">
                {!hasSource ? (
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Generate voice/dialogue first to detect emotions. The emotion timeline from
                    your script's [emotion] cues will be used to create music segments.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={handleAnalyze}
                      className="w-full h-8 rounded-lg bg-zinc-700/50 text-[12px] font-medium text-zinc-200 hover:bg-zinc-700/70 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={13} />
                      {segments.length > 0 ? 'Re-analyze Emotions' : 'Analyze Emotions'}
                    </button>

                    {segments.length > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <BarChart3 size={12} />
                        <span>
                          {segments.length} segment{segments.length !== 1 ? 's' : ''} detected
                          {' '}&middot;{' '}
                          Dominant: <span className="text-zinc-200">{dominantMood}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Section>

              {/* Emotion timeline bar */}
              {segments.length > 0 && (
                <Section icon={BarChart3} title="Emotion Timeline">
                  <EmotionTimelineBar
                    segments={segments}
                    totalFrames={totalDurationFrames || totalFrames || 1}
                    currentFrame={currentFrame}
                    onSegmentClick={setSelectedSegmentId}
                  />

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {MOOD_LABELS.filter((m) =>
                      segments.some((s) => s.mood === m.value),
                    ).map((m) => (
                      <div key={m.value} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                        <span className="text-[10px] text-zinc-500">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Segment list */}
              {segments.length > 0 && (
                <Section icon={Music} title="Music Segments">
                  {filteredSegments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                      <Music size={24} className="mb-2" />
                      <span className="text-xs text-gray-400">No segments match</span>
                      <span className="text-[10px] text-gray-600 mt-0.5">Try a different search or filter</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredSegments.map((seg) => (
                        <SegmentCard
                          key={seg.id}
                          segment={seg}
                          fps={fps}
                          isSelected={selectedSegmentId === seg.id}
                          onSelect={() =>
                            setSelectedSegmentId(
                              selectedSegmentId === seg.id ? null : seg.id,
                            )
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* Generate all button */}
                  <button
                    onClick={generateAllMusic}
                    disabled={isGenerating || segments.length === 0}
                    className={cn(
                      'w-full h-9 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors mt-2',
                      isGenerating
                        ? 'bg-zinc-700/30 text-zinc-500 cursor-not-allowed'
                        : 'bg-accent text-white hover:bg-[#5a8aff]',
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating {generationProgress}/{generationTotal}...
                      </>
                    ) : (
                      <>
                        <Wand2 size={14} />
                        {generatedCount > 0
                          ? 'Regenerate All Music'
                          : 'Generate Adaptive Music'}
                      </>
                    )}
                  </button>

                  {/* Progress bar during generation */}
                  {isGenerating && generationTotal > 0 && (
                    <div className="w-full h-1.5 rounded-full bg-zinc-700/50 overflow-hidden mt-1">
                      <div
                        className="h-full bg-accent transition-all duration-300 rounded-full"
                        style={{
                          width: `${(generationProgress / generationTotal) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </Section>
              )}

              {/* Crossfade & Volume settings */}
              {segments.length > 0 && (
                <Section icon={Volume2} title="Mixing" defaultOpen={false}>
                  {/* Master volume */}
                  <PanelSlider
                    label="Master Volume"
                    value={masterVolume}
                    onChange={setMasterVolume}
                    min={0}
                    max={1}
                    step={0.05}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    compact
                  />

                  {/* Crossfade duration */}
                  <PanelSlider
                    label="Crossfade"
                    value={crossfade.durationFrames}
                    onChange={(v) => setCrossfadeDuration(Math.round(v))}
                    min={0}
                    max={60}
                    step={1}
                    formatValue={(v) => `${(v / fps).toFixed(2)}s (${v}f)`}
                    compact
                  />

                  {/* Crossfade curve */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 shrink-0">Curve</span>
                    <div className="flex-1 flex gap-1">
                      {(['linear', 'equal-power'] as const).map((curve) => (
                        <button
                          key={curve}
                          onClick={() => setCrossfadeCurve(curve)}
                          className={cn(
                            'flex-1 h-7 rounded-lg text-[11px] font-medium transition-colors',
                            crossfade.curve === curve
                              ? 'bg-accent/20 text-accent border border-accent/30'
                              : 'bg-zinc-700/30 text-zinc-400 border border-white/5 hover:bg-zinc-700/50',
                          )}
                        >
                          {curve === 'equal-power' ? 'Equal Power' : 'Linear'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear all */}
                  <button
                    onClick={clearSegments}
                    className="w-full h-7 rounded-lg bg-zinc-700/30 text-[11px] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 mt-1"
                  >
                    <X size={12} />
                    Clear All Segments
                  </button>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
