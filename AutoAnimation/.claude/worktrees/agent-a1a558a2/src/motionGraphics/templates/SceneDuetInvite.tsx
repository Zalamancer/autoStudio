import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDuetInviteConfig {
  inviteText: string
  leftLabel: string
  rightLabel: string
  accentColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375
}

function SceneDuetInviteComponent({ config, progress }: MotionGraphicProps<SceneDuetInviteConfig>) {
  const { inviteText, leftLabel, rightLabel, accentColor, bgColor } = config

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

  // Left half slides in from left
  const leftEnter = Math.min(1, enterProgress / 0.5)
  const leftX = leftEnter < 1
    ? -110 * (1 - easeOutCubic(leftEnter))
    : exitProgress > 0
      ? -110 * easeInCubic(exitProgress)
      : 0
  const leftOpacity = leftEnter < 1
    ? easeOutCubic(leftEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Right half slides in from right
  const rightEnter = Math.min(1, enterProgress / 0.5)
  const rightX = rightEnter < 1
    ? 110 * (1 - easeOutCubic(rightEnter))
    : exitProgress > 0
      ? 110 * easeInCubic(exitProgress)
      : 0
  const rightOpacity = rightEnter < 1
    ? easeOutCubic(rightEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Plus icon pops in with bounce
  const plusDelay = 0.45
  const plusEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - plusDelay) / (1 - plusDelay))
    : 1
  const plusScale = plusEnter < 1
    ? bounceEase(plusEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const plusOpacity = plusEnter < 1
    ? easeOutCubic(plusEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Plus pulses during hold
  const plusPulse = isHolding
    ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.1
    : 1

  // Divider glow during hold
  const dividerGlow = isHolding
    ? 4 + Math.sin(holdProgress * Math.PI * 6) * 6
    : 4

  // Invite text enters from bottom
  const textDelay = 0.6
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textY = textEnter < 1
    ? 40 * (1 - easeOutCubic(textEnter))
    : exitProgress > 0
      ? 40 * easeInCubic(exitProgress)
      : 0
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  const halfStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    gap: 'clamp(10px, 2.5vw, 20px)',
    padding: 'clamp(16px, 4vw, 32px)',
    borderRadius: '16px',
    minHeight: 'clamp(160px, 40vw, 300px)',
  }

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
        padding: '6%',
        gap: 'clamp(20px, 5vw, 40px)',
      }}>
        {/* Split preview container */}
        <div style={{
          display: 'flex',
          gap: 0,
          width: '90%', maxWidth: '700px',
          position: 'relative',
        }}>
          {/* Left half */}
          <div style={{
            ...halfStyle,
            background: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRight: 'none',
            borderTopRightRadius: 0, borderBottomRightRadius: 0,
            transform: `translateX(${leftX}%)`,
            opacity: leftOpacity,
          }}>
            <div style={{
              fontSize: 'clamp(36px, 9vw, 64px)',
              lineHeight: 1,
            }}>
              {'\uD83C\uDFA5'}
            </div>
            <div style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 3vw, 20px)',
              fontWeight: 700,
              color: '#ffffff90',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}>
              {leftLabel}
            </div>
          </div>

          {/* Center divider + plus */}
          <div style={{
            position: 'absolute',
            left: '50%', top: 0, bottom: 0,
            width: '4px',
            transform: 'translateX(-50%)',
            background: accentColor,
            boxShadow: `0 0 ${dividerGlow}px ${accentColor}`,
            zIndex: 2,
            opacity: Math.min(leftOpacity, rightOpacity),
          }} />

          {/* Plus icon */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: `translate(-50%, -50%) scale(${plusScale * plusPulse})`,
            opacity: plusOpacity,
            width: 'clamp(44px, 10vw, 68px)',
            height: 'clamp(44px, 10vw, 68px)',
            borderRadius: '50%',
            background: accentColor,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: 'clamp(24px, 6vw, 40px)',
            fontWeight: 900,
            color: '#ffffff',
            boxShadow: `0 0 ${dividerGlow + 4}px ${accentColor}80`,
            zIndex: 3,
          }}>
            +
          </div>

          {/* Right half */}
          <div style={{
            ...halfStyle,
            background: `${accentColor}12`,
            border: `2px solid ${accentColor}30`,
            borderLeft: 'none',
            borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
            transform: `translateX(${rightX}%)`,
            opacity: rightOpacity,
          }}>
            <div style={{
              fontSize: 'clamp(36px, 9vw, 64px)',
              lineHeight: 1,
            }}>
              {'\uD83C\uDFAC'}
            </div>
            <div style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 3vw, 20px)',
              fontWeight: 700,
              color: '#ffffff90',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}>
              {rightLabel}
            </div>
          </div>
        </div>

        {/* Invite text */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(20px, 5vw, 40px)',
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '85%',
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}>
          {inviteText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-duet-invite',
  title: 'Duet Invite',
  description: 'TikTok-style duet invitation with split screen, glowing divider, and bouncing plus icon',
  tags: ['scene', 'social', 'cta', 'duet', 'tiktok', 'collaboration', 'engagement'],
  category: 'scene-layout',
  component: SceneDuetInviteComponent as any,
  defaultConfig: {
    inviteText: 'Duet this!',
    leftLabel: 'YOUR VIDEO',
    rightLabel: 'DUET WITH ME',
    accentColor: '#2DD4BF',
    bgColor: '#0a0a1a',
  },
  configSchema: [
    { key: 'inviteText', label: 'Invite Text', type: 'text', defaultValue: 'Duet this!', group: 'Content' },
    { key: 'leftLabel', label: 'Left Label', type: 'text', defaultValue: 'YOUR VIDEO', group: 'Content' },
    { key: 'rightLabel', label: 'Right Label', type: 'text', defaultValue: 'DUET WITH ME', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2DD4BF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
  ],
})
