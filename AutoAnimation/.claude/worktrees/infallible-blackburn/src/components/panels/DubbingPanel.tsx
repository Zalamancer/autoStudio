/**
 * Dubbing Panel — Multi-language dubbing with ElevenLabs Dubbing API.
 */

import { Languages, Loader2, Play, Download, Check, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useDubbingStore } from '@/stores/useDubbingStore'
import { DUBBING_LANGUAGES } from '@/services/dubbing'
import { PanelSelect } from '@/components/ui/panel-controls'
import { useTimelineStore } from '@/stores'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-medium text-zinc-400 tracking-wider flex items-center gap-2 uppercase">
        <Icon size={14} className="text-zinc-500" />
        {title}
      </h4>
      <div className="space-y-4 p-3 bg-zinc-800/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-inner">
        {children}
      </div>
    </div>
  )
}

export function DubbingPanel() {
  const {
    sourceLanguage,
    targetLanguages,
    isProcessing,
    statusText,
    error,
    results,
    progress,
    setSourceLanguage,
    toggleTargetLanguage,
    startDubbing,
    clearResults,
  } = useDubbingStore(
    useShallow((s) => ({
      sourceLanguage: s.sourceLanguage,
      targetLanguages: s.targetLanguages,
      isProcessing: s.isProcessing,
      statusText: s.statusText,
      error: s.error,
      results: s.results,
      progress: s.progress,
      setSourceLanguage: s.setSourceLanguage,
      toggleTargetLanguage: s.toggleTargetLanguage,
      startDubbing: s.startDubbing,
      clearResults: s.clearResults,
    }))
  )

  const fps = useTimelineStore((s) => s.fps)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  const previewRef = useRef<HTMLAudioElement | null>(null)
  const [playingLang, setPlayingLang] = useState<string | null>(null)

  const filteredLanguages = DUBBING_LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(search.toLowerCase()) ||
    lang.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleStartDubbing = async () => {
    if (!audioFile) return
    const blob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type })
    await startDubbing(blob, fps)
  }

  const handlePreview = (audioUrl: string, lang: string) => {
    if (previewRef.current) {
      previewRef.current.pause()
    }
    if (playingLang === lang) {
      setPlayingLang(null)
      return
    }
    const audio = new Audio(audioUrl)
    previewRef.current = audio
    setPlayingLang(lang)
    audio.onended = () => setPlayingLang(null)
    audio.play()
  }

  const handleDownloadAll = () => {
    for (const result of results) {
      const link = document.createElement('a')
      link.href = result.audioUrl
      link.download = `dubbed-${result.language}.mp3`
      link.click()
    }
  }

  return (
    <PanelLayout icon={Languages} title="Dubbing" iconClassName="text-emerald-400">
      {/* Audio Source */}
      <Section icon={Languages} title="Source Audio">
        <div className="space-y-2">
          <PanelSelect
            label="Source Language"
            value={sourceLanguage}
            onChange={(v) => setSourceLanguage(v)}
            options={DUBBING_LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label }))}
            fullWidth
          />

          <label className="flex flex-col items-center justify-center w-full h-16 bg-black/20 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-colors">
            <span className="text-[10px] text-zinc-500">
              {audioFile ? audioFile.name : 'Upload source audio (MP3, WAV)'}
            </span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setAudioFile(e.target.files[0])
              }}
            />
          </label>
        </div>
      </Section>

      {/* Target Languages */}
      <Section icon={Languages} title={`Target Languages (${targetLanguages.length})`}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search languages..."
          className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500/50 focus:outline-none placeholder:text-zinc-600 mb-2"
        />
        <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto pr-1">
          {filteredLanguages
            .filter((l) => l.code !== sourceLanguage)
            .map((lang) => {
              const selected = targetLanguages.includes(lang.code)
              return (
                <button
                  key={lang.code}
                  onClick={() => toggleTargetLanguage(lang.code)}
                  className={cn(
                    'flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all',
                    selected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-black/20 text-zinc-500 border border-white/5 hover:border-emerald-500/20 hover:text-zinc-300'
                  )}
                >
                  {selected && <Check size={10} />}
                  {lang.label}
                </button>
              )
            })}
        </div>
      </Section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <span className="flex-1">{error}</span>
          <button onClick={clearResults} className="text-red-400 hover:text-red-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="p-3 bg-zinc-800/20 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Loader2 size={14} className="animate-spin text-emerald-400" />
            {statusText}
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStartDubbing}
        disabled={isProcessing || !audioFile || targetLanguages.length === 0}
        className={cn(
          'w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg',
          isProcessing || !audioFile || targetLanguages.length === 0
            ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Dubbing...
          </>
        ) : (
          <>
            <Languages size={18} />
            Dub to {targetLanguages.length} Language{targetLanguages.length !== 1 ? 's' : ''}
            <CreditCostTag operation="dubbing" />
          </>
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <Section icon={Languages} title={`Results (${results.length})`}>
          <div className="space-y-1.5">
            {results.map((result) => (
              <div
                key={result.language}
                className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-[11px] text-zinc-300 font-medium">{result.languageLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(result.audioUrl, result.language)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      playingLang === result.language
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    )}
                  >
                    <Play size={12} fill={playingLang === result.language ? 'currentColor' : 'none'} />
                  </button>
                  <a
                    href={result.audioUrl}
                    download={`dubbed-${result.language}.mp3`}
                    className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Download size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleDownloadAll}
            className="w-full py-2 rounded-xl text-[11px] font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
          >
            <Download size={12} className="inline mr-1" />
            Download All
          </button>
        </Section>
      )}

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}
