import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhotoAwardConfig {
  awardTitle: string
  category: string
  recipient: string
  year: string
  organization: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
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

function ScenePhotoAwardComponent({ config, progress }: MotionGraphicProps<PhotoAwardConfig>) {
  const { awardTitle, category, recipient, year, organization, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card reveal with scale bounce
  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Medal/badge rotation
  const badgeRotation = easeOutCubic(Math.min(1, enterProgress / 0.5)) * 720
  const holdShimmer = Math.sin(holdProgress * Math.PI * 6) * 5

  // Sparkle particles
  const sparkles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2
    const dist = 50 + Math.sin(holdProgress * Math.PI * 3 + i) * 20
    return {
      x: Math.cos(angle + holdProgress * Math.PI) * dist,
      y: Math.sin(angle + holdProgress * Math.PI) * dist,
      size: 3 + Math.sin(holdProgress * Math.PI * 4 + i * 0.7) * 2,
      opacity: holdProgress > 0 ? 0.3 + Math.sin(holdProgress * Math.PI * 5 + i) * 0.3 : 0,
    }
  })

  // Text reveal stagger
  const getTextDelay = (idx: number): number => {
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25 - idx * 0.08) / 0.3)))
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: '5%',
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: '80%',
          height: '80%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}08 0%, transparent 60%)`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(16px, 2.5vw, 24px)',
          padding: 'clamp(24px, 5%, 44px)',
          maxWidth: 400,
          width: '100%',
          opacity: exitOpacity,
          transform: `scale(${cardScale}) translateY(${exitEased * -50}px)`,
          boxShadow: `0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 ${accentColor}15`,
          border: `1px solid ${accentColor}15`,
          textAlign: 'center',
        }}
      >
        {/* Award medal/badge */}
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: 'clamp(16px, 3vh, 28px)',
          }}
        >
          <div
            style={{
              width: 'clamp(60px, 12vw, 90px)',
              height: 'clamp(60px, 12vw, 90px)',
              borderRadius: '50%',
              background: `conic-gradient(from ${badgeRotation + holdShimmer}deg, ${accentColor}, #FFD700, ${accentColor}, #FFD700, ${accentColor})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentColor}40`,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '70%',
                height: '70%',
                borderRadius: '50%',
                background: cardColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(10px, 1.8vw, 14px)',
                fontWeight: 900,
                color: accentColor,
                letterSpacing: 1,
              }}
            >
              {year}
            </div>
          </div>
          {/* Sparkle particles around badge */}
          {sparkles.map((sp, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: sp.size,
                height: sp.size,
                borderRadius: '50%',
                background: i % 2 === 0 ? accentColor : '#FFD700',
                transform: `translate(calc(-50% + ${sp.x}px), calc(-50% + ${sp.y}px))`,
                opacity: sp.opacity,
              }}
            />
          ))}
        </div>

        {/* Organization name */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.3vw, 12px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 'clamp(6px, 1vh, 12px)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            opacity: getTextDelay(0),
          }}
        >
          {organization}
        </div>

        {/* Award title */}
        <div
          style={{
            fontSize: 'clamp(20px, 4vw, 32px)',
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.2,
            marginBottom: 'clamp(6px, 1vh, 10px)',
            opacity: getTextDelay(1),
          }}
        >
          {awardTitle}
        </div>

        {/* Category */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 400,
            color: `${textColor}70`,
            fontStyle: 'italic',
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            opacity: getTextDelay(2),
          }}
        >
          {category}
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 60,
            height: 2,
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            margin: '0 auto',
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            transform: `scaleX(${getTextDelay(3)})`,
          }}
        />

        {/* Presented to */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            fontWeight: 500,
            color: `${textColor}50`,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            marginBottom: 'clamp(4px, 0.6vh, 8px)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: getTextDelay(4),
          }}
        >
          Presented to
        </div>

        {/* Recipient name */}
        <div
          style={{
            fontSize: 'clamp(18px, 3.5vw, 28px)',
            fontWeight: 700,
            color: textColor,
            fontStyle: 'italic',
            opacity: getTextDelay(5),
          }}
        >
          {recipient}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-photo-award',
  title: 'Scene Photo Award',
  description: 'Photography award certificate card with rotating medal badge, sparkle particles, and staggered text reveal',
  tags: ['scene', 'photography', 'award', 'certificate', 'achievement', 'recognition'],
  category: 'scenes',
  component: ScenePhotoAwardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    awardTitle: 'Best in Show',
    category: 'Landscape Photography',
    recipient: 'Elena Martinez',
    year: '2026',
    organization: 'International Photo Awards',
    bgColor: '#0F0D14',
    cardColor: '#1A1722',
    accentColor: '#D4A853',
    textColor: '#EDE8F0',
  },
  configSchema: [
    { key: 'awardTitle', label: 'Award Title', type: 'text', defaultValue: 'Best in Show', group: 'Content' },
    { key: 'category', label: 'Category', type: 'text', defaultValue: 'Landscape Photography', group: 'Content' },
    { key: 'recipient', label: 'Recipient', type: 'text', defaultValue: 'Elena Martinez', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '2026', group: 'Content' },
    { key: 'organization', label: 'Organization', type: 'text', defaultValue: 'International Photo Awards', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0D14', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1722', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4A853', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#EDE8F0', group: 'Style' },
  ],
})
