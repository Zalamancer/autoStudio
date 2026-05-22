import { useState, useCallback, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { useMultiCharacterStore, type DialogueCharacter, type DialogueLine } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore, type CharacterPartTab } from '@/stores/useSavedCharactersStore'
import { useEditorStore } from '@/stores'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { detectEmotionFromText } from '@/services/emotionMapping'
import type { Viseme } from '@/types/voice'
import type { RightPanelTab } from '@/types'

interface DialogueTrackProps {
  pixelsPerFrame: number
}

/** Height of each row in the timeline */
const ROW_HEIGHT = 40
/** Nice labels */
const PART_LABELS: Record<CharacterPartTab, string> = {
  eye: 'Eye',
  eyebrow: 'Eyebrow',
  viseme: 'Viseme',
  hair: 'Hair',
  body: 'Body',
  head: 'Head',
  shirt: 'Shirt',
  pants: 'Pants',
  shoes: 'Shoes',
}

/** Viseme colors — softer palette for quick visual scanning */
const VISEME_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Rest: { bg: 'rgba(113,113,122,0.25)', text: '#a1a1aa', border: 'rgba(113,113,122,0.5)' },
  Aa: { bg: 'rgba(239,68,68,0.25)', text: '#f87171', border: 'rgba(239,68,68,0.5)' },
  D: { bg: 'rgba(245,158,11,0.25)', text: '#fbbf24', border: 'rgba(245,158,11,0.5)' },
  Ee: { bg: 'rgba(34,197,94,0.25)', text: '#4ade80', border: 'rgba(34,197,94,0.5)' },
  F: { bg: 'rgba(236,72,153,0.25)', text: '#f472b6', border: 'rgba(236,72,153,0.5)' },
  L: { bg: 'rgba(20,184,166,0.25)', text: '#2dd4bf', border: 'rgba(20,184,166,0.5)' },
  M: { bg: 'rgba(249,115,22,0.25)', text: '#fb923c', border: 'rgba(249,115,22,0.5)' },
  O: { bg: 'rgba(59,130,246,0.25)', text: '#60a5fa', border: 'rgba(59,130,246,0.5)' },
  R: { bg: 'rgba(139,92,246,0.25)', text: '#a78bfa', border: 'rgba(139,92,246,0.5)' },
  S: { bg: 'rgba(6,182,212,0.25)', text: '#22d3ee', border: 'rgba(6,182,212,0.5)' },
  U: { bg: 'rgba(168,85,247,0.25)', text: '#c084fc', border: 'rgba(168,85,247,0.5)' },
  W: { bg: 'rgba(132,204,22,0.25)', text: '#a3e635', border: 'rgba(132,204,22,0.5)' },
}

/** Emotion colors */
const EMOTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Joy: { bg: 'rgba(245,158,11,0.30)', text: '#fbbf24', border: 'rgba(245,158,11,0.6)' },
  Anger: { bg: 'rgba(239,68,68,0.30)', text: '#f87171', border: 'rgba(239,68,68,0.6)' },
  Sadness: { bg: 'rgba(59,130,246,0.30)', text: '#60a5fa', border: 'rgba(59,130,246,0.6)' },
  Surprise: { bg: 'rgba(249,115,22,0.30)', text: '#fb923c', border: 'rgba(249,115,22,0.6)' },
  Fear: { bg: 'rgba(168,85,247,0.30)', text: '#c084fc', border: 'rgba(168,85,247,0.6)' },
  Disgust: { bg: 'rgba(34,197,94,0.30)', text: '#4ade80', border: 'rgba(34,197,94,0.6)' },
  Neutral: { bg: 'rgba(113,113,122,0.25)', text: '#a1a1aa', border: 'rgba(113,113,122,0.5)' },
}

function getEmotionColor(emotion: string) {
  return EMOTION_COLORS[emotion] || EMOTION_COLORS.Neutral
}

