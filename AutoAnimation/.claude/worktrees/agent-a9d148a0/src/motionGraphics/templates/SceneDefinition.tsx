import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DefinitionConfig {
  word: string
  pronunciation: string
  partOfSpeech: string
  definition: string
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneDefinitionComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<DefinitionConfig>) {
  const { word, pronunciation, partOfSpeech, definition, accentColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Enter: word types in letter by letter (0-0.2)
  const typeEnd = 0.2
  const typeProgress = Math.min(1, progress / typeEnd)
  const visibleLetters = Math.floor(typeProgress * word.length)
  const typedWord = word.slice(0, visibleLetters)

  // Typing cursor blink
  const cursorVisible = typeProgress < 1 && Math.sin(progress * 80) > 0

  // Pronunciation fades in (0.2-0.3)
  const pronProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.1)))

  // Part of speech fades in (0.25-0.32)
  const posProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.25) / 0.07)))

  // Divider line draws (0.28-0.38)
  const lineProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.28) / 0.1)))

  // Definition slides up (0.35-0.48)
  const defProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.35) / 0.13)))
  const defSlideY = (1 - defProgress) * 30

  // Hold: accent line glow (0.5-0.8)
  const holdProgress = progress >= 0.5 && progress < 0.8 ? (progress - 0.5) / 0.3 : 0
  const lineGlow = holdProgress > 0 ? 0.4 + 0.6 * Math.sin(holdProgress * Math.PI * 4) : 0

  // Exit: card flips away (rotateY) (0.83-1.0)
  const exitProgress = progress >= 0.83 ? easeOutCubic((progress - 0.83) / 0.17) : 0
  const flipAngle = exitProgress * 90
  const exitOpacity = 1 - exitProgress

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200,
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '82%',
          maxWidth: 700,
          padding: 'clamp(24px, 5vw, 48px) clamp(28px, 6vw, 56px)',
          background: `${bgColor === '#FFF8F0' ? '#FFFFFF' : bgColor}`,
          borderRadius: 'clamp(12px, 2vw, 20px)',
          border: `1px solid ${textColor}15`,
          boxShadow: `0 4px 40px ${textColor}08`,
          transform: `rotateY(${flipAngle}deg)`,
          opacity: exitOpacity,
          transformOrigin: 'center center',
        }}
      >
        {/* Word */}
        <div
          style={{
            fontSize: 'clamp(32px, 8vw, 64px)',
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.2,
            marginBottom: 'clamp(4px, 1vw, 8px)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {typedWord}
          {cursorVisible && (
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: 'clamp(32px, 8vw, 64px)',
                background: accentColor,
                marginLeft: 2,
                verticalAlign: 'text-bottom',
              }}
            />
          )}
        </div>

        {/* Pronunciation */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            color: `${textColor}70`,
            fontStyle: 'italic',
            marginBottom: 'clamp(2px, 0.5vw, 4px)',
            opacity: pronProgress,
          }}
        >
          {pronunciation}
        </div>

        {/* Part of speech */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            color: accentColor,
            fontStyle: 'italic',
            fontWeight: 600,
            marginBottom: 'clamp(12px, 3vw, 24px)',
            opacity: posProgress,
          }}
        >
          {partOfSpeech}
        </div>

        {/* Divider line */}
        <div
          style={{
            width: `${lineProgress * 100}%`,
            height: 2,
            background: accentColor,
            marginBottom: 'clamp(12px, 3vw, 24px)',
            borderRadius: 1,
            boxShadow: lineGlow > 0 ? `0 0 ${lineGlow * 12}px ${accentColor}60` : 'none',
          }}
        />

        {/* Definition */}
        <div
          style={{
            fontSize: 'clamp(16px, 3vw, 26px)',
            color: textColor,
            lineHeight: 1.6,
            opacity: defProgress,
            transform: `translateY(${defSlideY}px)`,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 400,
          }}
        >
          {definition}
        </div>
      </div>

      {/* Subtle decorative element - dictionary page corner */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '8%',
          fontSize: 'clamp(10px, 1.5vw, 14px)',
          color: `${textColor}25`,
          fontStyle: 'italic',
          opacity: defProgress,
        }}
      >
        dictionary
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-definition',
  title: 'Dictionary Definition',
  description:
    'Dictionary-style word definition with letter-by-letter typing, pronunciation, part of speech, and flip exit',
  tags: ['scene', 'educational', 'definition', 'dictionary', 'vocabulary'],
  category: 'scene-layout',
  component: SceneDefinitionComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'Serendipity', group: 'Content' },
    { key: 'pronunciation', label: 'Pronunciation', type: 'text', defaultValue: '/\u02CCser.\u0259n\u02C8d\u026Ap.\u0259.ti/', group: 'Content' },
    { key: 'partOfSpeech', label: 'Part of Speech', type: 'text', defaultValue: 'noun', group: 'Content' },
    { key: 'definition', label: 'Definition', type: 'text', defaultValue: 'The occurrence of events by chance in a happy or beneficial way.', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B4513', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C2C2C', group: 'Style' },
  ],
  defaultConfig: {
    word: 'Serendipity',
    pronunciation: '/\u02CCser.\u0259n\u02C8d\u026Ap.\u0259.ti/',
    partOfSpeech: 'noun',
    definition: 'The occurrence of events by chance in a happy or beneficial way.',
    accentColor: '#8B4513',
    bgColor: '#FFF8F0',
    textColor: '#2C2C2C',
  },
})
