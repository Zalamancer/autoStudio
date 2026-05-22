import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnnouncementBannerConfig {
  headerText: string
  announcementText: string
  headerColor: string
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

function easeInCubic(t: number): number {
  return t * t * t
}

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneAnnouncementBannerComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<AnnouncementBannerConfig>) {
  const { headerText, announcementText, headerColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header slams in from top
  const headerY = easeOutBack(Math.min(1, enterProgress / 0.4)) * 1
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const headerSlideY = (1 - easeOutBack(Math.min(1, enterProgress / 0.4))) * -80

  // Announcement text slides in
  const announcementOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.35)))
  const announcementY = (1 - easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.35)))) * 40

  // Confetti dots (16 particles)
  const dotCount = 16
  const dots = Array.from({ length: dotCount }).map((_, i) => {
    const seed = i * 7 + 3
    const startX = seededRandom(seed) * 100
    const startY = seededRandom(seed + 1) * 100
    const size = 4 + seededRandom(seed + 2) * 8
    const dotEnterDelay = 0.5 + seededRandom(seed + 3) * 0.4
    const dotOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - dotEnterDelay) / 0.3)))
    const hue = seededRandom(seed + 4) * 360

    // Drift during hold
    const driftX = Math.sin(holdProgress * Math.PI * 2 + i) * 3
    const driftY = Math.cos(holdProgress * Math.PI * 1.5 + i * 0.7) * 4

    return {
      x: startX + driftX,
      y: startY + driftY,
      size,
      opacity: dotOpacity,
      color: `hsl(${hue}, 70%, 65%)`,
      rotation: holdProgress * 360 * (i % 2 === 0 ? 1 : -1),
    }
  })

  // Exit: everything slides up
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * -150
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Confetti dots */}
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
            background: dot.color,
            opacity: dot.opacity * 0.6 * exitOpacity,
            transform: `rotate(${dot.rotation}deg)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          transform: `translateY(${exitY}px)`,
          opacity: exitOpacity,
          gap: 'clamp(16px, 3vh, 32px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 'clamp(16px, 3vw, 28px)',
            fontWeight: 800,
            color: headerColor,
            opacity: headerOpacity,
            transform: `translateY(${headerSlideY}px)`,
            letterSpacing: 4,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {headerText}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3))) * 120}px`,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${headerColor}, transparent)`,
            borderRadius: 2,
          }}
        />

        {/* Announcement text */}
        <div
          style={{
            fontSize: 'clamp(22px, 5vw, 52px)',
            fontWeight: 900,
            color: textColor,
            opacity: announcementOpacity,
            transform: `translateY(${announcementY}px)`,
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '90%',
          }}
        >
          {announcementText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-announcement-banner',
  title: 'Scene Announcement Banner',
  description:
    'Big announcement banner with header slam-in, confetti dots, and text slide-in animations',
  tags: ['scene', 'brand', 'announcement', 'banner', 'launch', 'business'],
  category: 'scene-layout',
  component: SceneAnnouncementBannerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'headerText', label: 'Header Text', type: 'text', defaultValue: '\uD83C\uDF89 ANNOUNCING', group: 'Content' },
    { key: 'announcementText', label: 'Announcement', type: 'text', defaultValue: 'Our biggest update ever', group: 'Content' },
    { key: 'headerColor', label: 'Header Color', type: 'color', defaultValue: '#D4A853', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0A2E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    headerText: '\uD83C\uDF89 ANNOUNCING',
    announcementText: 'Our biggest update ever',
    headerColor: '#D4A853',
    bgColor: '#1A0A2E',
    textColor: '#FFFFFF',
  },
})
