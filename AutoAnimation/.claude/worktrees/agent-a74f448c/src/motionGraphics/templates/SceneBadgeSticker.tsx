import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBadgeStickerConfig {
  badgeText: string
  badgeShape: 'circle' | 'star' | 'shield'
  badgeColor: string
  textColor: string
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function bounceOut(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

function SceneBadgeStickerComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneBadgeStickerConfig>) {
  const { badgeText, badgeShape, badgeColor, textColor, position, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const badgeSize = 90

  // Position mapping
  const isTop = position.startsWith('top')
  const isRight = position.endsWith('right')
  const targetX = isRight ? 0 : 0
  const targetY = 0

  // Enter: fly in from edge with rotation and bounce
  const flyInX = isRight ? 200 : -200
  const flyInY = isTop ? -200 : 200
  const enterEased = bounceOut(enterProgress)
  const x = enterProgress < 1
    ? flyInX * (1 - enterEased)
    : exitProgress > 0
      ? (isRight ? 300 : -300) * easeInCubic(exitProgress)
      : targetX

  const y = enterProgress < 1
    ? flyInY * (1 - enterEased)
    : exitProgress > 0
      ? (isTop ? -300 : 300) * easeInCubic(exitProgress)
      : targetY

  // Rotation
  const enterRotation = enterProgress < 1
    ? 360 * (1 - enterEased)
    : 0
  const exitRotation = exitProgress > 0
    ? -180 * easeInCubic(exitProgress)
    : 0

  // Hold wiggle
  const wiggle = holdProgress > 0
    ? Math.sin(holdProgress * Math.PI * 8) * 5
    : 0

  const rotation = enterRotation + exitRotation + wiggle

  const opacity = enterProgress < 1
    ? Math.min(1, enterProgress * 3)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  const scale = enterProgress < 1
    ? enterEased
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.5
      : 1

  const posStyle: React.CSSProperties = {
    position: 'absolute',
  }
  if (isTop) posStyle.top = 30
  else posStyle.bottom = 30
  if (isRight) posStyle.right = 30
  else posStyle.left = 30

  // Star clip path
  const starPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
  // Shield clip path
  const shieldPath = 'polygon(50% 100%, 5% 70%, 5% 0%, 95% 0%, 95% 70%)'

  const shapeStyle: React.CSSProperties = {
    width: badgeSize,
    height: badgeSize,
    background: badgeColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
  }

  if (badgeShape === 'circle') {
    shapeStyle.borderRadius = '50%'
  } else if (badgeShape === 'star') {
    shapeStyle.clipPath = starPath
  } else {
    shapeStyle.clipPath = shieldPath
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {bgColor !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      )}

      <div
        style={{
          ...posStyle,
          transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
          opacity,
        }}
      >
        <div style={shapeStyle}>
          <span
            style={{
              color: textColor,
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: badgeShape === 'star' ? 14 : 16,
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}
          >
            {badgeText}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-badge-sticker',
  title: 'Scene Badge Sticker',
  description: 'Animated sticker/badge overlay with fly-in rotation, bounce landing, and wiggle hold',
  tags: ['scene', 'badge', 'sticker', 'overlay', 'decoration'],
  category: 'scene-layout',
  component: SceneBadgeStickerComponent as any,
  defaultConfig: {
    badgeText: 'NEW!',
    badgeShape: 'circle',
    badgeColor: '#FF3333',
    textColor: '#ffffff',
    position: 'top-right',
    bgColor: 'transparent',
  },
  configSchema: [
    { key: 'badgeText', label: 'Badge Text', type: 'text', defaultValue: 'NEW!', group: 'Content' },
    { key: 'badgeShape', label: 'Badge Shape', type: 'select', defaultValue: 'circle', options: ['circle', 'star', 'shield'], group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#FF3333', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'position', label: 'Position', type: 'select', defaultValue: 'top-right', options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'], group: 'Layout' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
