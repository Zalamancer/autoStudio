import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FollowerMilestoneConfig {
  milestone: number
  username: string
  platform: string
  bgColor: string
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

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K'
  return String(n)
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneFollowerMilestoneComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FollowerMilestoneConfig>) {
  const { milestone, username, platform, bgColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Badge scales in
  const badgeScale = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Counter counting up
  const countProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
  const displayCount = formatCount(Math.round(countProgress * milestone))

  // Username slides in
  const nameSlide = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Confetti during hold
  const confetti = Array.from({ length: 20 }).map((_, i) => {
    const x = seededRand(i * 31 + 7) * 100
    const startY = -10
    const speed = 0.5 + seededRand(i * 43 + 3) * 1.5
    const yPos = startY + ((holdProgress * speed * 120 + seededRand(i * 67) * 100) % 120)
    const rot = holdProgress * 360 * (seededRand(i * 89) > 0.5 ? 1 : -1)
    const colors = [accentColor, '#FFD700', '#FF6B9D', '#60A5FA', '#34D399']
    const c = colors[i % colors.length]
    const size = 4 + seededRand(i * 19) * 6
    return { x, y: yPos, rot, color: c, size, opacity: holdProgress > 0 ? 0.7 : 0 }
  })

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  // Hold pulse
  const pulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02

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
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
          top: '20%',
          left: '20%',
          opacity: exitOpacity,
        }}
      />

      {/* Confetti */}
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.size,
            height: c.size * 0.6,
            borderRadius: 2,
            background: c.color,
            transform: `rotate(${c.rot}deg)`,
            opacity: c.opacity * exitOpacity,
          }}
        />
      ))}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 24px)',
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Crown/badge icon */}
        <div
          style={{
            fontSize: 'clamp(32px, 7vw, 64px)',
            transform: `scale(${badgeScale})`,
          }}
        >
          {'🎉'}
        </div>

        {/* Milestone label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          MILESTONE REACHED
        </div>

        {/* Big count number */}
        <div
          style={{
            fontSize: 'clamp(48px, 14vw, 120px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1,
            transform: `scale(${pulse})`,
            textShadow: `0 0 40px ${accentColor}30`,
          }}
        >
          {displayCount}
        </div>

        {/* Followers label */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 600,
            color: `${textColor}90`,
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          FOLLOWERS
        </div>

        {/* Username + platform */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: nameSlide,
            transform: `translateY(${(1 - nameSlide) * 15}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(28px, 5vw, 40px)',
              height: 'clamp(28px, 5vw, 40px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(12px, 2vw, 18px)',
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: textColor }}>
              @{username}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 500, color: `${textColor}60` }}>
              {platform}
            </div>
          </div>
        </div>

        {/* Thank you message */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 15px)',
            fontWeight: 600,
            color: accentColor,
            opacity: nameSlide * (0.7 + Math.sin(holdProgress * Math.PI * 4) * 0.3),
            marginTop: 4,
          }}
        >
          Thank you for the support!
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-follower-milestone',
  title: 'Scene Follower Milestone',
  description:
    'Follower count milestone celebration with counting animation, confetti, radial glow, and gratitude message.',
  tags: ['scene', 'social-media', 'followers', 'milestone', 'celebration', 'creator', 'growth'],
  category: 'scene-layout',
  component: SceneFollowerMilestoneComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'milestone', label: 'Follower Count', type: 'number', defaultValue: 100000, min: 100, max: 100000000, group: 'Content' },
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'creator', group: 'Content' },
    { key: 'platform', label: 'Platform', type: 'text', defaultValue: 'Instagram', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#A855F7', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    milestone: 100000,
    username: 'creator',
    platform: 'Instagram',
    accentColor: '#A855F7',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
