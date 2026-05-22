import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAnimalFactConfig {
  animalEmoji: string
  animalName: string
  fact: string
  habitat: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneAnimalFactComponent({ config, progress }: MotionGraphicProps<SceneAnimalFactConfig>) {
  const { animalEmoji, animalName, fact, habitat, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardY = enterProgress < 1
    ? (1 - easeOutBack(enterProgress)) * 80
    : exitProgress > 0
      ? easeInCubic(exitProgress) * -60
      : 0
  const cardOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Animal emoji bounce
  const emojiBounce = Math.sin(holdProgress * Math.PI * 8) * 8
  const emojiRotate = Math.sin(holdProgress * Math.PI * 4) * 5

  // Staggered content reveals
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const factReveal = holdProgress > 0.1 ? easeOutCubic(Math.min(1, (holdProgress - 0.1) / 0.3)) : 0
  const habitatReveal = holdProgress > 0.4 ? easeOutCubic(Math.min(1, (holdProgress - 0.4) / 0.3)) : 0

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
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
      }}
    >
      {/* Paw print pattern */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${12 + (i % 4) * 25}%`,
            top: `${10 + Math.floor(i / 4) * 70}%`,
            fontSize: 'clamp(16px, 3vw, 28px)',
            opacity: 0.08,
            transform: `rotate(${i * 35}deg)`,
          }}
        >
          {'\u{1F43E}'}
        </div>
      ))}

      <div
        style={{
          transform: `translateY(${cardY}px)`,
          opacity: cardOpacity,
          width: '85%',
          maxWidth: '480px',
        }}
      >
        {/* Card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(20px, 5vw, 40px)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)`,
            border: `3px solid ${accentColor}40`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Accent stripe */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 'clamp(4px, 0.8vw, 6px)',
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}CC)`,
              borderRadius: 'clamp(16px, 3vw, 28px) clamp(16px, 3vw, 28px) 0 0',
            }}
          />

          {/* Emoji and name row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(10px, 2vw, 20px)',
              marginBottom: 'clamp(14px, 3vw, 24px)',
              marginTop: 'clamp(4px, 1vw, 8px)',
            }}
          >
            {/* Animal emoji circle */}
            <div
              style={{
                width: 'clamp(56px, 12vw, 90px)',
                height: 'clamp(56px, 12vw, 90px)',
                borderRadius: '50%',
                background: `${accentColor}15`,
                border: `3px solid ${accentColor}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(28px, 6vw, 48px)',
                flexShrink: 0,
                transform: `translateY(${emojiBounce}px) rotate(${emojiRotate}deg)`,
              }}
            >
              {animalEmoji}
            </div>

            <div>
              {/* Animal name */}
              <div
                style={{
                  fontSize: 'clamp(24px, 6vw, 44px)',
                  fontWeight: 700,
                  color: textColor,
                  lineHeight: 1.1,
                  opacity: nameReveal,
                  transform: `translateX(${(1 - nameReveal) * 20}px)`,
                }}
              >
                {animalName}
              </div>
              {/* Habitat tag */}
              <div
                style={{
                  display: 'inline-block',
                  background: `${accentColor}20`,
                  color: accentColor,
                  fontSize: 'clamp(9px, 1.8vw, 14px)',
                  fontWeight: 600,
                  padding: 'clamp(2px, 0.5vw, 4px) clamp(8px, 1.5vw, 14px)',
                  borderRadius: '100px',
                  marginTop: 'clamp(4px, 1vw, 8px)',
                  opacity: habitatReveal,
                  transform: `scale(${habitatReveal})`,
                }}
              >
                {'\u{1F30D}'} {habitat}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: '2px',
              background: `linear-gradient(90deg, ${accentColor}30, transparent)`,
              marginBottom: 'clamp(12px, 3vw, 20px)',
              opacity: factReveal,
              transform: `scaleX(${factReveal})`,
              transformOrigin: 'left',
            }}
          />

          {/* Did you know label */}
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 15px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'clamp(6px, 1.5vw, 12px)',
              opacity: factReveal,
            }}
          >
            {'\u{1F4A1}'} Did you know?
          </div>

          {/* Fact */}
          <div
            style={{
              fontSize: 'clamp(14px, 2.8vw, 22px)',
              fontWeight: 500,
              color: textColor,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              lineHeight: 1.5,
              opacity: factReveal,
              transform: `translateY(${(1 - factReveal) * 10}px)`,
            }}
          >
            {fact}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-animal-fact',
  title: 'Animal Fact',
  description: 'Cute animal fact card with emoji illustration, name, habitat tag, and fun fact. Bouncy animal icon with staggered reveal.',
  tags: ['scene', 'kids', 'education', 'animal', 'nature', 'fact', 'cartoon', 'cute'],
  category: 'scene-layout',
  component: SceneAnimalFactComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    animalEmoji: '\u{1F42C}',
    animalName: 'Dolphin',
    fact: 'Dolphins sleep with one eye open! They rest one half of their brain at a time so they can keep breathing.',
    habitat: 'Ocean',
    bgColor: '#E8F8FF',
    cardColor: '#FFFFFF',
    accentColor: '#00B4D8',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'animalEmoji', label: 'Animal Emoji', type: 'text', defaultValue: '\u{1F42C}', group: 'Content' },
    { key: 'animalName', label: 'Animal Name', type: 'text', defaultValue: 'Dolphin', group: 'Content' },
    { key: 'fact', label: 'Fun Fact', type: 'text', defaultValue: 'Dolphins sleep with one eye open! They rest one half of their brain at a time so they can keep breathing.', group: 'Content' },
    { key: 'habitat', label: 'Habitat', type: 'text', defaultValue: 'Ocean', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8F8FF', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00B4D8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
