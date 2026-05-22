import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlashCardConfig {
  question: string
  answer: string
  bgColor: string
  cardColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneFlashCardComponent({ config, progress }: MotionGraphicProps<FlashCardConfig>) {
  const { question, answer, bgColor, cardColor, textColor, accentColor } = config

  // Phases: enter (0-0.2), hold-front (0.2-0.4), flip (0.4-0.6), hold-back (0.6-0.8), exit (0.8-1)
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const flipProgress = progress >= 0.4 && progress < 0.6 ? (progress - 0.4) / 0.2 : progress >= 0.6 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card slide-in from right
  const slideX = enterProgress < 1
    ? (1 - easeOutBack(enterProgress)) * 120
    : exitProgress > 0
      ? easeInCubic(exitProgress) * -120
      : 0

  const cardOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Flip rotation: 0 -> 180 degrees
  const rotateY = flipProgress * 180

  // Which side is showing
  const showingBack = rotateY > 90

  // Card wobble during hold
  const holdWobble = progress >= 0.2 && progress < 0.4
    ? Math.sin((progress - 0.2) / 0.2 * Math.PI * 3) * 1.5
    : progress >= 0.6 && progress < 0.8
      ? Math.sin((progress - 0.6) / 0.2 * Math.PI * 2) * 1
      : 0

  // Celebration sparkles after flip
  const showCelebration = progress >= 0.6 && progress < 0.8
  const celebrationProgress = showCelebration ? (progress - 0.6) / 0.2 : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background dots pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${accentColor}15 2px, transparent 2px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Card container with perspective */}
      <div
        style={{
          perspective: '1000px',
          transform: `translateX(${slideX}%)`,
          opacity: cardOpacity,
        }}
      >
        <div
          style={{
            width: 'clamp(260px, 60vw, 500px)',
            height: 'clamp(180px, 40vw, 340px)',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotateY}deg) rotate(${holdWobble}deg)`,
            transition: 'none',
          }}
        >
          {/* Front side - Question */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              background: cardColor,
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8%',
              boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)`,
              border: `3px solid ${accentColor}`,
            }}
          >
            {/* Question mark badge */}
            <div
              style={{
                position: 'absolute',
                top: '8%',
                right: '8%',
                width: 'clamp(28px, 5vw, 48px)',
                height: 'clamp(28px, 5vw, 48px)',
                borderRadius: '50%',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
                fontSize: 'clamp(16px, 3vw, 28px)',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              ?
            </div>
            <div
              style={{
                fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
                fontSize: 'clamp(24px, 6vw, 56px)',
                fontWeight: 700,
                color: textColor,
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {question}
            </div>
          </div>

          {/* Back side - Answer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: accentColor,
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8%',
              boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)`,
              border: `3px solid ${cardColor}`,
            }}
          >
            {/* Checkmark badge */}
            <div
              style={{
                position: 'absolute',
                top: '8%',
                right: '8%',
                width: 'clamp(28px, 5vw, 48px)',
                height: 'clamp(28px, 5vw, 48px)',
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
                fontSize: 'clamp(16px, 3vw, 28px)',
                fontWeight: 700,
                color: accentColor,
              }}
            >
              !
            </div>
            <div
              style={{
                fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
                fontSize: 'clamp(28px, 7vw, 64px)',
                fontWeight: 700,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 1.2,
                textShadow: '2px 2px 0 rgba(0,0,0,0.15)',
              }}
            >
              {answer}
            </div>
          </div>
        </div>
      </div>

      {/* Celebration sparkles */}
      {showCelebration && [0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        const dist = 80 + celebrationProgress * 120
        const x = Math.cos(angle) * dist
        const y = Math.sin(angle) * dist
        const sparkleOpacity = celebrationProgress < 0.5 ? celebrationProgress * 2 : 2 - celebrationProgress * 2
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'clamp(8px, 1.5vw, 16px)',
              height: 'clamp(8px, 1.5vw, 16px)',
              borderRadius: '50%',
              background: i % 2 === 0 ? '#FFD700' : accentColor,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${sparkleOpacity})`,
              opacity: sparkleOpacity,
            }}
          />
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-flash-card',
  title: 'Scene Flash Card',
  description: 'Educational flashcard with front side question that flips to reveal the answer with a celebration effect',
  tags: ['scene', 'education', 'flashcard', 'kids', 'learning', 'flip'],
  category: 'scene-layout',
  component: SceneFlashCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    question: 'What color is the sky?',
    answer: 'BLUE!',
    bgColor: '#E8F4FD',
    cardColor: '#FFFFFF',
    textColor: '#2D3436',
    accentColor: '#6C5CE7',
  },
  configSchema: [
    { key: 'question', label: 'Question', type: 'text', defaultValue: 'What color is the sky?', group: 'Content' },
    { key: 'answer', label: 'Answer', type: 'text', defaultValue: 'BLUE!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8F4FD', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6C5CE7', group: 'Style' },
  ],
})
