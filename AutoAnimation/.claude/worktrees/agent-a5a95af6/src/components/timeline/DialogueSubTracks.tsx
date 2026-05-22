/**
 * DialogueSubTracks — Reusable sub-track rendering for a single dialogue character.
 *
 * Renders the expanded sub-tracks (Eye, Viseme, Hair, Body) inline below
 * the character's clip in the unified timeline. These are extracted from
 * the original DialogueTrack.tsx CharacterGroup component.
 */

import { useState, useEffect } from 'react'
import { useMultiCharacterStore, type DialogueLine } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore, type CharacterPartTab } from '@/stores/useSavedCharactersStore'
import { useEditorStore } from '@/stores'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { detectEmotionFromText } from '@/services/emotionMapping'
import type { Viseme } from '@/types/voice'
import type { RightPanelTab } from '@/types'

const ROW_HEIGHT = 40
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

function charColorToRow(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { bg: `rgba(${r},${g},${b},0.25)`, text: hex, border: `rgba(${r},${g},${b},0.6)` }
}

// ─── Sub-track: Eye ──────────────────────────────────────────────────────────

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

// ─── Sub-track: Viseme ───────────────────────────────────────────────────────

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
      <div className="flex-1 relative bg-zinc-900/20">
        {lines.map((line) =>
          line.visemeTimeline.map((evt, i) => {
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

// ─── Sprite Picker Popup ─────────────────────────────────────────────────────

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
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
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
                className={`flex flex-col items-center gap-0.5 p-1 rounded transition-colors ${isActive ? 'ring-2 ring-green-400 bg-green-400/10' : 'hover:bg-zinc-700/50'}`}
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

// ─── Sub-track: Per-line sprite part (hair / body) ───────────────────────────

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
                  setPickerLineId(line.id)
                  setPickerLeft(left)
                } else onSegmentClick()
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

// ─── Main export ─────────────────────────────────────────────────────────────

interface DialogueSubTracksProps {
  characterId: string
  pixelsPerFrame: number
}

export function DialogueSubTracks({ characterId, pixelsPerFrame }: DialogueSubTracksProps) {
  const char = useMultiCharacterStore((s) => s.characters.find((c) => c.id === characterId))
  const allLines = useMultiCharacterStore((s) => s.dialogueLines)
  const updateDialogueLine = useMultiCharacterStore((s) => s.updateDialogueLine)
  const selectDialogueCharacter = useMultiCharacterStore((s) => s.selectDialogueCharacter)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const selectSavedCharacter = useSavedCharactersStore((s) => s.selectCharacter)
  const configSavedImages = useCharacterConfigStore((s) => s.savedImages)

  if (!char) return null

  const lines = allLines.filter((l) => l.characterId === characterId).sort((a, b) => a.order - b.order)
  if (lines.length === 0) return null

  const savedCharacter = char.savedCharacterId
    ? useSavedCharactersStore.getState().characters.find((c) => c.id === char.savedCharacterId)
    : undefined

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

  const selectCharAndOpenTab = (tab: RightPanelTab) => {
    selectDialogueCharacter(characterId)
    if (char.savedCharacterId) {
      selectSavedCharacter(char.savedCharacterId)
      const sc = useSavedCharactersStore.getState().characters.find((c) => c.id === char.savedCharacterId)
      if (sc?._hydrated) {
        const configStore = useCharacterConfigStore.getState()
        const hasVisemes = Object.values(sc.curvedVisemes).some((v) => v !== null)
        if (hasVisemes) {
          configStore.setCurvedVisemes(sc.curvedVisemes)
          configStore.setUseCurvedVisemes(true)
          if (sc.visemeSpriteMap) configStore.setVisemeSpriteMap(sc.visemeSpriteMap)
        }
        if (sc.eyeVariants) configStore.setEyeVariantSprites(sc.eyeVariants)
        if (sc.eyebrowVariants) configStore.setEyebrowVariantSprites(sc.eyebrowVariants)
        const parts: CharacterPartTab[] = ['body', 'eye', 'eyebrow', 'hair', 'viseme', 'shirt', 'pants', 'shoes']
        for (const part of parts) {
          configStore.setSavedImages(part, sc.bodyParts?.[part] || [])
        }
      }
    }
    setRightPanelTab(tab)
  }

  const handleEyeSegmentClick = (emotion: string) => {
    selectCharAndOpenTab('eye')
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
  }

  const handleVisemeSegmentClick = (viseme: Viseme) => {
    selectCharAndOpenTab('viseme')
    const configState = useCharacterConfigStore.getState()
    if (configState.useCurvedVisemes) {
      const key = `neutral_${viseme}`
      useEditorStore.getState().setHighlightedVisemeKey(key)
      setTimeout(() => useEditorStore.getState().setHighlightedVisemeKey(null), 3000)
    } else {
      const idx = configState.visemeMapping[viseme]
      if (idx !== null && idx !== undefined) {
        useCharacterPartsStore.getState().setSelectedSprite('viseme', idx)
      }
    }
  }

  const handleHairSegmentClick = () => selectCharAndOpenTab('hair')
  const handleBodySegmentClick = () => selectCharAndOpenTab('body')

  const handleSpriteOverride = (lineId: string, part: 'hair' | 'body', spriteIndex: number) => {
    const line = lines.find((l) => l.id === lineId)
    if (!line) return
    updateDialogueLine(lineId, { spriteOverrides: { ...line.spriteOverrides, [part]: spriteIndex } })
  }

  const hairSprites = bodyParts?.hair || configSavedImages.hair || []
  const bodySprites = bodyParts?.body || configSavedImages.body || []
  const spriteLabelsData = savedCharacter?.spriteLabels || useCharacterConfigStore.getState().spriteLabels
  const hairLabels = spriteLabelsData?.hair || {}
  const bodyLabels = spriteLabelsData?.body || {}

  return (
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
      {hairSprites.length > 0 && (
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
      )}
      {bodySprites.length > 0 && (
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
      )}
    </>
  )
}
