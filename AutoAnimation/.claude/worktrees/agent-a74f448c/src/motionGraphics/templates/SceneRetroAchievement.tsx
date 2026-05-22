import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroAchievementConfig {
  title: string
  description: string
  points: string
  icon: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneRetroAchievementComponent({ config, frame, fps, progress }: MotionGraphicProps<RetroAchievementConfig>) {
  const { title, description, points, icon, bgColor, cardColor, accentColor, textColor } = config
  const time = frame / fps

  // Phases: slide in (0-0.2), shine (0.2-0.4), hold (0.4-0.75), slide out (0.75-1)
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const shineProgress = progress >= 0.2 && progress < 0.4 ? (progress - 0.2) / 0.2 : progress >= 0.4 ? 1 : 0
  const exitProgress = progress > 0.75 ? (progress - 0.75) / 0.25 : 0

  const slideY = enterProgress < 1
    ? (1 - easeOutBack(enterProgress)) * -120
    : exitProgress > 0
      ? easeOutCubic(exitProgress) * -120
      : 0

  const cardOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeOutCubic(exitProgress)
      : 1

  // Shine sweep across card
  const shineX = shineProgress * 200 - 50

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8%',
        overflow: 'hidden',
      }}
    >
      {/* CRT lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Achievement popup card */}
      <div
        style={{
          transform: `translateY(${slideY}px)`,
          opacity: cardOpacity,
          width: 'clamp(280px, 70vw, 550px)',
          background: cardColor,
          borderRadius: 4,
          border: `3px solid ${accentColor}`,
          padding: 'clamp(12px, 2.5vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(10px, 2vw, 20px)',
          position: 'relative',
          overflow: 'hidden',
          imageRendering: 'pixelated' as any,
          boxShadow: `0 0 20px ${accentColor}30, 0 4px 16px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Shine overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${shineX}%`,
            width: '30%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* Icon container */}
        <div
          style={{
            width: 'clamp(48px, 10vw, 80px)',
            height: 'clamp(48px, 10vw, 80px)',
            background: `${accentColor}20`,
            border: `2px solid ${accentColor}`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(24px, 5vw, 44px)',
            flexShrink: 0,
            transform: `scale(${shineProgress > 0 && shineProgress < 1 ? 1 + Math.sin(shineProgress * Math.PI) * 0.1 : 1})`,
          }}
        >
          {icon}
        </div>

        {/* Text content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.5vw, 6px)' }}>
          {/* Achievement unlocked label */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(9px, 1.6vw, 13px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: 3,
              opacity: Math.floor(time * 4) % 3 === 0 ? 0.6 : 1,
            }}
          >
            {'ACHIEVEMENT UNLOCKED'}
          </div>
          {/* Title */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(16px, 3.5vw, 32px)',
              fontWeight: 700,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {title}
          </div>
          {/* Description */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(10px, 2vw, 16px)',
              color: `${textColor}AA`,
              lineHeight: 1.3,
            }}
          >
            {description}
          </div>
        </div>

        {/* Points badge */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(8px, 1.5vw, 16px)',
            right: 'clamp(8px, 1.5vw, 16px)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(12px, 2.2vw, 20px)',
            fontWeight: 700,
            color: accentColor,
            textShadow: `0 0 6px ${accentColor}60`,
          }}
        >
          {`${points}G`}
        </div>

        {/* Pixel corner accents */}
        {[0, 1, 2, 3].map((c) => (
          <div
            key={c}
            style={{
              position: 'absolute',
              [c < 2 ? 'top' : 'bottom']: -1,
              [c % 2 === 0 ? 'left' : 'right']: -1,
              width: 6,
              height: 6,
              background: accentColor,
              imageRendering: 'pixelated' as any,
            }}
          />
        ))}
      </div>

      {/* Particle sparkles on unlock */}
      {progress >= 0.15 && progress < 0.5 && Array.from({ length: 8 }, (_, i) => {
        const sparkleProgress = Math.min(1, (progress - 0.15 - i * 0.02) / 0.2)
        if (sparkleProgress <= 0) return null
        const angle = (i / 8) * Math.PI * 2
        const dist = sparkleProgress * 80
        const sx = Math.cos(angle) * dist
        const sy = Math.sin(angle) * dist - 40
        return (
          <div
            key={`sp-${i}`}
            style={{
              position: 'absolute',
              top: '15%',
              left: '50%',
              width: 4,
              height: 4,
              background: i % 2 === 0 ? accentColor : '#FFD700',
              transform: `translate(calc(-50% + ${sx}px), ${sy}px)`,
              opacity: Math.max(0, 1 - sparkleProgress),
              imageRendering: 'pixelated' as any,
            }}
          />
        )
      })}

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-retro-achievement',
  title: 'Scene Retro Achievement',
  description: 'Xbox-style achievement unlocked popup with pixel art styling, shine sweep, sparkle particles, and gamerscore display',
  tags: ['scene', 'achievement', 'retro', 'gaming', 'xbox', 'popup', 'unlock', 'pixel'],
  category: 'scene-layout',
  component: SceneRetroAchievementComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'PIXEL MASTER',
    description: 'Collected all hidden coins in World 1',
    points: '50',
    icon: '\u{1F3C6}',
    bgColor: '#0a0a0a',
    cardColor: '#1a1a2e',
    accentColor: '#00FF00',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'PIXEL MASTER', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Collected all hidden coins in World 1', group: 'Content' },
    { key: 'points', label: 'Points', type: 'text', defaultValue: '50', group: 'Content' },
    { key: 'icon', label: 'Icon', type: 'text', defaultValue: '\u{1F3C6}', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FF00', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
