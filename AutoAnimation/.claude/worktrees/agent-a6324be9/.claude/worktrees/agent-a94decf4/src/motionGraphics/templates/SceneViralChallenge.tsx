import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ViralChallengeConfig {
  challengeName: string
  hashtag: string
  participants: number
  rules: string[]
  bgColor: string
  accentColor: string
  cardColor: string
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

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function SceneViralChallengeComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ViralChallengeConfig>) {
  const { challengeName, hashtag, participants, rules, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Fire emoji pops
  const firePop = easeOutBack(Math.min(1, enterProgress / 0.2))

  // Challenge name slams in
  const nameSlam = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Hashtag reveals
  const hashtagReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.25)))

  // Participant counter
  const countProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.35)))
  const displayCount = formatCount(Math.round(countProgress * participants))

  // Rules stagger
  const getRuleProgress = (idx: number): number => {
    const delay = 0.55 + idx * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.2)))
  }

  // CTA
  const ctaProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Hold: fire scale pulses
  const firePulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.15

  // Hold: participant count incrementing
  const holdCount = holdProgress > 0
    ? participants + Math.floor(holdProgress * participants * 0.05)
    : Math.round(countProgress * participants)

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  // Background floating emojis
  const bgEmojis = Array.from({ length: 10 }).map((_, i) => {
    const x = seededRand(i * 31 + 7) * 100
    const speed = 0.3 + seededRand(i * 53) * 0.7
    const y = ((frame * speed + seededRand(i * 67) * 200) % 130) - 15
    const emojis = ['🔥', '🏆', '💪', '⚡', '🎯', '🌟']
    const emoji = emojis[i % emojis.length]
    const size = 14 + seededRand(i * 19) * 10
    return { x, y, emoji, size, opacity: 0.15 + seededRand(i * 41) * 0.15 }
  })

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      {/* Floating emojis */}
      {bgEmojis.map((e, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${e.x}%`,
            top: `${e.y}%`,
            fontSize: e.size,
            opacity: e.opacity * exitOpacity,
          }}
        >
          {e.emoji}
        </div>
      ))}

      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '50%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`,
          top: '15%',
          left: '15%',
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 420,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Fire icon */}
        <div
          style={{
            fontSize: 'clamp(36px, 8vw, 60px)',
            transform: `scale(${firePop * firePulse})`,
            filter: `drop-shadow(0 0 15px ${accentColor}60)`,
          }}
        >
          {'🔥'}
        </div>

        {/* VIRAL CHALLENGE label */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.4vw, 11px)',
            fontWeight: 800,
            color: accentColor,
            letterSpacing: 5,
            textTransform: 'uppercase',
            opacity: firePop,
          }}
        >
          VIRAL CHALLENGE
        </div>

        {/* Challenge name */}
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 38px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.2,
            transform: `scale(${nameSlam})`,
          }}
        >
          {challengeName}
        </div>

        {/* Hashtag */}
        <div
          style={{
            background: `${accentColor}15`,
            borderRadius: 20,
            padding: 'clamp(6px, 1vh, 10px) clamp(14px, 2.5vw, 22px)',
            fontSize: 'clamp(14px, 2.5vw, 19px)',
            fontWeight: 800,
            color: accentColor,
            opacity: hashtagReveal,
            transform: `translateY(${(1 - hashtagReveal) * 10}px)`,
          }}
        >
          #{hashtag}
        </div>

        {/* Participant count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: countProgress,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(20px, 4vw, 30px)',
              fontWeight: 900,
              color: textColor,
            }}
          >
            {formatCount(holdCount)}
          </span>
          <span
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 500,
              color: `${textColor}60`,
            }}
          >
            participants
          </span>
        </div>

        {/* Rules card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(14px, 2vw, 18px)',
            padding: 'clamp(14px, 2.5vh, 22px)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.2vh, 12px)',
            border: `1px solid ${textColor}08`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 12px)',
              fontWeight: 700,
              color: `${textColor}50`,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            CHALLENGE RULES
          </div>
          {rules.map((rule, i) => {
            const rp = getRuleProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 12px)',
                  opacity: rp,
                  transform: `translateX(${(1 - rp) * 15}px)`,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: `${accentColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: accentColor,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 14px)',
                    fontWeight: 600,
                    color: `${textColor}CC`,
                  }}
                >
                  {rule}
                </span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
            borderRadius: 'clamp(10px, 1.5vw, 14px)',
            padding: 'clamp(12px, 2vh, 16px) clamp(28px, 5vw, 44px)',
            fontSize: 'clamp(12px, 2vw, 15px)',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: 2,
            textTransform: 'uppercase',
            transform: `scale(${ctaProgress})`,
            boxShadow: `0 4px 20px ${accentColor}40`,
            textAlign: 'center',
          }}
        >
          JOIN NOW
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-viral-challenge',
  title: 'Scene Viral Challenge',
  description:
    'Viral challenge participation card with fire effects, participant counter, hashtag badge, numbered rules, and join CTA.',
  tags: ['scene', 'social-media', 'challenge', 'viral', 'tiktok', 'participation', 'creator', 'trending'],
  category: 'scene-layout',
  component: SceneViralChallengeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'challengeName', label: 'Challenge Name', type: 'text', defaultValue: 'Ice Bucket Challenge', group: 'Content' },
    { key: 'hashtag', label: 'Hashtag', type: 'text', defaultValue: 'IceBucketChallenge', group: 'Content' },
    { key: 'participants', label: 'Participants', type: 'number', defaultValue: 250000, min: 0, max: 100000000, group: 'Content' },
    { key: 'rules', label: 'Rules', type: 'text-array', defaultValue: ['Film your attempt', 'Tag 3 friends', 'Use the hashtag', 'Post within 24hrs'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F97316', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    challengeName: 'Ice Bucket Challenge',
    hashtag: 'IceBucketChallenge',
    participants: 250000,
    rules: ['Film your attempt', 'Tag 3 friends', 'Use the hashtag', 'Post within 24hrs'],
    accentColor: '#F97316',
    cardColor: '#1A1A2E',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