function getVisemeColor(viseme: string) {
  return VISEME_COLORS[viseme] || VISEME_COLORS.Rest
}

/**
 * Convert a character's hex color (#3b82f6) into row color scheme.
 */
function charColorToRow(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    bg: `rgba(${r},${g},${b},0.25)`,
    text: hex,
    border: `rgba(${r},${g},${b},0.6)`,
  }
}

// ─── Sub-track: Eye (emotion per dialogue line) ──────────────────────────────

function EyeSubTrack({
  charName,
  lines,
  pixelsPerFrame,
  thumbnail,
  onSegmentClick,
}: {
  charName: string
  lines: DialogueLine[]
  pixelsPerFrame: number
  thumbnail: string | null
  onSegmentClick: (emotion: string) => void
}) {
  return (
    <div className="flex border-b border-zinc-700/30" style={{ height: ROW_HEIGHT }}>
      {/* Header */}
      <div className="w-40 flex-shrink-0 flex items-center gap-1 px-2 pl-7 bg-zinc-800/80 border-r border-zinc-700/50 sticky left-0 z-10">
        {thumbnail && (
          <img
            src={thumbnail}
            alt="eye"
            className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            draggable={false}
          />
        )}
        <span className="text-[10px] text-zinc-500 truncate select-none">
          {charName} <span className="text-zinc-600">({PART_LABELS.eye})</span>
        </span>
      </div>
      {/* Segments — one colored bar per dialogue line's emotion */}
      <div className="flex-1 relative bg-zinc-900/20">
        {lines.map((line) => {
          const emotion = line.emotion && line.emotion !== 'Auto' ? line.emotion : detectEmotionFromText(line.script)
          const left = line.startFrame * pixelsPerFrame
          const width = (line.endFrame - line.startFrame) * pixelsPerFrame
          const colors = getEmotionColor(emotion)
          return (
            <div
              key={line.id + '-eye'}
              className="absolute top-0.5 bottom-0.5 rounded-sm overflow-hidden select-none cursor-pointer hover:brightness-125 transition-[filter]"
              style={{
                left,
                width: Math.max(width, 6),
                backgroundColor: colors.bg,
                borderLeft: `2px solid ${colors.border}`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                onSegmentClick(emotion)
              }}
            >
              {width > 40 && (
                <span
                  className="absolute inset-0 flex items-center px-1.5 text-[9px] font-medium truncate"
                  style={{ color: colors.text }}
                >
                  {emotion}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sub-track: Viseme (per dialogue line, individual viseme events) ──────────

function VisemeSubTrack({
  charName,
  lines,
  pixelsPerFrame,
  thumbnail,
  onSegmentClick,
}: {
  charName: string
  lines: DialogueLine[]
  pixelsPerFrame: number
  thumbnail: string | null
  onSegmentClick: (viseme: Viseme) => void
}) {
  return (
    <div className="flex border-b border-zinc-700/30" style={{ height: ROW_HEIGHT }}>
      {/* Header */}
      <div className="w-40 flex-shrink-0 flex items-center gap-1 px-2 pl-7 bg-zinc-800/80 border-r border-zinc-700/50 sticky left-0 z-10">
        {thumbnail && (
          <img
            src={thumbnail}
            alt="viseme"
            className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            draggable={false}
          />
        )}
        <span className="text-[10px] text-zinc-500 truncate select-none">
          {charName} <span className="text-zinc-600">({PART_LABELS.viseme})</span>
        </span>
      </div>
      {/* Viseme event segments */}
      <div className="flex-1 relative bg-zinc-900/20">
        {lines.map((line) =>
          line.visemeTimeline.map((evt, i) => {
            // visemeTimeline frames are relative to line.startFrame
            const absStart = line.startFrame + evt.startFrame
            const absEnd = line.startFrame + evt.endFrame
            const left = absStart * pixelsPerFrame
            const width = (absEnd - absStart) * pixelsPerFrame
            const viseme = (evt.viseme || 'Rest') as Viseme
            const colors = getVisemeColor(viseme)
            return (
              <div
                key={`${line.id}-v-${i}`}
                className="absolute top-0.5 bottom-0.5 rounded-sm overflow-hidden select-none cursor-pointer hover:brightness-125 transition-[filter]"
                style={{
                  left,
                  width: Math.max(width, 3),
                  backgroundColor: colors.bg,
                  borderLeft: `1px solid ${colors.border}`,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSegmentClick(viseme)
                }}
              >
                {width > 24 && (
                  <span
                    className="absolute inset-0 flex items-center px-0.5 text-[8px] font-medium truncate"
                    style={{ color: colors.text }}
                  >
                    {viseme}
                  </span>
                )}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

// ─── Sprite Picker Popup ──────────────────────────────────────────────────────

function SpritePickerPopup({
  sprites,
  labels,
  currentIndex,
  anchorLeft,
  onSelect,
  onClose,
}: {
  sprites: string[]
  labels: Record<number, string>
  currentIndex: number
  anchorLeft: number
  onSelect: (index: number) => void
  onClose: () => void
}) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Popup */}
      <div
        className="absolute z-50 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl p-2 min-w-[120px] max-w-[280px]"
        style={{ left: anchorLeft, bottom: ROW_HEIGHT + 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] text-zinc-400 mb-1.5 px-1">Select sprite</div>
        <div className="grid grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto">
          {sprites.map((src, idx) => {
            const label = labels[idx] || `#${idx}`
            const isActive = idx === currentIndex
            return (
              <button
                key={idx}
                className={`flex flex-col items-center gap-0.5 p-1 rounded transition-colors ${
                  isActive ? 'ring-2 ring-green-400 bg-green-400/10' : 'hover:bg-zinc-700/50'
                }`}
                onClick={() => {
                  onSelect(idx)
                  onClose()
                }}
                title={label}
              >
                <img
                  src={src}
                  alt={label}
                  className="w-10 h-10 object-contain rounded-sm"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                  draggable={false}
                />
                <span className="text-[8px] text-zinc-400 truncate max-w-[44px]">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── Sub-track: Per-line sprite part (hair / body) ────────────────────────────

function PerLinePartSubTrack({
  charName,
  charColor,
  part,
  lines,
  pixelsPerFrame,
  thumbnail,
  sprites,
  spriteLabels,
  onSegmentClick,
  onSpriteOverride,
}: {
  charName: string
  charColor: string
  part: 'hair' | 'body'
  lines: DialogueLine[]
  pixelsPerFrame: number
  thumbnail: string | null
  sprites: string[]
  spriteLabels: Record<number, string>
  onSegmentClick: () => void
  onSpriteOverride: (lineId: string, part: 'hair' | 'body', spriteIndex: number) => void
}) {
  const [pickerLineId, setPickerLineId] = useState<string | null>(null)
  const [pickerLeft, setPickerLeft] = useState(0)
  const colors = charColorToRow(charColor)
  const hasMultipleSprites = sprites.length > 1

  return (
    <div className="flex border-b border-zinc-700/30" style={{ height: ROW_HEIGHT }}>
      {/* Header */}
      <div className="w-40 flex-shrink-0 flex items-center gap-1 px-2 pl-7 bg-zinc-800/80 border-r border-zinc-700/50 sticky left-0 z-10">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={part}
            className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            draggable={false}
          />
        )}
        <span className="text-[10px] text-zinc-500 truncate select-none">
          {charName} <span className="text-zinc-600">({PART_LABELS[part]})</span>
        </span>
      </div>
      {/* Per-line bars */}
      <div className="flex-1 relative bg-zinc-900/20">
        {lines.map((line) => {
          const left = line.startFrame * pixelsPerFrame
          const width = (line.endFrame - line.startFrame) * pixelsPerFrame
          const spriteIdx = line.spriteOverrides?.[part] ?? 0
          const label = spriteLabels[spriteIdx] || `#${spriteIdx}`

          return (
            <div
              key={line.id + '-' + part}
              className="absolute top-0.5 bottom-0.5 rounded-sm overflow-hidden select-none cursor-pointer hover:brightness-125 transition-[filter]"
              style={{
                left,
                width: Math.max(width, 8),
                backgroundColor: colors.bg,
                borderLeft: `2px solid ${colors.border}`,
                opacity: 0.8,
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (hasMultipleSprites) {
                  // Open sprite picker
                  setPickerLineId(line.id)
                  setPickerLeft(left)
                } else {
                  onSegmentClick()
                }
              }}
            >
              {width > 40 && (
                <span
                  className="absolute inset-0 flex items-center px-1.5 text-[9px] font-medium truncate"
                  style={{ color: colors.text }}
                >
                  {label}
                </span>
              )}
            </div>
          )
        })}

        {/* Sprite Picker Popup */}
        {pickerLineId && hasMultipleSprites && (
          <SpritePickerPopup
            sprites={sprites}
            labels={spriteLabels}
            currentIndex={lines.find((l) => l.id === pickerLineId)?.spriteOverrides?.[part] ?? 0}
            anchorLeft={pickerLeft}
            onSelect={(idx) => onSpriteOverride(pickerLineId, part, idx)}
            onClose={() => setPickerLineId(null)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Per-character group: main track + collapsible sub-tracks ─────────────────

function CharacterGroup({
  char,
  lines,
  pixelsPerFrame,
}: {
  char: DialogueCharacter
  lines: DialogueLine[]
  pixelsPerFrame: number
}) {
  const [expanded, setExpanded] = useState(false)
  const selectDialogueLine = useMultiCharacterStore((s) => s.selectDialogueLine)
  const selectedDialogueLineId = useMultiCharacterStore((s) => s.selectedDialogueLineId)
  const selectDialogueCharacter = useMultiCharacterStore((s) => s.selectDialogueCharacter)
  const updateDialogueLine = useMultiCharacterStore((s) => s.updateDialogueLine)
  const setLeftPanelBottomTab = useEditorStore((s) => s.setLeftPanelBottomTab)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  // Get saved character sprites for thumbnails
  const savedCharacter = useSavedCharactersStore((s) =>
    char.savedCharacterId ? s.characters.find((c) => c.id === char.savedCharacterId) : undefined,
  )
  const selectSavedCharacter = useSavedCharactersStore((s) => s.selectCharacter)
  const configSavedImages = useCharacterConfigStore((s) => s.savedImages)
  const bodyParts = savedCharacter?.bodyParts || null
  const selectedSprites = savedCharacter?.selectedSprites || null

  const getThumbnail = (part: CharacterPartTab): string | null => {
    const arr = bodyParts?.[part] || configSavedImages[part] || []
    if (arr.length === 0) return null
    const idx = selectedSprites?.[part] ?? 0
    return arr[idx] || arr[0] || null
  }

  const referenceImage = savedCharacter?.referenceImage || null
  const eyeThumb = getThumbnail('eye') || referenceImage
  const visemeThumb = getThumbnail('viseme')
  const hairThumb = getThumbnail('hair')
  const bodyThumb = getThumbnail('body')

  // Overall character span
  const minStart = lines.length > 0 ? Math.min(...lines.map((l) => l.startFrame)) : 0
  const maxEnd = lines.length > 0 ? Math.max(...lines.map((l) => l.endFrame)) : 0
  const colors = charColorToRow(char.color)

  /**
   * Select this character on canvas + in the saved characters store,
   * then open a specific right-panel tab.
   * Also syncs the saved character's sprites into the config store so the
   * right panel displays the correct data for multi-character mode.
   */
  const selectCharAndOpenTab = useCallback(
    (tab: RightPanelTab) => {
      selectDialogueCharacter(char.id)
      if (char.savedCharacterId) {
        selectSavedCharacter(char.savedCharacterId)

        // Sync saved character's sprite data into the config store
        // so the right panel shows the correct character's sprites
        const sc = useSavedCharactersStore.getState().characters.find((c) => c.id === char.savedCharacterId)
        if (sc?._hydrated) {
          const configStore = useCharacterConfigStore.getState()
          const hasVisemes = Object.values(sc.curvedVisemes).some((v) => v !== null)
          if (hasVisemes) {
            configStore.setCurvedVisemes(sc.curvedVisemes)
            configStore.setUseCurvedVisemes(true)
            if (sc.visemeSpriteMap) {
              configStore.setVisemeSpriteMap(sc.visemeSpriteMap)
            }
          }
          if (sc.eyeVariants) {
            configStore.setEyeVariantSprites(sc.eyeVariants)
          }
          if (sc.eyebrowVariants) {
            configStore.setEyebrowVariantSprites(sc.eyebrowVariants)
          }
          // Sync body part images so right panel grids show correct sprites
          const parts: CharacterPartTab[] = ['body', 'eye', 'eyebrow', 'hair', 'viseme', 'shirt', 'pants', 'shoes']
          for (const part of parts) {
            const images = sc.bodyParts?.[part] || []
            configStore.setSavedImages(part, images)
          }
        }
      }
      setRightPanelTab(tab)
    },
    [char.id, char.savedCharacterId, selectDialogueCharacter, selectSavedCharacter, setRightPanelTab],
  )

  // ── Eye segment click: open eye tab + highlight the matching eye variant sprite ──
  const handleEyeSegmentClick = useCallback(
    (emotion: string) => {
      selectCharAndOpenTab('eye')

      // Try to find a matching eye sprite index in bodyParts.eye by label
      const eyeLabels = savedCharacter?.spriteLabels?.eye || useCharacterConfigStore.getState().spriteLabels.eye || {}
      const eyeSprites = bodyParts?.eye || configSavedImages.eye || []
      if (eyeSprites.length > 0) {
        const emotionLower = emotion.toLowerCase()
        for (const [idx, label] of Object.entries(eyeLabels)) {
          if (label.toLowerCase().includes(emotionLower) || emotionLower.includes(label.toLowerCase())) {
            useCharacterPartsStore.getState().setSelectedSprite('eye', Number(idx))
            return
          }
        }
      }
    },
    [selectCharAndOpenTab, savedCharacter, bodyParts, configSavedImages],
  )

  // ── Viseme segment click: open viseme tab + select the matching viseme sprite ──
  const handleVisemeSegmentClick = useCallback(
    (viseme: Viseme) => {
      selectCharAndOpenTab('viseme')

      const configState = useCharacterConfigStore.getState()

      // For curved visemes (24-sprite system), highlight the specific key in the right panel
      if (configState.useCurvedVisemes) {
        // Default to neutral curvature for highlight (since we don't know the exact emotion from the timeline click)
        const key = `neutral_${viseme}`
        useEditorStore.getState().setHighlightedVisemeKey(key)
        // Auto-clear the highlight after a few seconds
        setTimeout(() => {
          useEditorStore.getState().setHighlightedVisemeKey(null)
        }, 3000)
      } else {
        // Legacy 8-sprite system: use visemeMapping to find the sprite index
        const mapping = configState.visemeMapping
        const idx = mapping[viseme]
        if (idx !== null && idx !== undefined) {
          useCharacterPartsStore.getState().setSelectedSprite('viseme', idx)
        }
      }
    },
    [selectCharAndOpenTab],
  )

  // ── Hair segment click: open hair tab ──
  const handleHairSegmentClick = useCallback(() => {
    selectCharAndOpenTab('hair')
  }, [selectCharAndOpenTab])

  // ── Body segment click: open body tab ──
  const handleBodySegmentClick = useCallback(() => {
    selectCharAndOpenTab('body')
  }, [selectCharAndOpenTab])

  // ── Sprite override: set a specific sprite index for a dialogue line ──
  const handleSpriteOverride = useCallback(
    (lineId: string, part: 'hair' | 'body', spriteIndex: number) => {
      const line = lines.find((l) => l.id === lineId)
      if (!line) return
      updateDialogueLine(lineId, {
        spriteOverrides: {
          ...line.spriteOverrides,
          [part]: spriteIndex,
        },
      })
    },
    [lines, updateDialogueLine],
  )

  // Get sprite arrays and labels for picker
  const hairSprites = bodyParts?.hair || configSavedImages.hair || []
  const bodySprites = bodyParts?.body || configSavedImages.body || []
  const spriteLabelsData = savedCharacter?.spriteLabels || useCharacterConfigStore.getState().spriteLabels
  const hairLabels = spriteLabelsData?.hair || {}
  const bodyLabels = spriteLabelsData?.body || {}

  if (lines.length === 0) return null

  return (
    <>
      {/* ═══ Main character track ═══ */}
      <div className="flex border-b border-zinc-700/50 cursor-pointer" style={{ height: ROW_HEIGHT }}>
        {/* Header */}
        <div
          className="w-40 flex-shrink-0 flex items-center gap-1 px-2 bg-zinc-800 border-r border-zinc-700/50 sticky left-0 z-10"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          <ChevronRight
            size={12}
            className="flex-shrink-0 text-zinc-500 transition-transform duration-150"
            style={{ transform: expanded ? 'rotate(90deg)' : undefined }}
          />
          {eyeThumb ? (
            <img
              src={eyeThumb}
              alt={char.name}
              className="w-5 h-5 rounded-sm object-contain flex-shrink-0"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              draggable={false}
            />
          ) : (
            <div className="w-5 h-5 rounded-sm flex-shrink-0" style={{ backgroundColor: char.color + '44' }} />
          )}
          <span className="text-[10px] font-medium truncate select-none" style={{ color: '#d4d4d8' }}>
            {char.name}
          </span>
        </div>

        {/* Main bar: spans overall character presence, contains dialogue line sub-bars */}
        <div className="flex-1 relative bg-zinc-900/30">
          {/* Overall character presence bar (faint) */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-sm pointer-events-none select-none"
            style={{
              left: minStart * pixelsPerFrame,
              width: Math.max((maxEnd - minStart) * pixelsPerFrame, 8),
              backgroundColor: colors.bg,
              borderLeft: `2px solid ${colors.border}`,
              opacity: 0.4,
            }}
          />
          {/* Individual dialogue line bars on top — with vertical offset for overlapping lines */}
          {lines.map((line, lineIdx) => {
            const left = line.startFrame * pixelsPerFrame
            const width = (line.endFrame - line.startFrame) * pixelsPerFrame
            const isLineSelected = selectedDialogueLineId === line.id
            const cleanScript = line.script.replace(/\[[\w-]+\]/g, '').trim()
            const preview = cleanScript.length > 20 ? cleanScript.slice(0, 20) + '…' : cleanScript

            // Detect overlap with earlier lines in this character's track
            const overlapCount = lines
              .slice(0, lineIdx)
              .filter((prev) => line.startFrame < prev.endFrame && prev.startFrame < line.endFrame).length

            return (
              <div
                key={line.id}
                className="absolute rounded-sm overflow-hidden select-none cursor-pointer"
                style={{
                  left,
                  width: Math.max(width, 8),
                  backgroundColor: colors.bg,
                  borderLeft: `2px solid ${colors.border}`,
                  outline: isLineSelected ? `1px solid ${colors.text}` : 'none',
                  // Offset overlapping clips vertically and reduce opacity for distinction
                  top: overlapCount > 0 ? `${2 + overlapCount * 6}px` : '2px',
                  bottom: overlapCount > 0 ? '2px' : '2px',
                  opacity: overlapCount > 0 ? 0.75 : 1,
                  zIndex: overlapCount,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  selectDialogueLine(line.id)
                  setLeftPanelBottomTab('scripts')
                }}
              >
                {width > 50 && (
                  <span
                    className="absolute inset-0 flex items-center px-2 text-[9px] font-medium truncate"
                    style={{ color: colors.text }}
                  >
                    {preview || '(empty)'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ Collapsible sub-tracks ═══ */}
      {expanded && (
        <>
          <EyeSubTrack
            charName={char.name}
            lines={lines}
            pixelsPerFrame={pixelsPerFrame}
            thumbnail={eyeThumb}
            onSegmentClick={handleEyeSegmentClick}
          />
          <VisemeSubTrack
            charName={char.name}
            lines={lines}
            pixelsPerFrame={pixelsPerFrame}
            thumbnail={visemeThumb}
            onSegmentClick={handleVisemeSegmentClick}
          />
          {hairSprites.length > 0 ? (
            <PerLinePartSubTrack
              charName={char.name}
              charColor={char.color}
              part="hair"
              lines={lines}
              pixelsPerFrame={pixelsPerFrame}
              thumbnail={hairThumb}
              sprites={hairSprites}
              spriteLabels={hairLabels}
              onSegmentClick={handleHairSegmentClick}
              onSpriteOverride={handleSpriteOverride}
            />
          ) : null}
          {bodySprites.length > 0 ? (
            <PerLinePartSubTrack
              charName={char.name}
              charColor={char.color}
              part="body"
              lines={lines}
              pixelsPerFrame={pixelsPerFrame}
              thumbnail={bodyThumb}
              sprites={bodySprites}
              spriteLabels={bodyLabels}
              onSegmentClick={handleBodySegmentClick}
              onSpriteOverride={handleSpriteOverride}
            />
          ) : null}
        </>
      )}
    </>
  )
}

// ─── Main DialogueTrack export ────────────────────────────────────────────────

/**
 * DialogueTrack renders a hierarchical track per dialogue character:
 * - Main track: character name + overall presence bar + per-line dialogue bars
 * - Sub-tracks (collapsible): head (emotions), viseme, hair, body
 *
 * Clicking a sub-track segment selects the character, opens the matching
 * right panel tab, and highlights the active sprite.
 */
export function DialogueTrack({ pixelsPerFrame }: DialogueTrackProps) {
  const characters = useMultiCharacterStore((s) => s.characters)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)

  if (characters.length === 0 || dialogueLines.length === 0) {
    return null
  }

  // Group dialogue lines by character
  const linesByCharacter = new Map<string, DialogueLine[]>()
  for (const line of dialogueLines) {
    const existing = linesByCharacter.get(line.characterId) || []
    existing.push(line)
    linesByCharacter.set(line.characterId, existing)
  }

  // Only render characters that have dialogue lines
  const activeCharacters = characters.filter((c) => linesByCharacter.has(c.id))

  return (
    <>
      {activeCharacters.map((char) => {
        const lines = (linesByCharacter.get(char.id) || []).sort((a, b) => a.order - b.order)
        return <CharacterGroup key={char.id} char={char} lines={lines} pixelsPerFrame={pixelsPerFrame} />
      })}
    </>
  )
}

/** Returns the total number of visible rows for dialogue tracks (for height calculation) */
export function getDialogueTrackRowCount(
  characters: DialogueCharacter[],
  dialogueLines: DialogueLine[],
  expandedCharIds: Set<string>,
): number {
  let count = 0
  for (const char of characters) {
    const hasLines = dialogueLines.some((l) => l.characterId === char.id)
    if (!hasLines) continue
    count += 1 // main track
    if (expandedCharIds.has(char.id)) {
      count += 2 // eye + viseme always
      // hair + body + other parts only if sprites exist — but we can't check that here easily,
      // so we'll just add max 6 sub-tracks for height calculation safety
      count += 6
    }
  }
  return count
}
