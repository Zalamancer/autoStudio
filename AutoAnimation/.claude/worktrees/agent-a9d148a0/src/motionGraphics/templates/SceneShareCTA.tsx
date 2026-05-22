import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneShareCTAConfig {
  shareText: string
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const AVATARS = [
  { initials: 'JD', color: '#FF6B6B', angle: 0 },
  { initials: 'AK', color: '#4ECDC4', angle: 60 },
  { initials: 'MR', color: '#FFE66D', angle: 120 },
  { initials: 'SL', color: '#A78BFA', angle: 180 },
  { initials: 'TC', color: '#FB923C', angle: 240 },
  { initials: 'RW', color: '#38BDF8', angle: 300 },
]

function SceneShareCTAComponent({ config, progress }: MotionGraphicProps<SceneShareCTAConfig>) {
  const { shareText, accentColor, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Share icon rotates in
  const iconEnter = Math.min(1, enterProgress / 0.5)
  const iconRotation = iconEnter < 1
    ? 360 * (1 - easeOutCubic(iconEnter))
    : exitProgress > 0
      ? -180 * easeInCubic(exitProgress)
      : 0
  const iconScale = iconEnter < 1
    ? easeOutBack(iconEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const iconOpacity = iconEnter < 1
    ? easeOutCubic(iconEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Text fades in after icon
  const textDelay = 0.35
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textY = textEnter < 1
    ? 30 * (1 - easeOutCubic(textEnter))
    : exitProgress > 0
      ? -30 * easeInCubic(exitProgress)
      : 0
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Background
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Avatar scatter radius
  const avatarRadius = 130

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: bgColor,
        opacity: bgOpacity,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        gap: 'clamp(20px, 5vw, 48px)',
      }}>
        {/* Share icon */}
        <div style={{
          fontSize: 'clamp(48px, 12vw, 100px)',
          lineHeight: 1,
          transform: `scale(${iconScale}) rotate(${iconRotation}deg)`,
          opacity: iconOpacity,
          color: accentColor,
          fontWeight: 900,
        }}>
          {'\u2197\uFE0F'}
        </div>

        {/* Text */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(18px, 4.5vw, 40px)',
          fontWeight: 700,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.4,
          maxWidth: '85%',
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}>
          {shareText}
        </div>

        {/* Avatar circles */}
        <div style={{
          position: 'relative',
          width: `${avatarRadius * 2 + 60}px`,
          height: `${avatarRadius * 2 + 60}px`,
        }}>
          {AVATARS.map((avatar, i) => {
            const delay = 0.4 + i * 0.08
            const aEnter = enterProgress < 1
              ? Math.max(0, (enterProgress - delay) / (1 - delay))
              : 1

            // Scatter out from center on enter, converge back on exit
            const dist = aEnter < 1
              ? avatarRadius * easeOutBack(aEnter)
              : exitProgress > 0
                ? avatarRadius * (1 - easeInCubic(exitProgress))
                : avatarRadius

            const rad = ((avatar.angle + (isHolding ? holdProgress * 30 : 0)) * Math.PI) / 180
            const ax = Math.cos(rad) * dist
            const ay = Math.sin(rad) * dist

            // Gentle floating during hold
            const floatX = isHolding ? Math.sin(holdProgress * Math.PI * 4 + i * 1.2) * 6 : 0
            const floatY = isHolding ? Math.cos(holdProgress * Math.PI * 3 + i * 0.8) * 6 : 0

            const aOpacity = aEnter < 1
              ? easeOutCubic(aEnter)
              : exitProgress > 0
                ? 1 - easeInCubic(exitProgress)
                : 1

            const aScale = aEnter < 1
              ? easeOutBack(aEnter)
              : exitProgress > 0
                ? 1 - easeInCubic(exitProgress) * 0.5
                : 1

            return (
              <div key={i} style={{
                position: 'absolute',
                left: '50%', top: '50%',
                width: 'clamp(36px, 8vw, 56px)',
                height: 'clamp(36px, 8vw, 56px)',
                borderRadius: '50%',
                background: avatar.color,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(12px, 3vw, 18px)',
                fontWeight: 700,
                color: '#ffffff',
                transform: `translate(calc(-50% + ${ax + floatX}px), calc(-50% + ${ay + floatY}px)) scale(${aScale})`,
                opacity: aOpacity,
                boxShadow: `0 2px 12px ${avatar.color}40`,
              }}>
                {avatar.initials}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-share-cta',
  title: 'Share CTA',
  description: 'Share call-to-action with rotating share icon, scattered avatar circles, and gentle floating animations',
  tags: ['scene', 'social', 'cta', 'share', 'engagement', 'viral'],
  category: 'scene-layout',
  component: SceneShareCTAComponent as any,
  defaultConfig: {
    shareText: 'Share this with someone who needs to hear this',
    accentColor: '#3B82F6',
    bgColor: '#0a0a1a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'shareText', label: 'Share Text', type: 'text', defaultValue: 'Share this with someone who needs to hear this', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
