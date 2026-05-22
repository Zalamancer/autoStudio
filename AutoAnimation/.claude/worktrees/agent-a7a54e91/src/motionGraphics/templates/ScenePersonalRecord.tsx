import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePersonalRecordConfig {
  exerciseName: string
  newRecord: string
  previousRecord: string
  improvement: string
  bgColor: string
  textColor: string
  goldColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function ScenePersonalRecordComponent({ config, progress }: MotionGraphicProps<ScenePersonalRecordConfig>) {
  const { exerciseName, newRecord, previousRecord, improvement, bgColor, textColor, goldColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.2 : 1

  // Trophy drops from top
  const trophyEnter = easeOutBack(Math.min(1, enterProgress / 0.3))
  const trophyY = (1 - trophyEnter) * -80

  // "NEW PR!" slams in
  const prLabelEnter = easeOutElastic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))

  // Exercise name
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Record value slams in
  const recordEnter = easeOutElastic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4)))

  // Previous record & improvement
  const prevEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))
  const improvEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.25)))

  // Hold celebration effects
  const isHolding = progress >= 0.25 && progress < 0.8
  const celebPulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04 : 1
  const glowIntensity = isHolding ? 20 + Math.sin(holdProgress * Math.PI * 4) * 10 : 20

  // Sparkle particles during hold
  const sparkles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 + holdProgress * Math.PI * 2
    const dist = 80 + Math.sin(holdProgress * Math.PI * 3 + i) * 30
    const x = Math.cos(angle) * dist
    const y = Math.sin(angle) * dist
    const sparkleOpacity = isHolding ? 0.3 + Math.sin(holdProgress * Math.PI * 8 + i * 1.5) * 0.3 : 0
    const size = 3 + Math.sin(holdProgress * Math.PI * 6 + i) * 2
    return { x, y, opacity: sparkleOpacity, size }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Gold radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '80%',
          height: '60%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${goldColor}10, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 8%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Trophy */}
        <div
          style={{
            position: 'relative',
            fontSize: 'clamp(40px, 10vw, 80px)',
            opacity: trophyEnter,
            transform: `translateY(${trophyY}px) scale(${celebPulse})`,
            filter: `drop-shadow(0 0 ${glowIntensity}px ${goldColor}60)`,
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
          }}
        >
          {'\u{1F3C6}'}

          {/* Sparkles */}
          {sparkles.map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${s.size}px`,
                height: `${s.size}px`,
                borderRadius: '50%',
                background: goldColor,
                opacity: s.opacity,
                transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px))`,
                boxShadow: `0 0 4px ${goldColor}`,
              }}
            />
          ))}
        </div>

        {/* NEW PR! label */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 48px)',
            fontWeight: 900,
            color: goldColor,
            letterSpacing: '0.08em',
            textShadow: `0 0 20px ${goldColor}40`,
            opacity: prLabelEnter,
            transform: `scale(${prLabelEnter})`,
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
          }}
        >
          NEW PR!
        </div>

        {/* Exercise name */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.2vw, 20px)',
            fontWeight: 600,
            color: `${textColor}88`,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * 10}px)`,
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
          }}
        >
          {exerciseName}
        </div>

        {/* New record value */}
        <div
          style={{
            fontSize: 'clamp(48px, 12vw, 96px)',
            fontWeight: 900,
            color: textColor,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            opacity: recordEnter,
            transform: `scale(${recordEnter * celebPulse})`,
            textShadow: `0 0 30px ${accentColor}30`,
          }}
        >
          {newRecord}
        </div>

        {/* Previous record - crossed out */}
        <div
          style={{
            fontSize: 'clamp(16px, 3vw, 26px)',
            fontWeight: 600,
            color: `${textColor}44`,
            textDecoration: 'line-through',
            textDecorationColor: `${textColor}66`,
            marginTop: 'clamp(8px, 1.5vw, 16px)',
            opacity: prevEnter,
            transform: `translateY(${(1 - prevEnter) * 10}px)`,
          }}
        >
          Previous: {previousRecord}
        </div>

        {/* Improvement badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}40`,
            borderRadius: '100px',
            padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2vw, 20px)',
            marginTop: 'clamp(12px, 2.5vw, 20px)',
            opacity: improvEnter,
            transform: `scale(${improvEnter})`,
          }}
        >
          <span style={{ fontSize: 'clamp(12px, 2vw, 16px)', color: accentColor }}>
            {'\u2191'}
          </span>
          <span
            style={{
              fontSize: 'clamp(13px, 2.2vw, 18px)',
              fontWeight: 800,
              color: accentColor,
            }}
          >
            {improvement}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-personal-record',
  title: 'Personal Record',
  description: 'PR celebration with trophy, slamming record value, crossed-out previous record, and improvement badge with sparkle effects',
  tags: ['scene', 'fitness', 'PR', 'personal-record', 'achievement', 'celebration', 'gym'],
  category: 'scene-layout',
  component: ScenePersonalRecordComponent as any,
  defaultConfig: {
    exerciseName: 'Deadlift',
    newRecord: '405 lbs',
    previousRecord: '385 lbs',
    improvement: '+5.2%',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    goldColor: '#fbbf24',
    accentColor: '#22c55e',
  },
  configSchema: [
    { key: 'exerciseName', label: 'Exercise Name', type: 'text', defaultValue: 'Deadlift', group: 'Content' },
    { key: 'newRecord', label: 'New Record', type: 'text', defaultValue: '405 lbs', group: 'Content' },
    { key: 'previousRecord', label: 'Previous Record', type: 'text', defaultValue: '385 lbs', group: 'Content' },
    { key: 'improvement', label: 'Improvement', type: 'text', defaultValue: '+5.2%', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'goldColor', label: 'Gold Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
})
