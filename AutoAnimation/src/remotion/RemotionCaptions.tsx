import React, { useMemo } from 'react'
import { useFrame } from '@/engine'
import type { CaptionData } from './types'
import type { WordEvent } from '@/types/voice'
import { getCaptionPreset } from '@/data/captionPresets'

interface RemotionCaptionsProps {
  captions: CaptionData
}

function getPhraseAtFrame(
  words: WordEvent[],
  frame: number,
  chunkSize: number,
): { text: string; highlightIndex: number } | null {
  if (words.length === 0) return null
  const size = Math.max(1, Math.min(5, Math.round(chunkSize)))

  let activeIndex = words.findIndex((w) => frame >= w.startFrame && frame < w.endFrame)
  if (activeIndex === -1) {
    const next = words.findIndex((w) => w.startFrame > frame)
    if (next === -1) return null
    activeIndex = next
  }

  const chunkStart = Math.floor(activeIndex / size) * size
  const chunk = words.slice(chunkStart, chunkStart + size)
  if (chunk.length === 0) return null

  return {
    text: chunk.map((w) => w.word).join(' '),
    highlightIndex: activeIndex - chunkStart,
  }
}

function getCaptionAtFrame(captions: CaptionData, frame: number): { text: string; highlightIndex?: number } | null {
  const { style, wordTimeline, sentenceTimeline } = captions

  switch (style) {
    case 'word-by-word': {
      const word = wordTimeline.find(w => frame >= w.startFrame && frame < w.endFrame)
      return word ? { text: word.word } : null
    }
    case 'sentence': {
      const sentence = sentenceTimeline.find(s => frame >= s.startFrame && frame < s.endFrame)
      return sentence ? { text: sentence.sentence } : null
    }
    case 'karaoke': {
      const sentence = sentenceTimeline.find(s => frame >= s.startFrame && frame < s.endFrame)
      if (!sentence) return null
      const activeWordIndex = sentence.words.findIndex(
        (w: WordEvent) => frame >= w.startFrame && frame < w.endFrame
      )
      return {
        text: sentence.sentence,
        highlightIndex: activeWordIndex >= 0 ? activeWordIndex : undefined,
      }
    }
    case 'phrase': {
      return getPhraseAtFrame(wordTimeline, frame, captions.phraseSize ?? 3)
    }
    default:
      return null
  }
}

export const RemotionCaptions: React.FC<RemotionCaptionsProps> = ({ captions }) => {
  const frame = useFrame()
  const captionData = getCaptionAtFrame(captions, frame)
  const preset = useMemo(
    () => (captions.presetId ? getCaptionPreset(captions.presetId) : undefined),
    [captions.presetId]
  )

  if (!captionData) return null

  const { style, fontSize, position } = captions
  const isPhrase = style === 'phrase'
  const words = captionData.text.split(' ')

  // Resolve styles: preset overrides defaults
  const resolvedFontFamily = preset?.fontFamily ?? 'inherit'
  const resolvedFontWeight = preset?.fontWeight ?? (isPhrase ? 900 : 700)
  const baseFontSize = isPhrase ? Math.max(fontSize, 56) : fontSize
  const resolvedFontSize = preset ? Math.round(baseFontSize * preset.fontSize) : baseFontSize
  const resolvedColor = preset?.color ?? (style === 'word-by-word' ? '#4ade80' : 'white')
  const resolvedHighlightColor = preset?.highlightColor ?? (isPhrase ? '#facc15' : '#4ade80')
  const resolvedBgColor = preset?.bgColor ?? '#000000'
  const resolvedBgOpacity = preset ? preset.bgOpacity : isPhrase ? 0 : 0.7
  const resolvedBorderRadius = preset?.borderRadius ?? 12
  const resolvedStrokeColor = preset?.strokeColor ?? (isPhrase ? '#000000' : undefined)
  const resolvedStrokeWidth = preset?.strokeWidth ?? (isPhrase ? 4 : 0)

  const textStroke: React.CSSProperties = resolvedStrokeColor && resolvedStrokeWidth > 0
    ? { WebkitTextStroke: `${resolvedStrokeWidth}px ${resolvedStrokeColor}`, paintOrder: 'stroke fill' as const }
    : {}

  const resolvedPos = preset?.position ?? position

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 50,
    ...(resolvedPos === 'top' ? { top: 32 } : {}),
    ...(resolvedPos === 'center' ? { top: '50%', transform: 'translateY(-50%)' } : {}),
    ...(resolvedPos === 'bottom' ? { bottom: 32 } : {}),
  }

  const wrapperStyle: React.CSSProperties = {
    paddingLeft: isPhrase ? 16 : 24,
    paddingRight: isPhrase ? 16 : 24,
    paddingTop: isPhrase ? 8 : 12,
    paddingBottom: isPhrase ? 8 : 12,
    backgroundColor: resolvedBgOpacity > 0
      ? `rgba(${parseInt(resolvedBgColor.slice(1, 3), 16)}, ${parseInt(resolvedBgColor.slice(3, 5), 16)}, ${parseInt(resolvedBgColor.slice(5, 7), 16)}, ${resolvedBgOpacity})`
      : 'transparent',
    borderRadius: isPhrase ? 0 : resolvedBorderRadius,
    backdropFilter: resolvedBgOpacity > 0 ? `blur(${preset?.bgBlur ?? 4}px)` : undefined,
  }

  if (isPhrase || style === 'karaoke') {
    return (
      <div style={positionStyle}>
        <div style={wrapperStyle}>
          <div style={{ display: 'flex', gap: isPhrase ? 14 : 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {words.map((word, i) => {
              const isActive = i === captionData.highlightIndex
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: resolvedFontFamily,
                    fontSize: resolvedFontSize,
                    fontWeight: resolvedFontWeight,
                    color: isActive ? resolvedHighlightColor : resolvedColor,
                    textShadow: '0 4px 8px rgba(0,0,0,0.6)',
                    textTransform: isPhrase ? 'uppercase' : 'none',
                    letterSpacing: isPhrase ? '0.02em' : 'normal',
                    transform: isPhrase && isActive ? 'scale(1.08)' : 'scale(1)',
                    display: 'inline-block',
                    ...textStroke,
                  }}
                >
                  {word}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={positionStyle}>
      <div style={wrapperStyle}>
        <span
          style={{
            fontFamily: resolvedFontFamily,
            fontSize: resolvedFontSize,
            fontWeight: resolvedFontWeight,
            color: style === 'word-by-word' ? resolvedHighlightColor : resolvedColor,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            ...textStroke,
          }}
        >
          {captionData.text}
        </span>
      </div>
    </div>
  )
}
