import { useState, useCallback, useMemo, useRef } from 'react'
import {
  Users,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Mic,
  Loader2,
  Play,
  Volume2,
  UserPlus,
  Maximize2,
  FileText,
  Search,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { useEditorStore } from '@/stores/useEditorStore'
import { TranscriptEditorPanel } from '@/components/panels/TranscriptEditorPanel'
import {
  useMultiCharacterStore,
  type DialogueCharacter,
  type DialogueLine,
  type DialogueEmotion,
} from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { detectEmotionFromText } from '@/services/emotionMapping'

// ─── Tab bar ────────────────────────────────────────────────────
const TABS = [
  { id: 'cards', label: 'Cards', icon: Users },
  { id: 'text', label: 'Text Edit', icon: FileText },
] as const
type TabId = (typeof TABS)[number]['id']

/** All selectable emotion options for the dropdown */
const EMOTION_OPTIONS: DialogueEmotion[] = ['Auto', 'Joy', 'Anger', 'Disgust', 'Fear', 'Sadness', 'Surprise', 'Neutral']

/** Color mapping for emotion badges */
const EMOTION_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Joy: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  Anger: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  Disgust: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/30' },
  Fear: { bg: 'bg-purple-500/20', text: 'text-accent', border: 'border-purple-500/30' },
  Sadness: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  Surprise: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  Neutral: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
}

/** Get the resolved emotion for a dialogue line (auto-detect or override) */
function getResolvedEmotion(line: DialogueLine): string {
  if (line.emotion && line.emotion !== 'Auto') {
    return line.emotion
  }
  return detectEmotionFromText(line.script)
}

/** Get badge color classes for a resolved emotion */
function getEmotionBadgeStyle(emotion: string) {
  return EMOTION_BADGE_COLORS[emotion] || EMOTION_BADGE_COLORS.Neutral
}

