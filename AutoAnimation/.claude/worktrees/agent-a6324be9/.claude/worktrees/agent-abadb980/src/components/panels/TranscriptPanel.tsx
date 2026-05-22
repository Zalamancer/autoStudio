/**
 * TranscriptPanel — Descript-style text-based video editing.
 *
 * Shows the full dialogue as an editable transcript. Users can:
 * - Click any word to seek to that point in the timeline
 * - See a synchronized highlight of the currently playing word
 * - View the full dialogue structure with character names
 */
import { lazy, Suspense, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  FileText,
  MousePointer,
  Eye,
  Pencil,
  Download,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TranscriptEditorPanel = lazy(() => import('@/components/panels/TranscriptEditorPanel').then(m => ({ default: m.TranscriptEditorPanel })))
const TranscriptImportPanel = lazy(() => import('./TranscriptImportPanel').then(m => ({ default: m.TranscriptImportPanel })))

type TranscriptMode = 'view' | 'edit' | 'import'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores'
import { buildTranscript, type TranscriptLine, type TranscriptWord } from '@/services/transcriptEditor'

// ─── Tab bar ────────────────────────────────────────────────────
const TABS = [
  { id: 'view', label: 'View', icon: Eye },
  { id: 'edit', label: 'Edit', icon: Pencil },
  { id: 'import', label: 'Import', icon: Download },
] as const

/** Character color palette for distinguishing speakers */
const CHAR_COLORS = [
  'text-amber-300',
  'text-blue-300',
  'text-emerald-300',
  'text-purple-300',
  'text-pink-300',
  'text-cyan-300',
]

function getCharColor(index: number): string {
  return CHAR_COLORS[index % CHAR_COLORS.length]
}

function WordSpan({
  word,
  isActive,
  onClick,
}: {
  word: TranscriptWord
  isActive: boolean
  onClick: () => void
}) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-sm px-0.5 py-0.5 transition-all duration-100 hover:bg-white/10',
        isActive && 'bg-[#4a7eff]/30 text-[#4a7eff] font-medium',
      )}
    >
      {word.text}{' '}
    </span>
  )
}

function TranscriptLineView({
  line,
  charColorIndex,
  currentFrame,
  fps,
  onWordClick,
}: {
  line: TranscriptLine
  charColorIndex: number
  currentFrame: number
  fps: number
  onWordClick: (word: TranscriptWord) => void
}) {
  const activeWordRef = useRef<HTMLSpanElement>(null)

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentFrame])

  const isLineActive = currentFrame >= line.startFrame && currentFrame <= line.endFrame

  return (
    <div
      className={cn(
        'py-2.5 px-3 rounded-lg transition-colors border',
        isLineActive ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30' : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
      )}
    >
      {/* Character name */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('text-[10px] font-bold uppercase tracking-wide', getCharColor(charColorIndex))}>
          {line.characterName}
        </span>
        <span className="text-[8px] text-zinc-600">
          {(line.startFrame / fps).toFixed(1)}s
        </span>
      </div>

      {/* Word-level transcript */}
      <div className="text-xs text-zinc-300 leading-relaxed">
        {line.words.map((word) => {
          const isActive = currentFrame >= word.startFrame && currentFrame <= word.endFrame
          return (
            <span key={`${word.lineIndex}-${word.wordIndex}`} ref={isActive ? activeWordRef : undefined}>
              <WordSpan
                word={word}
                isActive={isActive}
                onClick={() => onWordClick(word)}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function TranscriptPanel() {
  const [mode, setMode] = useState<TranscriptMode>('view')
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {TABS.map((tab) => {
          const isActive = mode === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as TranscriptMode)}
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

      {/* ── Search Bar (view mode only) ── */}
      {mode === 'view' && (
        <div className="shrink-0 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transcript..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {mode === 'view' && <TranscriptViewContent search={search} />}
        {mode === 'edit' && (
          <Suspense fallback={null}>
            <TranscriptEditorPanel onBack={() => setMode('view')} />
          </Suspense>
        )}
        {mode === 'import' && (
          <Suspense fallback={null}>
            <TranscriptImportPanel />
          </Suspense>
        )}
      </div>
    </div>
  )
}

function TranscriptViewContent({ search }: { search: string }) {
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const characters = useMultiCharacterStore((s) => s.characters)
  const generatedVoices = useVoiceStore((s) => s.generatedVoices)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)

  const q = search.toLowerCase().trim()

  // Build character name map
  const charNameMap = useMemo(() => {
    const map = new Map<string, string>()
    characters.forEach((c) => map.set(c.id, c.name))
    return map
  }, [characters])

  // Build character color index map
  const charColorMap = useMemo(() => {
    const map = new Map<string, number>()
    const uniqueNames = [...new Set(characters.map((c) => c.name))]
    uniqueNames.forEach((name, i) => map.set(name, i))
    return map
  }, [characters])

  // Build transcript from dialogue lines and voice data
  const transcript = useMemo(() => {
    if (dialogueLines.length === 0) return []

    const enrichedLines = dialogueLines.map((dl) => ({
      id: dl.id,
      characterId: dl.characterId,
      characterName: charNameMap.get(dl.characterId) || 'Unknown',
      script: dl.script || '',
      startFrame: dl.startFrame,
      endFrame: dl.endFrame,
    }))

    return buildTranscript(enrichedLines, generatedVoices)
  }, [dialogueLines, generatedVoices, charNameMap])

  // Filter transcript by search
  const filteredTranscript = useMemo(() => {
    if (!q) return transcript
    return transcript.filter((line) =>
      line.characterName.toLowerCase().includes(q) ||
      line.words.some((w) => w.text.toLowerCase().includes(q))
    )
  }, [transcript, q])

  const handleWordClick = useCallback((word: TranscriptWord) => {
    // Seek to the word's start frame
    useTimelineStore.getState().seekToFrame(word.startFrame)
  }, [])

  if (transcript.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <FileText size={28} className="mb-3" />
        <span className="text-sm text-gray-400">No dialogue yet</span>
        <span className="text-xs text-gray-600 mt-1">
          Generate a clip with the AI Director to see the transcript here
        </span>
      </div>
    )
  }

  if (filteredTranscript.length === 0 && q) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <Search size={28} className="mb-3" />
        <span className="text-sm text-gray-400">No presets found</span>
        <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Instructions */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#4a7eff]/5 rounded-lg border border-[#4a7eff]/10 mb-2">
        <MousePointer size={10} className="text-[#4a7eff] shrink-0" />
        <span className="text-[9px] text-[#4a7eff]/80">
          Click any word to seek to that point in the timeline
        </span>
      </div>

      {/* Transcript lines */}
      {filteredTranscript.map((line) => (
        <TranscriptLineView
          key={line.lineIndex}
          line={line}
          charColorIndex={charColorMap.get(line.characterName) || 0}
          currentFrame={currentFrame}
          fps={fps}
          onWordClick={handleWordClick}
        />
      ))}
    </div>
  )
}
