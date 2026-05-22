import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFollowMeConfig {
  username: string
  followText: string
  accentColor: string
  bgColor: string
  cardColor: string
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

function SceneFollowMeComponent({ config, progress }: MotionGraphicProps<SceneFollowMeConfig>) {
  const { username, followText, accentColor, bgColor, cardColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Card slides in from bottom with bounce
  const cardEnter = Math.min(1, enterProgress / 0.6)
  const cardY = cardEnter < 1
    ? 400 * (1 - bounceEase(cardEnter))
    : exitProgress > 0
      ? 400 * easeInCubic(exitProgress)
      : 0
  const cardOpacity = cardEnter < 1
    ? easeOutCubic(cardEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Follow button pulse during hold
  const btnPulse = isHolding
    ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.05
    : 1
  const btnGlow = isHolding
    ? 8 + Math.sin(holdProgress * Math.PI * 8) * 8
    : 8

  // Counter ticks up during hold
  const counterValue = isHolding
    ? Math.floor(holdProgress * 47) + 1
    : exitProgress > 0
      ? 48
      : 0

  // +1 popup
  const showCounter = isHolding || exitProgress > 0
  const counterPhase = isHolding ? (holdProgress * 12) % 1 : 1
  const counterY = -20 * counterPhase
  const counterOpacity = counterPhase < 0.8 ? 1 : 1 - (counterPhase - 0.8) / 0.2

  // Background
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
        padding: '8%',
      }}>
        {/* Profile card */}
        <div style={{
          background: cardColor,
          borderRadius: '24px',
          padding: 'clamp(24px, 6vw, 48px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 3.5vw, 28px)',
          transform: `translateY(${cardY}px)`,
          opacity: cardOpacity,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          width: '80%', maxWidth: '420px',
          position: 'relative',
        }}>
          {/* Avatar placeholder - gradient circle */}
          <div style={{
            width: 'clamp(64px, 16vw, 110px)',
            height: 'clamp(64px, 16vw, 110px)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80, #FF6B9D)`,
            boxShadow: `0 4px 20px ${accentColor}40`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: 'clamp(28px, 7vw, 48px)',
          }}>
            {'\uD83D\uDE0E'}
          </div>

          {/* Username */}
          <div style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(18px, 4.5vw, 32px)',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}>
            {username}
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: 'clamp(20px, 5vw, 40px)',
          }}>
            {[
              { label: 'Posts', value: '142' },
              { label: 'Followers', value: '12.4K' },
              { label: 'Following', value: '891' },
            ].map((stat, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '2px',
              }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(14px, 3.5vw, 22px)',
                  fontWeight: 800,
                  color: '#ffffff',
                }}>
                  {stat.value}
                </span>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 500,
                  color: '#ffffff80',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Follow button */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: accentColor,
              color: '#ffffff',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(14px, 3.5vw, 24px)',
              fontWeight: 700,
              padding: '0.6em 3em',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transform: `scale(${btnPulse})`,
              boxShadow: `0 0 ${btnGlow}px ${accentColor}80, 0 4px 16px rgba(0,0,0,0.3)`,
            }}>
              {followText}
            </div>

            {/* +1 counter popup */}
            {showCounter && (
              <div style={{
                position: 'absolute',
                right: '-20px', top: '-10px',
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(12px, 3vw, 20px)',
                fontWeight: 800,
                color: '#4ADE80',
                transform: `translateY(${counterY}px)`,
                opacity: isHolding ? counterOpacity : 0,
              }}>
                +{counterValue}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-follow-me',
  title: 'Follow Me',
  description: 'Profile card with avatar, stats, and pulsing follow button with animated follower counter',
  tags: ['scene', 'social', 'cta', 'follow', 'profile', 'engagement'],
  category: 'scene-layout',
  component: SceneFollowMeComponent as any,
  defaultConfig: {
    username: '@creator',
    followText: 'Follow',
    accentColor: '#3B82F6',
    bgColor: '#0a0a1a',
    cardColor: '#1a1a2e',
  },
  configSchema: [
    { key: 'username', label: 'Username', type: 'text', defaultValue: '@creator', group: 'Content' },
    { key: 'followText', label: 'Follow Button Text', type: 'text', defaultValue: 'Follow', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
  ],
})
