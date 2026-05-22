import React, { useMemo } from 'react'
import { useFrame } from '@/engine'
import type { CaptionData } from './types'
import type { WordEvent } from '@/types/voice'
import { getCaptionPreset } from '@/data/captionPresets'

interface RemotionCaptionsProps {
  captions: CaptionData
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
  const words = captionData.text.split(' ')

  // Resolve styles: preset overrides defaults
  const resolvedFontFamily = preset?.fontFamily ?? 'inherit'
  const resolvedFontWeight = preset?.fontWeight ?? 700
  const resolvedFontSize = preset ? Math.round(fontSize * preset.fontSize) : fontSize
  const resolvedColor = preset?.color ?? (style === 'word-by-word' ? '#4ade80' : 'white')
  const resolvedHighlightColor = preset?.highlightColor ?? '#4ade80'
  const resolvedBgColor = preset?.bgColor ?? '#000000'
  const resolvedBgOpacity = preset ? preset.bgOpacity : 0.7
  const resolvedBorderRadius = preset?.borderRadius ?? 12
  const resolvedStrokeColor = preset?.strokeColor
  const resolvedStrokeWidth = preset?.strokeWidth ?? 0

  const textStroke: React.CSSProperties = resolvedStrokeColor && resolvedStrokeWidth > 0
    ? { WebkitTextStroke: `${resolvedStrokeWidth}px ${resolvedStrokeColor}` }
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

  return (
    <div style={positionStyle}>
      <div
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: resolvedBgOpacity > 0
            ? `rgba(${parseInt(resolvedBgColor.slice(1, 3), 16)}, ${parseInt(resolvedBgColor.slice(3, 5), 16)}, ${parseInt(resolvedBgColor.slice(5, 7), 16)}, ${resolvedBgOpacity})`
            : 'transparent',
          borderRadius: resolvedBorderRadius,
          backdropFilter: resolvedBgOpacity > 0 ? `blur(${preset?.bgBlur ?? 4}px)` : undefined,
        }}
      >
        {style === 'karaoke' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  fontFamily: resolvedFontFamily,
                  fontSize: resolvedFontSize,
                  fontWeight: resolvedFontWeight,
                  color: i === captionData.highlightIndex ? resolvedHighlightColor : resolvedColor,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  transition: 'color 0.1s',
                  ...textStroke,
                }}
              >
                {word}
              </span>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}