export function DialoguePanel() {
  const {
    characters,
    activeCharacterId,
    addDialogueCharacter,
    removeDialogueCharacter,
    updateDialogueCharacter,
    selectDialogueCharacter,
    addDialogueLine,
    removeDialogueLine,
    updateDialogueLine,
    reorderDialogueLines,
    getSortedLines,
  } = useMultiCharacterStore()

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const availableVoices = useVoiceStore((s) => s.availableVoices)
  const isApiKeyValid = useVoiceStore((s) => s.isApiKeyValid)
  const fps = useTimelineStore((s) => s.fps)

  const [activeTab, setActiveTab] = useState<TabId>('cards')
  const [search, setSearch] = useState('')
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(new Set())
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [draggedLineId, setDraggedLineId] = useState<string | null>(null)
  const [_generatingLineId, setGeneratingLineId] = useState<string | null>(null)
  const generatingRef = useRef(false)

  const q = search.toLowerCase().trim()

  const toggleCharacterExpanded = (id: string) => {
    setExpandedCharacters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddCharacter = () => {
    addDialogueCharacter({
      name: `Character ${characters.length + 1}`,
      savedCharacterId: null,
      position: { x: 480 + characters.length * 300, y: 540 },
      scale: 1,
      zIndex: characters.length,
      visible: true,
      locked: false,
      voiceId: null,
      color: '',
    })
  }

  const handleAddLine = () => {
    const targetCharId = activeCharacterId || characters[0]?.id
    if (!targetCharId) return

    const sortedLines = getSortedLines()
    const lastLine = sortedLines[sortedLines.length - 1]
    const newStartFrame = lastLine ? lastLine.endFrame : 0
    const defaultDurationFrames = fps * 3 // 3 seconds

    addDialogueLine({
      characterId: targetCharId,
      script: '',
      generatedVoiceId: null,
      startFrame: newStartFrame,
      endFrame: newStartFrame + defaultDurationFrames,
      order: sortedLines.length,
      visemeTimeline: [],
      wordTimeline: [],
    })
  }

  const handleDragStart = useCallback((lineId: string) => {
    setDraggedLineId(lineId)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetLineId: string) => {
      e.preventDefault()
      if (!draggedLineId || draggedLineId === targetLineId) return
    },
    [draggedLineId],
  )

  const handleDrop = useCallback(
    (targetLineId: string) => {
      if (!draggedLineId || draggedLineId === targetLineId) return

      const sortedLines = getSortedLines()
      const currentIds = sortedLines.map((l) => l.id)
      const draggedIndex = currentIds.indexOf(draggedLineId)
      const targetIndex = currentIds.indexOf(targetLineId)

      if (draggedIndex === -1 || targetIndex === -1) return

      // Remove dragged from current position and insert at target
      const newOrder = [...currentIds]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedLineId)

      reorderDialogueLines(newOrder)
      setDraggedLineId(null)
    },
    [draggedLineId, getSortedLines, reorderDialogueLines],
  )

  const handleGenerateLineVoice = async (line: DialogueLine) => {
    const character = characters.find((c) => c.id === line.characterId)
    if (!character?.voiceId || !line.script.trim()) return
    if (generatingRef.current) return

    generatingRef.current = true
    setGeneratingLineId(line.id)

    const voiceStore = useVoiceStore.getState()
    const originalVoiceId = voiceStore.selectedVoiceId
    const originalScript = voiceStore.script

    try {
      // Use the voice store to generate - temporarily set voice and script
      voiceStore.setSelectedVoice(character.voiceId)
      voiceStore.setScript(line.script)

      const result = await voiceStore.generateVoice(fps)

      if (result) {
        // Calculate frame timing based on actual audio duration
        const sortedLines = getSortedLines()
        const lineIndex = sortedLines.findIndex((l) => l.id === line.id)
        const prevLine = lineIndex > 0 ? sortedLines[lineIndex - 1] : null
        const startFrame = prevLine ? prevLine.endFrame : line.startFrame
        const durationFrames = Math.ceil(result.audioDuration * fps)

        updateDialogueLine(line.id, {
          generatedVoiceId: result.id,
          startFrame,
          endFrame: startFrame + durationFrames,
          visemeTimeline: result.visemeTimeline,
          wordTimeline: result.wordTimeline,
        })

        // Recalculate subsequent lines' timing
        recalculateLineTiming(line.id, startFrame + durationFrames)
      }
    } catch (err) {
      console.error('[DialoguePanel] Voice generation failed:', err)
    } finally {
      // Restore original state
      if (originalVoiceId) voiceStore.setSelectedVoice(originalVoiceId)
      voiceStore.setScript(originalScript)
      generatingRef.current = false
      setGeneratingLineId(null)
    }
  }

  const recalculateLineTiming = (afterLineId: string, nextStartFrame: number) => {
    const sortedLines = getSortedLines()
    const lineIndex = sortedLines.findIndex((l) => l.id === afterLineId)
    let currentStart = nextStartFrame

    for (let i = lineIndex + 1; i < sortedLines.length; i++) {
      const nextLine = sortedLines[i]
      const duration = nextLine.endFrame - nextLine.startFrame
      updateDialogueLine(nextLine.id, {
        startFrame: currentStart,
        endFrame: currentStart + duration,
      })
      currentStart += duration
    }
  }

  const handlePlayLine = (line: DialogueLine) => {
    if (!line.generatedVoiceId) return

    const voice = useVoiceStore.getState().generatedVoices.find((v) => v.id === line.generatedVoiceId)
    if (!voice) return

    const audio = new Audio(voice.audioUrl)
    audio.play()
  }

  const getCharacterForLine = (line: DialogueLine): DialogueCharacter | undefined => {
    return characters.find((c) => c.id === line.characterId)
  }

  const sortedLines = getSortedLines()

  // Filter dialogue lines by search
  const filteredLines = useMemo(() => {
    if (!q) return sortedLines
    return sortedLines.filter((line) => {
      const char = characters.find((c) => c.id === line.characterId)
      return line.script.toLowerCase().includes(q) || (char?.name || '').toLowerCase().includes(q)
    })
  }, [sortedLines, characters, q])

  // Filter characters by search
  const filteredCharacters = useMemo(() => {
    if (!q) return characters
    return characters.filter((c) => c.name.toLowerCase().includes(q))
  }, [characters, q])

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
            </button>
          )
        })}

        {/* Trailing actions */}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('dialogue-editor')}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-panel-surface transition-colors"
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      {activeTab === 'cards' && (
        <div className="shrink-0 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search characters & lines..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── Text Edit Mode ── */}
        {activeTab === 'text' && <TranscriptEditorPanel onBack={() => setActiveTab('cards')} />}

        {/* ── Cards Mode ── */}
        {activeTab === 'cards' && (
          <div className="space-y-3">
            {/* Characters Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Characters ({characters.length})</span>
                <button
                  onClick={handleAddCharacter}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                >
                  <UserPlus size={12} />
                  Add
                </button>
              </div>

              {filteredCharacters.length === 0 && characters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <Users size={28} className="mb-3" />
                  <span className="text-sm text-gray-400">No characters yet</span>
                  <span className="text-xs text-gray-600 mt-1">Add characters to start creating dialogue</span>
                </div>
              )}

              {filteredCharacters.length === 0 && characters.length > 0 && q && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                  <Search size={28} className="mb-3" />
                  <span className="text-sm text-gray-400">No presets found</span>
                  <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
                </div>
              )}

              <div className="space-y-1">
                {filteredCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isActive={activeCharacterId === char.id}
                    isExpanded={expandedCharacters.has(char.id)}
                    savedCharacters={savedCharacters}
                    availableVoices={availableVoices}
                    isApiKeyValid={isApiKeyValid}
                    onSelect={() => selectDialogueCharacter(char.id)}
                    onToggleExpand={() => toggleCharacterExpanded(char.id)}
                    onUpdate={(updates) => updateDialogueCharacter(char.id, updates)}
                    onRemove={() => removeDialogueCharacter(char.id)}
                  />
                ))}
              </div>
            </div>

            {/* Dialogue Lines Section */}
            {characters.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Dialogue Lines ({sortedLines.length})
                  </span>
                  <button
                    onClick={handleAddLine}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                  >
                    <Plus size={12} />
                    Add Line
                  </button>
                </div>

                {filteredLines.length === 0 && sortedLines.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                    <MessageSquare size={28} className="mb-3" />
                    <span className="text-sm text-gray-400">No dialogue lines</span>
                    <span className="text-xs text-gray-600 mt-1">Click &ldquo;Add Line&rdquo; to start</span>
                  </div>
                )}

                {filteredLines.length === 0 && sortedLines.length > 0 && q && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                    <Search size={28} className="mb-3" />
                    <span className="text-sm text-gray-400">No presets found</span>
                    <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
                  </div>
                )}

                <div className="space-y-1">
                  {filteredLines.map((line) => {
                    const char = getCharacterForLine(line)
                    return (
                      <DialogueLineCard
                        key={line.id}
                        line={line}
                        character={char}
                        characters={characters}
                        isEditing={editingLineId === line.id}
                        isDragging={draggedLineId === line.id}
                        fps={fps}
                        onEdit={() => setEditingLineId(editingLineId === line.id ? null : line.id)}
                        onUpdate={(updates) => updateDialogueLine(line.id, updates)}
                        onRemove={() => removeDialogueLine(line.id)}
                        onGenerate={() => handleGenerateLineVoice(line)}
                        onPlay={() => handlePlayLine(line)}
                        onDragStart={() => handleDragStart(line.id)}
                        onDragOver={(e) => handleDragOver(e, line.id)}
                        onDrop={() => handleDrop(line.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {activeTab === 'cards' && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          {characters.length > 0 ? (
            <button
              onClick={handleAddLine}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              <Plus size={13} />
              Add Dialogue Line
            </button>
          ) : (
            <button
              onClick={handleAddCharacter}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              <UserPlus size={13} />
              Add Character
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// --- Character Card Component ---

interface CharacterCardProps {
  character: DialogueCharacter
  isActive: boolean
  isExpanded: boolean
  savedCharacters: Array<{ id: string; name: string; referenceImage: string }>
  availableVoices: Array<{ voice_id: string; name: string; labels?: Record<string, string> }>
  isApiKeyValid: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onUpdate: (updates: Partial<DialogueCharacter>) => void
  onRemove: () => void
}

function CharacterCard({
  character,
  isActive,
  isExpanded,
  savedCharacters,
  availableVoices,
  isApiKeyValid,
  onSelect,
  onToggleExpand,
  onUpdate,
  onRemove,
}: CharacterCardProps) {
  const savedChar = savedCharacters.find((c) => c.id === character.savedCharacterId)

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isActive ? 'border-accent/30 bg-accent/10' : 'border-white/5 bg-panel-surface hover:bg-panel-surface-hover',
      )}
    >
      {/* Character Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={onSelect}>
        {/* Color dot */}
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: character.color }} />

        {/* Thumbnail */}
        {savedChar?.referenceImage ? (
          <img
            src={savedChar.referenceImage}
            alt={character.name}
            className="w-8 h-8 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded bg-panel-surface-hover flex items-center justify-center flex-shrink-0">
            <Users size={14} className="text-gray-500" />
          </div>
        )}

        {/* Name */}
        <span className="text-xs font-medium text-gray-200 flex-1 truncate">{character.name}</span>

        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="p-1 rounded hover:bg-panel-surface-hover/50 text-gray-500"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Remove */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5">
          {/* Name Input */}
          <div className="space-y-1 pt-2">
            <label className="text-xs text-gray-500">Name</label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-panel-surface border border-white/5 rounded-lg px-2 py-1.5 text-sm text-white focus:border-accent/30 focus:outline-none"
            />
          </div>

          {/* Saved Character Selector */}
          <PanelSelect
            label="Character Sprites"
            value={character.savedCharacterId || ''}
            onChange={(v) => onUpdate({ savedCharacterId: v || null })}
            options={[
              { value: '', label: 'No sprites (placeholder)' },
              ...savedCharacters.map((sc) => ({ value: sc.id, label: sc.name })),
            ]}
          />

          {/* Voice Selector */}
          {isApiKeyValid && availableVoices.length > 0 ? (
            <PanelSelect
              label="Voice"
              value={character.voiceId || ''}
              onChange={(v) => onUpdate({ voiceId: v || null })}
              options={[
                { value: '', label: 'Select voice...' },
                ...availableVoices.map((voice) => ({
                  value: voice.voice_id,
                  label: `${voice.name}${voice.labels?.accent ? ` (${voice.labels.accent})` : ''}`,
                })),
              ]}
            />
          ) : (
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Voice</label>
              <p className="text-xs text-gray-600">Connect ElevenLabs API in Voices panel first</p>
            </div>
          )}

          {/* Position Controls */}
          <div className="grid grid-cols-2 gap-2">
            <PanelSlider
              label="X"
              inline
              value={character.position.x}
              min={-1920}
              max={3840}
              step={1}
              onChange={(v) => onUpdate({ position: { ...character.position, x: v } })}
            />
            <PanelSlider
              label="Y"
              inline
              value={character.position.y}
              min={-1080}
              max={2160}
              step={1}
              onChange={(v) => onUpdate({ position: { ...character.position, y: v } })}
            />
          </div>

          {/* Scale */}
          <PanelSlider
            label="Scale"
            value={character.scale}
            onChange={(v) => onUpdate({ scale: v })}
            min={0.1}
            max={3}
            step={0.05}
            precision={2}
            compact
          />
        </div>
      )}
    </div>
  )
}

// --- Dialogue Line Card Component ---

interface DialogueLineCardProps {
  line: DialogueLine
  character: DialogueCharacter | undefined
  characters: DialogueCharacter[]
  isEditing: boolean
  isDragging: boolean
  fps: number
  onEdit: () => void
  onUpdate: (updates: Partial<DialogueLine>) => void
  onRemove: () => void
  onGenerate: () => void
  onPlay: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
}

function DialogueLineCard({
  line,
  character,
  characters,
  isEditing,
  isDragging,
  fps,
  onEdit,
  onUpdate,
  onRemove,
  onGenerate,
  onPlay,
  onDragStart,
  onDragOver,
  onDrop,
}: DialogueLineCardProps) {
  const isGenerating = useVoiceStore((s) => s.isLoading)
  const durationSec = ((line.endFrame - line.startFrame) / fps).toFixed(1)

  // Resolve the displayed emotion (auto-detect or manual override)
  const resolvedEmotion = useMemo(() => getResolvedEmotion(line), [line.script, line.emotion])
  const badgeStyle = useMemo(() => getEmotionBadgeStyle(resolvedEmotion), [resolvedEmotion])
  const isAutoEmotion = !line.emotion || line.emotion === 'Auto'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'rounded-lg border transition-all',
        isDragging ? 'opacity-50 border-accent/30' : 'border-white/5',
        'bg-panel-surface hover:bg-panel-surface-hover',
      )}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        {/* Drag Handle */}
        <div className="pt-1 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400">
          <GripVertical size={14} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Character indicator + emotion badge + duration */}
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: character?.color || '#666' }}
            />
            <span className="text-xs font-medium truncate" style={{ color: character?.color || '#999' }}>
              {character?.name || 'Unknown'}
            </span>

            {/* Emotion Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0',
                badgeStyle.bg,
                badgeStyle.text,
                badgeStyle.border,
              )}
              title={isAutoEmotion ? `Auto-detected: ${resolvedEmotion}` : `Override: ${resolvedEmotion}`}
            >
              {resolvedEmotion}
              {isAutoEmotion && <span className="text-[8px] opacity-60">auto</span>}
            </span>

            <span className="text-[10px] text-gray-600 ml-auto flex-shrink-0">{durationSec}s</span>
          </div>

          {/* Script text or editor */}
          {isEditing ? (
            <div className="space-y-2">
              {/* Character assignment */}
              <PanelSelect
                value={line.characterId}
                onChange={(v) => onUpdate({ characterId: v })}
                options={characters.map((c) => ({ value: c.id, label: c.name }))}
                fullWidth
              />

              <textarea
                value={line.script}
                onChange={(e) => onUpdate({ script: e.target.value })}
                placeholder="Enter dialogue line..."
                className="w-full h-16 bg-panel-surface border border-white/5 rounded-lg p-2 text-sm text-white resize-none focus:border-accent/30 focus:outline-none placeholder:text-gray-600"
                autoFocus
              />

              {/* Emotion Selector */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <PanelSelect
                    label="Emotion"
                    value={line.emotion || 'Auto'}
                    onChange={(v) => onUpdate({ emotion: v as DialogueEmotion })}
                    options={EMOTION_OPTIONS.map((emotion) => ({
                      value: emotion,
                      label:
                        emotion === 'Auto'
                          ? `Auto (${line.script.trim() ? detectEmotionFromText(line.script) : 'Neutral'})`
                          : emotion,
                    }))}
                  />
                </div>
                {/* Preview badge in editing mode */}
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 mt-4',
                    badgeStyle.bg,
                    badgeStyle.text,
                    badgeStyle.border,
                  )}
                >
                  {resolvedEmotion}
                </span>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={onGenerate}
                  disabled={isGenerating || !line.script.trim() || !character?.voiceId}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors border',
                    isGenerating || !line.script.trim() || !character?.voiceId
                      ? 'bg-panel-surface text-gray-500 cursor-not-allowed border-white/5'
                      : 'bg-accent/10 text-accent hover:bg-accent/20 border-accent/30',
                  )}
                >
                  {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />}
                  Generate Voice
                </button>
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 rounded-lg text-xs bg-panel-surface text-gray-300 hover:bg-panel-surface-hover border border-white/5 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div onClick={onEdit} className="cursor-pointer">
              {line.script ? (
                <p className="text-xs text-gray-400 line-clamp-2">{line.script}</p>
              ) : (
                <p className="text-xs text-gray-600 italic">Click to add dialogue...</p>
              )}
            </div>
          )}

          {/* Voice status indicator */}
          {!isEditing && line.generatedVoiceId && (
            <div className="flex items-center gap-1 mt-1">
              <Volume2 size={10} className="text-accent" />
              <span className="text-[10px] text-accent">Voice generated</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {line.generatedVoiceId && (
            <button
              onClick={onPlay}
              className="p-1 rounded hover:bg-panel-surface-hover text-gray-500 hover:text-gray-300"
              title="Play audio"
            >
              <Play size={12} />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
            title="Remove line"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
