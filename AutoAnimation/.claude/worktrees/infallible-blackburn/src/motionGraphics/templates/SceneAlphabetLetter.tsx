import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AlphabetLetterConfig {
  letter: string
  word: string
  emoji: string
  bgColor: string
  letterColor: string
  textColor: string
}

function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const u = t - 1.5 / 2.75; return 7.5625 * u * u + 0.75 }
  if (t < 2.5 / 2.75) { const u = t - 2.25 / 2.75; return 7.5625 * u * u + 0.9375 }
  const u = t - 2.625 / 2.75
  return 7.5625 * u * u + 0.984375
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneAlphabetLetterComponent({ config, progress, frame, fps }: MotionGraphicProps<AlphabetLetterConfig>) {
  const { letter, word, emoji, bgColor, letterColor, textColor } = config

  // Phases
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Big letter bounces in from top
  const letterBounce = bounceEase(Math.min(1, enterProgress * 1.5))
  const letterScale = enterProgress < 1
    ? letterBounce * 1.2
    : exitProgress > 0
      ? 1.2 - easeInCubic(exitProgress) * 1.2
      : 1.2 + Math.sin(holdProgress * Math.PI * 4) * 0.05
  const letterOpacity = enterProgress < 1
    ? Math.min(1, enterProgress * 3)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const letterY = enterProgress < 1
    ? (1 - letterBounce) * -60
    : exitProgress > 0
      ? easeInCubic(exitProgress) * 60
      : 0

  // "is for" text fades in after letter
  const isForDelay = 0.4
  const isForProgress = enterProgress < 1
    ? Math.max(0, (enterProgress - isForDelay) / (1 - isForDelay))
    : 1
  const isForOpacity = isForProgress < 1
    ? easeOutCubic(isForProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Word slides in from right
  const wordDelay = 0.55
  const wordProgress = enterProgress < 1
    ? Math.max(0, (enterProgress - wordDelay) / (1 - wordDelay))
    : 1
  const wordX = wordProgress < 1
    ? (1 - easeOutCubic(wordProgress)) * 50
    : exitProgress > 0
      ? easeInCubic(exitProgress) * -50
      : 0
  const wordOpacity = wordProgress < 1
    ? easeOutCubic(wordProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Emoji bounces in last
  const emojiDelay = 0.7
  const emojiProgress = enterProgress < 1
    ? Math.max(0, (enterProgress - emojiDelay) / (1 - emojiDelay))
    : 1
  const emojiBounce = bounceEase(Math.min(1, emojiProgress))
  const emojiScale = emojiProgress < 1
    ? emojiBounce
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1 + Math.sin(holdProgress * Math.PI * 3) * 0.1
  const emojiOpacity = emojiProgress < 1
    ? Math.min(1, emojiProgress * 2)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Background color based on letter index
  const time = frame / fps

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 'clamp(60px, 15vw, 150px)',
            height: 'clamp(60px, 15vw, 150px)',
            borderRadius: '50%',
            background: `hsla(${(i * 90 + time * 10) % 360}, 70%, 70%, 0.15)`,
            left: `${[10, 80, 15, 75][i]}%`,
            top: `${[10, 20, 75, 80][i]}%`,
            transform: `translate(-50%, -50%) scale(${1 + Math.sin(time * 0.5 + i) * 0.2})`,
          }}
        />
      ))}

      {/* Big letter */}
      <div
        style={{
          fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
          fontSize: 'clamp(80px, 22vw, 240px)',
          fontWeight: 700,
          color: letterColor,
          transform: `scale(${letterScale}) translateY(${letterY}px)`,
          opacity: letterOpacity,
          textShadow: '4px 4px 0 rgba(0,0,0,0.1)',
          lineHeight: 1,
        }}
      >
        {letter.toUpperCase()}
      </div>

      {/* "is for" text */}
      <div
        style={{
          fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
          fontSize: 'clamp(16px, 4vw, 36px)',
          fontWeight: 400,
          color: textColor,
          opacity: isForOpacity,
          marginTop: '-0.2em',
          marginBottom: '0.3em',
          letterSpacing: 2,
        }}
      >
        is for
      </div>

      {/* Word + Emoji row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(12px, 3vw, 32px)',
        }}
      >
        <div
          style={{
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(36px, 10vw, 100px)',
            fontWeight: 700,
            color: textColor,
            transform: `translateX(${wordX}px)`,
            opacity: wordOpacity,
            textShadow: '2px 2px 0 rgba(0,0,0,0.08)',
          }}
        >
          {word}
        </div>
        <div
          style={{
            fontSize: 'clamp(40px, 10vw, 100px)',
            transform: `scale(${emojiScale})`,
            opacity: emojiOpacity,
          }}
        >
          {emoji}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-alphabet-letter',
  title: 'Scene Alphabet Letter',
  description: '"A is for Apple" style educational card with large letter, word, and emoji icon for ABC learning',
  tags: ['scene', 'education', 'alphabet', 'kids', 'learning', 'ABC'],
  category: 'scene-layout',
  component: SceneAlphabetLetterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    letter: 'A',
    word: 'Apple',
    emoji: '\uD83C\uDF4E',
    bgColor: '#FFF3E0',
    letterColor: '#FF5722',
    textColor: '#3E2723',
  },
  configSchema: [
    { key: 'letter', label: 'Letter', type: 'text', defaultValue: 'A', group: 'Content' },
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'Apple', group: 'Content' },
    { key: 'emoji', label: 'Emoji', type: 'text', defaultValue: '\uD83C\uDF4E', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF3E0', group: 'Style' },
    { key: 'letterColor', label: 'Letter Color', type: 'color', defaultValue: '#FF5722', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3E2723', group: 'Style' },
  ],
})
