import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLikeSubscribeConfig {
  likeText: string
  subscribeText: string
  bellText: string
  primaryColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneLikeSubscribeComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneLikeSubscribeConfig>) {
  const { likeText, subscribeText, bellText, primaryColor, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Thumbs up bounces in from left
  const thumbEnter = Math.min(1, enterProgress / 0.6)
  const thumbX = thumbEnter < 1
    ? -200 * (1 - bounceEase(thumbEnter))
    : exitProgress > 0
      ? -300 * easeInCubic(exitProgress)
      : 0
  const thumbScale = thumbEnter < 1
    ? bounceEase(thumbEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const thumbOpacity = thumbEnter < 1
    ? easeOutCubic(thumbEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Wiggle during hold
  const wiggleAngle = isHolding
    ? Math.sin(holdProgress * Math.PI * 12) * 8
    : 0

  // Subscribe button slides in from right
  const btnDelay = 0.3
  const btnEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - btnDelay) / (1 - btnDelay))
    : 1
  const btnX = btnEnter < 1
    ? 300 * (1 - easeOutCubic(btnEnter))
    : exitProgress > 0
      ? 300 * easeInCubic(exitProgress)
      : 0
  const btnOpacity = btnEnter < 1
    ? easeOutCubic(btnEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Pulse glow on subscribe during hold
  const pulseScale = isHolding
    ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.04
    : 1
  const pulseGlow = isHolding
    ? 10 + Math.sin(holdProgress * Math.PI * 8) * 8
    : 10

  // Bell shakes periodically during hold
  const bellDelay = 0.55
  const bellEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - bellDelay) / (1 - bellDelay))
    : 1
  const bellScale = bellEnter < 1
    ? easeOutBack(bellEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const bellOpacity = bellEnter < 1
    ? easeOutCubic(bellEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  // Shake every ~1.5 seconds during hold
  const bellShake = isHolding
    ? Math.sin(holdProgress * Math.PI * 20) * 15 * Math.max(0, Math.sin(holdProgress * Math.PI * 4))
    : 0

  // Background fade
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
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
        gap: 'clamp(16px, 4vw, 40px)',
        padding: '8%',
      }}>
        {/* Thumbs up + text */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(12px, 3vw, 28px)',
          transform: `translateX(${thumbX}px) scale(${thumbScale}) rotate(${wiggleAngle}deg)`,
          opacity: thumbOpacity,
        }}>
          <span style={{ fontSize: 'clamp(48px, 10vw, 96px)', lineHeight: 1 }}>
            {'\uD83D\uDC4D'}
          </span>
          <span style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(20px, 5vw, 44px)',
            fontWeight: 800,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            {likeText}
          </span>
        </div>

        {/* Subscribe button */}
        <div style={{
          transform: `translateX(${btnX}px) scale(${pulseScale})`,
          opacity: btnOpacity,
          background: primaryColor,
          color: '#ffffff',
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(16px, 4vw, 36px)',
          fontWeight: 700,
          padding: '0.6em 2.5em',
          borderRadius: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          boxShadow: `0 0 ${pulseGlow}px ${primaryColor}90, 0 4px 20px rgba(0,0,0,0.4)`,
        }}>
          {subscribeText}
        </div>

        {/* Bell */}
        <div style={{
          transform: `scale(${bellScale}) rotate(${bellShake}deg)`,
          opacity: bellOpacity,
          display: 'flex', alignItems: 'center',
          gap: 'clamp(8px, 2vw, 16px)',
        }}>
          <span style={{ fontSize: 'clamp(32px, 7vw, 64px)', lineHeight: 1 }}>
            {'\uD83D\uDD14'}
          </span>
          <span style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 600,
            color: '#ffffffcc',
          }}>
            {bellText}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-like-subscribe',
  title: 'Like & Subscribe',
  description: 'Classic YouTube-style Like & Subscribe CTA with bouncing thumbs up, pulsing subscribe button, and shaking bell',
  tags: ['scene', 'social', 'cta', 'youtube', 'subscribe', 'like', 'engagement'],
  category: 'scene-layout',
  component: SceneLikeSubscribeComponent as any,
  defaultConfig: {
    likeText: 'LIKE',
    subscribeText: 'SUBSCRIBE',
    bellText: 'Turn on notifications!',
    primaryColor: '#FF0000',
    bgColor: '#0a0a14',
  },
  configSchema: [
    { key: 'likeText', label: 'Like Text', type: 'text', defaultValue: 'LIKE', group: 'Content' },
    { key: 'subscribeText', label: 'Subscribe Text', type: 'text', defaultValue: 'SUBSCRIBE', group: 'Content' },
    { key: 'bellText', label: 'Bell Text', type: 'text', defaultValue: 'Turn on notifications!', group: 'Content' },
    { key: 'primaryColor', label: 'Primary Color', type: 'color', defaultValue: '#FF0000', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
  ],
})
