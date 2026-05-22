import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FactRevealConfig {
  badge: string
  title: string
  factText: string
  badgeColor: string
  bgColor: string
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

function SceneFactRevealComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FactRevealConfig>) {
  const { badge, title, factText, badgeColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Enter: badge pops in (0-0.12)
  const badgeProgress = easeOutBack(Math.min(1, progress / 0.12))

  // Title slides in (0.08-0.2)
  const titleProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.08) / 0.12)))
  const titleSlideY = (1 - titleProgress) * 30

  // Fact text types in word by word (0.18-0.6)
  const words = factText.split(' ')
  const typeStart = 0.18
  const typeEnd = 0.6
  const typeProgress = Math.max(0, Math.min(1, (progress - typeStart) / (typeEnd - typeStart)))
  const visibleWords = Math.floor(typeProgress * words.length)

  // Hold: badge floats gently (0.3-0.8)
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const badgeFloat = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 6) * 6 : 0

  // Exit: scale down to center and fade (0.82-1.0)
  const exitProgress = progress >= 0.82 ? easeOutCubic((progress - 0.82) / 0.18) : 0
  const exitScale = 1 - exitProgress * 0.3
  const exitOpacity = 1 - exitProgress

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${exitScale})`,
        opacity: exitOpacity,
      }}
    >
      {/* Background accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: '60%',
          height: '40%',
          background: `radial-gradient(ellipse, ${badgeColor}12 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Badge */}
      <div
        style={{
          fontSize: 'clamp(40px, 10vw, 80px)',
          transform: `scale(${badgeProgress}) translateY(${badgeFloat}px)`,
          marginBottom: '3%',
          filter: `drop-shadow(0 0 15px ${badgeColor}60)`,
        }}
      >
        {badge}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(20px, 5vw, 44px)',
          fontWeight: 900,
          color: badgeColor,
          textTransform: 'uppercase',
          letterSpacing: 'clamp(3px, 0.8vw, 8px)',
          opacity: titleProgress,
          transform: `translateY(${titleSlideY}px)`,
          marginBottom: '5%',
        }}
      >
        {title}
      </div>

      {/* Divider line */}
      <div
        style={{
          width: `${titleProgress * 20}%`,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${badgeColor}, transparent)`,
          marginBottom: '5%',
          borderRadius: 1,
        }}
      />

      {/* Fact text - word by word reveal */}
      <div
        style={{
          fontSize: 'clamp(16px, 3.5vw, 32px)',
          fontWeight: 500,
          color: textColor,
          textAlign: 'center',
          maxWidth: '75%',
          lineHeight: 1.6,
          minHeight: 'clamp(40px, 8vw, 70px)',
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              opacity: i < visibleWords ? 1 : 0,
              display: 'inline',
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
        {/* Typing cursor */}
        {typeProgress > 0 && typeProgress < 1 && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: 'clamp(16px, 3.5vw, 32px)',
              background: badgeColor,
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              opacity: Math.sin(progress * 60) > 0 ? 1 : 0,
            }}
          />
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-fact-reveal',
  title: 'Fact Reveal',
  description:
    'Fun fact card with badge pop-in, word-by-word typing reveal, floating badge, and scale-down exit',
  tags: ['scene', 'educational', 'fact', 'did-you-know', 'trivia'],
  category: 'scene-layout',
  component: SceneFactRevealComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'badge', label: 'Badge Emoji', type: 'text', defaultValue: '\uD83D\uDCA1', group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'FUN FACT', group: 'Content' },
    { key: 'factText', label: 'Fact Text', type: 'text', defaultValue: 'Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still perfectly edible.', group: 'Content' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#F1C40F', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    badge: '\uD83D\uDCA1',
    title: 'FUN FACT',
    factText: 'Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still perfectly edible.',
    badgeColor: '#F1C40F',
    bgColor: '#0F0F1A',
    textColor: '#E8E8E8',
  },
})
