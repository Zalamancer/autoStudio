/**
 * SingingPanel — UI panel for singing lip sync configuration.
 *
 * Upload song audio, optional BPM override, optional lyrics file (LRC/SRT),
 * character selector, singing config sliders, and preview.
 *
 * Cinema-shell workflow panel: no tabs (single mode), no search (nothing to browse).
 */

import { useState, useCallback } from 'react'
import { Music, Upload, Loader2, Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { analyzeSongAudio, type SongAnalysis } from '@/services/singingAnalyzer'
import { generateSingingVisemeTimeline } from '@/services/singingLipSync'
import { parseLyrics } from '@/services/lyricsParser'
import type { SingingVisemeConfig, LyricLine } from '@/types/voice'

export function SingingPanel() {
  const characters = useMultiCharacterStore((s) => s.characters)
  const addDialogueLine = useMultiCharacterStore((s) => s.addDialogueLine)
  const fps = useTimelineStore((s) => s.fps) || 30

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [config, setConfig] = useState<SingingVisemeConfig>({
    mode: 'singing',
    pitchSensitivity: 0.5,
    beatEmphasis: 0.7,
    vibratoSpeed: 0.3,
  })

  const handleAudioUpload = useCallback(async (file: File) => {
    setAudioFile(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    setIsAnalyzing(true)

    try {
      const audioContext = new AudioContext()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const songAnalysis = await analyzeSongAudio(audioBuffer)
      setAnalysis(songAnalysis)
      setConfig((prev) => ({ ...prev, bpm: songAnalysis.bpm }))
    } catch (err) {
      console.error('[SingingPanel] Analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleLyricsUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (text) {
        setLyrics(parseLyrics(text))
      }
    }
    reader.readAsText(file)
  }, [])

  const handleGenerate = useCallback(() => {
    if (!analysis || !selectedCharacterId) return

    const visemeTimeline = generateSingingVisemeTimeline(analysis, config, fps)

    // Create a singing dialogue line
    const totalFrames = Math.round(analysis.duration * fps)
    addDialogueLine({
      characterId: selectedCharacterId,
      script: '[Singing]',
      startFrame: 0,
      endFrame: totalFrames,
      emotion: 'Joy',
      order: 0,
      generatedVoiceId: null,
      visemeTimeline,
      wordTimeline: [],
      audioUrl: audioUrl ?? undefined,
    })

    useTimelineStore.getState().setTotalFrames(totalFrames + fps)
  }, [analysis, selectedCharacterId, config, fps, audioUrl, addDialogueLine])

  const handleClear = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioFile(null)
    setAudioUrl(null)
    setAnalysis(null)
    setLyrics([])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Scrollable workflow content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-3">
          {/* ── Audio Upload ── */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Song Audio</label>
            {audioFile ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/5 bg-panel-surface">
                <Music size={14} className="shrink-0 text-accent" />
                <span className="text-xs text-zinc-300 flex-1 truncate">{audioFile.name}</span>
                {isAnalyzing && <Loader2 size={12} className="text-accent animate-spin" />}
                <button onClick={handleClear} className="text-zinc-500 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg border border-dashed border-white/10 bg-panel-surface cursor-pointer hover:bg-panel-surface-hover hover:border-white/20 transition-colors">
                <Upload size={20} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500">Drop MP3, WAV, or OGG</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {/* ── Analysis Results ── */}
          {analysis && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-accent/30 bg-accent/10">
              <div className="text-center">
                <div className="text-xs font-medium text-zinc-200">{analysis.bpm}</div>
                <div className="text-[8px] text-zinc-500">BPM</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-zinc-200">{analysis.beats.length}</div>
                <div className="text-[8px] text-zinc-500">Beats</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-zinc-200">{Math.round(analysis.duration)}s</div>
                <div className="text-[8px] text-zinc-500">Duration</div>
              </div>
            </div>
          )}

          {/* ── Lyrics Upload ── */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Lyrics (Optional)</label>
            {lyrics.length > 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/5 bg-panel-surface">
                <FileText size={14} className="shrink-0 text-accent" />
                <span className="text-xs text-zinc-300">{lyrics.length} lines loaded</span>
                <button onClick={() => setLyrics([])} className="text-zinc-500 hover:text-red-400 ml-auto transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-white/10 bg-panel-surface cursor-pointer hover:bg-panel-surface-hover hover:border-white/20 transition-colors">
                <FileText size={14} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500">Upload LRC or SRT lyrics file</span>
                <input
                  type="file"
                  accept=".lrc,.srt,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLyricsUpload(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {/* ── Character Selector ── */}
          <PanelSelect
            label="Character"
            value={selectedCharacterId}
            onChange={setSelectedCharacterId}
            options={[
              { value: '', label: 'Select character...' },
              ...characters.map((c) => ({ value: c.id, label: c.name })),
            ]}
            fullWidth
          />

          {/* ── Config Sliders ── */}
          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Singing Config</label>

            <PanelSlider
              label="BPM Override"
              value={config.bpm ?? analysis?.bpm ?? 120}
              onChange={(v) => setConfig((prev) => ({ ...prev, bpm: Math.round(v) }))}
              min={60}
              max={200}
              step={1}
              compact
              formatValue={(v) => config.bpm != null ? String(Math.round(v)) : 'Auto'}
            />

            <PanelSlider
              label="Pitch Sensitivity"
              value={config.pitchSensitivity}
              onChange={(v) => setConfig((prev) => ({ ...prev, pitchSensitivity: v }))}
              min={0}
              max={1}
              step={0.01}
              precision={1}
              compact
            />

            <PanelSlider
              label="Beat Emphasis"
              value={config.beatEmphasis}
              onChange={(v) => setConfig((prev) => ({ ...prev, beatEmphasis: v }))}
              min={0}
              max={1}
              step={0.01}
              precision={1}
              compact
            />

            <PanelSlider
              label="Vibrato Speed"
              value={config.vibratoSpeed}
              onChange={(v) => setConfig((prev) => ({ ...prev, vibratoSpeed: v }))}
              min={0}
              max={1}
              step={0.01}
              precision={1}
              compact
            />
          </div>
        </div>
      </div>

      {/* ── Footer: Generate button ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={handleGenerate}
          disabled={!analysis || !selectedCharacterId}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
            analysis && selectedCharacterId
              ? 'bg-accent hover:bg-[#5a8aff] text-white'
              : 'bg-panel-surface text-zinc-600 border border-white/5 cursor-not-allowed',
          )}
        >
          <Music size={14} />
          Generate Singing Lip Sync
        </button>
      </div>
    </div>
  )
}
