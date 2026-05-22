import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneNotificationBellConfig {
  notificationText: string
  count: number
  bellColor: string
  badgeColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneNotificationBellComponent({ config, progress }: MotionGraphicProps<SceneNotificationBellConfig>) {
  const { notificationText, count, bellColor, badgeColor, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Background
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Bell swings in with damped pendulum physics
  const bellEnter = Math.min(1, enterProgress / 0.6)
  const dampedSwing = bellEnter < 1
    ? Math.sin(bellEnter * Math.PI * 4) * 30 * Math.pow(1 - bellEnter, 1.5)
    : 0
  const bellScale = bellEnter < 1
    ? easeOutCubic(bellEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const bellOpacity = bellEnter < 1
    ? easeOutCubic(bellEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Exit: bell swings away
  const exitSwing = exitProgress > 0
    ? Math.sin(exitProgress * Math.PI * 3) * 40 * exitProgress
    : 0

  // Occasional ring during hold (burst every ~2 seconds)
  const holdRing = isHolding
    ? Math.sin(holdProgress * Math.PI * 16) * 12 * Math.max(0, Math.sin(holdProgress * Math.PI * 4))
    : 0
  const totalRotation = dampedSwing + exitSwing + holdRing

  // Badge pops in with overshoot after bell
  const badgeDelay = 0.5
  const badgeEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - badgeDelay) / (1 - badgeDelay))
    : 1
  const badgeScale = badgeEnter < 1
    ? easeOutBack(badgeEnter) * 1.2
    : exitProgress > 0
      ? (1 - easeInCubic(exitProgress)) * 1.0
      : 1.0
  const badgeOpacity = badgeEnter < 1
    ? easeOutCubic(badgeEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Badge number increments during hold
  const displayCount = isHolding
    ? Math.min(count, Math.floor(holdProgress * count * 1.5) + 1)
    : exitProgress > 0
      ? count
      : badgeEnter >= 1
        ? 1
        : 0

  // Text slides in
  const textDelay = 0.6
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textY = textEnter < 1
    ? 30 * (1 - easeOutCubic(textEnter))
    : exitProgress > 0
      ? 30 * easeInCubic(exitProgress)
      : 0
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

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
        gap: 'clamp(24px, 6vw, 48px)',
      }}>
        {/* Bell + Badge container */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Bell */}
          <div style={{
            fontSize: 'clamp(72px, 20vw, 160px)',
            lineHeight: 1,
            transform: `scale(${bellScale}) rotate(${totalRotation}deg)`,
            opacity: bellOpacity,
            transformOrigin: 'top center',
            filter: `drop-shadow(0 4px 20px ${bellColor}40)`,
          }}>
            {'\uD83D\uDD14'}
          </div>

          {/* Notification badge */}
          {displayCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '5%', right: '-5%',
              background: badgeColor,
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(14px, 4vw, 28px)',
              fontWeight: 800,
              minWidth: 'clamp(24px, 6vw, 44px)',
              height: 'clamp(24px, 6vw, 44px)',
              borderRadius: '50%',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              transform: `scale(${badgeScale})`,
              opacity: badgeOpacity,
              boxShadow: `0 2px 12px ${badgeColor}80`,
            }}>
              {displayCount}
            </div>
          )}
        </div>

        {/* Text */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(18px, 4.5vw, 40px)',
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '85%',
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}>
          {notificationText}
        </div>

        {/* Subtitle hint */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(11px, 2.5vw, 18px)',
          color: '#ffffff50',
          fontWeight: 500,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity * 0.7,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Never miss an update
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-notification-bell',
  title: 'Notification Bell',
  description: 'Bell notification animation with pendulum physics, popping badge counter, and periodic ring effect',
  tags: ['scene', 'social', 'cta', 'notification', 'bell', 'alert', 'engagement'],
  category: 'scene-layout',
  component: SceneNotificationBellComponent as any,
  defaultConfig: {
    notificationText: 'Turn on notifications!',
    count: 99,
    bellColor: '#FBBF24',
    badgeColor: '#EF4444',
    bgColor: '#0a0a1a',
  },
  configSchema: [
    { key: 'notificationText', label: 'Text', type: 'text', defaultValue: 'Turn on notifications!', group: 'Content' },
    { key: 'count', label: 'Badge Count', type: 'number', defaultValue: 99, min: 1, max: 999, group: 'Content' },
    { key: 'bellColor', label: 'Bell Color', type: 'color', defaultValue: '#FBBF24', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
  ],
})
